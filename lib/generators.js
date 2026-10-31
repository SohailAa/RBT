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
    if (!byBehavior[bName]) {
      byBehavior[bName] = { behaviorId: bId, name: bName, frequency: 0, totalDurationSec: 0, durationEpisodes: 0, totalLatencySec: 0, latencyEpisodes: 0, intervalOccurred: 0, intervalTotal: 0 };
    } else if (bId && !byBehavior[bName].behaviorId) {
      byBehavior[bName].behaviorId = bId;
    }

    if (ev.intensity && byIntensity[ev.intensity] !== undefined) {
      byIntensity[ev.intensity]++;
    }

    if (mType === 'partial_interval' || mType === 'whole_interval' || mType === 'mts') {
      const iTot = Math.max(0, Number(ev.interval_total) || 1);
      const iOcc = Math.min(iTot, Math.max(0, Number(ev.interval_occurred) || 0));
      intervals[mType].total += iTot;
      intervals[mType].occurred += iOcc;
      byBehavior[bName].intervalTotal += iTot;
      byBehavior[bName].intervalOccurred += iOcc;
      if (iOcc > 0) {
        frequency += iOcc;
        byBehavior[bName].frequency += iOcc;
      }
    } else {
      const cnt = Math.max(1, Number(ev.count) || 1);
      frequency += cnt;
      byBehavior[bName].frequency += cnt;
    }

    const dur = Number(ev.duration_sec) || 0;
    if (dur > 0) {
      totalDurationSec += dur;
      durationEpisodes++;
      byBehavior[bName].totalDurationSec += dur;
      byBehavior[bName].durationEpisodes++;
    }

    const lat = Number(ev.latency_sec) || 0;
    if (lat > 0) {
      totalLatencySec += lat;
      if (lat > maxLatencySec) maxLatencySec = lat;
      latencyEpisodes++;
      byBehavior[bName].totalLatencySec += lat;
      byBehavior[bName].latencyEpisodes++;
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

function generateReauthReport({ client, goals = [], abcLogs = [], auths = [], supervision = {} }) {
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
      baseline: g.baseline,
      current: cur,
      target: g.target || 80,
      diff: (diff >= 0 ? `+${diff}%` : `${diff}%`),
      status: statusStr
    };
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

  sections.push({
    heading: '2. PROGRESS ON SKILL ACQUISITION PROGRAMMING',
    content: `During this authorization period, the client was engaged in comprehensive Discrete Trial Training (DTT) and Natural Environment Teaching (NET).\n\n` +
      `Summary of Mastery: ${masteredGoals.length} target(s) mastered or criteria-met out of ${goals.length} total programs.\n\n` +
      (goalRows.length ? goalRows.map(gr => `• [${gr.status}] "${gr.title}": Baseline ${gr.baseline}% ➔ Current ${gr.current}% (Target: ${gr.target}%, Net Change: ${gr.diff})`).join('\n') : 'No skill goals recorded.') +
      `\n\nPrompt Fading Narrative: Longitudinal data demonstrates progressive fading of intrusive physical and gestural prompts to independent responding across tabletop and naturalistic learning routines.`
  });

  sections.push({
    heading: '3. BEHAVIOR REDUCTION & FUNCTIONAL ANALYSIS',
    content: `Total Maladaptive Incidents Recorded: ${totalIncidents} events.\n` +
      `Behavior Breakdown: ` + (Object.keys(behCounts).length ? Object.entries(behCounts).map(([b, cnt]) => `${b}: ${cnt}`).join(', ') : 'Zero acute incidents logged') + `.\n` +
      `Hypothesized Functions: Escape/Avoidance: ${funcCounts.Escape}, Access to Tangibles: ${funcCounts.Tangible}, Attention Seeking: ${funcCounts.Attention}, Automatic/Sensory: ${funcCounts.Sensory}.\n\n` +
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

module.exports = {
  LEVELS,
  MEASUREMENT_METHODS,
  GOAL_DOMAINS,
  PROMPT_STRATEGIES,
  GOAL_STATUSES,
  BEHAVIOR_FUNCTIONS,
  COMMUNICATION_MODALITIES,
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

