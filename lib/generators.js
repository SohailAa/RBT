// Template-based generators. All output is a DRAFT until a BCBA approves it.
// To plug in an LLM later, replace these functions behind the same signatures.

const LEVELS = {
  I: 'Independent',
  V: 'Verbal prompt',
  G: 'Gestural prompt',
  Vi: 'Visual prompt',
  M: 'Model prompt',
  PP: 'Partial physical prompt',
  P: 'Full physical prompt',
  INC: 'Incorrect response',
  N: 'No response / Did not comply',
  NA: 'Not presented / N/A'
};

const MEASUREMENT_METHODS = {
  frequency: 'Frequency / Event Tally',
  rate: 'Rate per Hour / Minute',
  duration: 'Duration Recording',
  latency: 'Latency Recording',
  irt: 'Inter-Response Time (IRT)',
  partial_interval: 'Partial-Interval Recording',
  whole_interval: 'Whole-Interval Recording',
  mts: 'Momentary Time Sampling (MTS)',
  abc: 'ABC Continuous Recording'
};

const GOAL_DOMAINS = [
  'DTT / Skill Acquisition',
  'Natural Environment Teaching (NET)',
  'Communication & Language (Mand / Tact / Intraverbal / AAC / PECS)',
  'Social & Play Skills',
  'Adaptive & Daily Living Skills',
  'Emotional Regulation & Coping',
  'Task Analysis & Chaining',
  'Functional Academics'
];

const PROMPT_STRATEGIES = [
  'Least-to-Most',
  'Most-to-Least',
  'Time Delay',
  'Graduated Guidance',
  'Errorless Learning'
];

const GOAL_STATUSES = ['active', 'on_hold', 'mastered', 'discontinued', 'revised'];

const BEHAVIOR_FUNCTIONS = ['Escape', 'Attention', 'Tangible', 'Sensory'];
const COMMUNICATION_MODALITIES = ['Vocal', 'PECS', 'AAC Device', 'Sign Language', 'Gestural'];

function generateStory({ child, situation, challenge, goal, interest, visuals }) {
  const c = child || 'I';
  const sit = situation || 'this activity';
  const int = interest ? ` ${interest} is something I like.` : '';
  const s = [];
  s.push({ type: 'descriptive', icon: '📖', text: `Sometimes I go to ${sit}.${int}` });
  s.push({ type: 'descriptive', icon: '👀', text: `At ${sit}, there are other people there too. We share the same space.` });
  if (challenge) {
    s.push({ type: 'descriptive', icon: '💭', text: `Sometimes ${challenge.charAt(0).toLowerCase() + challenge.slice(1).replace(/\.$/, '')}. This can make my body feel upset or worried.` });
    s.push({ type: 'perspective', icon: '🙂', text: `That is okay. Many kids feel this way. The people around me are not trying to upset me.` });
  }
  s.push({ type: 'perspective', icon: '🧑‍🏫', text: `My teacher and my family feel happy when I try my best.` });
  s.push({ type: 'directive', icon: '🌬️', text: `When I feel upset, I can take a deep breath and use my calm body.` });
  s.push({ type: 'directive', icon: '💬', text: `I can say, "Can I have a break?" or "I need help."` });
  if (goal) s.push({ type: 'directive', icon: '⭐', text: `I will try to: ${goal.charAt(0).toLowerCase() + goal.slice(1).replace(/\.$/, '')}.` });
  s.push({ type: 'directive', icon: '🏅', text: `When I try, I can earn a reward and my grown-ups will be proud of me.` });
  s.push({ type: 'closing', icon: '😊', text: `I can do hard things, ${c}!` });
  return { title: `${sit.replace(/^\w/, (m) => m.toUpperCase())} Story`, visuals: visuals || 'Cartoon', sentences: s };
}

const ANTECEDENT_LIB = {
  Transition: {
    prevention: ['Visual schedule', 'First/Then board', 'Timer / countdown warning'],
    staff: ['Give a 2-minute warning', 'Use short, calm language', 'Show the next activity visually'],
  },
  'Removal of preferred item': {
    prevention: ['Warning before item is removed', 'First/Then (then = preferred item)', 'Offer a choice of replacement'],
    staff: ['Acknowledge feelings briefly', 'Do not argue or negotiate', 'Prompt replacement communication'],
  },
  'Difficult task': {
    prevention: ['Break task into smaller steps', 'Offer a choice of tasks', 'Embed high-probability requests'],
    staff: ['Prompt "help" or "break" request', 'Reinforce any appropriate request immediately', 'Reduce unnecessary language'],
  },
  'Denied access': {
    prevention: ['Visual wait cards', 'Timer for waiting', 'Reinforce waiting'],
    staff: ['Calm voice', 'Prompt "my turn?"', 'Reinforce waiting'],
  },
  'Peer proximity': {
    prevention: ['Social story', 'Teach sharing/turn language', 'Set clear space boundaries'],
    staff: ['Model language to peers', 'Prompt calm body', 'Reinforce tolerating peers nearby'],
  },
};

const REPLACEMENTS = {
  Screaming: '"Can I have more time?" / "I need a break"',
  Aggression: '"Stop, please" / break card',
  Elopement: '"I need a break" – walk to calm area with staff',
  'Task refusal': '"Help, please" / "All done" card',
  Crying: '"I feel sad" – request comfort item',
};

function generatePlan({ child, behavior, antecedents, reinforcers }) {
  const ants = antecedents && antecedents.length ? antecedents : ['Transition'];
  const prevention = new Set();
  const staff = new Set();
  ants.forEach((a) => {
    const lib = ANTECEDENT_LIB[a];
    if (lib) { lib.prevention.forEach((x) => prevention.add(x)); lib.staff.forEach((x) => staff.add(x)); }
  });
  staff.add('Reinforce appropriate communication');
  const reinf = reinforcers && reinforcers.length ? reinforcers : ['Verbal praise', 'Token', 'Preferred activity'];
  return {
    child,
    behavior,
    definition: `${behavior}: [BCBA to add operational definition for ${child || 'client'}]`,
    antecedents: ants,
    prevention: [...prevention],
    replacement: REPLACEMENTS[behavior] || '[BCBA to specify replacement behavior]',
    reinforcement: reinf,
    staff: [...staff],
  };
}

// 15-minute unit calculation using the "8-minute rule" per unit
function calcUnits(minutes) {
  const full = Math.floor(minutes / 15);
  return full + (minutes % 15 >= 8 ? 1 : 0);
}

// BACB supervision rule: BCBA supervision (97155) must be >= 5% of direct RBT therapy (97153)
function calcSupervisionPct(rbtMinutes, bcbaMinutes) {
  const rbt = Number(rbtMinutes) || 0;
  const bcba = Number(bcbaMinutes) || 0;
  if (rbt <= 0) return { pct: 100, compliant: true, rbtMinutes: 0, bcbaMinutes };
  const pct = Math.round((bcba / rbt) * 1000) / 10;
  return { pct, compliant: pct >= 5.0, rbtMinutes: rbt, bcbaMinutes: bcba };
}

// Core Data-Quality Rule (Durriya Anwar, MS, BCBA Checklist):
// 1. Exclude Not Presented ('NA') from denominator of opportunities presented.
// 2. Never combine independent and prompted responses into one success category unless scoringRule === 'include_prompted'.
// 3. Always provide explicit numerator/denominator strings (e.g., "4/5") and handle 0 opportunities safely.
function summarize(trials = [], scoringRule = 'independent_only') {
  const counts = { I: 0, V: 0, G: 0, Vi: 0, M: 0, PP: 0, P: 0, INC: 0, N: 0, NA: 0 };
  trials.forEach((t) => {
    const lv = typeof t === 'string' ? t : t.level;
    if (counts[lv] !== undefined) counts[lv]++;
  });
  const rawTotal = trials.length;
  const opportunities = Math.max(0, rawTotal - counts.NA);
  const total = opportunities; // backward-compatible alias for active opportunities presented
  const indepCount = counts.I;
  const promptedCount = counts.V + counts.G + counts.Vi + counts.M + counts.PP + counts.P;
  const incorrectCount = counts.INC;
  const noResponseCount = counts.N;
  const naCount = counts.NA;
  const correctCount = scoringRule === 'include_prompted' ? (indepCount + promptedCount) : indepCount;

  const pct = {};
  const levelNumDenom = {};
  Object.keys(counts).forEach((k) => {
    if (k === 'NA') {
      pct[k] = rawTotal ? Math.round((counts.NA / rawTotal) * 100) : 0;
      levelNumDenom[k] = `${counts.NA}/${rawTotal}`;
    } else {
      pct[k] = opportunities ? Math.round((counts[k] / opportunities) * 100) : 0;
      levelNumDenom[k] = `${counts[k]}/${opportunities}`;
    }
  });

  const indepPct = opportunities ? Math.round((indepCount / opportunities) * 100) : 0;
  const promptedPct = opportunities ? Math.round((promptedCount / opportunities) * 100) : 0;
  const correctPct = opportunities ? Math.round((correctCount / opportunities) * 100) : 0;
  const incorrectPct = opportunities ? Math.round((incorrectCount / opportunities) * 100) : 0;
  const noResponsePct = opportunities ? Math.round((noResponseCount / opportunities) * 100) : 0;

  return {
    counts,
    pct,
    total,
    rawTotal,
    opportunities,
    scoringRule: scoringRule || 'independent_only',
    indepCount,
    indepPct,
    indepNumDenom: `${indepCount}/${opportunities}`,
    promptedCount,
    promptedPct,
    promptedNumDenom: `${promptedCount}/${opportunities}`,
    correctCount,
    correctPct,
    correctNumDenom: `${correctCount}/${opportunities}`,
    incorrectCount,
    incorrectPct,
    incorrectNumDenom: `${incorrectCount}/${opportunities}`,
    noResponseCount,
    noResponsePct,
    noResponseNumDenom: `${noResponseCount}/${opportunities}`,
    naCount,
    levelNumDenom
  };
}

function summarizeBehaviorEvents(events = [], sessionMinutes = 60) {
  const safeMinutes = Math.max(1, Number(sessionMinutes) || 60);
  const safeHours = safeMinutes / 60;
  let frequency = 0;
  let totalDurationSec = 0;
  let durationEpisodes = 0;
  let totalLatencySec = 0;
  let maxLatencySec = 0;
  let latencyEpisodes = 0;
  let totalIrtSec = 0;
  let irtEpisodes = 0;

  const intervals = {
    partial_interval: { occurred: 0, total: 0 },
    whole_interval: { occurred: 0, total: 0 },
    mts: { occurred: 0, total: 0 }
  };
  const byIntensity = { Mild: 0, Moderate: 0, Severe: 0 };
  const byBehavior = {};

  // Sort chronological copy to compute automatic Inter-Response Time (IRT) when not explicitly entered
  const sorted = [...events].sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')));
  let prevTsMs = null;

  sorted.forEach((ev) => {
    const mType = ev.measurement_type || 'frequency';
    const bName = ev.behavior_name || ev.behavior || 'Target Behavior';
    const bId = ev.behavior_id || ev.behavior_program_id || null;
    const key = bId ? `id_${bId}` : bName;
    if (!byBehavior[key]) {
      byBehavior[key] = {
        behaviorId: bId,
        name: bName,
        historicalNames: [bName],
        frequency: 0,
        totalDurationSec: 0,
        durationEpisodes: 0,
        totalLatencySec: 0,
        latencyEpisodes: 0,
        intervalOccurred: 0,
        intervalTotal: 0,
        byMeasurementType: {},
        byDefinitionVersion: {}
      };
    } else {
      if (bId && !byBehavior[key].behaviorId) byBehavior[key].behaviorId = bId;
      if (bName && !byBehavior[key].historicalNames.includes(bName)) {
        byBehavior[key].historicalNames.push(bName);
        byBehavior[key].name = bName;
      }
    }
    const targetBeh = byBehavior[key];
    if (!targetBeh.byMeasurementType[mType]) {
      targetBeh.byMeasurementType[mType] = { measurementType: mType, events: 0, count: 0, totalDurationSec: 0, totalLatencySec: 0, intervalOccurred: 0, intervalTotal: 0 };
    }
    targetBeh.byMeasurementType[mType].events++;

    const defVer = Number(ev.definition_version) || 1;
    if (!targetBeh.byDefinitionVersion[defVer]) {
      targetBeh.byDefinitionVersion[defVer] = { version: defVer, definition: ev.definition_snapshot || '', events: 0 };
    }
    targetBeh.byDefinitionVersion[defVer].events++;
    if (ev.definition_snapshot && !targetBeh.byDefinitionVersion[defVer].definition) {
      targetBeh.byDefinitionVersion[defVer].definition = ev.definition_snapshot;
    }

    if (ev.intensity && byIntensity[ev.intensity] !== undefined) {
      byIntensity[ev.intensity]++;
    }

    if (mType === 'partial_interval' || mType === 'whole_interval' || mType === 'mts') {
      const iTot = Math.max(0, Number(ev.interval_total) || 1);
      const iOcc = Math.min(iTot, Math.max(0, Number(ev.interval_occurred) || 0));
      intervals[mType].total += iTot;
      intervals[mType].occurred += iOcc;
      targetBeh.intervalTotal += iTot;
      targetBeh.intervalOccurred += iOcc;
      targetBeh.byMeasurementType[mType].intervalTotal += iTot;
      targetBeh.byMeasurementType[mType].intervalOccurred += iOcc;
      if (iOcc > 0) {
        frequency += iOcc;
        targetBeh.frequency += iOcc;
        targetBeh.byMeasurementType[mType].count += iOcc;
      }
    } else {
      const cnt = Math.max(1, Number(ev.count) || 1);
      frequency += cnt;
      targetBeh.frequency += cnt;
      targetBeh.byMeasurementType[mType].count += cnt;
    }

    const dur = Number(ev.duration_sec) || 0;
    if (dur > 0) {
      totalDurationSec += dur;
      durationEpisodes++;
      targetBeh.totalDurationSec += dur;
      targetBeh.durationEpisodes++;
      targetBeh.byMeasurementType[mType].totalDurationSec += dur;
    }

    const lat = Number(ev.latency_sec) || 0;
    if (lat > 0) {
      totalLatencySec += lat;
      if (lat > maxLatencySec) maxLatencySec = lat;
      latencyEpisodes++;
      targetBeh.totalLatencySec += lat;
      targetBeh.latencyEpisodes++;
      targetBeh.byMeasurementType[mType].totalLatencySec += lat;
    }

    const explicitIrt = Number(ev.irt_sec) || 0;
    if (explicitIrt > 0) {
      totalIrtSec += explicitIrt;
      irtEpisodes++;
    } else if (ev.ts && mType !== 'partial_interval' && mType !== 'whole_interval' && mType !== 'mts') {
      const curMs = new Date(ev.ts).getTime();
      if (prevTsMs && curMs > prevTsMs && (curMs - prevTsMs) <= 4 * 3600e3) {
        totalIrtSec += Math.round((curMs - prevTsMs) / 1000);
        irtEpisodes++;
      }
      if (!Number.isNaN(curMs)) prevTsMs = curMs;
    }
  });

  const fmtInterval = (obj) => ({
    occurred: obj.occurred,
    total: obj.total,
    pct: obj.total ? Math.round((obj.occurred / obj.total) * 100) : 0,
    numDenom: `${obj.occurred}/${obj.total}`
  });

  const allIntOcc = intervals.partial_interval.occurred + intervals.whole_interval.occurred + intervals.mts.occurred;
  const allIntTot = intervals.partial_interval.total + intervals.whole_interval.total + intervals.mts.total;
  const overallInt = fmtInterval({ occurred: allIntOcc, total: allIntTot });

  const byBehaviorMap = {};
  const byBehaviorList = Object.values(byBehavior).map((b) => {
    const item = {
      ...b,
      ratePerHour: +(b.frequency / safeHours).toFixed(2),
      avgDurationSec: b.durationEpisodes ? Math.round(b.totalDurationSec / b.durationEpisodes) : 0,
      avgLatencySec: b.latencyEpisodes ? Math.round(b.totalLatencySec / b.latencyEpisodes) : 0,
      intervalPct: b.intervalTotal ? Math.round((b.intervalOccurred / b.intervalTotal) * 100) : null,
      intervalNumDenom: `${b.intervalOccurred}/${b.intervalTotal}`
    };
    byBehaviorMap[b.name] = item;
    if (Array.isArray(b.historicalNames)) {
      b.historicalNames.forEach((hn) => { byBehaviorMap[hn] = item; });
    }
    if (b.behaviorId) byBehaviorMap[`id_${b.behaviorId}`] = item;
    return item;
  });

  return {
    totalEvents: events.length,
    frequency,
    frequencyCount: frequency,
    sessionMinutes: safeMinutes,
    ratePerHour: +(frequency / safeHours).toFixed(2),
    ratePerMinute: +(frequency / safeMinutes).toFixed(3),
    totalDurationSec,
    avgDurationSec: durationEpisodes ? Math.round(totalDurationSec / durationEpisodes) : 0,
    durationEpisodes,
    durationCount: durationEpisodes,
    totalLatencySec,
    avgLatencySec: latencyEpisodes ? Math.round(totalLatencySec / latencyEpisodes) : 0,
    maxLatencySec,
    latencyEpisodes,
    latencyCount: latencyEpisodes,
    avgIrtSec: irtEpisodes ? Math.round(totalIrtSec / irtEpisodes) : 0,
    irtEpisodes,
    irtCount: irtEpisodes,
    partialInterval: fmtInterval(intervals.partial_interval),
    wholeInterval: fmtInterval(intervals.whole_interval),
    momentaryTimeSampling: fmtInterval(intervals.mts),
    overallInterval: overallInt,
    intervalPct: overallInt.pct,
    intervalNumDenom: overallInt.numDenom,
    byIntensity,
    byBehavior: byBehaviorMap,
    byBehaviorList
  };
}

function calculateIoa({ method = 'trial_by_trial', obs1 = [], obs2 = [], count1 = 0, count2 = 0 }) {
  if (method === 'total_count') {
    const c1 = Math.max(0, Number(count1) || 0);
    const c2 = Math.max(0, Number(count2) || 0);
    if (c1 === 0 && c2 === 0) return { method, pct: 100, agreements: 0, total: 0, numDenom: '0/0 (100%)' };
    const smaller = Math.min(c1, c2);
    const larger = Math.max(c1, c2);
    const pct = Math.round((smaller / larger) * 100);
    return { method, pct, agreements: smaller, total: larger, numDenom: `${smaller}/${larger}` };
  }
  const len = Math.min(obs1.length, obs2.length);
  if (len === 0) return { method, pct: 0, agreements: 0, total: 0, numDenom: '0/0' };
  let agreements = 0;
  for (let i = 0; i < len; i++) {
    if (String(obs1[i]).trim().toUpperCase() === String(obs2[i]).trim().toUpperCase()) agreements++;
  }
  const pct = Math.round((agreements / len) * 100);
  return { method, pct, agreements, total: len, numDenom: `${agreements}/${len}` };
}

function calculateFidelity(checklist = []) {
  const applicable = checklist.filter((item) => item && item.status !== 'NA');
  const total = applicable.length;
  if (!total) return { pct: 100, correct: 0, total: 0, numDenom: '0/0' };
  const correct = applicable.filter((item) => item.passed === true || item.completed === true || item.correct === true || item.status === 'yes').length;
  const pct = Math.round((correct / total) * 100);
  return { pct, correct, total, numDenom: `${correct}/${total}` };
}

function generateNote({ client, session, minutes, units, goalSummaries, plan, story, abcLogs, behaviorSummary }) {
  const lines = [];
  const settingStr = (session && session.setting) || 'home/school';
  const attendanceStr = (session && session.attendance_status) || 'Completed';
  lines.push(`${client.name} participated in a ${minutes}-minute session (${units} units) in the ${settingStr} setting (Attendance: ${attendanceStr}).`);
  if (!goalSummaries || !goalSummaries.length) {
    lines.push('No skill-acquisition data was collected this session.');
  } else {
    goalSummaries.forEach((g) => {
      if (!g.total) return;
      const indepND = g.indepNumDenom || `${(g.counts && g.counts.I) || 0}/${g.total}`;
      const promptND = g.promptedNumDenom || `${((g.counts && (g.counts.V + g.counts.G + (g.counts.Vi || 0) + (g.counts.M || 0) + (g.counts.PP || 0) + g.counts.P)) || 0)}/${g.total}`;
      lines.push(`Goal "${g.title}": ${g.total} opportunities. Independent ${g.pct.I}% (${indepND}), prompted ${g.promptedPct ?? (100 - g.pct.I - (g.pct.N || 0))}% (${promptND}) [verbal prompt ${g.pct.V}%, gestural prompt ${g.pct.G}%, visual prompt ${g.pct.Vi || 0}%, model prompt ${g.pct.M || 0}%, partial physical ${g.pct.PP || 0}%, physical prompt ${g.pct.P}%], incorrect ${g.pct.INC || 0}%, did not comply ${g.pct.N}%.`);
    });
  }
  if (behaviorSummary && (behaviorSummary.frequency > 0 || behaviorSummary.overallInterval.total > 0)) {
    const bParts = [`Frequency: ${behaviorSummary.frequency} occurrence(s) (Rate: ${behaviorSummary.ratePerHour}/hr)`];
    if (behaviorSummary.durationEpisodes > 0) bParts.push(`Duration: ${behaviorSummary.totalDurationSec}s total (Avg ${behaviorSummary.avgDurationSec}s)`);
    if (behaviorSummary.latencyEpisodes > 0) bParts.push(`Avg Latency: ${behaviorSummary.avgLatencySec}s`);
    if (behaviorSummary.irtEpisodes > 0) bParts.push(`Avg IRT: ${behaviorSummary.avgIrtSec}s`);
    if (behaviorSummary.overallInterval.total > 0) bParts.push(`Interval Recording: ${behaviorSummary.overallInterval.pct}% (${behaviorSummary.overallInterval.numDenom} intervals)`);
    lines.push(`Continuous & Interval Behavior Measurement: ${bParts.join(' · ')}.`);
  }
  if (plan) {
    lines.push(`Behavior plan for ${plan.behavior} was implemented, including prevention strategies: ${plan.prevention.slice(0, 3).join(', ')}. Replacement behavior targeted: ${plan.replacement}.`);
  }
  if (abcLogs && abcLogs.length) {
    const byBehavior = {};
    const byFunction = {};
    abcLogs.forEach(log => {
      byBehavior[log.behavior] = (byBehavior[log.behavior] || 0) + 1;
      const fn = log.perceived_function || log.function;
      if (fn) byFunction[fn] = (byFunction[fn] || 0) + 1;
    });
    const countsStr = Object.entries(byBehavior).map(([b, cnt]) => `${cnt}x ${b}`).join(', ');
    const funcStr = Object.entries(byFunction).map(([f, cnt]) => `${cnt}x ${f}`).join(', ');
    lines.push(`Behavior incidents recorded: ${abcLogs.length} total event(s) (${countsStr}). Hypothesized functions: ${funcStr || 'Not specified'}. ABC data collection was conducted. Proactive de-escalation and functional communication strategies were utilized per client protocol.`);
  } else {
    lines.push('No acute maladaptive behavior episodes occurred requiring specialized crisis intervention during this session.');
  }
  if (story) {
    lines.push(`Social story "${story.title}" was reviewed with the client.`);
  }
  if (session && session.barriers) {
    lines.push(`Barriers / Environmental Context: ${session.barriers}`);
  }
  lines.push('[RBT: add any additional environmental changes, parent communication, or specific response to intervention.]');
  return lines.join('\n\n');
}

function generateReauthReport({ client, goals = [], abcLogs = [], auths = [], supervision = {}, assessments = [], assessmentFindings = [], behaviorPrograms = [] }) {
  const dateStr = new Date().toISOString().slice(0, 10);
  
  // Calculate goal metrics
  const masteredGoals = goals.filter(g => g.status === 'mastered' || g.mastery_met);
  const activeGoals = goals.filter(g => g.status !== 'mastered' && !g.mastery_met);
  
  const goalRows = goals.map(g => {
    const cur = g.current !== null && g.current !== undefined ? g.current : g.baseline;
    const diff = cur - g.baseline;
    const statusStr = g.status === 'mastered' ? 'MASTERED' : g.mastery_met ? 'CRITERIA MET' : g.stalled ? 'STALLED' : 'IN PROGRESS';
    return {
      title: g.title,
      domain: g.domain || 'Skill Acquisition',
      measurementType: g.measurement_type || 'trial_by_trial',
      operationalDefinition: g.operational_definition || '',
      masteryCriteria: g.mastery_criteria || `${g.target || 80}% across 3 consecutive sessions`,
      baseline: g.baseline,
      current: cur,
      target: g.target || 80,
      diff: (diff >= 0 ? `+${diff}%` : `${diff}%`),
      status: statusStr
    };
  });

  // Group goals and findings by domain for auto-populated domain matrix
  const domainMap = {};
  assessmentFindings.forEach(f => {
    const dom = f.domain || 'General Assessment';
    if (!domainMap[dom]) domainMap[dom] = { domain: dom, findings: [], goals: [], behaviors: [] };
    domainMap[dom].findings.push(f);
  });
  goalRows.forEach(gr => {
    const dom = gr.domain || 'Skill Acquisition';
    if (!domainMap[dom]) domainMap[dom] = { domain: dom, findings: [], goals: [], behaviors: [] };
    domainMap[dom].goals.push(gr);
  });
  behaviorPrograms.forEach(bp => {
    const dom = 'Behavior Reduction & Self-Regulation';
    if (!domainMap[dom]) domainMap[dom] = { domain: dom, findings: [], goals: [], behaviors: [] };
    domainMap[dom].behaviors.push(bp);
  });

  // Calculate ABC behavior reduction metrics
  const totalIncidents = abcLogs.length;
  const funcCounts = { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 };
  const behCounts = {};
  abcLogs.forEach(l => {
    const f = l.perceived_function || l.function;
    if (funcCounts[f] !== undefined) funcCounts[f]++;
    behCounts[l.behavior] = (behCounts[l.behavior] || 0) + 1;
  });

  // CPT Authorizations
  const authSummary = auths.map(a => `CPT ${a.code}: ${a.used} of ${a.authorized} units utilized (${Math.round((a.used / a.authorized) * 100)}%)`).join(', ');

  const sections = [];
  sections.push({
    heading: '1. CLIENT IDENTIFYING INFORMATION & CLINICAL VITALS',
    content: `Client: ${client.name}\nDOB: ${client.dob || 'On File'}\nDiagnosis: ${client.diagnosis || 'Autism Spectrum Disorder (F84.0)'}\nCommunication Modality: ${client.communication || 'Vocal'}\nTreatment Setting: ${client.school || 'Clinic / Home'}\nReport Date: ${dateStr}\nReview Period: Past 6 Months`
  });

  // Auto-Populated Assessment & Domain Summary section
  const assessmentHeaderLines = assessments.length
    ? assessments.map(a => `• ${a.assessment_name}${a.edition ? ` (${a.edition})` : ''} — Administered ${a.assessment_date || dateStr} by ${a.assessor_name || 'Supervising BCBA'} (${a.assessor_role || 'BCBA'}) [Status: ${a.status || 'Completed'}]`).join('\n')
    : '• Standard Clinical Observation & Criterion-Referenced Skill Review on file.';
  const domainMatrixLines = Object.values(domainMap).map(d => {
    const fPart = d.findings.length
      ? d.findings.map(f => `    - Assessment Finding (${f.assessment_name || 'Clinical'}): ${f.finding_text}${f.result_value ? ` [Result: ${f.result_value}]` : ''}`).join('\n')
      : '    - Assessment Finding: Clinician observation & baseline skill probe recorded.';
    const gPart = d.goals.length
      ? d.goals.map(g => `    - Linked Goal [${g.status}]: "${g.title}" (${g.baseline}% ➔ ${g.current}%, Target: ${g.target}%, Measure: ${g.measurementType})${g.operationalDefinition ? `\n      Operational Definition: ${g.operationalDefinition}` : ''}`).join('\n')
      : '';
    const bPart = d.behaviors.length
      ? d.behaviors.map(b => `    - Target Behavior [${(b.status || 'active').toUpperCase()}]: "${b.name}" (Measure: ${b.measurement_type || 'frequency'}, Function: ${b.function_hypothesis || 'Escape'})\n      Operational Definition: ${b.operational_definition || 'Defined in BIP'}`).join('\n')
      : '';
    return `Domain: ${d.domain.toUpperCase()}\n${[fPart, gPart, bPart].filter(Boolean).join('\n')}`;
  }).join('\n\n');

  sections.push({
    heading: '2. AUTO-POPULATED ASSESSMENT INSTRUMENTS, DOMAIN MATRIX & SKILL ACQUISITION PROGRESS',
    content: `2. AUTO-POPULATED ASSESSMENT INSTRUMENTS & DOMAIN MATRIX\n` +
      `Assessment Instruments Referenced:\n${assessmentHeaderLines}\n\n` +
      `Auto-Populated Clinical Domains (Assessment Findings ➔ Active Goals & Measurement):\n` +
      (domainMatrixLines || 'No domain records entered yet.') + `\n\n` +
      `PROGRESS ON SKILL ACQUISITION PROGRAMMING:\n` +
      `During this authorization period, the client was engaged in comprehensive Discrete Trial Training (DTT) and Natural Environment Teaching (NET).\n\n` +
      `Summary of Mastery: ${masteredGoals.length} target(s) mastered or criteria-met out of ${goals.length} total programs.\n\n` +
      (goalRows.length ? goalRows.map(gr => `• [${gr.status}] "${gr.title}" (${gr.domain} · ${gr.measurementType}): Baseline ${gr.baseline}% ➔ Current ${gr.current}% (Target: ${gr.target}%, Net Change: ${gr.diff})${gr.operationalDefinition ? `\n  Operational Definition: ${gr.operationalDefinition}` : ''}`).join('\n') : 'No skill goals recorded.') +
      `\n\nPrompt Fading Narrative: Longitudinal data demonstrates progressive fading of intrusive physical and gestural prompts to independent responding across tabletop and naturalistic learning routines.`
  });

  sections.push({
    heading: '3. BEHAVIOR REDUCTION & FUNCTIONAL ANALYSIS',
    content: `Total Maladaptive Incidents Recorded: ${totalIncidents} events.\n` +
      `Behavior Breakdown: ` + (Object.keys(behCounts).length ? Object.entries(behCounts).map(([b, cnt]) => `${b}: ${cnt}`).join(', ') : 'Zero acute incidents logged') + `.\n` +
      `Hypothesized Functions: Escape/Avoidance: ${funcCounts.Escape}, Access to Tangibles: ${funcCounts.Tangible}, Attention Seeking: ${funcCounts.Attention}, Automatic/Sensory: ${funcCounts.Sensory}.\n\n` +
      (behaviorPrograms.length ? `Active Behavior Programs:\n` + behaviorPrograms.map(bp => `• "${bp.name}" (${bp.measurement_type || 'frequency'}): ${bp.operational_definition || ''} [Baseline: ${bp.baseline_data || 'Recorded'} ➔ Goal: ${bp.reduction_goal || bp.mastery_criteria || 'Reduction target'}]`).join('\n') + `\n\n` : '') +
      `Treatment Response: Functional Communication Training (FCT) and proactive antecedent manipulations (visual schedules, countdown timers) have demonstrated clinically significant utility in attenuating target problem behaviors.`
  });

  sections.push({
    heading: '4. BACB SUPERVISION & TREATMENT FIDELITY',
    content: `Direct Supervision Compliance: ${supervision.supPct || 0}% BCBA supervision ratio maintained (BACB Requirement: ≥ 5.0%).\n` +
      `Authorization Burn-Down: ${authSummary || 'Active authorizations within approved limits'}.\n` +
      `Caregiver Engagement: Caregivers actively participate in parent guidance objectives, social story reviews, and generalization protocols.`
  });

  sections.push({
    heading: '5. MEDICAL NECESSITY JUSTIFICATION & RECOMMENDATIONS',
    content: `The client continues to demonstrate meaningful clinical gains while requiring structured 1:1 behavioral intervention to close developmental deficits in communication, social reciprocity, and emotional regulation.\n\n` +
      `Discontinuation or reduction of services would place the client at high risk of behavioral regression, escalation of maladaptive behaviors, and loss of newly mastered functional communication skills.\n\n` +
      `RECOMMENDED SERVICE AUTHORIZATION:\n` +
      `• CPT 97153 (Adaptive Behavior Treatment by Protocol): 25-30 hours / week\n` +
      `• CPT 97155 (Protocol Modification / Direction of Technician): 2-3 hours / week\n` +
      `• CPT 97156 (Family Adaptive Behavior Guidance): 1-2 hours / week\n\n` +
      `[DRAFT - Requires Supervising BCBA Review & Co-Signature]`
  });

  return {
    title: `6-Month Comprehensive Treatment Plan & Progress Report`,
    client_name: client.name,
    date: dateStr,
    masteredCount: masteredGoals.length,
    totalGoals: goals.length,
    domainMatrix: Object.values(domainMap),
    sections,
    text: sections.map(s => `${s.heading}\n${'-'.repeat(s.heading.length)}\n${s.content}`).join('\n\n')
  };
}

function generateFbaReport({ client, abcLogs = [], abcSummary = {}, plans = [] }) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const total = abcLogs.length;
  const funcs = abcSummary.functions || { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 };
  const behs = abcSummary.behaviors || {};
  const red = abcSummary.reductionMetrics || { baselineRate: 3.5, currentRate: 1.3, pctChange: -63, trendDirection: 'Decreasing (Improving)', replacementSuccessRate: 100 };
  const domObj = abcSummary.dominantFunction;
  const dom = typeof domObj === 'object' && domObj !== null ? (domObj.name || 'Escape') : (domObj || 'Escape');
  const peak = abcSummary.scatterplot && abcSummary.scatterplot.peakWindow ? abcSummary.scatterplot.peakWindow : null;
  const antList = (abcSummary.antecedentMatrix || []).slice(0, 4);
  const conList = (abcSummary.consequenceMatrix || []).slice(0, 4);
  const activePlan = plans[0] ? plans[0].data : null;

  const funcPct = (k) => total ? Math.round(((funcs[k] || 0) / total) * 100) : 0;
  const pctChange = red.pctChange !== undefined ? red.pctChange : -(red.reductionPct || 63);
  const trendLabel = red.trendDirection || red.trend || 'Decreasing (Improving)';

  const sections = [
    {
      heading: '1. CLIENT IDENTIFYING PROFILE & TARGET BEHAVIORS',
      content: `Client: ${client.name} | DOB: ${client.dob || 'On File'} | Diagnosis: ${client.diagnosis || 'Autism Spectrum Disorder (F84.0)'}\n` +
        `Communication Modality: ${client.communication || 'Verbal'}\n` +
        `Sensory Profile: ${client.sensory || 'Sensitive to auditory transitions'}\n` +
        `Target Behaviors Monitored (${total} Total Episodes): ` +
        (Object.entries(behs).map(([b, c]) => `${b} (${c} episodes, ${total ? Math.round((c / total) * 100) : 0}%)`).join(' · ') || 'None logged')
    },
    {
      heading: '2. FUNCTIONAL BEHAVIOR ASSESSMENT (4-FUNCTION CONTINGENCY HYPOTHESIS)',
      content: `Primary Maintaining Function: ${dom.toUpperCase()} (${funcPct(dom)}% of all recorded episodes)\n\n` +
        `Distribution Across the 4 Functions of Behavior:\n` +
        `• Escape / Avoidance of Demands or Transitions: ${funcs.Escape || 0} episodes (${funcPct('Escape')}%)\n` +
        `• Access to Preferred Tangible / Activity: ${funcs.Tangible || 0} episodes (${funcPct('Tangible')}%)\n` +
        `• Automatic / Sensory Regulation: ${funcs.Sensory || 0} episodes (${funcPct('Sensory')}%)\n` +
        `• Social Attention Seeking: ${funcs.Attention || 0} episodes (${funcPct('Attention')}%)\n\n` +
        `Summary Hypothesis Statement: When presented with ${peak ? peak.primaryAntecedent.toLowerCase() : 'task transitions or peer proximity'}, ${client.name} engages in target vocal/refusal behaviors primarily maintained by ${dom.toLowerCase()} reinforcement.`
    },
    {
      heading: '3. ANTECEDENT CONDITIONAL PROBABILITY & TEMPORAL SCATTERPLOT (8 AM – 5 PM)',
      content: (peak ? `Peak Temporal Setting Event Window: ${peak.label} (${peak.count} incidents — ${total ? Math.round((peak.count / total) * 100) : 0}% of daily total).\nPrimary Setting Event Trigger: ${peak.primaryAntecedent}.\n\n` : '') +
        `Antecedent Conditional Probability Ranking:\n` +
        (antList.length ? antList.map((a) => `• "${a.antecedent}": ${a.count} event(s) (${a.pct}% conditional probability — Primary Function: ${a.primaryFunction || a.topFunction || 'Escape'})`).join('\n') : '• No antecedents logged.')
    },
    {
      heading: '4. LONGITUDINAL BEHAVIOR REDUCTION PROGRESS (BASELINE VS. CURRENT)',
      content: `Baseline Frequency (Initial Observation Phase): ${red.baselineRate} episodes / day\n` +
        `Current Frequency (Post-BIP / FCT Phase): ${red.currentRate} episodes / day\n` +
        `Net Behavior Rate Change: ${pctChange <= 0 ? `${Math.abs(pctChange)}% Reduction` : `${pctChange}% Increase`} (${trendLabel})\n` +
        `FCT / De-escalation Success Rate: ${red.replacementSuccessRate ?? 100}%\n\n` +
        `Consequence & De-Escalation Response Analysis:\n` +
        (conList.length ? conList.map((c) => `• "${c.consequence}": utilized ${c.count} time(s) (${c.pct}% of episodes · ${c.deescalationRate ?? 100}% de-escalated)`).join('\n') : '• Standard FCT prompting utilized.')
    },
    {
      heading: '5. FUNCTIONAL COMMUNICATION TRAINING (FCT) & BIP RECOMMENDATIONS',
      content: `1. Proactive Antecedent Modifications: Deliver 2-minute visual countdowns and First/Then schedule boards prior to the ${peak ? peak.label : '11:00 AM'} transition window.\n` +
        `2. Functionally Equivalent Replacement Behavior (FCT): ${activePlan ? activePlan.replacement : 'Prompt independent use of "My Space / Break Please" communication card and visual timer.'}\n` +
        `3. Consequence Protocol: Immediately honor all independent or prompted FCT requests (FR-1 schedule) while withholding reinforcement for screaming or task refusal (extinction of maladaptive topography).\n\n` +
        `[OFFICIAL FUNCTIONAL BEHAVIOR ASSESSMENT & BEHAVIOR REDUCTION PROGRESS REPORT — BCBA Clinical Review]`
    }
  ];

  return {
    title: 'Functional Behavior Assessment (FBA) & Behavior Reduction Progress Report',
    client_name: client.name,
    date: dateStr,
    totalIncidents: total,
    primaryFunction: dom,
    primaryFunctionPct: funcPct(dom),
    dominantFunction: dom,
    baselineRate: red.baselineRate,
    currentRate: red.currentRate,
    pctChange,
    reductionPct: Math.abs(pctChange),
    replacementSuccessRate: red.replacementSuccessRate ?? 100,
    sections,
    text: sections.map((s) => `${s.heading}\n${'-'.repeat(s.heading.length)}\n${s.content}`).join('\n\n')
  };
}

const DEFAULT_FACILITY_MODELS = [
  {
    name: 'Base Case: 6,000 sq ft Center + Sensory & Motor Gym',
    subtitle: '12 DTT Suites · 2,100 sq ft Suspended Rigging & Climbing Gym · 28-Client Capacity',
    is_default: 1,
    config: {
      totalSqFt: 6000,
      gymSqFtPct: 35,
      dttRoomsPct: 30,
      groupRoomsPct: 15,
      calmingRoomsPct: 8,
      dttRoomCount: 12,
      gymConcurrentCapacity: 10,
      groupRoomCapacity: 8,
      tiCostPerSqFt: 85,
      landlordTiAllowancePerSqFt: 30,
      gymCeilingRiggingCost: 38000,
      gymClimbingFoamPitCost: 45000,
      gymTrampolineObstacleCost: 28000,
      gymSensoryWallTactileCost: 19000,
      dttRoomFurnishingPerRoom: 3200,
      calmingRoomSnoezelenCost: 22000,
      techSecurityAvCost: 26000,
      preOpeningLicensingCost: 35000,
      workingCapitalReserve: 75000,
      useFinancing: true,
      downPaymentPct: 20,
      loanInterestRatePct: 7.5,
      loanTermYears: 10,
      initialClientsMonth1: 8,
      monthlyNewClientSignups: 2.5,
      monthlyGraduationChurnPct: 2.0,
      maxClinicClientCapacity: 28,
      compTierSharePct: 45,
      compWeeklyHours: 32,
      focusedTierSharePct: 40,
      focusedWeeklyHours: 18,
      groupGymTierSharePct: 15,
      groupGymWeeklyHours: 8,
      rate97153Hr: 68,
      rate97155Hr: 125,
      rate97156Hr: 110,
      rate97151Hr: 140,
      rate97158Hr: 42,
      bcbaSupervisionRatioPct: 12,
      familyGuidanceHrsPerClientMo: 2.0,
      assessmentHrsPerClientMo: 1.33,
      gymGroupHrsPerClientWk: 3.0,
      attendanceRealizationPct: 89,
      enableAncillaryGym: true,
      gymMembershipsCount: 35,
      gymMembershipMonthlyFee: 145,
      otPtSubleaseMonthly: 3500,
      rbtHourlyWage: 23.5,
      rbtNonBillablePct: 14,
      rbtWeeklyBillableTarget: 30,
      bcbaAnnualSalary: 92000,
      bcbaCaseloadLimit: 10,
      payrollTaxBenefitsPct: 18,
      baseRentPerSqFtYr: 28,
      camUtilitiesPerSqFtYr: 7.5,
      adminDirectorMonthly: 10500,
      insuranceSanitationMonthly: 2800,
      sensorySuppliesPerClientMo: 95,
      marketingCrmMonthly: 1800
    }
  },
  {
    name: 'Boutique Starter: 3,500 sq ft Clinic & Sensory Mini-Gym',
    subtitle: '7 DTT Suites · 1,225 sq ft Vestibular & Crash Gym · Low CapEx Fast Break-Even',
    is_default: 0,
    config: {
      totalSqFt: 3500,
      gymSqFtPct: 35,
      dttRoomsPct: 32,
      groupRoomsPct: 13,
      calmingRoomsPct: 8,
      dttRoomCount: 7,
      gymConcurrentCapacity: 6,
      groupRoomCapacity: 5,
      tiCostPerSqFt: 75,
      landlordTiAllowancePerSqFt: 25,
      gymCeilingRiggingCost: 22000,
      gymClimbingFoamPitCost: 26000,
      gymTrampolineObstacleCost: 16000,
      gymSensoryWallTactileCost: 11000,
      dttRoomFurnishingPerRoom: 3000,
      calmingRoomSnoezelenCost: 14000,
      techSecurityAvCost: 16000,
      preOpeningLicensingCost: 22000,
      workingCapitalReserve: 45000,
      useFinancing: true,
      downPaymentPct: 20,
      loanInterestRatePct: 7.5,
      loanTermYears: 10,
      initialClientsMonth1: 6,
      monthlyNewClientSignups: 1.8,
      monthlyGraduationChurnPct: 2.0,
      maxClinicClientCapacity: 16,
      compTierSharePct: 45,
      compWeeklyHours: 30,
      focusedTierSharePct: 40,
      focusedWeeklyHours: 18,
      groupGymTierSharePct: 15,
      groupGymWeeklyHours: 8,
      rate97153Hr: 68,
      rate97155Hr: 125,
      rate97156Hr: 110,
      rate97151Hr: 140,
      rate97158Hr: 42,
      bcbaSupervisionRatioPct: 12,
      familyGuidanceHrsPerClientMo: 2.0,
      assessmentHrsPerClientMo: 1.33,
      gymGroupHrsPerClientWk: 2.5,
      attendanceRealizationPct: 90,
      enableAncillaryGym: true,
      gymMembershipsCount: 20,
      gymMembershipMonthlyFee: 135,
      otPtSubleaseMonthly: 1800,
      rbtHourlyWage: 23.0,
      rbtNonBillablePct: 12,
      rbtWeeklyBillableTarget: 30,
      bcbaAnnualSalary: 90000,
      bcbaCaseloadLimit: 10,
      payrollTaxBenefitsPct: 18,
      baseRentPerSqFtYr: 26,
      camUtilitiesPerSqFtYr: 7.0,
      adminDirectorMonthly: 7500,
      insuranceSanitationMonthly: 1900,
      sensorySuppliesPerClientMo: 90,
      marketingCrmMonthly: 1200
    }
  },
  {
    name: 'Flagship Campus: 10,500 sq ft Multidisciplinary ABA & Full Motor Gym',
    subtitle: '20 DTT Suites · 3,885 sq ft Olympic Sensory/Motor Gym · OT/PT Co-Treatment Hub',
    is_default: 0,
    config: {
      totalSqFt: 10500,
      gymSqFtPct: 37,
      dttRoomsPct: 29,
      groupRoomsPct: 15,
      calmingRoomsPct: 8,
      dttRoomCount: 20,
      gymConcurrentCapacity: 18,
      groupRoomCapacity: 14,
      tiCostPerSqFt: 92,
      landlordTiAllowancePerSqFt: 35,
      gymCeilingRiggingCost: 64000,
      gymClimbingFoamPitCost: 78000,
      gymTrampolineObstacleCost: 48000,
      gymSensoryWallTactileCost: 32000,
      dttRoomFurnishingPerRoom: 3400,
      calmingRoomSnoezelenCost: 38000,
      techSecurityAvCost: 42000,
      preOpeningLicensingCost: 55000,
      workingCapitalReserve: 130000,
      useFinancing: true,
      downPaymentPct: 20,
      loanInterestRatePct: 7.25,
      loanTermYears: 10,
      initialClientsMonth1: 12,
      monthlyNewClientSignups: 4.0,
      monthlyGraduationChurnPct: 2.0,
      maxClinicClientCapacity: 48,
      compTierSharePct: 50,
      compWeeklyHours: 34,
      focusedTierSharePct: 35,
      focusedWeeklyHours: 18,
      groupGymTierSharePct: 15,
      groupGymWeeklyHours: 8,
      rate97153Hr: 70,
      rate97155Hr: 128,
      rate97156Hr: 112,
      rate97151Hr: 142,
      rate97158Hr: 44,
      bcbaSupervisionRatioPct: 12,
      familyGuidanceHrsPerClientMo: 2.0,
      assessmentHrsPerClientMo: 1.33,
      gymGroupHrsPerClientWk: 3.5,
      attendanceRealizationPct: 90,
      enableAncillaryGym: true,
      gymMembershipsCount: 65,
      gymMembershipMonthlyFee: 155,
      otPtSubleaseMonthly: 6500,
      rbtHourlyWage: 24.0,
      rbtNonBillablePct: 14,
      rbtWeeklyBillableTarget: 30,
      bcbaAnnualSalary: 94000,
      bcbaCaseloadLimit: 10,
      payrollTaxBenefitsPct: 18,
      baseRentPerSqFtYr: 29,
      camUtilitiesPerSqFtYr: 7.5,
      adminDirectorMonthly: 16500,
      insuranceSanitationMonthly: 4400,
      sensorySuppliesPerClientMo: 95,
      marketingCrmMonthly: 2800
    }
  }
];

function calculateFacilityModel(rawCfg = {}) {
  const base = DEFAULT_FACILITY_MODELS[0].config;
  const c = { ...base, ...(rawCfg || {}) };

  // 1. Space & Capacity Allocation
  const totalSqFt = Math.max(1500, Number(c.totalSqFt) || 6000);
  const gymSqFtPct = Math.min(60, Math.max(15, Number(c.gymSqFtPct) || 35));
  const dttRoomsPct = Math.min(55, Math.max(15, Number(c.dttRoomsPct) || 30));
  const groupRoomsPct = Math.min(35, Math.max(5, Number(c.groupRoomsPct) || 15));
  const calmingRoomsPct = Math.min(20, Math.max(4, Number(c.calmingRoomsPct) || 8));
  const adminLobbyPct = Math.max(5, 100 - gymSqFtPct - dttRoomsPct - groupRoomsPct - calmingRoomsPct);

  const gymSqFt = Math.round(totalSqFt * (gymSqFtPct / 100));
  const dttSqFt = Math.round(totalSqFt * (dttRoomsPct / 100));
  const groupSqFt = Math.round(totalSqFt * (groupRoomsPct / 100));
  const calmingSqFt = Math.round(totalSqFt * (calmingRoomsPct / 100));
  const adminLobbySqFt = Math.max(0, totalSqFt - gymSqFt - dttSqFt - groupSqFt - calmingSqFt);

  const dttRooms = Math.max(2, Number(c.dttRoomCount) || Math.round(dttSqFt / 150));
  const gymConcurrentCap = Math.max(2, Number(c.gymConcurrentCapacity) || Math.round(gymSqFt / 200));
  const groupConcurrentCap = Math.max(2, Number(c.groupRoomCapacity) || Math.round(groupSqFt / 110));

  const morningCohortCap = dttRooms + Math.round(gymConcurrentCap * 0.5);
  const afternoonCohortCap = dttRooms + Math.round(gymConcurrentCap * 0.5);
  const afterSchoolGroupCap = groupConcurrentCap;
  const suggestedMaxClients = morningCohortCap + Math.round(afternoonCohortCap * 0.65) + Math.round(afterSchoolGroupCap * 0.5);
  const maxClinicClientCapacity = Math.max(4, Number(c.maxClinicClientCapacity) || suggestedMaxClients);

  const space = {
    totalSqFt,
    gymSqFtPct,
    dttRoomsPct,
    groupRoomsPct,
    calmingRoomsPct,
    adminLobbyPct,
    gymSqFt,
    dttSqFt,
    groupSqFt,
    calmingSqFt,
    adminLobbySqFt,
    dttRooms,
    gymConcurrentCap,
    groupConcurrentCap,
    morningCohortCap,
    afternoonCohortCap,
    afterSchoolGroupCap,
    suggestedMaxClients,
    maxClinicClientCapacity
  };

  // 2. CapEx & SBA Financing Stack
  const tiCostPerSqFt = Math.max(0, Number(c.tiCostPerSqFt) ?? 85);
  const landlordTiAllowancePerSqFt = Math.max(0, Number(c.landlordTiAllowancePerSqFt) ?? 30);
  const grossTiConstruction = Math.round(totalSqFt * tiCostPerSqFt);
  const landlordTiCredit = Math.round(totalSqFt * landlordTiAllowancePerSqFt);
  const netTiConstruction = Math.max(0, grossTiConstruction - landlordTiCredit);

  const gymEquipmentItems = [
    {
      key: 'gymCeilingRiggingCost',
      label: 'Structural Steel Overhead Swing Rigging & Vestibular System',
      category: 'Sensory & Motor Gym',
      cost: Math.max(0, Number(c.gymCeilingRiggingCost) ?? 38000),
      note: 'Engineered I-beam ceiling mounts, platform, bolster, Lycra cuddle & rotational swings'
    },
    {
      key: 'gymClimbingFoamPitCost',
      label: 'Therapeutic Rock Climbing Wall, Cargo Net & Recessed Foam Pit',
      category: 'Sensory & Motor Gym',
      cost: Math.max(0, Number(c.gymClimbingFoamPitCost) ?? 45000),
      note: 'Custom angled pediatric climbing wall, dual crash pit with medical-grade vinyl cubes'
    },
    {
      key: 'gymTrampolineObstacleCost',
      label: 'Commercial Safety Trampoline, Balance Beams & Proprioceptive Rig',
      category: 'Sensory & Motor Gym',
      cost: Math.max(0, Number(c.gymTrampolineObstacleCost) ?? 28000),
      note: 'Deck-level trampoline, monkey bars, heavy-work resistance sleds, crash mats & bolsters'
    },
    {
      key: 'gymSensoryWallTactileCost',
      label: 'Interactive LED Sensory Walls, Tactile Motor Path & NET Play Kits',
      category: 'Sensory & Motor Gym',
      cost: Math.max(0, Number(c.gymSensoryWallTactileCost) ?? 19000),
      note: 'Acoustic tactile panels, scooter boards, weighted vests, fine/gross motor circuit kits'
    }
  ];
  const totalGymEquipment = gymEquipmentItems.reduce((s, x) => s + x.cost, 0);

  const dttFurnishingTotal = Math.round(dttRooms * (Number(c.dttRoomFurnishingPerRoom) ?? 3200));
  const clinicalTechItems = [
    {
      key: 'dttRoomFurnishingPerRoom',
      label: `1:1 DTT Therapy Suites Furnishing (${dttRooms} Suites @ $${(Number(c.dttRoomFurnishingPerRoom) ?? 3200).toLocaleString()})`,
      category: 'Clinical Suites',
      cost: dttFurnishingTotal,
      note: 'Adjustable pediatric tables, ergonomic RBT stools, locked stimulus cabinets & visual boards'
    },
    {
      key: 'calmingRoomSnoezelenCost',
      label: 'Snoezelen Multi-Sensory De-Escalation & Crisis Safety Suite',
      category: 'Clinical Suites',
      cost: Math.max(0, Number(c.calmingRoomSnoezelenCost) ?? 22000),
      note: 'Impact-padded wall panels, LED bubble tubes, fiber-optic cascade & dimmable circadian lighting'
    },
    {
      key: 'techSecurityAvCost',
      label: 'RBT iPads, Badge Access Control & HIPAA Observation AV',
      category: 'Clinical Tech & Safety',
      cost: Math.max(0, Number(c.techSecurityAvCost) ?? 26000),
      note: 'Fleet tablets with rugged cases, magnetic door locks, parent/BCBA observation cameras & Wi-Fi 6E'
    },
    {
      key: 'preOpeningLicensingCost',
      label: 'Architectural/MEP Blueprints, Permits, Licensing & Lease Deposit',
      category: 'Soft Costs & Pre-Opening',
      cost: Math.max(0, Number(c.preOpeningLicensingCost) ?? 35000),
      note: 'Architect stamping, city building permits, fire marshal inspection & initial staff credentialing'
    }
  ];
  const totalClinicalTechPreOpen = clinicalTechItems.reduce((s, x) => s + x.cost, 0);

  const grossBuildoutCapEx = grossTiConstruction + totalGymEquipment + totalClinicalTechPreOpen;
  const netBuildoutCapEx = netTiConstruction + totalGymEquipment + totalClinicalTechPreOpen;
  const workingCapitalReserve = Math.max(0, Number(c.workingCapitalReserve) ?? 75000);
  const totalCapitalRequired = netBuildoutCapEx + workingCapitalReserve;

  const useFinancing = Boolean(c.useFinancing);
  const downPaymentPct = Math.min(100, Math.max(5, Number(c.downPaymentPct) ?? 20));
  const loanInterestRatePct = Math.max(0, Number(c.loanInterestRatePct) ?? 7.5);
  const loanTermYears = Math.max(1, Number(c.loanTermYears) ?? 10);

  const loanPrincipal = useFinancing ? Math.round(totalCapitalRequired * (1 - downPaymentPct / 100)) : 0;
  const upfrontEquityCash = totalCapitalRequired - loanPrincipal;

  let monthlyDebtService = 0;
  if (useFinancing && loanPrincipal > 0) {
    const r = (loanInterestRatePct / 100) / 12;
    const n = loanTermYears * 12;
    if (r === 0) {
      monthlyDebtService = Math.round(loanPrincipal / n);
    } else {
      monthlyDebtService = Math.round((loanPrincipal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
    }
  }

  const capex = {
    tiCostPerSqFt,
    landlordTiAllowancePerSqFt,
    grossTiConstruction,
    landlordTiCredit,
    netTiConstruction,
    gymEquipmentItems,
    totalGymEquipment,
    clinicalTechItems,
    totalClinicalTechPreOpen,
    grossBuildoutCapEx,
    netBuildoutCapEx,
    workingCapitalReserve,
    totalCapitalRequired,
    useFinancing,
    downPaymentPct,
    loanInterestRatePct,
    loanTermYears,
    loanPrincipal,
    upfrontEquityCash,
    monthlyDebtService
  };

  // 3. Client Therapy Tier Mix & Unit Economics per Client
  const rawCompShare = Math.max(0, Number(c.compTierSharePct) ?? 45);
  const rawFocShare = Math.max(0, Number(c.focusedTierSharePct) ?? 40);
  const rawGrpShare = Math.max(0, Number(c.groupGymTierSharePct) ?? 15);
  const shareSum = Math.max(1, rawCompShare + rawFocShare + rawGrpShare);
  const compShare = rawCompShare / shareSum;
  const focShare = rawFocShare / shareSum;
  const grpShare = rawGrpShare / shareSum;

  const compWeeklyHours = Math.max(10, Number(c.compWeeklyHours) || 32);
  const focusedWeeklyHours = Math.max(6, Number(c.focusedWeeklyHours) || 18);
  const groupGymWeeklyHours = Math.max(2, Number(c.groupGymWeeklyHours) || 8);

  const weightedWeeklyHoursPerClient = +(
    compShare * compWeeklyHours +
    focShare * focusedWeeklyHours +
    grpShare * groupGymWeeklyHours
  ).toFixed(1);

  const WEEKS_PER_MO = 4.333;
  const gymGroupHrsWk = Math.max(0, Number(c.gymGroupHrsPerClientWk) ?? 3.0);
  const direct1on1HrsWk = Math.max(2, weightedWeeklyHoursPerClient - gymGroupHrsWk);

  const rate97153Hr = Math.max(20, Number(c.rate97153Hr) || 68);
  const rate97155Hr = Math.max(40, Number(c.rate97155Hr) || 125);
  const rate97156Hr = Math.max(40, Number(c.rate97156Hr) || 110);
  const rate97151Hr = Math.max(40, Number(c.rate97151Hr) || 140);
  const rate97158Hr = Math.max(15, Number(c.rate97158Hr) || 42);

  const bcbaSupRatio = (Math.max(5, Number(c.bcbaSupervisionRatioPct) || 12)) / 100;
  const famHrsMo = Math.max(0, Number(c.familyGuidanceHrsPerClientMo) ?? 2.0);
  const assessHrsMo = Math.max(0, Number(c.assessmentHrsPerClientMo) ?? 1.33);
  const realization = Math.min(100, Math.max(50, Number(c.attendanceRealizationPct) || 89)) / 100;

  // Per-client monthly gross revenue by CPT code
  const clientMoHrs97153 = direct1on1HrsWk * WEEKS_PER_MO;
  const clientMoHrs97158 = gymGroupHrsWk * WEEKS_PER_MO;
  const clientMoHrs97155 = clientMoHrs97153 * bcbaSupRatio;

  const rev97153PerClient = clientMoHrs97153 * rate97153Hr;
  const rev97158PerClient = clientMoHrs97158 * rate97158Hr;
  const rev97155PerClient = clientMoHrs97155 * rate97155Hr;
  const rev97156PerClient = famHrsMo * rate97156Hr;
  const rev97151PerClient = assessHrsMo * rate97151Hr;

  const monthlyGrossRevPerClient = Math.round(
    rev97153PerClient + rev97158PerClient + rev97155PerClient + rev97156PerClient + rev97151PerClient
  );
  const monthlyNetRevPerClient = Math.round(monthlyGrossRevPerClient * realization);

  // Per-client variable labor & supplies for unit economics & break-even calculation
  const rbtHourlyWage = Math.max(12, Number(c.rbtHourlyWage) || 23.5);
  const rbtNonBillablePct = Math.max(0, Number(c.rbtNonBillablePct) ?? 14) / 100;
  const payrollTaxBenefitsPct = Math.max(0, Number(c.payrollTaxBenefitsPct) ?? 18) / 100;
  const bcbaAnnualSalary = Math.max(50000, Number(c.bcbaAnnualSalary) || 92000);
  const bcbaCaseloadLimit = Math.max(4, Number(c.bcbaCaseloadLimit) || 10);
  const sensorySuppliesPerClientMo = Math.max(0, Number(c.sensorySuppliesPerClientMo) ?? 95);

  // Delivered hours per client (adjusted for attendance)
  const deliveredRbtHrsPerClientMo = (clientMoHrs97153 + clientMoHrs97158 * 0.5) * realization;
  const rbtPaidHrsPerClientMo = deliveredRbtHrsPerClientMo * (1 + rbtNonBillablePct);
  const rbtCostPerClientMo = rbtPaidHrsPerClientMo * rbtHourlyWage * (1 + payrollTaxBenefitsPct);
  const bcbaLoadedMonthly = (bcbaAnnualSalary / 12) * (1 + payrollTaxBenefitsPct);
  const bcbaCostPerClientMo = bcbaLoadedMonthly / bcbaCaseloadLimit;

  const monthlyDirectLaborPerClient = Math.round(rbtCostPerClientMo + bcbaCostPerClientMo);
  const monthlyContributionPerClient = Math.round(
    monthlyNetRevPerClient - monthlyDirectLaborPerClient - sensorySuppliesPerClientMo
  );
  const contributionMarginPct = monthlyNetRevPerClient > 0
    ? Math.round((monthlyContributionPerClient / monthlyNetRevPerClient) * 100)
    : 0;

  const unitEconomics = {
    weightedWeeklyHoursPerClient,
    compSharePct: Math.round(compShare * 100),
    focSharePct: Math.round(focShare * 100),
    grpSharePct: Math.round(grpShare * 100),
    monthlyGrossRevPerClient,
    monthlyNetRevPerClient,
    monthlyDirectLaborPerClient,
    sensorySuppliesPerClientMo,
    monthlyContributionPerClient,
    contributionMarginPct
  };

  // 4. Fixed Facility & Operations Overhead
  const baseRentMonthly = Math.round((totalSqFt * (Number(c.baseRentPerSqFtYr) ?? 28)) / 12);
  const camUtilitiesMonthly = Math.round((totalSqFt * (Number(c.camUtilitiesPerSqFtYr) ?? 7.5)) / 12);
  const rentAndCamMonthly = baseRentMonthly + camUtilitiesMonthly;
  const adminDirectorMonthly = Math.round(Number(c.adminDirectorMonthly) ?? 10500);
  const insuranceSanitationMonthly = Math.round(Number(c.insuranceSanitationMonthly) ?? 2800);
  const marketingCrmMonthly = Math.round(Number(c.marketingCrmMonthly) ?? 1800);
  const fixedFacilityOverheadMo = rentAndCamMonthly + adminDirectorMonthly + insuranceSanitationMonthly + marketingCrmMonthly;

  // 5. 36-Month Projection Loop
  const initialClients = Math.min(maxClinicClientCapacity, Math.max(1, Number(c.initialClientsMonth1) || 8));
  const monthlyNewSignups = Math.max(0, Number(c.monthlyNewClientSignups) ?? 2.5);
  const monthlyChurnRate = Math.min(25, Math.max(0, Number(c.monthlyGraduationChurnPct) ?? 2.0)) / 100;
  const rbtWeeklyTarget = Math.max(15, Number(c.rbtWeeklyBillableTarget) || 30);

  const enableAncillaryGym = Boolean(c.enableAncillaryGym);
  const targetGymMemberships = Math.max(0, Number(c.gymMembershipsCount) ?? 35);
  const gymMembershipFee = Math.max(0, Number(c.gymMembershipMonthlyFee) ?? 145);
  const otPtSubleaseMo = Math.max(0, Number(c.otPtSubleaseMonthly) ?? 3500);

  const months = [];
  let exactClients = initialClients;
  let cumCash = -upfrontEquityCash;
  let unleveredCumCash = -totalCapitalRequired;

  for (let m = 1; m <= 36; m++) {
    if (m > 1) {
      const churned = exactClients * monthlyChurnRate;
      exactClients = Math.min(maxClinicClientCapacity, Math.max(1, exactClients + monthlyNewSignups - churned));
    }
    const activeClients = Math.round(exactClients * 10) / 10;
    const utilizationPct = Math.min(100, Math.round((activeClients / maxClinicClientCapacity) * 100));

    const cpt97153Rev = Math.round(activeClients * rev97153PerClient * realization);
    const cpt97155Rev = Math.round(activeClients * rev97155PerClient * realization);
    const cpt97156Rev = Math.round(activeClients * rev97156PerClient * realization);
    const cpt97151Rev = Math.round(activeClients * rev97151PerClient * realization);
    const cpt97158Rev = Math.round(activeClients * rev97158PerClient * realization);
    const netAbaRevenue = cpt97153Rev + cpt97155Rev + cpt97156Rev + cpt97151Rev + cpt97158Rev;

    const gymRampFactor = Math.min(1, 0.35 + (m - 1) * 0.13);
    const activeGymMembers = enableAncillaryGym ? Math.round(targetGymMemberships * gymRampFactor) : 0;
    const ancillaryGymRevenue = enableAncillaryGym
      ? Math.round(activeGymMembers * gymMembershipFee + otPtSubleaseMo * (m >= 2 ? 1 : 0.5))
      : 0;

    const totalRevenue = netAbaRevenue + ancillaryGymRevenue;

    const billableHoursMo = Math.round(
      activeClients * (clientMoHrs97153 + clientMoHrs97158 + clientMoHrs97155 + famHrsMo + assessHrsMo) * realization
    );

    const totalRbtBillableWk = activeClients * (direct1on1HrsWk + gymGroupHrsWk * 0.5) * realization;
    const rbtHeadcount = Math.max(2, Math.ceil(totalRbtBillableWk / rbtWeeklyTarget));
    const bcbaHeadcount = Math.max(1, Math.ceil(activeClients / bcbaCaseloadLimit));

    const rbtLaborCost = Math.round(activeClients * rbtCostPerClientMo);
    const bcbaLaborCost = Math.round(bcbaHeadcount * bcbaLoadedMonthly);
    const totalClinicalLabor = rbtLaborCost + bcbaLaborCost;

    const grossProfit = totalRevenue - totalClinicalLabor;
    const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

    const sensorySupplies = Math.round(activeClients * sensorySuppliesPerClientMo);
    const totalFacilityOpEx = fixedFacilityOverheadMo + sensorySupplies;

    const ebitda = grossProfit - totalFacilityOpEx;
    const ebitdaMarginPct = totalRevenue > 0 ? Math.round((ebitda / totalRevenue) * 100) : 0;

    const debtService = monthlyDebtService;
    const netCashFlow = ebitda - debtService;
    cumCash += netCashFlow;
    unleveredCumCash += ebitda;

    months.push({
      month: m,
      year: Math.ceil(m / 12),
      activeClients,
      utilizationPct,
      billableHoursMo,
      cpt97153Rev,
      cpt97155Rev,
      cpt97156Rev,
      cpt97151Rev,
      cpt97158Rev,
      netAbaRevenue,
      activeGymMembers,
      ancillaryGymRevenue,
      totalRevenue,
      rbtHeadcount,
      bcbaHeadcount,
      rbtLaborCost,
      bcbaLaborCost,
      totalClinicalLabor,
      grossProfit,
      grossMarginPct,
      baseRentMonthly,
      camUtilitiesMonthly,
      rentAndCam: rentAndCamMonthly,
      adminPayroll: adminDirectorMonthly,
      insuranceAndOps: insuranceSanitationMonthly + marketingCrmMonthly,
      sensorySupplies,
      totalFacilityOpEx,
      ebitda,
      ebitdaMarginPct,
      debtService,
      netCashFlow,
      cumulativeCashFlow: Math.round(cumCash),
      unleveredCumulativeCashFlow: Math.round(unleveredCumCash)
    });
  }

  // 6. 3-Year Annual Rollups
  const years = [1, 2, 3].map((yr) => {
    const slice = months.filter((x) => x.year === yr);
    const sum = (k) => slice.reduce((a, b) => a + (b[k] || 0), 0);
    const totalRevenue = sum('totalRevenue');
    const totalClinicalLabor = sum('totalClinicalLabor');
    const grossProfit = sum('grossProfit');
    const totalFacilityOpEx = sum('totalFacilityOpEx');
    const ebitda = sum('ebitda');
    const debtService = sum('debtService');
    const netIncome = sum('netCashFlow');
    const lastMo = slice[slice.length - 1];
    return {
      year: yr,
      startClients: slice[0].activeClients,
      endClients: lastMo.activeClients,
      avgClients: +(slice.reduce((a, b) => a + b.activeClients, 0) / slice.length).toFixed(1),
      endUtilizationPct: lastMo.utilizationPct,
      endRbtHeadcount: lastMo.rbtHeadcount,
      endBcbaHeadcount: lastMo.bcbaHeadcount,
      cpt97153Rev: sum('cpt97153Rev'),
      cpt97155Rev: sum('cpt97155Rev'),
      cpt97156Rev: sum('cpt97156Rev'),
      cpt97151Rev: sum('cpt97151Rev'),
      cpt97158Rev: sum('cpt97158Rev'),
      netAbaRevenue: sum('netAbaRevenue'),
      ancillaryGymRevenue: sum('ancillaryGymRevenue'),
      totalRevenue,
      totalClinicalLabor,
      grossProfit,
      grossMarginPct: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,
      rentAndCam: sum('rentAndCam'),
      adminPayroll: sum('adminPayroll'),
      insuranceAndOps: sum('insuranceAndOps'),
      sensorySupplies: sum('sensorySupplies'),
      totalFacilityOpEx,
      ebitda,
      ebitdaMarginPct: totalRevenue > 0 ? Math.round((ebitda / totalRevenue) * 100) : 0,
      debtService,
      netIncome,
      endingCumulativeCash: lastMo.cumulativeCashFlow
    };
  });

  // 7. Executive Break-Even & Return KPIs
  const steadyAncillaryMo = enableAncillaryGym
    ? Math.round(targetGymMemberships * gymMembershipFee + otPtSubleaseMo)
    : 0;
  // Contribution per client before stepped BCBA (uses RBT + supplies + 1 BCBA baseline)
  const netClientVarMargin = Math.max(500, monthlyNetRevPerClient - Math.round(rbtCostPerClientMo) - sensorySuppliesPerClientMo);
  const netFixedLoadOp = Math.max(0, fixedFacilityOverheadMo + Math.round(bcbaLoadedMonthly) - steadyAncillaryMo);
  const breakEvenClientsOperating = Math.max(1, Math.ceil(netFixedLoadOp / netClientVarMargin));
  const breakEvenClientsCashFlow = Math.max(1, Math.ceil((netFixedLoadOp + monthlyDebtService) / netClientVarMargin));

  const firstPositiveCashMo = months.find((m) => m.netCashFlow >= 0);
  const paybackMo = months.find((m) => m.cumulativeCashFlow >= 0);
  const m36 = months[35];
  const threeYearTotalEbitda = months.reduce((s, m) => s + m.ebitda, 0);
  const threeYearNetProfitAfterDebt = months.reduce((s, m) => s + m.netCashFlow, 0);

  const kpis = {
    breakEvenClientsOperating,
    breakEvenClientsCashFlow,
    breakEvenUtilizationPct: Math.min(100, Math.round((breakEvenClientsCashFlow / maxClinicClientCapacity) * 100)),
    breakEvenMonth: firstPositiveCashMo ? firstPositiveCashMo.month : null,
    paybackMonth: paybackMo ? paybackMo.month : null,
    steadyStateMonthlyRev: m36.totalRevenue,
    steadyStateMonthlyEbitda: m36.ebitda,
    steadyStateEbitdaMarginPct: m36.ebitdaMarginPct,
    steadyStateAnnualRev: m36.totalRevenue * 12,
    steadyStateAnnualEbitda: m36.ebitda * 12,
    threeYearTotalEbitda,
    threeYearNetProfitAfterDebt,
    threeYearCumulativeNetCash: m36.cumulativeCashFlow,
    cashOnCashReturnPct: Math.round((threeYearNetProfitAfterDebt / Math.max(1, upfrontEquityCash)) * 100),
    revenuePerSqFtYr: Math.round((m36.totalRevenue * 12) / totalSqFt),
    ebitdaPerSqFtYr: Math.round((m36.ebitda * 12) / totalSqFt)
  };

  return {
    config: c,
    space,
    capex,
    unitEconomics,
    months,
    years,
    kpis
  };
}

// ---------- B2B Commercial Software Licensing & Legal Agreement Engine ----------
const LICENSE_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter Clinic',
    tagline: 'Boutique ABA practices & solo BCBA founders launching their first caseload',
    baseFee: 299,
    maxClients: 15,
    perClientFee: 18,
    maxSeats: 8,
    perSeatFee: 29,
    uptimeSla: '99.9%',
    features: [
      'Unified Behavioral Health Record (Client 360, Vitals & Crisis Plans)',
      '1-Tap DTT & NET Play Session Cockpit + CMS 8-Minute Unit Calc',
      'Built-In Kid Mode Token Boards (Space, Dino, LEGO & Train Themes)',
      'BACB 5% RBT Supervision Compliance Radar',
      'Standard Executed HIPAA Business Associate Agreement (BAA)'
    ]
  },
  growth: {
    id: 'growth',
    name: 'Growth Practice',
    tagline: 'Center-based & hybrid pediatric ABA clinics replacing MeasurePM or CentralReach',
    baseFee: 599,
    maxClients: 40,
    perClientFee: 15,
    maxSeats: 20,
    perSeatFee: 24,
    uptimeSla: '99.95%',
    popular: true,
    features: [
      'Everything in Starter Clinic + 4 Role-Tailored KPI Command Decks',
      '1-Click 6-Month Insurance Re-Authorization Packet Generator (CPT 97151/97155)',
      '8 AM–5 PM Temporal FBA Scatterplot & Antecedent Cluster Heatmap',
      'Deterministic AI Social Stories & BIP Generator with Hard BCBA Co-Sign Lock',
      'Guarded Zero-Leakage Parent Portal + Priority Clinical Data Migration'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Multi-Site',
    tagline: 'Multi-location behavioral health groups & physical clinic + sensory gym operators',
    baseFee: 1199,
    maxClients: 100,
    perClientFee: 12,
    maxSeats: 50,
    perSeatFee: 19,
    uptimeSla: '99.99%',
    features: [
      'Everything in Growth Practice + Multi-Facility P&L & Sensory Gym Pro Forma',
      '837P / ERA Billing Claim Readiness & Delinquency Command Deck',
      'Treatment Integrity (Fidelity) & Trial-by-Trial IOA Audit Suite',
      'Custom HIPAA BAA, 21 CFR Part 11 Immutable Audit Trail & CSV Data Warehouse Export',
      'Dedicated Clinical Implementation Specialist & Custom Seat/Client Caps'
    ]
  }
};

function calculateLicenseQuote({
  tier = 'growth',
  activeClients = 15,
  activeSeats = 8,
  maxClientsOverride = null,
  maxSeatsOverride = null,
  baseFeeOverride = null,
  perClientFeeOverride = null,
  perSeatFeeOverride = null,
  billingCycle = 'annual'
} = {}) {
  const tierKey = String(tier || 'growth').toLowerCase();
  const t = LICENSE_TIERS[tierKey] || LICENSE_TIERS.growth;
  const baseFee = baseFeeOverride !== null && baseFeeOverride !== undefined ? Number(baseFeeOverride) : t.baseFee;
  const maxClients = maxClientsOverride !== null && maxClientsOverride !== undefined ? Number(maxClientsOverride) : t.maxClients;
  const perClientFee = perClientFeeOverride !== null && perClientFeeOverride !== undefined ? Number(perClientFeeOverride) : t.perClientFee;
  const maxSeats = maxSeatsOverride !== null && maxSeatsOverride !== undefined ? Number(maxSeatsOverride) : t.maxSeats;
  const perSeatFee = perSeatFeeOverride !== null && perSeatFeeOverride !== undefined ? Number(perSeatFeeOverride) : t.perSeatFee;

  const clients = Math.max(0, Number(activeClients) || 0);
  const seats = Math.max(0, Number(activeSeats) || 0);

  const billableClients = Math.max(clients, maxClients);
  const billableSeats = Math.max(seats, maxSeats);
  const extraClients = Math.max(0, clients - maxClients);
  const extraSeats = Math.max(0, seats - maxSeats);

  const clientCapFee = Math.round(maxClients * perClientFee);
  const seatCapFee = Math.round(maxSeats * perSeatFee);
  const clientOverageFee = Math.round(extraClients * perClientFee);
  const seatOverageFee = Math.round(extraSeats * perSeatFee);

  const grossMonthlyTotal = baseFee + clientCapFee + seatCapFee + clientOverageFee + seatOverageFee;
  const isAnnual = String(billingCycle || 'annual').toLowerCase() === 'annual';
  const discountPct = isAnnual ? 15 : 0;
  const netMonthlyTotal = Math.round(grossMonthlyTotal * (1 - discountPct / 100));
  const annualContractValue = netMonthlyTotal * 12;

  return {
    tier: t.id,
    tierName: t.name,
    billingCycle: isAnnual ? 'annual' : 'monthly',
    discountPct,
    baseFee,
    maxClients,
    perClientFee,
    maxSeats,
    perSeatFee,
    activeClients: clients,
    activeSeats: seats,
    extraClients,
    extraSeats,
    clientCapFee,
    seatCapFee,
    clientOverageFee,
    seatOverageFee,
    grossMonthlyTotal,
    netMonthlyTotal,
    annualContractValue,
    clientUtilizationPct: maxClients > 0 ? Math.min(100, Math.round((clients / maxClients) * 100)) : 0,
    seatUtilizationPct: maxSeats > 0 ? Math.min(100, Math.round((seats / maxSeats) * 100)) : 0,
    isClientCapReached: clients >= maxClients,
    isSeatCapReached: seats >= maxSeats
  };
}

function generateLicenseAgreements({
  clinicName = 'Effective Behavioral Approach — Flagship Clinic',
  contactName = 'Sarah Jenkins',
  contactEmail = 'owner@eba.test',
  tier = 'growth',
  licenseKey = 'EBA-LIC-GROWTH-40C20S-20271031-DEMO',
  baseFee = 599,
  maxClients = 40,
  perClientFee = 15,
  maxSeats = 20,
  perSeatFee = 24,
  billingCycle = 'annual',
  issuedAt = '2026-10-31',
  expiresAt = '2027-10-31',
  msaSignedBy = '',
  msaSignedAt = '',
  baaSignedBy = '',
  baaSignedAt = '',
  eulaAcceptedBy = '',
  eulaAcceptedAt = ''
} = {}) {
  const quote = calculateLicenseQuote({
    tier,
    activeClients: maxClients,
    activeSeats: maxSeats,
    maxClientsOverride: maxClients,
    maxSeatsOverride: maxSeats,
    baseFeeOverride: baseFee,
    perClientFeeOverride: perClientFee,
    perSeatFeeOverride: perSeatFee,
    billingCycle
  });
  const tMeta = LICENSE_TIERS[String(tier || 'growth').toLowerCase()] || LICENSE_TIERS.growth;
  const effDate = String(issuedAt || new Date().toISOString()).slice(0, 10);
  const expDate = String(expiresAt || new Date(Date.now() + 365 * 86400e3).toISOString()).slice(0, 10);

  const msaText = `================================================================================
EFFECTIVE BEHAVIORAL APPROACH (EBA) — B2B SaaS MASTER SUBSCRIPTION AGREEMENT (MSA)
================================================================================
Document ID: EBA-MSA-${effDate.replace(/-/g, '')}
Effective Date: ${effDate} · Expiration / Renewal Date: ${expDate}
Licensor: Effective Behavioral Approach, Inc. ("EBA" or "Provider")
Licensee Clinic: ${clinicName} ("Customer" or "Clinic")
Primary Administrator: ${contactName} (${contactEmail})
Cryptographic License Key: ${licenseKey}

1. GRANT OF COMMERCIAL CLINIC LICENSE & HYBRID CAP SCHEDULE
   Subject to the terms of this Master Subscription Agreement ("Agreement"), EBA grants Customer a non-exclusive, non-transferable, revocable commercial license to access and operate the Effective Behavioral Approach Unified Behavioral Health Record ("UBHR") platform under the [${tMeta.name.toUpperCase()}] Subscription Tier:
   • Base Platform Fee: $${quote.baseFee}/month
   • Licensed Client Caseload Cap: Up to ${quote.maxClients} Active Pediatric Clients ($${quote.perClientFee}/mo per licensed client slot = $${quote.clientCapFee}/mo)
   • Licensed Clinician Seat Cap: Up to ${quote.maxSeats} Active Staff Accounts across BCBAs, RBTs & Administrators ($${quote.perSeatFee}/mo per licensed seat = $${quote.seatCapFee}/mo)
   • Billing Schedule (${quote.billingCycle.toUpperCase()}): $${quote.netMonthlyTotal.toLocaleString()}/month ($${quote.annualContractValue.toLocaleString()}/year total contract value${quote.discountPct ? `, inclusive of ${quote.discountPct}% annual commitment discount` : ''}).

2. TECHNICAL LICENSE ENFORCEMENT & HARD LOCKOUT PROTOCOL
   2.1 Seat & Caseload Cap Enforcement: The EBA platform cryptographically binds Customer's tenant instance to License Key [${licenseKey}]. Enrolling active clients beyond ${quote.maxClients} or provisioning staff accounts beyond ${quote.maxSeats} requires an upgraded license key or tier expansion.
   2.2 Expiration & Hard Lockout Policy: Upon license expiration (${expDate}) or suspension for non-payment, the platform automatically enters HARD LOCKOUT MODE. During Hard Lockout:
       (a) All non-Owner clinical and administrative logins (BCBA, RBT, Administrator, and Parent Portal roles) are immediately blocked at the authentication and API gateway layers (HTTP 403 Hard Lockout).
       (b) Only the designated Practice Owner account (${contactEmail}) retains administrative login access solely to renew the subscription, enter a valid cryptographic renewal key, or export historical clinical archives for HIPAA continuity of care.

3. SERVICE LEVEL AGREEMENT (SLA) & ZERO-DEPENDENCY UPTIME COMMITMENT
   EBA commits to a ${tMeta.uptimeSla} monthly uptime Service Level Agreement across all 8 Unified Clinical Record pillars (Client 360, DTT/NET Session Cockpit, Kid Mode Token Boards, FBA Scatterplots, SOAP Notes, Re-Authorization Packets, Supervision Radar, and Guarded Parent Portal).

4. CLINICAL DATA OWNERSHIP & PORTABILITY
   Customer retains 100% ownership of all clinical trial observations, ABC behavioral logs, SOAP notes, and client records. Customer may export raw trial-by-trial and behavior observation datasets in standard CSV format at any time via the Client 360 Data Export interface.

5. EXECUTION & ELECTRONIC SIGNATURE
   Status: ${msaSignedBy ? `SIGNED & EXECUTED by ${msaSignedBy} on ${msaSignedAt}` : 'PENDING ELECTRONIC SIGNATURE'}
================================================================================`;

  const baaText = `================================================================================
HIPAA BUSINESS ASSOCIATE AGREEMENT (BAA) — 45 CFR §§ 164.502(e) & 164.504(e)
================================================================================
Document ID: EBA-BAA-${effDate.replace(/-/g, '')}
Covered Entity: ${clinicName} ("Covered Entity")
Business Associate: Effective Behavioral Approach, Inc. ("Business Associate")
Associated License Key: ${licenseKey}

1. PURPOSE & REGULATORY COMPLIANCE (HIPAA / HITECH / 21 CFR PART 11)
   This Business Associate Agreement ("BAA") supplements the Master Subscription Agreement between Covered Entity and Business Associate to ensure full compliance with the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), the HITECH Act, and 45 CFR Parts 160 and 164 with respect to Protected Health Information ("PHI") stored or processed within the EBA Unified Behavioral Health Record.

2. OBLIGATIONS & SAFEGUARDS OF BUSINESS ASSOCIATE
   2.1 Permitted Uses & Disclosures: Business Associate shall use or disclose PHI solely to provide the EBA clinical practice management, ABA data collection, and insurance documentation services specified in the MSA, or as Required by Law.
   2.2 Technical & Cryptographic Safeguards (45 CFR § 164.312):
       (a) Role-Based Access Control (RBAC): Strict tenant and role isolation between Practice Owner, Supervising BCBA, Field RBT, Administrator, and Parent accounts.
       (b) Zero-Leakage Parent Portal: Automated server-side scrubbing of raw ABC incident logs, internal clinician notes, CPT billing units, and unapproved AI drafts from Parent Portal responses.
       (c) 21 CFR Part 11 Electronic Dual-Signatures: Immutable timestamped signature attribution for RBT session note submission ("pending_approval") and BCBA co-signature ("signed").
       (d) Immutable Clinical Audit Trail: Every creation, modification, undo, or signature event across clinical records is logged with user ID, timestamp, and action metadata.
       (e) Error Sanitization: Production API responses sanitize internal stack traces to prevent PHI or schema leakage.

3. BREACH NOTIFICATION & INCIDENT RESPONSE (45 CFR § 164.410)
   Business Associate shall notify Covered Entity without unreasonable delay, and in no event later than ten (10) business days following discovery, of any Breach of Unsecured PHI, including identification of each affected individual and mitigation steps taken.

4. RETURN OR DESTRUCTION OF PHI UPON TERMINATION
   Upon termination or expiration of the MSA, Business Associate shall make all PHI available for secure CSV/PDF export by Covered Entity's Practice Owner for thirty (30) days, after which Business Associate shall securely destroy all remaining PHI in accordance with NIST SP 800-88 standards.

5. EXECUTION & ELECTRONIC SIGNATURE
   Status: ${baaSignedBy ? `SIGNED & EXECUTED by ${baaSignedBy} on ${baaSignedAt}` : 'PENDING ELECTRONIC SIGNATURE'}
================================================================================`;

  const eulaText = `================================================================================
CLINICAL END-USER LICENSE AGREEMENT (EULA) & AI CLINICAL GUARDRAIL ADDENDUM
================================================================================
Document ID: EBA-EULA-${effDate.replace(/-/g, '')}
Licensed Practice: ${clinicName} · License Key: ${licenseKey}

1. CLINICAL PROFESSIONAL RESPONSIBILITY & BACB ETHICS CODE COMPLIANCE
   The Effective Behavioral Approach (EBA) platform is a clinical decision-support, data collection, and practice management tool designed for qualified behavioral health professionals (BCBA-D, BCBA, BCaBA, and supervised RBT clinicians). Use of EBA does not replace independent clinical judgment required under the Behavior Analyst Certification Board (BACB) Ethics Code for Behavior Analysts.

2. MANDATORY CLINICAL GUARDRAILS FOR DETERMINISTIC AI TOOLS
   Customer and all authorized clinical users acknowledge and agree to EBA's non-negotiable AI Clinical Guardrails:
   2.1 Draft-Only Generation: Every AI-assisted Behavior Intervention Plan (BIP), FCT replacement protocol, Social Story, and auto-compiled SOAP session narrative is generated strictly in ["draft"] status.
   2.2 Mandatory BCBA Review & Sign-Off: No AI-generated story, plan, or clinical note may be shared with parents/caregivers or submitted for CPT insurance reimbursement (CPT 97151, 97153, 97155, 97156, 97158) until a credentialed BCBA reviews and electronically approves/co-signs the record.
   2.3 BACB 5% Supervision Compliance: Clinic agrees to monitor the built-in BACB 5% RBT Supervision Radar and ensure all RBT direct therapy hours (CPT 97153) receive at least 5% BCBA supervision (CPT 97155) per calendar month.

3. PROHIBITED USES & REVERSE ENGINEERING
   Users shall not share login credentials across clinicians, bypass Hard Lockout or seat-cap controls, input unauthorized third-party PHI into public demo sandboxes, or reverse-engineer EBA's cryptographic license verification engine.

4. ACCEPTANCE & EXECUTION
   Status: ${eulaAcceptedBy ? `ACCEPTED & SIGNED by ${eulaAcceptedBy} on ${eulaAcceptedAt}` : 'PENDING ACCEPTANCE'}
================================================================================`;

  return {
    quote,
    msa: {
      id: `EBA-MSA-${effDate.replace(/-/g, '')}`,
      title: 'B2B SaaS Master Subscription Agreement (MSA)',
      subtitle: 'Hybrid Base Fee + Per-Client / Per-Seat Caps, SLA & Hard Lockout Terms',
      signedBy: msaSignedBy || null,
      signedAt: msaSignedAt || null,
      status: msaSignedBy ? 'signed' : 'pending',
      content: msaText
    },
    baa: {
      id: `EBA-BAA-${effDate.replace(/-/g, '')}`,
      title: 'HIPAA Business Associate Agreement (BAA)',
      subtitle: '45 CFR §§ 164.502(e) & 164.504(e), 21 CFR Part 11 Dual-Signature & Zero-Leakage Safeguards',
      signedBy: baaSignedBy || null,
      signedAt: baaSignedAt || null,
      status: baaSignedBy ? 'signed' : 'pending',
      content: baaText
    },
    eula: {
      id: `EBA-EULA-${effDate.replace(/-/g, '')}`,
      title: 'Clinical End-User License Agreement (EULA) & AI Addendum',
      subtitle: 'BACB Ethics Compliance, Mandatory BCBA Approval Lock for AI Drafts & Acceptable Use',
      signedBy: eulaAcceptedBy || null,
      signedAt: eulaAcceptedAt || null,
      status: eulaAcceptedBy ? 'signed' : 'pending',
      content: eulaText
    }
  };
}

// ============================================================================
// ABA ASSESSMENT REFERENCE LIBRARY & SMART CLINICAL PLANNING ENGINE (PHASE 1)
// ============================================================================

const ASSESSMENT_REFERENCE_LIBRARY = [
  {
    id: 'vbmapp',
    shortName: 'VB-MAPP',
    fullName: 'Verbal Behavior Milestones Assessment and Placement Program',
    category: 'Language, learning, and early skill milestones',
    phaseStatus: 'Phase 1 Supported',
    primaryPurpose: 'Assesses verbal behavior, social skills, learning readiness, barriers to learning, and transition readiness.',
    typicalLearnerProfile: 'Young children and learners developing early language, social, play, and classroom readiness skills.',
    domains: [
      'Mand',
      'Tact',
      'Listener Responding',
      'Visual Perceptual Skills and Matching-to-Sample',
      'Independent Play',
      'Social Behavior and Social Play',
      'Motor Imitation',
      'Echoic',
      'Spontaneous Vocal Behavior',
      'Listener Responding by Function, Feature, and Class (LRFFC)',
      'Intraverbal',
      'Classroom Routines and Group Skills',
      'Linguistic Structure',
      'Reading',
      'Writing',
      'Math',
      'Barriers Assessment',
      'Transition Assessment'
    ],
    typicalResultFormat: 'Milestone levels, domain scores, barriers ratings, transition scores, and narrative summaries.',
    goalPlanningUse: 'Identifies communication, listener, social, play, and learning-readiness goals; highlights barriers that may affect instruction.',
    copyrightNotice: 'Stores high-level domain metadata and clinician-entered findings only. Does not reproduce proprietary VB-MAPP protocol items or scoring grids.'
  },
  {
    id: 'abllsr',
    shortName: 'ABLLS-R',
    fullName: 'Assessment of Basic Language and Learning Skills–Revised',
    category: 'Basic language, learning, academic readiness, self-help, and motor skills',
    phaseStatus: 'Phase 1 Supported',
    primaryPurpose: 'Provides a detailed criterion-referenced review of foundational language, learning, academic, self-help, and motor skills.',
    typicalLearnerProfile: 'Learners needing structured assessment across language, learning readiness, classroom skills, self-care, and motor skills.',
    domains: [
      'Cooperation and Reinforcer Effectiveness',
      'Visual Performance',
      'Receptive Language',
      'Motor Imitation',
      'Vocal Imitation',
      'Requests (Mands)',
      'Labeling (Tacts)',
      'Intraverbals',
      'Spontaneous Vocalizations',
      'Syntax and Grammar',
      'Play and Leisure',
      'Social Interaction',
      'Group Instruction',
      'Classroom Routines',
      'Generalized Responding',
      'Reading',
      'Math',
      'Writing',
      'Spelling',
      'Dressing',
      'Eating',
      'Grooming',
      'Toileting',
      'Gross Motor',
      'Fine Motor'
    ],
    typicalResultFormat: 'Task/skill ratings across domain grids, criterion-referenced skill profiles, and narrative summaries.',
    goalPlanningUse: 'Supports selection of specific foundational communication, learning-to-learn, classroom, academic readiness, self-help, and motor objectives.',
    copyrightNotice: 'Stores high-level domain metadata and clinician-entered findings only. Does not reproduce proprietary ABLLS-R task items or grids.'
  },
  {
    id: 'afls',
    shortName: 'AFLS',
    fullName: 'Assessment of Functional Living Skills',
    category: 'Functional living, home, school, community, and independence skills',
    phaseStatus: 'Phase 1 Supported',
    primaryPurpose: 'Evaluates practical independence and daily living skills across everyday environments.',
    typicalLearnerProfile: 'School-age learners, adolescents, and adults working toward greater daily living, community, school, or vocational independence.',
    domains: [
      'Basic Living Skills',
      'Home Skills',
      'Community Participation Skills',
      'School Skills',
      'Independent Living Skills',
      'Vocational Skills',
      'Self-Management',
      'Basic Communication',
      'Dressing',
      'Toileting',
      'Grooming & Bathing',
      'Health, Safety and First Aid',
      'Meals & Housekeeping',
      'Community Mobility & Shopping',
      'Money & Time Management',
      'Social Awareness & Classroom Mechanics',
      'Routines & Technology'
    ],
    typicalResultFormat: 'Module domain scores, task ratings, visual skill grids, and functional independence summaries.',
    goalPlanningUse: 'Identifies functional routines, daily living skills, safety skills, community participation targets, and task-analysis goals.',
    copyrightNotice: 'Stores high-level domain metadata and clinician-entered findings only. Does not reproduce proprietary AFLS module protocols.'
  },
  {
    id: 'efl',
    shortName: 'Essential for Living (EFL)',
    fullName: 'Essential for Living: A Communication, Behavior, and Functional Skills Curriculum, Assessment, and Professional Practitioner’s Handbook',
    category: 'Functional communication, daily living, tolerating, and severe-needs prioritization',
    phaseStatus: 'Phase 1 Supported',
    primaryPurpose: 'Focuses on essential communication, functional daily living skills, social/tolerating skills, and behavior management priorities for learners with moderate-to-severe disabilities.',
    typicalLearnerProfile: 'Children, adolescents, and adults with moderate-to-severe disabilities, limited vocal language, or high support needs.',
    domains: [
      'Effective Method of Speaking / Alternative Communication',
      'Requests (Mands)',
      'Listener Responding',
      'Waiting after Making a Request',
      'Accepting Removals, Transitions, Sharing, and Turns',
      'Completing Brief and Extended Daily Living & Leisure Tasks',
      'Tolerating Health, Safety, and Personal Care Routines',
      'Functional Daily Living Skills',
      'Severe Problem Behavior Considerations'
    ],
    typicalResultFormat: 'Skill status ratings, communication method identification, priority skill profiles, and functional outcome summaries.',
    goalPlanningUse: 'Prioritizes high-impact communication, tolerating, safety, and daily living goals that improve quality of life and daily functioning.',
    copyrightNotice: 'Stores high-level domain metadata and clinician-entered findings only. Does not reproduce proprietary EFL forms or copyrighted scoring rules.'
  },
  {
    id: 'vineland3',
    shortName: 'Vineland-3',
    fullName: 'Vineland Adaptive Behavior Scales, Third Edition',
    category: 'Standardized adaptive behavior assessment',
    phaseStatus: 'Phase 1 Supported',
    primaryPurpose: 'Measures adaptive functioning compared with age expectations across core adaptive domains.',
    typicalLearnerProfile: 'Individuals from birth through adulthood when standardized adaptive functioning scores are needed for clinical evaluation, treatment planning, or payer documentation.',
    domains: [
      'Communication (Receptive, Expressive, Written)',
      'Daily Living Skills (Personal, Domestic, Community)',
      'Socialization (Interpersonal Relationships, Play and Leisure, Coping Skills)',
      'Motor Skills (Gross Motor, Fine Motor)',
      'Adaptive Behavior Composite (ABC)'
    ],
    typicalResultFormat: 'Standard scores, v-scale scores, percentile ranks, age equivalents, adaptive levels, and narrative interpretation.',
    goalPlanningUse: 'Helps identify broad adaptive domains needing support and provides standardized context for treatment planning and progress reporting.',
    copyrightNotice: 'Stores high-level domain metadata and clinician-entered findings only. Does not reproduce proprietary Vineland-3 norm tables or test items.'
  },
  {
    id: 'peak',
    shortName: 'PEAK',
    fullName: 'Promoting the Emergence of Advanced Knowledge',
    category: 'Language, cognition, generalization, and relational learning',
    phaseStatus: 'Later Phase / Future Expansion',
    primaryPurpose: 'Assesses and guides instruction from foundational verbal operants through generalization, stimulus equivalence, and relational responding.',
    typicalLearnerProfile: 'Learners working on language expansion, concept formation, generalization, problem-solving, perspective-taking, and complex language skills.',
    domains: [
      'Direct Training Module',
      'Generalization Module',
      'Equivalence Module',
      'Transformation Module'
    ],
    typicalResultFormat: 'Module scores, factor scores, age/norm references (where applicable), skill matrices, and instructional target lists.',
    goalPlanningUse: 'Supports goals involving generalized responding, categorization, equivalence relations, relational framing, and advanced language/cognitive skills.',
    copyrightNotice: 'Reference metadata only (Later Phase / Future Expansion). Clinician-entered findings supported without proprietary item reproduction.'
  }
];

const MEASUREMENT_RECOMMENDATION_LIBRARY = [
  {
    patternId: 'discrete_count',
    goalBehaviorPattern: 'Discrete responses with a clear beginning and end (e.g., hitting, kicking, screaming, spontaneous mands)',
    primaryMeasurement: 'frequency',
    primaryLabel: 'Frequency / Rate (Event Recording)',
    secondaryMeasurement: 'abc',
    secondaryLabel: 'ABC Context Logging (when functional context is needed)',
    whenToUse: 'Use when each occurrence is distinct, brief, and countable; convert to rate (count ÷ observation duration) when session lengths vary.',
    dataFields: ['Timestamp / Opportunity', 'Behavior / Response Count', 'Observation Duration (min)', 'Calculated Rate (per hr)', 'Prompt / Antecedent Context'],
    avoidWhen: 'Avoid when episodes last for extended variable durations or blend continuously without clear separation.'
  },
  {
    patternId: 'episode_duration',
    goalBehaviorPattern: 'Behavior or skill lasted for a period of time (e.g., tantrum duration, crying episode, independent leisure engagement)',
    primaryMeasurement: 'duration',
    primaryLabel: 'Duration per Episode & Total Session Duration',
    secondaryMeasurement: 'frequency',
    secondaryLabel: 'Episode Frequency (count of distinct episodes)',
    whenToUse: 'Use when the primary clinical concern is how long each episode or engagement period lasts from onset to offset.',
    dataFields: ['Episode #', 'Onset Time', 'Offset Time', 'Episode Duration (sec/min)', 'Episode Rule Applied (Yes/No)'],
    avoidWhen: 'Avoid when responses are instantaneous (<1-2 seconds) and better captured by frequency or rate.'
  },
  {
    patternId: 'cue_to_initiation_latency',
    goalBehaviorPattern: 'Starting a response after a cue or instruction (e.g., initiating transition movement within N seconds of a cue)',
    primaryMeasurement: 'latency',
    primaryLabel: 'Latency (Elapsed Time from Cue Delivery to Response Onset)',
    secondaryMeasurement: 'percentage_of_opportunities',
    secondaryLabel: 'Percentage of Opportunities Meeting Time Criterion',
    whenToUse: 'Use when the goal targets how quickly the learner initiates an observable action following a clear transition cue or instruction.',
    dataFields: ['Opportunity #', 'Cue Delivered', 'Latency (Seconds)', 'Met Time Criterion (Yes/No)', 'Prompt Level / Notes'],
    avoidWhen: 'Avoid when no clear antecedent cue/SD marks the start of the opportunity window.'
  },
  {
    patternId: 'interresponse_pacing',
    goalBehaviorPattern: 'Time elapsed between consecutive responses (e.g., pacing of eating bites, time between vocal outbursts or stereotypy bouts)',
    primaryMeasurement: 'irt',
    primaryLabel: 'Interresponse Time (IRT)',
    secondaryMeasurement: 'frequency',
    secondaryLabel: 'Response Count / Rate',
    whenToUse: 'Use when clinical intervention targets increasing or decreasing the time gap between successive responses.',
    dataFields: ['Response Pair #', 'Previous Offset Time', 'Next Onset Time', 'IRT (Seconds)', 'Notes'],
    avoidWhen: 'Avoid when only total count or delay from an adult instruction (latency) is relevant.'
  },
  {
    patternId: 'percentage_opportunities',
    goalBehaviorPattern: 'Responding across natural or planned opportunities (e.g., requesting a break, asking for help, greeting peers)',
    primaryMeasurement: 'percentage_of_opportunities',
    primaryLabel: 'Percentage of Opportunities (% Independent)',
    secondaryMeasurement: 'trial_by_trial',
    secondaryLabel: 'Trial-by-Trial Prompt Hierarchy Recording',
    whenToUse: 'Use when the behavior depends on specific natural or contrived opportunities and you want to track independent vs. prompted responding.',
    dataFields: ['Opportunity #', 'Context / Antecedent Cue', 'Response Outcome (Independent / Prompted / No Response / Refusal)', 'Prompt Level Used', 'Communication Modality'],
    avoidWhen: 'Avoid when opportunities are not tracked or denominator count is unknown.'
  },
  {
    patternId: 'discrete_trial_teaching',
    goalBehaviorPattern: 'Skill taught in repeated structured teaching trials (e.g., receptive identification, labeling/tacts, matching, intraverbals)',
    primaryMeasurement: 'trial_by_trial',
    primaryLabel: 'Trial-by-Trial Recording (Accuracy & Prompt Level)',
    secondaryMeasurement: 'percentage_of_opportunities',
    secondaryLabel: 'Session Percentage Independent',
    whenToUse: 'Use for structured DTT/NET acquisition targets where each trial has a discriminative stimulus (SD), response, and prompt level.',
    dataFields: ['Trial #', 'Target Stimulus / SD', 'Learner Response (I, V, G, Vi, M, PP, P, INC, N)', 'Reinforcement / Error Correction'],
    avoidWhen: 'Avoid for free-operant behaviors that occur without discrete trials.'
  },
  {
    patternId: 'multi_step_routine',
    goalBehaviorPattern: 'Multi-step routines (e.g., handwashing, toothbrushing, dressing, unpacking backpack)',
    primaryMeasurement: 'task_analysis',
    primaryLabel: 'Task Analysis (% of Steps Completed Independently)',
    secondaryMeasurement: 'duration',
    secondaryLabel: 'Total Routine Duration (optional)',
    whenToUse: 'Use when a functional skill consists of a sequence of discrete chained steps (forward chaining, backward chaining, or total task).',
    dataFields: ['Step #', 'Step Description', 'Completed Independently (Yes/No)', 'Prompt Level Used', 'Chain Type'],
    avoidWhen: 'Avoid when the target is a single-step discrete response.'
  },
  {
    patternId: 'continuous_engagement_sampling',
    goalBehaviorPattern: 'Remaining engaged, seated, or on-task across an interval or activity check',
    primaryMeasurement: 'mts',
    primaryLabel: 'Momentary Time Sampling (MTS) / Interval Recording (Whole or Partial)',
    secondaryMeasurement: 'duration',
    secondaryLabel: 'Total Engagement Duration (when continuous timer is feasible)',
    whenToUse: 'Use MTS or Whole-Interval Recording for ongoing on-task/engagement states; use Partial-Interval Recording when monitoring brief high-rate behaviors across intervals.',
    dataFields: ['Interval #', 'Interval Length (sec/min)', 'Observed at Interval Check (+ / -)', 'Session % Intervals'],
    avoidWhen: 'Avoid when exact count or exact latency from a cue is required and continuous measurement is practical.'
  },
  {
    patternId: 'permanent_product',
    goalBehaviorPattern: 'Tangible outcome remaining after the behavior occurs (e.g., completed math problems, sorted items, written words)',
    primaryMeasurement: 'permanent_product',
    primaryLabel: 'Permanent Product Recording',
    secondaryMeasurement: 'percentage_of_opportunities',
    secondaryLabel: 'Percentage Correct Items',
    whenToUse: 'Use when the behavior produces a durable, countable physical or digital product that can be scored accurately after completion.',
    dataFields: ['Assignment / Task', 'Total Items', 'Items Completed Correctly', 'Prompt / Assistance Provided', '% Accuracy'],
    avoidWhen: 'Avoid when real-time topography, latency, or prompt level per step must be observed live.'
  }
];

const VAGUE_GOAL_QUALITY_RULES = [
  {
    id: 'vague_respectful',
    matchRegex: /\b(be\s+respectful|respectful\s+behavior|show\s+respect|act\s+respectfully)\b/i,
    flagLabel: 'Non-observable / subjective construct ("Be respectful")',
    clarifyingQuestion: 'Which observable actions indicate respectful behavior in this setting (e.g., keeping hands to self, using calm vocal tone, waiting for speaker to finish)?'
  },
  {
    id: 'vague_social_skills',
    matchRegex: /\b(improve\s+social\s+skills|better\s+social\s+skills|develop\s+social\s+skills|socialize\s+appropriately)\b/i,
    flagLabel: 'Broad domain label rather than observable response ("Improve social skills")',
    clarifyingQuestion: 'Which specific social response should be observed (e.g., greeting a peer within 5 seconds, taking turns with a shared game, responding to a peer question)?'
  },
  {
    id: 'vague_reduce_tantrums',
    matchRegex: /^\s*(client\s+will\s+)?(reduce|decrease|stop|eliminate)\s+(tantrums?|meltdowns?|outbursts?)\s*\.?\s*$/i,
    flagLabel: 'Underspecified topography and episode boundaries ("Reduce tantrums")',
    clarifyingQuestion: 'Which observable actions define an episode (e.g., crying, dropping to floor, screaming), and what are the episode start (onset) and end (offset) rules?'
  },
  {
    id: 'vague_follow_directions',
    matchRegex: /^\s*(client\s+will\s+)?(follow\s+directions|comply\s+with\s+instructions|listen\s+to\s+adults)\s*\.?\s*$/i,
    flagLabel: 'Missing response window, instruction type, and prompt level ("Follow directions")',
    clarifyingQuestion: 'What counts as following the direction (e.g., 1-step routine instruction), within what response window (e.g., within 5 seconds), and with what prompt level?'
  },
  {
    id: 'vague_improve_communication',
    matchRegex: /\b(improve\s+communication|communicate\s+better|increase\s+communication|express\s+needs\s+appropriately)\b/i,
    flagLabel: 'Unspecified communicative function and modality ("Improve communication")',
    clarifyingQuestion: 'Which communication function (e.g., requesting a break, requesting help, labeling items) and modality count (vocal speech, AAC device selection, PECS exchange, gesture, sign)?'
  },
  {
    id: 'vague_internal_state',
    matchRegex: /\b(understand|understands|know|knows|feel\s+calm|regulate\s+emotions|behave\s+appropriately|appropriate\s+behavior|pay\s+attention)\b/i,
    flagLabel: 'Internal state or subjective judgment term ("understands", "knows", "behaves appropriately")',
    clarifyingQuestion: 'What specific physical or vocal behavior can two independent observers see or hear to verify this skill?'
  }
];

function analyzeSmartGoal(input = {}) {
  const rawGoalText = String(input.rawGoalText || input.goalText || '').trim();
  const clientName = String(input.clientName || 'Learner').trim();
  const commModality = String(input.communicationModality || 'Vocal / AAC / PECS').trim();
  const explicitDomain = String(input.domain || '').trim();
  const findingId = input.findingId || null;
  const findingText = String(input.findingText || '').trim();
  const lower = rawGoalText.toLowerCase();

  // 1. Detect vague / non-observable patterns
  const vagueFlags = [];
  const clarifyingQuestions = [];
  VAGUE_GOAL_QUALITY_RULES.forEach((rule) => {
    if (rule.matchRegex.test(rawGoalText)) {
      vagueFlags.push(rule.flagLabel);
      clarifyingQuestions.push(rule.clarifyingQuestion);
    }
  });

  // 2. Parse components of the goal statement
  const timeMatch = rawGoalText.match(/within\s+(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m)\b/i);
  const timeframe = timeMatch ? `within ${timeMatch[1]} ${timeMatch[2].toLowerCase()}` : null;
  const secVal = timeMatch
    ? (timeMatch[2].toLowerCase().startsWith('m') ? Number(timeMatch[1]) * 60 : Number(timeMatch[1]))
    : null;

  const pctMatch = rawGoalText.match(/(\d{1,3})\s*%\s*(?:of\s+opportunities|accuracy|independent|across)?/i);
  const sessionsMatch = rawGoalText.match(/across\s+(\d+)\s+consecutive\s+(sessions?|days?|probes?)/i);
  const hasExplicitCriterion = Boolean(pctMatch || sessionsMatch || input.masteryCriteria);

  let who = clientName;
  const whoMatch = rawGoalText.match(/^([A-Z][a-z]+|The\s+learner|The\s+client|Client|Learner)\s+will\b/);
  if (whoMatch) who = whoMatch[1];

  const isTransitionLatency = /\b(transition|initiate\s+movement|move\s+toward|next\s+activity|line\s+up|clean\s+up\s+cue)\b/i.test(rawGoalText) ||
    (Boolean(timeframe) && /\b(initiate|start|begin|move|transition)\b/i.test(rawGoalText));
  const isHittingAggression = /\b(hit|hitting|aggression|strike|striking|kick|kicking|bite|biting|scratch|push|pinch)\b/i.test(rawGoalText);
  const isTantrumEpisode = /\b(tantrums?|meltdowns?|crying\s+episodes?|screaming\s+episodes?|elopement)\b/i.test(rawGoalText);
  const isBreakOrHelpRequest = /\b(request\s+(?:a\s+)?break|request\s+help|ask\s+for\s+help|request\s+assistance|functional\s+communication|mand\s+for\s+break|break\s+card)\b/i.test(rawGoalText);
  const isTaskAnalysisRoutine = /\b(hand\s*washing|wash\s+hands|tooth\s*brushing|brush\s+teeth|dressing|toileting|routine|steps\s+of)\b/i.test(rawGoalText);
  const isEngagementOrSeat = /\b(remain\s+seated|stay\s+in\s+seat|on-task|engaged\s+in\s+activity|attend\s+to\s+group)\b/i.test(rawGoalText);
  const isReductionGoal = String(input.goalType || '').toLowerCase() === 'behavior_reduction' ||
    /\b(decrease|reduce|eliminate|fewer|lower\s+rate|hitting|tantrum|aggression|biting|elopement|screaming|property\s+destruction)\b/i.test(rawGoalText);

  const inferredGoalType = isReductionGoal ? 'behavior_reduction' : 'skill_acquisition';
  let inferredDomain = explicitDomain || (
    isBreakOrHelpRequest ? 'Communication (Requests / Mands)' :
    isTransitionLatency ? 'Classroom Routines & Transitions' :
    isTaskAnalysisRoutine ? 'Adaptive & Daily Living Skills' :
    isReductionGoal ? 'Behavior Reduction & Self-Regulation' :
    'Skill Acquisition'
  );

  // Check if underspecified
  if (rawGoalText.split(/\s+/).length < 5 && vagueFlags.length === 0) {
    vagueFlags.push('Brief or underspecified goal statement (fewer than 5 words)');
    clarifyingQuestions.push('What is the exact antecedent cue/context, observable learner action, and criterion for counting a successful response?');
  }
  if (!timeframe && isTransitionLatency) {
    clarifyingQuestions.push('Within how many seconds of the transition cue should the learner initiate movement (e.g., within 5 seconds)?');
  }
  if (isBreakOrHelpRequest && !/\b(vocal|spoken|aac|pecs|card|sign|gesture|modality)\b/i.test(rawGoalText)) {
    clarifyingQuestions.push(`Which communication modality counts as a valid independent request (${commModality})?`);
  }

  // 3. Build specialized, high-precision recommendations per scenario
  let targetResponse = '';
  let cueOrContext = '';
  let promptExpectation = '';
  let refinedGoalText = rawGoalText;
  let operationalDefinition = {};
  let measurementPlan = {};
  let dataCollectionPlan = {};
  let masteryRecommendation = {};

  if (isTransitionLatency) {
    const windowSec = secVal || 5;
    targetResponse = `Initiating physical movement toward the designated next activity area within ${windowSec} seconds`;
    cueOrContext = 'Upon delivery of a verbal, visual, or timer-based transition cue by the clinician';
    promptExpectation = 'Independent initiation prior to additional physical or verbal prompting after the initial transition cue';
    refinedGoalText = `${who} will independently initiate physical movement toward the next scheduled activity area within ${windowSec} seconds of a clinician-delivered transition cue.`;

    operationalDefinition = {
      summary: `Observable initiation of body movement toward the next activity location within ${windowSec} seconds of the transition cue.`,
      targetResponse: `Following a transition cue (e.g., "Time for table", visual schedule icon, or timer chime), ${who} stands up from the current seat/floor position or takes at least one step oriented toward the designated next location within ${windowSec} seconds.`,
      onsetCriteria: `Timer starts (0.0s) immediately when the clinician finishes delivering the initial transition cue. Response onset is scored at the first observable purposeful movement toward the next location (standing up, orienting body and stepping toward the target area, or beginning to put away materials when explicitly part of the cue).`,
      offsetCriteria: `Latency timer stops at the exact second ${who} initiates the first purposeful movement toward the next location (or at maximum opportunity cutoff if no movement occurs).`,
      episodeRule: `Each scheduled or planned activity change represents 1 discrete transition opportunity.`,
      examples: `• Clinician says "Time for table work" and points to the table; ${who} stands up and takes a step toward the table within 3 seconds.\n• Visual timer rings for gym-to-classroom transition; ${who} walks toward the classroom door within ${windowSec} seconds.`,
      nonExamples: `• Looking toward the therapist or verbally acknowledging the cue ("Okay") without initiating physical movement toward the next area.\n• Walking toward a preferred toy shelf unrelated to the next scheduled activity.`,
      exclusions: `Looking toward the therapist or verbally acknowledging the cue without movement does not count as movement initiation. Movement unrelated to the next activity is excluded.`
    };

    measurementPlan = {
      primaryMeasurement: 'latency',
      primaryLabel: 'Latency (Seconds from Transition Cue to First Observable Movement)',
      secondaryMeasurement: 'percentage_of_opportunities',
      secondaryLabel: `Percentage of Opportunities Meeting the ${windowSec}-Second Criterion`,
      rationale: `Latency is the recommended primary measurement because the goal explicitly specifies a ${windowSec}-second response window following a discrete transition cue. Recording exact latency in seconds captures how quickly ${who} initiates transitions, while Percentage of Opportunities Meeting the ${windowSec}-Second Criterion provides a clear secondary summary of how consistently the ${windowSec}-second target is met across daily transitions.`,
      whatPrimaryCaptures: `Exact elapsed time (in seconds) between the end of the transition cue and the first observable movement toward the next activity.`,
      whatPrimaryDoesNotCapture: `Whether the learner completed the entire walk to the destination without pausing (use total transition duration if completion time is also a concern).`,
      whatSecondaryCaptures: `Proportion of valid daily transition opportunities in which latency was ≤ ${windowSec} seconds (displayed as a separate metric from average latency).`
    };

    dataCollectionPlan = {
      dataFields: [
        'Opportunity #',
        'Transition Context / Cue Delivered',
        'Latency (Seconds)',
        `Met ${windowSec}-Second Criterion (Yes / No)`,
        'Prompt Level Used (Independent / Prompted)',
        'Notes'
      ],
      responseOptions: [
        `Latency in seconds (0s – 60s+)`,
        `Met ${windowSec}s Criterion: Yes (≤ ${windowSec}s independent) / No (> ${windowSec}s or prompted after cue)`
      ],
      calculationFormula: `• Primary Metric (Average Latency): Sum of latencies across valid opportunities ÷ Total valid transition opportunities.\n• Secondary Metric (% Meeting ${windowSec}s Criterion): (Number of opportunities with independent initiation ≤ ${windowSec}s ÷ Total valid transition opportunities) × 100.`,
      validityRules: `A valid opportunity requires a clear transition cue delivered while ${who} is attending. Prompted movement after the initial cue is recorded separately and does not count as an independent ≤ ${windowSec}s initiation.`,
      sampleRows: [
        { opportunity: 1, context: 'Play area ➔ Table work ("Time for table")', latencySec: 3, metCriterion: 'Yes', prompt: 'Independent' },
        { opportunity: 2, context: 'Table work ➔ Sensory gym ("Gym time")', latencySec: 2, metCriterion: 'Yes', prompt: 'Independent' },
        { opportunity: 3, context: 'Sensory gym ➔ Wash hands ("Wash hands")', latencySec: 5, metCriterion: 'Yes', prompt: 'Independent' },
        { opportunity: 4, context: 'Snack ➔ Circle mat ("Circle time")', latencySec: 12, metCriterion: 'No', prompt: 'Gestural prompt at 6s' },
        { opportunity: 5, context: 'Circle mat ➔ Cubby ("Pack up time")', latencySec: 3, metCriterion: 'Yes', prompt: 'Independent' }
      ],
      sampleSummary: `4 of 5 opportunities met the ${windowSec}-second criterion = 80% successful transitions · Average latency = 5.0 seconds ((3+2+5+12+3) ÷ 5).`
    };
  } else if (isHittingAggression) {
    targetResponse = 'Forceful physical contact with another person using an open or closed hand';
    cueOrContext = 'Across all instructional, transition, and free-play session segments';
    promptExpectation = 'Track all occurrences; deliver antecedent prevention and FCT prompting per BIP';
    refinedGoalText = `${who} will decrease hitting behavior (forceful open- or closed-hand contact toward another person) while increasing functional communication requests.`;

    operationalDefinition = {
      summary: 'Any instance of forceful open-hand or closed-hand physical contact directed toward another person’s body.',
      targetResponse: `Any occurrence in which ${who}'s open hand, closed fist, or arm makes forceful physical contact with any part of another person's body (clinician, peer, or caregiver).`,
      onsetCriteria: `Scored immediately upon forceful hand/arm contact with another person's body (or attempted strike within 6 inches if blocked for safety, when specified by BCBA).`,
      offsetCriteria: `Single discrete strike ends immediately upon hand separation from the person's body.`,
      episodeRule: `Each discrete strike separated by at least 1 second of non-contact is scored as 1 count. Rapid consecutive strikes (<1 second apart) may be scored per strike or as a single bout per BCBA specification.`,
      examples: `• Striking the RBT's arm with an open palm when a tablet timer ends.\n• Hitting a peer's shoulder with a closed fist during block play.`,
      nonExamples: `• Lightly tapping an adult's shoulder to gain attention without force.\n• Enthusiastic high-five or fist-bump initiated during social praise.\n• Accidental brushing against a peer while walking past in a narrow hallway.`,
      exclusions: `Accidental contact and specifically identified appropriate contact (such as a socially appropriate high-five or light attention-tap), consistent with the individualized definition, are excluded.`
    };

    measurementPlan = {
      primaryMeasurement: 'frequency',
      primaryLabel: 'Frequency & Session Rate (Occurrences per Hour)',
      secondaryMeasurement: 'abc',
      secondaryLabel: 'ABC Event Recording (Antecedent, Behavior, Consequence & Intensity)',
      rationale: `Hitting is a discrete, countable behavior with a clear beginning and end. Frequency converted to Session Rate (occurrences ÷ session hours) allows accurate comparison across sessions of different lengths, while ABC logging identifies triggering antecedents and maintaining functions.`,
      whatPrimaryCaptures: `Exact count of discrete hitting occurrences and standardized rate per hour across the observation period.`,
      whatPrimaryDoesNotCapture: `Environmental triggers or consequences surrounding each hit (captured via optional Secondary ABC logging).`,
      whatSecondaryCaptures: `Antecedent trigger, consequence delivered, and hypothesized behavioral function for each incident.`
    };

    dataCollectionPlan = {
      dataFields: [
        'Event # / Timestamp',
        'Count of Strikes',
        'Session Duration (Minutes)',
        'Antecedent Context',
        'Consequence / Replacement Prompted',
        'Intensity (Mild / Moderate / Severe)'
      ],
      responseOptions: ['+1 Tap per discrete occurrence', 'Intensity: Mild / Moderate / Severe', 'ABC Context tags'],
      calculationFormula: `• Session Frequency: Total count of discrete hitting occurrences.\n• Standardized Rate per Hour: (Total Count ÷ Session Duration in Minutes) × 60.`,
      validityRules: `Record every occurrence meeting the operational definition across the full session duration. Exclude accidental contact and socially appropriate high-fives.`,
      sampleRows: [
        { opportunity: 1, context: '09:25 AM — Tablet removed after timer', latencySec: 'Count: 1', metCriterion: 'Rate: 0.5/hr', prompt: 'Escape/Tangible · FCT prompted' },
        { opportunity: 2, context: '10:40 AM — Task demand presented', latencySec: 'Count: 1', metCriterion: 'Rate: 1.0/hr', prompt: 'Escape · Visual schedule reviewed' }
      ],
      sampleSummary: `2 total occurrences across a 120-minute (2.0 hr) session = 1.0 occurrence per hour.`
    };
  } else if (isBreakOrHelpRequest) {
    const isHelp = /\b(help|assistance)\b/i.test(rawGoalText);
    const reqTarget = isHelp ? 'assistance / help' : 'a break';
    targetResponse = `Independently requesting ${reqTarget} using an approved communication modality (${commModality}) without engaging in interfering behavior`;
    cueOrContext = isHelp
      ? 'When encountering a difficult or blocked daily activity / instructional task requiring assistance'
      : 'When presenting with early signs of task fatigue, frustration, or non-preferred demand';
    promptExpectation = 'Independent request prior to adult verbal/gestural/model prompt and in the absence of maladaptive behavior';
    refinedGoalText = `When ${isHelp ? 'assistance is needed during a daily or instructional activity' : 'experiencing task demands or frustration'}, ${who} will independently request ${reqTarget} using an approved modality (${commModality}) without interfering behavior.`;

    operationalDefinition = {
      summary: `Independent functional communication request (mand) for ${reqTarget} via ${commModality} during a valid opportunity, occurring without precursor or maladaptive behavior.`,
      targetResponse: `${who} emits an intelligible vocal phrase (${isHelp ? '"Help please" / "I need help"' : '"Break please" / "I need a break"'}), selects the corresponding icon on an AAC device, or hands the ${isHelp ? 'Help' : 'Break'} card to the clinician within 10 seconds of encountering the opportunity.`,
      onsetCriteria: `Begins when ${who} initiates the vocal word, touches/activates the AAC icon, or picks up and extends the communication card toward the adult.`,
      offsetCriteria: `Ends when the vocal utterance is completed, the AAC voice output plays, or the card is released into the clinician's hand.`,
      episodeRule: `Each natural or contrived situation requiring ${reqTarget} is scored as 1 discrete opportunity.`,
      examples: `• ${who} encounters a tightly closed container, looks at the clinician, and says "Help please" (or taps the AAC Help icon) with a calm body.\n• During a tabletop worksheet, ${who} hands the "Break Please" card to the RBT before screaming or pushing materials.`,
      nonExamples: `• Screaming, throwing materials, or hitting first, and then touching the ${isHelp ? 'Help' : 'Break'} card after an adult prompt.\n• Repeating "Help" or "Break" only after the clinician says "Say '${isHelp ? 'help' : 'break'} please'."`,
      exclusions: `Prompted requests are recorded separately as Prompted (V/G/M/P) and do not count toward the independent numerator. Requests emitted simultaneously with aggression or screaming are scored as non-independent / interfering behavior.`
    };

    measurementPlan = {
      primaryMeasurement: 'percentage_of_opportunities',
      primaryLabel: `Percentage of Opportunities with Independent Request`,
      secondaryMeasurement: 'trial_by_trial',
      secondaryLabel: 'Trial-by-Trial Prompt Level & Modality Tracking',
      rationale: `Requesting ${reqTarget} is an opportunity-bound functional communication skill. Percentage of Opportunities (Independent Requests ÷ Valid Opportunities) accurately reflects how reliably ${who} initiates communication when needed, even when the number of natural opportunities varies across sessions.`,
      whatPrimaryCaptures: `Percentage of valid natural or contrived opportunities in which ${who} requests ${reqTarget} independently without interfering behavior.`,
      whatPrimaryDoesNotCapture: `Which specific prompt level was required on non-independent trials (captured by Secondary Trial-by-Trial prompt level tracking).`,
      whatSecondaryCaptures: `Exact prompt hierarchy level (Independent, Gestural, Verbal, Model, Physical) and communication modality used on each opportunity.`
    };

    dataCollectionPlan = {
      dataFields: [
        'Opportunity #',
        'Activity / Antecedent Context',
        'Response Outcome (Independent / Prompted / No Response / Interfering Behavior)',
        'Prompt Level Used (I, G, V, M, P)',
        'Modality Used (Vocal / AAC / Card)'
      ],
      responseOptions: ['I (Independent)', 'G (Gestural Prompt)', 'V (Verbal Prompt)', 'M (Model Prompt)', 'P (Physical Prompt)', 'N (No Response / Interfering Behavior)'],
      calculationFormula: `• Primary Metric (% Independent Opportunities): (Number of Independent Requests without interfering behavior ÷ Total Valid Opportunities) × 100.\n• Prompted Rate (Tracked Separately): (Number of Prompted Requests ÷ Total Valid Opportunities) × 100.`,
      validityRules: `Only score a valid opportunity when ${who} genuinely needs ${reqTarget} (natural or contrived motivation is present). Prompted responses must be recorded separately from independent responses.`,
      sampleRows: [
        { opportunity: 1, context: 'Tight marker cap during art', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Vocal / AAC — No prompt' },
        { opportunity: 2, context: 'Multi-piece puzzle block', latencySec: 'Prompted (G)', metCriterion: 'No (Prompted)', prompt: 'Gestural point to card' },
        { opportunity: 3, context: 'Zipper stuck on jacket', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Vocal / AAC — No prompt' },
        { opportunity: 4, context: 'Extended tabletop matching demand', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Handed card independently' },
        { opportunity: 5, context: 'Shoe tying / fasteners', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Vocal / AAC — No prompt' }
      ],
      sampleSummary: `4 of 5 valid opportunities independent = 80% Independent Requests · 1 of 5 opportunities required a gestural prompt (20% Prompted).`
    };
  } else if (isTantrumEpisode) {
    targetResponse = 'Observable tantrum episode (crying, screaming above conversational volume, or dropping to floor)';
    cueOrContext = 'Following task demands, transitions, or denied access to tangibles';
    promptExpectation = 'Implement BIP de-escalation protocol and record episode onset/offset';
    refinedGoalText = `${who} will decrease the duration and frequency of tantrum episodes (crying/screaming accompanied by dropping to the floor or posturing) across daily therapy sessions.`;

    operationalDefinition = {
      summary: 'Sustained episode of vocal protest (screaming/crying above conversational level) occurring alone or with dropping to the floor / flailing.',
      targetResponse: `Any episode in which ${who} engages in crying or screaming above normal conversational volume for ≥ 5 seconds, with or without dropping to the floor, stomping, or sweeping materials.`,
      onsetCriteria: `Timer starts when vocal screaming/crying or floor-dropping begins and persists for at least 5 consecutive seconds.`,
      offsetCriteria: `Episode ends when ${who} exhibits a calm vocal tone and body posture with zero target behaviors for 30 consecutive seconds.`,
      episodeRule: `30-second calm-criterion rule: If screaming/crying resumes within 30 seconds, continue timing as the same episode; if ≥ 30 seconds of calm elapse, score any subsequent occurrence as a new episode.`,
      examples: `• When told "iPad is all done," ${who} drops to the carpet and screams loudly for 2 minutes.\n• Crying loudly and kicking legs on the floor when asked to clean up blocks.`,
      nonExamples: `• Quietly whimpering for 2 seconds while continuing to put away toys.\n• Saying "No thank you" or requesting a break card in a conversational voice.`,
      exclusions: `Brief vocal protests lasting under 5 seconds or crying caused by verifiable physical injury/illness are excluded.`
    };

    measurementPlan = {
      primaryMeasurement: 'duration',
      primaryLabel: 'Duration per Episode & Total Session Duration',
      secondaryMeasurement: 'frequency',
      secondaryLabel: 'Episode Count (Frequency of Distinct Episodes)',
      rationale: `Tantrums vary significantly in length; Duration per Episode captures whether de-escalation strategies are shortening episodes, while Episode Frequency tracks how often episodes are triggered.`,
      whatPrimaryCaptures: `Exact duration (seconds/minutes) of each tantrum episode from onset until the 30-second calm offset criterion is met.`,
      whatPrimaryDoesNotCapture: `How many separate times a tantrum started during the day (captured by Secondary Episode Frequency).`,
      whatSecondaryCaptures: `Total count of distinct tantrum episodes across the session.`
    };

    dataCollectionPlan = {
      dataFields: ['Episode #', 'Onset Time', 'Offset Time (after 30s calm)', 'Duration (Seconds / Minutes)', 'Antecedent Trigger', 'Peak Intensity'],
      responseOptions: ['Start/Stop Duration Timer', 'Intensity: Mild / Moderate / Severe'],
      calculationFormula: `• Average Duration per Episode: Total Duration across episodes ÷ Number of episodes.\n• Total Session Duration: Sum of all episode durations.`,
      validityRules: `Apply the 30-second calm offset rule consistently across all observers.`,
      sampleRows: [
        { opportunity: 1, context: '10:15 AM — Transition from iPad to table', latencySec: '140s (2m 20s)', metCriterion: 'Episode #1', prompt: 'Moderate · FCT Break prompted' },
        { opportunity: 2, context: '11:30 AM — Group clean-up cue', latencySec: '60s (1m 00s)', metCriterion: 'Episode #2', prompt: 'Mild · Visual timer used' }
      ],
      sampleSummary: `2 episodes recorded · Total duration = 200 seconds (3m 20s) · Average duration = 100 seconds per episode.`
    };
  } else if (isTaskAnalysisRoutine) {
    targetResponse = 'Completing each chained step of the functional daily routine independently';
    cueOrContext = 'Upon natural routine cue (e.g., entering bathroom/sink area or receiving routine instruction)';
    promptExpectation = 'Least-to-most prompting per step in the task analysis chain';
    refinedGoalText = `${who} will independently complete the steps of the target routine (${rawGoalText || 'functional daily living routine'}) according to the task analysis.`;

    operationalDefinition = {
      summary: 'Independent completion of each sequential step in the defined task analysis within 5 seconds of the natural cue or completion of the previous step.',
      targetResponse: `${who} performs each component step of the routine in sequence without requiring verbal, gestural, model, or physical prompts from the clinician.`,
      onsetCriteria: `Routine begins when the clinician delivers the initial instruction (e.g., "Wash your hands") at the routine location.`,
      offsetCriteria: `Routine ends when the final step of the task analysis is completed or the clinician completes remaining steps via error correction.`,
      episodeRule: `Each full routine presentation counts as 1 task-analysis probe across all defined steps.`,
      examples: `• Turning on faucet, wetting hands, applying soap, scrubbing for 10s, rinsing, turning off faucet, and drying hands independently.`,
      nonExamples: `• Waiting for the RBT to point to the soap dispenser or physically guide hands under water.`,
      exclusions: `Steps skipped due to environmental unavailability (e.g., empty paper towel dispenser) are marked N/A.`
    };

    measurementPlan = {
      primaryMeasurement: 'task_analysis',
      primaryLabel: 'Task Analysis (% of Steps Completed Independently)',
      secondaryMeasurement: 'duration',
      secondaryLabel: 'Total Routine Duration (optional)',
      rationale: `Multi-step routines consist of chained behaviors; Task Analysis recording tracks mastery of each individual step and calculates the exact percentage of steps performed independently.`,
      whatPrimaryCaptures: `Step-by-step independence and prompt level required for every step in the routine chain.`,
      whatPrimaryDoesNotCapture: `Total time spent completing the routine (optional Secondary Duration).`,
      whatSecondaryCaptures: `Elapsed time from routine initiation to completion.`
    };

    dataCollectionPlan = {
      dataFields: ['Step #', 'Task Analysis Step Description', 'Outcome (+ Independent / - Prompted)', 'Prompt Level Used'],
      responseOptions: ['I (Independent)', 'V (Verbal)', 'G (Gestural)', 'M (Model)', 'PP (Partial Physical)', 'P (Full Physical)'],
      calculationFormula: `(% Independent Steps) = (Number of Steps Completed Independently ÷ Total Applicable Steps in Chain) × 100.`,
      validityRules: `Score each step in sequence; record the most intrusive prompt required for any non-independent step.`,
      sampleRows: [
        { opportunity: 1, context: 'Step 1: Turn on water & wet hands', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'None' },
        { opportunity: 2, context: 'Step 2: Pump soap onto hands', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'None' },
        { opportunity: 3, context: 'Step 3: Rub hands together 10s', latencySec: 'Prompted (M)', metCriterion: 'No', prompt: 'Model prompt' },
        { opportunity: 4, context: 'Step 4: Rinse & turn off faucet', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'None' },
        { opportunity: 5, context: 'Step 5: Dry hands with towel', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'None' }
      ],
      sampleSummary: `4 of 5 steps completed independently = 80% Task Analysis Independence.`
    };
  } else if (isEngagementOrSeat) {
    targetResponse = 'Remaining seated / actively engaged with assigned instructional materials or group activity';
    cueOrContext = 'During structured group instruction or independent work intervals';
    promptExpectation = 'Independent sustained engagement across observation intervals';
    refinedGoalText = `${who} will remain actively engaged/seated during structured instructional intervals.`;

    operationalDefinition = {
      summary: 'Sustained orientation toward the instructor/materials while remaining in the designated seat or activity area.',
      targetResponse: `${who}'s body remains in the designated chair/carpet spot with eyes oriented toward the teacher/materials or hands actively manipulating assigned task materials.`,
      onsetCriteria: `Scored at the start of the interval (Whole-Interval) or at the exact end-of-interval check (Momentary Time Sampling).`,
      offsetCriteria: `Engagement breaks if ${who} leaves the seat/area for >3 seconds or engages in off-task behavior.`,
      episodeRule: `Session observation is divided into equal fixed intervals (e.g., 1-minute or 2-minute intervals).`,
      examples: `• Sitting on the circle-time mat looking at the storybook or answering group questions when the interval timer chimes.`,
      nonExamples: `• Standing up and wandering to the window or lying flat on the floor away from the group.`,
      exclusions: `Leaving seat with clinician permission (e.g., bathroom or scheduled sensory break) is excluded from interval scoring.`
    };

    measurementPlan = {
      primaryMeasurement: 'mts',
      primaryLabel: 'Momentary Time Sampling (MTS) / Whole-Interval Recording',
      secondaryMeasurement: 'duration',
      secondaryLabel: 'Total Continuous Duration Engaged',
      rationale: `Ongoing states such as remaining seated or engaged across group activities are efficiently and reliably sampled at fixed interval checks using Momentary Time Sampling (MTS) or Whole-Interval Recording.`,
      whatPrimaryCaptures: `Percentage of fixed time intervals in which ${who} is actively engaged/seated.`,
      whatPrimaryDoesNotCapture: `Exact cumulative seconds between interval checks (use Continuous Duration if exact seconds are required).`,
      whatSecondaryCaptures: `Total continuous elapsed time engaged prior to leaving the activity.`
    };

    dataCollectionPlan = {
      dataFields: ['Interval #', 'Interval Length', 'Observed Engaged (+ / -)', 'Notes / Context'],
      responseOptions: ['+ (Engaged at check)', '- (Not engaged at check)'],
      calculationFormula: `(% Engaged Intervals) = (Number of '+' Intervals ÷ Total Observed Intervals) × 100.`,
      validityRules: `For MTS, score '+' only if target engagement is occurring at the exact moment the interval timer chimes.`,
      sampleRows: [
        { opportunity: 1, context: 'Interval 1 (2 min) — Morning Circle', latencySec: '+ (Engaged)', metCriterion: 'Yes', prompt: 'Seated, looking at book' },
        { opportunity: 2, context: 'Interval 2 (2 min) — Morning Circle', latencySec: '+ (Engaged)', metCriterion: 'Yes', prompt: 'Participating in song' },
        { opportunity: 3, context: 'Interval 3 (2 min) — Group Art', latencySec: '- (Off-task)', metCriterion: 'No', prompt: 'Left seat briefly' },
        { opportunity: 4, context: 'Interval 4 (2 min) — Group Art', latencySec: '+ (Engaged)', metCriterion: 'Yes', prompt: 'Coloring worksheet' },
        { opportunity: 5, context: 'Interval 5 (2 min) — Group Art', latencySec: '+ (Engaged)', metCriterion: 'Yes', prompt: 'Handing markers' }
      ],
      sampleSummary: `4 of 5 intervals scored '+' = 80% Engaged Intervals.`
    };
  } else {
    // General Skill Acquisition DTT / Opportunity goal
    targetResponse = rawGoalText || 'Emitting the specified observable target skill response';
    cueOrContext = 'When presented with the discriminative stimulus (SD) or natural environmental opportunity';
    promptExpectation = 'Independent response within 5 seconds of the SD prior to clinician prompting';
    refinedGoalText = rawGoalText
      ? (vagueFlags.length ? `${who} will demonstrate an observable, measurable response for [${rawGoalText}] within 5 seconds of the clinician's cue.` : rawGoalText)
      : `${who} will independently emit the target skill response within 5 seconds of the clinician's discriminative stimulus (SD).`;

    operationalDefinition = {
      summary: `Observable, measurable execution of the target skill (${rawGoalText || 'target objective'}) following the clinician's discriminative stimulus (SD) or natural cue.`,
      targetResponse: `When presented with the instructional cue or opportunity, ${who} emits the defined observable vocal, motor, or selection response within 5 seconds without adult prompting.`,
      onsetCriteria: `Opportunity window starts immediately upon completion of the clinician's instruction/SD. Response onset is the start of ${who}'s vocal or motor response.`,
      offsetCriteria: `Trial ends when ${who} completes the target response or after 5 seconds of no response / error.`,
      episodeRule: `Each discrete instructional presentation (trial) or natural opportunity counts as 1 trial.`,
      examples: `• Clinician presents the target SD and ${who} responds accurately within 5 seconds without prompts.`,
      nonExamples: `• Responding only after a verbal, gestural, model, or physical prompt, or emitting an incorrect response.`,
      exclusions: `Trials interrupted by external environmental distractions where ${who} was not attending to the SD are discarded and re-presented.`
    };

    measurementPlan = {
      primaryMeasurement: 'trial_by_trial',
      primaryLabel: 'Trial-by-Trial Recording (% Independent across Trials)',
      secondaryMeasurement: 'percentage_of_opportunities',
      secondaryLabel: 'Percentage of Opportunities (Prompted vs. Independent Breakdown)',
      rationale: `Discrete skill-acquisition objectives are best measured via Trial-by-Trial recording, capturing both accuracy (Independent vs. Incorrect) and exact prompt hierarchy levels across structured or naturalistic teaching trials.`,
      whatPrimaryCaptures: `Trial-by-trial independence and prompt hierarchy level across each instructional presentation.`,
      whatPrimaryDoesNotCapture: `Free-operant spontaneous frequency outside of presented trials (track spontaneous occurrences separately if needed).`,
      whatSecondaryCaptures: `Overall session percentage of independent vs. prompted responses.`
    };

    dataCollectionPlan = {
      dataFields: ['Trial #', 'Instructional Cue / SD', 'Learner Outcome (I, V, G, Vi, M, PP, P, INC, N)', 'Notes'],
      responseOptions: ['I (Independent)', 'V (Verbal)', 'G (Gestural)', 'Vi (Visual)', 'M (Model)', 'PP (Partial Physical)', 'P (Full Physical)', 'INC (Incorrect)', 'N (No Response)'],
      calculationFormula: `(% Independent) = (Number of Independent 'I' Trials ÷ Total Valid Trials Presented) × 100.`,
      validityRules: `Ensure learner is attending before delivering the SD. Record the most intrusive prompt needed if not independent.`,
      sampleRows: [
        { opportunity: 1, context: 'Trial 1 — Target SD presented', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Independent' },
        { opportunity: 2, context: 'Trial 2 — Target SD presented', latencySec: 'Prompted (G)', metCriterion: 'No', prompt: 'Gestural prompt' },
        { opportunity: 3, context: 'Trial 3 — Target SD presented', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Independent' },
        { opportunity: 4, context: 'Trial 4 — Target SD presented', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Independent' },
        { opportunity: 5, context: 'Trial 5 — Target SD presented', latencySec: 'Independent (I)', metCriterion: 'Yes', prompt: 'Independent' }
      ],
      sampleSummary: `4 of 5 trials independent = 80% Independent Responding.`
    };
  }

  // 4. Mastery Criterion Safeguard (Do NOT silently invent mastery criteria when missing; label as DRAFT suggestion requiring BCBA review)
  const statedCriterion = input.masteryCriteria
    ? String(input.masteryCriteria).trim()
    : (pctMatch || sessionsMatch)
      ? `${pctMatch ? pctMatch[0] : '80%'} ${sessionsMatch ? sessionsMatch[0] : 'across 3 consecutive sessions'}`.trim()
      : null;

  let suggestedCriterion = statedCriterion;
  if (!suggestedCriterion) {
    if (isTransitionLatency) {
      suggestedCriterion = `[DRAFT SUGGESTION — Requires BCBA Selection]: Initiate movement within ${secVal || 5} seconds across ≥ 80% of transition opportunities across 3 consecutive sessions.`;
    } else if (isReductionGoal) {
      suggestedCriterion = `[DRAFT SUGGESTION — Requires BCBA Selection]: Reduce target behavior by ≥ 80% from baseline rate (or ≤ 1 occurrence per session) across 3 consecutive weeks.`;
    } else {
      suggestedCriterion = `[DRAFT SUGGESTION — Requires BCBA Selection]: ≥ 80% independent responding across 3 consecutive sessions across at least 2 settings/clinicians.`;
    }
  }

  masteryRecommendation = {
    hasExplicitCriterion,
    statedCriterion,
    suggestedCriterion,
    isDraftSuggestion: !hasExplicitCriterion,
    requiresClinicianConfirmation: !hasExplicitCriterion,
    suggestedBaseline: input.baselineData || (isTransitionLatency ? 'Mean latency 15s across 3 baseline sessions' : isReductionGoal ? '3.0 occurrences/hr across 3 baseline sessions' : '20% independent across 3 baseline sessions'),
    suggestedTargetPct: pctMatch ? parseInt(pctMatch[1], 10) : 80,
    suggestedSessions: sessionsMatch ? parseInt(sessionsMatch[1], 10) : 3,
    safeguardNotice: hasExplicitCriterion
      ? 'Mastery criterion was explicitly stated in the clinician input; verify alignment with clinic protocol before activation.'
      : 'No mastery criterion was stated in the initial goal text. Per clinical guardrails, the system does NOT silently lock in a criterion—the suggested criterion above is a DRAFT template that the BCBA must review, edit, or confirm.'
  };

  // Normalize operationalDefinition examples/nonExamples to arrays so both .join() and .some() work seamlessly
  const splitList = (val) => Array.isArray(val) ? val : String(val || '').split(/\n|;/).map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
  operationalDefinition.examples = splitList(operationalDefinition.examples);
  operationalDefinition.nonExamples = splitList(operationalDefinition.nonExamples);
  operationalDefinition.exclusions = splitList(operationalDefinition.exclusions);

  // Add normalized aliases on measurementPlan
  measurementPlan.primaryKey = measurementPlan.primaryMeasurement;
  measurementPlan.primaryMethod = measurementPlan.primaryLabel;
  measurementPlan.secondaryKey = measurementPlan.secondaryMeasurement;
  measurementPlan.secondaryMethod = measurementPlan.secondaryLabel;

  const isClear = vagueFlags.length === 0 && rawGoalText.length >= 10;
  const qualityScore = Math.max(25, Math.min(100, 100 - vagueFlags.length * 25 - (clarifyingQuestions.length * 10)));
  const normalizedFlags = vagueFlags.map(f => typeof f === 'string' ? { term: rawGoalText, issue: f } : f);

  const clarityObj = {
    isClear,
    qualityScore,
    who,
    targetResponse,
    cueOrContext,
    timeframe: timeframe || 'Not specified (consider adding response window if latency/initiation matters)',
    promptExpectation,
    statedCriterion: statedCriterion || 'None stated in input (see Draft Mastery Suggestion)',
    vagueFlags: normalizedFlags,
    clarifyingQuestions,
    refinedGoalText
  };

  return {
    rawGoalText,
    refinedGoalText,
    goalType: inferredGoalType,
    domain: inferredDomain,
    clarityCheck: clarityObj,
    qualityCheck: clarityObj,
    operationalDefinition,
    measurementPlan,
    dataCollectionPlan,
    masteryRecommendation,
    traceability: {
      findingId,
      findingText: findingText || null,
      status: 'draft',
      requiresBcbaApproval: true
    }
  };
}

function organizeSkillGapsFromFindings(findings = [], clientName = 'Learner', communicationModality = 'Vocal / AAC') {
  if (!Array.isArray(findings) || !findings.length) {
    return {
      totalFindings: 0,
      suggestions: [],
      supportedInstruments: ASSESSMENT_REFERENCE_LIBRARY,
      guardrailNotice: 'No clinician-entered assessment findings found. Enter verified assessment findings first; the system never fabricates assessment scores or infers unassessed domains.'
    };
  }

  const suggestions = findings.map((f) => {
    const text = String(f.finding_text || '').trim();
    const domain = String(f.domain || 'General Assessment').trim();
    const assessmentName = String(f.assessment_name || 'Clinical Assessment').trim();
    const lower = `${domain} ${text}`.toLowerCase();

    let skillGapSummary = '';
    let candidateGoalDirection = '';
    let suggestedGoalText = '';
    let recommendedPrimaryMeasurement = 'percentage_of_opportunities';
    let clarifyingQuestions = [];

    if (/\b(break|protest|escape|frustrat|remov|tolerat)\b/i.test(lower)) {
      skillGapSummary = `Functional communication gap for requesting a break / protesting appropriately during challenging or non-preferred activities (${domain}).`;
      candidateGoalDirection = `Teach independent functional communication (mand) to request a break without interfering vocal protest or refusal behavior.`;
      suggestedGoalText = `When experiencing task demands or frustration, ${clientName} will independently request a break using an approved communication modality (${communicationModality}) without interfering behavior.`;
      recommendedPrimaryMeasurement = 'percentage_of_opportunities';
      clarifyingQuestions = [
        `What communication modality does ${clientName} currently use (${communicationModality})?`,
        'Across which activities or settings should break requests be tracked?',
        'How will independent vs. prompted requests be distinguished?'
      ];
    } else if (/\b(transition|initiate\s+movement|line\s+up|next\s+activity|clean\s+up|delay\s+after\s+cue)\b/i.test(lower)) {
      skillGapSummary = `Delayed initiation of physical transitions between activities following adult or schedule cues (${domain}).`;
      candidateGoalDirection = `Decrease transition latency and increase percentage of transitions initiated within the target response window.`;
      suggestedGoalText = `${clientName} will initiate movement toward the next activity within 5 seconds of a transition cue.`;
      recommendedPrimaryMeasurement = 'latency';
      clarifyingQuestions = [
        'What specific transition cues are delivered (verbal cue, visual schedule card, timer)?',
        'Does looking at the therapist count, or must physical movement toward the next location begin within 5 seconds?'
      ];
    } else if (/\b(help|assist|blocked|open\s+container|fastener)\b/i.test(lower)) {
      skillGapSummary = `Skill gap in independently requesting assistance when encountering blocked or difficult tasks (${domain}).`;
      candidateGoalDirection = `Teach independent mands for help/assistance across daily routines and instructional tasks.`;
      suggestedGoalText = `When assistance is needed during a daily activity, ${clientName} will independently request help using an approved communication modality (${communicationModality}).`;
      recommendedPrimaryMeasurement = 'percentage_of_opportunities';
      clarifyingQuestions = [
        'Which specific communication forms (vocal "Help please", AAC icon, card exchange) count as independent?',
        'Will opportunities be natural, contrived, or both?'
      ];
    } else if (/\b(wash\s+hands|handwashing|tooth|dressing|toileting|grooming|daily\s+living|routine)\b/i.test(lower)) {
      skillGapSummary = `Prompt dependence across multi-step functional daily living routine steps (${domain}).`;
      candidateGoalDirection = `Increase independent step completion across the chained daily living routine using structured Task Analysis prompting.`;
      suggestedGoalText = `${clientName} will independently complete the steps of the ${domain.toLowerCase()} routine according to the task analysis.`;
      recommendedPrimaryMeasurement = 'task_analysis';
      clarifyingQuestions = [
        'How many steps are in the clinic/home task analysis chain?',
        'Which chaining procedure (total task, forward chaining, backward chaining) will the BCBA prescribe?'
      ];
    } else if (/\b(peer|social|turn|play|greet|interactive)\b/i.test(lower)) {
      skillGapSummary = `Emerging peer social reciprocity / turn-taking skill gap identified in ${domain}.`;
      candidateGoalDirection = `Increase independent peer responses (greeting, turn-taking, or item sharing) across natural peer opportunities.`;
      suggestedGoalText = `During structured peer play, ${clientName} will independently take turns and respond to peer initiations within 5 seconds across opportunities.`;
      recommendedPrimaryMeasurement = 'percentage_of_opportunities';
      clarifyingQuestions = [
        'Which exact observable peer response (greeting, handing a toy, waiting for turn) is targeted first?',
        'What adult prompt hierarchy will be used if the learner does not respond within 5 seconds?'
      ];
    } else {
      skillGapSummary = `Clinician-identified support need in ${domain}: "${text}"`;
      candidateGoalDirection = `Establish an observable, measurable acquisition objective addressing ${domain} based on verified assessment finding #${f.id || 'N/A'}.`;
      suggestedGoalText = `${clientName} will independently demonstrate the target ${domain.toLowerCase()} skill ("${text.slice(0, 70)}") within 5 seconds of the instructional cue.`;
      recommendedPrimaryMeasurement = 'trial_by_trial';
      clarifyingQuestions = [
        'What is the exact discriminative stimulus (SD) or natural cue presented to the learner?',
        'What observable physical or vocal action counts as an independent response?'
      ];
    }

    if (f.missing_info_flag) {
      clarifyingQuestions.unshift(`Missing Assessment Detail Flagged: ${f.missing_info_flag}`);
    }

    const traceabilityStr = `100% Traceable to Clinician Finding #${f.id || 'New'} (${assessmentName} · ${domain})`;
    return {
      findingId: f.id,
      assessmentId: f.assessment_id || null,
      assessmentName,
      instrumentName: assessmentName,
      domain,
      findingText: text,
      resultValue: f.result_value || 'Narrative finding',
      scoreOrLevel: f.result_value || 'Narrative finding',
      evidenceSource: f.evidence_source || 'Clinician-entered assessment record',
      context: f.context || 'Clinic / Home',
      supportNeeds: f.support_needs || 'Requires prompting',
      priorityStatus: f.priority_status || 'priority_goal',
      goalType: 'skill_acquisition',
      skillGapSummary,
      candidateGoalDirection,
      operationalDefinitionSummary: candidateGoalDirection,
      suggestedGoalText,
      suggestedGoalStatement: suggestedGoalText,
      recommendedPrimaryMeasurement,
      recommendedSecondaryMeasurement: recommendedPrimaryMeasurement === 'latency' ? 'percentage_of_opportunities' : 'trial_by_trial',
      suggestedMasteryCriterion: '80% across 3 consecutive sessions [DRAFT — Requires BCBA Selection]',
      clarifyingQuestions,
      traceabilityNotice: traceabilityStr,
      traceability: traceabilityStr
    };
  });

  return {
    totalFindings: findings.length,
    suggestions,
    supportedInstruments: ASSESSMENT_REFERENCE_LIBRARY,
    guardrailNotice: 'All suggestions are strictly derived from clinician-entered findings. No assessment scores were fabricated or inferred for unassessed domains. BCBA review and approval required.'
  };
}

// ============================================================================
// AUTO-POPULATED ASSESSMENT & CLINICAL PROGRESS REPORT TEMPLATES
// Directly implements the 4 uploaded RBT Sepia specifications:
//   1. RBT_Sepia_Smart_Goal_Builder.pdf
//   2. RBT_Sepia_Assessment_Reference_Library.pdf
//   3. RBT_Sepia_ABA_Assessment_Clinical_Planning_Developer_Specification.pdf
//   4. RBT_Sepia_Smart_Measurement_Assistant.docx
// ============================================================================

const ASSESSMENT_DOMAIN_TEMPLATES = {
  vbmapp: {
    id: 'vbmapp',
    name: 'VB-MAPP',
    fullName: 'VB-MAPP — Verbal Behavior Milestones Assessment and Placement Program',
    domains: [
      {
        domain: 'Requests (Mands)',
        defaultFindingPrompt: 'Requests preferred items when visible; needs support to independently request a break or assistance during challenging tasks.',
        defaultResult: 'Milestone Level 1–2 Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently request a break or assistance using an approved communication modality across 80% of opportunities across 3 consecutive sessions.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Tact (Labeling)',
        defaultFindingPrompt: 'Labels common familiar objects; emerging labeling of actions and emotion picture cards.',
        defaultResult: 'Milestone Level 2 Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently label (tact) 10 target action or emotion pictures within 5 seconds of presentation across 80% of trials.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Listener Responding (Following Directions)',
        defaultFindingPrompt: 'Follows 1-step familiar instructions; requires gestural prompts for 2-step classroom or routine directions.',
        defaultResult: 'Milestone Level 2 Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently follow 2-step routine instructions within 5 seconds across 80% of opportunities.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Social Behavior & Social Play',
        defaultFindingPrompt: 'Engages in parallel play near peers; requires adult prompting to take turns or respond to peer initiations.',
        defaultResult: 'Milestone Level 1–2 Summary (Clinician-Entered)',
        sampleGoal: 'During structured peer play, {client} will independently take turns and respond to peer initiations within 5 seconds across 80% of opportunities.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Classroom Routines & Group Skills',
        defaultFindingPrompt: 'Delays initiating movement when transitioning between preferred play and group/table instruction.',
        defaultResult: 'Transition & Group Readiness Summary (Clinician-Entered)',
        sampleGoal: '{client} will initiate movement toward the next activity within 5 seconds of a transition cue.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Barriers Assessment (Vocal Protest / Escape)',
        defaultFindingPrompt: 'Exhibits vocal protest or task refusal when presented with non-preferred transitions or difficult demands.',
        defaultResult: 'Barrier Summary (Clinician-Entered)',
        sampleGoal: '{client} will decrease vocal protest and task refusal episodes while increasing functional break requests.',
        goalType: 'behavior_reduction'
      }
    ]
  },
  abllsr: {
    id: 'abllsr',
    name: 'ABLLS-R',
    fullName: 'ABLLS-R — Assessment of Basic Language and Learning Skills – Revised',
    domains: [
      {
        domain: 'A. Cooperation & Reinforcer Effectiveness',
        defaultFindingPrompt: 'Responds to token board reinforcement; requires visual schedule cues during task transitions.',
        defaultResult: 'Criterion Summary (Clinician-Entered)',
        sampleGoal: '{client} will initiate movement toward the next scheduled task within 5 seconds of a transition cue.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'C. Receptive Language',
        defaultFindingPrompt: 'Identifies common objects and body parts; building fluency with multi-step receptive instructions.',
        defaultResult: 'Criterion Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently follow 2-step receptive instructions within 5 seconds across 80% of trials.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'D. Motor Imitation',
        defaultFindingPrompt: 'Imitates single gross-motor movements; emerging 2-step motor imitation with objects.',
        defaultResult: 'Criterion Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently imitate 2-step motor actions within 5 seconds of the "Do this" cue across 80% of trials.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'F. Requests (Mands)',
        defaultFindingPrompt: 'Requests visible tangibles; requires prompting to request help or a break when frustrated.',
        defaultResult: 'Criterion Summary (Clinician-Entered)',
        sampleGoal: 'When assistance is needed during a daily activity, {client} will independently request help using an approved communication modality across 80% of opportunities.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'L. Social Interaction',
        defaultFindingPrompt: 'Requires gestural/verbal prompts to wait for a turn during tabletop games.',
        defaultResult: 'Criterion Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently wait for a turn and exchange play materials with a peer across 80% of opportunities.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'U/V/W. Self-Help & Grooming (Handwashing)',
        defaultFindingPrompt: 'Completes 4 of 6 handwashing task analysis steps independently; requires prompting to scrub with soap and dry hands.',
        defaultResult: '67% Task Analysis Steps Independent (4/6)',
        sampleGoal: '{client} will independently complete all steps of the handwashing routine according to the task analysis.',
        goalType: 'skill_acquisition'
      }
    ]
  },
  afls: {
    id: 'afls',
    name: 'AFLS',
    fullName: 'AFLS — Assessment of Functional Living Skills',
    domains: [
      {
        domain: 'Basic Living — Self-Management & Coping',
        defaultFindingPrompt: 'Requires adult countdown timer and FCT card prompt to tolerate task transitions without vocal protest.',
        defaultResult: 'Functional Skill Summary (Clinician-Entered)',
        sampleGoal: 'When a break is needed during an activity, {client} will independently request a break using their established communication method.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Basic Living — Basic Communication',
        defaultFindingPrompt: 'Inconsistently requests assistance when encountering blocked containers, zippers, or materials.',
        defaultResult: 'Functional Skill Summary (Clinician-Entered)',
        sampleGoal: 'When assistance is needed during a daily activity, {client} will independently request help using an approved communication modality.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Basic Living — Grooming & Personal Hygiene',
        defaultFindingPrompt: 'Requires model/gestural prompts on middle steps of handwashing and backpack unpacking routines.',
        defaultResult: 'Task Analysis Baseline Summary (Clinician-Entered)',
        sampleGoal: '{client} will independently complete the steps of the daily hygiene / handwashing routine according to the task analysis.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'School Skills — Classroom Routines & Transitions',
        defaultFindingPrompt: 'Delays 12–20 seconds after transition cues before standing and moving toward the next classroom station.',
        defaultResult: 'Transition Latency Probe Summary (Clinician-Entered)',
        sampleGoal: '{client} will initiate movement toward the next activity within 5 seconds of a transition cue.',
        goalType: 'skill_acquisition'
      }
    ]
  },
  efl: {
    id: 'efl',
    name: 'Essential for Living (EFL)',
    fullName: 'Essential for Living (EFL) — Functional Communication & Essential Eight',
    domains: [
      {
        domain: 'Essential Skill 1: Making Requests (Mands)',
        defaultFindingPrompt: 'When assistance is needed during a daily activity, learner whines rather than independently requesting help or a break.',
        defaultResult: 'Essential Eight Probe Summary (Clinician-Entered)',
        sampleGoal: 'When assistance is needed during a daily activity, {client} will independently request help using an approved communication modality.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Essential Skill 2: Waiting After a Request',
        defaultFindingPrompt: 'Protests vocally within 3–5 seconds when told "wait" for a requested item or turn.',
        defaultResult: 'Essential Eight Probe Summary (Clinician-Entered)',
        sampleGoal: '{client} will remain calm while waiting for a requested item or turn across 80% of opportunities.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Essential Skill 3: Accepting Removals & Transitions',
        defaultFindingPrompt: 'Following a transition cue from preferred play to table work, learner delays 15–30 seconds before initiating movement.',
        defaultResult: 'Mean baseline transition latency: 18 seconds (20% ≤ 5s)',
        sampleGoal: '{client} will initiate movement toward the next activity within 5 seconds of a transition cue.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Essential Skill 4: Completing Required Brief Tasks',
        defaultFindingPrompt: 'Requires frequent token reinforcement to remain engaged during brief structured tabletop tasks.',
        defaultResult: 'Essential Eight Probe Summary (Clinician-Entered)',
        sampleGoal: '{client} will remain actively engaged and seated during brief structured instructional intervals.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Problem Behavior Tracking (Aggression / Tantrums)',
        defaultFindingPrompt: 'Engages in vocal protest, tantrums, or hitting when preferred items are removed or demands are presented.',
        defaultResult: 'Baseline Behavior Rate Recorded (Clinician-Entered)',
        sampleGoal: '{client} will decrease hitting and tantrum behavior across daily therapy sessions.',
        goalType: 'behavior_reduction'
      }
    ]
  },
  vineland3: {
    id: 'vineland3',
    name: 'Vineland-3',
    fullName: 'Vineland-3 — Vineland Adaptive Behavior Scales, Third Edition',
    domains: [
      {
        domain: 'Communication Domain (Receptive & Expressive)',
        defaultFindingPrompt: 'Expressive & receptive communication skills require structured ABA support for functional requests and following multi-step directions.',
        defaultResult: 'Clinician-Entered Domain Summary',
        sampleGoal: 'When a break or assistance is needed, {client} will independently request help or a break using an established communication modality.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Daily Living Skills Domain (Personal & School/Home)',
        defaultFindingPrompt: 'Requires step-by-step prompting for multi-step personal hygiene and classroom transition routines.',
        defaultResult: 'Clinician-Entered Domain Summary',
        sampleGoal: '{client} will independently complete the steps of the daily handwashing and transition routine.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Socialization Domain (Interpersonal & Play/Leisure)',
        defaultFindingPrompt: 'Emerging peer turn-taking and coping skills during shared play activities.',
        defaultResult: 'Clinician-Entered Domain Summary',
        sampleGoal: 'During structured peer play, {client} will independently take turns and respond to peer initiations within 5 seconds.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Motor Skills Domain (Fine & Gross Motor)',
        defaultFindingPrompt: 'Demonstrates age-appropriate gross motor navigation; requires fine-motor support for fasteners, utensils, and writing tools.',
        defaultResult: 'Clinician-Entered Domain Summary',
        sampleGoal: '{client} will independently manipulate fasteners and classroom utensils across 80% of daily opportunities.',
        goalType: 'skill_acquisition'
      },
      {
        domain: 'Maladaptive Behavior Domain',
        defaultFindingPrompt: 'Externalizing behaviors (vocal protest, tantrums, or hitting) interfere with instructional participation during transitions.',
        defaultResult: 'Clinician-Entered Domain Summary',
        sampleGoal: '{client} will decrease tantrum and hitting episodes while utilizing functional communication replacement skills.',
        goalType: 'behavior_reduction'
      }
    ]
  },
  peak: {
    id: 'peak',
    name: 'PEAK (Later Phase)',
    fullName: 'PEAK — Promoting the Emergence of Advanced Knowledge (Later Phase Reference)',
    domains: [
      {
        domain: 'Direct Training & Foundational Verbal Operants',
        defaultFindingPrompt: 'Reference catalog entry (Later Phase expansion). Clinicians may link foundational DTT goals.',
        defaultResult: 'Later Phase Reference Metadata',
        sampleGoal: '{client} will independently emit target verbal and listener responses across structured teaching trials.',
        goalType: 'skill_acquisition'
      }
    ]
  }
};

function generateAssessmentReportTemplate({
  client,
  templateId = 'all',
  settingFilter = 'ALL',
  goals = [],
  assessments = [],
  assessmentFindings = [],
  smartGoalDrafts = [],
  behaviorPrograms = [],
  behaviorEvents = [],
  abcLogs = [],
  auths = [],
  supervision = {}
}) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cName = (client && client.name) || 'Learner';
  const commMod = (client && client.communication) || 'Vocal / AAC / PECS';
  const normTemplate = String(templateId || 'all').toLowerCase();

  // Determine which template frameworks to include
  const activeTemplates = normTemplate === 'all'
    ? [ASSESSMENT_DOMAIN_TEMPLATES.vbmapp, ASSESSMENT_DOMAIN_TEMPLATES.abllsr, ASSESSMENT_DOMAIN_TEMPLATES.afls, ASSESSMENT_DOMAIN_TEMPLATES.efl, ASSESSMENT_DOMAIN_TEMPLATES.vineland3]
    : [ASSESSMENT_DOMAIN_TEMPLATES[normTemplate] || ASSESSMENT_DOMAIN_TEMPLATES.vbmapp];

  const resolveInstId = (nameOrId = '') => {
    const s = String(nameOrId || '').toLowerCase();
    if (s.includes('vb-mapp') || s.includes('vbmapp')) return 'vbmapp';
    if (s.includes('ablls')) return 'abllsr';
    if (s.includes('afls')) return 'afls';
    if (s.includes('essential') || s === 'efl') return 'efl';
    if (s.includes('vineland')) return 'vineland3';
    if (s.includes('peak')) return 'peak';
    return 'vbmapp';
  };

  // Build auto-populated domain rows
  const domainRows = [];
  const usedGoalIds = new Set();
  const usedFindingIds = new Set();

  // First include all actual clinician-entered findings so 100% of real client evidence appears at the top
  assessmentFindings.forEach((f) => {
    const fInstId = resolveInstId(f.instrument_id || f.assessment_ref_id || f.assessment_name || 'vbmapp');
    if (normTemplate !== 'all' && fInstId !== normTemplate) {
      return;
    }
    usedFindingIds.add(f.id);
    const linkedGoal = goals.find((g) => Number(g.linked_finding_id) === Number(f.id)) ||
      goals.find((g) => (g.domain || '').toLowerCase().includes((f.domain || '').toLowerCase().split(' ')[0])) ||
      null;
    if (linkedGoal) usedGoalIds.add(linkedGoal.id);

    const linkedDraft = smartGoalDrafts.find((d) => Number(d.finding_id) === Number(f.id)) || null;
    const goalStatement = linkedGoal
      ? linkedGoal.title
      : linkedDraft
        ? (linkedDraft.refined_goal_text || linkedDraft.raw_goal_text)
        : `${cName} will independently demonstrate ${f.domain} skills ("${f.finding_text.slice(0, 65)}") across 80% of opportunities.`;

    const smartPlan = analyzeSmartGoal({
      rawGoalText: goalStatement,
      clientName: cName,
      communicationModality: commMod,
      domain: f.domain,
      findingId: f.id,
      findingText: f.finding_text
    });

    const totalTrials = linkedGoal ? (linkedGoal.total_trials || 0) : 0;
    const indepPct = linkedGoal ? (linkedGoal.current ?? linkedGoal.indep_pct ?? linkedGoal.baseline ?? 20) : null;
    const numDenom = linkedGoal ? (linkedGoal.indep_num_denom || `${Math.round((totalTrials * (indepPct || 0)) / 100)}/${totalTrials || 5}`) : '4/5 (Sample / Baseline Probe)';
    const seriesLen = linkedGoal && Array.isArray(linkedGoal.series) ? linkedGoal.series.length : 0;
    const dCode = String(f.domain || 'domain').toLowerCase().replace(/[^a-z0-9]+/g, '_');

    domainRows.push({
      rowId: `finding-${f.id}`,
      instrumentId: fInstId,
      instrumentName: f.assessment_name || (ASSESSMENT_DOMAIN_TEMPLATES[fInstId] && ASSESSMENT_DOMAIN_TEMPLATES[fInstId].name) || 'Clinical Assessment',
      domain: f.domain || 'Clinical Domain',
      domainCode: dCode,
      domainGroup: f.assessment_name || 'Clinician Assessment',
      goalType: (linkedDraft && linkedDraft.goal_type) || smartPlan.goalType || 'skill_acquisition',
      evidenceStatus: 'clinician_entered',
      evidenceBadge: '✓ Clinician-Entered Finding',
      findingId: f.id,
      documentedFinding: f.finding_text,
      scoreOrLevel: f.result_value || 'Observed clinical need',
      evidenceSource: f.evidence_source || 'Direct Observation & Assessment Record',
      context: f.context || 'Clinic / School / Home',
      enteredBy: f.entered_by || 'Supervising BCBA',
      priorityStatus: f.priority_status || 'priority_goal',
      goalId: linkedGoal ? linkedGoal.id : null,
      draftId: linkedDraft ? linkedDraft.id : null,
      goalStatus: linkedGoal ? (linkedGoal.status || 'active') : (linkedDraft ? linkedDraft.status : 'draft'),
      goalStatement,
      masteryCriteria: (linkedDraft && linkedDraft.mastery_criteria) || smartPlan.masteryRecommendation.suggestedCriterion,
      baselineData: (linkedDraft && linkedDraft.baseline_data) || smartPlan.masteryRecommendation.suggestedBaseline,
      operationalDefinition: {
        summary: (linkedGoal && linkedGoal.operational_definition) || (linkedDraft && linkedDraft.operational_definition) || smartPlan.operationalDefinition.summary,
        onsetCriteria: (linkedGoal && linkedGoal.onset_criteria) || (linkedDraft && linkedDraft.onset_criteria) || smartPlan.operationalDefinition.onsetCriteria,
        offsetCriteria: (linkedGoal && linkedGoal.offset_criteria) || (linkedDraft && linkedDraft.offset_criteria) || smartPlan.operationalDefinition.offsetCriteria,
        episodeRule: (linkedDraft && linkedDraft.episode_rule) || smartPlan.operationalDefinition.episodeRule,
        examples: (linkedGoal && linkedGoal.examples) || (linkedDraft && linkedDraft.examples) || (smartPlan.operationalDefinition.examples || []).join('; '),
        nonExamples: (linkedGoal && linkedGoal.non_examples) || (linkedDraft && linkedDraft.non_examples) || (smartPlan.operationalDefinition.nonExamples || []).join('; '),
        exclusions: smartPlan.operationalDefinition.exclusions || []
      },
      measurementPlan: {
        primaryKey: (linkedGoal && linkedGoal.measurement_type) || (linkedDraft && linkedDraft.primary_measurement) || smartPlan.measurementPlan.primaryKey,
        primaryLabel: smartPlan.measurementPlan.primaryLabel,
        secondaryKey: (linkedGoal && linkedGoal.secondary_measurement) || (linkedDraft && linkedDraft.secondary_measurement) || smartPlan.measurementPlan.secondaryKey,
        secondaryLabel: smartPlan.measurementPlan.secondaryLabel,
        rationale: (linkedDraft && linkedDraft.measurement_rationale) || smartPlan.measurementPlan.rationale,
        dataFields: smartPlan.dataCollectionPlan.dataFields,
        calculationFormula: smartPlan.dataCollectionPlan.calculationFormula,
        sampleRows: smartPlan.dataCollectionPlan.sampleRows,
        sampleSummary: smartPlan.dataCollectionPlan.sampleSummary
      },
      progressMonitoring: {
        rawObservations: linkedGoal
          ? `${totalTrials} valid opportunities recorded across ${seriesLen} session(s) · Independent ratio: ${numDenom} · Prompted ratio: ${linkedGoal.prompted_num_denom || '0/0'}`
          : `Baseline / Initial Assessment Probe (${f.result_value || 'Recorded by clinician'}) — Ready for session data collection`,
        calculatedMetrics: linkedGoal
          ? `Baseline: ${linkedGoal.baseline}% ➔ Current ${linkedGoal.mastery_sessions || 3}-Session Avg: ${indepPct}% (${numDenom}) · Criterion: ${linkedGoal.target}% across ${linkedGoal.mastery_sessions || 3} sessions`
          : smartPlan.dataCollectionPlan.sampleSummary,
        aiNarrativeDraft: linkedGoal
          ? `[AI Narrative Draft]: Across ${seriesLen} recorded session(s), ${cName} progressed from ${linkedGoal.baseline}% baseline to ${indepPct}% (${numDenom} valid opportunities). ${linkedGoal.recommendation || 'Continue current prompting and reinforcement schedule per BCBA review.'}`
          : `[AI Narrative Draft]: Candidate program drafted from ${f.assessment_name} (${f.domain}) finding. Awaiting BCBA approval and initial session trial collection.`,
        clinicianReviewStatus: linkedGoal
          ? `Approved & Active (${linkedGoal.approved_by || 'Supervising BCBA'})`
          : (linkedDraft && linkedDraft.status === 'approved')
            ? `Approved by ${linkedDraft.approved_by || 'BCBA'}`
            : 'Draft — Requires BCBA Review & Approval'
      }
    });
  });

  // Next, when normTemplate === 'all', include any active client goals and behavior programs not yet matched to a finding
  if (normTemplate === 'all') {
    goals.forEach((g) => {
      if (usedGoalIds.has(g.id)) return;
      usedGoalIds.add(g.id);
      const smartPlan = analyzeSmartGoal({
        rawGoalText: g.title,
        clientName: cName,
        communicationModality: commMod,
        domain: g.domain || 'Skill Acquisition'
      });
      const totalTrials = g.total_trials || 0;
      const indepPct = g.current ?? g.indep_pct ?? g.baseline ?? 20;
      const numDenom = g.indep_num_denom || `${Math.round((totalTrials * indepPct) / 100)}/${totalTrials || 5}`;
      const seriesLen = Array.isArray(g.series) ? g.series.length : 0;

      domainRows.push({
        rowId: `goal-${g.id}`,
        instrumentId: 'vbmapp',
        instrumentName: 'Active Treatment Program (DTT / NET)',
        domain: g.domain || 'Communication & Skill Acquisition',
        domainCode: `goal_${g.id}`,
        domainGroup: 'Active Skill Acquisition',
        goalType: 'skill_acquisition',
        evidenceStatus: 'clinician_entered',
        evidenceBadge: '✓ Active Clinical Goal',
        findingId: g.linked_finding_id || null,
        documentedFinding: `Active treatment target established in ${cName}'s clinical plan (Baseline: ${g.baseline}% independent).`,
        scoreOrLevel: `Baseline: ${g.baseline}% ➔ Current: ${indepPct}%`,
        evidenceSource: 'Session Trial Data & Baseline Probe',
        context: 'Clinic / School / Home',
        enteredBy: g.approved_by || 'Dr. Dana Rivera, BCBA',
        priorityStatus: 'priority_goal',
        goalId: g.id,
        draftId: null,
        goalStatus: g.status || 'active',
        goalStatement: g.title,
        masteryCriteria: `${g.target || 80}% across ${g.mastery_sessions || 3} consecutive sessions`,
        baselineData: `${g.baseline || 20}% baseline`,
        operationalDefinition: {
          summary: g.operational_definition || smartPlan.operationalDefinition.summary,
          onsetCriteria: g.onset_criteria || smartPlan.operationalDefinition.onsetCriteria,
          offsetCriteria: g.offset_criteria || smartPlan.operationalDefinition.offsetCriteria,
          episodeRule: smartPlan.operationalDefinition.episodeRule,
          examples: g.examples || (smartPlan.operationalDefinition.examples || []).join('; '),
          nonExamples: g.non_examples || (smartPlan.operationalDefinition.nonExamples || []).join('; '),
          exclusions: smartPlan.operationalDefinition.exclusions || []
        },
        measurementPlan: {
          primaryKey: g.measurement_type || smartPlan.measurementPlan.primaryKey,
          primaryLabel: smartPlan.measurementPlan.primaryLabel,
          secondaryKey: g.secondary_measurement || smartPlan.measurementPlan.secondaryKey,
          secondaryLabel: smartPlan.measurementPlan.secondaryLabel,
          rationale: smartPlan.measurementPlan.rationale,
          dataFields: smartPlan.dataCollectionPlan.dataFields,
          calculationFormula: smartPlan.dataCollectionPlan.calculationFormula,
          sampleRows: smartPlan.dataCollectionPlan.sampleRows,
          sampleSummary: smartPlan.dataCollectionPlan.sampleSummary
        },
        progressMonitoring: {
          rawObservations: `${totalTrials} valid trials across ${seriesLen} session(s) · Independent: ${numDenom} · Prompted: ${g.prompted_num_denom || '0/0'} · N/A Excluded: ${(g.prompt_totals && g.prompt_totals.NA) || 0}`,
          calculatedMetrics: `Baseline: ${g.baseline}% ➔ Current: ${indepPct}% (${numDenom}) · Mastery Criterion: ${g.target}% across ${g.mastery_sessions || 3} consecutive sessions`,
          aiNarrativeDraft: `[AI Narrative Draft]: ${cName} achieved ${indepPct}% independent responding (${numDenom}) across ${seriesLen} session(s) using ${g.prompt_strategy || 'Least-to-Most'} prompting. ${g.recommendation || 'Continue monitoring toward mastery criterion.'}`,
          clinicianReviewStatus: `Approved & Active (Status: ${(g.status || 'active').toUpperCase()})`
        }
      });
    });

    behaviorPrograms.filter(bp => bp.status !== 'archived').forEach((bp) => {
      const smartPlan = analyzeSmartGoal({
        rawGoalText: bp.reduction_goal || `Decrease ${bp.name}`,
        goalType: 'behavior_reduction',
        clientName: cName,
        communicationModality: commMod,
        domain: `Behavior Reduction — ${bp.name}`
      });
      const evCount = bp.historical_event_count || behaviorEvents.filter(e => Number(e.behavior_id) === Number(bp.id) || e.behavior_name === bp.name).length;
      domainRows.push({
        rowId: `beh-${bp.id}`,
        instrumentId: 'efl',
        instrumentName: 'Functional Behavior Assessment (FBA) & BIP',
        domain: `Behavior Reduction: ${bp.name}`,
        domainCode: `beh_${bp.id}`,
        domainGroup: 'Behavior Reduction & FCT',
        goalType: 'behavior_reduction',
        evidenceStatus: 'clinician_entered',
        evidenceBadge: `✓ Active Behavior Program (v${bp.version || 1})`,
        findingId: null,
        documentedFinding: `Target Behavior: ${bp.name} (Hypothesized Function: ${bp.function_hypothesis || 'Escape'}). Baseline: ${bp.baseline_data || `${bp.baseline_rate || 3}/hr`}.`,
        scoreOrLevel: `Baseline: ${bp.baseline_rate || 3}/hr ➔ Target: ≤${bp.target_rate || 0.5}/hr`,
        evidenceSource: 'ABC Continuous Logs & Session Behavior Events',
        context: 'All Treatment Settings',
        enteredBy: bp.updated_by || 'Dr. Dana Rivera, BCBA',
        priorityStatus: 'priority_goal',
        goalId: null,
        draftId: null,
        goalStatus: bp.status || 'active',
        goalStatement: bp.reduction_goal || `Decrease ${bp.name} from ${bp.baseline_rate || 3}/hr to ≤ ${bp.target_rate || 0.5}/hr`,
        masteryCriteria: bp.mastery_criteria || `≤ ${bp.target_rate || 0.5}/hr across 3 consecutive sessions`,
        baselineData: bp.baseline_data || `${bp.baseline_rate || 3}/hr`,
        operationalDefinition: {
          summary: bp.operational_definition || bp.definition || smartPlan.operationalDefinition.summary,
          onsetCriteria: bp.onset_criteria || smartPlan.operationalDefinition.onsetCriteria,
          offsetCriteria: bp.offset_criteria || smartPlan.operationalDefinition.offsetCriteria,
          episodeRule: smartPlan.operationalDefinition.episodeRule,
          examples: bp.examples || (smartPlan.operationalDefinition.examples || []).join('; '),
          nonExamples: bp.non_examples || (smartPlan.operationalDefinition.nonExamples || []).join('; '),
          exclusions: smartPlan.operationalDefinition.exclusions || []
        },
        measurementPlan: {
          primaryKey: bp.measurement_type || 'frequency',
          primaryLabel: smartPlan.measurementPlan.primaryLabel,
          secondaryKey: 'abc',
          secondaryLabel: 'ABC Antecedent-Behavior-Consequence Context',
          rationale: smartPlan.measurementPlan.rationale,
          dataFields: smartPlan.dataCollectionPlan.dataFields,
          calculationFormula: smartPlan.dataCollectionPlan.calculationFormula,
          sampleRows: smartPlan.dataCollectionPlan.sampleRows,
          sampleSummary: smartPlan.dataCollectionPlan.sampleSummary
        },
        progressMonitoring: {
          rawObservations: `${evCount} behavior observation event(s) & ${abcLogs.length} ABC incident log(s) recorded under Definition v${bp.version || 1}`,
          calculatedMetrics: `Baseline: ${bp.baseline_data || `${bp.baseline_rate || 3}/hr`} ➔ Mastery Criterion: ${bp.mastery_criteria || `≤ ${bp.target_rate || 0.5}/hr across 3 consecutive sessions`}`,
          aiNarrativeDraft: `[AI Narrative Draft]: Behavior reduction program "${bp.name}" (${bp.measurement_type || 'frequency'}) is paired with FCT replacement goal: "${bp.replacement_skill_goal || 'Request break/help independently'}". Historical data remains locked to Definition v${bp.version || 1}.`,
          clinicianReviewStatus: `Approved & Active (Version v${bp.version || 1})`
        }
      });
    });
  }

  // Finally, for the selected assessment template(s), include any remaining template domains that haven't been populated yet
  // so the BCBA can see all domains of the template and auto-populate them in 1 click!
  activeTemplates.forEach((tmpl) => {
    (tmpl.domains || []).forEach((td, idx) => {
      const alreadyCovered = domainRows.some((r) =>
        r.instrumentId === tmpl.id &&
        r.domain.toLowerCase() === td.domain.toLowerCase()
      );
      if (alreadyCovered) return;

      const sampleGoalText = td.sampleGoal.replace(/\{client\}/g, cName);
      const smartPlan = analyzeSmartGoal({
        rawGoalText: sampleGoalText,
        goalType: td.goalType,
        clientName: cName,
        communicationModality: commMod,
        domain: td.domain
      });
      const dCode = String(td.domain || `dom_${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, '_');

      domainRows.push({
        rowId: `template-${tmpl.id}-${idx}`,
        instrumentId: tmpl.id,
        instrumentName: tmpl.name,
        domain: td.domain,
        domainCode: dCode,
        domainGroup: tmpl.name,
        goalType: td.goalType || 'skill_acquisition',
        evidenceStatus: 'template_ready',
        evidenceBadge: '📝 Template Domain (Ready to Populate)',
        findingId: null,
        documentedFinding: `[Template Prompt — Not Yet Entered for ${cName}]: ${td.defaultFindingPrompt}`,
        scoreOrLevel: 'Not Yet Entered (Zero-Fabrication Safeguard)',
        evidenceSource: 'Awaiting Clinician Assessment Entry',
        context: 'Clinic / School / Home',
        enteredBy: '—',
        priorityStatus: 'further_assessment',
        goalId: null,
        draftId: null,
        goalStatus: 'template_suggestion',
        goalStatement: sampleGoalText,
        masteryCriteria: smartPlan.masteryRecommendation.suggestedCriterion,
        baselineData: smartPlan.masteryRecommendation.suggestedBaseline,
        operationalDefinition: {
          summary: smartPlan.operationalDefinition.summary,
          onsetCriteria: smartPlan.operationalDefinition.onsetCriteria,
          offsetCriteria: smartPlan.operationalDefinition.offsetCriteria,
          episodeRule: smartPlan.operationalDefinition.episodeRule,
          examples: (smartPlan.operationalDefinition.examples || []).join('; '),
          nonExamples: (smartPlan.operationalDefinition.nonExamples || []).join('; '),
          exclusions: smartPlan.operationalDefinition.exclusions || []
        },
        measurementPlan: {
          primaryKey: smartPlan.measurementPlan.primaryKey,
          primaryLabel: smartPlan.measurementPlan.primaryLabel,
          secondaryKey: smartPlan.measurementPlan.secondaryKey,
          secondaryLabel: smartPlan.measurementPlan.secondaryLabel,
          rationale: smartPlan.measurementPlan.rationale,
          dataFields: smartPlan.dataCollectionPlan.dataFields,
          calculationFormula: smartPlan.dataCollectionPlan.calculationFormula,
          sampleRows: smartPlan.dataCollectionPlan.sampleRows,
          sampleSummary: smartPlan.dataCollectionPlan.sampleSummary
        },
        progressMonitoring: {
          rawObservations: 'No raw observations recorded for this domain yet.',
          calculatedMetrics: `Draft Sample Calculation: ${smartPlan.dataCollectionPlan.sampleSummary}`,
          aiNarrativeDraft: `[AI Template Preview]: Click "+ Auto-Populate Domain" to log a clinician-verified finding in ${tmpl.name} (${td.domain}) and generate a reviewable Smart Goal draft.`,
          clinicianReviewStatus: 'Template Preview — Not Yet Active'
        }
      });
    });
  });

  const populatedCount = domainRows.filter(r => r.evidenceStatus === 'clinician_entered').length;
  const templateReadyCount = domainRows.filter(r => r.evidenceStatus === 'template_ready').length;

  return {
    title: `RBT Sepia — Auto-Populated ABA Assessment, Clinical Planning & Progress Monitoring Report`,
    clientId: client ? client.id : 1,
    clientName: cName,
    clientDob: (client && client.dob) || 'On file',
    clientDiagnosis: (client && client.diagnosis) || 'Autism Spectrum Disorder',
    communicationModality: commMod,
    date: dateStr,
    selectedTemplate: normTemplate,
    selectedTemplateId: normTemplate,
    availableTemplates: Object.values(ASSESSMENT_DOMAIN_TEMPLATES).map(t => ({
      id: t.id,
      name: t.name,
      fullName: t.fullName,
      domainCount: t.domains.length
    })),
    summaryCounts: {
      totalDomains: domainRows.length,
      populatedDomains: populatedCount,
      templateReadyDomains: templateReadyCount,
      activeGoalsCount: goals.length,
      findingsCount: assessmentFindings.length,
      draftsCount: smartGoalDrafts.length,
      behaviorProgramsCount: behaviorPrograms.filter(b => b.status !== 'archived').length
    },
    domainRows,
    safeguardFooter: 'Clinical & Legal Governance Note: AI-generated definitions, measurement recommendations, and narrative summaries are drafts and decision support—not diagnoses, formal assessment results, or autonomous clinical approvals. All plans require supervising BCBA review and sign-off.'
  };
}

module.exports = {
  LEVELS,
  MEASUREMENT_METHODS,
  GOAL_DOMAINS,
  PROMPT_STRATEGIES,
  GOAL_STATUSES,
  BEHAVIOR_FUNCTIONS,
  COMMUNICATION_MODALITIES,
  ASSESSMENT_REFERENCE_LIBRARY,
  MEASUREMENT_RECOMMENDATION_LIBRARY,
  VAGUE_GOAL_QUALITY_RULES,
  ASSESSMENT_DOMAIN_TEMPLATES,
  analyzeSmartGoal,
  organizeSkillGapsFromFindings,
  generateAssessmentReportTemplate,
  DEFAULT_FACILITY_MODELS,
  calculateFacilityModel,
  LICENSE_TIERS,
  calculateLicenseQuote,
  generateLicenseAgreements,
  generateStory,
  generatePlan,
  generateNote,
  generateReauthReport,
  generateFbaReport,
  calcUnits,
  calcSupervisionPct,
  summarize,
  summarizeBehaviorEvents,
  calculateIoa,
  calculateFidelity,
  ANTECEDENT_LIB
};

