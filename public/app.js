if (typeof window !== 'undefined' && typeof document !== 'undefined') {
const $app = document.getElementById('app');
let me = null;
let activeModal = null;
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const val = (id) => (document.getElementById(id) || {}).value || '';
const LV = { I: 'Independent', V: 'Verbal prompt', G: 'Gestural prompt', M: 'Model prompt', P: 'Physical prompt', N: 'Did not comply' };
const fmtT = (s) => s ? new Date(s.length === 16 ? s : s).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && me) { me = null; render(); } throw new Error(j.error || 'Error'); }
  return j;
}
const safe = (fn) => async (...a) => { try { await fn(...a); } catch (e) { alert(e.message); } };

const NAV = {
  BCBA: [['dashboard', '🏠 Dashboard'], ['clients', '👧 Clients (360 Hub)'], ['schedule', '📅 Schedule'], ['notes', '📝 Notes & Sign-off'], ['supervision', '🎯 BACB Supervision']],
  RBT: [['dashboard', '🏠 My Day'], ['schedule', '📅 Schedule'], ['clients', '👧 My Clients'], ['notes', '📝 Notes'], ['supervision', '🎯 My Supervision']],
  PARENT: [['clients', '👧 My Child']],
};

function shell(content, route) {
  return `<div class="layout"><nav><h2>Effective Behavioral Approach</h2>
  ${NAV[me.role].map(([r, l]) => `<a class="${route === r ? 'on' : ''}" onclick="go('${r}')">${l}</a>`).join('')}
  <a onclick="act.logout()">🚪 Log out</a><div style="font-size:.75rem;margin-top:16px;opacity:.85">Logged in as:<br><b>${esc(me.name)}</b> (${me.role})</div></nav>
  <main>${content}</main></div>${activeModal ? renderModal() : ''}`;
}
window.go = (r, id) => { location.hash = id ? `${r}/${id}` : r; };

// ---------- views ----------
function loginView(err) {
  return `<div class="login card"><h2>Effective Behavioral Approach</h2>
  <p style="color:#666;font-size:.9rem">Unified Behavioral Health Record (UBHR) & Clinical Cockpit</p>
  <label>Email</label><input id="em" value="bcba@eba.test"><label>Password</label><input id="pw" type="password" value="password">
  <button onclick="act.login()">Log in</button><div class="err">${esc(err || '')}</div>
  <small>Demo logins: bcba@eba.test · rbt@eba.test · parent@eba.test (password: password)</small></div>`;
}

async function dashboardView() {
  const d = await api('GET', '/api/dashboard');
  const sup = d.supervision || { supPct: 0, compliant: false };
  return `<h1>${me.role === 'RBT' ? 'My Clinical Day' : 'Practice Dashboard'}</h1>
  <div class="grid">
    <div class="card"><div class="stat">${d.appts.length}</div>Today's sessions</div>
    <div class="card"><div class="stat">${d.rbt}</div>RBT 1:1 sessions</div>
    <div class="card"><div class="stat">${d.bcba}</div>BCBA sessions</div>
    <div class="card"><div class="stat">${d.incompleteNotes}</div>Notes pending completion</div>
    <div class="card"><div class="stat" style="color:${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">${sup.supPct}%</div>BACB Supervision (${sup.compliant ? 'Compliant ≥5%' : 'Action Needed'})</div>
    ${me.role === 'BCBA' ? `<div class="card"><div class="stat">${d.pendingApprovals}</div>Drafts to approve</div><div class="card"><div class="stat">${d.pendingSign}</div>Notes to review & sign</div>` : ''}
  </div>
  <div class="card">
    <div class="flex-between"><h3>Today's Schedule</h3><button class="sec" onclick="go('schedule')">Full Schedule 📅</button></div>
    ${d.appts.length ? `<table>${d.appts.map((a) => `<tr><td>${fmtT(a.start)}–${a.end.slice(11)}</td><td><b>${esc(a.client)}</b></td><td><span class="badge p">${esc(a.role)}</span> ${esc(a.setting)}</td><td><button onclick="act.start(${a.id})">${a.session ? 'Open Session' : 'Start Session'}</button></td></tr>`).join('')}</table>` : '<p style="color:#666">No appointments scheduled for today.</p>'}
  </div>
  ${d.auths.length ? `<div class="card"><h3>⚠ Authorizations Near Limit (≥80% used)</h3>${d.auths.map((a) => `<div style="margin-bottom:6px"><b>${esc(a.client)}</b> – CPT ${esc(a.code)}: <span class="tag draft">${a.used} / ${a.authorized} units used</span></div>`).join('')}</div>` : ''}`;
}

async function clientsView() {
  const cs = await api('GET', '/api/clients');
  if (me.role === 'PARENT' && cs.length) return clientView(cs[0].id);
  return `<h1>Children & Client 360 Records</h1>
  ${me.role === 'BCBA' ? `<div class="card"><h3>Intake New Client</h3>
  <div class="row">
    <div><label>Name</label><input id="nn" placeholder="e.g. Maya"></div>
    <div><label>Date of Birth</label><input id="nd" type="date"></div>
    <div><label>Diagnosis</label><input id="ng" value="Autism Spectrum Disorder"></div>
  </div>
  <button onclick="act.addClient()">Create Client Profile</button></div>` : ''}
  <div class="card"><table><tr><th>Client Name</th><th>Diagnosis</th><th>Setting / School</th><th>Clinical Cockpit</th></tr>${cs.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.diagnosis)}</td><td>${esc(c.school || 'Home')}</td><td><button class="sec" onclick="go('client',${c.id})">Open 360 Cockpit 👧</button></td></tr>`).join('')}</table></div>`;
}

let tab = 'overview';
let showCrisis = false;

function chart(series, baseline, target) {
  if (!series || !series.length) return '<small style="color:#888">No trial data recorded yet.</small>';
  const w = 320, h = 110, n = series.length;
  const x = (i) => n === 1 ? w / 2 : 12 + (i * (w - 24)) / (n - 1), y = (p) => h - 12 - (p / 100) * (h - 24);
  const pts = series.map((s, i) => `${x(i)},${y(s.pct)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;background:#fafafe;border-radius:8px;border:1px solid #eef">
  <line x1="0" x2="${w}" y1="${y(baseline)}" y2="${y(baseline)}" stroke="#999" stroke-dasharray="3"/>
  <line x1="0" x2="${w}" y1="${y(target)}" y2="${y(target)}" stroke="#1e9e5a" stroke-dasharray="3"/>
  <polyline fill="none" stroke="#4b3fa8" stroke-width="2.5" points="${pts}"/>
  ${series.map((s, i) => `<circle cx="${x(i)}" cy="${y(s.pct)}" r="3.5" fill="#4b3fa8"><title>Session ${s.session}: ${s.pct}%</title></circle>`).join('')}
  </svg>
  <div style="font-size:.75rem;color:#666;margin-top:2px">Baseline: ${baseline}% · Target: ${target}%</div>`;
}

const ANTS = ['Transition from preferred activity', 'Removal of preferred item', 'Difficult academic task', 'Denied access', 'Peer proximity / space', 'Loud sensory environment', 'Unstructured free time'];
const BEHAVIORS = ['Screaming', 'Aggression', 'Elopement', 'Task refusal', 'Crying', 'Property destruction', 'Self-injurious behavior'];
const FUNCTIONS = ['Escape', 'Attention', 'Tangible', 'Sensory'];

async function clientView(id) {
  const data = await api('GET', '/api/clients/' + id);
  const { client: c, goals, plans, stories, auths, assigned, abcLogs = [], abcSummary = { functions: {}, total: 0 }, supervisionLogs = [] } = data;
  const B = me.role === 'BCBA', P = me.role === 'PARENT';
  const tabs = P ? [['goals', '🎯 Goals'], ['stories', '📖 Stories']] : [
    ['overview', '🌟 360 Cockpit'],
    ['skills', '🎯 Skills & Targets'],
    ['behavior_abc', '📊 Behavior & ABC Logs'],
    ['plans', '📋 Behavior Plans (BIP)'],
    ['stories', '📖 Social Stories'],
    ['profile', '👤 Vitals & Bio'],
    ['services', '💳 Authorizations']
  ];
  if (P && !['goals', 'stories'].includes(tab)) tab = 'goals';
  if (!P && !tabs.map(t=>t[0]).includes(tab)) tab = 'overview';

  // 1. Pinned Clinical Vitals Banner (Always visible in Client 360)
  const vitalsBanner = `
  <div class="vitals-banner">
    <div class="vitals-header">
      <div>
        <h2 style="margin:0;display:inline-block;vertical-align:middle">👧 ${esc(c.name)}</h2>
        <span class="badge p" style="margin-left:8px">${esc(c.diagnosis || 'ASD')}</span>
        ${c.dob ? `<span class="badge" style="margin-left:4px">DOB: ${esc(c.dob)}</span>` : ''}
      </div>
      <div>
        ${auths.length ? auths.map(a => `<span class="badge ${a.used/a.authorized >= 0.8 ? 'att' : 'tan'}">CPT ${esc(a.code)}: ${a.authorized - a.used} units left</span>`).join(' ') : ''}
        <button class="bad" style="padding:6px 12px;font-size:.85rem;margin-left:6px" onclick="act.toggleCrisis()">🚨 Emergency / Crisis Protocol</button>
      </div>
    </div>
    <div class="vitals-grid">
      <div class="vital-item"><div class="vital-label">🗣️ Communication Mode</div><b>${esc(c.communication || 'Verbal')}</b></div>
      <div class="vital-item"><div class="vital-label">🎧 Sensory Profile</div><b>${esc(c.sensory || 'Standard')}</b></div>
      <div class="vital-item"><div class="vital-label">⚡ Known Triggers</div><b>${esc(c.triggers || 'Transitions')}</b></div>
      <div class="vital-item"><div class="vital-label">🎁 Reinforcers</div><b>${esc(c.reinforcers || 'Praise, preferred toys')}</b></div>
    </div>
    ${showCrisis ? `
    <div class="crisis-box">
      <div class="flex-between"><b>⚠️ De-Escalation & Safety Crisis Protocol</b><button class="bad" style="padding:2px 8px;font-size:.75rem" onclick="act.toggleCrisis()">✕ Close</button></div>
      <div style="white-space:pre-wrap;margin-top:6px;font-size:.9rem">${esc(c.crisis_plan || '1. Offer sensory quiet space.\n2. Use calm, low-tone language.\n3. Do not engage in arguments or physical restraint.\n4. Provide replacement communication card.')}</div>
      <div style="margin-top:6px;font-size:.8rem">Emergency Contact: <b>${esc(c.emergency || 'Guardian')}</b></div>
    </div>` : ''}
  </div>`;

  let body = '';

  // Tab: Overview / Consolidated 360 Cockpit
  if (tab === 'overview') {
    body = `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
      <!-- Column 1: Skills & Targets -->
      <div>
        <div class="card">
          <div class="flex-between"><h3>🎯 Active Skill Targets</h3><button class="sec" onclick="act.setTab('skills')">View All</button></div>
          ${goals.slice(0, 3).map(g => `
            <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #eee">
              <div class="flex-between"><b>${esc(g.title)}</b><span class="badge ${g.trend === 'Improving' ? 'tan' : 'p'}">${esc(g.trend)}</span></div>
              <div style="font-size:.85rem;color:#555">Baseline: ${g.baseline}% · Current: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b> · Target: ${g.target}%</div>
              ${chart(g.series, g.baseline, g.target)}
            </div>
          `).join('') || '<p style="color:#888">No skill targets yet.</p>'}
        </div>

        <div class="card">
          <div class="flex-between"><h3>📋 Active Behavior Intervention Plan</h3><button class="sec" onclick="act.setTab('plans')">Manage BIP</button></div>
          ${plans.length ? `
            <b>Target Behavior: ${esc(plans[0].behavior)}</b> <span class="tag ${plans[0].status}">${plans[0].status}</span>
            <p style="font-size:.9rem;margin:6px 0"><b>Replacement Behavior:</b> ${esc(plans[0].data.replacement)}</p>
            <div style="font-size:.85rem;color:#555"><b>Prevention:</b> ${esc(plans[0].data.prevention.slice(0, 3).join(', '))}</div>
          ` : '<p style="color:#888">No behavior plan drafted yet.</p>'}
        </div>
      </div>

      <!-- Column 2: Behavior & ABC Reduction Hub -->
      <div>
        <div class="card">
          <div class="flex-between">
            <h3>📊 ABC Data & Behavior Reduction</h3>
            <button class="ok" onclick="act.openAbcModal(${c.id})">⚡ Log ABC Event</button>
          </div>
          <div class="abc-grid">
            <div class="abc-metric Escape"><div style="font-size:1.4rem;font-weight:700">${abcSummary.functions.Escape || 0}</div><small>Escape</small></div>
            <div class="abc-metric Attention"><div style="font-size:1.4rem;font-weight:700">${abcSummary.functions.Attention || 0}</div><small>Attention</small></div>
            <div class="abc-metric Tangible"><div style="font-size:1.4rem;font-weight:700">${abcSummary.functions.Tangible || 0}</div><small>Tangible</small></div>
            <div class="abc-metric Sensory"><div style="font-size:1.4rem;font-weight:700">${abcSummary.functions.Sensory || 0}</div><small>Sensory</small></div>
          </div>
          <h4 style="margin:12px 0 6px">Recent Incidents (${abcLogs.length} total)</h4>
          ${abcLogs.slice(0, 3).map(a => `
            <div style="background:#fafafa;padding:8px 10px;border-radius:6px;margin-bottom:6px;font-size:.85rem">
              <div class="flex-between"><b>${esc(a.behavior)}</b> <span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : ''}">${esc(a.perceived_function || 'Escape')}</span></div>
              <div style="color:#666;font-size:.8rem">Antecedent: ${esc(a.antecedent)} · Consequence: ${esc(a.consequence)}</div>
            </div>
          `).join('') || '<p style="color:#888">No maladaptive incidents logged.</p>'}
        </div>

        <div class="card">
          <div class="flex-between"><h3>📖 Social Stories & Caregiver Hub</h3><button class="sec" onclick="act.setTab('stories')">Stories</button></div>
          ${stories.slice(0, 2).map(s => `
            <div style="margin-bottom:8px">
              <b>${esc(s.content.title)}</b> <span class="tag ${s.status}">${s.status}</span>
              ${s.status === 'shared' ? `<br><small style="color:var(--p)">✓ Shared with parent</small>` : ''}
            </div>
          `).join('') || '<p style="color:#888">No stories drafted yet.</p>'}
        </div>
      </div>
    </div>`;
  }

  // Tab: Skills & Targets
  else if (tab === 'skills') {
    body = `
    <div class="card">
      <div class="flex-between"><h3>Skill Targets & Discrete Trial Progress</h3>${B ? `<button class="ok" onclick="document.getElementById('add_goal_card').style.display='block'">+ Add Skill Target</button>` : ''}</div>
      ${goals.map((g) => `<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #eee">
        <div class="flex-between"><h4>${esc(g.title)}</h4><span class="tag ${g.trend === 'Improving' ? 'approved' : 'draft'}">${esc(g.trend)}</span></div>
        <div>Baseline: <b>${g.baseline}%</b> · Current: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b> · Target: ${g.target}%</div>
        ${chart(g.series, g.baseline, g.target)}
      </div>`).join('') || '<p style="color:#888">No goals recorded yet.</p>'}
    </div>
    ${B ? `<div class="card" id="add_goal_card" style="display:none">
      <h3>Add New Skill Target</h3>
      <div class="row">
        <div><label>Title</label><input id="gt" placeholder="e.g. Turn-taking with peers"></div>
        <div><label>Baseline % Independent</label><input id="gb" type="number" value="20"></div>
        <div><label>Target % Mastery</label><input id="gg" type="number" value="80"></div>
      </div>
      <button onclick="act.addGoal(${c.id})">Save Goal</button>
    </div>` : ''}`;
  }

  // Tab: Behavior & ABC Logs
  else if (tab === 'behavior_abc') {
    body = `
    <div class="card">
      <div class="flex-between">
        <h3>Antecedent-Behavior-Consequence (ABC) Data Center</h3>
        <button class="ok" onclick="act.openAbcModal(${c.id})">⚡ Log ABC Incident</button>
      </div>
      <p style="color:#666;font-size:.9rem">Track maladaptive behaviors, environmental antecedents, and deduce functional maintainers (Escape, Attention, Tangible, Sensory).</p>
      
      <div class="abc-grid">
        <div class="abc-metric Escape"><h4>${abcSummary.functions.Escape || 0}</h4><b>Escape / Avoidance</b></div>
        <div class="abc-metric Attention"><h4>${abcSummary.functions.Attention || 0}</h4><b>Attention Seeking</b></div>
        <div class="abc-metric Tangible"><h4>${abcSummary.functions.Tangible || 0}</h4><b>Access to Tangible</b></div>
        <div class="abc-metric Sensory"><h4>${abcSummary.functions.Sensory || 0}</h4><b>Sensory / Automatic</b></div>
      </div>

      <h4 style="margin-top:20px">Incident History (${abcLogs.length} total events)</h4>
      ${abcLogs.length ? `<table>
        <tr><th>Time</th><th>Behavior</th><th>Antecedent</th><th>Consequence</th><th>Function</th><th>Notes</th></tr>
        ${abcLogs.map(a => `<tr>
          <td>${fmtT(a.ts)}</td>
          <td><b>${esc(a.behavior)}</b></td>
          <td>${esc(a.antecedent)}</td>
          <td>${esc(a.consequence)}</td>
          <td><span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : ''}">${esc(a.perceived_function)}</span></td>
          <td style="font-size:.85rem">${esc(a.notes || '—')}</td>
        </tr>`).join('')}
      </table>` : '<p style="color:#888">No ABC incidents recorded yet.</p>'}
    </div>`;
  }

  // Tab: Behavior Intervention Plans (BIP)
  else if (tab === 'plans') {
    body = (B ? `<div class="card"><h3>AI Behavior Plan Builder (Draft)</h3>
      <label>Target Behavior</label>
      <select id="pb">${BEHAVIORS.map((x) => `<option>${x}</option>`).join('')}</select>
      <label>Possible Antecedents</label>
      ${ANTS.map((a) => `<div><label><input type="checkbox" class="pa" value="${a}" style="width:auto"> ${a}</label></div>`).join('')}
      <button onclick="act.genPlan(${c.id})">Generate Draft BIP</button></div>` : '') +
      plans.map((p) => planCard(p, B)).join('');
  }

  // Tab: Social Stories
  else if (tab === 'stories') {
    body = (B ? `<div class="card"><h3>AI Social Story Builder</h3>
      <div class="row"><div><label>Situation</label><input id="ss" placeholder="e.g. Circle time / sharing toys"></div><div><label>Challenge</label><input id="sc" placeholder="e.g. Doesn't want peers nearby"></div></div>
      <div class="row"><div><label>Goal</label><input id="sg" placeholder="e.g. Ask for space using calm words"></div><div><label>Interest</label><input id="si" placeholder="e.g. Trains, LEGO"></div><div><label>Visuals</label><select id="sv"><option>Cartoon</option><option>Photos</option><option>Simple icons</option></select></div></div>
      <button onclick="act.genStory(${c.id})">Generate Draft Story</button></div>` : '') +
      (stories.map((s) => storyCard(s, B)).join('') || '<div class="card">No social stories drafted yet.</div>');
  }

  // Tab: Profile & Vitals
  else if (tab === 'profile') {
    const f = [
      ['name', 'Full Name'], ['dob', 'Date of Birth'], ['diagnosis', 'Diagnosis'],
      ['guardian', 'Parent/Guardian'], ['school', 'School / Educational Setting'],
      ['emergency', 'Emergency Contact'], ['insurance', 'Insurance / Payer Policy #'],
      ['communication', 'Communication Modality (vocal, AAC, PECS)'],
      ['reinforcers', 'Reinforcer Hierarchy (comma separated)'],
      ['sensory', 'Sensory Profile (seeking vs avoiding)'],
      ['triggers', 'Known Triggers & Setting Events'],
      ['crisis_plan', 'Emergency De-Escalation & Crisis Safety Protocol']
    ];
    body = `<div class="card">
      <h3>Client Clinical Profile & Vitals</h3>
      <div class="row">${f.map(([k, l]) => `<div><label>${l}</label>${k === 'crisis_plan' ? `<textarea id="f_${k}" rows="4" ${B ? '' : 'disabled'}>${esc(c[k])}</textarea>` : `<input id="f_${k}" value="${esc(c[k])}" ${B ? '' : 'disabled'}>`}</div>`).join('')}</div>
      ${B ? `<button onclick="act.saveClient(${c.id})">Save Clinical Profile</button>` : ''}
    </div>${assigned.length ? `<div class="card">Assigned Therapists: ${assigned.map((a) => esc(a.name)).join(', ')}</div>` : ''}`;
  }

  // Tab: Services, Authorizations & Supervision
  else if (tab === 'services') {
    body = `
    <div class="card">
      <h3>Active Insurance Authorizations</h3>
      <table>
        <tr><th>CPT Code</th><th>Description</th><th>Authorized Units</th><th>Used Units</th><th>Remaining</th><th>Status</th></tr>
        ${auths.map((a) => {
          const rem = a.authorized - a.used;
          const near = a.used / a.authorized >= 0.8;
          return `<tr>
            <td><b>${esc(a.code)}</b></td>
            <td>${a.code === '97153' ? 'Direct 1:1 Adaptive Behavior Treatment (RBT)' : a.code === '97155' ? 'Protocol Modification & Supervision (BCBA)' : 'ABA Service'}</td>
            <td>${a.authorized}</td><td>${a.used}</td><td><b>${rem}</b></td>
            <td><span class="tag ${near ? 'draft' : 'approved'}">${near ? 'Near Limit' : 'Active'}</span></td>
          </tr>`;
        }).join('')}
      </table>
      ${B ? `<div class="row" style="margin-top:12px"><div><label>CPT Code</label><select id="ac"><option value="97153">97153 (Direct RBT)</option><option value="97155">97155 (BCBA Supervision)</option><option value="97156">97156 (Parent Guidance)</option></select></div><div><label>Authorized Units</label><input id="au" type="number" value="480"></div></div><button onclick="act.addAuth(${c.id})">Add Authorization</button>` : ''}
    </div>
    <div class="card">
      <h3>BACB Supervision Records for ${esc(c.name)}</h3>
      ${supervisionLogs.length ? `<table>
        <tr><th>Date</th><th>BCBA</th><th>RBT Supervised</th><th>Duration</th><th>Type</th><th>Notes</th></tr>
        ${supervisionLogs.map(s => `<tr><td>${fmtT(s.ts)}</td><td>${esc(s.bcba)}</td><td>${esc(s.rbt)}</td><td>${s.minutes} mins</td><td><span class="badge p">${esc(s.type)}</span></td><td>${esc(s.notes || '—')}</td></tr>`).join('')}
      </table>` : '<p style="color:#888">No direct supervision logs for this client yet.</p>'}
    </div>`;
  }

  return `${vitalsBanner}<div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" onclick="act.setTab('${k}')">${l}</button>`).join('')}</div>${body}`;
}

function planCard(p, B) {
  const d = p.data, list = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<div class="card"><h3>Behavior Intervention Plan: ${esc(p.behavior)} <span class="tag ${p.status}">${p.status}${p.approved_by ? ' by ' + esc(p.approved_by) : ''}</span></h3>
  <b>Antecedents:</b>${list(d.antecedents)}
  <b>Prevention Protocols:</b>${list(d.prevention)}
  <b>Replacement Behavior (FCT):</b><p style="background:#f0fdf4;padding:8px 12px;border-radius:6px;margin:6px 0"><b>${esc(d.replacement)}</b></p>
  <b>Reinforcement:</b>${list(d.reinforcement)}
  <b>Staff Response / Reactive Protocol:</b>${list(d.staff)}
  ${B ? `<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--p);font-weight:600">Edit Plan Details</summary>
  <label>Operational Definition</label><textarea id="pd${p.id}">${esc(d.definition)}</textarea>
  <label>Replacement Behavior</label><input id="pr${p.id}" value="${esc(d.replacement)}">
  <label>Prevention (one per line)</label><textarea id="pp${p.id}" rows="3">${esc(d.prevention.join('\n'))}</textarea>
  <label>Staff Response (one per line)</label><textarea id="ps${p.id}" rows="3">${esc(d.staff.join('\n'))}</textarea>
  <button class="sec" onclick="act.savePlan(${p.id})">Save Edits (Resets to Draft)</button></details>
  ${p.status === 'draft' ? `<button class="ok" style="margin-top:8px" onclick="act.approvePlan(${p.id})">✓ BCBA Approve & Activate Plan</button>` : ''}` : ''}</div>`;
}

function storyCard(s, B) {
  const c = s.content;
  return `<div class="card"><h3>${esc(c.title)} <span class="tag ${s.status}">${s.status}</span></h3>
  ${c.sentences.map((x) => `<div class="sentence"><span class="ic">${x.icon}</span><span>${esc(x.text)}</span></div>`).join('')}
  ${B ? `<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--p);font-weight:600">Edit Story Text</summary>
  <textarea id="st${s.id}" rows="6">${esc(c.sentences.map((x) => x.text).join('\n'))}</textarea>
  <button class="sec" onclick="act.saveStory(${s.id})">Save Edits (Resets to Draft)</button></details>
  ${s.status === 'draft' ? `<button class="ok" style="margin-top:8px" onclick="act.approveStory(${s.id})">✓ BCBA Approve Story</button>` : ''}
  ${s.status !== 'draft' ? `<button style="margin-top:8px" onclick="act.shareStory(${s.id})">${s.status === 'shared' ? '🔗 View Parent Link' : '📤 Share Parent Link'}</button>` : ''}` : ''}</div>`;
}

async function scheduleView() {
  const a = await api('GET', '/api/schedule');
  let form = '';
  if (me.role === 'BCBA') {
    const [cs, st] = await Promise.all([api('GET', '/api/clients'), api('GET', '/api/staff')]);
    form = `<div class="card"><h3>Schedule New Session</h3><div class="row">
    <div><label>Client</label><select id="ac">${cs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div><label>Therapist</label><select id="as">${st.map((s) => `<option value="${s.id}">${esc(s.name)} (${s.role})</option>`).join('')}</select></div>
    <div><label>Start Time</label><input id="astart" type="datetime-local"></div>
    <div><label>End Time</label><input id="aend" type="datetime-local"></div>
    <div><label>Setting</label><select id="aset"><option>Home</option><option>School</option><option>Clinic</option></select></div></div>
    <button onclick="act.addAppt()">Schedule Session</button></div>`;
  }
  const days = {}; a.forEach((x) => { (days[x.start.slice(0, 10)] ||= []).push(x); });
  return `<h1>Clinical Schedule</h1>${form}${Object.entries(days).map(([d, xs]) => `<div class="card"><h3>${new Date(d + 'T00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</h3><table>${xs.map((x) => `<tr><td>${x.start.slice(11)}–${x.end.slice(11)}</td><td><b>${esc(x.client)}</b></td><td><span class="badge p">${esc(x.role)}</span> ${esc(x.setting)}</td><td>${esc(x.staff)}</td><td>${x.session && x.session.end ? '<span class="tag approved">done</span>' : ''} <button onclick="act.start(${x.id})">${x.session ? 'Open' : 'Start'}</button></td></tr>`).join('')}</table></div>`).join('') || '<div class="card">No appointments scheduled.</div>'}`;
}

let timer = null;
async function sessionView(id) {
  const v = await api('GET', '/api/sessions/' + id);
  const { session: s, client, goals, plans, stories, abcLogs = [] } = v;
  const ended = !!s.end;
  const startMs = new Date(s.start).getTime();
  clearInterval(timer);
  if (!ended) {
    timer = setInterval(() => {
      const el = document.getElementById('clock');
      const unitsEl = document.getElementById('calc_units');
      if (!el) return clearInterval(timer);
      const totalSec = Math.floor((Date.now() - startMs) / 1000);
      const totalMin = Math.floor(totalSec / 60);
      el.textContent = [Math.floor(totalSec / 3600), Math.floor(totalMin % 60), totalSec % 60].map((n) => String(n).padStart(2, '0')).join(':');
      if (unitsEl) {
        const fullUnits = Math.floor(totalMin / 15);
        const remMin = totalMin % 15;
        const curUnits = fullUnits + (remMin >= 8 ? 1 : 0);
        unitsEl.textContent = `${curUnits} unit${curUnits === 1 ? '' : 's'} (CMS 8-min rule)`;
      }
    }, 1000);
  }
  const sum = (g) => g.summary.total ? Object.keys(LV).map((k) => `<div>${LV[k]}: <b>${g.summary.pct[k]}%</b><div class="bar"><div style="width:${g.summary.pct[k]}%"></div></div></div>`).join('') + `<small>${g.summary.total} opportunities recorded</small>` : '<small style="color:#888">No trials recorded yet this session.</small>';

  return `<h1>Active Session Cockpit – ${esc(client.name)}</h1>
  <div class="card" style="text-align:center">
    <div class="big" id="clock">${ended ? s.units + ' units' : '00:00:00'}</div>
    <div id="calc_units" style="font-weight:600;color:var(--p);margin-bottom:8px">${ended ? `${s.units} × 15-min billing units` : '0 units'}</div>
    ${ended ? `<p style="color:var(--ok)">Session Ended · Ready for Clinical Note & Review</p>` : `<div><button class="bad" style="padding:12px 24px;font-size:1.1rem" onclick="act.endSession(${s.id})">⏹ END SESSION</button> <button class="ok" style="padding:12px 20px;font-size:1.1rem;margin-left:8px" onclick="act.openAbcModal(${client.id}, ${s.id})">⚡ Log ABC Incident</button></div>`}
  </div>

  <!-- BIP Protocol Drawer (Fast de-escalation access) -->
  ${plans.length ? `
  <details class="drawer">
    <summary style="cursor:pointer;font-weight:700;color:var(--p)">🚨 Behavior Intervention Plan Quick-Reference (${esc(plans[0].behavior)})</summary>
    <div style="margin-top:8px">
      <p style="margin:4px 0"><b>Replacement Behavior:</b> ${esc(plans[0].data.replacement)}</p>
      <p style="margin:4px 0"><b>Staff Response Protocol:</b> ${esc(plans[0].data.staff.join(' · '))}</p>
      <p style="margin:4px 0;font-size:.85rem;color:#555"><b>Prevention:</b> ${esc(plans[0].data.prevention.join(' · '))}</p>
    </div>
  </details>` : ''}

  <!-- In-Session ABC Incidents -->
  ${abcLogs.length ? `
  <div class="card" style="background:#fefce8;border:1px solid #fef08a">
    <h4>⚡ ABC Incidents Logged This Session (${abcLogs.length})</h4>
    ${abcLogs.map(a => `<div style="font-size:.85rem;margin-bottom:4px"><b>${esc(a.behavior)}</b> (${esc(a.perceived_function)}): Antecedent: ${esc(a.antecedent)} · Consequence: ${esc(a.consequence)}</div>`).join('')}
  </div>` : ''}

  <!-- Skill Target Trials -->
  ${goals.map((g) => `<div class="card"><h3>${esc(g.title)}</h3>
    ${ended ? '' : `<div class="levels">${Object.entries(LV).map(([k, l]) => `<button class="${k === 'I' ? 'ok' : k === 'N' ? 'bad' : ''}" onclick="act.trial(${s.id},${g.id},'${k}')">${k === 'I' ? '☑ ' : '☐ '}${l}</button>`).join('')}</div><button class="sec" style="margin-top:8px" onclick="act.undo(${s.id})">↩ Undo Last Trial</button>`}
    <div style="margin-top:10px">${sum(g)}</div></div>`).join('')}

  <!-- Clinical Session Note & Dual Sign-off -->
  <div class="card">
    <div class="flex-between">
      <h3>Clinical Session Documentation <span class="tag ${s.note_status === 'none' ? '' : s.note_status}">${s.note_status === 'pending_approval' ? 'Pending BCBA Approval' : s.note_status}</span></h3>
      ${ended && s.note_status !== 'signed' ? `<button class="sec" onclick="act.genNote(${s.id})">🤖 Auto-Draft Note from Data</button>` : ''}
    </div>
    ${ended ? `
      <label>Session Narrative (Trials + ABC Incidents + Interventions)</label>
      <textarea id="note" rows="10" ${s.note_status === 'signed' ? 'disabled' : ''}>${esc(s.note)}</textarea>
      ${s.submitted_by ? `<div style="font-size:.85rem;color:#555;margin:4px 0"><b>RBT Author:</b> ${esc(s.submitted_by)} ${s.rbt_signed_at ? `(${fmtT(s.rbt_signed_at)})` : ''}</div>` : ''}
      ${s.signed_by ? `<div style="font-size:.85rem;color:var(--ok);margin:4px 0"><b>BCBA Co-Signer:</b> ${esc(s.signed_by)} ${s.bcba_signed_at ? `(${fmtT(s.bcba_signed_at)})` : ''}</div>` : ''}
      ${s.note_status !== 'signed' ? `
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
          <button onclick="act.saveNote(${s.id})">💾 Save Draft</button>
          ${me.role === 'RBT' ? `<button class="ok" onclick="act.submitNote(${s.id})">📤 Submit Note for BCBA Review</button>` : ''}
          ${me.role === 'BCBA' ? `<button class="ok" onclick="act.signNote(${s.id})">✍️ BCBA Co-Sign & Approve Note</button>` : ''}
        </div>
      ` : `<div style="color:var(--ok);font-weight:600;margin-top:8px">✓ Clinical note finalized and co-signed by BCBA</div>`}
    ` : '<p style="color:#666">End the session when complete to compile trial and ABC data into the clinical note.</p>'}
  </div>`;
}

async function notesView() {
  const ns = await api('GET', '/api/notes');
  return `<h1>Clinical Session Notes & Signatures</h1>
  <div class="card">
    <table>
      <tr><th>Session Date</th><th>Client</th><th>Units / Time</th><th>Documentation Status</th><th>Action</th></tr>
      ${ns.map((n) => `<tr>
        <td>${fmtT(n.start)}</td>
        <td><b>${esc(n.client)}</b></td>
        <td>${n.units} units (${n.units * 15} mins)</td>
        <td><span class="tag ${n.note_status === 'none' ? 'draft' : n.note_status}">${n.note_status}</span></td>
        <td><button class="sec" onclick="go('session',${n.id})">Open Note</button></td>
      </tr>`).join('')}
    </table>
  </div>`;
}

async function supervisionView() {
  const sup = await api('GET', '/api/supervision');
  const B = me.role === 'BCBA';
  let form = '';
  if (B) {
    const [cs, st] = await Promise.all([api('GET', '/api/clients'), api('GET', '/api/staff')]);
    const rbts = st.filter(s => s.role === 'RBT');
    form = `<div class="card"><h3>Record BACB Supervision Meeting</h3>
    <div class="row">
      <div><label>Client</label><select id="sup_c">${cs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div><label>RBT Supervised</label><select id="sup_r">${rbts.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>
      <div><label>Minutes Supervised</label><input id="sup_m" type="number" value="60"></div>
      <div><label>Supervision Type</label><select id="sup_t"><option>Direct Observation</option><option>Protocol Modification</option><option>Competency Assessment</option><option>Case Conceptualization</option></select></div>
    </div>
    <label>Supervision Notes / Feedback</label><textarea id="sup_n" rows="2" placeholder="e.g. Observed prompt-fading procedures during tabletop trials."></textarea>
    <button onclick="act.addSupervision()">Log Supervision Event</button></div>`;
  }

  return `<h1>BACB Monthly Supervision Tracking</h1>
  <div class="card" style="border-left:6px solid ${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">
    <div class="flex-between">
      <div>
        <h2 style="margin:0">Month: ${esc(sup.month)}</h2>
        <p style="margin:4px 0;color:#666">BACB Requirement: At least 5% of direct RBT therapy hours must be supervised by a BCBA.</p>
      </div>
      <div style="text-align:right">
        <div class="stat" style="color:${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">${sup.supPct}%</div>
        <span class="tag ${sup.compliant ? 'approved' : 'draft'}">${sup.compliant ? '✓ Compliant' : '⚠ Non-compliant'}</span>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;gap:16px">
      <div>RBT Direct Hours: <b>${Math.round(sup.rbtDirectMinutes / 60 * 10) / 10} hrs</b> (${sup.rbtDirectMinutes} mins)</div>
      <div>Supervised Hours: <b>${Math.round(sup.supMinutes / 60 * 10) / 10} hrs</b> (${sup.supMinutes} mins)</div>
    </div>
  </div>
  ${form}
  <div class="card">
    <h3>Supervision Audit Log</h3>
    ${sup.logs.length ? `<table>
      <tr><th>Date</th><th>Client</th><th>Supervising BCBA</th><th>RBT Supervised</th><th>Duration</th><th>Type</th><th>Notes</th></tr>
      ${sup.logs.map(l => `<tr>
        <td>${fmtT(l.ts)}</td><td><b>${esc(l.client)}</b></td><td>${esc(l.bcba)}</td><td>${esc(l.rbt)}</td>
        <td>${l.minutes} mins</td><td><span class="badge p">${esc(l.type)}</span></td><td>${esc(l.notes || '—')}</td>
      </tr>`).join('')}
    </table>` : '<p style="color:#888">No supervision events logged for this period.</p>'}
  </div>`;
}

// Modal renderer for ABC Incident rapid logging
function renderModal() {
  if (activeModal.type === 'abc') {
    const cid = activeModal.clientId;
    const sid = activeModal.sessionId;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card">
        <div class="flex-between">
          <h3 style="margin:0">⚡ Log ABC Incident</h3>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <p style="font-size:.85rem;color:#666;margin:6px 0 12px">Rapid field entry for maladaptive behavioral episodes.</p>
        
        <label>Target Behavior</label>
        <select id="m_behavior">${BEHAVIORS.map(b => `<option>${b}</option>`).join('')}</select>
        
        <label>Antecedent (What triggered the behavior?)</label>
        <select id="m_antecedent">${ANTS.map(a => `<option>${a}</option>`).join('')}</select>
        
        <label>Consequence / Staff Response</label>
        <input id="m_consequence" value="Prompted replacement communication, provided calm break space">
        
        <label>Perceived Behavioral Function</label>
        <select id="m_function">
          <option value="Escape">Escape / Avoidance</option>
          <option value="Attention">Attention Seeking</option>
          <option value="Tangible">Access to Preferred Tangible / Item</option>
          <option value="Sensory">Automatic / Sensory Reinforcement</option>
        </select>
        
        <label>Clinical Notes</label>
        <textarea id="m_notes" rows="2" placeholder="e.g. Duration 3 mins, client accepted visual timer without aggression."></textarea>
        
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="ok" onclick="act.submitAbcModal(${cid}, ${sid || 'null'})">Save ABC Event</button>
          <button class="sec" onclick="act.closeModal()">Cancel</button>
        </div>
      </div>
    </div>`;
  }
  return '';
}

// ---------- actions ----------
const act = {
  login: safe(async () => {
    try {
      me = await api('POST', '/api/login', { email: val('em'), password: val('pw') });
      location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard';
      render();
    } catch (e) { $app.innerHTML = loginView(e.message); }
  }),
  logout: safe(async () => { await api('POST', '/api/logout'); me = null; location.hash = ''; render(); }),
  addClient: safe(async () => { const r = await api('POST', '/api/clients', { name: val('nn'), dob: val('nd'), diagnosis: val('ng') }); go('client', r.id); }),
  saveClient: safe(async (id) => {
    const b = {};
    ['name', 'dob', 'diagnosis', 'guardian', 'school', 'emergency', 'insurance', 'reinforcers', 'sensory', 'triggers', 'communication', 'crisis_plan'].forEach((k) => b[k] = val('f_' + k));
    await api('PUT', '/api/clients/' + id, b);
    alert('Clinical Profile Saved Successfully');
    render();
  }),
  setTab: (t) => { tab = t; render(); },
  toggleCrisis: () => { showCrisis = !showCrisis; render(); },
  openAbcModal: (cid, sid = null) => { activeModal = { type: 'abc', clientId: cid, sessionId: sid }; render(); },
  closeModal: () => { activeModal = null; render(); },
  submitAbcModal: safe(async (cid, sid) => {
    const payload = {
      behavior: val('m_behavior'),
      antecedent: val('m_antecedent'),
      consequence: val('m_consequence'),
      perceived_function: val('m_function'),
      notes: val('m_notes'),
      session_id: sid
    };
    if (sid) {
      await api('POST', `/api/sessions/${sid}/abc`, payload);
    } else {
      await api('POST', `/api/clients/${cid}/abc`, payload);
    }
    activeModal = null;
    render();
  }),
  addSupervision: safe(async () => {
    await api('POST', '/api/supervision', {
      client_id: val('sup_c'),
      rbt_id: val('sup_r'),
      minutes: val('sup_m'),
      type: val('sup_t'),
      notes: val('sup_n')
    });
    alert('Supervision Event Recorded');
    render();
  }),
  addGoal: safe(async (id) => { await api('POST', `/api/clients/${id}/goals`, { title: val('gt'), baseline: val('gb'), target: val('gg') }); render(); }),
  addAuth: safe(async (id) => { await api('POST', `/api/clients/${id}/auths`, { code: val('ac'), authorized: val('au') }); render(); }),
  genPlan: safe(async (id) => { await api('POST', `/api/clients/${id}/plans/generate`, { behavior: val('pb'), antecedents: [...document.querySelectorAll('.pa:checked')].map((x) => x.value) }); render(); }),
  savePlan: safe(async (id) => {
    const lines = (k) => val(k + id).split('\n').map((s) => s.trim()).filter(Boolean);
    const cur = (await api('GET', location.hash.replace('#client/', '/api/clients/'))).plans.find((p) => p.id === id).data;
    cur.definition = val('pd' + id); cur.replacement = val('pr' + id); cur.prevention = lines('pp'); cur.staff = lines('ps');
    await api('PUT', '/api/plans/' + id, { data: cur });
    render();
  }),
  approvePlan: safe(async (id) => { await api('POST', `/api/plans/${id}/approve`); render(); }),
  genStory: safe(async (id) => { await api('POST', `/api/clients/${id}/stories/generate`, { situation: val('ss'), challenge: val('sc'), goal: val('sg'), interest: val('si'), visuals: val('sv') }); render(); }),
  saveStory: safe(async (id) => {
    const cl = await api('GET', location.hash.replace('#client/', '/api/clients/'));
    const s = cl.stories.find((x) => x.id === id).content;
    const lines = val('st' + id).split('\n').map((t) => t.trim()).filter(Boolean);
    s.sentences = lines.map((t, i) => ({ icon: (s.sentences[i] || s.sentences[s.sentences.length - 1]).icon, type: (s.sentences[i] || {}).type || 'directive', text: t }));
    await api('PUT', '/api/stories/' + id, { content: s });
    render();
  }),
  approveStory: safe(async (id) => { await api('POST', `/api/stories/${id}/approve`); render(); }),
  shareStory: safe(async (id) => { const r = await api('POST', `/api/stories/${id}/share`); prompt('Parent Story Link (Share with family):', location.origin + r.url); render(); }),
  addAppt: safe(async () => { await api('POST', '/api/appointments', { client_id: val('ac'), user_id: val('as'), start: val('astart'), end: val('aend'), setting: val('aset') }); render(); }),
  start: safe(async (id) => { const r = await api('POST', `/api/appointments/${id}/start`); go('session', r.id); }),
  trial: safe(async (sid, gid, level) => { await api('POST', `/api/sessions/${sid}/trials`, { goal_id: gid, level }); render(); }),
  undo: safe(async (sid) => { await api('DELETE', `/api/sessions/${sid}/trials/last`); render(); }),
  endSession: safe(async (sid) => { if (confirm('End clinical session?')) { await api('POST', `/api/sessions/${sid}/end`, {}); render(); } }),
  genNote: safe(async (sid) => { const r = await api('POST', `/api/sessions/${sid}/note/generate`, {}); document.getElementById('note').value = r.note; }),
  saveNote: safe(async (sid) => { await api('PUT', `/api/sessions/${sid}/note`, { note: val('note') }); alert('Draft note saved'); render(); }),
  submitNote: safe(async (sid) => {
    await api('POST', `/api/sessions/${sid}/note/submit`, { note: val('note') });
    alert('Note submitted for BCBA review');
    render();
  }),
  signNote: safe(async (sid) => {
    await api('PUT', `/api/sessions/${sid}/note`, { note: val('note') });
    await api('POST', `/api/sessions/${sid}/note/sign`);
    alert('Note successfully co-signed and finalized');
    render();
  }),
};
window.act = act;

async function render() {
  if (!me) { try { me = await api('GET', '/api/me'); } catch { $app.innerHTML = loginView(); return; } }
  const [route, id] = (location.hash.slice(1) || (me.role === 'PARENT' ? 'clients' : 'dashboard')).split('/');
  try {
    let html;
    if (route === 'dashboard') html = await dashboardView();
    else if (route === 'clients') html = await clientsView();
    else if (route === 'client') html = await clientView(id);
    else if (route === 'schedule') html = await scheduleView();
    else if (route === 'session') html = await sessionView(id);
    else if (route === 'notes') html = await notesView();
    else if (route === 'supervision') html = await supervisionView();
    else html = '<h1>View Not Found</h1><div class="card">Please select an option from the menu.</div>';
    $app.innerHTML = shell(html, route === 'client' ? 'clients' : route === 'session' ? 'notes' : route);
  } catch (e) { $app.innerHTML = shell(`<div class="card err">${esc(e.message)}</div>`, ''); }
}
window.addEventListener('hashchange', render);
render();
}
