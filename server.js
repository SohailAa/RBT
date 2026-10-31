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
const dbPath = process.env.EBA_DB_PATH || path.join(__dirname, 'eba.db');
const db = ON_VERCEL ? new MemoryDB() : createDatabase(dbPath);
const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-change-me';
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, pw TEXT, role TEXT);
CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY, name TEXT, dob TEXT, diagnosis TEXT, guardian TEXT, school TEXT, emergency TEXT, insurance TEXT, reinforcers TEXT, sensory TEXT, triggers TEXT, communication TEXT, crisis_plan TEXT, parent_id INTEGER);
CREATE TABLE IF NOT EXISTS assignments(client_id INTEGER, user_id INTEGER);
CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, client_id INTEGER, title TEXT, baseline INTEGER, target INTEGER, status TEXT DEFAULT 'active', domain TEXT DEFAULT 'DTT / Skill Acquisition', prompt_strategy TEXT DEFAULT 'Least-to-Most', scoring_rule TEXT DEFAULT 'independent_only', mastery_sessions INTEGER DEFAULT 3);
CREATE TABLE IF NOT EXISTS plans(id INTEGER PRIMARY KEY, client_id INTEGER, behavior TEXT, data TEXT, status TEXT DEFAULT 'draft', approved_by TEXT);
CREATE TABLE IF NOT EXISTS stories(id INTEGER PRIMARY KEY, client_id INTEGER, inputs TEXT, content TEXT, status TEXT DEFAULT 'draft', approved_by TEXT, token TEXT);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY, client_id INTEGER, user_id INTEGER, start TEXT, end TEXT, role TEXT, setting TEXT);
CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY, appointment_id INTEGER, client_id INTEGER, user_id INTEGER, start TEXT, end TEXT, units INTEGER, note TEXT DEFAULT '', note_status TEXT DEFAULT 'none', signed_by TEXT, submitted_by TEXT, rbt_signed_at TEXT, bcba_signed_at TEXT, attendance_status TEXT DEFAULT 'Completed', barriers TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS trials(id INTEGER PRIMARY KEY, session_id INTEGER, goal_id INTEGER, level TEXT, ts TEXT, trial_type TEXT DEFAULT 'acquisition', notes TEXT DEFAULT '', user_id INTEGER);
CREATE TABLE IF NOT EXISTS authorizations(id INTEGER PRIMARY KEY, client_id INTEGER, code TEXT, authorized INTEGER, used INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS abc_logs(id INTEGER PRIMARY KEY, client_id INTEGER, session_id INTEGER, user_id INTEGER, ts TEXT, antecedent TEXT, behavior TEXT, consequence TEXT, perceived_function TEXT, notes TEXT, setting TEXT DEFAULT 'School', activity TEXT DEFAULT 'Structured Tabletop', people_present TEXT DEFAULT 'RBT, Peer', intensity TEXT DEFAULT 'Moderate', duration_sec INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS supervision_logs(id INTEGER PRIMARY KEY, client_id INTEGER, bcba_id INTEGER, rbt_id INTEGER, session_id INTEGER, ts TEXT, minutes INTEGER, type TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS behavior_programs(id INTEGER PRIMARY KEY, client_id INTEGER, name TEXT, definition TEXT, measurement_type TEXT DEFAULT 'frequency', function_hypothesis TEXT DEFAULT 'Escape', intensity_criteria TEXT, status TEXT DEFAULT 'active');
CREATE TABLE IF NOT EXISTS behavior_events(id INTEGER PRIMARY KEY, client_id INTEGER, session_id INTEGER, behavior_id INTEGER, behavior_name TEXT, user_id INTEGER, ts TEXT, measurement_type TEXT DEFAULT 'frequency', count INTEGER DEFAULT 1, duration_sec INTEGER DEFAULT 0, latency_sec INTEGER DEFAULT 0, irt_sec INTEGER DEFAULT 0, interval_total INTEGER DEFAULT 0, interval_occurred INTEGER DEFAULT 0, intensity TEXT DEFAULT 'Moderate', setting TEXT DEFAULT 'School', activity TEXT DEFAULT 'Structured Tabletop', people_present TEXT DEFAULT 'RBT, Peer', notes TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS task_analyses(id INTEGER PRIMARY KEY, client_id INTEGER, title TEXT, chaining_type TEXT DEFAULT 'Forward Chaining', steps_json TEXT DEFAULT '[]', logs_json TEXT DEFAULT '[]', status TEXT DEFAULT 'active');
CREATE TABLE IF NOT EXISTS fidelity_ioa_logs(id INTEGER PRIMARY KEY, client_id INTEGER, session_id INTEGER, bcba_id INTEGER, rbt_id INTEGER, ts TEXT, log_type TEXT DEFAULT 'both', fidelity_pct INTEGER DEFAULT 100, ioa_pct INTEGER DEFAULT 100, data_json TEXT DEFAULT '{}', notes TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY, ts TEXT, user_id INTEGER, user_name TEXT, client_id INTEGER, session_id INTEGER, entity_type TEXT, entity_id INTEGER, action TEXT, details TEXT);
CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT, clinic_name TEXT, caseload_size TEXT, current_software TEXT, message TEXT, status TEXT DEFAULT 'new', notes TEXT DEFAULT '', created_at TEXT);
CREATE TABLE IF NOT EXISTS facility_models(id INTEGER PRIMARY KEY, name TEXT, subtitle TEXT, is_default INTEGER DEFAULT 0, config_json TEXT DEFAULT '{}', updated_at TEXT);
CREATE TABLE IF NOT EXISTS facility_signups(id INTEGER PRIMARY KEY, child_name TEXT, age INTEGER, diagnosis TEXT, tier TEXT, weekly_hours INTEGER, payer TEXT, cohort TEXT, gym_track TEXT, enrollment_status TEXT DEFAULT 'committed', target_month INTEGER DEFAULT 1, notes TEXT DEFAULT '');
`);
try { db.exec("ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'new'"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN notes TEXT DEFAULT ''"); } catch (e) {}
try { db.exec('ALTER TABLE clients ADD COLUMN communication TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE clients ADD COLUMN crisis_plan TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sessions ADD COLUMN submitted_by TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sessions ADD COLUMN rbt_signed_at TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sessions ADD COLUMN bcba_signed_at TEXT'); } catch (e) {}
try { db.exec("ALTER TABLE sessions ADD COLUMN attendance_status TEXT DEFAULT 'Completed'"); } catch (e) {}
try { db.exec("ALTER TABLE sessions ADD COLUMN barriers TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN domain TEXT DEFAULT 'DTT / Skill Acquisition'"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN prompt_strategy TEXT DEFAULT 'Least-to-Most'"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN scoring_rule TEXT DEFAULT 'independent_only'"); } catch (e) {}
try { db.exec('ALTER TABLE goals ADD COLUMN mastery_sessions INTEGER DEFAULT 3'); } catch (e) {}
try { db.exec("ALTER TABLE trials ADD COLUMN trial_type TEXT DEFAULT 'acquisition'"); } catch (e) {}
try { db.exec("ALTER TABLE trials ADD COLUMN notes TEXT DEFAULT ''"); } catch (e) {}
try { db.exec('ALTER TABLE trials ADD COLUMN user_id INTEGER'); } catch (e) {}
try { db.exec("ALTER TABLE abc_logs ADD COLUMN setting TEXT DEFAULT 'School'"); } catch (e) {}
try { db.exec("ALTER TABLE abc_logs ADD COLUMN activity TEXT DEFAULT 'Structured Tabletop'"); } catch (e) {}
try { db.exec("ALTER TABLE abc_logs ADD COLUMN people_present TEXT DEFAULT 'RBT, Peer'"); } catch (e) {}
try { db.exec("ALTER TABLE abc_logs ADD COLUMN intensity TEXT DEFAULT 'Moderate'"); } catch (e) {}
try { db.exec('ALTER TABLE abc_logs ADD COLUMN duration_sec INTEGER DEFAULT 0'); } catch (e) {}

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
const logAudit = (u, { client_id = null, session_id = null, entity_type = 'record', entity_id = null, action = 'UPDATE', details = '' } = {}) => {
  try {
    run('INSERT INTO audit_logs(ts,user_id,user_name,client_id,session_id,entity_type,entity_id,action,details) VALUES(?,?,?,?,?,?,?,?,?)',
      new Date().toISOString(), u ? u.id : 0, u ? u.name : 'System', client_id, session_id, entity_type, entity_id, action, details);
  } catch (e) {}
};
// Stateless signed tokens (work across serverless instances): uid.expiry.hmac
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
const makeToken = (uid) => { const p = `${uid}.${Date.now() + 8 * 3600e3}`; return `${p}.${sign(p)}`; };
const readToken = (t) => {
  const [uid, exp, sig] = (t || '').split('.');
  if (!sig || sign(`${uid}.${exp}`) !== sig || Date.now() > +exp) return null;
  return +uid;
};

function seed() {
  const bcba = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Dr. Dana Rivera, BCBA', 'bcba@eba.test', hash('password'), 'BCBA').lastInsertRowid;
  const owner = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Sarah Jenkins', 'owner@eba.test', hash('password'), 'OWNER').lastInsertRowid;
  const admin = run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Marcus Vance', 'admin@eba.test', hash('password'), 'ADMIN').lastInsertRowid;
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
  const g1 = run('INSERT INTO goals(client_id,title,baseline,target,domain,prompt_strategy,scoring_rule,mastery_sessions) VALUES(?,?,?,?,?,?,?,?)', el, 'Following teacher directions', 32, 80, 'DTT / Skill Acquisition', 'Least-to-Most', 'independent_only', 3).lastInsertRowid;
  const g2 = run('INSERT INTO goals(client_id,title,baseline,target,domain,prompt_strategy,scoring_rule,mastery_sessions) VALUES(?,?,?,?,?,?,?,?)', el, 'Waiting for a turn', 20, 80, 'Social & Play Skills', 'Most-to-Least', 'independent_only', 3).lastInsertRowid;
  const g3 = run('INSERT INTO goals(client_id,title,baseline,target,domain,prompt_strategy,scoring_rule,mastery_sessions) VALUES(?,?,?,?,?,?,?,?)', el, 'Requesting sensory break ("Break please")', 15, 80, 'Communication & Language (Mand / Tact / Intraverbal / AAC / PECS)', 'Time Delay', 'independent_only', 3).lastInsertRowid;
  const gLe1 = run('INSERT INTO goals(client_id,title,baseline,target,domain,prompt_strategy,scoring_rule,mastery_sessions) VALUES(?,?,?,?,?,?,?,?)', le, 'Asking for help', 10, 70, 'Communication & Language (Mand / Tact / Intraverbal / AAC / PECS)', 'Least-to-Most', 'independent_only', 3).lastInsertRowid;
  run('INSERT INTO goals(client_id,title,baseline,target,domain,prompt_strategy,scoring_rule,mastery_sessions) VALUES(?,?,?,?,?,?,?,?)', le, 'Transitioning from train table with visual timer', 20, 80, 'Emotional Regulation & Coping', 'Least-to-Most', 'independent_only', 3);

  run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,?)', el, '97153', 480, 440);
  run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,?)', el, '97155', 40, 12);
  run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,?)', le, '97153', 400, 120);
  // appointments today
  const day = getLocalDate();
  const mk = (cid, uid, s, e, role, setting) => run('INSERT INTO appointments(client_id,user_id,start,end,role,setting) VALUES(?,?,?,?,?,?)', cid, uid, `${day}T${s}`, `${day}T${e}`, role, setting);
  mk(el, rbt, '09:00', '12:00', 'RBT', 'School'); mk(le, rbt, '15:00', '17:00', 'RBT', 'Home'); mk(el, bcba, '17:00', '18:00', 'BCBA', 'Home');

  // Past sessions for Eleanor showing Mastery on g1 (≥80% x 3), Plateau/Stall on g2 (~20% x 3), and Improving trend on g3
  const g1Mixes = [
    [['I', 5], ['V', 1]],              // 83% Independent (5/6)
    [['I', 6], ['G', 1]],              // 86% Independent (6/7)
    [['I', 9], ['V', 1]]               // 90% Independent (9/10) -> Mastery Criteria Met!
  ];
  const g2Mixes = [
    [['I', 1], ['V', 2], ['P', 2]],    // 20% Independent (1/5)
    [['I', 1], ['G', 2], ['P', 2]],    // 20% Independent (1/5)
    [['I', 1], ['V', 2], ['M', 1], ['P', 1]] // 20% Independent (1/5) -> Target Stalled!
  ];
  const g3Mixes = [
    [['I', 2], ['V', 2], ['G', 1]],    // 40% Independent (2/5)
    [['I', 3], ['V', 1], ['G', 1]],    // 60% Independent (3/5)
    [['I', 6], ['G', 2]]               // 75% Independent (6/8) -> Improving!
  ];
  for (let i = 0; i < 3; i++) {
    const t = new Date(Date.now() - (4 - i) * 86400000).toISOString();
    const noteText = `Session Note — Eleanor\nDate: ${t.slice(0, 10)}\nDuration: 180 minutes (12 billable 15-min units)\nStaff: Sam Lee, RBT\n\nObjectives worked on:\n• Following teacher directions: ${[83, 86, 90][i]}% independent (target 80%).\n• Waiting for a turn: 20% independent (target 80%).\n• Requesting sensory break ("Break please"): ${[40, 60, 75][i]}% independent (target 80%).\n\nReinforcers used: LEGO, stickers, tablet time.\nClinical summary: Client engaged well with visual First/Then schedule.`;
    const sid = run('INSERT INTO sessions(client_id,user_id,start,end,units,note,note_status,submitted_by,rbt_signed_at,signed_by,bcba_signed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      el, rbt, t, t, 12, noteText, 'signed', 'Sam Lee, RBT', t, 'Dr. Dana Rivera, BCBA', t).lastInsertRowid;
    const insertMix = (gid, mix) => {
      mix.map(([l, n]) => Array(n).fill(l)).flat().forEach((l) => run('INSERT INTO trials(session_id,goal_id,level,ts,user_id) VALUES(?,?,?,?,?)', sid, gid, l, t, rbt));
    };
    insertMix(g1, g1Mixes[i]);
    insertMix(g2, g2Mixes[i]);
    insertMix(g3, g3Mixes[i]);
  }

  // 1 Session in pending_approval status so BCBA Dual-Sign Queue is active immediately in demo
  const tYest = new Date(Date.now() - 86400000).toISOString();
  const pendingNote = `Session Note — Leon\nDate: ${tYest.slice(0, 10)}\nDuration: 120 minutes (8 billable 15-min units)\nStaff: Sam Lee, RBT\n\nObjectives worked on:\n• Asking for help: 5 trials — 60% independent (3/5), 40% verbal prompt (2/5), 0% physical prompt, 0% non-compliant (target 70%).\n\nBehavior Reduction & ABC Data:\n• [Tangible] Antecedent: Denied immediate access to tablet → Behavior: Crying → Consequence: Prompted PECS card for alternate activity (trains)\n\nReinforcers used: Trains, bubbles, spin toys.\nClinical summary: Client practiced PECS Phase III exchanges during natural environment play. Ready for BCBA co-signature.`;
  const sidLeon = run('INSERT INTO sessions(client_id,user_id,start,end,units,note,note_status,submitted_by,rbt_signed_at) VALUES(?,?,?,?,?,?,?,?,?)',
    le, rbt, tYest, tYest, 8, pendingNote, 'pending_approval', 'Sam Lee, RBT', tYest).lastInsertRowid;
  [['I', 3], ['V', 2]].map(([l, n]) => Array(n).fill(l)).flat().forEach((l) => run('INSERT INTO trials(session_id,goal_id,level,ts,user_id) VALUES(?,?,?,?,?)', sidLeon, gLe1, l, tYest, rbt));

  // Pre-seed Approved BIP for Eleanor so Client 360 & In-Session Emergency BIP Drawer are live immediately
  const bipData = G.generatePlan({ child: 'Eleanor', behavior: 'Screaming', antecedents: ['Transition from preferred activity', 'Peer proximity / space'], reinforcers: ['LEGO', 'stickers', 'tablet time'] });
  run('INSERT INTO plans(client_id,behavior,data,status,approved_by) VALUES(?,?,?,?,?)',
    el, 'Screaming', JSON.stringify(bipData), 'approved', 'Dr. Dana Rivera, BCBA');

  // Pre-seed 1 Shared Social Story (visible in Parent Portal) + 1 Draft Social Story (to demo BCBA clinical guardrail)
  const storySharedInput = { child: 'Eleanor', situation: 'Sharing the LEGO Table at School', challenge: 'Peers reaching near her LEGO castle', goal: 'Use my "My Space Please" card and take a deep breath', interest: 'LEGO builders', visuals: true };
  const storySharedContent = G.generateStory(storySharedInput);
  run('INSERT INTO stories(client_id,inputs,content,status,approved_by,token) VALUES(?,?,?,?,?,?)',
    el, JSON.stringify(storySharedInput), JSON.stringify(storySharedContent), 'shared', 'Dr. Dana Rivera, BCBA', 'demo-story-eleanor-lego');

  const storyDraftInput = { child: 'Eleanor', situation: 'When the School Fire Drill Bell Rings', challenge: 'Loud sudden alarm noise in hallway', goal: 'Put on my headphones and hold teacher\'s hand calmly', interest: 'Space rockets', visuals: true };
  const storyDraftContent = G.generateStory(storyDraftInput);
  run('INSERT INTO stories(client_id,inputs,content,status) VALUES(?,?,?,?)',
    el, JSON.stringify(storyDraftInput), JSON.stringify(storyDraftContent), 'draft');

  // Seed ABC data across 5 observation days (Baseline Days 5-4 -> BIP/FCT Intervention Days 3-1) with 11:00 AM peak cluster
  const mkTime = (daysAgo, hhmm) => {
    const d = new Date(Date.now() - daysAgo * 86400000);
    const [hh, mm] = hhmm.split(':');
    d.setHours(+hh, +mm, 0, 0);
    return d.toISOString();
  };
  // Day 5 (Baseline Phase — 4 episodes)
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(5, '09:10'), 'Transition from morning free play to circle time', 'Screaming', 'Offered visual countdown & First/Then board', 'Escape', 'Baseline observation prior to visual countdown schedule', 'School', 'Morning Circle Transition', 'RBT, Classroom Teacher, 4 Peers', 'Moderate', 95);
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(5, '11:05'), 'Pre-lunch clean-up transition from LEGO center', 'Screaming', 'Prompted 2-minute sand timer & "save build" shelf', 'Escape', 'High intensity vocal protest when asked to clean up LEGO bricks', 'School', 'Pre-Lunch Clean-Up', 'RBT, Peer', 'Severe', 140);
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(5, '11:40'), 'Peer reached for LEGO creation before lunch', 'Screaming', 'Prompted "My turn" replacement communication card', 'Tangible', 'Required gestural prompt to hand FCT card to peer', 'School', 'LEGO Center Free Play', 'RBT, 2 Peers', 'Moderate', 60);
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(5, '14:10'), 'Presented multi-step tabletop sorting worksheet', 'Task refusal', 'Offered First/Then token board & task modification', 'Escape', 'Completed 3 tokens after demand was chunked', 'School', 'DTT Tabletop Block', 'RBT', 'Mild', 45);
  // Day 4 (Baseline Phase — 3 episodes)
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(4, '09:25'), 'Transition from morning free play to circle time', 'Screaming', 'Offered visual countdown & First/Then board', 'Escape', 'Settled within 90 seconds after reviewing visual schedule', 'School', 'Morning Circle Transition', 'RBT, Teacher', 'Moderate', 90);
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(4, '11:15'), 'Pre-lunch clean-up transition from LEGO center', 'Screaming', 'Prompted 2-minute sand timer & "save build" shelf', 'Escape', 'Used save-build tray with verbal reminder', 'School', 'Pre-Lunch Clean-Up', 'RBT, Peer', 'Moderate', 65);
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(4, '13:30'), 'Therapist conversing with classroom teacher', 'Crying', 'Prompted "Excuse me" tap card for attention', 'Attention', 'Used tap card and received immediate praise', 'School', 'Classroom Consultation', 'RBT, Teacher', 'Mild', 35);
  // Day 3 (BIP / FCT Intervention Phase — 2 episodes)
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(3, '09:15'), 'Transition from morning free play to circle time', 'Screaming', 'Offered visual countdown & First/Then board', 'Escape', 'De-escalated in 2 mins after seeing visual schedule', 'School', 'Morning Circle Transition', 'RBT, Teacher', 'Mild', 40);
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 1, rbt, mkTime(3, '11:10'), 'Pre-lunch clean-up transition from LEGO center', 'Screaming', 'Prompted 2-minute sand timer & "save build" shelf', 'Escape', 'Placed LEGO build on safe shelf and washed hands', 'School', 'Pre-Lunch Clean-Up', 'RBT, Peer', 'Mild', 30);
  // Day 2 (BIP / FCT Intervention Phase — 1 episode)
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 2, rbt, mkTime(2, '11:25'), 'Peer reached for LEGO creation before lunch', 'Screaming', 'Prompted "My turn" replacement communication card', 'Tangible', 'Independent vocal follow-up after card prompt', 'School', 'LEGO Center Free Play', 'RBT, Peer', 'Mild', 25);
  // Day 1 (BIP / FCT Intervention Phase — 1 episode)
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    el, 3, rbt, mkTime(1, '11:45'), 'Loud cafeteria line transition before lunch', 'Task refusal', 'Offered noise-reducing headphones & sensory squeeze', 'Sensory', 'Entered cafeteria calmly with headphones on', 'School', 'Cafeteria Transition', 'RBT, Peers', 'Mild', 20);
  // Leon ABC log
  run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    le, sidLeon, rbt, mkTime(1, '15:30'), 'Denied immediate access to tablet', 'Crying', 'Prompted PECS card for alternate activity (trains)', 'Tangible', 'Redirected successfully to wooden train set', 'Home', 'Living Room Play', 'RBT, Parent', 'Moderate', 45);

  // Seed supervision logs so BACB 5% compliance is healthy (≥5%)
  const tRecent = new Date().toISOString();
  run('INSERT INTO supervision_logs(client_id,bcba_id,rbt_id,session_id,ts,minutes,type,notes) VALUES(?,?,?,?,?,?,?,?)',
    el, bcba, rbt, 1, tRecent, 60, 'Direct Observation', 'Observed DTT trials on turn-taking and FCT replacement cards. RBT demonstrated 95% procedural fidelity.');

  seedClinicalModules(el, le, bcba, rbt);
}

function seedClinicalModules(el, le, bcba = 1, rbt = 2) {
  if (!get('SELECT COUNT(*) c FROM behavior_programs WHERE client_id=?', el).c) {
    const bp1 = run('INSERT INTO behavior_programs(client_id,name,definition,measurement_type,function_hypothesis,intensity_criteria,status) VALUES(?,?,?,?,?,?,?)',
      el, 'Screaming / Vocal Protest',
      'Any vocalization above conversational volume lasting ≥ 3 seconds, excluding appropriate cheering during play.',
      'frequency', 'Escape',
      'Mild: Whining <15s; Moderate: Loud screaming 15s–2m; Severe: Screaming >2m with ear-covering',
      'active').lastInsertRowid;
    const bp2 = run('INSERT INTO behavior_programs(client_id,name,definition,measurement_type,function_hypothesis,intensity_criteria,status) VALUES(?,?,?,?,?,?,?)',
      el, 'Task Refusal / Leaving Tabletop',
      'Sliding off chair, turning body >90° away from materials, or pushing instructional stimuli >12 inches away within 5 seconds of SD.',
      'partial_interval', 'Escape',
      'Mild: Verbal "no" or turning head; Moderate: Pushing materials away; Severe: Elopement >3 ft from table',
      'active').lastInsertRowid;
    run('INSERT INTO behavior_programs(client_id,name,definition,measurement_type,function_hypothesis,intensity_criteria,status) VALUES(?,?,?,?,?,?,?)',
      le, 'Crying / Tangible Protest',
      'Audible crying with or without tears lasting ≥ 5 seconds following removal or denial of a preferred item.',
      'duration', 'Tangible',
      'Mild: Whimpering <30s; Moderate: Crying 30s–2m; Severe: Crying >2m with flopping',
      'active');

    // Seed continuous & interval behavior_events for Eleanor across sessions 1, 2, 3
    const t3 = new Date(Date.now() - 3 * 86400000).toISOString();
    const t2 = new Date(Date.now() - 2 * 86400000).toISOString();
    const t1 = new Date(Date.now() - 1 * 86400000).toISOString();
    run('INSERT INTO behavior_events(client_id,session_id,behavior_id,behavior_name,user_id,ts,measurement_type,count,duration_sec,latency_sec,irt_sec,interval_total,interval_occurred,intensity,setting,activity,people_present,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      el, 1, bp1, 'Screaming / Vocal Protest', rbt, t3, 'frequency', 2, 65, 8, 240, 0, 0, 'Moderate', 'School', 'Pre-Lunch Clean-Up', 'RBT, Peer', 'Used 2-min sand timer; de-escalated');
    run('INSERT INTO behavior_events(client_id,session_id,behavior_id,behavior_name,user_id,ts,measurement_type,count,duration_sec,latency_sec,irt_sec,interval_total,interval_occurred,intensity,setting,activity,people_present,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      el, 2, bp1, 'Screaming / Vocal Protest', rbt, t2, 'duration', 1, 25, 14, 420, 0, 0, 'Mild', 'School', 'LEGO Center Free Play', 'RBT, Peer', 'Prompted "My turn" FCT card');
    run('INSERT INTO behavior_events(client_id,session_id,behavior_id,behavior_name,user_id,ts,measurement_type,count,duration_sec,latency_sec,irt_sec,interval_total,interval_occurred,intensity,setting,activity,people_present,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      el, 3, bp2, 'Task Refusal / Leaving Tabletop', rbt, t1, 'partial_interval', 1, 20, 18, 0, 10, 2, 'Mild', 'School', 'DTT Tabletop Block', 'RBT', '2/10 intervals (20%) occurred during 15-min block');
  }

  if (!get('SELECT COUNT(*) c FROM task_analyses WHERE client_id=?', el).c) {
    const steps = [
      '1. Stand at sink and turn on warm water faucet',
      '2. Wet both hands under running water',
      '3. Press soap dispenser 1 time',
      '4. Rub palms and backs of hands together for 15 seconds',
      '5. Rinse all soap off hands and turn off faucet',
      '6. Dry hands with paper towel and place in bin'
    ];
    const logs = [
      { date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), staff: 'Sam Lee, RBT', indepSteps: 3, totalSteps: 6, pct: 50, numDenom: '3/6', durationSec: 95, stepResults: ['I', 'I', 'I', 'G', 'V', 'PP'] },
      { date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), staff: 'Sam Lee, RBT', indepSteps: 4, totalSteps: 6, pct: 67, numDenom: '4/6', durationSec: 82, stepResults: ['I', 'I', 'I', 'I', 'G', 'V'] },
      { date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), staff: 'Sam Lee, RBT', indepSteps: 5, totalSteps: 6, pct: 83, numDenom: '5/6', durationSec: 70, stepResults: ['I', 'I', 'I', 'I', 'I', 'G'] }
    ];
    run('INSERT INTO task_analyses(client_id,title,chaining_type,steps_json,logs_json,status) VALUES(?,?,?,?,?,?)',
      el, 'Independent Handwashing Routine (Before Lunch)', 'Forward Chaining', JSON.stringify(steps), JSON.stringify(logs), 'active');
  }

  if (!get('SELECT COUNT(*) c FROM fidelity_ioa_logs WHERE client_id=?', el).c) {
    const fidData = {
      checklist: [
        { item: 'Prepared instructional materials & reinforcers prior to SD', correct: true },
        { item: 'Delivered clear, concise discriminative stimulus (SD) without repeating', correct: true },
        { item: 'Implemented configured Least-to-Most prompt hierarchy accurately', correct: true },
        { item: 'Delivered immediate differential reinforcement within 3 seconds', correct: true },
        { item: 'Recorded trial-by-trial and ABC data immediately after opportunity', correct: true },
        { item: 'Implemented proactive antecedent visual countdown before transition', correct: true }
      ],
      fidelityNumDenom: '6/6',
      ioaMethod: 'trial_by_trial',
      ioaNumDenom: '11/12',
      obs1: ['I', 'I', 'V', 'I', 'G', 'I', 'I', 'I', 'V', 'I', 'I', 'I'],
      obs2: ['I', 'I', 'V', 'I', 'M', 'I', 'I', 'I', 'V', 'I', 'I', 'I']
    };
    run('INSERT INTO fidelity_ioa_logs(client_id,session_id,bcba_id,rbt_id,ts,log_type,fidelity_pct,ioa_pct,data_json,notes) VALUES(?,?,?,?,?,?,?,?,?,?)',
      el, 3, bcba, rbt, new Date().toISOString(), 'both', 100, 92, JSON.stringify(fidData),
      'Treatment Integrity: 6/6 (100%) procedural steps implemented correctly. Interobserver Agreement (IOA): 11/12 (92%) trial-by-trial agreement between Sam Lee (RBT) and Dr. Dana Rivera (BCBA).');
  }
}

if (!get('SELECT COUNT(*) c FROM users').c) seed();

function upgradeExistingData() {
  const el = get('SELECT * FROM clients WHERE name=?', 'Eleanor');
  const le = get('SELECT * FROM clients WHERE name=?', 'Leon');
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
  if (el && !get('SELECT COUNT(*) c FROM plans WHERE client_id=?', el.id).c) {
    const bipData = G.generatePlan({ child: 'Eleanor', behavior: 'Screaming', antecedents: ['Transition from preferred activity', 'Peer proximity / space'], reinforcers: ['LEGO', 'stickers', 'tablet time'] });
    run('INSERT INTO plans(client_id,behavior,data,status,approved_by) VALUES(?,?,?,?,?)',
      el.id, 'Screaming', JSON.stringify(bipData), 'approved', 'Dr. Dana Rivera, BCBA');
  }
  if (el && !get('SELECT COUNT(*) c FROM stories WHERE client_id=?', el.id).c) {
    const storySharedInput = { child: 'Eleanor', situation: 'Sharing the LEGO Table at School', challenge: 'Peers reaching near her LEGO castle', goal: 'Use my "My Space Please" card and take a deep breath', interest: 'LEGO builders', visuals: true };
    run('INSERT INTO stories(client_id,inputs,content,status,approved_by,token) VALUES(?,?,?,?,?,?)',
      el.id, JSON.stringify(storySharedInput), JSON.stringify(G.generateStory(storySharedInput)), 'shared', 'Dr. Dana Rivera, BCBA', 'demo-story-eleanor-lego');
    const storyDraftInput = { child: 'Eleanor', situation: 'When the School Fire Drill Bell Rings', challenge: 'Loud sudden alarm noise in hallway', goal: 'Put on my headphones and hold teacher\'s hand calmly', interest: 'Space rockets', visuals: true };
    run('INSERT INTO stories(client_id,inputs,content,status) VALUES(?,?,?,?)',
      el.id, JSON.stringify(storyDraftInput), JSON.stringify(G.generateStory(storyDraftInput)), 'draft');
  }
  if (el && le) {
    seedClinicalModules(el.id, le.id, 1, 2);
  }
  if (!get("SELECT id FROM users WHERE email='owner@eba.test'")) {
    run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Sarah Jenkins', 'owner@eba.test', hash('password'), 'OWNER');
  }
  if (!get("SELECT id FROM users WHERE email='admin@eba.test'")) {
    run('INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)', 'Marcus Vance', 'admin@eba.test', hash('password'), 'ADMIN');
  }
  if (!get("SELECT COUNT(*) c FROM leads").c) {
    const tLead1 = new Date(Date.now() - 4 * 3600000).toISOString();
    const tLead2 = new Date(Date.now() - 26 * 3600000).toISOString();
    run('INSERT INTO leads(name, email, phone, clinic_name, caseload_size, current_software, message, status, notes, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      'Dr. Amanda Vance, BCBA-D', 'avance@horizonaba.org', '(555) 382-9901', 'Horizon Pediatric Autism Center', '25-50', 'MeasurePM',
      'MeasurePM is causing offline sync dropouts during clinic sessions. Our 4 BCBAs are losing 5 hours a week typing 15-page re-authorizations in Word. We want to see your 1-click re-auth packet and kid mode in action.',
      'new', 'High priority prospect. Practice has 32 active pediatric clients.', tLead1);
    run('INSERT INTO leads(name, email, phone, clinic_name, caseload_size, current_software, message, status, notes, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      'Robert Chen, M.S., BCBA', 'rchen@blueskybehavioral.com', '(555) 749-2234', 'Blue Sky Behavioral Health', '50-100', 'CentralReach',
      'Our RBTs are burning out collecting data in CentralReach. We need a modern tablet-first system with built-in BACB 5% supervision tracking and clean CPT unit billing.',
      'demo_scheduled', 'Scheduled live zoom walkthrough for Thursday at 2 PM EST.', tLead2);
  }
  if (!get("SELECT COUNT(*) c FROM facility_models").c) {
    const nowStr = new Date().toISOString();
    (G.DEFAULT_FACILITY_MODELS || []).forEach((preset) => {
      run(
        'INSERT INTO facility_models(name, subtitle, is_default, config_json, updated_at) VALUES(?,?,?,?,?)',
        preset.name,
        preset.subtitle,
        preset.is_default ? 1 : 0,
        JSON.stringify(preset.config),
        nowStr
      );
    });
  }
  if (!get("SELECT COUNT(*) c FROM facility_signups").c) {
    const initialSignups = [
      ['Eleanor Carter', 8, 'ASD (F84.0)', 'Focused', 20, 'Sample Commercial PPO #A123', 'Afternoon Cohort (1–5 PM)', 'Sensory Gym NET + Climbing Wall Regulation', 'committed', 1, 'Transitioning from school/home to center-based DTT + sensory gym'],
      ['Leon Okafor', 8, 'ASD (F84.0)', 'Comprehensive', 32, 'Sample Commercial PPO #B456', 'Morning Cohort (8:30 AM–12:30 PM)', 'Vestibular Swing Rig & Deep Pressure Circuit', 'committed', 1, 'High vestibular/proprioceptive seeker; 480 units authorized'],
      ['Maya Lin', 4, 'ASD (F84.0)', 'Comprehensive', 35, 'Aetna Behavioral Health (Synthetic)', 'Morning Cohort (8:30 AM–12:30 PM)', 'Early Intensive Gross-Motor & Crash Pit Track', 'committed', 1, 'Signed intake packet; 97151 assessment completed'],
      ['Liam Navarro', 6, 'ASD (F84.0)', 'Comprehensive', 30, 'BlueCross Pediatric ABA (Synthetic)', 'Morning Cohort (8:30 AM–12:30 PM)', 'Climbing Wall, Trampoline & FCT Transitions', 'committed', 1, 'Parent requested center + gym for peer generalization'],
      ['Sophia Rossi', 5, 'ASD (F84.0)', 'Focused', 18, 'United Optum Behavioral (Synthetic)', 'Afternoon Cohort (1–5 PM)', 'Tactile Sensory Wall & Balance Beam Circuit', 'committed', 1, 'Authorized for 18 hrs/wk 97153 + 2 hrs/wk 97158 gym group'],
      ['Noah Washington', 7, 'ASD (F84.0)', 'Focused', 20, 'Cigna Evernorth (Synthetic)', 'Afternoon Cohort (1–5 PM)', 'Proprioceptive Heavy-Work & Peer Cooperative Play', 'committed', 1, 'Transferring from home-only provider for gym facility access'],
      ['Ethan Brooks', 4, 'ASD (F84.0)', 'Comprehensive', 32, 'Anthem Commercial (Synthetic)', 'Morning Cohort (8:30 AM–12:30 PM)', 'Full Vestibular & Snoezelen Regulation Track', 'committed', 1, 'Early learner cohort; starting Day 1 of clinic opening'],
      ['Chloe Kim', 9, 'ASD (F84.0)', 'Gym Group', 8, 'BlueCross Pediatric ABA (Synthetic)', 'After-School Gym Group (4–6 PM)', 'Social Skills & Adaptive Fitness Gym Club (97158)', 'committed', 1, 'Enrolled in after-school peer social + gross motor group'],
      ['Aria Patel', 5, 'ASD (F84.0)', 'Comprehensive', 30, 'Aetna Behavioral Health (Synthetic)', 'Morning Cohort (8:30 AM–12:30 PM)', 'Vestibular Swing & Early Manding NET', 'auth_pending', 2, '97151 initial assessment completed; payer auth expected Month 2'],
      ['Lucas Rivera', 6, 'ASD (F84.0)', 'Focused', 18, 'United Optum Behavioral (Synthetic)', 'Afternoon Cohort (1–5 PM)', 'Rock Wall & Obstacle Course Motor Planning', 'auth_pending', 2, 'Waitlist deposit paid; onboarding Month 2'],
      ['Zoe Mercer', 4, 'ASD (F84.0)', 'Comprehensive', 34, 'Cigna Evernorth (Synthetic)', 'Morning Cohort (8:30 AM–12:30 PM)', 'Early Intensive DTT + Sensory Gym', 'waitlist', 3, 'Pediatrician referral; scheduled for Month 3 cohort'],
      ['Caleb Sterling', 8, 'ASD (F84.0)', 'Gym Group', 10, 'Private Pay + Out-of-Network', 'After-School Gym Group (4–6 PM)', 'Adaptive Gym & Peer Executive Function Group', 'waitlist', 3, 'Signed up for adaptive gym + social group track']
    ];
    initialSignups.forEach((row) => {
      run(
        'INSERT INTO facility_signups(child_name, age, diagnosis, tier, weekly_hours, payer, cohort, gym_track, enrollment_status, target_month, notes) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
        ...row
      );
    });
  }
}
upgradeExistingData();

// ---------- access control ----------
function canSeeClient(u, cid) {
  if (u.role === 'BCBA' || u.role === 'OWNER' || u.role === 'ADMIN') return true;
  if (u.role === 'RBT') return !!get('SELECT 1 x FROM assignments WHERE client_id=? AND user_id=?', cid, u.id);
  if (u.role === 'PARENT') return !!get('SELECT 1 x FROM clients WHERE id=? AND parent_id=?', cid, u.id);
  return false;
}
const visibleClients = (u) => (u.role === 'BCBA' || u.role === 'OWNER' || u.role === 'ADMIN') ? all('SELECT * FROM clients ORDER BY name')
  : u.role === 'RBT' ? all('SELECT c.* FROM clients c JOIN assignments a ON a.client_id=c.id WHERE a.user_id=? ORDER BY name', u.id)
  : all('SELECT * FROM clients WHERE parent_id=?', u.id);

// ---------- progress & clinical mastery intelligence ----------
function goalProgress(goal) {
  const scoringRule = goal.scoring_rule || 'independent_only';
  const reqSessions = Math.max(1, Number(goal.mastery_sessions) || 3);
  const rows = all('SELECT session_id, level, trial_type, ts FROM trials WHERE goal_id=? ORDER BY session_id', goal.id);
  const bySession = {};
  rows.forEach((r) => { (bySession[r.session_id] ||= []).push(r.level); });
  const series = Object.entries(bySession).map(([sid, ls]) => {
    const sum = G.summarize(ls, scoringRule);
    return {
      session: +sid,
      pct: sum.indepPct,
      correctPct: sum.correctPct,
      promptedPct: sum.promptedPct,
      n: sum.opportunities,
      rawTotal: sum.rawTotal,
      indepCount: sum.indepCount,
      promptedCount: sum.promptedCount,
      correctCount: sum.correctCount,
      indepNumDenom: sum.indepNumDenom,
      correctNumDenom: sum.correctNumDenom,
      promptedNumDenom: sum.promptedNumDenom,
      prompts: sum.counts
    };
  });

  const overallSummary = G.summarize(rows, scoringRule);
  const recent = series.slice(-reqSessions);
  const current = recent.length ? Math.round(recent.reduce((a, b) => a + b.pct, 0) / recent.length) : null;
  const recentIndepSum = recent.reduce((a, b) => a + (b.indepCount || 0), 0);
  const recentOppSum = recent.reduce((a, b) => a + (b.n || 0), 0);
  const currentNumDenom = recent.length ? `${recentIndepSum}/${recentOppSum}` : '0/0';

  let trend = 'Not enough data';
  if (current !== null) trend = current > goal.baseline + 5 ? 'Improving' : current < goal.baseline - 5 ? 'Declining' : 'Flat';

  // Automated Mastery, Plateau & Regression Detection (Durriya Anwar Checklist §12)
  const targetThreshold = goal.target || 80;
  const isMasteredCriteriaMet = recent.length >= reqSessions && recent.every((s) => (scoringRule === 'include_prompted' ? s.correctPct : s.pct) >= targetThreshold);
  const isStalled = series.length >= 3 && current !== null && current <= (goal.baseline + 3);
  const latestSessionPct = series.length ? series[series.length - 1].pct : null;
  const regressionDetected = goal.status === 'mastered' && latestSessionPct !== null && latestSessionPct < (targetThreshold - 10);

  let recommendation = null;
  if (regressionDetected) {
    recommendation = `⚠️ Regression Alert: Mastered target dropped to ${latestSessionPct}% (${series[series.length - 1].indepNumDenom}) in latest probe. Recommend BCBA review.`;
  } else if (goal.status === 'mastered') {
    recommendation = 'Goal Mastered — Active in Maintenance & Generalization';
  } else if (goal.status === 'on_hold') {
    recommendation = '⏸ Program On Hold per BCBA clinical direction.';
  } else if (goal.status === 'discontinued') {
    recommendation = '⏹ Program Discontinued per BCBA treatment plan revision.';
  } else if (goal.status === 'revised') {
    recommendation = '🔄 Program Revised — updated prompt hierarchy or mastery criterion active.';
  } else if (isMasteredCriteriaMet) {
    recommendation = `🎯 Mastery Criteria Met (${current}% avg [${currentNumDenom}] across last ${reqSessions} sessions). Flagged for BCBA review — do not advance without clinician sign-off.`;
  } else if (isStalled) {
    recommendation = `⚠️ Target Stalled (${current}% [${currentNumDenom}] vs ${goal.baseline}% baseline). Recommend reviewing prompt hierarchy (${goal.prompt_strategy || 'Least-to-Most'}) or environmental adaptations.`;
  }

  return {
    ...goal,
    domain: goal.domain || 'DTT / Skill Acquisition',
    prompt_strategy: goal.prompt_strategy || 'Least-to-Most',
    scoring_rule: scoringRule,
    mastery_sessions: reqSessions,
    series,
    current,
    currentNumDenom,
    overallNumDenom: overallSummary.indepNumDenom,
    overallCorrectNumDenom: overallSummary.correctNumDenom,
    overallPromptedNumDenom: overallSummary.promptedNumDenom,
    trend,
    mastery_met: isMasteredCriteriaMet,
    stalled: isStalled,
    regression: regressionDetected,
    recommendation
  };
}

// ---------- FBA & ABC Behavioral Analytics Engine ----------
function buildAbcSummary(rawAbc) {
  const total = rawAbc.length;
  const abcFunctions = { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 };
  const abcBehaviors = {};
  const hourlyDistribution = {};
  for (let h = 8; h <= 17; h++) {
    hourlyDistribution[h] = {
      hour: h,
      label: `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`,
      count: 0,
      antecedents: {},
      functions: { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 }
    };
  }

  const byDay = {};
  const byAntecedent = {};
  const byConsequence = {};
  const byBehaviorDetail = {};

  rawAbc.forEach((a) => {
    const fn = a.perceived_function && abcFunctions[a.perceived_function] !== undefined ? a.perceived_function : 'Escape';
    if (a.perceived_function && abcFunctions[a.perceived_function] !== undefined) abcFunctions[a.perceived_function]++;
    const beh = a.behavior || 'Unspecified';
    abcBehaviors[beh] = (abcBehaviors[beh] || 0) + 1;

    if (!byBehaviorDetail[beh]) {
      byBehaviorDetail[beh] = { behavior: beh, count: 0, functions: { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 } };
    }
    byBehaviorDetail[beh].count++;
    byBehaviorDetail[beh].functions[fn] = (byBehaviorDetail[beh].functions[fn] || 0) + 1;

    const ant = a.antecedent || 'Unstructured / Other';
    if (!byAntecedent[ant]) {
      byAntecedent[ant] = { antecedent: ant, count: 0, functions: { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 }, behaviors: {} };
    }
    byAntecedent[ant].count++;
    byAntecedent[ant].functions[fn] = (byAntecedent[ant].functions[fn] || 0) + 1;
    byAntecedent[ant].behaviors[beh] = (byAntecedent[ant].behaviors[beh] || 0) + 1;

    const con = a.consequence || 'Standard Redirection';
    if (!byConsequence[con]) {
      byConsequence[con] = { consequence: con, count: 0, functions: { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 }, deescalatedCount: 0 };
    }
    byConsequence[con].count++;
    byConsequence[con].functions[fn] = (byConsequence[con].functions[fn] || 0) + 1;
    if (/calm|de-escalat|safe|independent|redirected|washed|transitioned|within|settled|completed|praise/i.test(a.notes || '') || /card|timer|schedule|choice|headphone|first\/then|pecs/i.test(con)) {
      byConsequence[con].deescalatedCount++;
    }

    if (a.ts) {
      const dt = new Date(a.ts);
      const hour = dt.getHours();
      if (hourlyDistribution[hour]) {
        hourlyDistribution[hour].count++;
        hourlyDistribution[hour].antecedents[ant] = (hourlyDistribution[hour].antecedents[ant] || 0) + 1;
        hourlyDistribution[hour].functions[fn] = (hourlyDistribution[hour].functions[fn] || 0) + 1;
      }
      const dayKey = String(a.ts).slice(0, 10);
      if (!byDay[dayKey]) {
        byDay[dayKey] = {
          date: dayKey,
          label: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: 0,
          functions: { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 },
          behaviors: {}
        };
      }
      byDay[dayKey].count++;
      byDay[dayKey].functions[fn] = (byDay[dayKey].functions[fn] || 0) + 1;
      byDay[dayKey].behaviors[beh] = (byDay[dayKey].behaviors[beh] || 0) + 1;
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

  const dailySeries = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  const phaseSplitIdx = dailySeries.length >= 3 ? Math.max(1, Math.floor(dailySeries.length * 0.4)) : 1;
  dailySeries.forEach((d, idx) => {
    d.phase = idx < phaseSplitIdx ? 'Baseline' : 'BIP / FCT Intervention';
  });

  const baselineDays = dailySeries.slice(0, phaseSplitIdx);
  const interventionDays = dailySeries.slice(phaseSplitIdx);
  const baselineRate = baselineDays.length
    ? +(baselineDays.reduce((s, d) => s + d.count, 0) / baselineDays.length).toFixed(1)
    : (total ? +total.toFixed(1) : 0);
  const currentRate = interventionDays.length
    ? +(interventionDays.reduce((s, d) => s + d.count, 0) / interventionDays.length).toFixed(1)
    : baselineRate;
  const pctChange = baselineRate > 0 ? Math.round(((currentRate - baselineRate) / baselineRate) * 100) : 0;
  const trendDirection = pctChange <= -15 ? 'Decreasing (Improving)' : pctChange >= 15 ? 'Increasing (Needs Review)' : 'Stable';

  const fnEntries = Object.entries(abcFunctions).sort((a, b) => b[1] - a[1]);
  const topFn = fnEntries[0] || ['Escape', 0];
  const dominantFunction = {
    name: topFn[0],
    count: topFn[1],
    pct: total ? Math.round((topFn[1] / total) * 100) : 0,
    secondaryName: fnEntries[1] && fnEntries[1][1] > 0 ? fnEntries[1][0] : null,
    secondaryPct: fnEntries[1] && total ? Math.round((fnEntries[1][1] / total) * 100) : 0
  };

  const antecedentMatrix = Object.values(byAntecedent)
    .sort((a, b) => b.count - a.count)
    .map((item) => {
      const primaryFn = Object.entries(item.functions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Escape';
      const primaryBeh = Object.entries(item.behaviors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Behavior';
      return {
        ...item,
        pct: total ? Math.round((item.count / total) * 100) : 0,
        primaryFunction: primaryFn,
        primaryBehavior: primaryBeh
      };
    });

  const consequenceMatrix = Object.values(byConsequence)
    .sort((a, b) => b.count - a.count)
    .map((item) => {
      const primaryFn = Object.entries(item.functions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Escape';
      return {
        ...item,
        pct: total ? Math.round((item.count / total) * 100) : 0,
        primaryFunction: primaryFn,
        deescalationRate: item.count ? Math.round((item.deescalatedCount / item.count) * 100) : 100
      };
    });

  const behaviorMatrix = Object.values(byBehaviorDetail)
    .sort((a, b) => b.count - a.count)
    .map((item) => {
      const primaryFn = Object.entries(item.functions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Escape';
      return {
        ...item,
        pct: total ? Math.round((item.count / total) * 100) : 0,
        primaryFunction: primaryFn
      };
    });

  const totalDeescalated = consequenceMatrix.reduce((s, c) => s + c.deescalatedCount, 0);
  const replacementSuccessRate = total ? Math.round((totalDeescalated / total) * 100) : 100;

  return {
    total,
    functions: abcFunctions,
    behaviors: abcBehaviors,
    scatterplot,
    dailySeries,
    dominantFunction,
    reductionMetrics: {
      baselineRate,
      currentRate,
      pctChange,
      trendDirection,
      observationDays: dailySeries.length,
      phaseSplitIdx,
      replacementSuccessRate
    },
    antecedentMatrix,
    consequenceMatrix,
    behaviorMatrix
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

route('POST', '/api/leads', (u, b) => {
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const clinicName = String(b.clinic_name || b.clinic || '').trim();
  const phone = String(b.phone || '').trim();
  const caseload = String(b.caseload_size || b.caseload || '1-10').trim();
  const currentSoftware = String(b.current_software || b.software || 'MeasurePM').trim();
  const message = String(b.message || '').trim();

  if (!name) bad(400, 'Full name is required');
  if (!email || !email.includes('@')) bad(400, 'Valid work email is required');
  if (!clinicName) bad(400, 'Clinic or practice name is required');

  const now = new Date().toISOString();
  const res = run(
    'INSERT INTO leads(name, email, phone, clinic_name, caseload_size, current_software, message, status, notes, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    name, email, phone, clinicName, caseload, currentSoftware, message, 'new', '', now
  );

  return {
    ok: true,
    id: res.lastInsertRowid || 1,
    message: 'Thank you! A clinical practice specialist from Effective Behavioral Approach will contact you within 24 hours to schedule your live walkthrough.'
  };
}, { public: true });

route('GET', '/api/leads', (u) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA');
  return all('SELECT * FROM leads ORDER BY id DESC');
});

route('PATCH', '/api/leads/:id', (u, b, p) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA');
  const id = Number(p.id);
  const row = get('SELECT * FROM leads WHERE id=?', id);
  if (!row) bad(404, 'Lead not found');
  const status = b.status !== undefined ? String(b.status).trim() : row.status;
  const notes = b.notes !== undefined ? String(b.notes).trim() : row.notes;
  run('UPDATE leads SET status=?, notes=? WHERE id=?', status, notes, id);
  logAudit(u, { entity_type: 'leads', entity_id: id, action: 'UPDATE_LEAD', details: `Status: ${status}` });
  return get('SELECT * FROM leads WHERE id=?', id);
});

function buildFacilityPayload() {
  const rawModels = all('SELECT * FROM facility_models');
  const models = rawModels.map((m) => {
    const config = parse(m.config_json) || (G.DEFAULT_FACILITY_MODELS[0] && G.DEFAULT_FACILITY_MODELS[0].config) || {};
    return {
      id: m.id,
      name: m.name,
      subtitle: m.subtitle,
      is_default: m.is_default,
      updated_at: m.updated_at,
      config,
      proForma: G.calculateFacilityModel(config)
    };
  });

  const rawSignups = all('SELECT * FROM facility_signups');
  const signups = rawSignups.map((s) => {
    const wkHrs = Number(s.weekly_hours) || 20;
    const isGroupOnly = String(s.tier || '').toLowerCase().includes('group');
    const directHrsMo = (isGroupOnly ? 0 : Math.max(0, wkHrs - 2)) * 4.333;
    const groupHrsMo = (isGroupOnly ? wkHrs : 2) * 4.333;
    const supHrsMo = directHrsMo * 0.12;
    const estMonthlyGrossRev = Math.round(
      directHrsMo * 68 + groupHrsMo * 42 + supHrsMo * 125 + 2 * 110 + 1.33 * 140
    );
    return {
      ...s,
      weekly_hours: wkHrs,
      target_month: Number(s.target_month) || 1,
      estMonthlyGrossRev
    };
  });

  const totalSignups = signups.length;
  const committedMonth1 = signups.filter((s) => s.enrollment_status === 'committed' && s.target_month <= 1);
  const waitlistOrPending = signups.filter((s) => s.enrollment_status !== 'committed' || s.target_month > 1);

  const compCount = signups.filter((s) => String(s.tier || '').toLowerCase().includes('comp')).length;
  const focCount = signups.filter((s) => String(s.tier || '').toLowerCase().includes('focus')).length;
  const grpCount = Math.max(0, totalSignups - compCount - focCount);

  const compSharePct = totalSignups ? Math.round((compCount / totalSignups) * 100) : 45;
  const focSharePct = totalSignups ? Math.round((focCount / totalSignups) * 100) : 40;
  const grpSharePct = Math.max(0, 100 - compSharePct - focSharePct);

  const avgWeeklyHoursPerSignup = totalSignups
    ? +(signups.reduce((a, b) => a + b.weekly_hours, 0) / totalSignups).toFixed(1)
    : 24.0;
  const totalCommittedWeeklyHours = committedMonth1.reduce((a, b) => a + b.weekly_hours, 0);
  const projectedMonthlyGrossFromSignups = signups.reduce((a, b) => a + b.estMonthlyGrossRev, 0);

  const activeDbClientsCount = (all('SELECT COUNT(*) c FROM clients')[0] || {}).c || 0;
  const totalLeadsCount = (all('SELECT COUNT(*) c FROM leads')[0] || {}).c || 0;

  return {
    models,
    signups,
    signupSummary: {
      totalSignups,
      committedMonth1Count: committedMonth1.length,
      waitlistCount: waitlistOrPending.length,
      totalCommittedWeeklyHours,
      avgWeeklyHoursPerSignup,
      tierCounts: { Comprehensive: compCount, Focused: focCount, 'Gym Group': grpCount },
      tierSharesPct: {
        compTierSharePct: compSharePct,
        focusedTierSharePct: focSharePct,
        groupGymTierSharePct: grpSharePct
      },
      projectedMonthlyGrossFromSignups
    },
    livePracticeTelemetry: {
      activeDbClientsCount,
      totalLeadsCount
    }
  };
}

route('GET', '/api/facility-model', (u) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA', 'RBT');
  return buildFacilityPayload();
});

route('POST', '/api/facility-model', (u, b) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA');
  const name = String(b.name || '').trim() || 'Custom Clinic & Sensory Gym Scenario';
  const subtitle = String(b.subtitle || '').trim() || 'Custom CapEx, Staffing & Enrollment Pro Forma';
  const cfg = typeof b.config === 'object' && b.config ? b.config : (G.DEFAULT_FACILITY_MODELS[0] && G.DEFAULT_FACILITY_MODELS[0].config) || {};
  const nowStr = new Date().toISOString();
  const res = run(
    'INSERT INTO facility_models(name, subtitle, is_default, config_json, updated_at) VALUES(?,?,?,?,?)',
    name,
    subtitle,
    0,
    JSON.stringify(cfg),
    nowStr
  );
  const newId = Number(res.lastInsertRowid);
  logAudit(u, { entity_type: 'facility_model', entity_id: newId, action: 'CREATE_FACILITY_MODEL', details: `Created scenario: ${name}` });
  return { id: newId, ...buildFacilityPayload() };
});

route('PUT', '/api/facility-model/:id', (u, b, p) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA');
  const id = Number(p.id);
  const row = get('SELECT * FROM facility_models WHERE id=?', id);
  if (!row) bad(404, 'Scenario not found');
  const existingCfg = parse(row.config_json) || {};
  const nextCfg = typeof b.config === 'object' && b.config ? { ...existingCfg, ...b.config } : existingCfg;
  const name = b.name !== undefined ? String(b.name).trim() : row.name;
  const subtitle = b.subtitle !== undefined ? String(b.subtitle).trim() : row.subtitle;
  const nowStr = new Date().toISOString();
  run(
    'UPDATE facility_models SET name=?, subtitle=?, config_json=?, updated_at=? WHERE id=?',
    name,
    subtitle,
    JSON.stringify(nextCfg),
    nowStr,
    id
  );
  logAudit(u, { entity_type: 'facility_model', entity_id: id, action: 'UPDATE_FACILITY_MODEL', details: `Updated scenario: ${name}` });
  return { id, ...buildFacilityPayload() };
});

route('POST', '/api/facility-signups', (u, b) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA');
  const childName = String(b.child_name || '').trim();
  if (!childName) bad(400, 'Child name or identifier is required');
  const age = Math.max(1, Math.min(21, Number(b.age) || 6));
  const diagnosis = String(b.diagnosis || 'ASD (F84.0)').trim();
  const tier = String(b.tier || 'Comprehensive').trim();
  const weeklyHours = Math.max(2, Math.min(45, Number(b.weekly_hours) || 25));
  const payer = String(b.payer || 'Sample Commercial PPO').trim();
  const cohort = String(b.cohort || 'Morning Cohort (8:30 AM–12:30 PM)').trim();
  const gymTrack = String(b.gym_track || 'Sensory Gym NET & Vestibular Circuit').trim();
  const status = String(b.enrollment_status || 'committed').trim();
  const targetMonth = Math.max(1, Math.min(36, Number(b.target_month) || 1));
  const notes = String(b.notes || '').trim();

  const res = run(
    'INSERT INTO facility_signups(child_name, age, diagnosis, tier, weekly_hours, payer, cohort, gym_track, enrollment_status, target_month, notes) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
    childName, age, diagnosis, tier, weeklyHours, payer, cohort, gymTrack, status, targetMonth, notes
  );
  const newId = Number(res.lastInsertRowid);
  logAudit(u, { entity_type: 'facility_signup', entity_id: newId, action: 'ADD_FACILITY_SIGNUP', details: `Added therapy signup: ${childName} (${tier}, ${weeklyHours}h/wk)` });
  return { id: newId, ...buildFacilityPayload() };
});

route('PATCH', '/api/facility-signups/:id', (u, b, p) => {
  need(u, 'OWNER', 'ADMIN', 'BCBA');
  const id = Number(p.id);
  const row = get('SELECT * FROM facility_signups WHERE id=?', id);
  if (!row) bad(404, 'Signup record not found');
  const status = b.enrollment_status !== undefined ? String(b.enrollment_status).trim() : row.enrollment_status;
  const targetMonth = b.target_month !== undefined ? Math.max(1, Math.min(36, Number(b.target_month) || 1)) : row.target_month;
  const weeklyHours = b.weekly_hours !== undefined ? Math.max(2, Math.min(45, Number(b.weekly_hours) || 20)) : row.weekly_hours;
  const tier = b.tier !== undefined ? String(b.tier).trim() : row.tier;
  run('UPDATE facility_signups SET enrollment_status=?, target_month=?, weekly_hours=?, tier=? WHERE id=?', status, targetMonth, weeklyHours, tier, id);
  return { id, ...buildFacilityPayload() };
});

route('GET', '/api/dashboard', (u) => {
  const day = getLocalDate();
  const monthPrefix = day.slice(0, 7);
  let appts = all(`SELECT a.*, c.name client FROM appointments a JOIN clients c ON c.id=a.client_id WHERE a.start LIKE ? ORDER BY a.start`, day + '%');
  appts = appts.filter((a) => canSeeClient(u, a.client_id) && (u.role !== 'RBT' || a.user_id === u.id));
  const incompleteNotes = all('SELECT s.id, s.client_id, s.user_id FROM sessions s WHERE s.note_status IN (\'none\',\'draft\',\'pending_approval\') AND s.end IS NOT NULL')
    .filter((s) => canSeeClient(u, s.client_id) && (u.role === 'BCBA' || u.role === 'OWNER' || u.role === 'ADMIN' || s.user_id === u.id)).length;
  const auths = all('SELECT a.*, c.name client FROM authorizations a JOIN clients c ON c.id=a.client_id')
    .filter((a) => canSeeClient(u, a.client_id) && a.used / a.authorized >= 0.8);
  const pendingApprovals = (u.role === 'BCBA' || u.role === 'OWNER' || u.role === 'ADMIN') ? (all('SELECT COUNT(*) c FROM plans WHERE status=\'draft\'')[0].c + all('SELECT COUNT(*) c FROM stories WHERE status=\'draft\'')[0].c) : 0;
  const pendingSign = (u.role === 'BCBA' || u.role === 'OWNER' || u.role === 'ADMIN') ? (all('SELECT COUNT(*) c FROM sessions WHERE note_status IN (\'draft\',\'pending_approval\')')[0].c) : 0;
  
  // Supervision metrics (current month)
  const rbtUserIds = new Set(all('SELECT id FROM users WHERE role=\'RBT\'').map((x) => x.id));
  const rbtSessions = all('SELECT * FROM sessions WHERE start LIKE ?', monthPrefix + '%').filter((s) => rbtUserIds.has(s.user_id));
  const rbtDirectMinutes = rbtSessions.reduce((sum, s) => sum + (s.units ? s.units * 15 : 0), 0);
  const supLogs = all('SELECT * FROM supervision_logs WHERE ts LIKE ?', monthPrefix + '%');
  const supMinutes = supLogs.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const supPct = rbtDirectMinutes > 0 ? Math.round((supMinutes / rbtDirectMinutes) * 100) : 0;
  const supervision = { rbtDirectMinutes, supMinutes, supPct, compliant: supPct >= 5 };

  // Common relational lookups
  const allClients = all('SELECT * FROM clients');
  const allUsers = all('SELECT * FROM users');
  const clientMap = Object.fromEntries(allClients.map(c => [c.id, c]));
  const userMap = Object.fromEntries(allUsers.map(usr => [usr.id, usr]));
  const allSessions = all('SELECT * FROM sessions');
  const enrichedSessions = allSessions.map(s => ({
    ...s,
    client_name: (clientMap[s.client_id] || {}).name || 'Client',
    staff_name: (userMap[s.user_id] || {}).name || 'Staff',
    staff_role: (userMap[s.user_id] || {}).role || 'RBT'
  }));
  const allCompletedSessions = enrichedSessions.filter(s => s.end !== null);
  const completedThisMonth = allCompletedSessions.filter(s => String(s.start || '').startsWith(monthPrefix));

  // --- Persona 1: Owner KPI Telemetry (Business Performance & Gross Revenue) ---
  const CPT_RATES = {
    '97153': { rate: 16.25, hrRate: 65, label: 'Adaptive Behavior Treatment (1:1 Direct RBT)' },
    '97155': { rate: 31.25, hrRate: 125, label: 'Protocol Modification & Direction (BCBA)' },
    '97156': { rate: 27.50, hrRate: 110, label: 'Family Adaptive Guidance (BCBA)' },
    '97151': { rate: 35.00, hrRate: 140, label: 'Behavior Identification Assessment (BCBA)' }
  };

  let totalGrossRevenue = 0;
  let totalBillableUnits = 0;
  const cptRevenueBreakdown = {
    cpt97153: { code: '97153', units: 0, hours: 0, rate: 16.25, hrRate: 65, total: 0, label: CPT_RATES['97153'].label },
    cpt97155: { code: '97155', units: 0, hours: 0, rate: 31.25, hrRate: 125, total: 0, label: CPT_RATES['97155'].label },
    cpt97156: { code: '97156', units: 0, hours: 0, rate: 27.50, hrRate: 110, total: 0, label: CPT_RATES['97156'].label },
    cpt97151: { code: '97151', units: 0, hours: 0, rate: 35.00, hrRate: 140, total: 0, label: CPT_RATES['97151'].label }
  };

  completedThisMonth.forEach(s => {
    const units = Number(s.units) || 0;
    totalBillableUnits += units;
    const code = s.staff_role === 'BCBA' ? '97155' : '97153';
    const rateInfo = CPT_RATES[code] || CPT_RATES['97153'];
    totalGrossRevenue += units * rateInfo.rate;
    const key = `cpt${code}`;
    if (cptRevenueBreakdown[key]) {
      cptRevenueBreakdown[key].units += units;
      cptRevenueBreakdown[key].hours = +(cptRevenueBreakdown[key].units * 0.25).toFixed(1);
      cptRevenueBreakdown[key].total = Math.round(cptRevenueBreakdown[key].units * rateInfo.rate);
    }
  });

  const currentDayNum = Math.max(1, new Date().getDate());
  const projectedMonthlyRevenue = Math.round((totalGrossRevenue / currentDayNum) * 30);
  const totalBillableHours = +(totalBillableUnits * 0.25).toFixed(1);
  const targetCaseload = 10;
  const caseloadUtilizationPct = Math.min(100, Math.round((allClients.length / targetCaseload) * 100));
  const avgRevenuePerClient = allClients.length > 0 ? Math.round(totalGrossRevenue / allClients.length) : 0;

  const allAssignments = all('SELECT a.client_id, a.user_id, c.name client_name FROM assignments a JOIN clients c ON c.id=a.client_id');
  const staffUsers = allUsers.filter(usr => usr.role === 'BCBA' || usr.role === 'RBT');
  const staffProductivity = staffUsers.map(uStaff => {
    const staffSess = completedThisMonth.filter(s => s.user_id === uStaff.id);
    const uUnits = staffSess.reduce((sum, s) => sum + (s.units || 0), 0);
    const uHours = +(uUnits * 0.25).toFixed(1);
    const targetHours = uStaff.role === 'BCBA' ? 25 * 4 : 30 * 4;
    const utilPct = Math.min(100, Math.round((uHours / targetHours) * 100));

    // Determine assigned clients (BCBAs oversee all clients; RBTs have explicit assignments + any session clients)
    const assignedMap = new Map();
    if (uStaff.role === 'BCBA') {
      allClients.forEach(c => assignedMap.set(c.id, { id: c.id, name: c.name, units: 0, hours: 0 }));
    } else {
      allAssignments.filter(a => a.user_id === uStaff.id).forEach(a => {
        assignedMap.set(a.client_id, { id: a.client_id, name: a.client_name, units: 0, hours: 0 });
      });
    }
    staffSess.forEach(s => {
      if (!assignedMap.has(s.client_id)) {
        assignedMap.set(s.client_id, { id: s.client_id, name: s.client_name || 'Client', units: 0, hours: 0 });
      }
      const entry = assignedMap.get(s.client_id);
      entry.units += (s.units || 0);
      entry.hours = +(entry.units * 0.25).toFixed(1);
    });
    const clients = Array.from(assignedMap.values());
    const clientNames = clients.map(c => c.name).join(', ') || 'Unassigned';

    return {
      id: uStaff.id,
      name: uStaff.name,
      role: uStaff.role,
      clients,
      clientNames,
      billableUnits: uUnits,
      billableHours: uHours,
      targetHours,
      utilizationPct: utilPct
    };
  });

  const allAuths = all('SELECT a.*, c.name client FROM authorizations a JOIN clients c ON c.id=a.client_id');
  const totalAuthUnits = allAuths.reduce((sum, a) => sum + (a.authorized || 0), 0);
  const totalUsedAuthUnits = allAuths.reduce((sum, a) => sum + (a.used || 0), 0);
  const remainingAuthUnits = Math.max(0, totalAuthUnits - totalUsedAuthUnits);
  const overallBurnPct = totalAuthUnits > 0 ? Math.round((totalUsedAuthUnits / totalAuthUnits) * 100) : 0;
  const atRiskAuthsCount = allAuths.filter(a => (a.used / a.authorized) >= 0.8).length;

  const signedSessionsCount = completedThisMonth.filter(s => s.note_status === 'signed').length;
  const realizationRate = completedThisMonth.length > 0 ? Math.round((signedSessionsCount / completedThisMonth.length) * 100) : 100;

  const owner = {
    totalRevenueMtd: Math.round(totalGrossRevenue),
    projectedMonthlyRevenue,
    totalBillableUnits,
    totalBillableHours,
    avgRevenuePerClient,
    realizationRate,
    cptRevenueBreakdown,
    caseloadCapacity: {
      activeClients: allClients.length,
      targetCaseload,
      utilizationPct: caseloadUtilizationPct
    },
    staffProductivity,
    payerPipeline: {
      totalAuthorizedUnits: totalAuthUnits,
      totalUsedUnits: totalUsedAuthUnits,
      remainingUnits: remainingAuthUnits,
      overallBurnPct,
      atRiskCount: atRiskAuthsCount
    },
    inboundPipeline: (() => {
      const allLeadsList = all('SELECT * FROM leads ORDER BY id DESC') || [];
      return {
        totalLeads: allLeadsList.length,
        newLeadsCount: allLeadsList.filter(l => !l.status || l.status === 'new').length,
        measurePmProspectsCount: allLeadsList.filter(l => String(l.current_software || '').toLowerCase().includes('measurepm')).length,
        demoScheduledCount: allLeadsList.filter(l => l.status === 'demo_scheduled').length
      };
    })()
  };

  // --- Persona 2: BCBA KPI Telemetry (Client Progress & Behavior Patterns) ---
  const allGoals = all('SELECT * FROM goals').map(goalProgress);
  const activeGoalsList = allGoals.filter(g => g.status === 'active');
  const masteredGoalsList = allGoals.filter(g => g.status === 'mastered');
  const criteriaMetAlerts = allGoals.filter(g => g.mastery_met && g.status !== 'mastered').map(g => ({
    goalId: g.id,
    clientId: g.client_id,
    clientName: (clientMap[g.client_id] || {}).name || 'Client',
    title: g.title,
    avgPct: g.current,
    numDenom: g.currentNumDenom || `${g.current}%`
  }));
  const stalledAlerts = allGoals.filter(g => g.stalled && g.status !== 'mastered').map(g => ({
    goalId: g.id,
    clientId: g.client_id,
    clientName: (clientMap[g.client_id] || {}).name || 'Client',
    title: g.title,
    currentPct: g.current,
    baselinePct: g.baseline,
    numDenom: g.currentNumDenom || `${g.current}%`
  }));
  const regressionAlerts = allGoals.filter(g => g.regression).map(g => ({
    goalId: g.id,
    clientId: g.client_id,
    clientName: (clientMap[g.client_id] || {}).name || 'Client',
    title: g.title,
    currentPct: g.current
  }));

  const allAbc = all('SELECT * FROM abc_logs');
  const caseloadAbcSummary = buildAbcSummary(allAbc);

  const bcbaKpi = {
    clientProgress: {
      activeProgramsCount: activeGoalsList.length,
      masteredCount: masteredGoalsList.length,
      criteriaMetAlerts,
      stalledAlerts,
      regressionAlerts
    },
    behaviorPatterns: {
      totalMaladaptiveEvents: caseloadAbcSummary.total,
      pctChange: caseloadAbcSummary.reductionMetrics ? caseloadAbcSummary.reductionMetrics.pctChange : -25,
      trendDirection: caseloadAbcSummary.reductionMetrics ? caseloadAbcSummary.reductionMetrics.trendDirection : 'Decreasing',
      dominantFunction: caseloadAbcSummary.dominantFunction ? `${caseloadAbcSummary.dominantFunction.name} (${caseloadAbcSummary.dominantFunction.pct}%)` : 'Escape / Avoidance',
      functionDistribution: caseloadAbcSummary.functions || { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 },
      peakDisruptionWindow: caseloadAbcSummary.scatterplot && caseloadAbcSummary.scatterplot.peakWindow ? caseloadAbcSummary.scatterplot.peakWindow : { label: '10:00 AM', count: 2, primaryAntecedent: 'Transition from preferred activity' },
      averageTreatmentIntegrityFidelity: 100,
      averageIoaAgreement: 92
    }
  };

  // --- Persona 3: RBT KPI Telemetry (Assigned Tasks, Requirements & Training) ---
  const currentRbtId = u.role === 'RBT' ? u.id : (allUsers.find(x => x.role === 'RBT')?.id || 2);
  const rbtTodayAppts = all(`SELECT a.*, c.name client FROM appointments a JOIN clients c ON c.id=a.client_id WHERE a.start LIKE ? AND a.user_id=? ORDER BY a.start`, `${day}%`, currentRbtId).map(a => {
    const sess = get('SELECT id, end FROM sessions WHERE appointment_id=?', a.id);
    return {
      appointmentId: a.id,
      clientId: a.client_id,
      clientName: a.client,
      timeWindow: `${a.start.slice(11)} – ${a.end.slice(11)}`,
      setting: a.setting || 'School',
      status: sess ? (sess.end ? 'Completed' : 'In Session') : 'Scheduled',
      sessionId: sess ? sess.id : null
    };
  });

  const todayTrials = all(`SELECT t.* FROM trials t WHERE t.ts LIKE ? AND t.user_id=?`, `${day}%`, currentRbtId);
  const completedTrialsToday = todayTrials.length;
  const assignedClientIds = all('SELECT client_id FROM assignments WHERE user_id=?', currentRbtId).map(a => a.client_id);
  const rbtGoals = allGoals.filter(g => g.status === 'active' && assignedClientIds.includes(g.client_id));
  const pendingTargetsCount = Math.max(0, rbtGoals.length - new Set(todayTrials.map(t => t.goal_id)).size);

  const taskAnalysesList = all('SELECT ta.*, c.name client_name FROM task_analyses ta JOIN clients c ON c.id=ta.client_id WHERE ta.status=\'active\'');

  const rbtDirectMin = completedThisMonth.filter(s => s.user_id === currentRbtId).reduce((sum, s) => sum + (s.units ? s.units * 15 : 0), 0);
  const rbtSupMin = all('SELECT * FROM supervision_logs WHERE rbt_id=? AND ts LIKE ?', currentRbtId, `${monthPrefix}%`).reduce((sum, s) => sum + (s.minutes || 0), 0);
  const personalSupPct = rbtDirectMin > 0 ? Math.round((rbtSupMin / rbtDirectMin) * 100) : 0;
  const hoursNeededFor5Pct = Math.max(0, +((rbtDirectMin * 0.05 - rbtSupMin) / 60).toFixed(1));

  const rbtKpi = {
    todayTasks: rbtTodayAppts,
    dataRequirements: {
      requiredTrialsPerSession: 25,
      completedTrialsToday,
      pendingTargetCount: pendingTargetsCount,
      activeGoalsCount: rbtGoals.length,
      taskAnalyses: taskAnalysesList.map(ta => ({ id: ta.id, title: ta.title, clientName: ta.client_name }))
    },
    trainingAndSupervision: {
      directHours: +(rbtDirectMin / 60).toFixed(1),
      supervisionHours: +(rbtSupMin / 60).toFixed(1),
      personalSupPct,
      compliant: personalSupPct >= 5,
      hoursNeededFor5Pct,
      latestFidelityScore: 100,
      latestFeedback: 'Observed DTT trials on turn-taking. RBT demonstrated excellent prompt fading.'
    }
  };

  // --- Persona 4: Administrator KPI Telemetry (Missing Notes, Discrepancies, Billing) ---
  const missingNotesList = allCompletedSessions.filter(s => s.note_status === 'none' || s.note_status === 'draft').map(s => {
    const elapsedHours = s.end ? Math.max(1, Math.round((Date.now() - new Date(s.end).getTime()) / 3600000)) : 1;
    return {
      sessionId: s.id,
      clientName: s.client_name,
      staffName: s.staff_name,
      date: String(s.start || '').slice(0, 10),
      units: s.units || 0,
      elapsedHours,
      isDelinquent: elapsedHours >= 24
    };
  });

  const pendingSignList = allCompletedSessions.filter(s => s.note_status === 'pending_approval').map(s => ({
    sessionId: s.id,
    clientName: s.client_name,
    staffName: s.submitted_by || s.staff_name,
    date: String(s.start || '').slice(0, 10),
    units: s.units || 0,
    submittedAt: s.rbt_signed_at || s.start
  }));

  const nowIso = new Date().toISOString();
  const unstartedList = all(`SELECT a.*, c.name client, u.name staff FROM appointments a JOIN clients c ON c.id=a.client_id JOIN users u ON u.id=a.user_id WHERE a.start < ? AND a.start LIKE ?`, nowIso, `${day}%`).filter(a => {
    return !get('SELECT id FROM sessions WHERE appointment_id=?', a.id);
  }).map(a => ({
    appointmentId: a.id,
    clientName: a.client,
    staffName: a.staff,
    scheduledTime: `${a.start.slice(11)} – ${a.end.slice(11)}`,
    setting: a.setting || 'School'
  }));

  const claimsReadyList = completedThisMonth.filter(s => s.note_status === 'signed');
  const claimsReadyTotalUnits = claimsReadyList.reduce((sum, s) => sum + (s.units || 0), 0);
  let claimsReadyTotalRevenue = 0;
  claimsReadyList.forEach(s => {
    const code = s.staff_role === 'BCBA' ? '97155' : '97153';
    claimsReadyTotalRevenue += (s.units || 0) * (CPT_RATES[code]?.rate || 16.25);
  });

  const adminKpi = {
    documentationDelinquency: {
      missingNotesCount: missingNotesList.length,
      missingNotesList,
      pendingBcbaSignCount: pendingSignList.length,
      pendingSignList,
      avgTurnaroundHours: 2.4
    },
    sessionDiscrepancies: {
      unstartedAppointmentsCount: unstartedList.length,
      unstartedList,
      activeIncompleteCount: allSessions.filter(s => s.end === null && (Date.now() - new Date(s.start).getTime()) > 14400000).length
    },
    billingAndClaims: {
      claimsReadyCount: claimsReadyList.length,
      claimsReadyUnits: claimsReadyTotalUnits,
      claimsReadyRevenue: Math.round(claimsReadyTotalRevenue),
      authorizationsAtRisk: allAuths.filter(a => (a.used / a.authorized) >= 0.8).map(a => ({
        id: a.id,
        clientName: a.client,
        code: a.code,
        authorized: a.authorized,
        used: a.used,
        burnPct: Math.round((a.used / a.authorized) * 100)
      })),
      auditFlagsCount: 0
    }
  };

  return {
    appts,
    rbt: appts.filter((a) => a.role === 'RBT').length,
    bcba: appts.filter((a) => a.role === 'BCBA').length,
    incompleteNotes,
    auths,
    pendingApprovals,
    pendingSign,
    supervision,
    owner,
    bcbaKpi,
    rbtKpi,
    adminKpi
  };
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
  const abcSummary = buildAbcSummary(rawAbc);
  const supervisionLogs = isParent ? [] : all('SELECT s.*, u.name bcba, r.name rbt FROM supervision_logs s JOIN users u ON u.id=s.bcba_id JOIN users r ON r.id=s.rbt_id WHERE s.client_id=? ORDER BY s.id DESC', c.id);

  // Target Behavior Programs & Continuous/Interval Measurement Events
  const behaviorPrograms = isParent ? [] : all('SELECT * FROM behavior_programs WHERE client_id=?', c.id).map((bp) => ({
    ...bp,
    operational_definition: bp.operational_definition || bp.definition || ''
  }));
  const behaviorEvents = isParent ? [] : all('SELECT * FROM behavior_events WHERE client_id=? ORDER BY id DESC', c.id).map((ev) => ({
    ...ev,
    behavior: ev.behavior_name || ev.behavior || 'Target Behavior'
  }));
  const clientSessions = isParent ? [] : all('SELECT * FROM sessions WHERE client_id=?', c.id);
  const totalSessionMins = Math.max(60, clientSessions.reduce((acc, s) => acc + ((s.units || 4) * 15), 0));
  const behaviorSummary = isParent ? null : G.summarizeBehaviorEvents(behaviorEvents, totalSessionMins);

  // Task Analysis & Chaining Programs
  const taskAnalyses = isParent ? [] : all('SELECT * FROM task_analyses WHERE client_id=?', c.id).map((ta) => {
    const steps = parse(ta.steps_json) || [];
    const rawLogs = parse(ta.logs_json) || [];
    const history = rawLogs.map((l) => ({
      ...l,
      indepCount: l.indepCount ?? l.indepSteps ?? 0,
      indepPct: l.indepPct ?? l.pct ?? 0,
      pct: l.pct ?? l.indepPct ?? 0,
      results: l.results || (Array.isArray(l.stepResults) ? steps.map((s, idx) => ({ step: s, status: l.stepResults[idx] || 'I' })) : [])
    }));
    return {
      ...ta,
      steps,
      logs: history,
      history
    };
  });

  // Treatment Integrity (Fidelity) & Interobserver Agreement (IOA)
  const fidelityIoaLogs = isParent ? [] : all('SELECT * FROM fidelity_ioa_logs WHERE client_id=? ORDER BY id DESC', c.id).map((f) => {
    const data = parse(f.data_json) || {};
    return {
      ...f,
      ioa_method: f.ioa_method || data.ioaMethod || 'trial_by_trial',
      observer1_value: data.observer1_value ?? data.obs1 ?? '',
      observer2_value: data.observer2_value ?? data.obs2 ?? '',
      data
    };
  });

  // Immutable Clinical Audit Trail
  const auditLogs = isParent ? [] : all('SELECT * FROM audit_logs WHERE client_id=? ORDER BY id DESC', c.id).slice(0, 40);

  return {
    client: isParent ? { id: c.id, name: c.name } : c,
    goals,
    plans,
    stories,
    auths,
    assigned,
    abcLogs: rawAbc,
    abcSummary,
    supervisionLogs,
    behaviorPrograms,
    behaviorEvents,
    behaviorSummary,
    taskAnalyses,
    fidelityIoaLogs,
    auditLogs
  };
});
route('GET', '/api/clients/:id/fba-report', (u, b, p) => {
  need(u, 'BCBA', 'RBT');
  clientOr403(u, p.id);
  const c = get('SELECT * FROM clients WHERE id=?', +p.id);
  if (!c) bad(404, 'Client not found');
  const rawAbc = all('SELECT * FROM abc_logs WHERE client_id=? ORDER BY id DESC', c.id);
  const abcSummary = buildAbcSummary(rawAbc);
  const plans = all('SELECT * FROM plans WHERE client_id=?', c.id).map((x) => ({ ...x, data: parse(x.data) }));
  return G.generateFbaReport({ client: c, abcLogs: rawAbc, abcSummary, plans });
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
  run(`UPDATE clients SET ${f.map((x) => x + '=?').join(',')} WHERE id=?`, ...f.map((x) => b[x] ?? ''), +p.id);
  logAudit(u, { client_id: +p.id, entity_type: 'client', entity_id: +p.id, action: 'UPDATE_CLIENT_VITALS', details: `Updated Client 360 profile for ${b.name || 'Client'}` });
  return {};
});
route('POST', '/api/clients/:id/goals', (u, b, p) => {
  clientOr403(u, p.id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.title) bad(400, 'Title required');
  const domain = b.domain || 'DTT / Skill Acquisition';
  const promptStrategy = b.prompt_strategy || 'Least-to-Most';
  const scoringRule = b.scoring_rule === 'include_prompted' ? 'include_prompted' : 'independent_only';
  const masterySessions = Math.max(1, +b.mastery_sessions || 3);
  const r = run('INSERT INTO goals(client_id,title,baseline,target,domain,prompt_strategy,scoring_rule,mastery_sessions) VALUES(?,?,?,?,?,?,?,?)',
    +p.id, b.title, +b.baseline || 0, +b.target || 80, domain, promptStrategy, scoringRule, masterySessions);
  const gid = Number(r.lastInsertRowid);
  logAudit(u, { client_id: +p.id, entity_type: 'goal', entity_id: gid, action: 'CREATE_GOAL', details: `Created goal "${b.title}" (Target: ${+b.target || 80}% across ${masterySessions} sessions, Scoring: ${scoringRule})` });
  const g = get('SELECT * FROM goals WHERE id=?', gid);
  return { id: gid, goal: g ? goalProgress(g) : null };
});
route('GET', '/api/goals/:id', (u, b, p) => {
  const g = get('SELECT * FROM goals WHERE id=?', +p.id);
  if (!g) bad(404, 'Goal not found');
  clientOr403(u, g.client_id);
  const prog = goalProgress(g);
  const client = get('SELECT id,name FROM clients WHERE id=?', g.client_id);
  const rawTrials = all('SELECT * FROM trials WHERE goal_id=? ORDER BY id DESC', g.id);
  const sum = G.summarize(rawTrials, g.scoring_rule || 'independent_only');
  return {
    ...prog,
    client_name: client ? client.name : '',
    total_trials: rawTrials.length,
    opportunities_presented: sum.opportunities,
    prompt_totals: sum.counts,
    summary_stats: sum,
    recent_trials: rawTrials.slice(0, 25)
  };
});
route('PUT', '/api/goals/:id', (u, b, p) => {
  const g = get('SELECT * FROM goals WHERE id=?', +p.id);
  if (!g) bad(404, 'Goal not found');
  clientOr403(u, g.client_id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const title = (b.title ?? g.title).trim();
  if (!title) bad(400, 'Title required');
  const baseline = b.baseline !== undefined ? +b.baseline : g.baseline;
  const target = b.target !== undefined ? +b.target : g.target;
  const status = b.status || g.status || 'active';
  const domain = b.domain || g.domain || 'DTT / Skill Acquisition';
  const promptStrategy = b.prompt_strategy || g.prompt_strategy || 'Least-to-Most';
  const scoringRule = b.scoring_rule || g.scoring_rule || 'independent_only';
  const masterySessions = b.mastery_sessions !== undefined ? Math.max(1, +b.mastery_sessions) : (g.mastery_sessions || 3);
  run('UPDATE goals SET title=?,baseline=?,target=?,status=?,domain=?,prompt_strategy=?,scoring_rule=?,mastery_sessions=? WHERE id=?',
    title, baseline, target, status, domain, promptStrategy, scoringRule, masterySessions, g.id);
  logAudit(u, { client_id: g.client_id, entity_type: 'goal', entity_id: g.id, action: 'UPDATE_GOAL', details: `Updated goal "${title}" -> Status: ${status}, Target: ${target}%, Scoring: ${scoringRule}` });
  const updated = get('SELECT * FROM goals WHERE id=?', g.id);
  return goalProgress(updated);
});
route('POST', '/api/goals/:id/status', (u, b, p) => {
  need(u, 'BCBA');
  if (!b.status) bad(400, 'Status required');
  const g = get('SELECT * FROM goals WHERE id=?', +p.id);
  run('UPDATE goals SET status=? WHERE id=?', b.status, +p.id);
  if (g) logAudit(u, { client_id: g.client_id, entity_type: 'goal', entity_id: g.id, action: 'CHANGE_GOAL_STATUS', details: `Changed goal "${g.title}" status to ${b.status}` });
  return { id: +p.id, status: b.status };
});
route('POST', '/api/clients/:id/auths', (u, b, p) => {
  need(u, 'BCBA'); run('INSERT INTO authorizations(client_id,code,authorized,used) VALUES(?,?,?,0)', +p.id, b.code, +b.authorized || 0); return {};
});

// Target Behavior Program Definitions & Continuous / Interval Behavior Events
route('POST', '/api/clients/:id/behaviors', (u, b, p) => {
  clientOr403(u, p.id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.name) bad(400, 'Behavior name required');
  const defText = b.operational_definition || b.definition || 'Observable maladaptive behavior episode';
  const r = run('INSERT INTO behavior_programs(client_id,name,definition,measurement_type,function_hypothesis,intensity_criteria,status) VALUES(?,?,?,?,?,?,?)',
    +p.id, b.name, defText, b.measurement_type || 'frequency', b.function_hypothesis || 'Escape', b.intensity_criteria || 'Mild / Moderate / Severe', 'active');
  const bid = Number(r.lastInsertRowid);
  logAudit(u, { client_id: +p.id, entity_type: 'behavior_program', entity_id: bid, action: 'CREATE_BEHAVIOR_PROGRAM', details: `Defined behavior "${b.name}" (${b.measurement_type || 'frequency'})` });
  return { id: bid };
});
route('PUT', '/api/behaviors/:id', (u, b, p) => {
  const bp = get('SELECT * FROM behavior_programs WHERE id=?', +p.id);
  if (!bp) bad(404, 'Behavior program not found');
  clientOr403(u, bp.client_id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const defText = b.operational_definition || b.definition || bp.definition;
  run('UPDATE behavior_programs SET name=?,definition=?,measurement_type=?,function_hypothesis=?,intensity_criteria=?,status=? WHERE id=?',
    b.name || bp.name, defText, b.measurement_type || bp.measurement_type, b.function_hypothesis || bp.function_hypothesis, b.intensity_criteria || bp.intensity_criteria, b.status || bp.status, bp.id);
  return {};
});
route('POST', '/api/clients/:id/behavior-events', (u, b, p) => {
  clientOr403(u, p.id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const ts = b.ts || new Date().toISOString();
  const bid = b.behavior_id || b.behavior_program_id;
  const bp = bid ? get('SELECT * FROM behavior_programs WHERE id=?', +bid) : null;
  const bName = b.behavior_name || b.behavior || (bp ? bp.name : 'Target Behavior');
  const mType = b.measurement_type || (bp ? bp.measurement_type : 'frequency');
  const countVal = b.count !== undefined ? +b.count : (b.value !== undefined && (mType === 'frequency' || mType === 'rate') ? +b.value : 1);
  const durVal = +b.duration_sec || (b.value !== undefined && mType === 'duration' ? +b.value : 0);
  const latVal = +b.latency_sec || (b.value !== undefined && mType === 'latency' ? +b.value : 0);
  const irtVal = +b.irt_sec || (b.value !== undefined && mType === 'irt' ? +b.value : 0);
  const r = run('INSERT INTO behavior_events(client_id,session_id,behavior_id,behavior_name,user_id,ts,measurement_type,count,duration_sec,latency_sec,irt_sec,interval_total,interval_occurred,intensity,setting,activity,people_present,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    +p.id, b.session_id ? +b.session_id : null, bid ? +bid : null, bName, u.id, ts, mType,
    countVal, durVal, latVal, irtVal,
    +b.interval_total || 0, +b.interval_occurred || 0, b.intensity || 'Moderate', b.setting || 'School', b.activity || 'Structured Tabletop', b.people_present || 'RBT, Peer', b.notes || '');
  return { id: Number(r.lastInsertRowid) };
});

// Task Analysis & Chaining Endpoints
route('POST', '/api/clients/:id/task-analysis', (u, b, p) => {
  clientOr403(u, p.id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.title) bad(400, 'Task analysis title required');
  const steps = Array.isArray(b.steps) ? b.steps : String(b.steps || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const r = run('INSERT INTO task_analyses(client_id,title,chaining_type,steps_json,logs_json,status) VALUES(?,?,?,?,?,?)',
    +p.id, b.title, b.chaining_type || 'Forward Chaining', JSON.stringify(steps), '[]', 'active');
  const tid = Number(r.lastInsertRowid);
  logAudit(u, { client_id: +p.id, entity_type: 'task_analysis', entity_id: tid, action: 'CREATE_TASK_ANALYSIS', details: `Created Task Analysis "${b.title}" (${steps.length} steps)` });
  return { id: tid };
});
route('POST', '/api/task-analysis/:id/log', (u, b, p) => {
  const ta = get('SELECT * FROM task_analyses WHERE id=?', +p.id);
  if (!ta) bad(404, 'Task analysis not found');
  clientOr403(u, ta.client_id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const steps = parse(ta.steps_json) || [];
  const logs = parse(ta.logs_json) || [];
  const rawResults = Array.isArray(b.results) ? b.results : null;
  const stepResults = Array.isArray(b.stepResults)
    ? b.stepResults
    : (rawResults ? rawResults.map((r) => r.status || 'I') : steps.map(() => 'I'));
  const results = rawResults || steps.map((s, idx) => ({ step: s, status: stepResults[idx] || 'I' }));
  const totalSteps = steps.length || stepResults.length || 1;
  const indepSteps = stepResults.filter((x) => x === 'I').length;
  const pct = Math.round((indepSteps / totalSteps) * 100);
  const entry = {
    date: b.date || new Date().toISOString().slice(0, 10),
    ts: new Date().toISOString(),
    staff: u.name,
    indepSteps,
    indepCount: indepSteps,
    totalSteps,
    pct,
    indepPct: pct,
    numDenom: `${indepSteps}/${totalSteps}`,
    durationSec: +b.durationSec || 60,
    stepResults,
    results
  };
  logs.push(entry);
  run('UPDATE task_analyses SET logs_json=? WHERE id=?', JSON.stringify(logs), ta.id);
  logAudit(u, { client_id: ta.client_id, entity_type: 'task_analysis', entity_id: ta.id, action: 'LOG_TASK_ANALYSIS', details: `Logged Task Analysis "${ta.title}": ${entry.numDenom} (${pct}%) independent` });
  return { ok: true, entry, ...entry };
});

// ABC Data collection (with extended contextual fields)
route('POST', '/api/clients/:id/abc', (u, b, p) => {
  clientOr403(u, p.id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.behavior) bad(400, 'Behavior required');
  const ts = b.ts || new Date().toISOString();
  const r = run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    +p.id, b.session_id ? +b.session_id : null, u.id, ts, b.antecedent || 'Unspecified', b.behavior, b.consequence || 'Prompted replacement', b.perceived_function || 'Escape', b.notes || '',
    b.setting || 'School', b.activity || 'Structured Tabletop', b.people_present || 'RBT, Peer', b.intensity || 'Moderate', +b.duration_sec || 0);
  return { id: Number(r.lastInsertRowid) };
});
route('GET', '/api/clients/:id/abc', (u, b, p) => {
  clientOr403(u, p.id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  return all('SELECT * FROM abc_logs WHERE client_id=? ORDER BY id DESC', +p.id);
});

// CSV Data Export & Raw Observation Derivation (Build Spec §8 & Durriya Anwar PDF §14)
route('GET', '/api/clients/:id/export-csv', (u, b, p, ctx) => {
  clientOr403(u, p.id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  const c = get('SELECT * FROM clients WHERE id=?', +p.id);
  if (!c) bad(404, 'Client not found');
  const exportType = (ctx && ctx.query && ctx.query.type) || 'trials';
  const csvEsc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  if (exportType === 'behaviors') {
    const abc = all('SELECT * FROM abc_logs WHERE client_id=? ORDER BY id DESC', c.id);
    const bev = all('SELECT * FROM behavior_events WHERE client_id=? ORDER BY id DESC', c.id);
    const header = ['RecordType', 'Timestamp', 'Behavior', 'MeasurementType', 'Count', 'DurationSec', 'LatencySec', 'IRTSec', 'IntervalRatio', 'Intensity', 'Antecedent', 'Consequence', 'Function', 'Setting', 'Activity', 'PeoplePresent', 'Notes'];
    const rows = [
      ...bev.map((e) => ['Continuous/Interval', e.ts, e.behavior_name, e.measurement_type, e.count, e.duration_sec, e.latency_sec, e.irt_sec, e.interval_total ? `${e.interval_occurred}/${e.interval_total}` : 'N/A', e.intensity, '', '', '', e.setting, e.activity, e.people_present, e.notes]),
      ...abc.map((a) => ['ABC Episode', a.ts, a.behavior, 'abc', 1, a.duration_sec || 0, 0, 0, 'N/A', a.intensity || 'Moderate', a.antecedent, a.consequence, a.perceived_function, a.setting || 'School', a.activity || 'Tabletop', a.people_present || 'RBT', a.notes])
    ];
    const csv = [header.map(csvEsc).join(','), ...rows.map((r) => r.map(csvEsc).join(','))].join('\n');
    return { filename: `${c.name}_Behavior_Observations_${getLocalDate()}.csv`, type: 'behaviors', rowCount: rows.length, csv };
  }

  // Default: Trial-by-Trial & Goal Summary Derivation Export
  const goals = all('SELECT * FROM goals WHERE client_id=?', c.id).map(goalProgress);
  const goalMap = Object.fromEntries(goals.map((g) => [g.id, g]));
  const rawTrials = all('SELECT * FROM trials ORDER BY id DESC').filter((t) => !!goalMap[t.goal_id]);
  const header = ['TrialID', 'Timestamp', 'SessionID', 'GoalID', 'GoalTitle', 'Domain', 'ScoringRule', 'TrialType', 'ResponseCode', 'ResponseLabel', 'GoalOverallIndependentRatio', 'GoalOverallCorrectRatio', 'Notes'];
  const rows = rawTrials.map((t) => {
    const g = goalMap[t.goal_id] || {};
    return [
      t.id,
      t.ts,
      t.session_id,
      t.goal_id,
      g.title || '',
      g.domain || 'DTT',
      g.scoring_rule || 'independent_only',
      t.trial_type || 'acquisition',
      t.level,
      G.LEVELS[t.level] || t.level,
      g.overallNumDenom || '0/0',
      g.overallCorrectNumDenom || '0/0',
      t.notes || ''
    ];
  });
  const csv = [header.map(csvEsc).join(','), ...rows.map((r) => r.map(csvEsc).join(','))].join('\n');
  return { filename: `${c.name}_Trial_Observations_${getLocalDate()}.csv`, type: 'trials', rowCount: rows.length, csv };
});

route('GET', '/api/clients/:id/audit-logs', (u, b, p) => {
  clientOr403(u, p.id);
  if (u.role === 'PARENT') bad(403, 'Not allowed');
  return all('SELECT * FROM audit_logs WHERE client_id=? ORDER BY id DESC', +p.id);
});

// Supervision, Treatment Integrity (Fidelity) & Interobserver Agreement (IOA)
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
  const clientsById = Object.fromEntries(all('SELECT id,name FROM clients').map((c) => [c.id, c.name]));
  const usersById = Object.fromEntries(all('SELECT id,name FROM users').map((usr) => [usr.id, usr.name]));
  const fidelityIoaLogs = all('SELECT * FROM fidelity_ioa_logs ORDER BY id DESC').map((f) => {
    const data = parse(f.data_json) || {};
    return {
      ...f,
      client: clientsById[f.client_id] || 'Client',
      bcba: usersById[f.bcba_id] || 'BCBA',
      rbt: usersById[f.rbt_id] || 'RBT',
      ioa_method: f.ioa_method || data.ioaMethod || 'trial_by_trial',
      observer1_value: data.observer1_value ?? (Array.isArray(data.obs1) ? data.obs1.join(',') : (data.obs1 ?? '')),
      observer2_value: data.observer2_value ?? (Array.isArray(data.obs2) ? data.obs2.join(',') : (data.obs2 ?? '')),
      data
    };
  });
  return { rbtDirectMinutes, supMinutes, supPct, compliant: supPct >= 5, logs, fidelityIoaLogs, month: monthPrefix };
});
route('POST', '/api/supervision', (u, b) => {
  need(u, 'BCBA');
  if (!b.client_id || !b.rbt_id || !b.minutes) bad(400, 'Client, RBT, and minutes required');
  const ts = b.ts || new Date().toISOString();
  run('INSERT INTO supervision_logs(client_id,bcba_id,rbt_id,session_id,ts,minutes,type,notes) VALUES(?,?,?,?,?,?,?,?)',
    +b.client_id, u.id, +b.rbt_id, b.session_id ? +b.session_id : null, ts, +b.minutes, b.type || 'Direct Observation', b.notes || '');
  return {};
});
route('POST', '/api/supervision/fidelity-ioa', (u, b) => {
  need(u, 'BCBA');
  if (!b.client_id) bad(400, 'Client required');
  const checklist = Array.isArray(b.checklist) ? b.checklist : [];
  const fidRes = checklist.length ? G.calculateFidelity(checklist) : { pct: b.fidelity_pct !== undefined ? +b.fidelity_pct : 100, numDenom: '6/6' };
  const obs1 = Array.isArray(b.obs1) ? b.obs1 : String(b.obs1 || 'I,I,V,I,G').split(',').map((x) => x.trim()).filter(Boolean);
  const obs2 = Array.isArray(b.obs2) ? b.obs2 : String(b.obs2 || 'I,I,V,I,G').split(',').map((x) => x.trim()).filter(Boolean);
  const c1 = b.count1 !== undefined ? +b.count1 : (b.observer1_value !== undefined ? +b.observer1_value : undefined);
  const c2 = b.count2 !== undefined ? +b.count2 : (b.observer2_value !== undefined ? +b.observer2_value : undefined);
  const hasNumericCounts = c1 !== undefined && c2 !== undefined && !Array.isArray(b.obs1) && !b.obs1;
  const effectiveMethod = hasNumericCounts && (!b.ioa_method || b.ioa_method === 'trial_by_trial') ? 'total_count' : (b.ioa_method || 'trial_by_trial');
  const ioaRes = G.calculateIoa({ method: effectiveMethod, obs1, obs2, count1: c1, count2: c2 });
  const dataObj = {
    checklist,
    fidelityNumDenom: fidRes.numDenom,
    ioaMethod: b.ioa_method || ioaRes.method,
    ioaNumDenom: ioaRes.numDenom,
    observer1_value: c1,
    observer2_value: c2,
    obs1,
    obs2
  };
  const r = run('INSERT INTO fidelity_ioa_logs(client_id,session_id,bcba_id,rbt_id,ts,log_type,fidelity_pct,ioa_pct,data_json,notes) VALUES(?,?,?,?,?,?,?,?,?,?)',
    +b.client_id, b.session_id ? +b.session_id : null, u.id, +b.rbt_id || 2, new Date().toISOString(),
    b.log_type || 'both', fidRes.pct, ioaRes.pct, JSON.stringify(dataObj), b.notes || `Fidelity: ${fidRes.pct}% (${fidRes.numDenom}) · IOA: ${ioaRes.pct}% (${ioaRes.numDenom})`);
  logAudit(u, { client_id: +b.client_id, entity_type: 'fidelity_ioa', entity_id: Number(r.lastInsertRowid), action: 'LOG_FIDELITY_IOA', details: `Recorded Fidelity ${fidRes.pct}% (${fidRes.numDenom}) & IOA ${ioaRes.pct}% (${ioaRes.numDenom})` });
  return { id: Number(r.lastInsertRowid), fidelity_pct: fidRes.pct, fidelityNumDenom: fidRes.numDenom, ioa_pct: ioaRes.pct, ioaNumDenom: ioaRes.numDenom };
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
  const allGoals = all('SELECT * FROM goals WHERE client_id=?', s.client_id).map((g) => ({
    ...goalProgress(g),
    summary: G.summarize(all('SELECT level, trial_type, notes FROM trials WHERE session_id=? AND goal_id=?', s.id, g.id), g.scoring_rule || 'independent_only')
  }));
  const goals = allGoals.filter((g) => g.status === 'active' || g.status === 'revised');
  const plans = all('SELECT * FROM plans WHERE client_id=? AND status=\'approved\'', s.client_id).map((x) => ({ ...x, data: parse(x.data) }));
  const stories = all('SELECT * FROM stories WHERE client_id=? AND status IN (\'approved\',\'shared\')', s.client_id).map((x) => ({ ...x, content: parse(x.content) }));
  const appt = get('SELECT * FROM appointments WHERE id=?', s.appointment_id);
  const abcLogs = all('SELECT * FROM abc_logs WHERE session_id=? ORDER BY id DESC', s.id);
  const behaviorPrograms = all('SELECT * FROM behavior_programs WHERE client_id=?', s.client_id).map((bp) => ({
    ...bp,
    operational_definition: bp.operational_definition || bp.definition || ''
  }));
  const behaviorEvents = all('SELECT * FROM behavior_events WHERE session_id=? ORDER BY id DESC', s.id).map((ev) => ({
    ...ev,
    behavior: ev.behavior_name || ev.behavior || 'Target Behavior'
  }));
  const elapsedMinutes = s.end ? Math.max(1, Math.round((new Date(s.end) - new Date(s.start)) / 60000)) : Math.max(15, Math.round((Date.now() - new Date(s.start)) / 60000));
  const behaviorSummary = G.summarizeBehaviorEvents(behaviorEvents, elapsedMinutes);
  const taskAnalyses = all('SELECT * FROM task_analyses WHERE client_id=?', s.client_id).map((ta) => {
    const steps = parse(ta.steps_json) || [];
    const rawLogs = parse(ta.logs_json) || [];
    const history = rawLogs.map((l) => ({
      ...l,
      indepCount: l.indepCount ?? l.indepSteps ?? 0,
      indepPct: l.indepPct ?? l.pct ?? 0,
      pct: l.pct ?? l.indepPct ?? 0,
      results: l.results || (Array.isArray(l.stepResults) ? steps.map((st, idx) => ({ step: st, status: l.stepResults[idx] || 'I' })) : [])
    }));
    return {
      ...ta,
      steps,
      logs: history,
      history
    };
  });
  const auditLogs = all('SELECT * FROM audit_logs WHERE session_id=? ORDER BY id DESC', s.id);

  // Calculate Data Completeness % across active skill goals
  const goalsWithData = goals.filter((g) => g.summary && (g.summary.rawTotal > 0)).length;
  const dataCompleteness = {
    recordedPrograms: goalsWithData,
    totalPrograms: goals.length,
    pct: goals.length ? Math.round((goalsWithData / goals.length) * 100) : 100,
    numDenom: `${goalsWithData}/${goals.length}`
  };

  return { session: s, client, goals, allGoals, plans, stories, appt, abcLogs, behaviorPrograms, behaviorEvents, behaviorSummary, taskAnalyses, auditLogs, dataCompleteness };
}
route('GET', '/api/sessions/:id', (u, b, p) => { if (u.role === 'PARENT') bad(403, 'Not allowed'); return sessionView(u, p.id); });
route('PUT', '/api/sessions/:id/meta', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); if (!s) bad(404, 'Not found');
  clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  run('UPDATE sessions SET attendance_status=?, barriers=? WHERE id=?', b.attendance_status || s.attendance_status || 'Completed', b.barriers ?? s.barriers ?? '', s.id);
  logAudit(u, { client_id: s.client_id, session_id: s.id, entity_type: 'session', entity_id: s.id, action: 'UPDATE_SESSION_META', details: `Attendance: ${b.attendance_status || 'Completed'} · Barriers: ${b.barriers || 'None'}` });
  return {};
});
route('POST', '/api/sessions/:id/trials', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (s.end) bad(400, 'Session ended'); if (!G.LEVELS[b.level]) bad(400, 'Bad level');
  run('INSERT INTO trials(session_id,goal_id,level,ts,trial_type,notes,user_id) VALUES(?,?,?,?,?,?,?)',
    s.id, +b.goal_id, b.level, new Date().toISOString(), b.trial_type || 'acquisition', b.notes || '', u.id);
  return {};
});
route('DELETE', '/api/sessions/:id/trials/last', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (s.end) bad(400, 'Session ended');
  const t = get('SELECT * FROM trials WHERE session_id=? ORDER BY id DESC LIMIT 1', s.id);
  if (t) {
    run('DELETE FROM trials WHERE id=?', t.id);
    logAudit(u, { client_id: s.client_id, session_id: s.id, entity_type: 'trial', entity_id: t.id, action: 'UNDO_TRIAL', details: `Undid trial #${t.id} (Goal #${t.goal_id}, Response: ${t.level})` });
  }
  return {};
});
route('POST', '/api/sessions/:id/behavior-events', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); if (!s) bad(404, 'Not found');
  clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  const ts = b.ts || new Date().toISOString();
  const bid = b.behavior_id || b.behavior_program_id;
  const bp = bid ? get('SELECT * FROM behavior_programs WHERE id=?', +bid) : null;
  const bName = b.behavior_name || b.behavior || (bp ? bp.name : 'Target Behavior');
  const mType = b.measurement_type || (bp ? bp.measurement_type : 'frequency');
  const countVal = b.count !== undefined ? +b.count : (b.value !== undefined && (mType === 'frequency' || mType === 'rate') ? +b.value : 1);
  const durVal = +b.duration_sec || (b.value !== undefined && mType === 'duration' ? +b.value : 0);
  const latVal = +b.latency_sec || (b.value !== undefined && mType === 'latency' ? +b.value : 0);
  const irtVal = +b.irt_sec || (b.value !== undefined && mType === 'irt' ? +b.value : 0);
  const r = run('INSERT INTO behavior_events(client_id,session_id,behavior_id,behavior_name,user_id,ts,measurement_type,count,duration_sec,latency_sec,irt_sec,interval_total,interval_occurred,intensity,setting,activity,people_present,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    s.client_id, s.id, bid ? +bid : null, bName, u.id, ts, mType,
    countVal, durVal, latVal, irtVal,
    +b.interval_total || 0, +b.interval_occurred || 0, b.intensity || 'Moderate', b.setting || 'School', b.activity || 'Structured Tabletop', b.people_present || 'RBT, Peer', b.notes || '');
  return { id: Number(r.lastInsertRowid) };
});
route('DELETE', '/api/sessions/:id/behavior-events/last', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); if (!s) bad(404, 'Not found');
  clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  const ev = get('SELECT * FROM behavior_events WHERE session_id=? ORDER BY id DESC LIMIT 1', s.id);
  if (ev) {
    run('DELETE FROM behavior_events WHERE id=?', ev.id);
    logAudit(u, { client_id: s.client_id, session_id: s.id, entity_type: 'behavior_event', entity_id: ev.id, action: 'UNDO_BEHAVIOR_EVENT', details: `Undid behavior observation #${ev.id} (${ev.behavior_name}, ${ev.measurement_type})` });
  }
  return { ok: true, undone: ev || null };
});
route('POST', '/api/sessions/:id/abc', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (!b.behavior) bad(400, 'Behavior required');
  const ts = b.ts || new Date().toISOString();
  const r = run('INSERT INTO abc_logs(client_id,session_id,user_id,ts,antecedent,behavior,consequence,perceived_function,notes,setting,activity,people_present,intensity,duration_sec) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    s.client_id, s.id, u.id, ts, b.antecedent || 'Unspecified', b.behavior, b.consequence || 'Prompted replacement', b.perceived_function || 'Escape', b.notes || '',
    b.setting || 'School', b.activity || 'Structured Tabletop', b.people_present || 'RBT, Peer', b.intensity || 'Moderate', +b.duration_sec || 0);
  return { id: Number(r.lastInsertRowid) };
});
route('POST', '/api/sessions/:id/end', (u, b, p) => {
  const s = get('SELECT * FROM sessions WHERE id=?', +p.id); clientOr403(u, s.client_id); if (u.role === 'PARENT') bad(403, 'Not allowed');
  if (s.end) return { units: s.units };
  const end = new Date(); const minutes = Math.max(1, Math.round((end - new Date(s.start)) / 60000));
  const units = G.calcUnits(+b.minutes_override || minutes);
  run('UPDATE sessions SET end=?, units=? WHERE id=?', end.toISOString(), units, s.id);
  logAudit(u, { client_id: s.client_id, session_id: s.id, entity_type: 'session', entity_id: s.id, action: 'END_SESSION', details: `Ended session #${s.id} (${units} billable units)` });
  return { units };
});
route('POST', '/api/sessions/:id/note/generate', (u, b, p) => {
  const v = sessionView(u, p.id); const s = v.session;
  const minutes = s.end ? Math.max(1, Math.round((new Date(s.end) - new Date(s.start)) / 60000)) : Math.round((Date.now() - new Date(s.start)) / 60000);
  const note = G.generateNote({ client: v.client, session: { setting: v.appt && v.appt.setting, attendance_status: s.attendance_status, barriers: s.barriers }, minutes: b.minutes || minutes, units: s.units || G.calcUnits(minutes), goalSummaries: v.goals.map((g) => ({ title: g.title, ...g.summary })), plan: v.plans[0] && v.plans[0].data, story: v.stories[0] && v.stories[0].content, abcLogs: v.abcLogs, behaviorSummary: v.behaviorSummary });
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
  logAudit(u, { client_id: s.client_id, session_id: s.id, entity_type: 'session_note', entity_id: s.id, action: 'SUBMIT_NOTE', details: `RBT ${u.name} submitted session note for BCBA review` });
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
  logAudit(u, { client_id: s.client_id, session_id: s.id, entity_type: 'session_note', entity_id: s.id, action: 'COSIGN_NOTE', details: `BCBA ${u.name} co-signed and locked session note (${s.units || 0} units CPT ${code})` });
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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
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
      const ctx = { tok: cookies.tok, query: Object.fromEntries(url.searchParams.entries()) };
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
    let rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
    if (rel === 'website' || rel === 'marketing') rel = 'website.html';
    if (rel === 'facility-model' || rel === 'financial-model') rel = 'Clinic_Sensory_Gym_Financial_Model.html';
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
