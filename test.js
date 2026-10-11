// Smoke + access-control test. Run with the server up: node test.js
const base = 'http://localhost:3000';
async function login(email) {
  const r = await fetch(base + '/api/login', { method: 'POST', body: JSON.stringify({ email, password: 'password' }) });
  const cookie = r.headers.get('set-cookie').split(';')[0];
  return (m, u, b) => fetch(base + u, { method: m, headers: { cookie }, body: b ? JSON.stringify(b) : undefined }).then(async (x) => ({ s: x.status, j: await x.json() }));
}
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const { calcUnits } = require('./lib/generators');
  ok(calcUnits(180) === 12 && calcUnits(22) === 1 && calcUnits(23) === 2 && calcUnits(7) === 0, 'unit calc (8-minute rule)');
  const b = await login('bcba@eba.test'), r = await login('rbt@eba.test'), p = await login('parent@eba.test');
  ok((await b('GET', '/api/clients')).j.length >= 2, 'BCBA sees all clients');
  ok((await r('GET', '/api/clients')).j.length === 2, 'RBT sees assigned clients');
  ok((await r('POST', '/api/clients', { name: 'x' })).s === 403, 'RBT cannot add client');
  ok((await p('GET', '/api/clients/2')).s === 403, 'Parent blocked from other child');
  const pc = (await p('GET', '/api/clients/1')).j; ok(!pc.plans.length && !pc.auths.length, 'Parent sees no plans/auths');
  const g = await b('POST', '/api/clients/1/stories/generate', { situation: 'LEGO class', challenge: "Doesn't want others touching her creation", goal: 'Accept others working nearby', interest: 'LEGO' });
  ok((await b('POST', `/api/stories/${g.j.id}/share`)).s === 400, 'cannot share unapproved story');
  await b('POST', `/api/stories/${g.j.id}/approve`);
  const sh = await b('POST', `/api/stories/${g.j.id}/share`); ok(sh.j.url, 'share after approve');
  ok((await fetch(base + sh.j.url).then((x) => x.text())).includes('LEGO'), 'parent story page renders');
  const pl = await b('POST', '/api/clients/1/plans/generate', { behavior: 'Screaming', antecedents: ['Transition'] });
  await b('POST', `/api/plans/${pl.j.id}/approve`);
  const appts = (await r('GET', '/api/schedule')).j; const st = await r('POST', `/api/appointments/${appts[0].id}/start`);
  const sid = st.j.id; const goal = (await r('GET', '/api/sessions/' + sid)).j.goals[0];
  for (const l of ['I', 'V', 'I', 'P']) await r('POST', `/api/sessions/${sid}/trials`, { goal_id: goal.id, level: l });
  const sv = (await r('GET', '/api/sessions/' + sid)).j; ok(sv.goals[0].summary.pct.I === 50, 'summary % independent = 50');
  ok((await r('POST', `/api/sessions/${sid}/end`, { minutes_override: 180 })).j.units === 12, '3h = 12 units');
  const note = (await r('POST', `/api/sessions/${sid}/note/generate`, {})).j.note; ok(note.includes('12 units') || note.includes('units'), 'note drafted');
  await r('PUT', `/api/sessions/${sid}/note`, { note });
  ok((await r('POST', `/api/sessions/${sid}/note/sign`)).s === 403, 'RBT cannot sign');
  ok((await b('POST', `/api/sessions/${sid}/note/sign`)).s === 200, 'BCBA signs');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
