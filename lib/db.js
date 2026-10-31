// Universal Database Layer:
// 1. Tries native node:sqlite (Node 24+ / experimental 22)
// 2. Automatically falls back to an in-memory SQL-compatible store if node:sqlite is unavailable in cloud runtimes.

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

class MemoryDB {
  constructor() {
    this.tables = {
      users: [],
      clients: [],
      assignments: [],
      goals: [],
      plans: [],
      stories: [],
      appointments: [],
      sessions: [],
      trials: [],
      authorizations: [],
      abc_logs: [],
      supervision_logs: [],
      behavior_programs: [],
      behavior_events: [],
      task_analyses: [],
      fidelity_ioa_logs: [],
      audit_logs: [],
      leads: [],
      facility_models: [],
      facility_signups: [],
      clinic_licenses: []
    };
    this.autoIds = {};
  }

  exec(sql) {
    // No-op for schema creation in memory
    return this;
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
            goals: { status: 'active', domain: 'DTT / Skill Acquisition', prompt_strategy: 'Least-to-Most', scoring_rule: 'independent_only', mastery_sessions: 3 },
            plans: { status: 'draft' },
            stories: { status: 'draft' },
            sessions: { note: '', note_status: 'none', attendance_status: 'Completed', barriers: '' },
            trials: { trial_type: 'acquisition', notes: '' },
            authorizations: { used: 0 },
            behavior_programs: { status: 'active', measurement_type: 'frequency', function_hypothesis: 'Escape', intensity_criteria: 'Mild: Vocal protest <30s; Moderate: Loud screaming 30s-3m; Severe: >3m or disruption' },
            behavior_events: { count: 1, duration_sec: 0, latency_sec: 0, irt_sec: 0, interval_total: 0, interval_occurred: 0, intensity: 'Moderate', setting: 'School', activity: 'Structured Tabletop', people_present: 'RBT, Peer', notes: '' },
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
          (this.tables[table] ||= []).push(row);
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
          return { changes: rows.length };
        }
      };
    }

    // 4. DELETE FROM trials WHERE id=?
    const deleteMatch = /^DELETE FROM (\w+) WHERE (.+)$/i.exec(s);
    if (deleteMatch) {
      const [, table, whereStr] = deleteMatch;
      return {
        run: (...args) => {
          const before = (this.tables[table] || []).length;
          const toKeep = this.tables[table].filter(r => !this._matches(r, whereStr, args));
          this.tables[table] = toKeep;
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
        staff: (users[a.user_id] || {}).name || ''
      }));
      if (sql.includes('WHERE a.start LIKE ?')) {
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
    if (sql.includes('FROM assignments a JOIN users u')) {
      const cid = args[0];
      const userIds = (this.tables.assignments || []).filter(a => a.client_id === cid).map(a => a.user_id);
      return (this.tables.users || []).filter(u => userIds.includes(u.id)).map(u => ({ id: u.id, name: u.name }));
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
    } else if (sql.includes('ORDER BY session_id')) {
      rows.sort((a,b) => a.session_id - b.session_id);
    }
    if (sql.includes('LIMIT 1')) {
      return rows.slice(0, 1);
    }
    return rows;
  }
}

function createDatabase(dbPath) {
  if (NativeDB) {
    try {
      return new NativeDB(dbPath);
    } catch (e) {
      console.warn('Native SQLite failed to open at', dbPath, e.message);
    }
  }
  console.log('Using in-memory database adapter (zero-dependency cloud mode)');
  return new MemoryDB();
}

module.exports = { createDatabase, MemoryDB };
