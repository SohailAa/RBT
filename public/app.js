const $app = document.getElementById('app');
let me = null;
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const val = (id) => document.getElementById(id).value;
const LV = { I: 'Independent', V: 'Verbal prompt', G: 'Gestural prompt', P: 'Physical prompt', N: 'Did not comply' };
const fmtT = (s) => s ? new Date(s.length === 16 ? s : s).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && me) { me = null; render(); } throw new Error(j.error || 'Error'); }
  return j;
}
const safe = (fn) => async (...a) => { try { await fn(...a); } catch (e) { alert(e.message); } };

const NAV = {
  BCBA: [['dashboard', '🏠 Dashboard'], ['clients', '👧 Clients'], ['schedule', '📅 Schedule'], ['notes', '📝 Notes'], ['soon', '💳 Billing'], ['soon', '👥 Staff']],
  RBT: [['dashboard', '🏠 My Day'], ['schedule', '📅 Schedule'], ['clients', '👧 My Clients'], ['notes', '📝 Notes']],
  PARENT: [['clients', '👧 My Child']],
};

function shell(content, route) {
  return `<div class="layout"><nav><h2>Effective Behavioral Approach</h2>
  ${NAV[me.role].map(([r, l]) => `<a class="${route === r ? 'on' : ''}" onclick="go('${r}')">${l}</a>`).join('')}
  <a onclick="act.logout()">🚪 Log out</a><div style="font-size:.75rem;margin-top:12px;opacity:.8">${esc(me.name)}</div></nav><main>${content}</main></div>`;
}
window.go = (r, id) => { location.hash = id ? `${r}/${id}` : r; };

// ---------- views ----------
function loginView(err) {
  return `<div class="login card"><h2>Effective Behavioral Approach</h2>
  <label>Email</label><input id="em" value="bcba@eba.test"><label>Password</label><input id="pw" type="password" value="password">
  <button onclick="act.login()">Log in</button><div class="err">${esc(err || '')}</div>
  <small>Demo: bcba@eba.test · rbt@eba.test · parent@eba.test (password: password)</small></div>`;
}

async function dashboardView() {
  const d = await api('GET', '/api/dashboard');
  return `<h1>${me.role === 'RBT' ? 'My Day' : 'Today'}</h1><div class="grid">
  <div class="card"><div class="stat">${d.appts.length}</div>sessions</div>
  <div class="card"><div class="stat">${d.rbt}</div>RBT sessions</div>
  <div class="card"><div class="stat">${d.bcba}</div>BCBA sessions</div>
  <div class="card"><div class="stat">${d.incompleteNotes}</div>notes incomplete</div>
  <div class="card"><div class="stat">${d.auths.length}</div>authorizations near limit</div>
  ${me.role === 'BCBA' ? `<div class="card"><div class="stat">${d.pendingApprovals}</div>drafts to approve</div><div class="card"><div class="stat">${d.pendingSign}</div>notes to sign</div>` : ''}
  </div>
  <div class="card"><h3>Schedule</h3>${d.appts.length ? `<table>${d.appts.map((a) => `<tr><td>${fmtT(a.start)}–${a.end.slice(11)}</td><td>${esc(a.client)}</td><td>${esc(a.role)} · ${esc(a.setting)}</td><td><button onclick="act.start(${a.id})">Open / Start</button></td></tr>`).join('')}</table>` : 'Nothing scheduled.'}</div>
  ${d.auths.length ? `<div class="card"><h3>⚠ Authorizations near limit</h3>${d.auths.map((a) => `<div>${esc(a.client)} – CPT ${esc(a.code)}: ${a.used}/${a.authorized} units used</div>`).join('')}</div>` : ''}`;
}

async function clientsView() {
  const cs = await api('GET', '/api/clients');
  if (me.role === 'PARENT' && cs.length) return clientView(cs[0].id);
  return `<h1>Clients</h1>
  ${me.role === 'BCBA' ? `<div class="card"><h3>Add client</h3><div class="row"><div><label>Name</label><input id="nn"></div><div><label>Date of birth</label><input id="nd" type="date"></div><div><label>Diagnosis</label><input id="ng"></div></div><button onclick="act.addClient()">Add</button></div>` : ''}
  <div class="card"><table>${cs.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.diagnosis)}</td><td>${esc(c.school)}</td><td><button class="sec" onclick="go('client',${c.id})">Open profile</button></td></tr>`).join('')}</table></div>`;
}

let tab = 'basic';
function chart(series, baseline, target) {
  if (!series.length) return '<small>No data yet.</small>';
  const w = 320, h = 120, n = series.length;
  const x = (i) => n === 1 ? w / 2 : 10 + (i * (w - 20)) / (n - 1), y = (p) => h - 10 - (p / 100) * (h - 20);
  const pts = series.map((s, i) => `${x(i)},${y(s.pct)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;background:#fafafe;border-radius:8px">
  <line x1="0" x2="${w}" y1="${y(baseline)}" y2="${y(baseline)}" stroke="#999" stroke-dasharray="4"/><line x1="0" x2="${w}" y1="${y(target)}" y2="${y(target)}" stroke="#1e9e5a" stroke-dasharray="4"/>
  <polyline fill="none" stroke="#4b3fa8" stroke-width="3" points="${pts}"/>${series.map((s, i) => `<circle cx="${x(i)}" cy="${y(s.pct)}" r="4" fill="#4b3fa8"><title>${s.pct}%</title></circle>`).join('')}</svg>
  <small>— baseline ${baseline}% · target ${target}%</small>`;
}
const ANTS = ['Transition', 'Removal of preferred item', 'Difficult task', 'Denied access', 'Peer proximity'];

async function clientView(id) {
  const { client: c, goals, plans, stories, auths, assigned } = await api('GET', '/api/clients/' + id);
  const B = me.role === 'BCBA', P = me.role === 'PARENT';
  const tabs = P ? [['goals', 'Goals'], ['stories', 'My Stories']] : [['basic', 'Profile'], ['goals', 'Goals & Data'], ['plans', 'Behavior Plans'], ['stories', 'Social Stories'], ['services', 'Services']];
  if (P && !['goals', 'stories'].includes(tab)) tab = 'goals'; if (!P && tab === 'goals' && false) tab = 'basic';
  let body = '';
  if (tab === 'basic') {
    const f = [['name', 'Name'], ['dob', 'Date of birth'], ['diagnosis', 'Diagnosis'], ['guardian', 'Parent/guardian'], ['school', 'School'], ['emergency', 'Emergency contacts'], ['insurance', 'Insurance'], ['reinforcers', 'Reinforcers (comma separated)'], ['sensory', 'Sensory preferences'], ['triggers', 'Triggers']];
    body = `<div class="card"><div class="row">${f.map(([k, l]) => `<div><label>${l}</label><input id="f_${k}" value="${esc(c[k])}" ${B ? '' : 'disabled'}></div>`).join('')}</div>
    ${B ? `<button onclick="act.saveClient(${c.id})">Save</button>` : ''}</div>${assigned.length ? `<div class="card">Assigned staff: ${assigned.map((a) => esc(a.name)).join(', ')}</div>` : ''}`;
  } else if (tab === 'goals') {
    body = goals.map((g) => `<div class="card"><h3>${esc(g.title)}</h3>
      <div>Baseline: <b>${g.baseline}%</b> · Current: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b> · Target: ${g.target}% · Trend: <b>${esc(g.trend)}</b></div>${chart(g.series, g.baseline, g.target)}</div>`).join('') || '<div class="card">No goals yet.</div>';
    if (B) body += `<div class="card"><h3>Add goal</h3><div class="row"><div><label>Title</label><input id="gt"></div><div><label>Baseline % independent</label><input id="gb" type="number"></div><div><label>Target %</label><input id="gg" type="number" value="80"></div></div><button onclick="act.addGoal(${c.id})">Add goal</button></div>`;
  } else if (tab === 'plans') {
    body = (B ? `<div class="card"><h3>New behavior plan (draft)</h3><label>Target behavior</label><select id="pb">${['Screaming', 'Aggression', 'Elopement', 'Task refusal', 'Crying'].map((x) => `<option>${x}</option>`).join('')}</select>
      <label>Possible antecedents</label>${ANTS.map((a) => `<div><label><input type="checkbox" class="pa" value="${a}" style="width:auto"> ${a}</label></div>`).join('')}<button onclick="act.genPlan(${c.id})">Generate draft plan</button></div>` : '') +
      plans.map((p) => planCard(p, B)).join('');
  } else if (tab === 'stories') {
    body = (B ? `<div class="card"><h3>AI Social Story Builder</h3><div class="row"><div><label>Situation</label><input id="ss" placeholder="LEGO class"></div><div><label>Challenge</label><input id="sc" placeholder="Doesn't want other children touching her creation"></div></div>
      <div class="row"><div><label>Goal</label><input id="sg" placeholder="Accept others working nearby"></div><div><label>Interest</label><input id="si" placeholder="LEGO"></div><div><label>Visuals</label><select id="sv"><option>Cartoon</option><option>Photos</option><option>Simple icons</option></select></div></div>
      <button onclick="act.genStory(${c.id})">Generate draft story</button></div>` : '') + stories.map((s) => storyCard(s, B)).join('') || '<div class="card">No stories yet.</div>';
    if (P && !stories.length) body = '<div class="card">No stories shared yet.</div>';
  } else if (tab === 'services') {
    body = `<div class="card"><h3>Authorizations</h3><table><tr><th>CPT</th><th>Authorized</th><th>Used</th><th>Remaining</th></tr>${auths.map((a) => `<tr><td>${esc(a.code)}</td><td>${a.authorized}</td><td>${a.used}</td><td>${a.authorized - a.used}</td></tr>`).join('')}</table>
    ${B ? `<div class="row"><div><label>CPT code</label><input id="ac" value="97153"></div><div><label>Authorized units</label><input id="au" type="number"></div></div><button onclick="act.addAuth(${c.id})">Add authorization</button>` : ''}</div>
    <div class="card"><h3>Documents</h3><small>Assessments, treatment plans, progress reports and consent forms — coming in the next phase.</small></div>`;
  }
  return `<h1>👧 ${esc(c.name)}</h1><div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" onclick="act.setTab('${k}')">${l}</button>`).join('')}</div>${body}`;
}
function planCard(p, B) {
  const d = p.data, list = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<div class="card"><h3>${esc(p.behavior)} <span class="tag ${p.status}">${p.status}${p.approved_by ? ' by ' + esc(p.approved_by) : ''}</span></h3>
  <b>Antecedents</b>${list(d.antecedents)}<b>Prevention</b>${list(d.prevention)}<b>Replacement behavior</b><p>${esc(d.replacement)}</p><b>Reinforcement</b>${list(d.reinforcement)}<b>Staff response</b>${list(d.staff)}
  ${B ? `<details><summary>Edit (JSON-free)</summary><label>Definition</label><textarea id="pd${p.id}">${esc(d.definition)}</textarea><label>Replacement</label><input id="pr${p.id}" value="${esc(d.replacement)}">
  <label>Prevention (one per line)</label><textarea id="pp${p.id}" rows="4">${esc(d.prevention.join('\n'))}</textarea><label>Staff response (one per line)</label><textarea id="ps${p.id}" rows="4">${esc(d.staff.join('\n'))}</textarea>
  <button class="sec" onclick="act.savePlan(${p.id})">Save edits (resets to draft)</button></details>
  ${p.status === 'draft' ? `<button class="ok" onclick="act.approvePlan(${p.id})">BCBA Approve</button>` : ''}` : ''}</div>`;
}
function storyCard(s, B) {
  const c = s.content;
  return `<div class="card"><h3>${esc(c.title)} <span class="tag ${s.status}">${s.status}</span></h3>
  ${c.sentences.map((x) => `<div class="sentence"><span class="ic">${x.icon}</span><span>${esc(x.text)}</span></div>`).join('')}
  ${B ? `<details><summary>Edit text</summary><textarea id="st${s.id}" rows="8">${esc(c.sentences.map((x) => x.text).join('\n'))}</textarea><button class="sec" onclick="act.saveStory(${s.id})">Save edits (resets to draft)</button></details>
  ${s.status === 'draft' ? `<button class="ok" onclick="act.approveStory(${s.id})">BCBA Approve</button>` : ''}
  ${s.status !== 'draft' ? `<button onclick="act.shareStory(${s.id})">${s.status === 'shared' ? 'Show' : 'Share'} parent link</button>` : ''}` : ''}</div>`;
}

async function scheduleView() {
  const a = await api('GET', '/api/schedule');
  let form = '';
  if (me.role === 'BCBA') {
    const [cs, st] = await Promise.all([api('GET', '/api/clients'), api('GET', '/api/staff')]);
    form = `<div class="card"><h3>New appointment</h3><div class="row"><div><label>Client</label><select id="ac">${cs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div><label>Staff</label><select id="as">${st.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
    <div><label>Start</label><input id="astart" type="datetime-local"></div><div><label>End</label><input id="aend" type="datetime-local"></div><div><label>Setting</label><select id="aset"><option>Home</option><option>School</option><option>Clinic</option></select></div></div>
    <button onclick="act.addAppt()">Add</button></div>`;
  }
  const days = {}; a.forEach((x) => { (days[x.start.slice(0, 10)] ||= []).push(x); });
  return `<h1>Schedule</h1>${form}${Object.entries(days).map(([d, xs]) => `<div class="card"><h3>${new Date(d + 'T00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</h3><table>${xs.map((x) => `<tr><td>${x.start.slice(11)}–${x.end.slice(11)}</td><td><b>${esc(x.client)}</b></td><td>${esc(x.role)} · ${esc(x.setting)}</td><td>${esc(x.staff)}</td><td>${x.session && x.session.end ? '<span class="tag approved">done</span>' : ''} <button onclick="act.start(${x.id})">${x.session ? 'Open' : 'Start'}</button></td></tr>`).join('')}</table></div>`).join('') || '<div class="card">No appointments.</div>'}`;
}

let timer = null;
async function sessionView(id) {
  const v = await api('GET', '/api/sessions/' + id);
  const { session: s, client, goals, plans, stories } = v; const ended = !!s.end;
  const startMs = new Date(s.start).getTime();
  clearInterval(timer);
  if (!ended) timer = setInterval(() => { const el = document.getElementById('clock'); if (!el) return clearInterval(timer); const t = Math.floor((Date.now() - startMs) / 1000); el.textContent = [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map((n) => String(n).padStart(2, '0')).join(':'); }, 1000);
  const sum = (g) => g.summary.total ? Object.keys(LV).map((k) => `<div>${LV[k]}: <b>${g.summary.pct[k]}%</b><div class="bar"><div style="width:${g.summary.pct[k]}%"></div></div></div>`).join('') + `<small>${g.summary.total} opportunities</small>` : '<small>No opportunities recorded yet.</small>';
  return `<h1>Session – ${esc(client.name)}</h1>
  <div class="card"><div class="big" id="clock">${ended ? s.units + ' units' : '00:00:00'}</div>${ended ? `<p style="text-align:center">Session ended · <b>${s.units}</b> × 15-minute units</p>` : `<div style="text-align:center"><button class="bad" onclick="act.endSession(${s.id})">END SESSION</button></div>`}</div>
  ${plans.length ? `<div class="card"><h3>Behavior plan</h3>${plans.map((p) => `<b>${esc(p.behavior)}</b>: replace with ${esc(p.data.replacement)}<br><small>Staff: ${esc(p.data.staff.join(' · '))}</small>`).join('<hr>')}</div>` : ''}
  ${stories.length ? `<div class="card"><h3>Social stories</h3>${stories.map((x) => `<details><summary>${esc(x.content.title)}</summary>${x.content.sentences.map((t) => `<div class="sentence"><span class="ic">${t.icon}</span>${esc(t.text)}</div>`).join('')}</details>`).join('')}</div>` : ''}
  ${goals.map((g) => `<div class="card"><h3>${esc(g.title)}</h3>
    ${ended ? '' : `<div class="levels">${Object.entries(LV).map(([k, l]) => `<button class="${k === 'I' ? 'ok' : k === 'N' ? 'bad' : ''}" onclick="act.trial(${s.id},${g.id},'${k}')">${k === 'I' ? '☑ ' : '☐ '}${l}</button>`).join('')}</div><button class="sec" style="margin-top:8px" onclick="act.undo(${s.id})">↩ Undo last</button>`}
    <div style="margin-top:10px">${sum(g)}</div></div>`).join('')}
  <div class="card"><h3>Session note <span class="tag ${s.note_status === 'none' ? '' : s.note_status}">${s.note_status}</span></h3>
  ${ended ? `<textarea id="note" rows="12" ${s.note_status === 'signed' ? 'disabled' : ''}>${esc(s.note)}</textarea>
  ${s.note_status !== 'signed' ? `<button class="sec" onclick="act.genNote(${s.id})">Draft note from data</button> <button onclick="act.saveNote(${s.id})">Save draft</button> ${me.role === 'BCBA' ? `<button class="ok" onclick="act.signNote(${s.id})">Review & Sign</button>` : '<small>BCBA signs after review.</small>'}` : `<small>Signed by ${esc(s.signed_by)}</small>`}` : '<small>End the session to write the note.</small>'}</div>`;
}

async function notesView() {
  const ns = await api('GET', '/api/notes');
  return `<h1>Session notes</h1><div class="card"><table>${ns.map((n) => `<tr><td>${fmtT(n.start)}</td><td>${esc(n.client)}</td><td>${n.units} units</td><td><span class="tag ${n.note_status === 'none' ? '' : n.note_status}">${n.note_status}</span></td><td><button class="sec" onclick="go('session',${n.id})">Open</button></td></tr>`).join('')}</table></div>`;
}

// ---------- actions ----------
const act = {
  login: safe(async () => { try { me = await api('POST', '/api/login', { email: val('em'), password: val('pw') }); location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard'; render(); } catch (e) { $app.innerHTML = loginView(e.message); } }),
  logout: safe(async () => { await api('POST', '/api/logout'); me = null; location.hash = ''; render(); }),
  addClient: safe(async () => { const r = await api('POST', '/api/clients', { name: val('nn'), dob: val('nd'), diagnosis: val('ng') }); go('client', r.id); }),
  saveClient: safe(async (id) => { const b = {}; ['name', 'dob', 'diagnosis', 'guardian', 'school', 'emergency', 'insurance', 'reinforcers', 'sensory', 'triggers'].forEach((k) => b[k] = val('f_' + k)); await api('PUT', '/api/clients/' + id, b); alert('Saved'); }),
  setTab: (t) => { tab = t; render(); },
  addGoal: safe(async (id) => { await api('POST', `/api/clients/${id}/goals`, { title: val('gt'), baseline: val('gb'), target: val('gg') }); render(); }),
  addAuth: safe(async (id) => { await api('POST', `/api/clients/${id}/auths`, { code: val('ac'), authorized: val('au') }); render(); }),
  genPlan: safe(async (id) => { await api('POST', `/api/clients/${id}/plans/generate`, { behavior: val('pb'), antecedents: [...document.querySelectorAll('.pa:checked')].map((x) => x.value) }); render(); }),
  savePlan: safe(async (id) => { const lines = (k) => val(k + id).split('\n').map((s) => s.trim()).filter(Boolean); const cur = (await api('GET', location.hash.replace('#client/', '/api/clients/'))).plans.find((p) => p.id === id).data; cur.definition = val('pd' + id); cur.replacement = val('pr' + id); cur.prevention = lines('pp'); cur.staff = lines('ps'); await api('PUT', '/api/plans/' + id, { data: cur }); render(); }),
  approvePlan: safe(async (id) => { await api('POST', `/api/plans/${id}/approve`); render(); }),
  genStory: safe(async (id) => { await api('POST', `/api/clients/${id}/stories/generate`, { situation: val('ss'), challenge: val('sc'), goal: val('sg'), interest: val('si'), visuals: val('sv') }); render(); }),
  saveStory: safe(async (id) => { const cl = await api('GET', location.hash.replace('#client/', '/api/clients/')); const s = cl.stories.find((x) => x.id === id).content; const lines = val('st' + id).split('\n').map((t) => t.trim()).filter(Boolean); s.sentences = lines.map((t, i) => ({ icon: (s.sentences[i] || s.sentences[s.sentences.length - 1]).icon, type: (s.sentences[i] || {}).type || 'directive', text: t })); await api('PUT', '/api/stories/' + id, { content: s }); render(); }),
  approveStory: safe(async (id) => { await api('POST', `/api/stories/${id}/approve`); render(); }),
  shareStory: safe(async (id) => { const r = await api('POST', `/api/stories/${id}/share`); const u = location.origin + r.url; prompt('Parent link (send to parent):', u); render(); }),
  addAppt: safe(async () => { await api('POST', '/api/appointments', { client_id: val('ac'), user_id: val('as'), start: val('astart'), end: val('aend'), setting: val('aset') }); render(); }),
  start: safe(async (id) => { const r = await api('POST', `/api/appointments/${id}/start`); go('session', r.id); }),
  trial: safe(async (sid, gid, level) => { await api('POST', `/api/sessions/${sid}/trials`, { goal_id: gid, level }); render(); }),
  undo: safe(async (sid) => { await api('DELETE', `/api/sessions/${sid}/trials/last`); render(); }),
  endSession: safe(async (sid) => { if (confirm('End session?')) { await api('POST', `/api/sessions/${sid}/end`, {}); render(); } }),
  genNote: safe(async (sid) => { const r = await api('POST', `/api/sessions/${sid}/note/generate`, {}); document.getElementById('note').value = r.note; }),
  saveNote: safe(async (sid) => { await api('PUT', `/api/sessions/${sid}/note`, { note: val('note') }); render(); }),
  signNote: safe(async (sid) => { await api('PUT', `/api/sessions/${sid}/note`, { note: val('note') }); await api('POST', `/api/sessions/${sid}/note/sign`); render(); }),
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
    else html = '<h1>Coming soon</h1><div class="card">Billing, claims and staff management are planned for the next phase.</div>';
    $app.innerHTML = shell(html, route === 'client' ? 'clients' : route === 'session' ? 'notes' : route);
  } catch (e) { $app.innerHTML = shell(`<div class="card err">${esc(e.message)}</div>`, ''); }
}
window.addEventListener('hashchange', render);
render();
