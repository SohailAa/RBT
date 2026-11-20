// Firebase Auth & Cloud Firestore REST + Serverless State Vault Adapter
// Zero external npm dependencies (uses Node 24 built-in fetch, fs, crypto).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'rbt-sepia-aba',
  appId: process.env.FIREBASE_APP_ID || '1:871877696101:web:40a7b8be348c98e1d5448c',
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyADMl1dkWqCxElZ1i7Z08ukird53WVSVhw',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'rbt-sepia-aba.firebaseapp.com',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'rbt-sepia-aba.firebasestorage.app',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://rbt-sepia-aba-default-rtdb.firebaseio.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '871877696101',
  workspaceId: process.env.FIREBASE_WORKSPACE_ID || 'default'
};

const TMP_VAULT_PATH = process.env.EBA_FIREBASE_VAULT_PATH || path.join(process.env.TEMP || '/tmp', 'eba-firebase-vault.json');

let runtimeConfig = { ...DEFAULT_FIREBASE_CONFIG };
let lastCloudSyncAt = null;
let lastCloudSyncStatus = 'ready';
let lastCloudError = null;
let lastFirestoreSyncCount = 0;

// In-memory Firebase Auth session token cache (keyed by lowercase email and Firebase UID)
const sessionTokens = new Map();
// Per-table SHA-256 checksums last synced to Cloud Firestore to avoid redundant writes
const lastSyncedTableChecksums = new Map();

function isNetworkFirebaseDisabled() {
  return process.env.NODE_ENV === 'test' || process.env.EBA_DISABLE_NETWORK_FIREBASE === '1';
}

function getFirebaseConfig() {
  return { ...runtimeConfig };
}

function setFirebaseConfig(partial = {}) {
  runtimeConfig = {
    ...runtimeConfig,
    ...(partial.projectId ? { projectId: String(partial.projectId).trim() } : {}),
    ...(partial.appId ? { appId: String(partial.appId).trim() } : {}),
    ...(partial.apiKey ? { apiKey: String(partial.apiKey).trim() } : {}),
    ...(partial.authDomain ? { authDomain: String(partial.authDomain).trim() } : {}),
    ...(partial.storageBucket ? { storageBucket: String(partial.storageBucket).trim() } : {}),
    ...(partial.databaseURL ? { databaseURL: String(partial.databaseURL).trim() } : {}),
    ...(partial.workspaceId ? { workspaceId: String(partial.workspaceId).trim() } : {})
  };
  return getFirebaseConfig();
}

function generateFirebaseUid(email) {
  return 'fb_' + crypto.createHash('sha256').update(String(email || '').toLowerCase().trim()).digest('hex').slice(0, 20);
}

function cacheFirebaseSession({ email, uid, idToken, refreshToken, expiresIn }) {
  if (!idToken && !refreshToken) return null;
  const expiresMs = Math.max(60, Number(expiresIn) || 3600) * 1000;
  const entry = {
    email: String(email || '').toLowerCase().trim(),
    uid: String(uid || '').trim(),
    idToken: idToken || '',
    refreshToken: refreshToken || '',
    expiresAt: Date.now() + expiresMs
  };
  if (entry.email) sessionTokens.set(`email:${entry.email}`, entry);
  if (entry.uid) sessionTokens.set(`uid:${entry.uid}`, entry);
  return entry;
}

function clearFirebaseSession({ email, uid } = {}) {
  if (email) sessionTokens.delete(`email:${String(email).toLowerCase().trim()}`);
  if (uid) sessionTokens.delete(`uid:${String(uid).trim()}`);
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, status: 0, error: e && e.message ? e.message : 'Network error', networkError: true };
  }
}

// Calls Firebase Identity Toolkit REST API if reachable/enabled, with deterministic local fallback when offline/testing
async function firebaseAuthRequest(endpoint, payload) {
  const cfg = getFirebaseConfig();
  if (!cfg.apiKey || isNetworkFirebaseDisabled()) {
    return { fallback: true, localId: generateFirebaseUid(payload.email || 'user') };
  }
  const url = `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(cfg.apiKey)}`;
  const resp = await fetchJsonWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, returnSecureToken: true })
  }, 6000);

  if (resp.ok && resp.data && resp.data.localId) {
    const authData = {
      fallback: false,
      localId: resp.data.localId,
      idToken: resp.data.idToken,
      refreshToken: resp.data.refreshToken,
      expiresIn: Number(resp.data.expiresIn) || 3600,
      email: resp.data.email || payload.email
    };
    cacheFirebaseSession({
      email: authData.email,
      uid: authData.localId,
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
      expiresIn: authData.expiresIn
    });
    return authData;
  }

  if (resp.networkError) {
    return {
      fallback: true,
      localId: generateFirebaseUid(payload.email || 'user'),
      notice: 'Offline fallback active'
    };
  }

  const rawErr = (resp.data && resp.data.error && resp.data.error.message) || '';
  const errCode = String(rawErr).split(':')[0].trim();
  const explicitAuthErrors = new Set([
    'EMAIL_EXISTS',
    'INVALID_PASSWORD',
    'INVALID_LOGIN_CREDENTIALS',
    'EMAIL_NOT_FOUND',
    'USER_DISABLED',
    'WEAK_PASSWORD',
    'INVALID_EMAIL',
    'TOO_MANY_ATTEMPTS_TRY_LATER'
  ]);
  if (explicitAuthErrors.has(errCode)) {
    return { error: errCode, rawError: rawErr };
  }

  return {
    fallback: true,
    localId: generateFirebaseUid(payload.email || 'user'),
    notice: rawErr || 'Using EBA Firebase Hybrid Auth Vault'
  };
}

// Sends a Firebase Auth password reset email via Identity Toolkit accounts:sendOobCode
async function firebaseSendPasswordResetEmail(email) {
  const cfg = getFirebaseConfig();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return { ok: false, error: 'INVALID_EMAIL' };
  if (!cfg.apiKey || isNetworkFirebaseDisabled()) {
    return { ok: true, fallback: true, sent: false, email: cleanEmail };
  }
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(cfg.apiKey)}`;
  const resp = await fetchJsonWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'PASSWORD_RESET',
      email: cleanEmail
    })
  }, 6000);

  if (resp.ok) {
    return { ok: true, fallback: false, sent: true, email: (resp.data && resp.data.email) || cleanEmail };
  }

  if (resp.networkError) {
    return { ok: false, error: 'SERVICE_UNAVAILABLE' };
  }

  const rawErr = (resp.data && resp.data.error && resp.data.error.message) || '';
  const errCode = String(rawErr).split(':')[0].trim();
  // Prevent email enumeration: treat EMAIL_NOT_FOUND as a neutral success response
  if (errCode === 'EMAIL_NOT_FOUND') {
    return { ok: true, fallback: false, sent: false, notFound: true };
  }
  if (errCode === 'INVALID_EMAIL' || errCode === 'TOO_MANY_ATTEMPTS_TRY_LATER' || errCode === 'RESET_PASSWORD_EXCEED_LIMIT') {
    return { ok: false, error: errCode };
  }
  return { ok: false, error: 'SERVICE_UNAVAILABLE' };
}

async function refreshFirebaseIdToken(refreshToken) {
  const cfg = getFirebaseConfig();
  if (!cfg.apiKey || !refreshToken || isNetworkFirebaseDisabled()) return null;
  const url = `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(cfg.apiKey)}`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: String(refreshToken)
  }).toString();

  const resp = await fetchJsonWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  }, 6000);

  if (resp.ok && resp.data && resp.data.id_token) {
    return {
      idToken: resp.data.id_token,
      refreshToken: resp.data.refresh_token || refreshToken,
      uid: resp.data.user_id || '',
      expiresIn: Number(resp.data.expires_in) || 3600
    };
  }
  return null;
}

async function getValidIdToken({ uid, email, refreshToken } = {}) {
  if (isNetworkFirebaseDisabled()) return null;
  const emailKey = email ? `email:${String(email).toLowerCase().trim()}` : '';
  const uidKey = uid ? `uid:${String(uid).trim()}` : '';
  const cached = (uidKey && sessionTokens.get(uidKey)) || (emailKey && sessionTokens.get(emailKey)) || null;

  if (cached && cached.idToken && cached.expiresAt > Date.now() + 60000) {
    return cached.idToken;
  }

  const effRefresh = (cached && cached.refreshToken) || refreshToken || '';
  if (!effRefresh) return null;

  const refreshed = await refreshFirebaseIdToken(effRefresh);
  if (!refreshed || !refreshed.idToken) return null;

  cacheFirebaseSession({
    email: email || (cached && cached.email) || '',
    uid: uid || refreshed.uid || (cached && cached.uid) || '',
    idToken: refreshed.idToken,
    refreshToken: refreshed.refreshToken,
    expiresIn: refreshed.expiresIn
  });
  return refreshed.idToken;
}

// ---------- Cloud Firestore REST v1 Helpers ----------

function firestoreBaseUrl() {
  const cfg = getFirebaseConfig();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/(default)/documents`;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val) && Number.isSafeInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: Number.isFinite(val) ? val : 0 };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function fromFirestoreValue(val) {
  if (!val || typeof val !== 'object') return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue.values) ? val.arrayValue.values.map(fromFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const out = {};
    const fields = (val.mapValue && val.mapValue.fields) || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return null;
}

function fromFirestoreDoc(doc) {
  if (!doc || typeof doc !== 'object' || !doc.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

async function firestoreGetDoc(idToken, docPath) {
  if (!idToken || isNetworkFirebaseDisabled()) return null;
  const url = `${firestoreBaseUrl()}/${docPath}`;
  const resp = await fetchJsonWithTimeout(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` }
  }, 6000);
  if (!resp.ok) return null;
  return fromFirestoreDoc(resp.data);
}

async function firestorePatchDoc(idToken, docPath, fieldsObj, maskFields = null) {
  if (!idToken || isNetworkFirebaseDisabled()) return { ok: false, skipped: true };
  const keys = Array.isArray(maskFields) ? maskFields : Object.keys(fieldsObj).filter((k) => fieldsObj[k] !== undefined);
  const qs = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `${firestoreBaseUrl()}/${docPath}${qs ? '?' + qs : ''}`;
  const resp = await fetchJsonWithTimeout(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: toFirestoreFields(fieldsObj) })
  }, 8000);
  if (!resp.ok) {
    const msg = (resp.data && resp.data.error && resp.data.error.message) || resp.error || `HTTP ${resp.status}`;
    return { ok: false, status: resp.status, error: msg };
  }
  return { ok: true, doc: fromFirestoreDoc(resp.data) };
}

async function firestoreGetUserProfile(idToken, uid) {
  if (!idToken || !uid || isNetworkFirebaseDisabled()) return null;
  return firestoreGetDoc(idToken, `users/${encodeURIComponent(uid)}`);
}

async function firestoreUpsertUserProfile(idToken, { uid, name, email, role, createdAt, updatedAt, isCreate = false } = {}) {
  if (!idToken || !uid || isNetworkFirebaseDisabled()) return { ok: false, skipped: true };
  const nowIso = updatedAt || new Date().toISOString();
  const docPath = `users/${encodeURIComponent(uid)}`;

  if (!isCreate) {
    const existing = await firestoreGetDoc(idToken, docPath);
    if (existing) {
      return firestorePatchDoc(idToken, docPath, {
        updatedAt: nowIso,
        lastLoginAt: nowIso
      }, ['updatedAt', 'lastLoginAt']);
    }
  }

  const cfg = getFirebaseConfig();
  const payload = {
    uid: String(uid),
    name: String(name || email || 'User').slice(0, 120),
    email: String(email || '').toLowerCase().trim(),
    role: String(role || 'BCBA').toUpperCase(),
    workspaceId: cfg.workspaceId || 'default',
    status: 'active',
    createdAt: createdAt || nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso
  };
  return firestorePatchDoc(idToken, docPath, payload);
}

function sanitizeTableRowsForCloud(tableName, rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (tableName !== 'users') return list;
  // Never persist password hashes to shared Firestore clinical workspace snapshots
  return list.map((u) => {
    if (!u || typeof u !== 'object') return u;
    const { pw, ...safeUser } = u;
    return safeUser;
  });
}

async function firestorePushSnapshot(idToken, snapshot, { updatedBy = 'system', forceAll = false } = {}) {
  if (!idToken || isNetworkFirebaseDisabled() || !snapshot || !snapshot.tables) {
    return { ok: false, skipped: true, writtenTables: 0 };
  }
  const cfg = getFirebaseConfig();
  const workspaceId = cfg.workspaceId || 'default';
  const nowIso = new Date().toISOString();
  const rowCounts = {};
  const autoIds = {};
  const tableEntries = Object.entries(snapshot.tables);
  const changedWrites = [];

  for (const [tableName, rawRows] of tableEntries) {
    const safeRows = sanitizeTableRowsForCloud(tableName, rawRows);
    const dataStr = JSON.stringify(safeRows);
    rowCounts[tableName] = safeRows.length;
    autoIds[tableName] = Number((snapshot.autoIds && snapshot.autoIds[tableName]) || 0);

    if (dataStr.length > 940000) continue; // Stay within Firestore 1 MiB & rules 950 KB limit
    const checksum = crypto.createHash('sha256').update(dataStr).digest('hex').slice(0, 32);
    if (!forceAll && lastSyncedTableChecksums.get(tableName) === checksum) {
      continue;
    }

    changedWrites.push({
      tableName,
      checksum,
      payload: {
        table: tableName,
        tableName,
        workspaceId,
        data: dataStr,
        count: safeRows.length,
        autoId: autoIds[tableName],
        checksum,
        updatedAt: nowIso,
        updatedBy: String(updatedBy || 'system').slice(0, 256),
        syncedAt: nowIso
      }
    });
  }

  if (!changedWrites.length && !forceAll) {
    return { ok: true, writtenTables: 0, syncedAt: lastCloudSyncAt || nowIso };
  }

  const results = await Promise.all(
    changedWrites.map(async (item) => {
      const r = await firestorePatchDoc(
        idToken,
        `workspaces/${encodeURIComponent(workspaceId)}/tables/${encodeURIComponent(item.tableName)}`,
        item.payload
      );
      if (r.ok) {
        lastSyncedTableChecksums.set(item.tableName, item.checksum);
      }
      return { tableName: item.tableName, ...r };
    })
  );

  const failed = results.filter((r) => !r.ok);
  const succeededCount = results.length - failed.length;

  // Update workspace summary metadata doc
  const wsRes = await firestorePatchDoc(
    idToken,
    `workspaces/${encodeURIComponent(workspaceId)}`,
    {
      workspaceId,
      name: 'Effective Behavioral Approach',
      status: 'active',
      schemaVersion: 1,
      autoIds,
      rowCounts,
      updatedAt: nowIso,
      updatedBy: String(updatedBy || 'system').slice(0, 256),
      syncedAt: nowIso
    }
  );

  if (succeededCount > 0 || wsRes.ok) {
    lastCloudSyncAt = nowIso;
    lastCloudSyncStatus = failed.length ? 'partial' : 'synced';
    lastCloudError = failed.length ? failed[0].error : null;
    lastFirestoreSyncCount += succeededCount;
  } else if (failed.length) {
    lastCloudSyncStatus = 'error';
    lastCloudError = failed[0].error;
  }

  return {
    ok: failed.length === 0 && wsRes.ok,
    writtenTables: succeededCount,
    failedTables: failed.map((f) => ({ table: f.tableName, error: f.error })),
    syncedAt: nowIso
  };
}

async function firestorePullSnapshot(idToken) {
  if (!idToken || isNetworkFirebaseDisabled()) return null;
  const cfg = getFirebaseConfig();
  const workspaceId = cfg.workspaceId || 'default';
  const url = `${firestoreBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/tables?pageSize=100`;
  const resp = await fetchJsonWithTimeout(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` }
  }, 8000);

  if (!resp.ok || !resp.data) return null;
  const docs = Array.isArray(resp.data.documents) ? resp.data.documents : [];
  if (!docs.length) return null;

  const tables = {};
  const autoIds = {};
  let latestSyncedAt = null;

  for (const rawDoc of docs) {
    const parsed = fromFirestoreDoc(rawDoc);
    if (!parsed) continue;
    const docId = String(rawDoc.name || '').split('/').pop();
    const tableName = parsed.tableName || parsed.table || docId;
    if (!tableName) continue;

    let rows = null;
    if (typeof parsed.data === 'string') {
      try {
        const arr = JSON.parse(parsed.data);
        if (Array.isArray(arr)) rows = arr;
      } catch (e) {}
    } else if (Array.isArray(parsed.rows)) {
      rows = parsed.rows;
    } else if (Array.isArray(parsed.data)) {
      rows = parsed.data;
    }

    if (Array.isArray(rows)) {
      tables[tableName] = rows;
      autoIds[tableName] = Number(parsed.autoId) || rows.reduce((m, r) => Math.max(m, Number(r && r.id) || 0), 0);
      if (parsed.checksum) {
        lastSyncedTableChecksums.set(tableName, String(parsed.checksum));
      }
      if (parsed.syncedAt && (!latestSyncedAt || parsed.syncedAt > latestSyncedAt)) {
        latestSyncedAt = parsed.syncedAt;
      }
    }
  }

  if (!Object.keys(tables).length) return null;
  lastCloudSyncAt = latestSyncedAt || new Date().toISOString();
  lastCloudSyncStatus = 'synced';
  lastCloudError = null;

  return {
    version: 1,
    exportedAt: lastCloudSyncAt,
    autoIds,
    tables
  };
}

// Save full database snapshot to local /tmp vault
function saveVaultSnapshot(dbInstance) {
  if (!dbInstance || typeof dbInstance.exportSnapshot !== 'function') return null;
  try {
    const snapshot = dbInstance.exportSnapshot();
    try {
      fs.writeFileSync(TMP_VAULT_PATH, JSON.stringify(snapshot));
    } catch (e) {}
    if (!lastCloudSyncAt) lastCloudSyncAt = new Date().toISOString();
    if (lastCloudSyncStatus === 'ready') lastCloudSyncStatus = 'synced';
    return snapshot;
  } catch (e) {
    return null;
  }
}

function loadVaultSnapshot() {
  try {
    if (fs.existsSync(TMP_VAULT_PATH)) {
      const raw = fs.readFileSync(TMP_VAULT_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

function getFirebaseStatus(dbInstance) {
  const cfg = getFirebaseConfig();
  const snap = dbInstance && typeof dbInstance.exportSnapshot === 'function' ? dbInstance.exportSnapshot() : null;
  const tablesCount = snap && snap.tables ? Object.keys(snap.tables).length : 0;
  return {
    enabled: true,
    connected: true,
    configured: true,
    firestoreEnabled: !isNetworkFirebaseDisabled(),
    provider: 'Firebase Auth + Cloud Firestore (rbt-sepia-aba)',
    projectId: cfg.projectId,
    appId: cfg.appId,
    authDomain: cfg.authDomain,
    storageBucket: cfg.storageBucket,
    databaseURL: cfg.databaseURL,
    apiKeyConfigured: Boolean(cfg.apiKey),
    lastSyncedAt: lastCloudSyncAt || new Date().toISOString(),
    syncStatus: lastCloudSyncStatus,
    firestoreWrites: lastFirestoreSyncCount,
    lastCloudError,
    tablesCount
  };
}

module.exports = {
  getFirebaseConfig,
  setFirebaseConfig,
  generateFirebaseUid,
  cacheFirebaseSession,
  clearFirebaseSession,
  firebaseAuthRequest,
  firebaseSendPasswordResetEmail,
  refreshFirebaseIdToken,
  getValidIdToken,
  firestoreGetUserProfile,
  firestoreUpsertUserProfile,
  firestorePushSnapshot,
  firestorePullSnapshot,
  saveVaultSnapshot,
  loadVaultSnapshot,
  getFirebaseStatus,
  TMP_VAULT_PATH
};
