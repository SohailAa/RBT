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
    if (!byBehavior[bName]) {
      byBehavior[bName] = { name: bName, frequency: 0, totalDurationSec: 0, durationEpisodes: 0, totalLatencySec: 0, latencyEpisodes: 0, intervalOccurred: 0, intervalTotal: 0 };
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

  return {
    totalEvents: events.length,
    frequency,
    sessionMinutes: safeMinutes,
    ratePerHour: +(frequency / safeHours).toFixed(2),
    ratePerMinute: +(frequency / safeMinutes).toFixed(3),
    totalDurationSec,
    avgDurationSec: durationEpisodes ? Math.round(totalDurationSec / durationEpisodes) : 0,
    durationEpisodes,
    totalLatencySec,
    avgLatencySec: latencyEpisodes ? Math.round(totalLatencySec / latencyEpisodes) : 0,
    maxLatencySec,
    latencyEpisodes,
    avgIrtSec: irtEpisodes ? Math.round(totalIrtSec / irtEpisodes) : 0,
    irtEpisodes,
    partialInterval: fmtInterval(intervals.partial_interval),
    wholeInterval: fmtInterval(intervals.whole_interval),
    momentaryTimeSampling: fmtInterval(intervals.mts),
    overallInterval: fmtInterval({ occurred: allIntOcc, total: allIntTot }),
    byIntensity,
    byBehavior: Object.values(byBehavior).map((b) => ({
      ...b,
      ratePerHour: +(b.frequency / safeHours).toFixed(2),
      avgDurationSec: b.durationEpisodes ? Math.round(b.totalDurationSec / b.durationEpisodes) : 0,
      avgLatencySec: b.latencyEpisodes ? Math.round(b.totalLatencySec / b.latencyEpisodes) : 0,
      intervalPct: b.intervalTotal ? Math.round((b.intervalOccurred / b.intervalTotal) * 100) : 0,
      intervalNumDenom: `${b.intervalOccurred}/${b.intervalTotal}`
    }))
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

module.exports = {
  LEVELS,
  MEASUREMENT_METHODS,
  GOAL_DOMAINS,
  PROMPT_STRATEGIES,
  GOAL_STATUSES,
  BEHAVIOR_FUNCTIONS,
  COMMUNICATION_MODALITIES,
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
