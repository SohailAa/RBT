// Template-based generators. All output is a DRAFT until a BCBA approves it.
// To plug in an LLM later, replace these functions behind the same signatures.

const LEVELS = {
  I: 'Independent',
  V: 'Verbal prompt',
  G: 'Gestural prompt',
  M: 'Model prompt',
  P: 'Physical prompt',
  N: 'Did not comply',
};

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

function summarize(trials) {
  const counts = { I: 0, V: 0, G: 0, M: 0, P: 0, N: 0 };
  trials.forEach((t) => { if (counts[t.level] !== undefined) counts[t.level]++; });
  const total = trials.length;
  const pct = {};
  Object.keys(counts).forEach((k) => { pct[k] = total ? Math.round((counts[k] / total) * 100) : 0; });
  return { counts, pct, total };
}

function generateNote({ client, session, minutes, units, goalSummaries, plan, story, abcLogs }) {
  const lines = [];
  lines.push(`${client.name} participated in a ${minutes}-minute session (${units} units) in the ${session.setting || 'home/school'} setting.`);
  if (!goalSummaries || !goalSummaries.length) {
    lines.push('No skill-acquisition data was collected this session.');
  } else {
    goalSummaries.forEach((g) => {
      if (!g.total) return;
      lines.push(`Goal "${g.title}": ${g.total} opportunities. Independent ${g.pct.I}%, verbal prompt ${g.pct.V}%, gestural prompt ${g.pct.G}%, model prompt ${g.pct.M || 0}%, physical prompt ${g.pct.P}%, did not comply ${g.pct.N}%.`);
    });
  }
  if (plan) {
    lines.push(`Behavior plan for ${plan.behavior} was implemented, including prevention strategies: ${plan.prevention.slice(0, 3).join(', ')}. Replacement behavior targeted: ${plan.replacement}.`);
  }
  if (abcLogs && abcLogs.length) {
    const byBehavior = {};
    const byFunction = {};
    abcLogs.forEach(log => {
      byBehavior[log.behavior] = (byBehavior[log.behavior] || 0) + 1;
      if (log.function) byFunction[log.function] = (byFunction[log.function] || 0) + 1;
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

module.exports = {
  LEVELS,
  BEHAVIOR_FUNCTIONS,
  COMMUNICATION_MODALITIES,
  generateStory,
  generatePlan,
  generateNote,
  generateReauthReport,
  calcUnits,
  calcSupervisionPct,
  summarize,
  ANTECEDENT_LIB
};
