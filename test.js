const http = require('http');
const fs = require('fs');
const path = require('path');
['eba.db', 'eba.db-shm', 'eba.db-wal', 'eba.test.db', 'eba.test.db-shm', 'eba.test.db-wal'].forEach((f) => { try { fs.unlinkSync(path.join(__dirname, f)); } catch {} });
if (fs.existsSync(path.join(__dirname, 'eba.db'))) {
  process.env.EBA_DB_PATH = path.join(__dirname, 'eba.test.db');
}
const handler = require('./server');

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  // Spin up an in-process server on a random available port for tests
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  async function login(email) {
    const r = await fetch(base + '/api/login', { method: 'POST', body: JSON.stringify({ email, password: 'password' }) });
    const cookie = r.headers.get('set-cookie').split(';')[0];
    return (m, u, b) => fetch(base + u, { method: m, headers: { cookie }, body: b ? JSON.stringify(b) : undefined }).then(async (x) => ({ s: x.status, j: await x.json() }));
  }

  const { calcUnits } = require('./lib/generators');
  ok(calcUnits(180) === 12 && calcUnits(22) === 1 && calcUnits(23) === 2 && calcUnits(7) === 0, 'unit calc (8-minute rule)');
  
  const b = await login('bcba@eba.test'), r = await login('rbt@eba.test'), p = await login('parent@eba.test');
  
  // 1. Core RBAC checks
  ok((await b('GET', '/api/clients')).j.length >= 2, 'BCBA sees all clients');
  ok((await r('GET', '/api/clients')).j.length === 2, 'RBT sees assigned clients');
  ok((await r('POST', '/api/clients', { name: 'x' })).s === 403, 'RBT cannot add client');
  ok((await p('GET', '/api/clients/2')).s === 403, 'Parent blocked from other child');
  
  // 2. Client 360 Consolidated Data Check
  const c360 = (await b('GET', '/api/clients/1')).j;
  ok(c360.client && c360.client.communication && c360.client.crisis_plan, 'Client 360 includes communication & crisis vitals');
  ok(Array.isArray(c360.abcLogs) && c360.abcSummary && typeof c360.abcSummary.functions === 'object', 'Client 360 includes ABC logs & function matrix');
  ok(Array.isArray(c360.supervisionLogs), 'Client 360 includes supervision audit history');

  // Parent privacy
  const pc = (await p('GET', '/api/clients/1')).j;
  ok(!pc.plans.length && !pc.auths.length && !pc.abcLogs.length, 'Parent sees no raw plans, auths, or internal ABC logs');

  // 3. Social Stories Workflow
  const g = await b('POST', '/api/clients/1/stories/generate', { situation: 'LEGO class', challenge: "Doesn't want others touching her creation", goal: 'Accept others working nearby', interest: 'LEGO' });
  ok((await b('POST', `/api/stories/${g.j.id}/share`)).s === 400, 'cannot share unapproved story');
  await b('POST', `/api/stories/${g.j.id}/approve`);
  const sh = await b('POST', `/api/stories/${g.j.id}/share`);
  ok(sh.j.url, 'share after approve');
  ok((await fetch(base + sh.j.url).then((x) => x.text())).includes('LEGO'), 'parent story page renders');

  // 4. Behavior Plan (BIP)
  const pl = await b('POST', '/api/clients/1/plans/generate', { behavior: 'Screaming', antecedents: ['Transition from preferred activity'] });
  await b('POST', `/api/plans/${pl.j.id}/approve`);

  // 5. ABC Data Collection
  const abcRes = await r('POST', '/api/clients/1/abc', {
    antecedent: 'Difficult academic task',
    behavior: 'Task refusal',
    consequence: 'Prompted break card',
    perceived_function: 'Escape',
    notes: 'Accepted replacement communication'
  });
  ok(abcRes.s === 200 && abcRes.j.id, 'RBT can log ABC event on client');
  const updated360 = (await b('GET', '/api/clients/1')).j;
  ok(updated360.abcSummary.functions.Escape >= 1, 'ABC summary function matrix updates with Escape count');

  // 6. Active Session Cockpit
  const apptRes = await b('POST', '/api/appointments', {
    client_id: 1,
    user_id: 2,
    start: new Date().toISOString().slice(0, 10) + 'T13:00',
    end: new Date().toISOString().slice(0, 10) + 'T16:00',
    setting: 'School'
  });
  const st = await r('POST', `/api/appointments/${apptRes.j.id}/start`);
  const sid = st.j.id;
  const sView = (await r('GET', '/api/sessions/' + sid)).j;
  const goal = sView.goals[0];

  // In-session ABC logging
  const sessAbc = await r('POST', `/api/sessions/${sid}/abc`, {
    antecedent: 'Peer proximity / space',
    behavior: 'Screaming',
    consequence: 'Offered quiet corner',
    perceived_function: 'Escape'
  });
  ok(sessAbc.s === 200, 'in-session ABC event logged');

  // Trial collection (including Model 'M' prompt level)
  for (const l of ['I', 'V', 'M', 'I', 'P']) await r('POST', `/api/sessions/${sid}/trials`, { goal_id: goal.id, level: l });
  const sv = (await r('GET', '/api/sessions/' + sid)).j;
  ok(sv.goals[0].summary.counts.M === 1, 'Model prompt trial recorded');
  ok(sv.goals[0].summary.pct.I === 40, 'summary % independent = 40');

  // End session
  ok((await r('POST', `/api/sessions/${sid}/end`, { minutes_override: 180 })).j.units === 12, '3h = 12 units');

  // Note generation with trials AND ABC incidents
  const noteRes = await r('POST', `/api/sessions/${sid}/note/generate`, {});
  const note = noteRes.j.note;
  ok(note.includes('12 units') && (note.includes('Behavior incidents recorded') || note.includes('Screaming')), 'note includes both units and ABC incident data');

  // Dual-signature workflow
  ok((await r('POST', `/api/sessions/${sid}/note/sign`)).s === 403, 'RBT cannot sign directly');
  const subRes = await r('POST', `/api/sessions/${sid}/note/submit`, { note });
  ok(subRes.s === 200 && subRes.j.status === 'pending_approval' && subRes.j.submitted_by.includes('RBT'), 'RBT submits note for BCBA review');
  
  const pendView = (await b('GET', '/api/sessions/' + sid)).j;
  ok(pendView.session.note_status === 'pending_approval' && pendView.session.submitted_by, 'session reflects pending_approval with author stamp');

  const signRes = await b('POST', `/api/sessions/${sid}/note/sign`);
  ok(signRes.s === 200 && signRes.j.status === 'signed' && signRes.j.signed_by.includes('BCBA'), 'BCBA co-signs and finalizes note');

  // 7. Supervision tracking
  const supGet = await b('GET', '/api/supervision');
  ok(supGet.s === 200 && typeof supGet.j.supPct === 'number', 'supervision metrics retrieved');
  const supPost = await b('POST', '/api/supervision', {
    client_id: 1,
    rbt_id: 2,
    minutes: 45,
    type: 'Direct Observation',
    notes: 'Observed DTT table trials and ABC data collection.'
  });
  ok(supPost.s === 200, 'BCBA logs supervision meeting');

  // 8. Error response sanitization check
  const badReq = await b('GET', '/api/sessions/999999');
  ok(badReq.s === 404 && !badReq.j.stack, 'error responses do not leak internal stack traces');

  // 9. MemoryDB In-Memory Parity Verification
  const { MemoryDB } = require('./lib/db');
  const mem = new MemoryDB();
  mem.tables.users.push({ id: 1, name: 'Dana BCBA', role: 'BCBA' }, { id: 2, name: 'Sam RBT', role: 'RBT' });
  mem.tables.clients.push({ id: 1, name: 'Eleanor' });
  mem.prepare('INSERT INTO sessions(appointment_id, client_id, user_id, start, end, units, note, note_status) VALUES(?,?,?,?,?,?,?,?)')
    .run(1, 1, 2, '2026-10-12T10:00:00Z', '2026-10-12T12:00:00Z', 8, 'Trial note', 'draft');
  const memSess = mem.prepare('SELECT * FROM sessions WHERE id=?').get(1);
  ok(memSess && memSess.units === 8, 'MemoryDB stores and retrieves session');
  mem.prepare('UPDATE sessions SET note=?, note_status=\'pending_approval\', submitted_by=?, rbt_signed_at=? WHERE id=?')
    .run('Updated note', 'Sam RBT', '2026-10-12T12:05:00Z', 1);
  const memUpdated = mem.prepare('SELECT * FROM sessions WHERE id=?').get(1);
  ok(memUpdated.note_status === 'pending_approval' && memUpdated.submitted_by === 'Sam RBT', 'MemoryDB handles multi-param UPDATE with literals');

  // 10. CentralReach Enhancement: Clinical Mastery & Plateau Intelligence
  const clientData = (await b('GET', '/api/clients/1')).j;
  const g1 = clientData.goals[0];
  ok(g1 && typeof g1.mastery_met === 'boolean' && typeof g1.stalled === 'boolean', 'goal includes mastery_met and stalled flags');
  ok(Array.isArray(g1.series) && g1.series[0].prompts, 'goal series includes prompt fading hierarchy breakdown');

  // Test 1-tap transition to mastered by BCBA
  const masterRes = await b('POST', `/api/goals/${g1.id}/status`, { status: 'mastered' });
  ok(masterRes.s === 200 && masterRes.j.status === 'mastered', 'BCBA can advance goal to mastered');
  const rbtBlock = await r('POST', `/api/goals/${g1.id}/status`, { status: 'active' });
  ok(rbtBlock.s === 403, 'RBT blocked from changing goal clinical status');

  const reCheck = (await b('GET', '/api/clients/1')).j;
  const g1Updated = reCheck.goals.find(g => g.id === g1.id);
  ok(g1Updated.status === 'mastered' && g1Updated.recommendation.includes('Mastered'), 'goal reflects mastered status and maintenance recommendation');

  // 11. CentralReach Enhancement: Temporal Scatterplot & Hourly Heatmap
  ok(clientData.abcSummary.scatterplot && Array.isArray(clientData.abcSummary.scatterplot.hourly), 'client ABC includes hourly scatterplot array');
  ok(clientData.abcSummary.scatterplot.hourly.length === 10, 'scatterplot covers 8:00 AM to 5:00 PM operational window');

  // 12. CentralReach Enhancement: 6-Month Re-Authorization Progress Report (CPT 97151/97155)
  const reauthRbt = await r('GET', '/api/clients/1/reauth-report');
  ok(reauthRbt.s === 403, 'RBT blocked from generating re-authorization clinical report');
  const reauthParent = await p('GET', '/api/clients/1/reauth-report');
  ok(reauthParent.s === 403, 'Parent blocked from generating re-authorization clinical report');

  const reauthBcba = await b('GET', '/api/clients/1/reauth-report');
  ok(reauthBcba.s === 200, 'BCBA can generate re-authorization progress report');
  const rep = reauthBcba.j;
  ok(rep.title.includes('Treatment Plan & Progress Report') && rep.client_name === 'Eleanor', 'report contains client metadata');
  ok(rep.sections.length === 5, 'report structured into 5 BACB/insurance clinical sections');
  ok(rep.text.includes('MEDICAL NECESSITY') && rep.text.includes('CPT 97153'), 'report includes medical necessity justification and CPT service recommendations');

  // 13. CentralReach Enhancement: Natural Environment Teaching (NET) Multi-Target Session Logging
  // Reactivate goal 1 so both goal 1 and goal 2 are active for NET training
  await b('POST', '/api/goals/1/status', { status: 'active' });
  const appt2 = (await b('POST', '/api/appointments', {
    client_id: 1, user_id: 2, start: '2026-10-14T09:00:00', end: '2026-10-14T11:00:00', setting: 'Clinic'
  })).j;
  const sess2 = (await r('POST', `/api/appointments/${appt2.id}/start`)).j;
  // Log trials across Goal 1 and Goal 2 in rapid succession
  await r('POST', `/api/sessions/${sess2.id}/trials`, { goal_id: 1, level: 'I' });
  await r('POST', `/api/sessions/${sess2.id}/trials`, { goal_id: 2, level: 'V' });
  await r('POST', `/api/sessions/${sess2.id}/trials`, { goal_id: 1, level: 'G' });
  const sess2View = (await r('GET', `/api/sessions/${sess2.id}`)).j;
  const s2g1 = sess2View.goals.find(g => g.id === 1);
  const s2g2 = sess2View.goals.find(g => g.id === 2);
  ok(s2g1 && s2g1.summary && s2g1.summary.total === 2, 'NET multi-target trials recorded for Goal 1');
  ok(s2g2 && s2g2.summary && s2g2.summary.total === 1, 'NET multi-target trials recorded for Goal 2');

  // 14. Founder Presentation & Demo State Verification
  ok(c360.plans.some(pl => pl.status === 'approved'), 'Demo seed includes pre-approved BIP for immediate Client 360 & in-session drawer showcase');
  ok(c360.stories.some(st => st.status === 'shared') && c360.stories.some(st => st.status === 'draft'), 'Demo seed includes both shared and draft Social Stories');
  ok(c360.goals[0].mastery_met === true && c360.goals[1].stalled === true, 'Demo seed showcases both Mastery Criteria Met and Target Stalled intelligence');

  // 15. Goal Clinical Data Review, Modification & In-Session Goal Creation
  const gDetail = (await r('GET', '/api/goals/1')).j;
  ok(gDetail.id === 1 && gDetail.total_trials > 0 && typeof gDetail.prompt_totals.I === 'number', 'GET /api/goals/:id returns detailed trial & prompt breakdown');
  const gEdit = (await b('PUT', '/api/goals/2', { title: 'Waiting for a turn (with visual timer)', baseline: 25, target: 85, status: 'active' })).j;
  ok(gEdit.title.includes('visual timer') && gEdit.baseline === 25 && gEdit.target === 85, 'PUT /api/goals/:id updates goal title, baseline, and target');
  const gCreated = (await r('POST', '/api/clients/1/goals', { title: '2-Step Motor Imitation', baseline: 20, target: 80 })).j;
  ok(gCreated.id && gCreated.goal && gCreated.goal.title === '2-Step Motor Imitation', 'Clinician can create new skill goal from DTT/session view');

  // 16. FBA Multi-Chart Analytics & Behavior Reduction Progress Report
  ok(Array.isArray(clientData.abcSummary.dailySeries) && clientData.abcSummary.dailySeries.length >= 5, 'ABC summary includes multi-day longitudinal dailySeries');
  ok(clientData.abcSummary.reductionMetrics && clientData.abcSummary.reductionMetrics.pctChange < 0, 'ABC summary computes Baseline vs Post-BIP behavior reduction rate');
  ok(clientData.abcSummary.dominantFunction && clientData.abcSummary.dominantFunction.name === 'Escape', 'ABC summary identifies Escape as primary hypothesized function');
  ok(Array.isArray(clientData.abcSummary.antecedentMatrix) && clientData.abcSummary.antecedentMatrix.length >= 3, 'ABC summary computes antecedent conditional probability matrix');
  ok(Array.isArray(clientData.abcSummary.consequenceMatrix) && clientData.abcSummary.consequenceMatrix.length >= 2, 'ABC summary computes consequence & FCT effectiveness matrix');

  const fbaParentBlock = await p('GET', '/api/clients/1/fba-report');
  ok(fbaParentBlock.s === 403, 'Parent blocked from raw FBA clinical progress report');
  const fbaRes = await b('GET', '/api/clients/1/fba-report');
  ok(fbaRes.s === 200 && fbaRes.j.sections && fbaRes.j.sections.length === 5, 'BCBA/RBT can generate 5-section FBA & Behavior Reduction Progress Report');
  ok(fbaRes.j.text.includes('FUNCTIONAL BEHAVIOR ASSESSMENT') && fbaRes.j.primaryFunction === 'Escape', 'FBA report includes functional hypothesis and baseline vs intervention trajectory');

  // 17. Build Spec & Durriya Anwar Checklist Verification (10 Prompt Levels, NA Exclusion, 9 Behavior Methods, Task Analysis, Fidelity/IOA, CSV & Audit Trail)
  const { summarize, summarizeBehaviorEvents, calculateIoa, calculateFidelity } = require('./lib/generators');
  const sampleTrials = [
    { level: 'I' }, { level: 'I' }, { level: 'Vi' }, { level: 'PP' }, { level: 'INC' }, { level: 'NA' }
  ];
  const sumIndep = summarize(sampleTrials, 'independent_only');
  ok(sumIndep.rawTotal === 6 && sumIndep.opportunities === 5 && sumIndep.naCount === 1, 'NA trials excluded from opportunity denominator (5 opps from 6 raw)');
  ok(sumIndep.pct.I === 40 && sumIndep.indepNumDenom === '2/5' && sumIndep.promptedNumDenom === '2/5', 'summarize computes explicit numerator/denominator and separates independent vs prompted');
  const sumIncl = summarize(sampleTrials, 'include_prompted');
  ok(sumIncl.correctPct === 80 && sumIncl.correctNumDenom === '4/5', 'scoring_rule include_prompted combines independent + prompted when explicitly configured');

  // Test 5 goal clinical statuses (on_hold, revised, discontinued)
  const holdRes = await b('PUT', `/api/goals/${gCreated.id}`, { status: 'on_hold', domain: 'Motor Imitation', prompt_strategy: 'Most-to-Least (MTL)' });
  ok(holdRes.s === 200 && holdRes.j.status === 'on_hold' && holdRes.j.domain === 'Motor Imitation', 'Goal supports 5 clinical statuses (on_hold) and domain/prompt_strategy');

  // Test Target Behavior Definition & 9-Method Behavior Events
  const bpRes = await b('POST', '/api/clients/1/behaviors', {
    name: 'Elopement from Table',
    operational_definition: 'Leaving designated seating area > 3 feet without permission.',
    non_examples: 'Walking to bathroom after requesting break.',
    measurement_type: 'duration',
    function_hypothesis: 'Escape',
    baseline_rate: 2.0,
    target_rate: 0.2
  });
  ok(bpRes.s === 200 && bpRes.j.id, 'Clinician can define individualized target behavior program');

  const be1 = await r('POST', `/api/sessions/${sess2.id}/behavior-events`, {
    behavior_program_id: bpRes.j.id,
    behavior: 'Elopement from Table',
    measurement_type: 'duration',
    value: 1,
    duration_sec: 40
  });
  const be2 = await r('POST', `/api/sessions/${sess2.id}/behavior-events`, {
    behavior_program_id: bpRes.j.id,
    behavior: 'Elopement from Table',
    measurement_type: 'partial_interval',
    value: 1,
    interval_occurred: 1,
    interval_total: 1
  });
  ok(be1.s === 200 && be2.s === 200, 'RBT can log continuous duration and discontinuous partial-interval behavior events in session');
  const sessAfterTally = await r('GET', `/api/sessions/${sess2.id}`);
  ok(
    sessAfterTally.j.behaviorSummary &&
    sessAfterTally.j.behaviorSummary.byBehavior &&
    sessAfterTally.j.behaviorSummary.byBehavior['Elopement from Table'] &&
    sessAfterTally.j.behaviorSummary.byBehavior['Elopement from Table'].frequency === 2 &&
    sessAfterTally.j.behaviorSummary.byBehavior[`id_${bpRes.j.id}`].frequency === 2,
    'Behavior tally and interval buttons increment per-behavior Count and Rate in session summary'
  );

  const undoBe = await r('DELETE', `/api/sessions/${sess2.id}/behavior-events/last`);
  ok(undoBe.s === 200 && undoBe.j.ok === true, 'RBT can undo last behavior event in session with audit logging');

  // Test Task Analysis & Chaining
  const taCreate = await b('POST', '/api/clients/1/task-analysis', {
    title: '3-Step Coat Putting On',
    chaining_type: 'Backward Chaining',
    steps: ['Put left arm in sleeve', 'Put right arm in sleeve', 'Zip coat up']
  });
  ok(taCreate.s === 200 && taCreate.j.id, 'Clinician can create Task Analysis chaining program');
  const taLog = await r('POST', `/api/task-analysis/${taCreate.j.id}/log`, {
    results: [{ step: 'Step 1', status: 'I' }, { step: 'Step 2', status: 'I' }, { step: 'Step 3', status: 'PP' }]
  });
  ok(taLog.s === 200 && taLog.j.entry.indepPct === 67 && taLog.j.entry.numDenom === '2/3', 'Task Analysis logs step-by-step prompt codes and computes explicit numerator/denominator');

  // Test Fidelity & IOA Calculator
  const fidRes = await b('POST', '/api/supervision/fidelity-ioa', {
    client_id: 1,
    rbt_id: 2,
    ioa_method: 'trial_by_trial',
    observer1_value: 9,
    observer2_value: 10,
    checklist: [{ step: 'SD clear', completed: true }, { step: 'Prompt hierarchy followed', completed: true }],
    notes: 'High IOA & procedural fidelity'
  });
  ok(fidRes.s === 200 && fidRes.j.fidelity_pct === 100 && fidRes.j.ioa_pct === 90, 'Supervision calculates 100% Treatment Integrity Fidelity and 90% Trial-by-Trial IOA');

  // Test CSV Export & Audit Logs
  const csvParentBlock = await fetch(base + '/api/clients/1/export-csv?type=trials');
  ok(csvParentBlock.status === 401, 'Unauthenticated request blocked from CSV export');
  const auditRes = await b('GET', '/api/clients/1/audit-logs');
  ok(auditRes.s === 200 && Array.isArray(auditRes.j) && auditRes.j.some(a => a.action === 'UNDO_BEHAVIOR_EVENT'), 'Immutable Audit Trail records undo and clinical data actions');

  // Test Multi-Persona Role-Tailored KPI Dashboards (Owner, BCBA, RBT, Admin)
  const o = await login('owner@eba.test');
  const a = await login('admin@eba.test');

  // 1. Owner KPI Telemetry
  const oDash = (await o('GET', '/api/dashboard')).j;
  ok(typeof oDash.owner === 'object' && typeof oDash.owner.totalRevenueMtd === 'number', 'Owner KPI computes gross billed revenue MTD');
  ok(oDash.owner.cptRevenueBreakdown && oDash.owner.cptRevenueBreakdown.cpt97153.hrRate === 65 && oDash.owner.cptRevenueBreakdown.cpt97155.hrRate === 125, 'Owner KPI includes CPT fee schedule breakdown (97153 & 97155)');
  ok(Array.isArray(oDash.owner.staffProductivity) && oDash.owner.staffProductivity.some(s => s.role === 'RBT'), 'Owner KPI computes clinician staff billable productivity & utilization');
  ok(oDash.owner.staffProductivity.every(s => Array.isArray(s.clients) && s.clients.length >= 1 && typeof s.clientNames === 'string'), 'Owner KPI clinician productivity includes assigned clients and per-client hours');
  ok(oDash.owner.caseloadCapacity && oDash.owner.caseloadCapacity.activeClients >= 2, 'Owner KPI tracks active caseload capacity & target utilization');

  // 2. BCBA KPI Telemetry, Assigned Sessions Today & Direct Client Profiles
  const bDash = (await b('GET', '/api/dashboard')).j;
  ok(bDash.bcbaKpi && Array.isArray(bDash.bcbaKpi.todaySessions) && bDash.bcbaKpi.todaySessions.length >= 1, 'BCBA KPI includes assigned sessions today roster');
  ok(bDash.bcbaKpi && Array.isArray(bDash.bcbaKpi.clientProfiles) && bDash.bcbaKpi.clientProfiles.length >= 2 && bDash.bcbaKpi.clientProfiles.every(cp => cp.id && cp.name && cp.communication && Array.isArray(cp.topGoals)), 'BCBA KPI includes ready-to-view client profiles with vitals and active goals');
  ok(bDash.bcbaKpi && bDash.bcbaKpi.clientProgress && typeof bDash.bcbaKpi.clientProgress.activeProgramsCount === 'number', 'BCBA KPI tracks active skill programs count and mastery velocity');
  ok(Array.isArray(bDash.bcbaKpi.clientProgress.criteriaMetAlerts) && Array.isArray(bDash.bcbaKpi.clientProgress.stalledAlerts), 'BCBA KPI generates criteria-met and stalled clinical action alerts');
  ok(bDash.bcbaKpi.behaviorPatterns && typeof bDash.bcbaKpi.behaviorPatterns.functionDistribution === 'object' && 'Escape' in bDash.bcbaKpi.behaviorPatterns.functionDistribution, 'BCBA KPI computes caseload 4-function distribution matrix');
  ok(bDash.bcbaKpi.behaviorPatterns.peakDisruptionWindow && bDash.bcbaKpi.behaviorPatterns.peakDisruptionWindow.label, 'BCBA KPI computes peak behavioral disruption window and primary antecedent');

  // 3. RBT KPI Telemetry
  const rDash = (await r('GET', '/api/dashboard')).j;
  ok(rDash.rbtKpi && Array.isArray(rDash.rbtKpi.todayTasks), 'RBT KPI renders assigned shift appointment roster');
  ok(rDash.rbtKpi.dataRequirements && rDash.rbtKpi.dataRequirements.requiredTrialsPerSession === 25, 'RBT KPI tracks daily trial quota and active target requirements');
  ok(rDash.rbtKpi.trainingAndSupervision && typeof rDash.rbtKpi.trainingAndSupervision.personalSupPct === 'number', 'RBT KPI tracks personal monthly BACB 5% supervision progress');

  // 4. Administrator KPI Telemetry & Client Billing Snapshots
  const aDash = (await a('GET', '/api/dashboard')).j;
  ok(aDash.adminKpi && aDash.adminKpi.documentationDelinquency && typeof aDash.adminKpi.documentationDelinquency.missingNotesCount === 'number', 'Admin KPI tracks missing & delinquent notes with elapsed hours');
  ok(aDash.adminKpi.billingAndClaims && typeof aDash.adminKpi.billingAndClaims.claimsReadyRevenue === 'number' && typeof aDash.adminKpi.billingAndClaims.claimsReadyUnits === 'number', 'Admin KPI tracks claims ready for 837P clearinghouse release');
  ok(Array.isArray(aDash.adminKpi.billingAndClaims.authorizationsAtRisk), 'Admin KPI tracks payer authorizations at risk (>= 80% burned)');
  ok(aDash.adminKpi.sessionDiscrepancies && Array.isArray(aDash.adminKpi.sessionDiscrepancies.unstartedList), 'Admin KPI tracks EVV session scheduling discrepancies');
  ok(Array.isArray(aDash.adminKpi.clientBillingSnapshots) && aDash.adminKpi.clientBillingSnapshots.length >= 2, 'Admin KPI includes administrative client billing & reimbursement snapshots');
  ok(aDash.adminKpi.clientBillingSnapshots.every(cs => cs.payerName && cs.totalBilled > 0 && cs.totalReimbursed > 0 && Array.isArray(cs.authorizations) && Array.isArray(cs.sessionClaims)), 'Each client billing snapshot includes payer info, billed/reimbursed amounts, CPT authorizations, and session claims ledger');
  const snapRes = await a('GET', '/api/clients/1/billing-snapshot');
  ok(snapRes.s === 200 && snapRes.j.clientId === 1 && snapRes.j.totalBilled > 0 && Array.isArray(snapRes.j.sessionClaims), 'GET /api/clients/:id/billing-snapshot returns client billing & reimbursement snapshot');
  const snapParentBlock = await p('GET', '/api/clients/1/billing-snapshot');
  ok(snapParentBlock.s === 403, 'Parent role blocked from administrative billing snapshot endpoint');

  // 5. B2B Marketing Website & Lead Engine (vs. MeasurePM)
  const webRes = await fetch(base + '/website.html');
  ok(webRes.status === 200 && (webRes.headers.get('content-type') || '').includes('text/html'), 'B2B marketing website (website.html) serves with 200 OK');
  const webHtml = await webRes.text();
  ok(webHtml.includes('MeasurePM') && webHtml.includes('CentralReach') && webHtml.includes('Kid Mode'), 'Marketing website includes MeasurePM and CentralReach competitive comparison matrix');

  const webAliasRes = await fetch(base + '/website');
  ok(webAliasRes.status === 200 && (await webAliasRes.text()).includes('Effective Behavioral'), '/website route alias serves marketing website cleanly');

  // Test Lead Capture API (Public unauthenticated submission)
  const leadSubmit = await fetch(base + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Rebecca Vance, BCBA',
      email: 'rebecca@summitaba.test',
      phone: '555-019-2834',
      clinic_name: 'Summit Behavioral Horizons',
      caseload_size: '16-40',
      current_software: 'MeasurePM',
      message: 'Looking to switch from MeasurePM due to tablet sync issues and progress report time.'
    })
  });
  const leadJson = await leadSubmit.json();
  ok(leadSubmit.status === 200 && leadJson.ok && leadJson.id, 'Unauthenticated clinic owner can submit demo request lead via POST /api/leads');

  // Test Lead Validation
  const leadInvalid = await fetch(base + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'not-an-email', clinic_name: '' })
  });
  ok(leadInvalid.status === 400, 'POST /api/leads enforces required field validation (name, email, clinic)');

  // Test Owner/Admin Lead Retrieval
  const ownerLeads = (await o('GET', '/api/leads')).j;
  ok(Array.isArray(ownerLeads) && ownerLeads.some(l => l.email === 'rebecca@summitaba.test'), 'Practice owner can retrieve inbound practice leads from CRM queue');

  // Test PATCH /api/leads/:id status update & internal note
  const submittedLeadId = leadJson.id;
  const updateRes = (await o('PATCH', `/api/leads/${submittedLeadId}`, {
    status: 'demo_scheduled',
    notes: 'Scheduled live 1-on-1 walkthrough with Dr. Rivera for Thursday.'
  })).j;
  ok(updateRes.status === 'demo_scheduled' && updateRes.notes.includes('walkthrough with Dr. Rivera'), 'Practice owner can update lead status and internal CRM notes');

  // Test RBAC barrier: RBT and Parent blocked from accessing CRM leads
  const rbtLeadsRes = await r('GET', '/api/leads');
  ok(rbtLeadsRes.s === 403, 'RBT is blocked from CRM practice leads queue');
  const parentLeadsRes = await p('GET', '/api/leads');
  ok(parentLeadsRes.s === 403, 'Parent is blocked from CRM practice leads queue');

  // Test Inbound Pipeline telemetry on Owner Dashboard
  const oDashUpdated = (await o('GET', '/api/dashboard')).j;
  ok(oDashUpdated.owner.inboundPipeline &&
     oDashUpdated.owner.inboundPipeline.totalLeads >= 3 &&
     oDashUpdated.owner.inboundPipeline.measurePmProspectsCount >= 2 &&
     oDashUpdated.owner.inboundPipeline.demoScheduledCount >= 2,
     'Owner KPI dashboard integrates inbound CRM pipeline telemetry and MeasurePM switch tracking');

  // 8. Physical Clinic & Sensory Gym Financial Model + Client Therapy Signup Pipeline
  const { calculateFacilityModel, DEFAULT_FACILITY_MODELS } = require('./lib/generators');
  const baseSim = calculateFacilityModel(DEFAULT_FACILITY_MODELS[0].config);
  ok(baseSim.space.totalSqFt === 6000 && baseSim.space.gymSqFt === 2100 && baseSim.space.dttSqFt === 1800 && baseSim.space.maxClinicClientCapacity === 28,
     'Facility pro-forma engine accurately calculates architectural space allocation & dual-cohort client capacity');
  ok(baseSim.capex.grossBuildoutCapEx > 400000 && baseSim.capex.landlordTiCredit === 180000 && baseSim.capex.monthlyDebtService > 2000,
     'Facility pro-forma engine computes gross CapEx, Landlord TI credit offset, and SBA 7(a) monthly debt service');
  ok(baseSim.unitEconomics.monthlyGrossRevPerClient > 7000 && baseSim.unitEconomics.contributionMarginPct > 35,
     'Facility pro-forma engine computes per-client ABA CPT (97153/97155/97156/97158) unit economics & contribution margin');
  ok(baseSim.months.length === 36 && baseSim.years.length === 3 && baseSim.kpis.breakEvenClientsCashFlow > 0 && baseSim.kpis.paybackMonth !== null,
     'Facility pro-forma engine generates 36-month cash flow schedule, 3-year P&L rollups, break-even census, and CapEx payback month');

  // Test GET /api/facility-model
  const facGet = (await o('GET', '/api/facility-model')).j;
  ok(Array.isArray(facGet.models) && facGet.models.length >= 3 && facGet.models[0].proForma && facGet.models[0].proForma.kpis,
     'GET /api/facility-model returns 3 seeded clinic & sensory gym scenarios with server-computed 36-month projections');
  ok(Array.isArray(facGet.signups) && facGet.signups.length >= 12 && facGet.signupSummary.committedMonth1Count === 8 && facGet.signupSummary.projectedMonthlyGrossFromSignups > 80000,
     'GET /api/facility-model returns 12 client therapy signups with committed Month-1 cohort & monthly revenue telemetry');

  // Test PUT /api/facility-model/:id to update scenario parameters
  const firstModelId = facGet.models[0].id;
  const updatedConfig = Object.assign({}, facGet.models[0].config, { totalSqFt: 6500, gymSqFtPct: 32 });
  const facPut = await o('PUT', `/api/facility-model/${firstModelId}`, {
    name: 'Base Case: 6,500 sq ft Expanded Gym',
    config: updatedConfig
  });
  const updatedModelObj = (facPut.j.models || []).find((m) => m.id === firstModelId);
  ok(facPut.s === 200 && updatedModelObj && updatedModelObj.proForma.space.totalSqFt === 6500 && updatedModelObj.proForma.space.gymSqFt === 2080,
     'PUT /api/facility-model/:id updates scenario assumptions and recomputes pro-forma projection');

  // Test POST /api/facility-model to save a custom scenario
  const facPost = await o('POST', '/api/facility-model', {
    name: 'Custom Satellite Gym & Clinic',
    subtitle: '4,800 sq ft suburban expansion with 30% sensory gym',
    config: Object.assign({}, DEFAULT_FACILITY_MODELS[1].config, { totalSqFt: 4800, gymSqFtPct: 30 })
  });
  const createdModelObj = (facPost.j.models || []).find((m) => m.id === facPost.j.id);
  ok(facPost.s === 200 && facPost.j.id && createdModelObj && createdModelObj.proForma.space.totalSqFt === 4800,
     'POST /api/facility-model saves new custom facility financial scenario');

  // Test POST /api/facility-signups to enroll a new client into the physical clinic + gym cohort
  const newSignupRes = await o('POST', '/api/facility-signups', {
    child_name: 'Zoe V. (Synthetic)',
    age: 5,
    diagnosis: 'ASD (F84.0)',
    tier: 'Focused',
    weekly_hours: 25,
    payer: 'Sample Commercial PPO',
    cohort: 'Morning Cohort (8:30 AM–12:30 PM)',
    gym_track: 'Vestibular Swing & Motor Planning Circuit',
    enrollment_status: 'committed',
    target_month: 1
  });
  ok(newSignupRes.s === 200 && newSignupRes.j.id && newSignupRes.j.signupSummary.committedMonth1Count === 9,
     'POST /api/facility-signups enrolls new client into therapy cohort and updates Month-1 committed census');

  // Test PATCH /api/facility-signups/:id to promote waitlist client to committed Month-1
  const waitlistSignup = facGet.signups.find((s) => s.enrollment_status !== 'committed' || s.target_month > 1);
  const patchSignupRes = await o('PATCH', `/api/facility-signups/${waitlistSignup.id}`, {
    enrollment_status: 'committed',
    target_month: 1
  });
  ok(patchSignupRes.s === 200 && patchSignupRes.j.signupSummary.committedMonth1Count === 10,
     'PATCH /api/facility-signups/:id promotes waitlisted client to committed Month-1 launch cohort');

  // Test RBAC barriers on Facility Model endpoints
  const parentFacRes = await p('GET', '/api/facility-model');
  ok(parentFacRes.s === 403, 'Parent role is blocked from accessing internal clinic & gym financial model');
  const rbtFacPostRes = await r('POST', '/api/facility-model', { name: 'Unauthorized', config: {} });
  ok(rbtFacPostRes.s === 403, 'RBT role is blocked from modifying clinic & gym financial scenarios');

  // 9. Commercial Software Licensing, Legal Agreements (MSA/BAA/EULA), Hybrid Caps & Hard Lockout
  const { LICENSE_TIERS, calculateLicenseQuote, generateLicenseAgreements } = require('./lib/generators');
  const quoteGrowth = calculateLicenseQuote({ tier: 'growth', billingCycle: 'monthly', activeClients: 45, activeSeats: 22 });
  ok(LICENSE_TIERS.starter && LICENSE_TIERS.growth && LICENSE_TIERS.enterprise &&
     quoteGrowth.baseFee === 599 && quoteGrowth.extraClients === 5 && quoteGrowth.extraSeats === 2 &&
     quoteGrowth.netMonthlyTotal === quoteGrowth.grossMonthlyTotal && quoteGrowth.grossMonthlyTotal > 599,
     'Hybrid license quote engine accurately calculates base clinic platform fee + per-client & per-seat overage caps');

  const quoteAnnual = calculateLicenseQuote({ tier: 'starter', billingCycle: 'annual', activeClients: 15, activeSeats: 8 });
  ok(quoteAnnual.discountPct === 15 && quoteAnnual.netMonthlyTotal < quoteAnnual.grossMonthlyTotal,
     'Hybrid license quote engine applies 15% annual billing discount');

  const legalDocs = generateLicenseAgreements({
    clinicName: 'Summit Pediatric Therapy',
    contactName: 'Dr. Rebecca Lin, BCBA-D',
    contactEmail: 'rebecca@summitaba.test',
    tier: 'growth',
    billingCycle: 'annual',
    maxClients: 40,
    maxSeats: 20,
    licenseKey: 'EBA-LIC-GROWTH-40C20S-20271231-ABCDEF123456',
    issuedAt: '2026-04-01',
    expiresAt: '2027-04-01',
    msaSignedBy: 'Dr. Rebecca Lin, BCBA-D',
    baaSignedBy: 'Dr. Rebecca Lin, BCBA-D',
    eulaAcceptedBy: 'Dr. Rebecca Lin, BCBA-D'
  });
  ok(legalDocs.msa.content.includes('MASTER SUBSCRIPTION AGREEMENT') &&
     legalDocs.baa.content.includes('164.504(e)') &&
     legalDocs.eula.content.includes('Mandatory BCBA Review & Sign-Off'),
     'Legal generator produces customized B2B SaaS MSA, HIPAA BAA, and Clinical EULA & AI Guardrails');

  // Test public GET /api/licensing/status & authenticated GET /api/licensing
  const pubLicStatus = await (await fetch(`http://127.0.0.1:${port}/api/licensing/status`)).json();
  ok(pubLicStatus.status === 'active' && !pubLicStatus.isLockedOut && pubLicStatus.tier === 'growth',
     'Public GET /api/licensing/status reports active flagship license telemetry');

  const licGet = (await o('GET', '/api/licensing')).j;
  ok(Array.isArray(licGet.clinicLicenses) && licGet.clinicLicenses.length >= 3 &&
     licGet.primaryLicense && licGet.primaryLicense.signatureValid === true &&
     licGet.primaryLicense.activeClients >= 2 && licGet.primaryLicense.activeSeats >= 4,
     'GET /api/licensing returns seeded B2B clinic licenses with verified HMAC-SHA256 cryptographic keys and live usage caps');

  // Test RBAC barrier on /api/licensing
  const rbtLicRes = await r('GET', '/api/licensing');
  ok(rbtLicRes.s === 403, 'RBT is blocked from accessing B2B software licensing management console');
  const parentLicRes = await p('GET', '/api/licensing');
  ok(parentLicRes.s === 403, 'Parent is blocked from accessing B2B software licensing management console');

  // Test GET /api/licensing/:id/agreements
  const licAgreementsRes = (await o('GET', '/api/licensing/1/agreements')).j;
  ok(licAgreementsRes.msa && licAgreementsRes.msa.content && licAgreementsRes.baa.content && licAgreementsRes.eula.content,
     'GET /api/licensing/:id/agreements returns clinic-specific MSA, HIPAA BAA, and EULA contracts');

  // Test POST /api/licensing/issue to provision a new clinic license & POST /api/licensing/:id/sign-agreement
  const issuedLicRes = await o('POST', '/api/licensing/issue', {
    clinic_name: 'Summit Pediatric Therapy',
    contact_name: 'Dr. Rebecca Lin, BCBA-D',
    contact_email: 'rebecca@summitaba.test',
    tier: 'growth',
    billing_cycle: 'annual',
    max_clients: 45,
    max_seats: 22,
    lead_id: submittedLeadId
  });
  const newLicId = issuedLicRes.j.id;
  ok(issuedLicRes.s === 200 && newLicId && issuedLicRes.j.license_key.startsWith('EBA-LIC-GROWTH-45C22S-'),
     'POST /api/licensing/issue provisions new clinic license with cryptographic HMAC-SHA256 key');

  await o('POST', `/api/licensing/${newLicId}/sign-agreement`, { agreement_type: 'msa', signer_name: 'Dr. Rebecca Lin, BCBA-D' });
  await o('POST', `/api/licensing/${newLicId}/sign-agreement`, { agreement_type: 'baa', signer_name: 'Dr. Rebecca Lin, BCBA-D' });
  const finalSignRes = await o('POST', `/api/licensing/${newLicId}/sign-agreement`, { agreement_type: 'eula', signer_name: 'Dr. Rebecca Lin, BCBA-D' });
  const newlyActiveLic = (finalSignRes.j.clinicLicenses || []).find(l => l.id === newLicId);
  ok(finalSignRes.s === 200 && newlyActiveLic && newlyActiveLic.status === 'active' && newlyActiveLic.allAgreementsSigned === true,
     'Signing MSA, HIPAA BAA, and Clinical EULA automatically activates pending clinic license');

  // Test Hybrid Per-Client Cap Enforcement on POST /api/clients
  await o('PATCH', '/api/licensing/1', { max_clients: 2 });
  const capBlockedClient = await o('POST', '/api/clients', {
    name: 'OverCap Child (Synthetic)',
    dob: '2021-01-01',
    diagnosis: 'ASD (Synthetic)'
  });
  ok(capBlockedClient.s === 403 && capBlockedClient.j.error.includes('Client Cap Reached'),
     'Hybrid licensing enforces Per-Client Cap on POST /api/clients when active census reaches licensed limit');
  await o('PATCH', '/api/licensing/1', { max_clients: 40 });

  // Test Hybrid Per-Seat Cap Enforcement on POST /api/staff
  await o('PATCH', '/api/licensing/1', { max_seats: 3 });
  const capBlockedStaff = await o('POST', '/api/staff', {
    name: 'OverCap Clinician',
    email: 'overcap@eba.test',
    role: 'RBT'
  });
  ok(capBlockedStaff.s === 403 && capBlockedStaff.j.error.includes('Clinician Seat Cap Reached'),
     'Hybrid licensing enforces Per-Seat Cap on POST /api/staff when active clinician seats reach licensed limit');
  await o('PATCH', '/api/licensing/1', { max_seats: 20 });

  // Test Hard Lockout Enforcement when primary license expires
  await o('PATCH', '/api/licensing/1', { status: 'expired', expires_at: '2025-01-01' });

  const bcbaLockedLogin = await fetch(`http://127.0.0.1:${port}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bcba@eba.test', password: 'password' })
  });
  const bcbaLockedJson = await bcbaLockedLogin.json();
  ok(bcbaLockedLogin.status === 403 && bcbaLockedJson.error.includes('Hard Lockout'),
     'Hard Lockout blocks non-Owner (BCBA/RBT/Admin/Parent) logins with HTTP 403 when clinic license is expired');

  const bcbaLockedApi = await b('GET', '/api/dashboard');
  ok(bcbaLockedApi.s === 403 && bcbaLockedApi.j.error.includes('Hard Lockout'),
     'Hard Lockout blocks existing non-Owner sessions from accessing clinical API endpoints while license is expired');

  const ownerEmergencyLogin = await fetch(`http://127.0.0.1:${port}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@eba.test', password: 'password' })
  });
  ok(ownerEmergencyLogin.status === 200,
     'Practice Owner retains emergency login access during Hard Lockout to renew or activate license key');

  // Test Owner License Key Renewal to lift Hard Lockout
  const renewRes = await o('POST', '/api/licensing/1/activate-key', { renew: true });
  ok(renewRes.s === 200 && renewRes.j.primaryLicense.status === 'active' && !renewRes.j.primaryLicense.isLockedOut,
     'POST /api/licensing/1/activate-key renews cryptographic license key and immediately lifts Hard Lockout');

  const bcbaRestoredApi = await b('GET', '/api/dashboard');
  ok(bcbaRestoredApi.s === 200,
     'Clinician API access is immediately restored after Practice Owner renews clinic license');

  // Verify website.html includes commercial pricing tiers & legal BAA/MSA copy
  const webLicHtml = await (await fetch(`http://127.0.0.1:${port}/website.html`)).text();
  ok(webLicHtml.includes('id="pricing"') && webLicHtml.includes('Starter Clinic') && webLicHtml.includes('HIPAA Business Associate Agreement'),
     'Public marketing website displays Hybrid B2B Pricing Tiers and MSA/BAA/EULA licensing safeguards');

  server.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED (Consolidated Clinical Record, Build Spec & Durriya Anwar Checklist Verified)');
  process.exit(fails ? 1 : 0);
})();

