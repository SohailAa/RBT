// Universal Database Layer:
// 1. Tries native node:sqlite (Node 24+ / experimental 22)
// 2. Automatically falls back to an in-memory SQL-compatible store if node:sqlite is unavailable in cloud runtimes.
// 3. Supports exportSnapshot() and importSnapshot() for Firebase Cloud Vault synchronization.

const fs = require('fs');
const path = require('path');

const IS_VERCEL = !!process.env.VERCEL;

let NativeDB = null;
if (!IS_VERCEL) {
  try {
    const mod = 'node:sqlite';
    NativeDB = require(mod).DatabaseSync;
  } catch (e) {
    NativeDB = null;
  }
}

const ALL_TABLES = [
  'users',
  'clients',
  'assignments',
  'goals',
  'plans',
  'stories',
  'appointments',
  'sessions',
  'trials',
  'authorizations',
  'abc_logs',
  'supervision_logs',
  'behavior_programs',
  'behavior_events',
  'session_events',
  'task_analyses',
  'fidelity_ioa_logs',
  'audit_logs',
  'leads',
  'facility_models',
  'facility_signups',
  'clinic_licenses',
  'client_assessments',
  'assessment_findings',
  'smart_goal_drafts'
];

function shouldReplaceMergedRow(curRow, incRow) {
  if (!curRow) return true;
  if (!incRow) return false;
  const curVer = Number(curRow.version) || 0;
  const incVer = Number(incRow.version) || 0;
  if (incVer !== curVer) return incVer > curVer;
  const curTs = String(curRow.updated_at || curRow.bcba_signed_at || curRow.rbt_signed_at || curRow.approved_at || curRow.end || '');
  const incTs = String(incRow.updated_at || incRow.bcba_signed_at || incRow.rbt_signed_at || incRow.approved_at || incRow.end || '');
  if (incTs && curTs && incTs !== curTs) return incTs > curTs;
  if (incTs && !curTs) return true;
  const curHistLen = String(curRow.edit_history_json || curRow.version_history_json || '').length;
  const incHistLen = String(incRow.edit_history_json || incRow.version_history_json || '').length;
  if (incHistLen !== curHistLen) return incHistLen > curHistLen;
  const curJsonLen = JSON.stringify(curRow).length;
  const incJsonLen = JSON.stringify(incRow).length;
  return incJsonLen >= curJsonLen;
}

function computeSnapshotSignature(tables) {
  if (!tables || typeof tables !== 'object') return '';
  const keys = ['users', 'clients', 'behavior_programs', 'appointments', 'sessions', 'goals', 'trials', 'behavior_events', 'abc_logs', 'smart_goal_drafts', 'assessment_findings'];
  return keys.map((k) => {
    const arr = Array.isArray(tables[k]) ? tables[k] : [];
    const maxId = arr.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
    const verSum = arr.reduce((s, r) => s + (Number(r.version) || 1), 0);
    return `${k}:${arr.length}:${maxId}:${verSum}`;
  }).join('|');
}

class MemoryDB {
  constructor() {
    this.tables = {};
    ALL_TABLES.forEach((t) => { this.tables[t] = []; });
    this.autoIds = {};
    this.deletedIds = {};
    this.revision = 1;
  }

  exec(sql) {
    // No-op for schema creation in memory
    return this;
  }

  exportSnapshot() {
    const tablesCopy = {};
    ALL_TABLES.forEach((t) => {
      tablesCopy[t] = (this.tables[t] || []).map((r) => ({ ...r }));
    });
    const deletedCopy = {};
    Object.keys(this.deletedIds || {}).forEach((t) => {
      if (Array.isArray(this.deletedIds[t]) && this.deletedIds[t].length) {
        deletedCopy[t] = [...this.deletedIds[t]];
      }
    });
    return {
      version: 1,
      revision: this.revision || 1,
      signature: computeSnapshotSignature(tablesCopy),
      exportedAt: new Date().toISOString(),
      autoIds: { ...this.autoIds },
      deletedIds: deletedCopy,
      tables: tablesCopy
    };
  }

  importSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.tables) return false;
    this.deletedIds = {};
    if (snapshot.deletedIds && typeof snapshot.deletedIds === 'object') {
      Object.keys(snapshot.deletedIds).forEach((t) => {
        if (Array.isArray(snapshot.deletedIds[t])) {
          this.deletedIds[t] = [...new Set(snapshot.deletedIds[t].map(Number))];
        }
      });
    }
    ALL_TABLES.forEach((t) => {
      if (Array.isArray(snapshot.tables[t])) {
        const delSet = new Set((this.deletedIds[t] || []).map(Number));
        this.tables[t] = snapshot.tables[t]
          .filter((r) => r.id === undefined || !delSet.has(Number(r.id)))
          .map((r) => ({ ...r }));
        const maxId = this.tables[t].reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
        this.autoIds[t] = Math.max(Number((snapshot.autoIds && snapshot.autoIds[t]) || 0), maxId);
      }
    });
    this.revision = Math.max(this.revision || 1, Number(snapshot.revision) || 1) + 1;
    return true;
  }

  mergeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.tables) return false;
    if (snapshot.deletedIds && typeof snapshot.deletedIds === 'object') {
      Object.keys(snapshot.deletedIds).forEach((t) => {
        if (Array.isArray(snapshot.deletedIds[t])) {
          this.deletedIds[t] = [...new Set([...(this.deletedIds[t] || []), ...snapshot.deletedIds[t].map(Number)])];
        }
      });
    }
    ALL_TABLES.forEach((t) => {
      const incRows = snapshot.tables[t];
      if (!Array.isArray(incRows)) return;
      const curRows = this.tables[t] || [];

      if (t === 'assignments') {
        const pairSet = new Set(curRows.map((r) => `${r.client_id}:${r.user_id}`));
        incRows.forEach((r) => {
          const key = `${r.client_id}:${r.user_id}`;
          if (r.client_id !== undefined && r.user_id !== undefined && !pairSet.has(key)) {
            curRows.push({ client_id: Number(r.client_id), user_id: Number(r.user_id) });
            pairSet.add(key);
          }
        });
        this.tables[t] = curRows;
        return;
      }

      const delSet = new Set((this.deletedIds[t] || []).map(Number));
      const keptCur = curRows.filter((r) => r.id === undefined || !delSet.has(Number(r.id)));
      const byId = new Map();
      const byEmail = t === 'users' ? new Map() : null;
      keptCur.forEach((r) => {
        if (r.id !== undefined) byId.set(Number(r.id), r);
        if (byEmail && r.email) byEmail.set(String(r.email).toLowerCase(), r);
      });

      incRows.forEach((inc) => {
        if (!inc || typeof inc !== 'object') return;
        const rid = inc.id !== undefined ? Number(inc.id) : null;
        if (rid !== null && delSet.has(rid)) return;
        if (byEmail && inc.email) {
          const em = String(inc.email).toLowerCase();
          const existingByEm = byEmail.get(em);
          if (existingByEm && Number(existingByEm.id) !== rid) {
            Object.assign(existingByEm, inc, { id: existingByEm.id });
            return;
          }
        }
        if (rid !== null && byId.has(rid)) {
          const cur = byId.get(rid);
          if (shouldReplaceMergedRow(cur, inc)) {
            const merged = { ...cur, ...inc };
            byId.set(rid, merged);
          }
        } else if (rid !== null) {
          const copy = { ...inc, id: rid };
          byId.set(rid, copy);
          if (byEmail && copy.email) byEmail.set(String(copy.email).toLowerCase(), copy);
        }
      });

      const mergedList = Array.from(byId.values()).sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      this.tables[t] = mergedList;
      const maxId = mergedList.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
      this.autoIds[t] = Math.max(this.autoIds[t] || 0, Number((snapshot.autoIds && snapshot.autoIds[t]) || 0), maxId);
    });
    this.revision = Math.max(this.revision || 1, Number(snapshot.revision) || 1) + 1;
    return true;
  }

  prepare(sql) {
    const s = sql.trim().replace(/\s+/g, ' ');

    // 1. SELECT COUNT(*) c FROM <table> [WHERE ...]
    const countMatch = /^SELECT COUNT\(\*\) c FROM (\w+)(?: WHERE (.*))?$/i.exec(s);
    if (countMatch) {
      const [, table, where] = countMatch;
      return {
        all: (...args) => [{ c: this._filter(table, where, args).length }],
        get: (...args) => ({ c: this._filter(table, where, args).length }),
        run: () => ({ changes: 0 })
      };
    }

    // 2. INSERT INTO <table> [(<cols>)] VALUES(<placeholders>)
    const insertMatch = /^INSERT INTO (\w+)(?:\(([^)]+)\))? VALUES\(([^)]+)\)$/i.exec(s);
    if (insertMatch) {
      const [, table, colsStr] = insertMatch;
      const cols = colsStr ? colsStr.split(',').map(c => c.trim()) : null;
      return {
        run: (...args) => {
          this.autoIds[table] = (this.autoIds[table] || 0) + 1;
          const DEFAULTS = {
            users: {
              firebase_uid: '',
              created_at: ''
            },
            goals: {
              status: 'active',
              domain: 'DTT / Skill Acquisition',
              prompt_strategy: 'Least-to-Most',
              scoring_rule: 'independent_only',
              mastery_sessions: 3,
              operational_definition: '',
              onset_criteria: '',
              offset_criteria: '',
              examples: '',
              non_examples: '',
              measurement_type: 'trial_by_trial',
              secondary_measurement: '',
              data_fields_json: '[]',
              linked_finding_id: null,
              approved_by: '',
              approved_at: '',
              configured_prompts: 'I,V,G'
            },
            client_assessments: {
              edition: '',
              assessor_name: '',
              assessor_role: 'BCBA',
              assessment_date: '',
              report_date: '',
              status: 'Completed',
              notes: '',
              created_at: ''
            },
            assessment_findings: {
              assessment_id: null,
              assessment_name: 'VB-MAPP',
              domain: 'Requests (Mands)',
              finding_text: '',
              result_value: '',
              evidence_source: 'Clinician Observation & Assessment Protocol',
              context: 'Clinic / Home',
              strengths: '',
              support_needs: '',
              missing_info_flag: '',
              priority_status: 'priority_goal',
              entered_by: '',
              created_at: ''
            },
            smart_goal_drafts: {
              finding_id: null,
              goal_type: 'skill_acquisition',
              raw_goal_text: '',
              refined_goal_text: '',
              domain: 'Skill Acquisition',
              operational_definition: '',
              onset_criteria: '',
              offset_criteria: '',
              episode_rule: '',
              examples: '',
              non_examples: '',
              exclusions: '',
              primary_measurement: 'trial_by_trial',
              secondary_measurement: '',
              measurement_rationale: '',
              data_fields_json: '[]',
              sample_rows_json: '[]',
              clarity_json: '{}',
              baseline_data: '',
              mastery_criteria: '',
              measurement_methods_json: '[]',
              status: 'draft',
              created_by: '',
              approved_by: '',
              approved_at: '',
              activated_entity_type: '',
              activated_entity_id: null,
              created_at: ''
            },
            plans: { status: 'draft' },
            stories: { status: 'draft' },
            sessions: {
              note: '',
              note_status: 'none',
              attendance_status: 'Completed',
              barriers: '',
              breaks_count: 0,
              break_started_at: '',
              pauses_count: 0,
              pause_started_at: '',
              total_break_sec: 0,
              total_pause_sec: 0
            },
            trials: {
              trial_type: 'acquisition',
              notes: '',
              observed_at: '',
              recorded_at: '',
              original_value_json: '',
              edit_history_json: '[]'
            },
            authorizations: { used: 0 },
            abc_logs: {
              setting: 'School',
              activity: 'Structured Tabletop',
              people_present: 'RBT, Peer',
              intensity: 'Moderate',
              duration_sec: 0,
              start_ts: '',
              end_ts: '',
              observed_at: '',
              recorded_at: '',
              original_value_json: '',
              edit_history_json: '[]'
            },
            behavior_programs: {
              status: 'active',
              measurement_type: 'frequency',
              function_hypothesis: 'Escape',
              intensity_criteria: 'Mild: Vocal protest <30s; Moderate: Loud screaming 30s-3m; Severe: >3m or disruption',
              onset_criteria: '',
              offset_criteria: '',
              examples: '',
              non_examples: '',
              baseline_data: '',
              baseline_rate: 0,
              target_rate: 0,
              reduction_goal: '',
              replacement_skill_goal: '',
              mastery_criteria: '',
              measurement_methods_json: '[]',
              version: 1,
              version_history_json: '[]',
              updated_at: '',
              updated_by: ''
            },
            behavior_events: {
              count: 1,
              duration_sec: 0,
              latency_sec: 0,
              irt_sec: 0,
              interval_total: 0,
              interval_occurred: 0,
              intensity: 'Moderate',
              setting: 'School',
              activity: 'Structured Tabletop',
              people_present: 'RBT, Peer',
              notes: '',
              definition_version: 1,
              definition_snapshot: '',
              start_ts: '',
              end_ts: '',
              observed_at: '',
              recorded_at: '',
              original_value_json: '',
              edit_history_json: '[]'
            },
            session_events: {
              client_id: null,
              session_id: null,
              event_type: 'BEHAVIOR_EVENT',
              ref_entity_type: '',
              ref_entity_id: null,
              label: '',
              start_ts: '',
              end_ts: '',
              duration_sec: 0,
              observed_at: '',
              recorded_at: '',
              value_json: '{}',
              original_value_json: '{}',
              edit_history_json: '[]',
              user_id: null,
              user_name: ''
            },
            task_analyses: { status: 'active', chaining_type: 'Forward Chaining', steps_json: '[]', logs_json: '[]' },
            fidelity_ioa_logs: { log_type: 'both', fidelity_pct: 100, ioa_pct: 100, data_json: '{}', notes: '' },
            facility_models: { is_default: 0, config_json: '{}', updated_at: '' },
            facility_signups: { enrollment_status: 'committed', target_month: 1, notes: '' },
            clinic_licenses: {
              tier: 'growth',
              status: 'active',
              base_fee: 599,
              max_clients: 40,
              per_client_fee: 15,
              max_seats: 20,
              per_seat_fee: 24,
              billing_cycle: 'annual',
              is_primary: 0,
              msa_signed_by: '',
              msa_signed_at: '',
              baa_signed_by: '',
              baa_signed_at: '',
              eula_accepted_by: '',
              eula_accepted_at: '',
              notes: ''
            }
          };
          const row = { id: this.autoIds[table], ...(DEFAULTS[table] || {}) };
          if (cols) {
            cols.forEach((col, i) => { row[col] = args[i]; });
          } else {
            // implicit columns
            if (table === 'assignments') { row.client_id = args[0]; row.user_id = args[1]; }
          }
          if (row.id !== undefined && Number(row.id) > (this.autoIds[table] || 0)) {
            this.autoIds[table] = Number(row.id);
          }
          (this.tables[table] ||= []).push(row);
          this.revision = (this.revision || 1) + 1;
          return { lastInsertRowid: row.id, changes: 1 };
        },
        all: () => [],
        get: () => null
      };
    }

    // 3. UPDATE <table> SET <sets> WHERE <where>
    const updateMatch = /^UPDATE (\w+) SET (.+) WHERE (.+)$/i.exec(s);
    if (updateMatch) {
      const [, table, setsStr, whereStr] = updateMatch;
      return {
        run: (...args) => {
          const setQuestionCount = (setsStr.match(/\?/g) || []).length;
          const rows = this._filter(table, whereStr, args.slice(setQuestionCount));
          // Parse assignments
          const setPairs = setsStr.split(',').map(p => p.trim());
          rows.forEach(row => {
            let argIdx = 0;
            setPairs.forEach(pair => {
              const [col, valExpr] = pair.split('=').map(x => x.trim());
              if (valExpr === '?') {
                row[col] = args[argIdx++];
              } else if (valExpr.includes('+ ?')) {
                row[col] = (Number(row[col]) || 0) + Number(args[argIdx++]);
              } else if (valExpr === 'NULL') {
                row[col] = null;
              } else if (valExpr.startsWith("'") && valExpr.endsWith("'")) {
                row[col] = valExpr.slice(1, -1);
              }
            });
          });
          if (rows.length > 0) this.revision = (this.revision || 1) + 1;
          return { changes: rows.length };
        }
      };
    }

    // 4. DELETE FROM <table> WHERE <where>
    const deleteMatch = /^DELETE FROM (\w+) WHERE (.+)$/i.exec(s);
    if (deleteMatch) {
      const [, table, whereStr] = deleteMatch;
      return {
        run: (...args) => {
          const list = this.tables[table] || [];
          const before = list.length;
          const toKeep = [];
          list.forEach((r) => {
            if (this._matches(r, whereStr, args)) {
              if (r && r.id !== undefined) {
                if (!this.deletedIds[table]) this.deletedIds[table] = [];
                if (!this.deletedIds[table].includes(Number(r.id))) {
                  this.deletedIds[table].push(Number(r.id));
                }
              }
            } else {
              toKeep.push(r);
            }
          });
          this.tables[table] = toKeep;
          if (before !== toKeep.length) this.revision = (this.revision || 1) + 1;
          return { changes: before - toKeep.length };
        }
      };
    }

    // 5. General SELECT
    return {
      all: (...args) => this._query(s, args),
      get: (...args) => this._query(s, args)[0] || null,
      run: () => ({ changes: 0 })
    };
  }

  _filter(table, whereStr, args) {
    const list = this.tables[table] || [];
    if (!whereStr) return [...list];
    return list.filter(r => this._matches(r, whereStr, args));
  }

  _matches(row, whereStr, args) {
    if (!whereStr) return true;
    let argIdx = 0;
    const parts = whereStr.split(/ AND /i);
    for (const part of parts) {
      const p = part.trim();
      if (p.includes('=')) {
        let [col, val] = p.split('=').map(x => x.trim());
        if (col.includes('.')) col = col.split('.').pop();
        const expected = val === '?' ? args[argIdx++] : (val.startsWith("'") ? val.slice(1, -1) : Number(val));
        if (String(row[col] ?? '') !== String(expected ?? '')) return false;
      } else if (p.includes('LIKE')) {
        let [col] = p.split(/ LIKE /i).map(x => x.trim());
        if (col.includes('.')) col = col.split('.').pop();
        const pattern = args[argIdx++];
        const prefix = pattern.replace(/[%_]/g, '');
        if (!String(row[col] || '').startsWith(prefix)) return false;
      } else if (p.includes('IN')) {
        const match = /(\w+(?:\.\w+)?)\s+IN\s+\(([^)]+)\)/i.exec(p);
        if (match) {
          let [, rawCol, listStr] = match;
          const col = rawCol.includes('.') ? rawCol.split('.').pop() : rawCol;
          const allowed = listStr.split(',').map(x => x.trim().replace(/'/g, ''));
          if (!allowed.includes(String(row[col] || ''))) return false;
        }
      } else if (p.includes('IS NOT NULL')) {
        let col = p.replace(/\s+IS NOT NULL/i, '').trim();
        if (col.includes('.')) col = col.split('.').pop();
        if (row[col] === null || row[col] === undefined || row[col] === '') return false;
      }
    }
    return true;
  }

  _query(sql, args) {
    // Specialized queries in EBA platform
    if (sql.includes('FROM clients c JOIN assignments a')) {
      const uid = args[0];
      const assignedClientIds = (this.tables.assignments || []).filter(a => a.user_id === uid).map(a => a.client_id);
      return (this.tables.clients || []).filter(c => assignedClientIds.includes(c.id)).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (sql.includes('FROM appointments a JOIN clients c')) {
      const appointments = this.tables.appointments || [];
      const clients = Object.fromEntries((this.tables.clients || []).map(c => [c.id, c]));
      const users = Object.fromEntries((this.tables.users || []).map(u => [u.id, u]));
      let res = appointments.map(a => ({
        ...a,
        client: (clients[a.client_id] || {}).name || '',
        staff: (users[a.user_id] || {}).name || '',
        staff_name: (users[a.user_id] || {}).name || '',
        staff_role: (users[a.user_id] || {}).role || a.role || 'RBT'
      }));
      if (sql.includes('WHERE a.start < ? AND a.start LIKE ?')) {
        const nowStr = String(args[0] || '');
        const pref = String(args[1] || '').replace(/%/g, '');
        res = res.filter(a => String(a.start || '') < nowStr && String(a.start || '').startsWith(pref));
      } else if (sql.includes('WHERE a.start LIKE ? AND a.user_id=?')) {
        const pref = (args[0] || '').replace(/%/g, '');
        const uid = Number(args[1]);
        res = res.filter(a => String(a.start || '').startsWith(pref) && Number(a.user_id) === uid);
      } else if (sql.includes('WHERE a.start LIKE ?')) {
        const pref = (args[0] || '').replace(/%/g, '');
        res = res.filter(a => String(a.start || '').startsWith(pref));
      }
      return res.sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));
    }
    if (sql.includes('FROM authorizations a JOIN clients c')) {
      const auths = this.tables.authorizations || [];
      const clients = Object.fromEntries((this.tables.clients || []).map(c => [c.id, c]));
      return auths.map(a => ({
        ...a,
        client: (clients[a.client_id] || {}).name || ''
      }));
    }
    if (sql.includes('FROM assignments a JOIN clients c')) {
      const assignments = this.tables.assignments || [];
      const clients = Object.fromEntries((this.tables.clients || []).map(c => [c.id, c]));
      return assignments.map(a => ({
        ...a,
        client_name: (clients[a.client_id] || {}).name || ''
      }));
    }
    if (sql.includes('FROM assignments a JOIN users u')) {
      const users = Object.fromEntries((this.tables.users || []).map(u => [u.id, u]));
      let list = this.tables.assignments || [];
      if (sql.includes('WHERE a.client_id=?')) {
        const cid = Number(args[0]);
        list = list.filter(a => Number(a.client_id) === cid);
      }
      return list.map(a => {
        const usr = users[a.user_id] || {};
        return {
          client_id: a.client_id,
          user_id: a.user_id,
          id: usr.id,
          name: usr.name || '',
          user_name: usr.name || '',
          user_role: usr.role || 'RBT'
        };
      });
    }
    if (sql.includes('FROM task_analyses ta JOIN clients c')) {
      const tas = this.tables.task_analyses || [];
      const clients = Object.fromEntries((this.tables.clients || []).map(c => [c.id, c]));
      return tas.filter(ta => !sql.includes("ta.status='active'") || ta.status === 'active').map(ta => ({
        ...ta,
        client_name: (clients[ta.client_id] || {}).name || ''
      }));
    }
    if (sql.includes('FROM sessions s JOIN clients c')) {
      let sessions = (this.tables.sessions || []).filter(s => s.end !== null && s.end !== undefined);
      if (sql.includes('WHERE s.start LIKE ?')) {
        const pref = (args[0] || '').replace(/%/g, '');
        sessions = (this.tables.sessions || []).filter(s => String(s.start || '').startsWith(pref));
      }
      const clients = Object.fromEntries((this.tables.clients || []).map(c => [c.id, c]));
      const users = Object.fromEntries((this.tables.users || []).map(u => [u.id, u]));
      return sessions.map(s => ({
        ...s,
        client: (clients[s.client_id] || {}).name || '',
        rbt: (users[s.user_id] || {}).name || ''
      })).sort((a,b) => b.id - a.id);
    }
    if (sql.includes('FROM supervision_logs s JOIN clients c')) {
      const logs = this.tables.supervision_logs || [];
      const clients = Object.fromEntries((this.tables.clients || []).map(c => [c.id, c]));
      const users = Object.fromEntries((this.tables.users || []).map(u => [u.id, u]));
      return logs.map(s => ({
        ...s,
        client: (clients[s.client_id] || {}).name || '',
        bcba: (users[s.bcba_id] || {}).name || '',
        rbt: (users[s.rbt_id] || {}).name || ''
      })).sort((a,b) => b.id - a.id);
    }
    if (sql.includes('FROM supervision_logs s JOIN users u')) {
      const logs = this.tables.supervision_logs || [];
      const users = Object.fromEntries((this.tables.users || []).map(u => [u.id, u]));
      let res = logs.map(s => ({
        ...s,
        bcba: (users[s.bcba_id] || {}).name || '',
        rbt: (users[s.rbt_id] || {}).name || ''
      }));
      if (sql.includes('WHERE s.client_id=?')) {
        res = res.filter(s => Number(s.client_id) === Number(args[0]));
      }
      return res.sort((a, b) => b.id - a.id);
    }
    if (sql.includes('FROM abc_logs a JOIN users u')) {
      const logs = this.tables.abc_logs || [];
      const users = Object.fromEntries((this.tables.users || []).map(u => [u.id, u]));
      let res = logs.map(a => ({
        ...a,
        staff: (users[a.user_id] || {}).name || ''
      }));
      if (sql.includes('WHERE a.client_id=?')) {
        res = res.filter(a => Number(a.client_id) === Number(args[0]));
      } else if (sql.includes('WHERE a.session_id=?')) {
        res = res.filter(a => Number(a.session_id) === Number(args[0]));
      }
      return res.sort((a, b) => b.id - a.id);
    }

    // Single-table query
    const tableMatch = /FROM (\w+)/i.exec(sql);
    if (!tableMatch) return [];
    const table = tableMatch[1];
    let whereStr = null;
    const whereMatch = /WHERE (.+?)(?: ORDER BY| LIMIT|$)/i.exec(sql);
    if (whereMatch) whereStr = whereMatch[1];

    let rows = this._filter(table, whereStr, args);
    if (sql.includes('ORDER BY name')) {
      rows.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sql.includes('ORDER BY id DESC')) {
      rows.sort((a,b) => b.id - a.id);
    } else if (sql.includes('ORDER BY id ASC') || sql.includes('ORDER BY id')) {
      rows.sort((a,b) => a.id - b.id);
    } else if (sql.includes('ORDER BY session_id')) {
      rows.sort((a,b) => a.session_id - b.session_id);
    } else if (sql.includes('ORDER BY start')) {
      rows.sort((a,b) => String(a.start || '').localeCompare(String(b.start || '')));
    }
    if (sql.includes('LIMIT 1')) {
      return rows.slice(0, 1);
    }
    return rows;
  }
}

function attachNativeSnapshotMethods(nativeDb) {
  nativeDb._deletedIds = {};
  nativeDb._revision = 1;

  nativeDb.exportSnapshot = function () {
    const tablesCopy = {};
    const autoIds = {};
    ALL_TABLES.forEach((t) => {
      try {
        const rows = nativeDb.prepare(`SELECT * FROM ${t}`).all();
        tablesCopy[t] = rows.map((r) => ({ ...r }));
        autoIds[t] = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
      } catch (e) {
        tablesCopy[t] = [];
        autoIds[t] = 0;
      }
    });
    return {
      version: 1,
      revision: nativeDb._revision || 1,
      signature: computeSnapshotSignature(tablesCopy),
      exportedAt: new Date().toISOString(),
      autoIds,
      deletedIds: { ...(nativeDb._deletedIds || {}) },
      tables: tablesCopy
    };
  };

  nativeDb.importSnapshot = function (snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.tables) return false;
    try {
      if (snapshot.deletedIds && typeof snapshot.deletedIds === 'object') {
        Object.keys(snapshot.deletedIds).forEach((t) => {
          if (Array.isArray(snapshot.deletedIds[t])) {
            nativeDb._deletedIds[t] = [...new Set([...(nativeDb._deletedIds[t] || []), ...snapshot.deletedIds[t].map(Number)])];
          }
        });
      }
      nativeDb.exec('PRAGMA foreign_keys = OFF');
      ALL_TABLES.forEach((t) => {
        const rows = snapshot.tables[t];
        if (!Array.isArray(rows) || !rows.length) return;
        try {
          const colsInfo = nativeDb.prepare(`PRAGMA table_info(${t})`).all();
          const validCols = colsInfo.map((c) => c.name);
          if (!validCols.length) return;
          const delSet = new Set((nativeDb._deletedIds[t] || []).map(Number));
          nativeDb.prepare(`DELETE FROM ${t}`).run();
          rows.forEach((r) => {
            if (r.id !== undefined && delSet.has(Number(r.id))) return;
            const rowCols = validCols.filter((c) => r[c] !== undefined);
            if (!rowCols.length) return;
            const placeholders = rowCols.map(() => '?').join(',');
            const stmt = nativeDb.prepare(`INSERT INTO ${t}(${rowCols.join(',')}) VALUES(${placeholders})`);
            stmt.run(...rowCols.map((c) => r[c]));
          });
        } catch (e) {}
      });
      nativeDb.exec('PRAGMA foreign_keys = ON');
      nativeDb._revision = Math.max(nativeDb._revision || 1, Number(snapshot.revision) || 1) + 1;
      return true;
    } catch (e) {
      return false;
    }
  };

  nativeDb.mergeSnapshot = function (snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.tables) return false;
    const currentSnap = nativeDb.exportSnapshot();
    const tempMem = new MemoryDB();
    tempMem.importSnapshot(currentSnap);
    tempMem.mergeSnapshot(snapshot);
    return nativeDb.importSnapshot(tempMem.exportSnapshot());
  };

  return nativeDb;
}

function createDatabase(dbPath) {
  if (NativeDB) {
    try {
      const db = new NativeDB(dbPath);
      return attachNativeSnapshotMethods(db);
    } catch (e) {
      console.warn('Native SQLite failed to open at', dbPath, e.message);
    }
  }
  console.log('Using in-memory database adapter (zero-dependency cloud mode)');
  return new MemoryDB();
}

module.exports = { createDatabase, MemoryDB, ALL_TABLES, computeSnapshotSignature };
