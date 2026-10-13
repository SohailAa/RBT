if (typeof window !== 'undefined' && typeof document !== 'undefined') {
const $app = document.getElementById('app');
let me = null;
let activeModal = null;
let clientSearchQuery = '';
let showKidMode = false;
let tokenCount = 0;
let targetTokens = 5;
let sessionMode = 'dtt';
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const val = (id) => (document.getElementById(id) || {}).value || '';
const LV = {
  I: { label: 'Independent', code: 'I', icon: '☑', cls: 'ok' },
  V: { label: 'Verbal prompt', code: 'V', icon: '💬', cls: 'btn-v' },
  G: { label: 'Gestural prompt', code: 'G', icon: '👉', cls: 'btn-g' },
  M: { label: 'Model prompt', code: 'M', icon: '🧑‍🏫', cls: 'btn-m' },
  P: { label: 'Physical prompt', code: 'P', icon: '🤝', cls: 'btn-p' },
  N: { label: 'Did not comply', code: 'N', icon: '✕', cls: 'bad' }
};
const fmtT = (s) => s ? new Date(s.length === 16 ? s : s).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const getInitials = (n) => (n || '').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'EBA';

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && me) { me = null; render(); } throw new Error(j.error || 'Error'); }
  return j;
}
const safe = (fn) => async (...a) => { try { await fn(...a); } catch (e) { alert(e.message); } };

const NAV = {
  BCBA: [
    ['dashboard', '🏠', 'Dashboard'],
    ['clients', '👧', 'Clients 360'],
    ['schedule', '📅', 'Clinical Schedule'],
    ['notes', '📝', 'Notes & Dual-Sign'],
    ['supervision', '🎯', 'BACB Supervision']
  ],
  RBT: [
    ['dashboard', '🏠', 'My Clinical Day'],
    ['schedule', '📅', 'Schedule'],
    ['clients', '👧', 'My Clients'],
    ['notes', '📝', 'Session Notes'],
    ['supervision', '🎯', 'My Supervision']
  ],
  PARENT: [
    ['clients', '👧', 'My Child']
  ]
};

function shell(content, route) {
  const userInitials = getInitials(me.name);
  return `
  <div class="layout">
    <nav>
      <div class="brand-wrapper">
        <div class="brand-logo">
          <div class="brand-icon">EBA</div>
          <div>
            <div class="brand-title">Effective Behavioral</div>
            <div class="brand-sub">Unified Health Record</div>
          </div>
        </div>
      </div>
      <div class="nav-links">
        ${NAV[me.role].map(([r, ic, l]) => `
          <a class="${route === r ? 'on' : ''}" onclick="go('${r}')">
            <span style="font-size:1.1rem">${ic}</span>
            <span>${l}</span>
          </a>
        `).join('')}
      </div>
      <div class="nav-user">
        <div class="nav-user-header">
          <div class="user-avatar">${userInitials}</div>
          <div style="flex:1;min-width:0;overflow:hidden">
            <div class="user-info-name" title="${esc(me.name)}">${esc(me.name)}</div>
            <span class="user-role-badge">${esc(me.role)}</span>
          </div>
        </div>
        <a class="nav-logout" onclick="act.logout()">Sign Out</a>
      </div>
    </nav>
    <main>
      ${content}
    </main>
  </div>
  ${activeModal ? renderModal() : ''}`;
}

window.go = (r, id) => { location.hash = id ? `${r}/${id}` : r; };

// ---------- Views ----------

function loginView(err) {
  return `
  <div class="login-container">
    <div class="login-box">
      <div class="login-brand">
        <div class="brand-icon" style="width:40px;height:40px;font-size:1.2rem">EBA</div>
        <div>
          <h2 style="margin:0;font-size:1.25rem;color:var(--slate-900)">Effective Behavioral Approach</h2>
          <div style="font-size:0.75rem;color:var(--slate-500);font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Unified Clinical Practice & Cockpit</div>
        </div>
      </div>
      
      <p style="font-size:0.88rem;color:var(--slate-600);margin:12px 0 20px">
        Sign in to access real-time session tracking, unified ABC behavioral records, and dual-signature documentation.
      </p>

      <label>Clinician / Guardian Email</label>
      <input id="em" value="bcba@eba.test" placeholder="name@practice.com" autocomplete="username">
      
      <label>Secure Password</label>
      <input id="pw" type="password" value="password" autocomplete="current-password">
      
      <button style="width:100%;padding:12px;font-size:1rem;margin-top:8px" onclick="act.login()">Sign In to Cockpit</button>
      
      ${err ? `<div class="err" style="text-align:center;margin-top:12px">⚠️ ${esc(err)}</div>` : ''}

      <div class="demo-pills">
        <div style="font-size:0.75rem;font-weight:700;color:var(--slate-500);text-transform:uppercase;letter-spacing:0.04em">Quick Demo Roles (1-Tap Fill & Sign-In):</div>
        <div class="demo-pill" onclick="act.demoLogin('bcba@eba.test')">
          <span>👩‍⚕️ <b>Dr. Dana Rivera</b> (Supervising BCBA)</span>
          <span class="badge p">BCBA</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('rbt@eba.test')">
          <span>👨‍⚕️ <b>Sam Lee</b> (Field Therapist)</span>
          <span class="badge tan">RBT</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('parent@eba.test')">
          <span>👨‍👩‍👧 <b>Mrs. Carter</b> (Client Guardian)</span>
          <span class="badge esc">Parent</span>
        </div>
      </div>
      
      <div style="font-size:0.72rem;color:var(--slate-400);text-align:center;margin-top:20px">
        🔒 HIPAA & 21 CFR Part 11 Compliant Data Isolation · Zero PHI Synthetic Sandbox
      </div>
    </div>
  </div>`;
}

async function dashboardView() {
  const d = await api('GET', '/api/dashboard');
  const sup = d.supervision || { supPct: 0, compliant: false };
  const todayStr = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  return `
  <div class="page-header">
    <div>
      <h1>${me.role === 'RBT' ? 'My Clinical Day' : 'Practice Operations Dashboard'}</h1>
      <p class="page-sub">Today is <b>${todayStr}</b> · Active Shift Status: <span class="badge ${sup.compliant ? 'tan' : 'att'}">● Operational</span></p>
    </div>
    <div>
      <button class="sec" onclick="go('schedule')">📅 View Full Schedule</button>
    </div>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="stat-label">Today's Appointments</div>
      <div class="stat">${d.appts.length}</div>
      <div class="stat-sub">Scheduled therapy sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">1:1 Direct (97153)</div>
      <div class="stat" style="color:var(--primary)">${d.rbt}</div>
      <div class="stat-sub">RBT direct client care</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">BCBA Supervision (97155)</div>
      <div class="stat" style="color:var(--sensory)">${d.bcba}</div>
      <div class="stat-sub">Protocol mods & direct review</div>
    </div>
    <div class="stat-card ${d.incompleteNotes > 0 ? 'warn' : 'ok'}">
      <div class="stat-label">Notes Pending</div>
      <div class="stat" style="color:${d.incompleteNotes > 0 ? 'var(--warn)' : 'var(--ok)'}">${d.incompleteNotes}</div>
      <div class="stat-sub">Awaiting author submission / sign</div>
    </div>
    <div class="stat-card ${sup.compliant ? 'ok' : 'warn'}">
      <div class="stat-label">BACB 5% Supervision</div>
      <div class="stat" style="color:${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">${sup.supPct}%</div>
      <div class="stat-sub"><span class="tag ${sup.compliant ? 'approved' : 'draft'}">${sup.compliant ? '✓ Compliant ≥5%' : '⚠ Below 5% Target'}</span></div>
    </div>
    ${me.role === 'BCBA' ? `
      <div class="stat-card warn">
        <div class="stat-label">Pending Dual-Signs</div>
        <div class="stat" style="color:var(--warn)">${d.pendingSign}</div>
        <div class="stat-sub">RBT notes awaiting BCBA signature</div>
      </div>
    ` : ''}
  </div>

  <div class="card">
    <div class="flex-between">
      <h3>📅 Today's Clinical Schedule</h3>
      <span class="badge p">${d.appts.length} Appointments</span>
    </div>
    ${d.appts.length ? `
      <table>
        <thead>
          <tr>
            <th>Time Window</th>
            <th>Client Name</th>
            <th>Modality & Setting</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${d.appts.map((a) => `
            <tr>
              <td><span style="font-family:'JetBrains Mono',monospace;font-weight:600">${fmtT(a.start).slice(-7)} – ${a.end.slice(11)}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="user-avatar" style="width:28px;height:28px;font-size:0.75rem;background:#6366f1">${getInitials(a.client)}</div>
                  <b>${esc(a.client)}</b>
                </div>
              </td>
              <td>
                <span class="badge ${a.role === 'BCBA' ? 'sen' : 'tan'}">${esc(a.role)} (CPT ${a.role === 'BCBA' ? '97155' : '97153'})</span>
                <span class="badge">${esc(a.setting)}</span>
              </td>
              <td>
                <button class="${a.session ? 'sec' : 'ok'}" onclick="act.start(${a.id})">
                  ${a.session ? (a.session.end ? 'Review Session 📋' : 'Resume Cockpit ⚡') : 'Launch Cockpit 🚀'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:var(--slate-500);text-align:center;padding:24px">No appointments scheduled for today.</p>'}
  </div>

  ${d.auths && d.auths.length ? `
    <div class="card" style="border-left:4px solid var(--warn)">
      <div class="flex-between">
        <h3>⚠️ Insurance Authorization Burn-Down Alerts</h3>
        <span class="tag draft">≥80% Units Exhausted</span>
      </div>
      <p style="font-size:0.85rem;color:var(--slate-500);margin:0 0 14px">These authorizations are nearing expiration. Initiate re-authorization packets to prevent treatment interruption.</p>
      ${d.auths.map((a) => {
        const pct = Math.round((a.used / a.authorized) * 100);
        return `
          <div style="background:var(--slate-50);padding:12px 16px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:10px">
            <div class="flex-between">
              <div><b>${esc(a.client)}</b> <span class="badge p">CPT ${esc(a.code)}</span></div>
              <div><b>${a.used}</b> / ${a.authorized} units (${pct}%)</div>
            </div>
            <div class="bar" style="margin-top:8px"><div style="width:${pct}%;background:${pct >= 90 ? 'var(--bad)' : 'var(--warn)'}"></div></div>
          </div>
        `;
      }).join('')}
    </div>
  ` : ''}`;
}

async function clientsView() {
  const cs = await api('GET', '/api/clients');
  if (me.role === 'PARENT' && cs.length) return clientView(cs[0].id);

  const filtered = cs.filter(c => {
    if (!clientSearchQuery) return true;
    const q = clientSearchQuery.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.diagnosis || '').toLowerCase().includes(q);
  });

  return `
  <div class="page-header">
    <div>
      <h1>Children & Client 360 Records</h1>
      <p class="page-sub">Consolidated Behavioral Health Records · Skill Acquisition & ABC Portals</p>
    </div>
    ${me.role === 'BCBA' ? `
      <div>
        <button class="ok" onclick="document.getElementById('intake_card').style.display='block'">+ Intake New Client</button>
      </div>
    ` : ''}
  </div>

  ${me.role === 'BCBA' ? `
    <div class="card" id="intake_card" style="display:none;animation:slideDown 0.2s ease">
      <div class="flex-between">
        <h3>Intake New Client Profile</h3>
        <button class="sec" style="padding:4px 10px" onclick="document.getElementById('intake_card').style.display='none'">✕ Close</button>
      </div>
      <div class="row">
        <div><label>Child Full Name</label><input id="nn" placeholder="e.g. Maya Lin"></div>
        <div><label>Date of Birth</label><input id="nd" type="date"></div>
        <div><label>Clinical Diagnosis</label><input id="ng" value="Autism Spectrum Disorder"></div>
      </div>
      <div class="row">
        <div><label>Guardian / Parent</label><input id="nguard" placeholder="e.g. Rachel Lin"></div>
        <div><label>Primary Communication Mode</label><input id="ncomm" placeholder="e.g. Vocal, PECS Phase III, AAC"></div>
      </div>
      <button class="ok" onclick="act.addClient()">Create Unified Client Profile</button>
    </div>
  ` : ''}

  <div class="card">
    <div class="flex-between" style="margin-bottom:12px">
      <h3>Active Caseload (${filtered.length} Children)</h3>
      <div style="max-width:280px;width:100%">
        <input style="margin:0" placeholder="🔍 Search by name or diagnosis..." value="${esc(clientSearchQuery)}" oninput="clientSearchQuery=this.value;render()">
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Client Name</th>
          <th>Diagnosis</th>
          <th>Communication Modality</th>
          <th>Setting / School</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((c) => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:12px">
                <div class="user-avatar" style="width:34px;height:34px;background:var(--primary);font-size:0.85rem">${getInitials(c.name)}</div>
                <div>
                  <div style="font-weight:700;color:var(--slate-900)">${esc(c.name)}</div>
                  <div style="font-size:0.75rem;color:var(--slate-500)">DOB: ${esc(c.dob || 'On file')}</div>
                </div>
              </div>
            </td>
            <td><span class="badge p">${esc(c.diagnosis || 'ASD')}</span></td>
            <td><span class="badge esc">${esc(c.communication || 'Vocal')}</span></td>
            <td>${esc(c.school || 'Home / Clinic')}</td>
            <td>
              <button class="sec" onclick="go('client',${c.id})">Open 360 Cockpit 👧</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}

let tab = 'overview';
let showCrisis = false;

function chart(series, baseline, target) {
  if (!series || !series.length) return '<div style="padding:14px;background:var(--slate-50);border-radius:8px;text-align:center;color:var(--slate-400);font-size:0.85rem">No session trials collected for this target yet.</div>';
  const w = 340, h = 120, n = series.length;
  const x = (i) => n === 1 ? w / 2 : 16 + (i * (w - 32)) / (n - 1);
  const y = (p) => h - 16 - (Math.min(100, Math.max(0, p)) / 100) * (h - 32);
  const pts = series.map((s, i) => `${x(i)},${y(s.pct)}`).join(' ');
  const firstPt = `${x(0)},${h - 16}`;
  const lastPt = `${x(n - 1)},${h - 16}`;
  const areaPoly = `${firstPt} ${pts} ${lastPt}`;
  
  return `
  <div style="position:relative;margin:8px 0">
    <svg viewBox="0 0 ${w} ${h}" width="100%" style="background:#fafafa;border-radius:var(--radius-md);border:1px solid var(--slate-200);overflow:hidden">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      <!-- Baseline line -->
      <line x1="0" x2="${w}" y1="${y(baseline)}" y2="${y(baseline)}" stroke="#94a3b8" stroke-dasharray="3"/>
      <!-- Target mastery line -->
      <line x1="0" x2="${w}" y1="${y(target)}" y2="${y(target)}" stroke="#059669" stroke-dasharray="3"/>
      <!-- Gradient area under curve -->
      <polygon points="${areaPoly}" fill="url(#chartGrad)"/>
      <!-- Polyline -->
      <polyline fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/>
      <!-- Data circles -->
      ${series.map((s, i) => `
        <circle cx="${x(i)}" cy="${y(s.pct)}" r="4" fill="#ffffff" stroke="#4f46e5" stroke-width="2.5">
          <title>Session ${s.session}: ${s.pct}% independent</title>
        </circle>
      `).join('')}
    </svg>
    <div class="flex-between" style="font-size:0.75rem;color:var(--slate-500);margin-top:4px">
      <span>Baseline: <b>${baseline}%</b></span>
      <span style="color:var(--ok);font-weight:700">Mastery Target: <b>${target}%</b></span>
    </div>
  </div>`;
}

const ANTS = ['Transition from preferred activity', 'Removal of preferred item', 'Difficult academic task', 'Denied access', 'Peer proximity / space', 'Loud sensory environment', 'Unstructured free time'];
const BEHAVIORS = ['Screaming', 'Aggression', 'Elopement', 'Task refusal', 'Crying', 'Property destruction', 'Self-injurious behavior'];

async function clientView(id) {
  const data = await api('GET', '/api/clients/' + id);
  const { client: c, goals, plans, stories, auths, assigned, abcLogs = [], abcSummary = { functions: {}, total: 0 }, supervisionLogs = [] } = data;
  const B = me.role === 'BCBA', P = me.role === 'PARENT';
  const tabs = P ? [['goals', '🎯 Skill Goals'], ['stories', '📖 Social Stories']] : [
    ['overview', '🌟 360 Cockpit'],
    ['skills', '🎯 Skills & DTT'],
    ['behavior_abc', '📊 Behavior & ABC'],
    ['plans', '📋 Behavior Plans (BIP)'],
    ['stories', '📖 Social Stories'],
    ['profile', '👤 Clinical Vitals'],
    ['services', '💳 Authorizations']
  ];
  if (P && !['goals', 'stories'].includes(tab)) tab = 'goals';
  if (!P && !tabs.map(t=>t[0]).includes(tab)) tab = 'overview';

  // Pinned Clinical Vitals Banner
  const vitalsBanner = `
  <div class="vitals-banner">
    <div class="vitals-header">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="user-avatar" style="width:42px;height:42px;font-size:1rem;background:linear-gradient(135deg,#4f46e5 0%,#06b6d4 100%)">${getInitials(c.name)}</div>
        <div>
          <h2 style="margin:0;font-size:1.45rem;color:var(--slate-900)">${esc(c.name)}</h2>
          <div style="font-size:0.8rem;color:var(--slate-500)">
            <span class="badge p">${esc(c.diagnosis || 'Autism Spectrum Disorder')}</span>
            ${c.dob ? `<span class="badge">DOB: ${esc(c.dob)}</span>` : ''}
            ${c.school ? `<span class="badge">${esc(c.school)}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${B ? `<button class="sec" style="padding:8px 14px;font-size:0.85rem" onclick="act.openReauthReportModal(${c.id})">📄 6-Month Re-Auth Report</button>` : ''}
        ${auths.length ? auths.map(a => `<span class="badge ${a.used/a.authorized >= 0.8 ? 'att' : 'tan'}">CPT ${esc(a.code)}: ${a.authorized - a.used} units left</span>`).join(' ') : ''}
        <button class="bad" style="padding:8px 14px;font-size:0.85rem" onclick="act.toggleCrisis()">
          🚨 ${showCrisis ? 'Hide Crisis Protocol' : 'Emergency / Crisis Plan'}
        </button>
      </div>
    </div>
    
    <div class="vitals-grid">
      <div class="vital-item">
        <div class="vital-label">🗣️ Communication Mode</div>
        <b>${esc(c.communication || 'Verbal (full sentences)')}</b>
      </div>
      <div class="vital-item">
        <div class="vital-label">🎧 Sensory Profile</div>
        <b>${esc(c.sensory || 'Sensory sensitive (avoids loud sirens)')}</b>
      </div>
      <div class="vital-item">
        <div class="vital-label">⚡ Known Antecedent Triggers</div>
        <b>${esc(c.triggers || 'Difficult task transitions, peer proximity')}</b>
      </div>
      <div class="vital-item">
        <div class="vital-label">🎁 Reinforcer Hierarchy</div>
        <b>${esc(c.reinforcers || 'LEGO, bubbles, sensory swing')}</b>
      </div>
    </div>

    ${showCrisis ? `
    <div class="crisis-box">
      <div class="flex-between">
        <h4 style="margin:0;color:#991b1b">⚠️ Immediate De-Escalation & Safety Crisis Protocol</h4>
        <button class="bad" style="padding:2px 8px;font-size:0.75rem" onclick="act.toggleCrisis()">✕ Close</button>
      </div>
      <div style="white-space:pre-wrap;margin-top:8px;font-size:0.92rem;line-height:1.5">${esc(c.crisis_plan || '1. Offer quiet sensory space.\n2. Use calm, low-tone language.\n3. Do not block items or use physical restraint.\n4. Provide replacement communication card.')}</div>
      <div style="margin-top:10px;font-size:0.82rem;font-weight:600">Emergency Contact: ${esc(c.emergency || 'Guardian')}</div>
    </div>` : ''}
  </div>`;

  let body = '';

  // Tab: Overview
  if (tab === 'overview') {
    body = `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:20px">
      <!-- Column 1: Skills & Targets -->
      <div>
        <div class="card">
          <div class="flex-between">
            <h3>🎯 Active Skill Acquisition Targets</h3>
            <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.setTab('skills')">View All Targets →</button>
          </div>
          ${goals.slice(0, 3).map(g => `
            <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--slate-100)">
              <div class="flex-between">
                <b>${esc(g.title)}</b>
                <span class="tag ${g.status === 'mastered' ? 'approved' : g.trend === 'Improving' ? 'approved' : 'draft'}">${esc(g.status === 'mastered' ? 'Mastered' : g.trend)}</span>
              </div>
              <div style="font-size:0.85rem;color:var(--slate-500);margin:2px 0 6px">
                Baseline: <b>${g.baseline}%</b> · Current: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b> · Mastery: <b>${g.target}%</b>
              </div>
              ${g.mastery_met && g.status !== 'mastered' ? `
                <div class="mastery-banner">
                  <span>${esc(g.recommendation)}</span>
                  ${B ? `<button class="ok" style="font-size:0.75rem;padding:3px 8px" onclick="act.setGoalStatus(${g.id}, 'mastered')">✓ Advance Target</button>` : ''}
                </div>
              ` : g.stalled ? `
                <div class="stalled-banner">${esc(g.recommendation)}</div>
              ` : ''}
              ${chart(g.series, g.baseline, g.target)}
            </div>
          `).join('') || '<p style="color:var(--slate-400)">No skill targets active yet.</p>'}
        </div>

        <div class="card">
          <div class="flex-between">
            <h3>📋 Behavior Intervention Plan (BIP)</h3>
            <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.setTab('plans')">Manage BIP →</button>
          </div>
          ${plans.length ? `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <b>Target: ${esc(plans[0].behavior)}</b>
              <span class="tag ${plans[0].status}">${plans[0].status}</span>
            </div>
            <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:10px 14px;border-radius:var(--radius-md);margin-bottom:10px">
              <div style="font-size:0.75rem;font-weight:700;color:var(--ok);text-transform:uppercase">Functional Replacement Behavior (FCT):</div>
              <b style="color:#064e3b">${esc(plans[0].data.replacement)}</b>
            </div>
            <div style="font-size:0.85rem;color:var(--slate-600)">
              <b>Proactive Prevention:</b> ${esc(plans[0].data.prevention.slice(0, 3).join(', '))}
            </div>
          ` : '<p style="color:var(--slate-400)">No active behavior intervention plan drafted yet.</p>'}
        </div>
      </div>

      <!-- Column 2: ABC Function & Caregiver -->
      <div>
        <div class="card">
          <div class="flex-between">
            <h3>📊 ABC Behavior Reduction Center</h3>
            <button class="ok" style="font-size:0.85rem;padding:6px 12px" onclick="act.openAbcModal(${c.id})">⚡ Log ABC Incident</button>
          </div>
          <p style="font-size:0.85rem;color:var(--slate-500);margin:0 0 12px">Total of <b>${abcSummary.total || 0}</b> incidents recorded across the 4 functional classifications:</p>
          <div class="abc-grid">
            <div class="abc-metric Escape">
              <div class="abc-num">${abcSummary.functions.Escape || 0}</div>
              <small>Escape</small>
            </div>
            <div class="abc-metric Attention">
              <div class="abc-num">${abcSummary.functions.Attention || 0}</div>
              <small>Attention</small>
            </div>
            <div class="abc-metric Tangible">
              <div class="abc-num">${abcSummary.functions.Tangible || 0}</div>
              <small>Tangible</small>
            </div>
            <div class="abc-metric Sensory">
              <div class="abc-num">${abcSummary.functions.Sensory || 0}</div>
              <small>Sensory</small>
            </div>
          </div>

          <h4 style="margin:16px 0 8px">Recent Behavioral Incidents</h4>
          ${abcLogs.slice(0, 3).map(a => `
            <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-md);margin-bottom:8px;border:1px solid var(--slate-200);font-size:0.85rem">
              <div class="flex-between">
                <b>${esc(a.behavior)}</b>
                <span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : 'esc'}">${esc(a.perceived_function || 'Escape')}</span>
              </div>
              <div style="color:var(--slate-500);font-size:0.8rem;margin-top:2px">
                Antecedent: ${esc(a.antecedent)} · Consequence: ${esc(a.consequence)}
              </div>
            </div>
          `).join('') || '<p style="color:var(--slate-400)">Zero maladaptive behavior episodes logged.</p>'}
        </div>

        <div class="card">
          <div class="flex-between">
            <h3>📖 Social Stories & Visual Tools</h3>
            <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.setTab('stories')">Stories →</button>
          </div>
          ${stories.slice(0, 2).map(s => `
            <div style="padding:10px;border-radius:var(--radius-md);background:var(--slate-50);border:1px solid var(--slate-200);margin-bottom:8px">
              <div class="flex-between">
                <b>${esc(s.content.title)}</b>
                <span class="tag ${s.status}">${s.status}</span>
              </div>
              ${s.status === 'shared' ? `<div style="font-size:0.75rem;color:var(--primary);margin-top:4px">✓ Published to Family Portal</div>` : ''}
            </div>
          `).join('') || '<p style="color:var(--slate-400)">No social stories created yet.</p>'}
        </div>
      </div>
    </div>`;
  }

  // Tab: Skills & Targets
  else if (tab === 'skills') {
    body = `
    <div class="card">
      <div class="flex-between">
        <div>
          <h3>Skill Targets & Discrete Trial Training (DTT)</h3>
          <p style="font-size:0.85rem;color:var(--slate-500);margin:0">Track longitudinal percentage of independent vs prompted trials.</p>
        </div>
        ${B ? `<button class="ok" onclick="document.getElementById('add_goal_card').style.display='block'">+ Add Skill Target</button>` : ''}
      </div>

      ${B ? `
        <div class="card" id="add_goal_card" style="display:none;background:var(--slate-50);margin-top:16px;border:1px dashed var(--slate-300)">
          <div class="flex-between">
            <h4>Add New Skill Acquisition Target</h4>
            <button class="sec" style="padding:2px 8px;font-size:0.75rem" onclick="document.getElementById('add_goal_card').style.display='none'">✕</button>
          </div>
          <div class="row">
            <div><label>Target Operational Title</label><input id="gt" placeholder="e.g. 2-Step Motor Imitation"></div>
            <div><label>Baseline % Independent</label><input id="gb" type="number" value="20"></div>
            <div><label>Mastery Criterion %</label><input id="gg" type="number" value="80"></div>
          </div>
          <button class="ok" onclick="act.addGoal(${c.id})">Save Target</button>
        </div>
      ` : ''}

      <div style="margin-top:16px">
        ${goals.map((g) => {
          const lastSession = g.series && g.series.length ? g.series[g.series.length - 1] : null;
          return `
          <div style="background:var(--surface);padding:16px;border-radius:var(--radius-lg);border:1px solid var(--slate-200);margin-bottom:16px">
            <div class="flex-between">
              <div>
                <h4 style="margin:0;font-size:1.1rem;display:inline-block">${esc(g.title)}</h4>
                <span class="tag ${g.status === 'mastered' ? 'approved' : g.trend === 'Improving' ? 'approved' : 'draft'}" style="margin-left:8px">${esc(g.status === 'mastered' ? 'Mastered' : g.trend)}</span>
              </div>
              ${B && g.status !== 'mastered' && g.mastery_met ? `<button class="ok" style="font-size:0.8rem;padding:4px 10px" onclick="act.setGoalStatus(${g.id}, 'mastered')">🎯 Mark Mastered</button>` : ''}
            </div>
            <div style="font-size:0.85rem;color:var(--slate-600);margin:4px 0 8px">
              Baseline: <b>${g.baseline}%</b> · Current Average: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b> · Mastery Target: <b>${g.target}%</b>
            </div>
            ${g.mastery_met && g.status !== 'mastered' ? `
              <div class="mastery-banner">
                <span><b>Clinical Intelligence:</b> ${esc(g.recommendation)}</span>
                ${B ? `<button class="ok" style="font-size:0.75rem;padding:3px 8px" onclick="act.setGoalStatus(${g.id}, 'mastered')">Advance Target</button>` : ''}
              </div>
            ` : g.stalled ? `
              <div class="stalled-banner"><b>Clinical Alert:</b> ${esc(g.recommendation)}</div>
            ` : ''}
            ${chart(g.series, g.baseline, g.target)}
            ${lastSession && lastSession.prompts ? `
              <div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--slate-200);font-size:0.8rem;color:var(--slate-600);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-weight:700">Prompt Hierarchy Fading (Latest Session):</span>
                ${Object.entries(lastSession.prompts).map(([code, cnt]) => cnt > 0 ? `<span class="badge ${code==='I'?'tan':'p'}">${code} (${LV[code]?.label || code}): <b>${cnt}</b></span>` : '').join('')}
              </div>
            ` : ''}
          </div>`;
        }).join('') || '<p style="color:var(--slate-400)">No skill targets defined yet.</p>'}
      </div>
    </div>`;
  }

  // Tab: Behavior & ABC Logs
  else if (tab === 'behavior_abc') {
    body = `
    <div class="card">
      <div class="flex-between">
        <div>
          <h3>Antecedent-Behavior-Consequence (ABC) Data Center</h3>
          <p style="font-size:0.85rem;color:var(--slate-500);margin:0">Analyze environmental triggers and functional maintaining variables.</p>
        </div>
        <button class="ok" onclick="act.openAbcModal(${c.id})">⚡ Log ABC Incident</button>
      </div>

      <div class="abc-grid" style="margin-top:16px">
        <div class="abc-metric Escape">
          <div class="abc-num">${abcSummary.functions.Escape || 0}</div>
          <small>Escape / Avoidance</small>
        </div>
        <div class="abc-metric Attention">
          <div class="abc-num">${abcSummary.functions.Attention || 0}</div>
          <small>Attention Seeking</small>
        </div>
        <div class="abc-metric Tangible">
          <div class="abc-num">${abcSummary.functions.Tangible || 0}</div>
          <small>Access to Tangible</small>
        </div>
        <div class="abc-metric Sensory">
          <div class="abc-num">${abcSummary.functions.Sensory || 0}</div>
          <small>Automatic / Sensory</small>
        </div>
      </div>

      <!-- Temporal Scatterplot & Setting Event Heatmap (CentralReach Improvement) -->
      <div style="margin-top:20px;background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--radius-lg);padding:16px">
        <div class="flex-between">
          <div>
            <h4 style="margin:0;font-size:1rem;color:var(--slate-900)">🕒 Temporal Behavior Scatterplot & Hourly Setting Event Heatmap</h4>
            <p style="font-size:0.8rem;color:var(--slate-500);margin:2px 0 0">Distribution of incidents across clinic operational hours (8:00 AM – 5:00 PM) for Functional Behavior Assessments.</p>
          </div>
          <span class="badge p">FBA Scatterplot Analysis</span>
        </div>

        ${abcSummary.scatterplot && abcSummary.scatterplot.peakWindow ? `
          <div class="stalled-banner" style="margin-top:12px;background:#fef2f2;border-color:#fecaca;color:#991b1b">
            ⚡ <b>Peak Behavioral Disruption Window:</b> <b>${esc(abcSummary.scatterplot.peakWindow.label)}</b> (${abcSummary.scatterplot.peakWindow.count} incident${abcSummary.scatterplot.peakWindow.count === 1 ? '' : 's'}). Primary Trigger: <b>${esc(abcSummary.scatterplot.peakWindow.primaryAntecedent)}</b>. Recommend antecedent visual schedules & high-density reinforcement prior to this transition window.
          </div>
        ` : ''}

        <div class="heatmap-track" style="margin-top:14px">
          ${(abcSummary.scatterplot ? abcSummary.scatterplot.hourly : []).map(h => {
            const count = h.count;
            const bgClass = count >= 4 ? 'heat-4' : count >= 2 ? 'heat-2' : count === 1 ? 'heat-1' : 'heat-0';
            const topAnt = Object.entries(h.antecedents).sort((a,b) => b[1] - a[1])[0];
            return `
              <div class="heat-slot ${bgClass}" title="${h.label}: ${count} incident(s)${topAnt ? ` (Primary: ${topAnt[0]})` : ''}">
                <div class="heat-label">${h.label.replace(':00 ', ' ')}</div>
                <div class="heat-count">${count}</div>
                <div class="heat-sub">${count === 1 ? 'event' : 'events'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <h4 style="margin-top:24px">Incident History (${abcLogs.length} total events)</h4>
      ${abcLogs.length ? `
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Maladaptive Behavior</th>
              <th>Antecedent Event</th>
              <th>Consequence / Intervention</th>
              <th>Function</th>
              <th>Clinical Field Notes</th>
            </tr>
          </thead>
          <tbody>
            ${abcLogs.map(a => `
              <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;font-size:0.85rem">${fmtT(a.ts)}</span></td>
                <td><b style="color:var(--bad)">${esc(a.behavior)}</b></td>
                <td>${esc(a.antecedent)}</td>
                <td>${esc(a.consequence)}</td>
                <td><span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : 'esc'}">${esc(a.perceived_function || 'Escape')}</span></td>
                <td style="font-size:0.85rem;color:var(--slate-600)">${esc(a.notes || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:var(--slate-400);text-align:center;padding:20px">Zero ABC incidents logged.</p>'}
    </div>`;
  }

  // Tab: Behavior Plans (BIP)
  else if (tab === 'plans') {
    body = `
    ${B ? `
      <div class="card" style="background:var(--slate-50);border:1px solid var(--slate-300)">
        <h3>🤖 AI Behavior Intervention Plan Builder (Draft)</h3>
        <p style="font-size:0.85rem;color:var(--slate-500);margin:0 0 12px">Synthesize evidence-based antecedent prevention, FCT replacements, and consequence protocols.</p>
        <div class="row">
          <div>
            <label>Target Maladaptive Behavior</label>
            <select id="pb">${BEHAVIORS.map((x) => `<option>${x}</option>`).join('')}</select>
          </div>
        </div>
        <label>Possible Environmental Antecedents</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:8px 0 16px">
          ${ANTS.map((a) => `
            <label style="display:flex;align-items:center;gap:8px;background:#fff;padding:8px 12px;border-radius:6px;border:1px solid var(--slate-200);cursor:pointer;font-weight:500;text-transform:none">
              <input type="checkbox" class="pa" value="${a}" style="width:auto;margin:0"> ${a}
            </label>
          `).join('')}
        </div>
        <button class="ok" onclick="act.genPlan(${c.id})">Generate Draft BIP with Clinical Engine</button>
      </div>
    ` : ''}
    ${plans.map((p) => planCard(p, B)).join('') || '<div class="card">No behavior plans formulated yet.</div>'}`;
  }

  // Tab: Social Stories
  else if (tab === 'stories') {
    body = `
    ${B ? `
      <div class="card" style="background:var(--slate-50);border:1px solid var(--slate-300)">
        <h3>🤖 Visual Social Story Generator</h3>
        <p style="font-size:0.85rem;color:var(--slate-500);margin:0 0 12px">Generates Gray's Social Story structure (Descriptive, Perspective, Directive sentences).</p>
        <div class="row">
          <div><label>Activity / Situation</label><input id="ss" placeholder="e.g. Turn taking during circle time"></div>
          <div><label>Emotional Challenge</label><input id="sc" placeholder="e.g. Frustrated when waiting for turn"></div>
        </div>
        <div class="row">
          <div><label>Coping Goal</label><input id="sg" placeholder="e.g. Ask for visual wait card calmly"></div>
          <div><label>Child Special Interest</label><input id="si" placeholder="e.g. LEGO bricks, Trains"></div>
          <div><label>Visual Style</label><select id="sv"><option>Cartoon</option><option>Photos</option><option>Simple icons</option></select></div>
        </div>
        <button class="ok" onclick="act.genStory(${c.id})">Generate Draft Social Story</button>
      </div>
    ` : ''}
    ${stories.map((s) => storyCard(s, B)).join('') || '<div class="card">No social stories drafted yet.</div>'}`;
  }

  // Tab: Profile & Vitals
  else if (tab === 'profile') {
    const f = [
      ['name', 'Full Name'], ['dob', 'Date of Birth'], ['diagnosis', 'Diagnosis'],
      ['guardian', 'Parent / Primary Guardian'], ['school', 'Educational Setting / School'],
      ['emergency', 'Emergency Contact & Phone'], ['insurance', 'Payer & Authorization #'],
      ['communication', 'Primary Communication Modality (Vocal, AAC, PECS, Sign)'],
      ['reinforcers', 'Reinforcer Hierarchy (Preferred Items & Activities)'],
      ['sensory', 'Sensory Profile (Seeking vs Avoiding Triggers)'],
      ['triggers', 'Known Setting Events & Environmental Triggers'],
      ['crisis_plan', 'Emergency De-Escalation & Safety Crisis Protocol']
    ];
    body = `
    <div class="card">
      <div class="flex-between">
        <h3>Client Clinical Profile & Vitals</h3>
        ${B ? '<span class="badge ok">BCBA Edit Privileges</span>' : '<span class="badge">Read Only</span>'}
      </div>
      <div class="row">
        ${f.map(([k, l]) => `
          <div>
            <label>${l}</label>
            ${k === 'crisis_plan' 
              ? `<textarea id="f_${k}" rows="4" ${B ? '' : 'disabled'}>${esc(c[k])}</textarea>` 
              : `<input id="f_${k}" value="${esc(c[k])}" ${B ? '' : 'disabled'}>`}
          </div>
        `).join('')}
      </div>
      ${B ? `<button class="ok" onclick="act.saveClient(${c.id})">💾 Save Clinical Vitals</button>` : ''}
    </div>
    ${assigned.length ? `
      <div class="card">
        <h4>Assigned Clinical Team Members:</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${assigned.map((a) => `<span class="badge p">👨‍⚕️ ${esc(a.name)}</span>`).join('')}
        </div>
      </div>
    ` : ''}`;
  }

  // Tab: Authorizations & Services
  else if (tab === 'services') {
    body = `
    <div class="card">
      <div class="flex-between">
        <h3>Active CPT Insurance Authorizations</h3>
        ${B ? '<button class="ok" onclick="document.getElementById(\'add_auth_box\').style.display=\'block\'">+ Add Authorization</button>' : ''}
      </div>
      
      ${B ? `
        <div id="add_auth_box" style="display:none;background:var(--slate-50);padding:14px;border-radius:var(--radius-md);margin:14px 0;border:1px dashed var(--slate-300)">
          <div class="row">
            <div>
              <label>CPT Billing Code</label>
              <select id="ac">
                <option value="97153">97153 (Direct 1:1 Adaptive Behavior Treatment - RBT)</option>
                <option value="97155">97155 (Protocol Modification & Supervision - BCBA)</option>
                <option value="97156">97156 (Family Adaptive Behavior Guidance - BCBA)</option>
              </select>
            </div>
            <div>
              <label>Authorized 15-Minute Units</label>
              <input id="au" type="number" value="480">
            </div>
          </div>
          <button class="ok" onclick="act.addAuth(${c.id})">Save Authorization</button>
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th>CPT Code</th>
            <th>Clinical Service Description</th>
            <th>Authorized Units</th>
            <th>Used Units</th>
            <th>Remaining Units</th>
            <th>Burn-Down Status</th>
          </tr>
        </thead>
        <tbody>
          ${auths.map((a) => {
            const rem = a.authorized - a.used;
            const near = a.used / a.authorized >= 0.8;
            return `
              <tr>
                <td><b>${esc(a.code)}</b></td>
                <td>${a.code === '97153' ? 'Direct 1:1 Adaptive Behavior Treatment (RBT)' : a.code === '97155' ? 'Protocol Modification & Supervision (BCBA)' : 'Family Guidance (BCBA)'}</td>
                <td>${a.authorized}</td>
                <td>${a.used}</td>
                <td><b>${rem}</b></td>
                <td><span class="tag ${near ? 'draft' : 'approved'}">${near ? 'Near Limit (≥80%)' : 'Active'}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>BACB Supervision History for ${esc(c.name)}</h3>
      ${supervisionLogs.length ? `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Supervising BCBA</th>
              <th>Supervised RBT</th>
              <th>Duration</th>
              <th>Supervision Type</th>
              <th>Feedback & Notes</th>
            </tr>
          </thead>
          <tbody>
            ${supervisionLogs.map(s => `
              <tr>
                <td><span style="font-family:'JetBrains Mono',monospace">${fmtT(s.ts)}</span></td>
                <td><b>${esc(s.bcba)}</b></td>
                <td>${esc(s.rbt)}</td>
                <td><b>${s.minutes} mins</b></td>
                <td><span class="badge p">${esc(s.type)}</span></td>
                <td style="font-size:0.85rem">${esc(s.notes || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:var(--slate-400)">No direct supervision logs recorded for this client.</p>'}
    </div>`;
  }

  return `
  ${vitalsBanner}
  <div class="tabs">
    ${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" onclick="act.setTab('${k}')">${l}</button>`).join('')}
  </div>
  ${body}`;
}

function planCard(p, B) {
  const d = p.data;
  const list = (a) => `<ul style="margin:6px 0;padding-left:20px">${a.map((x) => `<li style="margin-bottom:4px">${esc(x)}</li>`).join('')}</ul>`;
  return `
  <div class="card" style="border-left:4px solid var(--primary)">
    <div class="flex-between">
      <h3 style="margin:0">Behavior Intervention Plan: ${esc(p.behavior)}</h3>
      <span class="tag ${p.status}">${p.status}${p.approved_by ? ' by ' + esc(p.approved_by) : ''}</span>
    </div>
    
    <div style="margin-top:14px">
      <div style="font-size:0.8rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">Operational Definition:</div>
      <p style="margin:4px 0 12px;font-style:italic;color:var(--slate-700)">${esc(d.definition)}</p>

      <div style="font-size:0.8rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">Functional Replacement Behavior (FCT):</div>
      <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:10px 14px;border-radius:var(--radius-md);margin:6px 0 14px">
        <b style="color:#064e3b">${esc(d.replacement)}</b>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <b>Antecedents & Triggers:</b>
          ${list(d.antecedents)}
          <b>Proactive Prevention:</b>
          ${list(d.prevention)}
        </div>
        <div>
          <b>Reinforcement Schedule:</b>
          ${list(d.reinforcement)}
          <b>Staff Reactive Protocol:</b>
          ${list(d.staff)}
        </div>
      </div>
    </div>

    ${B ? `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--slate-100);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${p.status === 'draft' ? `<button class="ok" onclick="act.approvePlan(${p.id})">✓ BCBA Approve & Activate Plan</button>` : ''}
        <details style="flex:1;min-width:200px">
          <summary style="cursor:pointer;color:var(--primary);font-weight:600;font-size:0.88rem">Edit Plan Specifications</summary>
          <div style="margin-top:10px">
            <label>Operational Definition</label><textarea id="pd${p.id}">${esc(d.definition)}</textarea>
            <label>Replacement Behavior</label><input id="pr${p.id}" value="${esc(d.replacement)}">
            <label>Prevention Protocols (one per line)</label><textarea id="pp${p.id}" rows="3">${esc(d.prevention.join('\n'))}</textarea>
            <label>Staff Responses (one per line)</label><textarea id="ps${p.id}" rows="3">${esc(d.staff.join('\n'))}</textarea>
            <button class="sec" onclick="act.savePlan(${p.id})">Save Edits (Resets to Draft)</button>
          </div>
        </details>
      </div>
    ` : ''}
  </div>`;
}

function storyCard(s, B) {
  const c = s.content;
  return `
  <div class="card">
    <div class="flex-between">
      <h3 style="margin:0">${esc(c.title)}</h3>
      <span class="tag ${s.status}">${s.status}</span>
    </div>
    <div style="margin:16px 0">
      ${c.sentences.map((x) => `
        <div class="sentence">
          <span class="ic">${x.icon}</span>
          <span style="font-size:0.95rem;color:var(--slate-800)">${esc(x.text)}</span>
        </div>
      `).join('')}
    </div>
    ${B ? `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--slate-100)">
        ${s.status === 'draft' ? `<button class="ok" onclick="act.approveStory(${s.id})">✓ BCBA Approve Story</button>` : ''}
        ${s.status !== 'draft' ? `<button onclick="act.shareStory(${s.id})">${s.status === 'shared' ? '🔗 View Parent Link' : '📤 Share with Family'}</button>` : ''}
        <details style="flex:1">
          <summary style="cursor:pointer;color:var(--primary);font-weight:600;font-size:0.88rem">Edit Story Sentences</summary>
          <div style="margin-top:8px">
            <textarea id="st${s.id}" rows="5">${esc(c.sentences.map((x) => x.text).join('\n'))}</textarea>
            <button class="sec" onclick="act.saveStory(${s.id})">Save Changes (Resets to Draft)</button>
          </div>
        </details>
      </div>
    ` : ''}
  </div>`;
}

async function scheduleView() {
  const a = await api('GET', '/api/schedule');
  let form = '';
  if (me.role === 'BCBA') {
    const [cs, st] = await Promise.all([api('GET', '/api/clients'), api('GET', '/api/staff')]);
    form = `
    <div class="card" style="background:var(--slate-50);border:1px solid var(--slate-300)">
      <h3>Schedule Clinical Session</h3>
      <div class="row">
        <div><label>Client</label><select id="ac">${cs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>Clinician</label><select id="as">${st.map((s) => `<option value="${s.id}">${esc(s.name)} (${s.role})</option>`).join('')}</select></div>
        <div><label>Start Window</label><input id="astart" type="datetime-local"></div>
        <div><label>End Window</label><input id="aend" type="datetime-local"></div>
        <div><label>Treatment Setting</label><select id="aset"><option>Home</option><option>School</option><option>Clinic</option></select></div>
      </div>
      <button class="ok" onclick="act.addAppt()">Schedule Session</button>
    </div>`;
  }
  const days = {};
  a.forEach((x) => { (days[x.start.slice(0, 10)] ||= []).push(x); });
  
  return `
  <div class="page-header">
    <div>
      <h1>Clinical Appointments & Sessions</h1>
      <p class="page-sub">Electronic Visit Verification & Session Dispatch</p>
    </div>
  </div>
  ${form}
  ${Object.entries(days).map(([d, xs]) => `
    <div class="card">
      <h3>📅 ${new Date(d + 'T00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Client</th>
            <th>Therapist</th>
            <th>Modality & Setting</th>
            <th>Status / Action</th>
          </tr>
        </thead>
        <tbody>
          ${xs.map((x) => `
            <tr>
              <td><span style="font-family:'JetBrains Mono',monospace;font-weight:600">${x.start.slice(11)} – ${x.end.slice(11)}</span></td>
              <td><b>${esc(x.client)}</b></td>
              <td>${esc(x.staff)}</td>
              <td><span class="badge p">${esc(x.role)}</span> ${esc(x.setting)}</td>
              <td>
                ${x.session && x.session.end ? '<span class="tag approved">Completed</span>' : ''}
                <button class="${x.session ? 'sec' : 'ok'}" onclick="act.start(${x.id})">
                  ${x.session ? (x.session.end ? 'Open Note' : 'Resume Cockpit') : 'Start Session'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('') || '<div class="card">No appointments scheduled.</div>'}`;
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
        unitsEl.textContent = `${curUnits} unit${curUnits === 1 ? '' : 's'} (${curUnits * 15} mins) · CMS 8-Minute Rule`;
      }
    }, 1000);
  }

  const sum = (g) => {
    if (!g.summary || !g.summary.total) return '<div style="color:var(--slate-400);font-size:0.85rem">No trials recorded yet this session.</div>';
    return `
    <div style="margin-top:10px">
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px">
        <span>Independent Mastery: <b>${g.summary.pct.I}%</b></span>
        <span>${g.summary.total} Total Trials Recorded</span>
      </div>
      <div class="bar">
        <div style="width:${g.summary.pct.I}%"></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:0.75rem;color:var(--slate-600);margin-top:6px">
        ${Object.keys(LV).map(k => `<span>${LV[k].code}: <b>${g.summary.counts[k] || 0}</b> (${g.summary.pct[k] || 0}%)</span>`).join(' · ')}
      </div>
    </div>`;
  };

  return `
  <div class="page-header">
    <div>
      <h1>Active Session Cockpit</h1>
      <p class="page-sub">Client: <b>${esc(client.name)}</b> · 1-Tap Trial Recording & In-Session ABC Tracker</p>
    </div>
    <div>
      <button class="sec" onclick="go('client', ${client.id})">👧 Client 360 Record</button>
    </div>
  </div>

  <!-- Real-time Cockpit Monitor -->
  <div class="cockpit-banner">
    <div class="big" id="clock">${ended ? `${s.units} units` : '00:00:00'}</div>
    <div class="units-pill" id="calc_units">${ended ? `${s.units} × 15-min billing units (${s.units * 15} mins)` : '0 units · CMS 8-Minute Rule'}</div>
    <div>
      ${ended 
        ? `<div style="color:var(--ok-light);font-weight:700">✓ Session Concluded · Ready for Clinical Note Review</div>` 
        : `
          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
            <button class="bad" style="padding:12px 24px;font-size:1rem" onclick="act.endSession(${s.id})">⏹ End Clinical Session</button>
            <button class="ok" style="padding:12px 20px;font-size:1rem" onclick="act.openAbcModal(${client.id}, ${s.id})">⚡ Quick ABC Incident Logger</button>
            <button class="btn" style="background:#7c3aed;padding:12px 20px;font-size:1rem" onclick="act.toggleKidMode()">🌟 ${showKidMode ? 'Hide Kid Mode' : 'Open Kid Mode (Token Board)'}</button>
          </div>
        `}
    </div>
  </div>

  <!-- Interactive Kid Mode & Token Board (CentralReach Enhancement) -->
  ${showKidMode ? `
    <div class="token-board">
      <div class="flex-between">
        <div>
          <h3 style="margin:0;color:#6b21a8">🌟 ${esc(client.name)}'s Token Board</h3>
          <div style="font-size:0.85rem;color:#7e22ce;margin-top:2px">Working for: <b>🎁 ${esc(client.reinforcers ? client.reinforcers.split(',')[0].trim() : 'Preferred Activity')}</b></div>
        </div>
        <div>
          <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.resetTokens()">Reset Tokens</button>
        </div>
      </div>
      
      <div class="token-track">
        ${Array.from({ length: targetTokens }).map((_, idx) => `
          <div class="token-slot ${idx < tokenCount ? 'earned' : ''}" onclick="act.toggleToken(${idx})">
            ${idx < tokenCount ? '⭐' : '⚪'}
          </div>
        `).join('')}
      </div>

      ${tokenCount >= targetTokens ? `
        <div class="token-reward-msg">
          🎉 ALL ${targetTokens} TOKENS EARNED! Time for ${esc(client.reinforcers ? client.reinforcers.split(',')[0].trim() : 'Reward')}! 🎈
        </div>
      ` : `<div style="text-align:center;font-size:0.85rem;color:#7e22ce">Tap tokens as client completes trials (${tokenCount}/${targetTokens} earned)</div>`}

      <!-- Digital First/Then Visual Schedule -->
      <div class="first-then-grid">
        <div class="first-box">
          <div class="ft-label" style="color:#2563eb">1. First (Task)</div>
          <b style="font-size:1.05rem;color:#1e40af">📚 ${esc(goals[0] ? goals[0].title : 'Tabletop Trials')}</b>
        </div>
        <div class="then-box">
          <div class="ft-label" style="color:#16a34a">2. Then (Reward)</div>
          <b style="font-size:1.05rem;color:#15803d">🎁 ${esc(client.reinforcers ? client.reinforcers.split(',')[0].trim() : 'Break Time')}</b>
        </div>
      </div>
    </div>
  ` : ''}

  <!-- Quick De-escalation Protocol Drawer -->
  ${plans.length ? `
    <details class="drawer">
      <summary>🚨 Emergency Behavior Intervention Plan Quick-Reference (${esc(plans[0].behavior)})</summary>
      <div style="margin-top:10px;font-size:0.92rem;line-height:1.5">
        <div style="background:var(--ok-light);padding:8px 12px;border-radius:6px;margin-bottom:8px">
          <b style="color:#065f46">Replacement Behavior:</b> ${esc(plans[0].data.replacement)}
        </div>
        <p style="margin:4px 0"><b>Staff Response Protocol:</b> ${esc(plans[0].data.staff.join(' · '))}</p>
        <p style="margin:4px 0;color:var(--slate-600)"><b>Antecedent Prevention:</b> ${esc(plans[0].data.prevention.join(' · '))}</p>
      </div>
    </details>
  ` : ''}

  <!-- In-Session ABC Incidents -->
  ${abcLogs.length ? `
    <div class="card" style="background:#fffbeb;border:1px solid #fde68a">
      <h4 style="margin:0 0 8px;color:#92400e">⚡ In-Session ABC Maladaptive Incidents (${abcLogs.length})</h4>
      ${abcLogs.map(a => `
        <div style="font-size:0.85rem;margin-bottom:4px;color:#78350f">
          <b>${esc(a.behavior)}</b> (<span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : 'esc'}">${esc(a.perceived_function)}</span>): Antecedent: ${esc(a.antecedent)} · Response: ${esc(a.consequence)}
        </div>
      `).join('')}
    </div>
  ` : ''}

  <!-- Teaching Mode Switcher (CentralReach Enhancement: DTT vs NET) -->
  <div class="flex-between" style="margin:16px 0 12px;background:var(--slate-100);padding:8px 12px;border-radius:var(--radius-md)">
    <div style="font-weight:700;font-size:0.9rem;color:var(--slate-700)">
      ${sessionMode === 'net' ? '🎲 Natural Environment Teaching (NET Multi-Target Grid)' : '🎯 Discrete Trial Training (DTT Single Focus)'}
    </div>
    <div style="display:flex;gap:6px">
      <button class="${sessionMode === 'dtt' ? 'ok' : 'sec'}" style="font-size:0.8rem;padding:4px 10px" onclick="act.setSessionMode('dtt')">🎯 DTT View</button>
      <button class="${sessionMode === 'net' ? 'ok' : 'sec'}" style="font-size:0.8rem;padding:4px 10px" onclick="act.setSessionMode('net')">🎲 NET Multi-Target View</button>
    </div>
  </div>

  ${sessionMode === 'net' ? `
    <div class="net-grid">
      ${goals.map((g) => `
        <div class="net-card">
          <div class="flex-between" style="margin-bottom:6px">
            <h4 style="margin:0;font-size:0.95rem;line-height:1.2">${esc(g.title)}</h4>
            <span class="badge p" style="font-size:0.7rem">#${g.id}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--slate-500);margin-bottom:8px">
            Trials: <b>${g.summary ? g.summary.total : 0}</b> · Indep: <b style="color:var(--ok)">${g.summary ? g.summary.pct.I : 0}%</b>
          </div>
          ${ended ? '' : `
            <div class="net-actions">
              <button class="net-btn btn-i" title="Independent" onclick="act.trial(${s.id}, ${g.id}, 'I')">⭐ Ind</button>
              <button class="net-btn btn-v" title="Verbal Prompt" onclick="act.trial(${s.id}, ${g.id}, 'V')">🗣️ Verb</button>
              <button class="net-btn btn-g" title="Gestural Prompt" onclick="act.trial(${s.id}, ${g.id}, 'G')">👉 Gest</button>
              <button class="net-btn btn-p" title="Physical Prompt" onclick="act.trial(${s.id}, ${g.id}, 'P')">🤝 Phys</button>
              <button class="net-btn btn-n" title="Refusal / Non-compliant" onclick="act.trial(${s.id}, ${g.id}, 'N')">⛔ Ref</button>
            </div>
          `}
          <div class="bar" style="height:4px;margin-top:8px">
            <div style="width:${g.summary ? g.summary.pct.I : 0}%"></div>
          </div>
        </div>
      `).join('')}
    </div>
    ${ended ? '' : `
      <div style="margin:8px 0 16px;text-align:right">
        <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.undo(${s.id})">↩ Undo Last Trial</button>
      </div>
    `}
  ` : goals.map((g) => `
    <div class="card">
      <div class="flex-between">
        <h3 style="margin:0">${esc(g.title)}</h3>
        <span class="badge p">Goal #${g.id}</span>
      </div>

      ${ended ? '' : `
        <div class="levels">
          ${Object.entries(LV).map(([k, cfg]) => `
            <button class="${cfg.cls}" onclick="act.trial(${s.id}, ${g.id}, '${k}')">
              <span>${cfg.icon} ${cfg.label}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.9rem;opacity:0.8">(${k})</span>
            </button>
          `).join('')}
        </div>
        <div style="margin-top:8px">
          <button class="sec" style="font-size:0.85rem;padding:6px 12px" onclick="act.undo(${s.id})">↩ Undo Last Trial</button>
        </div>
      `}
      ${sum(g)}
    </div>
  `).join('')}

  <!-- Clinical Session Documentation & Dual Sign-off -->
  <div class="card">
    <div class="flex-between">
      <div>
        <h3 style="margin:0">
          Clinical Session Documentation
          <span class="tag ${s.note_status === 'none' ? 'draft' : s.note_status}">
            ${s.note_status === 'pending_approval' ? 'Pending BCBA Approval' : s.note_status}
          </span>
        </h3>
        <p style="font-size:0.85rem;color:var(--slate-500);margin:2px 0 0">SOAP Narrative & Multi-Disciplinary Dual-Signature</p>
      </div>
      ${ended && s.note_status !== 'signed' ? `
        <button class="sec" onclick="act.genNote(${s.id})">🤖 Auto-Draft Note from Trials & ABC</button>
      ` : ''}
    </div>

    ${ended ? `
      <div style="margin-top:14px">
        <label>Session Narrative (Trials + ABC Incidents + Interventions)</label>
        <textarea id="note" rows="10" ${s.note_status === 'signed' ? 'disabled' : ''}>${esc(s.note)}</textarea>
        
        ${s.submitted_by ? `<div style="font-size:0.85rem;color:var(--slate-600);margin:6px 0"><b>RBT Author:</b> ${esc(s.submitted_by)} ${s.rbt_signed_at ? `(${fmtT(s.rbt_signed_at)})` : ''}</div>` : ''}
        ${s.signed_by ? `<div style="font-size:0.85rem;color:var(--ok);font-weight:700;margin:6px 0">✓ BCBA Co-Signer: ${esc(s.signed_by)} ${s.bcba_signed_at ? `(${fmtT(s.bcba_signed_at)})` : ''}</div>` : ''}
        
        ${s.note_status !== 'signed' ? `
          <div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap">
            <button class="sec" onclick="act.saveNote(${s.id})">💾 Save Draft</button>
            ${me.role === 'RBT' ? `<button class="ok" onclick="act.submitNote(${s.id})">📤 Submit Note for BCBA Review</button>` : ''}
            ${me.role === 'BCBA' ? `<button class="ok" onclick="act.signNote(${s.id})">✍️ BCBA Co-Sign & Approve Note</button>` : ''}
          </div>
        ` : `<div style="color:var(--ok);font-weight:700;margin-top:10px">✓ Clinical note finalized, co-signed by BCBA, and units deducted from authorization.</div>`}
      </div>
    ` : '<p style="color:var(--slate-500);margin-top:12px">End the session when complete to synthesize trial percentages and ABC incidents into the clinical documentation.</p>'}
  </div>`;
}

async function notesView() {
  const ns = await api('GET', '/api/notes');
  return `
  <div class="page-header">
    <div>
      <h1>Clinical Session Notes & Dual Sign-Off</h1>
      <p class="page-sub">Review RBT drafts, co-sign clinical notes, and monitor authorization deductions.</p>
    </div>
  </div>
  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Session Date</th>
          <th>Client Name</th>
          <th>Billed Units / Time</th>
          <th>Documentation Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${ns.map((n) => `
          <tr>
            <td><span style="font-family:'JetBrains Mono',monospace">${fmtT(n.start)}</span></td>
            <td><b>${esc(n.client)}</b></td>
            <td>${n.units} units (${n.units * 15} mins)</td>
            <td>
              <span class="tag ${n.note_status === 'none' ? 'draft' : n.note_status}">
                ${n.note_status === 'pending_approval' ? 'Pending BCBA Sign' : n.note_status}
              </span>
            </td>
            <td><button class="sec" onclick="go('session',${n.id})">Open Note →</button></td>
          </tr>
        `).join('')}
      </tbody>
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
    form = `
    <div class="card" style="background:var(--slate-50);border:1px solid var(--slate-300)">
      <h3>Record BACB Supervision Meeting</h3>
      <div class="row">
        <div><label>Client</label><select id="sup_c">${cs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>RBT Supervised</label><select id="sup_r">${rbts.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>
        <div><label>Minutes Supervised</label><input id="sup_m" type="number" value="60"></div>
        <div>
          <label>Supervision Type</label>
          <select id="sup_t">
            <option>Direct Observation</option>
            <option>Protocol Modification</option>
            <option>Competency Assessment</option>
            <option>Case Conceptualization</option>
          </select>
        </div>
      </div>
      <label>Supervision Notes & Feedback</label>
      <textarea id="sup_n" rows="2" placeholder="e.g. Observed prompt-fading procedures during tabletop trials."></textarea>
      <button class="ok" onclick="act.addSupervision()">Log Supervision Event</button>
    </div>`;
  }

  return `
  <div class="page-header">
    <div>
      <h1>BACB Monthly Supervision Tracking</h1>
      <p class="page-sub">Mandatory 5% Minimum Supervision of Direct RBT Applied Behavior Analysis Hours</p>
    </div>
  </div>

  <div class="card" style="border-left:5px solid ${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">
    <div class="flex-between">
      <div>
        <h2 style="margin:0;font-size:1.4rem">Month: ${esc(sup.month)}</h2>
        <p style="margin:4px 0 0;color:var(--slate-500)">BACB Rule: BCBA supervision must constitute at least 5% of monthly direct therapy hours.</p>
      </div>
      <div style="text-align:right">
        <div class="stat" style="color:${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">${sup.supPct}%</div>
        <span class="tag ${sup.compliant ? 'approved' : 'draft'}">${sup.compliant ? '✓ Compliant ≥5%' : '⚠ Action Needed'}</span>
      </div>
    </div>
    <div style="margin-top:16px;display:flex;gap:24px;flex-wrap:wrap">
      <div>RBT Direct 97153 Hours: <b>${Math.round(sup.rbtDirectMinutes / 60 * 10) / 10} hrs</b> (${sup.rbtDirectMinutes} mins)</div>
      <div>Supervised 97155 Hours: <b>${Math.round(sup.supMinutes / 60 * 10) / 10} hrs</b> (${sup.supMinutes} mins)</div>
    </div>
  </div>
  ${form}
  <div class="card">
    <h3>Supervision Audit Log</h3>
    ${sup.logs.length ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Supervising BCBA</th>
            <th>RBT Supervised</th>
            <th>Duration</th>
            <th>Type</th>
            <th>Feedback Notes</th>
          </tr>
        </thead>
        <tbody>
          ${sup.logs.map(l => `
            <tr>
              <td><span style="font-family:'JetBrains Mono',monospace">${fmtT(l.ts)}</span></td>
              <td><b>${esc(l.client)}</b></td>
              <td>${esc(l.bcba)}</td>
              <td>${esc(l.rbt)}</td>
              <td><b>${l.minutes} mins</b></td>
              <td><span class="badge p">${esc(l.type)}</span></td>
              <td style="font-size:0.85rem">${esc(l.notes || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:var(--slate-400)">No supervision events recorded for this billing cycle.</p>'}
  </div>`;
}

// Modal renderer
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
        <p style="font-size:0.85rem;color:var(--slate-500);margin:6px 0 16px">Rapid field entry for maladaptive behavioral episodes.</p>
        
        <label>Target Maladaptive Behavior</label>
        <select id="m_behavior">${BEHAVIORS.map(b => `<option>${b}</option>`).join('')}</select>
        
        <label>Antecedent (What immediately triggered the behavior?)</label>
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
        
        <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitAbcModal(${cid}, ${sid || 'null'})">Save ABC Incident</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'reauth_report') {
    const report = activeModal.report;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:820px;width:95%;max-height:90vh;overflow-y:auto">
        <div class="flex-between">
          <div>
            <span class="badge p">CPT 97151 / 97155 Insurance Progress Report</span>
            <h3 style="margin:4px 0 0">${esc(report.title)}</h3>
            <div style="font-size:0.85rem;color:var(--slate-500)">Client: <b>${esc(report.client_name)}</b> · Date: ${esc(report.date)}</div>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:10px 14px;border-radius:var(--radius-md);margin:14px 0">
          <div style="font-weight:700;color:#065f46">🎯 Clinical Progress Summary:</div>
          <div style="font-size:0.85rem;color:#047857">${report.masteredCount} of ${report.totalGoals} skill acquisition targets have reached mastery or criteria-met during this 6-month period.</div>
        </div>

        <div class="report-content" id="report_text_body" style="background:#fff;border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:16px;font-size:0.88rem;line-height:1.6;white-space:pre-wrap;font-family:system-ui;color:var(--slate-800)">${esc(report.text)}</div>

        <div style="display:flex;gap:10px;margin-top:16px;justify-content:space-between;align-items:center;flex-wrap:wrap">
          <div style="font-size:0.8rem;color:var(--slate-500)">
            🔒 Official BACB Treatment Plan Draft · Supervising BCBA Review & Co-signature Required
          </div>
          <div style="display:flex;gap:8px">
            <button class="sec" onclick="act.copyReport()">📋 Copy to Clipboard</button>
            <button class="ok" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button class="sec" onclick="act.closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  return '';
}

// ---------- Actions ----------
const act = {
  login: safe(async () => {
    try {
      me = await api('POST', '/api/login', { email: val('em'), password: val('pw') });
      location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard';
      render();
    } catch (e) { $app.innerHTML = loginView(e.message); }
  }),
  demoLogin: safe(async (email) => {
    me = await api('POST', '/api/login', { email, password: 'password' });
    location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard';
    render();
  }),
  logout: safe(async () => { await api('POST', '/api/logout'); me = null; location.hash = ''; render(); }),
  addClient: safe(async () => {
    const r = await api('POST', '/api/clients', {
      name: val('nn'),
      dob: val('nd'),
      diagnosis: val('ng'),
      guardian: val('nguard'),
      communication: val('ncomm')
    });
    go('client', r.id);
  }),
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
  setGoalStatus: safe(async (gid, status) => {
    await api('POST', `/api/goals/${gid}/status`, { status });
    alert(`Goal marked as: ${status}`);
    render();
  }),
  toggleKidMode: () => { showKidMode = !showKidMode; render(); },
  toggleToken: (idx) => {
    if (idx < tokenCount) {
      tokenCount = idx;
    } else {
      tokenCount = idx + 1;
    }
    render();
  },
  resetTokens: () => { tokenCount = 0; render(); },
  setSessionMode: (m) => { sessionMode = m; render(); },
  openReauthReportModal: safe(async (cid) => {
    const report = await api('GET', `/api/clients/${cid}/reauth-report`);
    activeModal = { type: 'reauth_report', report };
    render();
  }),
  copyReport: () => {
    if (activeModal && activeModal.report) {
      navigator.clipboard.writeText(activeModal.report.text);
      alert('✓ 6-Month Re-Authorization Progress Report copied to clipboard!');
    }
  },
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
    else html = '<h1>View Not Found</h1><div class="card">Please select an option from the navigation menu.</div>';
    $app.innerHTML = shell(html, route === 'client' ? 'clients' : route === 'session' ? 'notes' : route);
  } catch (e) { $app.innerHTML = shell(`<div class="card err">${esc(e.message)}</div>`, ''); }
}

window.addEventListener('hashchange', render);
render();
}
