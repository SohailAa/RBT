const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createDatabase, MemoryDB } = require('./lib/db');
const G = require('./lib/generators');

const PORT = process.env.PORT || 3000;
const ON_VERCEL = !!process.env.VERCEL;
// On Vercel the filesystem is read-only except /tmp, and /tmp is ephemeral (demo data only).
// In-memory DB on Vercel provides instantaneous zero-dependency startup with zero binary issues.
const db = ON_VERCEL ? new MemoryDB() : createDatabase(path.join(__dirname, 'eba.db'));
const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-change-me';
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, pw TEXT, role TEXT);
CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY, name TEXT, dob TEXT, diagnosis TEXT, guardian TEXT, school TEXT, emergency TEXT, insurance TEXT, reinforcers TEXT, sensory TEXT, triggers TEXT, communication TEXT, crisis_plan TEXT, parent_id INTEGER);
CREATE TABLE IF NOT EXISTS assignments(client_id INTEGER, user_id INTEGER);
CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, client_id INTEGER, title TEXT, baseline INTEGER, target INTEGER, status TEXT DEFAULT 'active');
CREATE TABLE IF NOT EXISTS plans(id INTEGER PRIMARY KEY, client_id INTEGER, behavior TEXT, data TEXT, status TEXT DEFAULT 'draft', approved_by TEXT);
CREATE TABLE IF NOT EXISTS stories(id INTEGER PRIMARY KEY, client_id INTEGER, inputs TEXT, content TEXT, status TEXT DEFAULT 'draft', approved_by TEXT, token TEXT);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY, client_id INTEGER, user_id INTEGER, start TEXT, end TEXT, role TEXT, setting TEXT);
CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY, appointment_id INTEGER, client_id INTEGER, user_id INTEGER, start TEXT, end TEXT, units INTEGER, note TEXT DEFAULT '', note_status TEXT DEFAULT 'none', signed_by TEXT, submitted_by TEXT, rbt_signed_at TEXT, bcba_signed_at TEXT);
CREATE TABLE IF NOT EXISTS trials(id INTEGER PRIMARY KEY, session_id INTEGER, goal_id INTEGER, level TEXT, ts TEXT);
CREATE TABLE IF NOT EXISTS authorizations(id INTEGER PRIMARY KEY, client_id INTEGER, code TEXT, authorized INTEGER, used INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS abc_logs(id INTEGER PRIMARY KEY, client_id INTEGER, session_id INTEGER, user_id INTEGER, ts TEXT, antecedent TEXT, behavior TEXT, consequence TEXT, perceived_function TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS supervision_logs(id INTEGER PRIMARY KEY, client_id INTEGER, bcba_id INTEGER, rbt_id INTEGER, session_id INTEGER, ts TEXT, minutes INTEGER, type TEXT, notes TEXT);
`);
try { db.exec('ALTER TABLE clients ADD COLUMN communication TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE clients ADD COLUMN crisis_plan TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sessions ADD COLUMN submitted_by TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sessions ADD COLUMN rbt_signed_at TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sessions ADD COLUMN bcba_signed_at TEXT'); } catch (e) {}

// ---------- helpers ----------
const getLocalDate = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const hash = (p) => { const s = crypto.randomBytes(8).toString('hex'); return s + ':' + crypto.scryptSync(p, s, 32).toString('hex'); };
const verify = (p, h) => { const [s, k] = h.split(':'); return crypto.scryptSync(p, s, 32).toString('hex') === k; };
const all = (sql, ...a) => db.prepare(sql).all(...a);
const get = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
// Stateless signed tokens (work across serverless instances): uid.expiry.hmac
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
const makeToken = (uid) => { const p = `${uid}.${Date.now() + 8 * 3600e3}`; return `${p}.${sign(p)}`; };
const readToken = (t) => {
  const [uid, exp, sig] = (t || '').split('.');
  if (!sig || sign(`${uid}.${exp}`) !== sig || Date.now() > +exp) return null;
  return +uid;
};

function seed() {
  if (get('SELECT COUNT(*) c FROM users').c) return;
  const bcba = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Dr. Dana Rivera, BCBA', 'bcba@eba.test', hash('password'), 'BCBA').lastInsertRowid;
  const rbt = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Sam Lee, RBT', 'rbt@eba.test', hash('password'), 'RBT').lastInsertRowid;
  const rbt2 = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Jo Park, RBT', 'rbt2@eba.test', hash('password'), 'RBT').lastInsertRowid;
  const par = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Mrs. Carter (Eleanor\'s parent)', 'parent@eba.test', hash('password'), 'PARENT').lastInsertRowid;
  const el = run('INSERT INTO clients(name,dob,diagnosis,guardian,school,emergency,insurance,reinforcers,sensory,triggers,communication,crisis_plan,parent_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
    'Eleanor', '2018-03-12', 'Autism Spectrum Disorder', 'Mrs. Carter', 'Maple Elementary', 'Grandma – 555-0101', 'Sample Insurance #A123',
    'LEGO, stickers, tablet time', 'Dislikes loud noises, seeks soft textures', 'Transitions, peers touching her creations',
    'Verbal (full sentences, needs 5s processing time)',
    '1. Provide visual countdown card\n2. Escort to calm sensory corner\n3. Do not block items or use physical restraint\n4. Re-introduce task using First/Then board',
    par).lastInsertRowid;
  const le = run('INSERT INTO clients(name,dob,diagnosis,guardian,school,emergency,insurance,reinforcers,sensory,triggers,communication,crisis_plan) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
    'Leon', '2017-08-02', 'Autism Spectrum Disorder', 'Mr. Okafor', 'Home program', 'Aunt – 555-0102', 'Sample Insurance #B456',
    'Trains, bubbles, spin toys', 'Seeks deep pressure, vestibular movement', 'Denied access to preferred items',
    'PECS Phase III & 2-word vocal requests ("train please")',
    '1. Offer deep pressure pillow\n2. Provide choice of 2 alternative preferred toys\n3. Maintain neutral facial tone',
    ).lastInsertRowid;
  run('INSERT INTO assignments VALUES(?,?)', el, rbt); run('INSERT INTO assignments VALUES(?,?)', le, rbt); run('INSERT INTO assignments VALUES(?,?)', le, rbt2);
  const g1 = run('INSERT INTO goals(client_id,title,baseline,target) VALUES(?,?,?,?)', el, 'Following teacher directions', 32, 80).lastInsertRowid;
  run('INSERT INTO goals(client_id,title,baseline,target) VALUES(?,?,?,?)', el, 'Waiting for a turn', 20, 80);
  run('INSERT INTO goals(client_id,title,baseline,target) VALUES(?,?,?,?)', le, 'Asking for help', 10, 70);
  run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,?)', el, '97153', 480, 440);
  run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,?)', el, '97155', 40, 12);
  run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,?)', le, '97153', 400, 120);
  // appointments today
  const day = getLocalDate();
  const mk = (cid, uid, s, e, role, setting) => run('INSERT INTO appointments(client_id,user_id,start,end,role,setting) VALUES(?,?,?,?,?,?)', cid, uid, `${day}T${s}`, `${day}T${e}`, role, setting);
  mk(el, rbt, '09:00', '12:00', 'RBT', 'School'); mk(le, rbt, '15:00', '17:00', 'RBT', 'Home'); mk(el, bcba, '17:00', '18:00', 'BCBA', 'Home');
  // past session with data so progress shows
  for (let i = 0; i < 3; i++) {
    const t = new Date(Date.now() - (3 - i) * 86400000).toISOString();
    const sid = run('INSERT INTO sessions(client_id,user_id,start,end,units,note_status) VALUES(?,?,?,?,?,?)', el, rbt, t, t, 12, 'signed').lastInsertRowid;
    const mix = [['I', 4], ['V', 4], ['P', 2], ['N', 1]].map(([l, n]) => Array(n + i * 1).fill(l)).flat();
    mix.forEach((l) => run('INSERT INTO trials(session_id,goal_id,level,ts) VALUES(?,?,?,?)', sid, g1, l, t));
  }
  // Seed sample ABC data
  const tRecent = new Date().toISOString();
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes) VALUES(?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, tRecent, 'Transition from preferred play', 'Screaming', 'Offered visual countdown & calm breathing', 'Escape', 'De-escalated in 3 mins without physical intervention');
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes) VALUES(?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, tRecent, 'Peer reached for LEGO creation', 'Screaming', 'Prompted "My turn" replacement card', 'Tangible', 'Accepted replacement phrase');
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes) VALUES(?,?,?,?,?,?,?,?,?)',
    le, 2, rbt, tRecent, 'Denied immediate access to tablet', 'Crying', 'Prompted PECS card for alternate activity (trains)', 'Tangible', 'Redirected successfully to wooden train set');
  // Seed sample supervision log
  run('INSERT INTO supervision_logs(client_id,bcba_id,rbt_id,session_id,ts,minutes,type,notes) VALUES(?,?,?,?,?,?,?,?)',
    el, bcba, rbt, 1, tRecent, 60, 'Direct Observation', 'Observed DTT trials on turn-taking. RBT demonstrated excellent prompt fading.');
}
seed();

function upgradeExistingData() {
  const el = get('SELECT id, communication FROM clients WHERE name=?', 'Eleanor');
  if (el && !el.communication) {
    run('UPDATE clients SET communication=?, crisis_plan=? WHERE name=?',
      'Verbal (full sentences, needs 5s processing time)',
      '1. Provide visual countdown card\n2. Escort to calm sensory corner\n3. Do not block items or use physical restraint\n4. Re-introduce task using First/Then board',
      'Eleanor');
    run('UPDATE clients SET communication=?, crisis_plan=? WHERE name=?',
      'PECS Phase III & 2-word vocal requests ("train please")',
      '1. Offer deep pressure pillow\n2. Provide choice of 2 alternative preferred toys\n3. Maintain neutral facial tone',
      'Leon');
  }
}
upgradeExistingData();

// ---------- access control ----------
function canSeeClient(u, cid) {
  if (u.role === 'BCBA') return true;
  if (u.role === 'RBT') return !!get('SELECT 1 x FROM assignments WHERE client_id=? AND user_id=?', cid, u.id);
  if (u.role === 'PARENT') return !!get('SELECT 1 x FROM clients WHERE id=? AND parent_id=?', cid, u.id);
  return false;
}
const visibleClients = (u) => u.role === 'BCBA' ? all('SELECT * FROM clients ORDER BY name')
  : u.role === 'RBT' ? all('SELECT c.* FROM clients c JOIN assignments a ON a.client_id=c.id WHERE a.user_id=? ORDER BY name', u.id)
  : all('SELECT * FROM clients WHERE parent_id=?', u.id);

// ---------- progress & clinical mastery intelligence ----------
function goalProgress(goal) {
  const rows = all('SELECT session_id, level FROM trials WHERE goal_id=? ORDER BY session_id', goal.id);
  const bySession = {};
  rows.forEach((r) => { (bySession[r.session_id] ||= []).push(r.level); });
  const series = Object.entries(bySession).map(([sid, ls]) => {
    const total = ls.length;
    const counts = { I: 0, V: 0, G: 0, P: 0, N: 0 };
    ls.forEach((l) => { if (counts[l] !== undefined) counts[l]++; });
    return {
      session: +sid,
      pct: total ? Math.round(counts.I / total * 100) : 0,
      n: total,
      prompts: counts
    };
  });
  const recent = series.slice(-3);
  const current = recent.length ? Math.round(recent.reduce((a, b) => a + b.pct, 0) / recent.length) : null;
  let trend = 'Not enough data';
  if (current !== null) trend = current > goal.baseline + 5 ? 'Improving' : current < goal.baseline - 5 ? 'Declining' : 'Flat';

  // Automated Mastery & Plateau Detection (CentralReach Improvement)
  const targetThreshold = goal.target || 80;
  const isMasteredCriteriaMet = recent.length >= 3 && recent.every((s) => s.pct >= targetThreshold);
  const isStalled = series.length >= 3 && current !== null && current <= (goal.baseline + 3);

  let recommendation = null;
  if (goal.status === 'mastered') {
    recommendation = 'Goal Mastered — Active in Maintenance & Generalization';
  } else if (isMasteredCriteriaMet) {
    recommendation = `🎯 Mastery Criteria Met (${current}% avg across last 3 sessions). Recommend advancing to maintenance.`;
  } else if (isStalled) {
    recommendation = `⚠️ Target Stalled (${current}% vs ${goal.baseline}% baseline). Recommend reviewing prompt hierarchy or environmental adaptations.`;
  }

  return {
    ...goal,
    series,
    current,
    trend,
    mastery_met: isMasteredCriteriaMet,
    stalled: isStalled,
    recommendation
  };
}

// ---------- API ----------
const routes = [];
const route = (m, p, fn, opts = {}) => routes.push({ m, re: new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn, ...opts });
const bad = (code, msg) => { const e = new Error(msg); e.code = code; throw e; };
const need = (u, ...roles) => { if (!roles.includes(u.role)) bad(403, 'Not allowed'); };
const clientOr403 = (u, cid) => { if (!canSeeClient(u, +cid)) bad(403, 'No access to this client'); };

route('POST', '/api/login', (u, b, p, ctx) => {
  const row = get('SELECT * FROM users WHERE email=?', (b.email || '').toLowerCase());
  if (!row || !verify(b.password || '', row.pw)) bad(401, 'Invalid email or password');
  const tok = makeToken(row.id);
  ctx.setCookie = `tok=${tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${ON_VERCEL ? '; Secure' : ''}`;
  return { id: row.id, name: row.name, role: row.role };
}, { public: true });
route('POST', '/api/logout', (u, b, p, ctx) => { ctx.setCookie = 'tok=; Max-Age=0; Path=/'; return {}; });
route('GET', '/api/me', (u) => ({ id: u.id, name: u.name, role: u.role }));

route('GET', '/api/dashboard', (u) => {
  const day = getLocalDate();
  let appts = all(`SELECT a.*, c.name client FROM appointments a JOIN clients c ON c.id=a.client_id WHERE a.start LIKE ? ORDER BY a.start`, day + '%');
  appts = appts.filter((a) => canSeeClient(u, a.client_id) && (u.role !== 'RBT' || a.user_id === u.id));
  const incompleteNotes = all('SELECT s.id, s.client_id, s.user_id FROM sessions s WHERE s.note_status IN (\'none\',\'draft\',\'pending_approval\') AND s.end IS NOT NULL')
    .filter((s) => canSeeClient(u, s.client_id) && (u.role === 'BCBA' || s.user_id === u.id)).length;
  const auths = all('SELECT a.*, c.name client FROM authorizations a JOIN clients c ON c.id=a.client_id')
    .filter((a) => canSeeClient(u, a.client_id) && a.used / a.authorized >= 0.8);
  const pendingApprovals = u.role === 'BCBA' ? (all('SELECT COUNT(*) c FROM plans WHERE status=\'draft\'')[0].c + all('SELECT COUNT(*) c FROM stories WHERE status=\'draft\'')[0].c) : 0;
  const pendingSign = u.role === 'BCBA' ? (all('SELECT COUNT(*) c FROM sessions WHERE note_status IN (\'draft\',\'pending_approval\')')[0].c) : 0;
  
  // Supervision metrics (current month)
  const monthPrefix = day.slice(0, 7);
  const rbtUserIds = new Set(all('SELECT id FROM users WHERE role=\'RBT\'').map((x) => x.id));
  const rbtSessions = all('SELECT * FROM sessions WHERE start LIKE ?', monthPrefix + '%').filter((s) => rbtUserIds.has(s.user_id));
  const rbtDirectMinutes = rbtSessions.reduce((sum, s) => sum + (s.units ? s.units * 15 : 0), 0);
  const supLogs = all('SELECT * FROM supervision_logs WHERE ts LIKE ?', monthPrefix + '%');
  const supMinutes = supLogs.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const supPct = rbtDirectMinutes > 0 ? Math.round((supMinutes / rbtDirectMinutes) * 100) : 0;
  const supervision = { rbtDirectMinutes, supMinutes, supPct, compliant: supPct >= 5 };

  return { appts, rbt: appts.filter((a) => a.role === 'RBT').length, bcba: appts.filter((a) => a.role === 'BCBA').length, incompleteNotes, auths, pendingApprovals, pendingSign, supervision };
}, {});

route('GET', '/api/clients', (u) => visibleClients(u));
route('POST', '/api/clients', (u, b) => {
  need(u, 'BCBA'); if (!b.name) bad(400, 'Name required');
  const r = run('INSERT INTO clients(name,dob,diagnosis,guardian,school,emergency,insurance,reinforcers,sensory,triggers,communication,crisis_plan) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
    b.name, b.dob || '', b.diagnosis || '', b.guardian || '', b.school || '', b.emergency || '', b.insurance || '', b.reinforcers || '', b.sensory || '', b.triggers || '', b.communication || '', b.crisis_plan || '');
  return { id: Number(r.lastInsertRowid) };
});
route('GET', '/api/clients/:id', (u, b, p) => {
  clientOr403(u, p.id);
  const c = get('SELECT * FROM clients WHERE id=?', +p.id); if (!c) bad(404, 'Not found');
  const isParent = u.role === 'PARENT';
  const goals = all('SELECT * FROM goals WHERE client_id=?', c.id).map(goalProgress);
  let plans = all('SELECT * FROM plans WHERE client_id=?', c.id).map((x) => ({ ...x, data: parse(x.data) }));
  let stories = all('SELECT * FROM stories WHERE client_id=?', c.id).map((x) => ({ ...x, inputs: parse(x.inputs), content: parse(x.content) }));
  if (isParent) { plans = []; stories = stories.filter((s) => s.status === 'shared'); }
  const auths = isParent ? [] : all('SELECT * FROM authorizations WHERE client_id=?', c.id);
  const assigned = u.role === 'BCBA' ? all('SELECT u.id,u.name FROM assignments a JOIN users u ON u.id=a.user_id WHERE a.client_id=?', c.id) : [];
  
  // ABC logs & analytics (unified clinical hub)
  const rawAbc = isParent ? [] : all('SELECT * FROM abc_logs WHERE client_id=? ORDER BY id DESC', c.id);
  const abcFunctions = { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 };
  const abcBehaviors = {};
  const hourlyDistribution = {};
  for (let h = 8; h <= 17; h++) {
    hourlyDistribution[h] = { hour: h, label: `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`, count: 0, antecedents: {} };
  }
  rawAbc.forEach((a) => {
    if (a.perceived_function && abcFunctions[a.perceived_function] !== undefined) abcFunctions[a.perceived_function]++;
    if (a.behavior) abcBehaviors[a.behavior] = (abcBehaviors[a.behavior] || 0) + 1;
    if (a.ts) {
      const hour = new Date(a.ts).getHours();
      if (hourlyDistribution[hour]) {
        hourlyDistribution[hour].count++;
        const ant = a.antecedent || 'Other';
        hourlyDistribution[hour].antecedents[ant] = (hourlyDistribution[hour].antecedents[ant] || 0) + 1;
      }
    }
  });

  let peakHour = null;
  let maxCount = 0;
  Object.values(hourlyDistribution).forEach((h) => {
    if (h.count > maxCount) {
      maxCount = h.count;
      peakHour = h;
    }
  });
  const scatterplot = {
    hourly: Object.values(hourlyDistribution),
    peakWindow: peakHour && maxCount > 0 ? {
      hour: peakHour.hour,
      label: peakHour.label,
      count: peakHour.count,
      primaryAntecedent: Object.entries(peakHour.antecedents).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Transition'
    } : null
  };
  const abcSummary = { total: rawAbc.length, functions: abcFunctions, behaviors: abcBehaviors, scatterplot };
  const supervisionLogs = isParent ? [] : all('SELECT s.*, u.name bcba, r.name rbt FROM supervision_logs s JOIN users u ON u.id=s.bcba_id JOIN users r ON r.id=s.rbt_id WHERE s.client_id=? ORDER BY s.id DESC', c.id);

  return { client: isParent ? { id: c.id, name: c.name } : c, goals, plans, stories, auths, assigned, abcLogs: rawAbc, abcSummary, supervisionLogs };
});
route('GET', '/api/clients/:id/reauth-report', (u, b, p) => {
  need(u, 'BCBA');
  clientOr403(u, p.id);
  const c = get('SELECT * FROM clients WHERE id=?', +p.id);
  if (!c) bad(404, 'Client not found');
  const goals = all('SELECT * FROM goals WHERE client_id=?', c.id).map(goalProgress);
  const abcLogs = all('SELECT * FROM abc_logs WHERE client_id=? ORDER BY id DESC', c.id);
  const auths = all('SELECT * FROM authorizations WHERE client_id=?', c.id);
  const monthPrefix = getLocalDate().slice(0, 7);
  const rbtUserIds = new Set(all('SELECT id FROM users WHERE role=\'RBT\'').map((x) => x.id));
  const rbtSessions = all('SELECT * FROM sessions WHERE start LIKE ?', monthPrefix + '%').filter((s) => rbtUserIds.has(s.user_id));
  const rbtDirectMinutes = rbtSessions.reduce((sum, s) => sum + (s.units ? s.units * 15 : 0), 0);
  const supLogs = all('SELECT * FROM supervision_logs WHERE ts LIKE ?', monthPrefix + '%');
  const supMinutes = supLogs.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const supPct = rbtDirectMinutes > 0 ? Math.round((supMinutes / rbtDirectMinutes) * 100) : 0;
  const supervision = { rbtDirectMinutes, supMinutes, supPct, compliant: supPct >= 5 };

  return G.generateReauthReport({ client: c, goals, abcLogs, auths, supervision });
});
route('PUT', '/api/clients/:id', (u, b, p) => {
  need(u, 'BCBA');
  const f = ['name', 'dob', 'diagnosis', 'guardian', 'school', 'emergency', 'insurance', 'reinforcers', 'sensory', 'triggers', 'communication', 'crisis_plan'];
  run(`UPDATE clients SET ${f.map((x) => x + '=?').join(',')} WHERE id=?`, ...f.map((x) => b[x] ?? ''), +p.id); return {};
});
route('POST', '/api/clients/:id/goals', (u, b, p) => {
  need(u, 'BCBA'); if (!b.title) bad(400, 'Title required');
  run('INSERT INTO goals(client_id,title,baseline,target) VALUES(?,?,?,?)', +p.id, b.title, +b.baseline || 0, +b.target || 80); return {};
});
route('POST', '/api/goals/:id/status', (u, b, p) => {
  need(u, 'BCBA');
  if (!b.status) bad(400, 'Status required');
  run('UPDATE goals SET status=? WHERE id=?', b.status, +p.id);
  return { id: +p.id, status: b.status };
});
route('POST', '/api/clients/:id/auths', (u, b, p) => {
  need(u, 'BCBA'); run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,0)', +p.id, b.code, +b.authorized || 0); return {};
});

// ABC Data collection
route('POST', '/api/clients/:id/abc', (u, b, p) => {
  clientOr403(u, p.id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.behavior) bad(400, 'Behavior required');
  const ts = b.ts || new Date().toISOString();
  const r = run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes) VALUES(?,?,?,?,?,?,?,?,?)',
    +p.id, b.session_id ? +b.session_id : null, u.id, ts, b.antecedent || 'Unspecified', b.behavior, b.consequence || 'Prompted replacement', b.perceived_function || 'Escape', b.notes || '');
  return { id: Number(r.lastInsertRowid) };
});
route('GET', '/api/clients/:id/abc', (u, b, p) => {
  clientOr403(u, p.id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  return all('SELECT * FROM abc_logs WHERE client_id=? ORDER BY id DESC', +p.id);
});

// Supervision tracking
route('GET', '/api/supervision', (u) => {
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const monthPrefix = getLocalDate().slice(0, 7);
  const rbtUserIds = new Set(all('SELECT id FROM users WHERE role=\'RBT\'').map((x) => x.id));
  const rbtSessions = all('SELECT s.*, c.name client, u.name rbt FROM sessions s JOIN clients c ON c.id=s.client_id JOIN users u ON u.id=s.user_id WHERE s.start LIKE ?', monthPrefix + '%').filter((s) => rbtUserIds.has(s.user_id));
  const rbtDirectMinutes = rbtSessions.reduce((sum, s) => sum + (s.units ? s.units * 15 : 0), 0);
  const logs = all('SELECT s.*, c.name client, b.name bcba, r.name rbt FROM supervision_logs s JOIN clients c ON c.id=s.client_id JOIN users b ON b.id=s.bcba_id JOIN users r ON r.id=s.rbt_id ORDER BY s.id DESC');
  const currentMonthLogs = logs.filter((l) => (l.ts || '').startsWith(monthPrefix));
  const supMinutes = currentMonthLogs.reduce((sum, l) => sum + (l.minutes || 0), 0);
  const supPct = rbtDirectMinutes > 0 ? Math.round((supMinutes / rbtDirectMinutes) * 100) : 0;
  return { rbtDirectMinutes, supMinutes, supPct, compliant: supPct >= 5, logs, month: monthPrefix };
});
route('POST', '/api/supervision', (u, b) => {
  need(u, 'BCBA');
  if (!b.client_id || !b.rbt_id || !b.minutes) bad(400, 'Client, RBT, and minutes required');
  const ts = b.ts || new Date().toISOString();
  run('INSERT INTO supervision_logs(client_id,bcba_id,rbt_id,session_id,ts,minutes,type,notes) VALUES(?,?,?,?,?,?,?,?)',
    +b.client_id, u.id, +b.rbt_id, b.session_id ? +b.session_id : null, ts, +b.minutes, b.type || 'Direct Observation', b.notes || '');
  return {};
});

// plans
route('POST', '/api/clients/:id/plans/generate', (u, b, p) => {
  need(u, 'BCBA'); const c = get('SELECT * FROM clients WHERE id=?', +p.id);
  if (!b.behavior) bad(400, 'Target behavior required');
  const data = G.generatePlan({ child: c.name, behavior: b.behavior, antecedents: b.antecedents, reinforcers: (c.reinforcers || '').split(',').map((s) => s.trim()).filter(Boolean) });
  const r = run('INSERT INTO plans(client_id,behavior,data) VALUES(?,?,?)', c.id, b.behavior, JSON.stringify(data)); return { id: Number(r.lastInsertRowid) };
});
route('PUT', '/api/plans/:id', (u, b, p) => { need(u, 'BCBA'); run('UPDATE plans SET data=?, status=\'draft\', approved_by=NULL WHERE id=?', JSON.stringify(b.data), +p.id); return {}; });
route('POST', '/api/plans/:id/approve', (u, b, p) => { need(u, 'BCBA'); run('UPDATE plans SET status=\'approved\', approved_by=? WHERE id=?', u.name, +p.id); return {}; });

// stories
route('POST', '/api/clients/:id/stories/generate', (u, b, p) => {
  need(u, 'BCBA'); const c = get('SELECT * FROM clients WHERE id=?', +p.id);
  const inputs = { child: c.name, situation: b.situation, challenge: b.challenge, goal: b.goal, interest: b.interest, visuals: b.visuals };
  const r = run('INSERT INTO stories(client_id,inputs,content) VALUES(?,?,?)', c.id, JSON.stringify(inputs), JSON.stringify(G.generateStory(inputs))); return { id: Number(r.lastInsertRowid) };
});
route('PUT', '/api/stories/:id', (u, b, p) => { need(u, 'BCBA'); run('UPDATE stories SET content=?, status=\'draft\', approved_by=NULL, token=NULL WHERE id=?', JSON.stringify(b.content), +p.id); return {}; });
route('POST', '/api/stories/:id/approve', (u, b, p) => { need(u, 'BCBA'); run('UPDATE stories SET status=\'approved\', approved_by=? WHERE id=?', u.name, +p.id); return {}; });
route('POST', '/api/stories/:id/share', (u, b, p) => {
  need(u, 'BCBA'); const s = get('SELECT * FROM stories WHERE id=?', +p.id);
  if (s.status === 'draft') bad(400, 'Story must be BCBA-approved before sharing');
  const token = s.token || crypto.randomBytes(12).toString('hex');
  run('UPDATE stories SET status=\'shared\', token=? WHERE id=?', token, s.id); return { url: '/s/' + token };
});

// schedule
route('GET', '/api/schedule', (u, b, p, ctx) => {
  let a = all('SELECT a.*, c.name client, u.name staff FROM appointments a JOIN clients c ON c.id=a.client_id JOIN users u ON u.id=a.user_id ORDER BY a.start');
  a = a.filter((x) => canSeeClient(u, x.client_id) && (u.role !== 'RBT' || x.user_id === u.id));
  return a.map((x) => ({ ...x, session: get('SELECT id,end FROM sessions WHERE appointment_id=?', x.id) || null }));
});
route('POST', '/api/appointments', (u, b) => {
  need(u, 'BCBA'); if (!b.client_id || !b.user_id || !b.start || !b.end) bad(400, 'All fields required');
  const staff = get('SELECT * FROM users WHERE id=?', +b.user_id);
  const r = run('INSERT INTO appointments(client_id,user_id,start,end,role,setting) VALUES(?,?,?,?,?,?)', +b.client_id, +b.user_id, b.start, b.end, staff.role, b.setting || 'Home');
  if (staff.role === 'RBT' && !get('SELECT 1 x FROM assignments WHERE client_id=? AND user_id=?', +b.client_id, staff.id)) run('INSERT INTO assignments VALUES(?,?)', +b.client_id, staff.id);
  return { id: Number(r.lastInsertRowid) };
});
route('GET', '/api/staff', (u) => { need(u, 'BCBA'); return all('SELECT id,name,role FROM users WHERE role IN (\'RBT\',\'BCBA\')'); });

// sessions
route('POST', '/api/appointments/:id/start', (u, b, p) => {
  const a = get('SELECT * FROM appointments WHERE id=?', +p.id); if (!a) bad(404, 'Not found');
  if (u.role === 'PARENT') bad(403, 'Not allowed'); clientOr403(u, a.client_id);
  const ex = get('SELECT id FROM sessions WHERE appointment_id=?', a.id); if (ex) return { id: ex.id };
  const r = run('INSERT INTO sessions(appointment_id,client_id,user_id,start) VALUES(?,?,?,?)', a.id, a.client_id, u.id, new Date().toISOString());
  return { id: Number(r.lastInsertRowid) };
});
function sessionView(u, sid) {
  const s = get('SELECT * FROM sessions WHERE id=?', +sid); if (!s) bad(404, 'Not found'); clientOr403(u, s.client_id);
  const client = get('SELECT * FROM clients WHERE id=?', s.client_id);
  const goals = all('SELECT * FROM goals WHERE client_id=? AND status=\'active\'', s.client_id).map((g) => ({ ...g, summary: G.summarize(all('SELECT level FROM trials WHERE session_id=? AND goal_id=?', s.id, g.id)) }));
  const plans = all('SELECT * FROM plans WHERE client_id=? AND status=\'approved\'', s.client_id).map((x) => ({ ...x, data: parse(x.data) }));
  const stories = all('SELECT * FROM stories WHERE client_id=? AND status IN (\'approved\',\'shared\')', s.client_id).map((x) => ({ ...x, content: parse(x.content) }));
  const appt = get('SELECT * FROM appointments WHERE id=?', s.appointment_id);
  const abcLogs = all('SELECT * FROM abc_logs WHERE session_id=? ORDER BY id DESC', s.id);
  return { session: s, client, goals, plans, stories, appt, abcLogs };
}
route('GET', '/api/sessions/:id', (u, b, p) => { if (u.role === 'PARENT') bad(403, 'Not allowed'); return sessionView(u, p.id); });
route('POST', '/api/sessions/:id/trials', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (s.end) bad(400, 'Session ended'); if (!G.LEVELS[b.level]) bad(400, 'Bad level');
  run('INSERT INTO trials(session_id,goal_id,level,ts) VALUES(?,?,?,?)', s.id, +b.goal_id, b.level, new Date().toISOString()); return {};
});
route('DELETE', '/api/sessions/:id/trials/last', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (s.end) bad(400, 'Session ended');
  const t = get('SELECT id FROM trials WHERE session_id=? ORDER BY id DESC LIMIT 1', s.id); if (t) run('DELETE FROM trials WHERE id=?', t.id); return {};
});
route('POST', '/api/sessions/:id/abc', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.behavior) bad(400, 'Behavior required');
  const ts = b.ts || new Date().toISOString();
  const r = run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes) VALUES(?,?,?,?,?,?,?,?,?)',
    s.client_id, s.id, u.id, ts, b.antecedent || 'Unspecified', b.behavior, b.consequence || 'Prompted replacement', b.perceived_function || 'Escape', b.notes || '');
  return { id: Number(r.lastInsertRowid) };
});
route('POST', '/api/sessions/:id/end', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (s.end) return { units: s.units };
  const end = new Date(); const minutes = Math.max(1, Math.round((end - new Date(s.start)) / 60000));
  const units = G.calcUnits(+b.minutes_override || minutes);
  run('UPDATE sessions SET end=?, units=? WHERE id=?', end.toISOString(), units, s.id); return { units };
});
route('POST', '/api/sessions/:id/note/generate', (u, b, p) => {
  const v = sessionView(u, p.id); const s = v.session;
  const minutes = s.end ? Math.max(1, Math.round((new Date(s.end) - new Date(s.start)) / 60000)) : Math.round((Date.now() - new Date(s.start)) / 60000);
  const note = G.generateNote({ client: v.client, session: { setting: v.appt && v.appt.setting }, minutes: b.minutes || minutes, units: s.units || G.calcUnits(minutes), goalSummaries: v.goals.map((g) => ({ title: g.title, ...g.summary })), plan: v.plans[0] && v.plans[0].data, story: v.stories[0] && v.stories[0].content, abcLogs: v.abcLogs });
  return { note };
});
route('PUT', '/api/sessions/:id/note', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id);
  if (s.note_status === 'signed') bad(400, 'Note already signed'); if (u.role === 'PARENT') bad(403, 'Not allowed');
  run('UPDATE sessions SET note=?, note_status=\'draft\' WHERE id=?', b.note || '', s.id); return {};
});
route('POST', '/api/sessions/:id/note/submit', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); if (!s) bad(404, 'Not found'); clientOr403(u, s.client_id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const note = b.note !== undefined ? b.note : s.note;
  if (!note) bad(400, 'Note is empty');
  if (s.note_status === 'signed') bad(400, 'Note already signed by BCBA');
  const now = new Date().toISOString();
  run('UPDATE sessions SET note=?, note_status=\'pending_approval\', submitted_by=?, rbt_signed_at=? WHERE id=?', note, u.name, now, s.id);
  return { status: 'pending_approval', submitted_by: u.name, rbt_signed_at: now };
});
route('POST', '/api/sessions/:id/note/sign', (u, b, p) => {
  need(u, 'BCBA'); const s = get('SELECT * FROM sessions WHERE id=?', +p.id); if (!s) bad(404, 'Not found');
  const note = b.note !== undefined ? b.note : s.note;
  if (!note) bad(400, 'Note is empty');
  if (!s.end) bad(400, 'Session must be ended before signing note');
  const now = new Date().toISOString();
  run('UPDATE sessions SET note=?, note_status=\'signed\', signed_by=?, bcba_signed_at=? WHERE id=?', note, u.name, now, s.id);
  // Deduct units from authorization: 97155 for BCBA appointment, 97153 for RBT appointment
  const appt = get('SELECT * FROM appointments WHERE id=?', s.appointment_id);
  const code = (appt && appt.role === 'BCBA') ? '97155' : '97153';
  run('UPDATE authorizations SET used = used + ? WHERE client_id=? AND code=?', (s.units || 0), s.client_id, code);
  return { status: 'signed', signed_by: u.name, bcba_signed_at: now };
});
route('GET', '/api/notes', (u) => {
  return all('SELECT s.*, c.name client FROM sessions s JOIN clients c ON c.id=s.client_id WHERE s.end IS NOT NULL ORDER BY s.id DESC').filter((s) => u.role !== 'PARENT' && canSeeClient(u, s.client_id));
});

// ---------- parent story page ----------
function storyPage(token) {
  const s = get('SELECT * FROM stories WHERE token=? AND status=\'shared\'', token); if (!s) return null;
  const c = parse(s.content); const esc = (t) => String(t).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  return `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${esc(c.title)}</title>
<style>body{font-family:system-ui;background:#fff8e7;margin:0;padding:16px;max-width:640px;margin:auto}h1{text-align:center;color:#3a2e7a}
.p{background:#fff;border-radius:20px;padding:20px;margin:14px 0;font-size:1.4rem;box-shadow:0 2px 8px #0002;display:flex;gap:14px;align-items:center}.i{font-size:3rem}</style>
<h1>${esc(c.title)}</h1>${c.sentences.map((x) => `<div class=p><span class=i>${x.icon}</span><span>${esc(x.text)}</span></div>`).join('')}`;
}

// ---------- server ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')));
  try {
    if (url.pathname.startsWith('/api/')) {
      let b = {};
      if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        b = req.body; // pre-parsed by Vercel
      } else if (req.method !== 'GET' && req.method !== 'HEAD') {
        let body = typeof req.body === 'string' ? req.body : '';
        if (!body && req.body === undefined) {
          for await (const ch of req) {
            body += ch;
            if (body.length > 1e6) bad(413, 'Too large');
          }
        }
        b = body ? JSON.parse(body) : {};
      }
      const ctx = { tok: cookies.tok };
      const uid = readToken(cookies.tok); const user = uid ? get('SELECT id,name,role FROM users WHERE id=?', uid) : null;
      for (const r of routes) {
        if (r.m !== req.method) continue; const m = r.re.exec(url.pathname); if (!m) continue;
        if (!user && !r.public) bad(401, 'Login required');
        const out = r.fn(user, b, m.groups || {}, ctx);
        const h = { 'Content-Type': 'application/json' }; if (ctx.setCookie) h['Set-Cookie'] = ctx.setCookie;
        res.writeHead(200, h); return res.end(JSON.stringify(out));
      }
      bad(404, 'Unknown endpoint');
    }
    if (url.pathname.startsWith('/s/')) {
      const html = storyPage(url.pathname.slice(3));
      res.writeHead(html ? 200 : 404, { 'Content-Type': 'text/html' }); return res.end(html || 'Story not found');
    }
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
    const candidates = [
      path.join(__dirname, 'public', rel),
      path.join(__dirname, rel),
      path.join(process.cwd(), 'public', rel),
      path.join(process.cwd(), rel)
    ];
    let found = null;
    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) { found = c; break; }
    }
    if (!found) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(found)] || 'text/plain' }); res.end(fs.readFileSync(found));
  } catch (e) {
    const status = (typeof e.code === 'number' && e.code >= 100 && e.code <= 599) ? e.code : 500;
    res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message || 'Internal Server Error' }));
  }
}

module.exports = handler;
if (require.main === module) http.createServer(handler).listen(PORT, () => console.log(`EBA running at http://localhost:${PORT}`));
