if (typeof window !== 'undefined' && typeof document !== 'undefined') {
const $app = document.getElementById('app');
let me = null;
let activeModal = null;
let clientSearchQuery = '';
let showKidMode = false;
let tokenCount = 0;
let targetTokens = 5;
let kidTheme = 'space';
let kidSound = true;
let kidAutoToken = true;
let kidRewardChoice = '';
let kidFirstGoalId = null;
let kidFirstDone = false;
let kidPraiseMsg = '';
let kidCelebrationBurst = false;
let sessionMode = 'dtt';
let pitchSlide = 0;
let pitchTourActive = false;
let roiBcba = 3;
let roiRbt = 12;
let fbaFilterBehavior = 'ALL';
let fbaFilterFunction = 'ALL';
let fbaFilterHour = null;

const KID_THEMES = {
  space: {
    id: 'space',
    name: '🚀 Space Rocket',
    title: 'Cosmic Rocket Adventure',
    subtitle: 'Collect glowing Cosmic Stars to launch the Rocket to the Saturn Reward Base!',
    tokenEarned: '🌟',
    tokenEmpty: '🪐',
    hero: '🚀',
    dest: '🌕',
    accent: '#6366f1',
    bannerBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #0f172a 100%)',
    trackBg: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
  },
  dino: {
    id: 'dino',
    name: '🦕 Dino Island',
    title: 'Dino Explorer Island',
    subtitle: 'Hatch the Baby Dinosaurs to unlock the Golden Volcano Treasure!',
    tokenEarned: '🦖',
    tokenEmpty: '🥚',
    hero: '🦕',
    dest: '🌋',
    accent: '#059669',
    bannerBg: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #065f46 100%)',
    trackBg: 'linear-gradient(90deg, #064e3b 0%, #059669 50%, #10b981 100%)'
  },
  lego: {
    id: 'lego',
    name: '🧱 Master Builder',
    title: 'Master LEGO Kingdom',
    subtitle: 'Stack Super Builder Bricks to finish the Royal Castle Tower!',
    tokenEarned: '🧱',
    tokenEmpty: '🔲',
    hero: '👷',
    dest: '🏰',
    accent: '#d97706',
    bannerBg: 'linear-gradient(135deg, #78350f 0%, #b45309 55%, #1e3a8a 100%)',
    trackBg: 'linear-gradient(90deg, #92400e 0%, #d97706 50%, #2563eb 100%)'
  },
  train: {
    id: 'train',
    name: '🚂 Super Train',
    title: 'Rainbow Express Railway',
    subtitle: 'Couple the Golden Train Cars to chug all the way to Rainbow Station!',
    tokenEarned: '🚃',
    tokenEmpty: '🛤️',
    hero: '🚂',
    dest: '🌈',
    accent: '#0284c7',
    bannerBg: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #312e81 100%)',
    trackBg: 'linear-gradient(90deg, #075985 0%, #0284c7 50%, #38bdf8 100%)'
  }
};

const PRAISE_CHEERS = [
  '🌟 SUPERSTAR LISTENER! Amazing job!',
  '🚀 BLAST OFF! You are working so hard!',
  '🏆 CHAMPION EFFORT! High Five! 🙌',
  '🦖 DINO-MITE FOCUS! Way to go!',
  '🧱 MASTER BUILDER! You nailed that trial!',
  '🌈 INCREDIBLE WORK! Keep shining!'
];

function playKidSound(type = 'token') {
  if (!kidSound || typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = type === 'victory'
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : type === 'praise'
      ? [659.25, 830.61, 987.77, 1318.5]
      : [587.33, 880.0];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.3);
    });
  } catch (e) {}
}

function speakKidPraise(text) {
  if (!kidSound || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.2;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const val = (id) => (document.getElementById(id) || {}).value || '';
const LV = {
  I: { label: 'Independent', code: 'I', icon: '☑', cls: 'ok' },
  V: { label: 'Verbal prompt', code: 'V', icon: '💬', cls: 'btn-v' },
  G: { label: 'Gestural prompt', code: 'G', icon: '👉', cls: 'btn-g' },
  Vi: { label: 'Visual prompt', code: 'Vi', icon: '🖼️', cls: 'btn-vi' },
  M: { label: 'Model prompt', code: 'M', icon: '🧑‍🏫', cls: 'btn-m' },
  PP: { label: 'Partial Physical', code: 'PP', icon: '🤚', cls: 'btn-pp' },
  P: { label: 'Full Physical', code: 'P', icon: '🤝', cls: 'btn-p' },
  INC: { label: 'Incorrect response', code: 'INC', icon: '✗', cls: 'btn-inc' },
  N: { label: 'No response / Refusal', code: 'N', icon: '⊘', cls: 'bad' },
  NA: { label: 'Not presented / N/A', code: 'NA', icon: '—', cls: 'sec' }
};
let activeTrialType = 'acquisition';
let behTimers = {};
let behTimerInterval = null;
let taDraftSteps = {};
let bpNameMap = {};
let localBehEvents = [];
let localUndoneIds = new Set();
let tallySeq = 0;

function mergeAndSummarizeBehaviorEvents(serverEvents = [], clientId = null, sessionId = null, sessionMinutes = 60) {
  const safeMinutes = Math.max(1, Number(sessionMinutes) || 60);
  const safeHours = safeMinutes / 60;
  const combined = [];
  const seenKeys = new Set();

  (serverEvents || []).forEach((ev) => {
    if (ev.ts && localUndoneIds.has(ev.ts)) return;
    const key = `${ev.behavior_id || ev.behavior_name || ev.behavior}_${ev.measurement_type}_${ev.ts || ev.id}`;
    seenKeys.add(key);
    combined.push(ev);
  });

  localBehEvents.forEach((ev) => {
    if (ev.ts && localUndoneIds.has(ev.ts)) return;
    if (sessionId !== null && Number(ev.session_id) !== Number(sessionId)) return;
    if (sessionId === null && clientId !== null && Number(ev.client_id) !== Number(clientId)) return;
    const key = `${ev.behavior_id || ev.behavior_name || ev.behavior}_${ev.measurement_type}_${ev.ts || ev.localUid}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(ev);
    }
  });

  let frequency = 0;
  let totalDurationSec = 0;
  let durationEpisodes = 0;
  let totalLatencySec = 0;
  let latencyEpisodes = 0;
  let totalIrtSec = 0;
  let irtEpisodes = 0;
  let intOccurred = 0;
  let intTotal = 0;
  const byBeh = {};

  const sorted = [...combined].sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')));
  let prevTsMs = null;

  sorted.forEach((ev) => {
    const mType = ev.measurement_type || 'frequency';
    const bId = ev.behavior_id || ev.behavior_program_id || null;
    const bName = ev.behavior_name || ev.behavior || (bId && bpNameMap[bId]) || 'Target Behavior';
    const mapKey = bName;
    if (!byBeh[mapKey]) {
      byBeh[mapKey] = { behaviorId: bId, name: bName, frequency: 0, totalDurationSec: 0, durationEpisodes: 0, totalLatencySec: 0, latencyEpisodes: 0, intervalOccurred: 0, intervalTotal: 0 };
    } else if (bId && !byBeh[mapKey].behaviorId) {
      byBeh[mapKey].behaviorId = bId;
    }

    if (mType === 'partial_interval' || mType === 'whole_interval' || mType === 'mts') {
      const iTot = Math.max(0, Number(ev.interval_total) || 1);
      const iOcc = Math.min(iTot, Math.max(0, Number(ev.interval_occurred) || 0));
      intTotal += iTot;
      intOccurred += iOcc;
      byBeh[mapKey].intervalTotal += iTot;
      byBeh[mapKey].intervalOccurred += iOcc;
      if (iOcc > 0) {
        frequency += iOcc;
        byBeh[mapKey].frequency += iOcc;
      }
    } else {
      const cnt = Math.max(1, Number(ev.count ?? ev.value) || 1);
      frequency += cnt;
      byBeh[mapKey].frequency += cnt;
    }

    const dur = Number(ev.duration_sec) || 0;
    if (dur > 0) {
      totalDurationSec += dur;
      durationEpisodes++;
      byBeh[mapKey].totalDurationSec += dur;
      byBeh[mapKey].durationEpisodes++;
    }

    const lat = Number(ev.latency_sec) || 0;
    if (lat > 0) {
      totalLatencySec += lat;
      latencyEpisodes++;
      byBeh[mapKey].totalLatencySec += lat;
      byBeh[mapKey].latencyEpisodes++;
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

  const byBehavior = {};
  Object.values(byBeh).forEach((b) => {
    const item = {
      ...b,
      ratePerHour: +(b.frequency / safeHours).toFixed(2),
      avgDurationSec: b.durationEpisodes ? Math.round(b.totalDurationSec / b.durationEpisodes) : 0,
      avgLatencySec: b.latencyEpisodes ? Math.round(b.totalLatencySec / b.latencyEpisodes) : 0,
      intervalPct: b.intervalTotal ? Math.round((b.intervalOccurred / b.intervalTotal) * 100) : null,
      intervalNumDenom: `${b.intervalOccurred}/${b.intervalTotal}`
    };
    byBehavior[b.name] = item;
    if (b.behaviorId) byBehavior[`id_${b.behaviorId}`] = item;
  });

  return {
    totalEvents: combined.length,
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
    latencyEpisodes,
    latencyCount: latencyEpisodes,
    avgIrtSec: irtEpisodes ? Math.round(totalIrtSec / irtEpisodes) : 0,
    irtEpisodes,
    irtCount: irtEpisodes,
    intervalPct: intTotal ? Math.round((intOccurred / intTotal) * 100) : 0,
    intervalNumDenom: `${intOccurred}/${intTotal}`,
    byBehavior
  };
}
const GOAL_DOMAINS = [
  'Communication / Manding',
  'Tacting / Labeling',
  'Listener Responding / Receptive',
  'Social / Peer Play',
  'Motor Imitation',
  'Daily Living / Adaptive (ADL)',
  'Academic / Pre-Academic',
  'Replacement Behavior (FCT)',
  'Executive Functioning / Transitions'
];
const PROMPT_STRATEGIES = [
  'Least-to-Most (LTM)',
  'Most-to-Least (MTL)',
  'Constant Time Delay (CTD)',
  'Progressive Time Delay (PTD)',
  'Errorless Learning',
  'Graduated Guidance',
  'Naturalistic / Incidental'
];
const GOAL_STATUS_META = {
  active: { label: 'Active', cls: 'approved' },
  on_hold: { label: 'On Hold', cls: 'draft' },
  mastered: { label: 'Mastered', cls: 'approved' },
  discontinued: { label: 'Discontinued', cls: 'bad' },
  revised: { label: 'Revised', cls: 'draft' }
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

const NAV_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  clients: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  schedule: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  supervision: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  presentation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
};

const NAV = {
  BCBA: [
    ['dashboard', NAV_ICONS.dashboard, 'Practice Ledger', 'Live EVV, Roster & Burn-Down'],
    ['clients', NAV_ICONS.clients, 'Clients 360°', 'Vitals, DTT, FBA & BIPs'],
    ['schedule', NAV_ICONS.schedule, 'Clinical Schedule', 'Session Dispatch & Units'],
    ['notes', NAV_ICONS.notes, 'Notes & Dual-Sign', 'SOAP & 21 CFR Co-Sign'],
    ['supervision', NAV_ICONS.supervision, 'BACB Supervision', 'Mandatory 5% Audit Radar'],
    ['presentation', NAV_ICONS.presentation, 'Founder Pitch Deck', '10-Slide Interactive Tour']
  ],
  RBT: [
    ['dashboard', NAV_ICONS.dashboard, 'My Clinical Day', 'Assigned Shift & Tasks'],
    ['schedule', NAV_ICONS.schedule, 'Session Schedule', '1-Tap Start Session'],
    ['clients', NAV_ICONS.clients, 'My Clients 360°', 'Vitals, DTT & ABC Logs'],
    ['notes', NAV_ICONS.notes, 'Session Notes', 'Auto-SOAP Drafts'],
    ['supervision', NAV_ICONS.supervision, 'My Supervision', 'BCBA Feedback & 5% Track'],
    ['presentation', NAV_ICONS.presentation, 'Founder Pitch Deck', '10-Slide Interactive Tour']
  ],
  PARENT: [
    ['clients', NAV_ICONS.clients, 'My Child Portal', 'Goals & Approved Stories'],
    ['presentation', NAV_ICONS.presentation, 'Founder Pitch Deck', '10-Slide Interactive Tour']
  ]
};

const brandEmblem = (cls = '') => `
  <div class="brand-icon ${cls}" title="Effective Behavioral Approach — Unified Behavioral Health Record">
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="11" stroke="#6ee7b7" stroke-width="1.8" opacity="0.7"/>
      <path d="M16 33C20 21 26 16 32 16C38 16 44 21 48 33C44 45 38 50 32 50C26 50 20 45 16 33Z" stroke="#38bdf8" stroke-width="2" opacity="0.55"/>
      <path d="M11 34H21L26 20L34 46L39 30L43 34H53" stroke="#ecfeff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="13" r="4.5" fill="#10b981" stroke="#ecfeff" stroke-width="1.5"/>
    </svg>
  </div>`;

function shell(content, route) {
  const userInitials = getInitials(me.name);
  const activeClientId = location.hash.startsWith('#client/') ? (+location.hash.split('/')[1] || 1) : 1;
  const isParent = me.role === 'PARENT';
  const floatBar = (pitchTourActive && route !== 'presentation') ? `
    <div class="pitch-float-bar">
      <span style="font-family:var(--font-mono);font-size:0.76rem;font-weight:600;color:#6ee7b7">GUIDED TOUR · SLIDE ${pitchSlide + 1}/10</span>
      <button class="ok" style="padding:5px 12px;font-size:0.78rem" onclick="go('presentation')">↩ Back to Deck</button>
      ${pitchSlide < 9 ? `<button class="sec" style="padding:5px 12px;font-size:0.78rem" onclick="act.setPitchSlide(${pitchSlide + 1});go('presentation')">Next Slide (${pitchSlide + 2}/10) →</button>` : ''}
      <button style="background:transparent;border:none;color:#99f6e4;padding:2px 6px;font-size:0.78rem;box-shadow:none" title="Dismiss tour bar" onclick="act.endPitchTour()">✕</button>
    </div>
  ` : '';

  const caseloadWidget = !isParent ? `
    <div>
      <div class="sidebar-section-label">
        <span>Active Caseload Pinboard</span>
        <span style="color:#38bdf8">1-Tap Jump</span>
      </div>
      <div class="sidebar-widget">
        <div class="sidebar-client-list">
          <div class="sidebar-client-row" onclick="go('client', 1)" title="Open Eleanor Carter 360° Record">
            <div class="sidebar-client-avatar">EC</div>
            <div class="sidebar-client-info">
              <div class="sidebar-client-name">Eleanor Carter</div>
              <div class="sidebar-client-meta">ASD · AAC + Vocal · 97153</div>
            </div>
            <button class="sidebar-mini-btn" onclick="event.stopPropagation();act.start(1)" title="Start / Resume Session">▶ Session</button>
          </div>
          <div class="sidebar-client-row" onclick="go('client', 2)" title="Open Leon Patel 360° Record">
            <div class="sidebar-client-avatar" style="background:linear-gradient(135deg,#0284c7,#0f766e)">LP</div>
            <div class="sidebar-client-info">
              <div class="sidebar-client-name">Leon Patel</div>
              <div class="sidebar-client-meta">ASD · PECS Phase IV · 97153</div>
            </div>
            <button class="sidebar-mini-btn" onclick="event.stopPropagation();go('client', 2)" title="Open 360° Record">360° →</button>
          </div>
        </div>

        <div class="sidebar-pillar-chips">
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(${activeClientId}, 'overview')">01 Overview</button>
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(${activeClientId}, 'skills')">02 DTT Goals</button>
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(${activeClientId}, 'behavior_abc')">03 FBA & ABC</button>
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(${activeClientId}, 'plans')">04 BIP Plans</button>
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(${activeClientId}, 'stories')">05 Stories</button>
          <button class="sidebar-pillar-chip" style="background:linear-gradient(135deg,rgba(16,185,129,0.35),rgba(2,132,199,0.35))!important;color:#fff!important" onclick="act.openAbcModal(${activeClientId})">+ Log ABC</button>
        </div>
      </div>
    </div>

    <div>
      <div class="sidebar-section-label">
        <span>Clinic Compliance Radar</span>
        <span style="color:#6ee7b7">≥5% BACB</span>
      </div>
      <div class="sidebar-widget" style="cursor:pointer" onclick="go('supervision')" title="Click to open BACB Monthly Supervision Tracker">
        <div class="flex-between" style="font-size:0.74rem;font-weight:700;color:#ecfeff">
          <span>BACB RBT Supervision</span>
          <span style="font-family:var(--font-mono);color:#6ee7b7">COMPLIANT</span>
        </div>
        <div class="sidebar-radar-bar">
          <div class="sidebar-radar-fill" style="width:78%"></div>
        </div>
        <div class="flex-between" style="font-family:var(--font-mono);font-size:0.63rem;color:#99f6e4;margin-top:4px">
          <span>CMS 8-Min Rule: ON</span>
          <span>CPT 97153 / 97155</span>
        </div>
      </div>
    </div>
  ` : `
    <div>
      <div class="sidebar-section-label">
        <span>Family Quick Access</span>
        <span style="color:#6ee7b7">Guarded View</span>
      </div>
      <div class="sidebar-widget">
        <div class="sidebar-pillar-chips" style="grid-template-columns:1fr 1fr;margin-top:0;padding-top:0;border-top:none">
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(1, 'goals')">Skill Goals</button>
          <button class="sidebar-pillar-chip" onclick="act.quickPillar(1, 'stories')">Social Stories</button>
        </div>
      </div>
    </div>
  `;

  return `
  <div class="layout">
    <nav>
      <div class="brand-wrapper">
        <div class="brand-logo" style="cursor:pointer" onclick="go('dashboard')">
          ${brandEmblem()}
          <div>
            <div class="brand-title">Effective Behavioral</div>
            <div class="brand-sub">Ocean & Emerald Clinical OS</div>
          </div>
        </div>
        <div class="sidebar-telemetry-pill">
          <span><span class="pulse-dot"></span>EVV & FBA SYNCED</span>
          <span style="color:#38bdf8;font-weight:700">UBHR v3.4</span>
        </div>
      </div>

      <div>
        <div class="sidebar-section-label">
          <span>Clinical Command Modules</span>
          <span>01–0${NAV[me.role].length}</span>
        </div>
        <div class="nav-links">
          ${NAV[me.role].map(([r, ic, l, sub], idx) => `
            <a class="${route === r ? 'on' : ''}" onclick="go('${r}')">
              <span class="nav-ic-emblem">${ic}</span>
              <div class="nav-item-text">
                <div class="nav-item-title">${l}</div>
                <div class="nav-item-sub">${sub || ''}</div>
              </div>
              <span class="nav-item-badge">0${idx + 1}</span>
            </a>
          `).join('')}
        </div>
      </div>

      ${caseloadWidget}

      <div class="nav-user">
        <div class="nav-user-header">
          <div class="user-avatar">${userInitials}</div>
          <div style="flex:1;min-width:0;overflow:hidden">
            <div class="user-info-name" title="${esc(me.name)}">${esc(me.name)}</div>
            <span class="user-role-badge">${esc(me.role)}</span>
          </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:#99f6e4;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">1-Tap Instant Role Switch:</div>
        <div class="sidebar-role-switcher">
          <button class="role-switch-btn ${me.role === 'BCBA' ? 'active' : ''}" onclick="act.demoLogin('bcba@eba.test')">BCBA</button>
          <button class="role-switch-btn ${me.role === 'RBT' ? 'active' : ''}" onclick="act.demoLogin('rbt@eba.test')">RBT</button>
          <button class="role-switch-btn ${me.role === 'PARENT' ? 'active' : ''}" onclick="act.demoLogin('parent@eba.test')">Parent</button>
        </div>
        <a class="nav-logout" onclick="act.logout()">Sign Out of Workspace</a>
      </div>
    </nav>
    <main>
      ${content}
    </main>
  </div>
  ${floatBar}
  ${activeModal ? renderModal() : ''}`;
}

window.go = (r, id) => { location.hash = id ? `${r}/${id}` : r; };

// ---------- Views ----------

function loginView(err) {
  return `
  <div class="login-container">
    <div class="login-box">
      <div class="login-brand">
        ${brandEmblem('lg')}
        <div>
          <span class="badge p" style="margin-bottom:4px;font-size:0.68rem">PEDIATRIC ABA CLINICAL LEDGER</span>
          <h2 style="margin:0;font-size:1.45rem;font-weight:600;color:var(--slate-900)">Effective Behavioral Approach</h2>
          <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--slate-500);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px">Unified Clinical Practice & Field Record</div>
        </div>
      </div>
      
      <p style="font-size:0.9rem;color:var(--slate-600);margin:12px 0 16px">
        Sign in to access real-time session tracking, unified FBA & ABC behavioral records, and dual-signature clinical documentation.
      </p>

      <div style="background:var(--slate-50);border:1.5px solid var(--slate-300);border-left:4px solid var(--accent-clay);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="role-emblem" style="background:var(--primary);color:#F7F4EC;border-color:#D4A359;width:44px;height:44px;font-size:0.95rem;font-family:var(--font-mono)">EBA</div>
          <div>
            <div style="font-family:var(--font-mono);font-size:0.68rem;font-weight:600;color:var(--accent-clay);text-transform:uppercase;letter-spacing:0.06em">Founder & Clinical Monograph</div>
            <div style="font-family:var(--font-serif);font-size:0.94rem;font-weight:600;color:var(--slate-900)">Interactive Competitive Deck & Live Tour</div>
          </div>
        </div>
        <button class="ok" style="padding:9px 15px;font-size:0.84rem;white-space:nowrap" onclick="go('presentation')">Open Pitch Deck →</button>
      </div>

      <label>Clinician / Guardian Email</label>
      <input id="em" value="bcba@eba.test" placeholder="name@practice.com" autocomplete="username">
      
      <label>Secure Password</label>
      <input id="pw" type="password" value="password" autocomplete="current-password">
      
      <button style="width:100%;padding:12px;font-size:0.96rem;margin-top:6px" onclick="act.login()">Enter Clinical Workspace</button>
      
      ${err ? `<div class="err" style="text-align:center;margin-top:12px">⚠️ ${esc(err)}</div>` : ''}

      <div class="demo-pills">
        <div style="font-family:var(--font-mono);font-size:0.68rem;font-weight:600;color:var(--slate-500);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">1-Tap Clinical Role Credentials:</div>
        <div class="demo-pill" onclick="act.demoLogin('bcba@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem">DR</span>
            <div>
              <div style="font-family:var(--font-serif);font-weight:600;color:var(--slate-900)">Dr. Dana Rivera, BCBA</div>
              <div style="font-size:0.75rem;color:var(--slate-500)">Supervising Clinical Director</div>
            </div>
          </div>
          <span class="badge p">BCBA</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('rbt@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem">SL</span>
            <div>
              <div style="font-family:var(--font-serif);font-weight:600;color:var(--slate-900)">Sam Lee, RBT</div>
              <div style="font-size:0.75rem;color:var(--slate-500)">Registered Behavior Technician</div>
            </div>
          </div>
          <span class="badge tan">RBT</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('parent@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem">MC</span>
            <div>
              <div style="font-family:var(--font-serif);font-weight:600;color:var(--slate-900)">Mrs. Carter</div>
              <div style="font-size:0.75rem;color:var(--slate-500)">Eleanor's Parent / Guardian</div>
            </div>
          </div>
          <span class="badge att">Parent</span>
        </div>
      </div>
      
      <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--slate-500);text-align:center;margin-top:20px;font-weight:500">
        HIPAA & 21 CFR PART 11 ISOLATION · ZERO-PHI SYNTHETIC CLINICAL SANDBOX
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
    <div style="display:flex;align-items:center;gap:16px">
      ${brandEmblem('lg')}
      <div>
        <div style="font-family:var(--font-mono);font-size:0.74rem;color:#0369a1;font-weight:800;letter-spacing:0.08em;text-transform:uppercase">01 / CLINICAL COMMAND LEDGER</div>
        <h1>${me.role === 'RBT' ? 'My Clinical Day' : 'Practice Operations Ledger'}</h1>
        <p class="page-sub">${todayStr} · Shift Telemetry: <span class="badge ${sup.compliant ? 'tan' : 'att'}">● Active Practice</span></p>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="ok" style="padding:10px 16px" onclick="go('presentation')">Founder Pitch & Monograph →</button>
      <button class="sec" style="padding:10px 16px" onclick="go('schedule')">Full Clinical Schedule</button>
    </div>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="flex-between" style="align-items:flex-start;margin-bottom:8px">
        <div class="stat-label" style="margin:0">Today's Roster</div>
        <span class="badge">01</span>
      </div>
      <div class="stat">${d.appts.length}</div>
      <div class="stat-sub">Scheduled therapy sessions</div>
    </div>
    <div class="stat-card">
      <div class="flex-between" style="align-items:flex-start;margin-bottom:8px">
        <div class="stat-label" style="margin:0">1:1 Direct (97153)</div>
        <span class="badge p">CPT</span>
      </div>
      <div class="stat" style="color:var(--primary)">${d.rbt}</div>
      <div class="stat-sub">RBT direct client treatment</div>
    </div>
    <div class="stat-card">
      <div class="flex-between" style="align-items:flex-start;margin-bottom:8px">
        <div class="stat-label" style="margin:0">Direction (97155)</div>
        <span class="badge sen">BCBA</span>
      </div>
      <div class="stat" style="color:var(--sensory)">${d.bcba}</div>
      <div class="stat-sub">Protocol modification & review</div>
    </div>
    <div class="stat-card ${d.incompleteNotes > 0 ? 'warn' : 'ok'}">
      <div class="flex-between" style="align-items:flex-start;margin-bottom:8px">
        <div class="stat-label" style="margin:0">Notes Pending</div>
        <span class="badge">${d.incompleteNotes > 0 ? 'ACTION' : 'CLEAR'}</span>
      </div>
      <div class="stat" style="color:${d.incompleteNotes > 0 ? 'var(--warn)' : 'var(--ok)'}">${d.incompleteNotes}</div>
      <div class="stat-sub">Awaiting author submission / sign</div>
    </div>
    <div class="stat-card ${sup.compliant ? 'ok' : 'warn'}">
      <div class="flex-between" style="align-items:flex-start;margin-bottom:8px">
        <div class="stat-label" style="margin:0">BACB 5% Audit</div>
        <span class="badge tan">≥5% REQ</span>
      </div>
      <div class="stat" style="color:${sup.compliant ? 'var(--ok)' : 'var(--warn)'}">${sup.supPct}%</div>
      <div class="stat-sub"><span class="tag ${sup.compliant ? 'approved' : 'draft'}">${sup.compliant ? '✓ Compliant ≥5%' : '⚠ Below 5% Target'}</span></div>
    </div>
    ${me.role === 'BCBA' ? `
      <div class="stat-card warn">
        <div class="flex-between" style="align-items:flex-start;margin-bottom:8px">
          <div class="stat-label" style="margin:0">Pending Co-Signs</div>
          <span class="badge esc">21 CFR</span>
        </div>
        <div class="stat" style="color:var(--warn)">${d.pendingSign}</div>
        <div class="stat-sub">RBT notes awaiting BCBA signature</div>
      </div>
    ` : ''}
  </div>

  <div class="card">
    <div class="flex-between">
      <h3>Today's Clinical Roster</h3>
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
              <td><span style="font-family:var(--font-mono);font-weight:600">${fmtT(a.start).slice(-7)} – ${a.end.slice(11)}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="user-avatar" style="width:38px;height:38px;font-size:0.86rem">${getInitials(a.client)}</div>
                  <b style="font-family:var(--font-serif);font-size:0.98rem">${esc(a.client)}</b>
                </div>
              </td>
              <td>
                <span class="badge ${a.role === 'BCBA' ? 'sen' : 'tan'}">${esc(a.role)} (CPT ${a.role === 'BCBA' ? '97155' : '97153'})</span>
                <span class="badge">${esc(a.setting)}</span>
              </td>
              <td>
                <button class="${a.session ? 'sec' : 'ok'}" onclick="act.start(${a.id})">
                  ${a.session ? (a.session.end ? 'Review Session' : 'Resume Session →') : 'Start Session'}
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
        <h3>Insurance Authorization Burn-Down Alerts</h3>
        <span class="tag draft">≥80% Units Exhausted</span>
      </div>
      <p style="font-size:0.85rem;color:var(--slate-500);margin:0 0 14px">These authorizations are nearing expiration. Initiate re-authorization packets to prevent treatment interruption.</p>
      ${d.auths.map((a) => {
        const pct = Math.round((a.used / a.authorized) * 100);
        return `
          <div style="background:var(--slate-50);padding:12px 16px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:10px">
            <div class="flex-between">
              <div><b style="font-family:var(--font-serif)">${esc(a.client)}</b> <span class="badge p">CPT ${esc(a.code)}</span></div>
              <div style="font-family:var(--font-mono);font-size:0.82rem"><b>${a.used}</b> / ${a.authorized} units (${pct}%)</div>
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
    <div style="display:flex;align-items:center;gap:16px">
      ${brandEmblem('lg')}
      <div>
        <div style="font-family:var(--font-mono);font-size:0.74rem;color:#0369a1;font-weight:800;letter-spacing:0.08em;text-transform:uppercase">02 / UNIFIED CLINICAL RECORDS</div>
        <h1>Children & Client 360 Registry</h1>
        <p class="page-sub">Consolidated Behavioral Health Records · Skill Acquisition, FBA & BIP Portals</p>
      </div>
    </div>
    ${me.role === 'BCBA' ? `
      <div>
        <button class="ok" style="padding:10px 18px" onclick="document.getElementById('intake_card').style.display='block'">+ Intake New Client</button>
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
        <input style="margin:0" placeholder="Search by name or diagnosis..." value="${esc(clientSearchQuery)}" oninput="clientSearchQuery=this.value;render()">
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
              <div style="display:flex;align-items:center;gap:14px">
                <div class="user-avatar" style="width:42px;height:42px;font-size:0.95rem">${getInitials(c.name)}</div>
                <div>
                  <div style="font-family:var(--font-serif);font-weight:600;font-size:1.02rem;color:var(--slate-900)">${esc(c.name)}</div>
                  <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--slate-500)">DOB: ${esc(c.dob || 'On file')}</div>
                </div>
              </div>
            </td>
            <td><span class="badge p">${esc(c.diagnosis || 'ASD')}</span></td>
            <td><span class="badge att">${esc(c.communication || 'Vocal')}</span></td>
            <td>${esc(c.school || 'Home / Clinic')}</td>
            <td>
              <button class="sec" onclick="go('client',${c.id})">Open 360 Record →</button>
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
  if (!series || !series.length) return '<div style="padding:14px;background:var(--slate-50);border-radius:6px;text-align:center;color:var(--slate-400);font-size:0.85rem">No session trials collected for this target yet.</div>';
  const w = 340, h = 120, n = series.length;
  const x = (i) => n === 1 ? w / 2 : 16 + (i * (w - 32)) / (n - 1);
  const y = (p) => h - 16 - (Math.min(100, Math.max(0, p)) / 100) * (h - 32);
  const pts = series.map((s, i) => `${x(i)},${y(s.pct)}`).join(' ');
  const firstPt = `${x(0)},${h - 16}`;
  const lastPt = `${x(n - 1)},${h - 16}`;
  const areaPoly = `${firstPt} ${pts} ${lastPt}`;
  
  return `
  <div style="position:relative;margin:8px 0">
    <svg viewBox="0 0 ${w} ${h}" width="100%" style="background:linear-gradient(155deg,#e2f6f4 0%,#daf0f8 100%);border-radius:var(--radius-md);border:1.5px solid #6abdb8;overflow:hidden">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#059669" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.04"/>
        </linearGradient>
      </defs>
      <!-- Baseline line -->
      <line x1="0" x2="${w}" y1="${y(baseline)}" y2="${y(baseline)}" stroke="#3d7d82" stroke-dasharray="3"/>
      <!-- Target mastery line -->
      <line x1="0" x2="${w}" y1="${y(target)}" y2="${y(target)}" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 3"/>
      <!-- Gradient area under curve -->
      <polygon points="${areaPoly}" fill="url(#chartGrad)"/>
      <!-- Polyline -->
      <polyline fill="none" stroke="#047857" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/>
      <!-- Data circles -->
      ${series.map((s, i) => `
        <circle cx="${x(i)}" cy="${y(s.pct)}" r="4.2" fill="#ecfeff" stroke="#0284c7" stroke-width="2.5">
          <title>Session ${s.session}: ${s.pct}% independent</title>
        </circle>
      `).join('')}
    </svg>
    <div class="flex-between" style="font-family:var(--font-mono);font-size:0.7rem;color:var(--slate-600);margin-top:4px">
      <span>BASELINE: <b>${baseline}%</b></span>
      <span style="color:#0284c7;font-weight:700">CRITERION: <b>${target}%</b></span>
    </div>
  </div>`;
}

function fbaTrendChart(dailySeries, reductionMetrics) {
  const series = dailySeries || [];
  if (!series.length) {
    return '<div style="padding:20px;background:var(--slate-50);border-radius:8px;text-align:center;color:var(--slate-400);font-size:0.85rem">No longitudinal ABC observations recorded yet.</div>';
  }
  const rm = reductionMetrics || { baselineRate: 0, currentRate: 0, pctChange: 0, phaseSplitIdx: 1 };
  const w = 620, h = 195, padL = 38, padR = 26, padT = 28, padB = 34;
  const n = series.length;
  const maxVal = Math.max(5, ...series.map((d) => d.count), Math.ceil(rm.baselineRate || 0) + 1);
  const x = (i) => (n === 1 ? w / 2 : Math.round(padL + (i * (w - padL - padR)) / (n - 1)));
  const y = (v) => Math.round(h - padB - (Math.min(maxVal, Math.max(0, v)) / maxVal) * (h - padT - padB));

  const pts = series.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
  const areaPoly = `${x(0)},${h - padB} ${pts} ${x(n - 1)},${h - padB}`;
  const splitIdx = n >= 3 ? Math.min(n - 1, Math.max(1, rm.phaseSplitIdx || Math.floor(n * 0.4))) : null;
  const splitX = splitIdx !== null ? Math.round((x(splitIdx - 1) + x(splitIdx)) / 2) : null;

  const gridSteps = [0, Math.round(maxVal / 2), maxVal];

  return `
  <div class="fba-chart-wrap">
    <svg viewBox="0 0 ${w} ${h}" width="100%" style="background:linear-gradient(155deg,#e2f6f4 0%,#d9eff8 100%);border-radius:8px;border:1.5px solid #6abdb8;overflow:visible;display:block">
      <defs>
        <linearGradient id="fbaAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.28"/>
          <stop offset="65%" stop-color="#0d9488" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.03"/>
        </linearGradient>
      </defs>

      <!-- Phase Background Zones -->
      ${splitX !== null ? `
        <rect x="${padL}" y="${padT - 8}" width="${splitX - padL}" height="${h - padT - padB + 8}" fill="rgba(2,132,199,0.09)" rx="3"/>
        <rect x="${splitX}" y="${padT - 8}" width="${w - padR - splitX}" height="${h - padT - padB + 8}" fill="rgba(16,185,129,0.12)" rx="3"/>
        <text x="${padL + 8}" y="${padT + 4}" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" fill="#0369a1" letter-spacing="0.05em">BASELINE (${rm.baselineRate}/DAY)</text>
        <text x="${splitX + 10}" y="${padT + 4}" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" fill="#047857" letter-spacing="0.05em">BIP / FCT PHASE (${rm.currentRate}/DAY)</text>
      ` : ''}

      <!-- Horizontal Grid Lines -->
      ${gridSteps.map((gv) => `
        <line x1="${padL}" x2="${w - padR}" y1="${y(gv)}" y2="${y(gv)}" stroke="#99cfc9" stroke-width="1"/>
        <text x="${padL - 8}" y="${y(gv) + 3}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="700" fill="#255f66">${gv}</text>
      `).join('')}

      <!-- Baseline & Intervention Mean Reference Lines -->
      ${rm.baselineRate > 0 ? `
        <line x1="${padL}" x2="${splitX || (w - padR)}" y1="${y(rm.baselineRate)}" y2="${y(rm.baselineRate)}" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
      ` : ''}
      ${splitX !== null && rm.currentRate >= 0 ? `
        <line x1="${splitX}" x2="${w - padR}" y1="${y(rm.currentRate)}" y2="${y(rm.currentRate)}" stroke="#047857" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.9"/>
      ` : ''}

      <!-- Phase Change Vertical Divider -->
      ${splitX !== null ? `
        <line x1="${splitX}" x2="${splitX}" y1="${padT - 8}" y2="${h - padB}" stroke="#0d9488" stroke-width="2" stroke-dasharray="5 3"/>
      ` : ''}

      <!-- Area & Trend Polyline -->
      <polygon points="${areaPoly}" fill="url(#fbaAreaGrad)"/>
      <polyline fill="none" stroke="#0b5d5e" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/>

      <!-- Data Points & Labels -->
      ${series.map((d, i) => {
        const cx = x(i);
        const cy = y(d.count);
        const isPost = splitIdx !== null && i >= splitIdx;
        const dotColor = isPost ? '#047857' : '#0284c7';
        return `
          <g>
            <circle cx="${cx}" cy="${cy}" r="5" fill="#ecfeff" stroke="${dotColor}" stroke-width="2.75">
              <title>${esc(d.label)} (${esc(d.phase || 'Observation')}): ${d.count} incident(s)</title>
            </circle>
            <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="700" fill="${dotColor}">${d.count}</text>
            <text x="${cx}" y="${h - 12}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="#164b54">${esc(d.label)}</text>
          </g>
        `;
      }).join('')}
    </svg>
  </div>`;
}

function fbaFunctionDonut(functions, total) {
  const fnColors = [
    { key: 'Escape', label: 'Escape / Avoidance', color: '#0284c7' },
    { key: 'Tangible', label: 'Access to Tangible', color: '#059669' },
    { key: 'Attention', label: 'Attention Seeking', color: '#0d9488' },
    { key: 'Sensory', label: 'Automatic / Sensory', color: '#1d4ed8' }
  ];
  const r = 52;
  const c = +(2 * Math.PI * r).toFixed(2);
  let offset = 0;
  const arcs = total > 0 ? fnColors.map((item) => {
    const cnt = (functions && functions[item.key]) || 0;
    if (!cnt) return '';
    const frac = cnt / total;
    const len = +(frac * c).toFixed(2);
    const dashOffset = -offset;
    offset += len;
    return `<circle cx="72" cy="72" r="${r}" fill="none" stroke="${item.color}" stroke-width="18" stroke-dasharray="${len} ${c}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 72 72)">
      <title>${item.label}: ${cnt} (${Math.round(frac * 100)}%)</title>
    </circle>`;
  }).join('') : `<circle cx="72" cy="72" r="${r}" fill="none" stroke="#99cfc9" stroke-width="18"/>`;

  return `
  <svg viewBox="0 0 144 144" width="144" height="144" style="flex-shrink:0">
    <circle cx="72" cy="72" r="${r}" fill="none" stroke="#bce6e2" stroke-width="18"/>
    ${arcs}
    <text x="72" y="68" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" font-weight="700" fill="#041d24">${total}</text>
    <text x="72" y="84" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8.5" font-weight="700" fill="#164b54" letter-spacing="0.06em">ABC EVENTS</text>
  </svg>`;
}

const ANTS = ['Transition from preferred activity', 'Removal of preferred item', 'Difficult academic task', 'Denied access', 'Peer proximity / space', 'Loud sensory environment', 'Unstructured free time'];
const BEHAVIORS = ['Screaming', 'Aggression', 'Elopement', 'Task refusal', 'Crying', 'Property destruction', 'Self-injurious behavior'];

async function clientView(id) {
  const data = await api('GET', '/api/clients/' + id);
  const {
    client: c, goals, plans, stories, auths, assigned,
    abcLogs = [], abcSummary = { functions: {}, total: 0 }, supervisionLogs = [],
    behaviorPrograms = [], behaviorEvents = [], behaviorSummary = {},
    taskAnalyses = [], fidelityIoaLogs = [], auditLogs = []
  } = data;
  const B = me.role === 'BCBA', P = me.role === 'PARENT';
  const tabs = P ? [['goals', '01 · Skill Goals'], ['stories', '02 · Social Stories']] : [
    ['overview', '01 · 360 Overview'],
    ['skills', '02 · Skills, DTT & Task Analysis'],
    ['behavior_abc', '03 · Behavior Reduction & FBA'],
    ['plans', '04 · Behavior Plans (BIP)'],
    ['stories', '05 · Social Stories'],
    ['profile', '06 · Clinical Vitals'],
    ['services', '07 · Authorizations & Audit']
  ];
  if (P && !['goals', 'stories'].includes(tab)) tab = 'goals';
  if (!P && !tabs.map(t=>t[0]).includes(tab)) tab = 'overview';

  // Pinned Clinical Vitals Banner
  const vitalsBanner = `
  <div class="vitals-banner">
    <div class="vitals-header">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="user-avatar xl">${getInitials(c.name)}</div>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--accent-clay);font-weight:600;letter-spacing:0.08em;text-transform:uppercase">UNIFIED BEHAVIORAL HEALTH RECORD · #00${c.id}</div>
          <h2 style="margin:2px 0 5px;font-size:1.7rem;font-weight:600;color:var(--slate-900)">${esc(c.name)}</h2>
          <div style="font-size:0.82rem;color:var(--slate-500);display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge p">${esc(c.diagnosis || 'Autism Spectrum Disorder')}</span>
            ${c.dob ? `<span class="badge">DOB: ${esc(c.dob)}</span>` : ''}
            ${c.school ? `<span class="badge">${esc(c.school)}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${!P ? `
          <button class="sec" style="padding:8px 12px;font-size:0.8rem" onclick="window.open('/api/clients/${c.id}/export-csv?type=trials','_blank')">📥 Trials CSV</button>
          <button class="sec" style="padding:8px 12px;font-size:0.8rem" onclick="window.open('/api/clients/${c.id}/export-csv?type=behaviors','_blank')">📥 Behavior CSV</button>
          <button class="sec" style="padding:8px 12px;font-size:0.8rem" onclick="act.openAuditModal(${c.id})">🛡️ Audit Trail (${auditLogs.length})</button>
        ` : ''}
        ${B ? `<button class="sec" style="padding:9px 15px;font-size:0.84rem" onclick="act.openReauthReportModal(${c.id})">6-Month Re-Auth Dossier</button>` : ''}
        ${auths.length ? auths.map(a => `<span class="badge ${a.used/a.authorized >= 0.8 ? 'att' : 'tan'}">CPT ${esc(a.code)}: ${a.authorized - a.used}u rem</span>`).join(' ') : ''}
        <button class="bad" style="padding:9px 15px;font-size:0.84rem" onclick="act.toggleCrisis()">
          ${showCrisis ? 'Hide Crisis Protocol' : 'Crisis / Safety Protocol'}
        </button>
      </div>
    </div>
    
    <div class="vitals-grid">
      <div class="vital-item">
        <div class="vital-emblem" style="font-family:var(--font-mono);font-size:0.74rem;font-weight:700;color:var(--primary)">COM</div>
        <div>
          <div class="vital-label">Communication Modality</div>
          <b>${esc(c.communication || 'Verbal (full sentences)')}</b>
        </div>
      </div>
      <div class="vital-item">
        <div class="vital-emblem" style="font-family:var(--font-mono);font-size:0.74rem;font-weight:700;color:var(--sensory);background:var(--sensory-light);border-color:var(--sensory-border)">SEN</div>
        <div>
          <div class="vital-label">Sensory Profile</div>
          <b>${esc(c.sensory || 'Sensory sensitive (avoids loud sirens)')}</b>
        </div>
      </div>
      <div class="vital-item">
        <div class="vital-emblem" style="font-family:var(--font-mono);font-size:0.74rem;font-weight:700;color:var(--warn);background:var(--warn-light);border-color:var(--warn-border)">ANT</div>
        <div>
          <div class="vital-label">Known Antecedent Triggers</div>
          <b>${esc(c.triggers || 'Difficult task transitions, peer proximity')}</b>
        </div>
      </div>
      <div class="vital-item">
        <div class="vital-emblem" style="font-family:var(--font-mono);font-size:0.74rem;font-weight:700;color:var(--ok);background:var(--ok-light);border-color:var(--ok-border)">SR+</div>
        <div>
          <div class="vital-label">Reinforcer Hierarchy</div>
          <b>${esc(c.reinforcers || 'LEGO, bubbles, sensory swing')}</b>
        </div>
      </div>
    </div>

    ${showCrisis ? `
    <div class="crisis-box">
      <div class="flex-between">
        <h4 style="margin:0;color:#7D1F18">Immediate De-Escalation & Safety Crisis Protocol</h4>
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
            <h3>Active Skill Acquisition Targets</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${!P ? `<button class="ok" style="font-size:0.78rem;padding:5px 10px" onclick="act.openCreateGoalModal(${c.id})">+ Add Target</button>` : ''}
              <button class="sec" style="font-size:0.78rem;padding:5px 10px" onclick="act.setTab('skills')">All Targets →</button>
            </div>
          </div>
          ${goals.slice(0, 3).map(g => {
            const stMeta = GOAL_STATUS_META[g.status] || GOAL_STATUS_META.active;
            return `
            <div class="goal-click-card" onclick="act.openGoalModal(${g.id})">
              <div class="flex-between" style="gap:8px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <b style="font-family:var(--font-serif);font-size:1.02rem;color:var(--primary)">${esc(g.title)}</b>
                  <span class="tag ${stMeta.cls}">${esc(g.status === 'active' ? g.trend : stMeta.label)}</span>
                  <span class="badge" style="font-size:0.68rem">${esc(g.domain || 'Skill Acquisition')}</span>
                </div>
                <span class="badge p" style="font-size:0.68rem">Review / Edit →</span>
              </div>
              <div style="font-family:var(--font-mono);font-size:0.76rem;color:var(--slate-600);margin:5px 0 6px">
                Baseline: <b>${g.baseline}%</b> · Avg: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b> · Criterion: <b>${g.target}% (${g.mastery_sessions || 3} sess)</b>
                · Indep: <b>${g.indep_pct ?? 0}% (${esc(g.indep_num_denom || '0/0')})</b> · Prompted: <b>${g.prompted_pct ?? 0}% (${esc(g.prompted_num_denom || '0/0')})</b>
              </div>
              ${g.mastery_met && g.status !== 'mastered' ? `
                <div class="mastery-banner" onclick="event.stopPropagation()">
                  <span>${esc(g.recommendation)}</span>
                  ${!P ? `<button class="ok" style="font-size:0.75rem;padding:4px 10px" onclick="act.quickMasterGoal(${g.id})">Master Goal</button>` : ''}
                </div>
              ` : g.stalled || g.regression ? `
                <div class="stalled-banner">${esc(g.recommendation)}</div>
              ` : ''}
              ${chart(g.series, g.baseline, g.target)}
            </div>`;
          }).join('') || '<p style="color:var(--slate-400)">No skill targets active yet.</p>'}
        </div>

        <div class="card">
          <div class="flex-between">
            <h3>Behavior Intervention Plan (BIP)</h3>
            <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.setTab('plans')">Manage BIP →</button>
          </div>
          ${plans.length ? `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <b style="font-family:var(--font-serif)">Target: ${esc(plans[0].behavior)}</b>
              <span class="tag ${plans[0].status}">${plans[0].status}</span>
            </div>
            <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:10px 14px;border-radius:var(--radius-md);margin-bottom:10px">
              <div style="font-family:var(--font-mono);font-size:0.7rem;font-weight:600;color:var(--ok);text-transform:uppercase">Functional Replacement Behavior (FCT):</div>
              <b style="color:#124A34">${esc(plans[0].data.replacement)}</b>
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
            <h3>ABC & Behavior Reduction Center</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="sec" style="font-size:0.8rem;padding:5px 10px" onclick="act.setTab('behavior_abc')">9-Method Suite →</button>
              <button class="ok" style="font-size:0.84rem;padding:6px 12px" onclick="act.openAbcModal(${c.id})">+ Log ABC Incident</button>
            </div>
          </div>
          <p style="font-size:0.85rem;color:var(--slate-500);margin:0 0 12px">Total of <b>${abcSummary.total || 0}</b> ABC incidents & <b>${behaviorSummary.totalEvents || 0}</b> continuous/interval measurements recorded:</p>
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
                <b style="font-family:var(--font-serif)">${esc(a.behavior)}</b>
                <div style="display:flex;gap:4px">
                  ${a.intensity ? `<span class="badge">${esc(a.intensity)}</span>` : ''}
                  <span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : 'esc'}">${esc(a.perceived_function || 'Escape')}</span>
                </div>
              </div>
              <div style="color:var(--slate-500);font-size:0.8rem;margin-top:2px">
                Antecedent: ${esc(a.antecedent)} · Consequence: ${esc(a.consequence)}${a.setting ? ` · Setting: ${esc(a.setting)}` : ''}
              </div>
            </div>
          `).join('') || '<p style="color:var(--slate-400)">Zero maladaptive behavior episodes logged.</p>'}
        </div>

        <div class="card">
          <div class="flex-between">
            <h3>Social Stories & Caregiver Tools</h3>
            <button class="sec" style="font-size:0.8rem;padding:4px 10px" onclick="act.setTab('stories')">Stories →</button>
          </div>
          ${stories.slice(0, 2).map(s => `
            <div style="padding:10px 12px;border-radius:var(--radius-md);background:var(--slate-50);border:1px solid var(--slate-200);margin-bottom:8px">
              <div class="flex-between">
                <b style="font-family:var(--font-serif)">${esc(s.content.title)}</b>
                <span class="tag ${s.status}">${s.status}</span>
              </div>
              ${s.status === 'shared' ? `<div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--primary);margin-top:4px">✓ PUBLISHED TO FAMILY PORTAL</div>` : ''}
            </div>
          `).join('') || '<p style="color:var(--slate-400)">No social stories created yet.</p>'}
        </div>
      </div>
    </div>`;
  }

  // Tab: Skills, DTT & Task Analysis (also used for Parent 'goals' tab)
  else if (tab === 'skills' || tab === 'goals') {
    body = `
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <h3 style="margin:0">Skill Targets & Discrete Trial Training (DTT / NET)</h3>
            <span class="badge p">Explicit Numerator / Denominator · 10 Prompt Levels</span>
          </div>
          <p style="font-size:0.85rem;color:var(--slate-500);margin:4px 0 0">Core Data-Quality Rule: Independent and prompted responses are tracked separately. N/A trials are excluded from the opportunity denominator.</p>
        </div>
        ${!P ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="sec" onclick="window.open('/api/clients/${c.id}/export-csv?type=trials','_blank')">📥 Export Trials CSV</button>
            <button class="ok" onclick="act.openCreateGoalModal(${c.id})">+ Create New Skill Target</button>
          </div>
        ` : ''}
      </div>

      <div style="margin-top:16px">
        ${goals.map((g) => {
          const lastSession = g.series && g.series.length ? g.series[g.series.length - 1] : null;
          const stMeta = GOAL_STATUS_META[g.status] || GOAL_STATUS_META.active;
          return `
          <div class="goal-click-card" style="background:var(--surface);padding:20px;border-radius:var(--radius-lg);border:1px solid var(--slate-200);margin-bottom:16px" onclick="act.openGoalModal(${g.id})">
            <div class="flex-between" style="flex-wrap:wrap;gap:10px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <h4 style="margin:0;font-size:1.14rem;color:var(--slate-900)">${esc(g.title)}</h4>
                <span class="badge p">#${g.id}</span>
                <span class="tag ${stMeta.cls}">${esc(g.status === 'active' ? g.trend : stMeta.label)}</span>
                <span class="badge">${esc(g.domain || 'Communication / Manding')}</span>
                <span class="badge">${esc(g.prompt_strategy || 'Least-to-Most (LTM)')}</span>
                <span class="badge ${g.scoring_rule === 'include_prompted' ? 'att' : 'tan'}">
                  ${g.scoring_rule === 'include_prompted' ? 'Scoring: Indep + Prompted' : 'Scoring: Independent Only'}
                </span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap" onclick="event.stopPropagation()">
                <button class="sec" style="font-size:0.8rem;padding:6px 12px" onclick="act.openGoalModal(${g.id})">Review Data & Edit Goal</button>
                ${!P && g.status !== 'mastered' ? `<button class="ok" style="font-size:0.8rem;padding:6px 12px" onclick="act.quickMasterGoal(${g.id})">Master Goal</button>` : ''}
                ${!P && g.status === 'mastered' ? `<button class="sec" style="font-size:0.8rem;padding:6px 12px" onclick="act.quickReactivateGoal(${g.id})">Reactivate</button>` : ''}
              </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--slate-600);margin:8px 0 10px;display:flex;gap:12px;flex-wrap:wrap">
              <span>Baseline: <b>${g.baseline}%</b></span>
              <span>${g.mastery_sessions || 3}-Session Avg: <b>${g.current ?? '—'}${g.current !== null ? '%' : ''}</b></span>
              <span>Criterion: <b>${g.target}% (${g.mastery_sessions || 3} sess)</b></span>
              <span>Independent: <b style="color:var(--ok)">${g.indep_pct ?? 0}% (${esc(g.indep_num_denom || '0/0')})</b></span>
              <span>Prompted: <b>${g.prompted_pct ?? 0}% (${esc(g.prompted_num_denom || '0/0')})</b></span>
              <span>Latest Session: <b>${lastSession ? `${lastSession.pct}% (${esc(lastSession.numDenom || `${lastSession.prompts?.I || 0}/${lastSession.n}`)})` : '—'}</b></span>
              <span>Completeness: <b>${g.data_completeness_pct ?? 100}%</b></span>
            </div>
            ${g.mastery_met && g.status !== 'mastered' ? `
              <div class="mastery-banner" onclick="event.stopPropagation()">
                <span><b>Clinical Intelligence:</b> ${esc(g.recommendation)}</span>
                ${!P ? `<button class="ok" style="font-size:0.78rem;padding:5px 12px" onclick="act.quickMasterGoal(${g.id})">Advance to Mastered</button>` : ''}
              </div>
            ` : g.stalled || g.regression ? `
              <div class="stalled-banner"><b>Clinical Alert:</b> ${esc(g.recommendation)} — <i>Click card to adjust prompt level, status, or target criteria.</i></div>
            ` : ''}
            ${chart(g.series, g.baseline, g.target)}
            ${lastSession && lastSession.prompts ? `
              <div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--slate-200);font-size:0.8rem;color:var(--slate-600);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-family:var(--font-mono);font-size:0.72rem;font-weight:600">PROMPT FADING (LATEST SESSION · ${lastSession.n} OPPS):</span>
                ${Object.entries(lastSession.prompts).map(([code, cnt]) => cnt > 0 ? `<span class="badge ${code==='I'?'tan':'p'}">${code} (${LV[code]?.label || code}): <b>${cnt}/${lastSession.n}</b></span>` : '').join('')}
              </div>
            ` : ''}
          </div>`;
        }).join('') || '<p style="color:var(--slate-400)">No skill targets defined yet.</p>'}
      </div>
    </div>

    ${!P ? `
      <!-- Task Analysis & Chaining Section (Build Spec §6) -->
      <div class="card">
        <div class="flex-between" style="flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <h3 style="margin:0">Task Analysis & Chaining Programs (Step-by-Step Scoring)</h3>
              <span class="badge p">Forward · Backward · Total-Task Presentation</span>
            </div>
            <p style="font-size:0.85rem;color:var(--slate-500);margin:4px 0 0">Track multi-step adaptive & daily living routines with step-level prompt fading and explicit independent steps / total steps ratios.</p>
          </div>
          <button class="ok" onclick="act.openCreateTaModal(${c.id})">+ Create Task Analysis Routine</button>
        </div>

        <div style="margin-top:16px;display:grid;gap:16px">
          ${taskAnalyses.map((ta) => {
            const latestRun = ta.history && ta.history.length ? ta.history[ta.history.length - 1] : null;
            const draftArr = taDraftSteps[ta.id] || ta.steps.map((st, idx) => (latestRun && latestRun.results && latestRun.results[idx]) ? latestRun.results[idx].status : 'I');
            return `
              <div style="background:var(--slate-50);border:1.5px solid var(--slate-200);border-radius:var(--radius-lg);padding:18px">
                <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:10px">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                      <h4 style="margin:0;font-size:1.08rem;color:var(--slate-900)">${esc(ta.title)}</h4>
                      <span class="badge p">${esc(ta.chaining_type || 'Total-Task Presentation')}</span>
                      <span class="tag approved">${ta.steps.length} Steps · Target ${ta.target_pct || 80}%</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--slate-600);margin-top:4px">
                      Latest Run: <b>${latestRun ? `${latestRun.indepPct}% (${esc(latestRun.numDenom || `${latestRun.indepCount}/${ta.steps.length}`)}) on ${esc(latestRun.date)}` : 'No runs logged yet'}</b>
                      · Total Logged Runs: <b>${(ta.history || []).length}</b>
                    </div>
                  </div>
                  <button class="ok" style="padding:7px 14px;font-size:0.82rem" onclick="act.submitTaRun(${ta.id})">✓ Log Step-by-Step Run</button>
                </div>

                <div style="display:grid;gap:8px;margin-top:10px">
                  ${ta.steps.map((stepName, sIdx) => {
                    const curCode = draftArr[sIdx] || 'I';
                    return `
                      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;padding:8px 12px;border-radius:8px;border:1px solid var(--slate-200)">
                        <div style="font-size:0.86rem;font-weight:600;color:var(--slate-800)">
                          <span style="font-family:var(--font-mono);color:var(--primary);margin-right:6px">Step ${sIdx + 1}:</span>
                          ${esc(stepName)}
                        </div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap">
                          ${['I', 'V', 'G', 'Vi', 'M', 'PP', 'P', 'INC', 'N', 'NA'].map((code) => `
                            <button class="${curCode === code ? (code === 'I' ? 'ok' : code === 'INC' || code === 'N' ? 'bad' : 'btn-v') : 'sec'}"
                              style="padding:4px 8px;font-size:0.73rem;min-height:28px"
                              onclick="act.setTaDraftStep(${ta.id}, ${sIdx}, '${code}', ${ta.steps.length})">
                              ${code}
                            </button>
                          `).join('')}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('') || '<p style="color:var(--slate-400)">No task analyses configured yet.</p>'}
        </div>
      </div>
    ` : ''}`;
  }

  // Tab: Behavior & ABC Logs (FBA Analytics & 9-Method Behavior Reduction Suite)
  else if (tab === 'behavior_abc') {
    const totalAbc = abcSummary.total || abcLogs.length || 0;
    const rm = abcSummary.reductionMetrics || { baselineRate: 0, currentRate: 0, pctChange: 0, trendDirection: 'Stable', replacementSuccessRate: 100, observationDays: 0 };
    const domFn = abcSummary.dominantFunction || { name: 'Escape', count: 0, pct: 0, secondaryName: null, secondaryPct: 0 };
    const antMatrix = abcSummary.antecedentMatrix || [];
    const conMatrix = abcSummary.consequenceMatrix || [];
    const behMatrix = abcSummary.behaviorMatrix || [];
    const topAnt = antMatrix[0] || null;
    behaviorPrograms.forEach((bp) => { bpNameMap[bp.id] = bp.name; });
    const bSum = mergeAndSummarizeBehaviorEvents(behaviorEvents, c.id, null, (behaviorSummary && behaviorSummary.sessionMinutes) || 180);

    const filteredAbc = abcLogs.filter((a) => {
      if (fbaFilterBehavior !== 'ALL' && a.behavior !== fbaFilterBehavior) return false;
      if (fbaFilterFunction !== 'ALL' && (a.perceived_function || 'Escape') !== fbaFilterFunction) return false;
      if (fbaFilterHour !== null && a.ts && new Date(a.ts).getHours() !== fbaFilterHour) return false;
      return true;
    });
    const hasActiveFilter = fbaFilterBehavior !== 'ALL' || fbaFilterFunction !== 'ALL' || fbaFilterHour !== null;

    const fnMeta = [
      { key: 'Escape', label: 'Escape / Avoidance', desc: 'Social Negative Reinforcement (Demand / Transition)', color: '#B6362C', bg: '#FBECE9', border: '#EBBDB7' },
      { key: 'Tangible', label: 'Access to Tangible', desc: 'Social Positive Reinforcement (Preferred Item / Activity)', color: '#C8923A', bg: '#FCF4E4', border: '#E8CBA0' },
      { key: 'Attention', label: 'Attention Seeking', desc: 'Social Positive Reinforcement (Peer / Adult Attention)', color: '#1E5670', bg: '#EAF2F6', border: '#B5D0DD' },
      { key: 'Sensory', label: 'Automatic / Sensory', desc: 'Automatic Reinforcement (Auditory / Proprioceptive)', color: '#6A3D7A', bg: '#F4EDF7', border: '#D6BFE0' }
    ];

    const maxHourlyCount = Math.max(1, ...((abcSummary.scatterplot ? abcSummary.scatterplot.hourly : []).map((h) => h.count)));

    body = `
    <!-- Clinical Advisor Principle Banner (Durriya Anwar, MS, BCBA Checklist §14) -->
    <div class="card" style="background:linear-gradient(135deg,#072a30 0%,#0b4650 100%);color:#ecfeff;border:1.5px solid #14b8a6;padding:16px 20px">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-family:var(--font-mono);font-size:0.7rem;color:#6ee7b7;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">CLINICAL DATA INTEGRITY STANDARD · DURRIYA ANWAR, MS, BCBA</div>
          <div style="font-family:var(--font-serif);font-size:1.02rem;font-style:italic;margin-top:4px;color:#ffffff">
            "Every number in the app should trace back to a clear operational definition, a known observation period, a consistent measurement method, and a separated prompt history."
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="sec" style="background:rgba(255,255,255,0.12);color:#ecfeff;border-color:#6ee7b7;font-size:0.78rem;padding:6px 12px" onclick="window.open('/api/clients/${c.id}/export-csv?type=behaviors','_blank')">📥 Export Behavior & ABC CSV</button>
          <button class="ok" style="font-size:0.78rem;padding:6px 12px" onclick="act.openBehaviorProgramModal(${c.id})">+ Define Target Behavior</button>
        </div>
      </div>
    </div>

    <!-- Target Behavior Operational Definitions & 9-Method Measurement Suite (Build Spec §2 & §5) -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <h3 style="margin:0">Target Behavior Operational Definitions & 9-Method Measurement Suite</h3>
            <span class="badge p">Frequency · Rate · Duration · Latency · IRT · Partial/Whole Interval · MTS · ABC</span>
          </div>
          <p style="font-size:0.84rem;color:var(--slate-500);margin:3px 0 0">Individualized operational definitions per client with automatic continuous and discontinuous interval calculations.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="sec" style="font-size:0.8rem;padding:6px 12px" onclick="act.openBehaviorEventModal(${c.id})">+ Log Continuous / Interval Data</button>
          <button class="ok" style="font-size:0.8rem;padding:6px 12px" onclick="act.openAbcModal(${c.id})">+ Log ABC Incident</button>
        </div>
      </div>

      <!-- 6-Card Continuous & Interval Calculation Strip -->
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-bottom:16px">
        <div class="fba-kpi-card" style="border-left:4px solid var(--primary)">
          <div class="fba-kpi-label">Frequency & Rate</div>
          <div class="fba-kpi-val" style="font-size:1.15rem">${bSum.frequencyCount || 0} events · ${bSum.ratePerHour || 0}/hr</div>
          <div class="fba-kpi-sub">${bSum.ratePerMinute || 0}/min across ${bSum.sessionMinutes || 180}m observed</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid var(--warn)">
          <div class="fba-kpi-label">Duration Recording</div>
          <div class="fba-kpi-val" style="font-size:1.15rem">Avg ${bSum.avgDurationSec || 0}s</div>
          <div class="fba-kpi-sub">Total: ${bSum.totalDurationSec || 0}s (${bSum.durationCount || 0} episodes)</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid var(--sensory)">
          <div class="fba-kpi-label">Latency from SD</div>
          <div class="fba-kpi-val" style="font-size:1.15rem">Avg ${bSum.avgLatencySec || 0}s</div>
          <div class="fba-kpi-sub">${bSum.latencyCount || 0} latency probes recorded</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid #0284c7">
          <div class="fba-kpi-label">Inter-Response Time (IRT)</div>
          <div class="fba-kpi-val" style="font-size:1.15rem">Avg ${bSum.avgIrtSec || 0}s</div>
          <div class="fba-kpi-sub">${bSum.irtCount || 0} inter-response intervals</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid var(--ok)">
          <div class="fba-kpi-label">Partial / Whole / MTS</div>
          <div class="fba-kpi-val" style="font-size:1.15rem">${bSum.intervalPct ?? 0}% (${esc(bSum.intervalNumDenom || '0/0')})</div>
          <div class="fba-kpi-sub">Discontinuous interval sampling</div>
        </div>
      </div>

      <!-- Individualized Target Behavior Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px">
        ${behaviorPrograms.map((bp) => {
          const bpStats = (bSum.byBehavior && (bSum.byBehavior[`id_${bp.id}`] || bSum.byBehavior[bp.name])) || { frequency: 0, ratePerHour: 0, avgDurationSec: 0, avgLatencySec: 0, intervalPct: null, intervalNumDenom: '0/0' };
          return `
            <div style="background:var(--slate-50);border:1.5px solid var(--slate-200);border-radius:10px;padding:14px">
              <div class="flex-between" style="gap:8px;flex-wrap:wrap">
                <div>
                  <b style="font-family:var(--font-serif);font-size:1rem;color:var(--slate-900)">${esc(bp.name)}</b>
                  <span class="badge ${bp.function_hypothesis ? bp.function_hypothesis.toLowerCase().slice(0,3) : 'esc'}" style="margin-left:6px">${esc(bp.function_hypothesis || 'Escape')}</span>
                </div>
                <span class="badge p" style="text-transform:uppercase">${esc((bp.measurement_type || 'frequency').replace('_', ' '))}</span>
              </div>
              <div style="font-size:0.81rem;color:var(--slate-700);margin:6px 0">
                <b>Operational Definition:</b> ${esc(bp.operational_definition || 'Defined per BIP protocol.')}
              </div>
              ${bp.non_examples ? `<div style="font-size:0.76rem;color:var(--slate-500);margin-bottom:6px"><b>Non-Examples:</b> ${esc(bp.non_examples)}</div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px dashed var(--slate-200);font-family:var(--font-mono);font-size:0.75rem">
                <span>Freq: <b>${bpStats.frequency}</b> (${bpStats.ratePerHour}/hr) · Avg Dur: <b>${bpStats.avgDurationSec}s</b>${bpStats.intervalPct !== null ? ` · Int: <b>${bpStats.intervalPct}% (${bpStats.intervalNumDenom})</b>` : ''}</span>
                <button class="ok" style="padding:4px 10px;font-size:0.74rem" onclick="act.quickTallyBehavior(${c.id}, null, ${bp.id})">+1 Tally</button>
              </div>
            </div>
          `;
        }).join('') || '<div style="color:var(--slate-400)">No individualized target behavior definitions yet.</div>'}
      </div>
    </div>

    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <h3 style="margin:0">Functional Behavior Assessment (FBA) & ABC Analytics</h3>
            <span class="badge p">CPT 97151 / 97155 Clinical Analytics</span>
          </div>
          <p style="font-size:0.85rem;color:var(--slate-500);margin:4px 0 0">Longitudinal behavior reduction graphing, 4-function contingency weighting, antecedent conditional probabilities, and FBA progress reporting.</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="sec" onclick="act.openFbaReportModal(${c.id})">
            Generate FBA & Progress Report
          </button>
          <button class="ok" onclick="act.openAbcModal(${c.id})">+ Log ABC Incident</button>
        </div>
      </div>

      <!-- Executive FBA Hypothesis & Behavior Reduction KPI Strip -->
      <div class="fba-kpi-strip" style="margin-top:16px">
        <div class="fba-kpi-card" style="border-left:4px solid var(--escape)">
          <div class="fba-kpi-label">Primary Hypothesized Function</div>
          <div class="fba-kpi-val" style="color:var(--escape)">${esc(domFn.name)} (${domFn.pct}%)</div>
          <div class="fba-kpi-sub">${domFn.count} of ${totalAbc} events${domFn.secondaryName ? ` · Secondary: <b>${esc(domFn.secondaryName)} (${domFn.secondaryPct}%)</b>` : ''}</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid ${rm.pctChange <= 0 ? 'var(--ok)' : 'var(--warn)'}">
          <div class="fba-kpi-label">Behavior Reduction Rate</div>
          <div class="fba-kpi-val" style="color:${rm.pctChange <= 0 ? 'var(--ok)' : 'var(--warn)'}">
            ${rm.baselineRate}/d → ${rm.currentRate}/d
            <span class="badge ${rm.pctChange <= 0 ? 'tan' : 'esc'}" style="font-size:0.72rem;vertical-align:middle;margin-left:4px">
              ${rm.pctChange <= 0 ? `↓ ${Math.abs(rm.pctChange)}%` : `↑ ${rm.pctChange}%`}
            </span>
          </div>
          <div class="fba-kpi-sub">${esc(rm.trendDirection)} across ${rm.observationDays} observation days</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid var(--primary)">
          <div class="fba-kpi-label">Top Antecedent Conditional Prob.</div>
          <div class="fba-kpi-val" style="color:var(--primary);font-size:1.15rem">${topAnt ? `${topAnt.pct}% (${topAnt.count}x)` : '0%'}</div>
          <div class="fba-kpi-sub" title="${esc(topAnt ? topAnt.antecedent : '')}">${topAnt ? esc(topAnt.antecedent) : 'No antecedents logged'}</div>
        </div>
        <div class="fba-kpi-card" style="border-left:4px solid var(--ok)">
          <div class="fba-kpi-label">FCT / De-escalation Success</div>
          <div class="fba-kpi-val" style="color:var(--ok)">${rm.replacementSuccessRate}%</div>
          <div class="fba-kpi-sub">Episodes resolved via FCT card / visual schedule</div>
        </div>
      </div>

      <!-- Interactive Target Behavior Topography Filter Bar -->
      <div class="fba-filter-bar" style="margin-top:16px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-family:var(--font-mono);font-size:0.7rem;font-weight:600;color:var(--slate-500);text-transform:uppercase;letter-spacing:0.05em;margin-right:4px">Target Topography:</span>
          <button class="fba-chip ${fbaFilterBehavior === 'ALL' ? 'active' : ''}" onclick="act.setFbaBehavior('ALL')">
            All Behaviors (${totalAbc})
          </button>
          ${behMatrix.map((bm) => `
            <button class="fba-chip ${fbaFilterBehavior === bm.behavior ? 'active' : ''}" onclick="act.setFbaBehavior(${JSON.stringify(bm.behavior).replace(/"/g, '&quot;')})">
              ${esc(bm.behavior)} <b>(${bm.count} · ${bm.pct}%)</b>
            </button>
          `).join('')}
        </div>
        ${hasActiveFilter ? `
          <button class="sec" style="padding:4px 10px;font-size:0.74rem;color:var(--bad);border-color:var(--bad-border)" onclick="act.resetFbaFilters()">
            ✕ Reset Filters
          </button>
        ` : ''}
      </div>

      <!-- Primary 2-Column FBA Visual Suite: Longitudinal Phase Chart + 4-Function Donut Matrix -->
      <div class="fba-two-col" style="margin-top:18px">
        <!-- Chart 1: Longitudinal Behavior Reduction & Phase-Change Graph -->
        <div class="fba-panel">
          <div class="flex-between" style="margin-bottom:10px;flex-wrap:wrap;gap:6px">
            <div>
              <h4 style="margin:0;font-size:1rem;color:var(--slate-900)">Longitudinal Behavior Frequency & BIP Phase-Change Graph</h4>
              <p style="font-size:0.78rem;color:var(--slate-500);margin:2px 0 0">Daily episode count comparing Baseline vs. Post-BIP / FCT Intervention phase.</p>
            </div>
            <span class="badge tan">${rm.pctChange <= 0 ? `↓ ${Math.abs(rm.pctChange)}% Post-BIP Reduction` : 'Phase Tracking'}</span>
          </div>
          ${fbaTrendChart(abcSummary.dailySeries, rm)}
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:10px;padding-top:8px;border-top:1px dashed var(--slate-200);font-family:var(--font-mono);font-size:0.72rem;color:var(--slate-600)">
            <span><b style="color:var(--escape)">● Baseline:</b> ${rm.baselineRate}/day</span>
            <span><b style="color:#C8923A">┆ Phase Change:</b> FCT & Visual Countdown</span>
            <span><b style="color:var(--ok)">● Intervention:</b> ${rm.currentRate}/day</span>
          </div>
        </div>

        <!-- Chart 2: 4-Function Relative Weighting Donut + Clickable Function Cards -->
        <div class="fba-panel">
          <div class="flex-between" style="margin-bottom:10px;flex-wrap:wrap;gap:6px">
            <div>
              <h4 style="margin:0;font-size:1rem;color:var(--slate-900)">4-Function Contingency Weighting (FBA)</h4>
              <p style="font-size:0.78rem;color:var(--slate-500);margin:2px 0 0">Relative distribution across the 4 BACB functions. Click any function to filter logs.</p>
            </div>
            <span class="badge p">Dominant: ${esc(domFn.name)} (${domFn.pct}%)</span>
          </div>
          <div class="fba-donut-layout">
            ${fbaFunctionDonut(abcSummary.functions, totalAbc)}
            <div class="fba-fn-list">
              ${fnMeta.map((f) => {
                const cnt = (abcSummary.functions && abcSummary.functions[f.key]) || 0;
                const pct = totalAbc ? Math.round((cnt / totalAbc) * 100) : 0;
                const isSelected = fbaFilterFunction === f.key;
                return `
                  <div class="fba-fn-row ${isSelected ? 'selected' : ''}" style="border-left:4px solid ${f.color};background:${isSelected ? f.bg : '#FFFDF9'}" onclick="act.setFbaFunction('${f.key}')">
                    <div class="flex-between" style="gap:8px">
                      <div>
                        <span style="font-family:var(--font-serif);font-weight:600;font-size:0.88rem;color:var(--slate-900)">${f.label}</span>
                        <div style="font-size:0.71rem;color:var(--slate-500)">${f.desc}</div>
                      </div>
                      <div style="text-align:right;white-space:nowrap;font-family:var(--font-mono)">
                        <span style="font-weight:700;font-size:0.9rem;color:${f.color}">${pct}%</span>
                        <span style="font-size:0.72rem;color:var(--slate-500);margin-left:3px">(${cnt})</span>
                      </div>
                    </div>
                    <div class="fba-bar-track" style="margin-top:5px">
                      <div class="fba-bar-fill" style="width:${pct}%;background:${f.color}"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary 2-Column FBA Suite: Antecedent Conditional Probability & Consequence Effectiveness -->
      <div class="fba-two-col" style="margin-top:16px">
        <!-- Chart 3A: Antecedent Trigger Conditional Probability -->
        <div class="fba-panel">
          <div class="flex-between" style="margin-bottom:10px">
            <div>
              <h4 style="margin:0;font-size:0.98rem;color:var(--slate-900)">Antecedent Conditional Probability Matrix</h4>
              <p style="font-size:0.78rem;color:var(--slate-500);margin:2px 0 0">Environmental triggers ranked by conditional probability of evoking maladaptive behavior.</p>
            </div>
            <span class="badge esc">Trigger Ranking</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${antMatrix.slice(0, 5).map((item) => `
              <div class="fba-prob-row">
                <div class="flex-between" style="gap:8px;font-size:0.82rem">
                  <span style="font-weight:700;color:var(--slate-800)">${esc(item.antecedent)}</span>
                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                    <span class="badge ${item.primaryFunction.toLowerCase().slice(0, 3)}" style="font-size:0.68rem">${esc(item.primaryFunction)}</span>
                    <b style="font-family:var(--font-mono);color:var(--slate-900)">${item.pct}% (${item.count}x)</b>
                  </div>
                </div>
                <div class="fba-bar-track" style="margin-top:5px;height:7px">
                  <div class="fba-bar-fill" style="width:${Math.max(6, item.pct)}%;background:linear-gradient(90deg,#B6362C,#C8923A)"></div>
                </div>
                <div style="font-size:0.72rem;color:var(--slate-500);margin-top:3px">
                  Primary Topography: <b>${esc(item.primaryBehavior)}</b>
                </div>
              </div>
            `).join('') || '<div style="color:var(--slate-400);font-size:0.84rem">No antecedent data logged yet.</div>'}
          </div>
        </div>

        <!-- Chart 3B: Consequence & FCT Replacement Effectiveness -->
        <div class="fba-panel">
          <div class="flex-between" style="margin-bottom:10px">
            <div>
              <h4 style="margin:0;font-size:0.98rem;color:var(--slate-900)">Consequence & FCT Intervention Effectiveness</h4>
              <p style="font-size:0.78rem;color:var(--slate-500);margin:2px 0 0">Staff consequence delivery frequency and post-prompt de-escalation / FCT fidelity.</p>
            </div>
            <span class="badge tan">BIP Fidelity</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${conMatrix.slice(0, 5).map((item) => `
              <div class="fba-prob-row">
                <div class="flex-between" style="gap:8px;font-size:0.82rem">
                  <span style="font-weight:700;color:var(--slate-800)">${esc(item.consequence)}</span>
                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                    <span class="badge tan" style="font-size:0.68rem">${item.deescalationRate}% De-escalated</span>
                    <b style="font-family:var(--font-mono);color:var(--slate-900)">${item.count}x (${item.pct}%)</b>
                  </div>
                </div>
                <div class="fba-bar-track" style="margin-top:5px;height:7px">
                  <div class="fba-bar-fill" style="width:${Math.max(6, item.pct)}%;background:linear-gradient(90deg,#173F33,#1E6B4E)"></div>
                </div>
                <div style="font-size:0.72rem;color:var(--slate-500);margin-top:3px">
                  Targets Function: <b>${esc(item.primaryFunction)}</b>
                </div>
              </div>
            `).join('') || '<div style="color:var(--slate-400);font-size:0.84rem">No consequence data logged yet.</div>'}
          </div>
        </div>
      </div>

      <!-- Chart 4: Temporal Scatterplot & Hourly Bar-Heatmap (CentralReach Improvement) -->
      <div style="margin-top:16px;background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--radius-lg);padding:16px">
        <div class="flex-between" style="flex-wrap:wrap;gap:8px">
          <div>
            <h4 style="margin:0;font-size:1rem;color:var(--slate-900)">Temporal Behavior Scatterplot & Hourly Setting Event Bar-Heatmap</h4>
            <p style="font-size:0.8rem;color:var(--slate-500);margin:2px 0 0">Distribution of incidents across clinic operational hours (8:00 AM – 5:00 PM). Click any hour slot to filter logs.</p>
          </div>
          <span class="badge p">FBA Scatterplot Analysis</span>
        </div>

        ${abcSummary.scatterplot && abcSummary.scatterplot.peakWindow ? `
          <div class="stalled-banner" style="margin-top:12px;background:var(--bad-light);border-color:var(--bad-border);color:#7D1F18">
            <b>Peak Behavioral Disruption Window:</b> <b>${esc(abcSummary.scatterplot.peakWindow.label)}</b> (${abcSummary.scatterplot.peakWindow.count} incident${abcSummary.scatterplot.peakWindow.count === 1 ? '' : 's'}). Primary Trigger: <b>${esc(abcSummary.scatterplot.peakWindow.primaryAntecedent)}</b>. Recommend antecedent visual schedules & high-density reinforcement 5 minutes prior to this transition window.
          </div>
        ` : ''}

        <div class="heatmap-track" style="margin-top:14px">
          ${(abcSummary.scatterplot ? abcSummary.scatterplot.hourly : []).map((h) => {
            const count = h.count;
            const bgClass = count >= 4 ? 'heat-4' : count >= 2 ? 'heat-2' : count === 1 ? 'heat-1' : 'heat-0';
            const topHourAnt = Object.entries(h.antecedents).sort((a, b) => b[1] - a[1])[0];
            const barHeightPct = Math.round((count / maxHourlyCount) * 100);
            const isHourSelected = fbaFilterHour === h.hour;
            return `
              <div class="heat-slot ${bgClass} ${isHourSelected ? 'selected-hour' : ''}" style="cursor:pointer" onclick="act.setFbaHour(${h.hour})" title="${h.label}: ${count} incident(s)${topHourAnt ? ` (Primary: ${topHourAnt[0]})` : ''} — Click to filter">
                <div class="heat-bar-well">
                  <div class="heat-bar-col" style="height:${count ? Math.max(14, barHeightPct) : 4}%"></div>
                </div>
                <div class="heat-label">${h.label.replace(':00 ', ' ')}</div>
                <div class="heat-count">${count}</div>
                <div class="heat-sub">${count === 1 ? 'event' : 'events'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="flex-between" style="margin-top:24px;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <h4 style="margin:0">
          ABC Incident History (${filteredAbc.length}${hasActiveFilter ? ` of ${abcLogs.length}` : ''} total events)
        </h4>
        ${hasActiveFilter ? `
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${fbaFilterBehavior !== 'ALL' ? `<span class="badge esc">Behavior: ${esc(fbaFilterBehavior)}</span>` : ''}
            ${fbaFilterFunction !== 'ALL' ? `<span class="badge p">Function: ${esc(fbaFilterFunction)}</span>` : ''}
            ${fbaFilterHour !== null ? `<span class="badge tan">Hour: ${fbaFilterHour > 12 ? fbaFilterHour - 12 : fbaFilterHour}:00 ${fbaFilterHour >= 12 ? 'PM' : 'AM'}</span>` : ''}
            <button class="sec" style="padding:3px 8px;font-size:0.74rem" onclick="act.resetFbaFilters()">Show All (${abcLogs.length})</button>
          </div>
        ` : ''}
      </div>
      ${filteredAbc.length ? `
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
            ${filteredAbc.map((a) => `
              <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;font-size:0.85rem">${fmtT(a.ts)}</span></td>
                <td><b style="color:var(--bad)">${esc(a.behavior)}</b></td>
                <td>${esc(a.antecedent)}</td>
                <td>${esc(a.consequence)}</td>
                <td><span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0, 3) : 'esc'}">${esc(a.perceived_function || 'Escape')}</span></td>
                <td style="font-size:0.85rem;color:var(--slate-600)">${esc(a.notes || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:var(--slate-400);text-align:center;padding:20px">No ABC incidents match the current filter.</p>'}
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
                  ${x.session ? (x.session.end ? 'Open Note' : 'Resume Session ⚡') : 'Start Session'}
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
  const {
    session: s, client, goals, allGoals = goals, plans, stories,
    abcLogs = [], behaviorPrograms = [], behaviorEvents = [], behaviorSummary: rawBehaviorSummary = {}, taskAnalyses = []
  } = v;
  behaviorPrograms.forEach((bp) => { bpNameMap[bp.id] = bp.name; });
  const behaviorSummary = mergeAndSummarizeBehaviorEvents(behaviorEvents, client.id, s.id, (rawBehaviorSummary && rawBehaviorSummary.sessionMinutes) || 60);
  const masteredGoals = (allGoals || []).filter((g) => g.status !== 'active');
  const ended = !!s.end;
  const startMs = new Date(s.start).getTime();
  clearInterval(timer);
  clearInterval(behTimerInterval);
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
      // Update any running behavior duration/latency timers
      Object.entries(behTimers).forEach(([bpId, tInfo]) => {
        const bEl = document.getElementById(`beh_timer_${bpId}`);
        if (bEl && tInfo && tInfo.startMs) {
          const sec = Math.max(1, Math.round((Date.now() - tInfo.startMs) / 1000));
          bEl.textContent = `⏹ Stop ${tInfo.mode === 'latency' ? 'Latency' : 'Duration'} (${sec}s)`;
        }
      });
    }, 1000);
  }

  // Build personalized + illustrated reward choices for Kid Mode
  const rawReinf = (client.reinforcers || '').split(',').map((x) => x.trim()).filter(Boolean);
  const iconForReward = (r) => {
    const low = r.toLowerCase();
    if (low.includes('lego') || low.includes('block')) return '🧱';
    if (low.includes('sticker') || low.includes('draw') || low.includes('art')) return '🎨';
    if (low.includes('tablet') || low.includes('ipad') || low.includes('game')) return '🎮';
    if (low.includes('train') || low.includes('car')) return '🚂';
    if (low.includes('bubble')) return '🫧';
    if (low.includes('swing') || low.includes('jump') || low.includes('trampoline')) return '🛝';
    if (low.includes('music') || low.includes('song')) return '🎵';
    return '🎁';
  };
  const defaultRewards = [
    { label: 'LEGO Build Time', icon: '🧱' },
    { label: 'iPad / Tablet Game', icon: '🎮' },
    { label: 'Giant Bubbles', icon: '🫧' },
    { label: 'Sensory Swing', icon: '🛝' },
    { label: 'Sticker Book', icon: '🎨' },
    { label: 'Wooden Train Set', icon: '🚂' }
  ];
  const rewardOptions = [];
  rawReinf.forEach((r) => {
    const label = r.charAt(0).toUpperCase() + r.slice(1);
    rewardOptions.push({ label, icon: iconForReward(r) });
  });
  defaultRewards.forEach((d) => {
    if (rewardOptions.length < 6 && !rewardOptions.some((x) => x.label.toLowerCase().includes(d.label.split(' ')[0].toLowerCase()))) {
      rewardOptions.push(d);
    }
  });
  const activeRewardObj = rewardOptions.find((r) => r.label === kidRewardChoice) || rewardOptions[0] || { label: 'Special Reward', icon: '🎁' };
  const theme = KID_THEMES[kidTheme] || KID_THEMES.space;
  const progressPct = Math.min(100, Math.round((tokenCount / targetTokens) * 100));
  const activeFirstGoal = goals.find((g) => g.id === +kidFirstGoalId) || goals[0] || { id: 0, title: 'Tabletop Skill Trials' };

  const sum = (g) => {
    if (!g.summary || (!g.summary.total && !g.summary.rawTotal)) return '<div style="color:var(--slate-400);font-size:0.85rem;margin-top:8px">No trials recorded yet this session. Tap a prompt button above to log a trial, or click the goal title to review historical data.</div>';
    const indepND = g.summary.indepNumDenom || `${g.summary.counts.I || 0}/${g.summary.total}`;
    const promptND = g.summary.promptedNumDenom || `${g.summary.promptedCount || 0}/${g.summary.total}`;
    return `
    <div style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:0.85rem;margin-bottom:4px">
        <span>Session Independent Mastery: <b style="color:var(--ok)">${g.summary.pct.I}% (${indepND})</b> · Prompted: <b>${g.summary.promptedPct ?? 0}% (${promptND})</b></span>
        <span><b>${g.summary.total}</b> Scored Opportunities${g.summary.naCount ? ` <span class="badge">(${g.summary.naCount} N/A excluded from denom)</span>` : ''}</span>
      </div>
      <div class="bar">
        <div style="width:${g.summary.pct.I}%"></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:0.76rem;color:var(--slate-600);margin-top:6px">
        ${Object.keys(LV).map(k => {
          const cnt = g.summary.counts[k] || 0;
          if (!cnt && ['Vi', 'PP', 'INC', 'NA'].includes(k)) return '';
          const nd = k === 'NA' ? `${cnt} excl` : `${cnt}/${g.summary.total}`;
          return `<span class="badge ${k === 'I' ? 'tan' : 'p'}">${LV[k].code} (${LV[k].label}): <b>${nd}</b> (${g.summary.pct[k] || 0}%)</span>`;
        }).join('')}
      </div>
    </div>`;
  };

  return `
  <div class="page-header">
    <div>
      <h1>Active Session Cockpit</h1>
      <p class="page-sub">Client: <b>${esc(client.name)}</b> · 1-Tap Trial Recording, 9-Method Behavior Tracker & Interactive Kid Mode</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="ok" onclick="act.openCreateGoalModal(${client.id})">+ Create New Goal</button>
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
            <button class="btn" style="background:var(--accent);border-color:#7C3016;box-shadow:0 2px 0 #7C3016;padding:12px 22px;font-size:1rem" onclick="act.toggleKidMode()">★ ${showKidMode ? 'Hide Kid Mode' : 'Open Interactive Kid Mode'}</button>
          </div>
        `}
    </div>
  </div>

  <!-- Interactive Kid Mode & Graphic Reinforcement Playground -->
  ${showKidMode ? `
    <div class="kid-playground">
      <!-- Top Control & Theme Bar -->
      <div class="kid-top-controls">
        <div class="kid-theme-pills">
          ${Object.values(KID_THEMES).map((th) => `
            <button class="kid-theme-btn ${kidTheme === th.id ? 'active' : ''}" onclick="act.setKidTheme('${th.id}')">
              ${th.name}
            </button>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="kid-schedule-pills" title="Schedule of Reinforcement (Fixed Ratio)">
            ${[3, 5, 10].map((num) => `
              <button class="kid-sched-btn ${targetTokens === num ? 'active' : ''}" onclick="act.setTargetTokens(${num})">FR-${num} (${num} ${theme.tokenEarned})</button>
            `).join('')}
          </div>
          <button class="sec" style="font-size:0.78rem;padding:6px 10px;border-radius:999px" onclick="act.toggleKidAutoToken()">
            ${kidAutoToken ? '⚡ Auto-Token on Trial: ON' : '⚪ Auto-Token: OFF'}
          </button>
          <button class="sec" style="font-size:0.78rem;padding:6px 10px;border-radius:999px" onclick="act.toggleKidSound()">
            ${kidSound ? '🔊 Sound & Voice: ON' : '🔇 Muted'}
          </button>
          <button class="sec" style="font-size:0.78rem;padding:6px 10px;border-radius:999px" onclick="act.resetTokens()">🔄 Reset</button>
        </div>
      </div>

      <!-- Graphic Adventure Banner & Animated Hero Journey Track -->
      <div class="kid-adventure-stage" style="background:${theme.bannerBg}">
        <svg class="kid-stage-svg" viewBox="0 0 800 140" preserveAspectRatio="none">
          <circle cx="90" cy="30" r="3" fill="rgba(255,255,255,0.6)"/>
          <circle cx="220" cy="45" r="2" fill="rgba(255,255,255,0.4)"/>
          <circle cx="380" cy="25" r="3.5" fill="rgba(255,255,255,0.7)"/>
          <circle cx="540" cy="50" r="2.5" fill="rgba(255,255,255,0.5)"/>
          <circle cx="690" cy="30" r="3" fill="rgba(255,255,255,0.6)"/>
          <path d="M0 120 Q 200 85 400 115 T 800 105 L 800 140 L 0 140 Z" fill="rgba(255,255,255,0.08)"/>
        </svg>

        <div class="kid-stage-header">
          <div>
            <div class="kid-stage-kicker">✨ ${esc(client.name)}'s Reinforcement Adventure</div>
            <h2 class="kid-stage-title">${theme.hero} ${esc(theme.title)}</h2>
            <p class="kid-stage-sub">${esc(theme.subtitle)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="kid-praise-btn" onclick="act.triggerPraiseBurst('${esc(client.name)}')">🙌 Super Praise Burst!</button>
            ${tokenCount < targetTokens ? `<button class="kid-bonus-btn" onclick="act.awardBonusToken('${esc(client.name)}', '${esc(activeRewardObj.label)}')">+1 Bonus ${theme.tokenEarned}</button>` : ''}
          </div>
        </div>

        ${kidPraiseMsg ? `
          <div class="kid-praise-pop">
            <span>${esc(kidPraiseMsg)}</span>
            <button style="background:transparent;border:none;color:#fff;font-size:0.85rem;padding:2px 8px;box-shadow:none" onclick="kidPraiseMsg='';render()">✕</button>
          </div>
        ` : ''}

        <!-- Animated Character Journey Track -->
        <div class="kid-journey-track">
          <div class="kid-journey-fill" style="width:${progressPct}%"></div>
          <div class="kid-journey-hero" style="left:calc(${Math.min(92, Math.max(4, progressPct))}% - 26px)" title="${progressPct}% to Reward!">
            <span>${theme.hero}</span>
          </div>
          <div class="kid-journey-dest ${tokenCount >= targetTokens ? 'reached' : ''}" title="Destination: ${esc(activeRewardObj.label)}">
            <span>${theme.dest}</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.9);margin-top:6px">
          <span>Start Mission (${tokenCount} / ${targetTokens} collected)</span>
          <span>Goal: ${activeRewardObj.icon} ${esc(activeRewardObj.label)} (${progressPct}%)</span>
        </div>
      </div>

      <!-- Collectible 3D Token Medallions -->
      <div class="token-track">
        ${Array.from({ length: targetTokens }).map((_, idx) => {
          const isEarned = idx < tokenCount;
          return `
            <div class="token-slot ${isEarned ? 'earned' : ''}" onclick="act.toggleToken(${idx}, '${esc(client.name)}', '${esc(activeRewardObj.label)}')">
              <div class="token-slot-num">#${idx + 1}</div>
              <div class="token-slot-ic">${isEarned ? theme.tokenEarned : theme.tokenEmpty}</div>
              <div class="token-slot-lbl">${isEarned ? 'EARNED!' : 'Tap Me'}</div>
            </div>
          `;
        }).join('')}
      </div>

      ${tokenCount >= targetTokens ? `
        <div class="kid-victory-banner">
          <div class="kid-confetti-row">🎉 🌟 🎈 🏆 ${theme.hero} ${activeRewardObj.icon} 🏆 🎈 🌟 🎉</div>
          <h3 style="margin:6px 0 4px;font-size:1.45rem;color:#ffffff">HOORAY, ${esc(client.name.toUpperCase())}! ALL ${targetTokens} TOKENS EARNED!</h3>
          <p style="margin:0 0 14px;font-size:1.02rem;color:#fef08a;font-weight:700">
            It's time for your reward: ${activeRewardObj.icon} ${esc(activeRewardObj.label)}!
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
            <button class="kid-praise-btn" onclick="speakKidPraise('Amazing job ${esc(client.name)}! You earned all ${targetTokens} tokens! Time for ${esc(activeRewardObj.label)}!')">🔊 Read Celebration Aloud</button>
            <button class="ok" style="background:#ffffff;color:#15803d;font-weight:800;padding:10px 20px;border-radius:999px" onclick="act.resetTokens()">🎁 Claim Reward & Start Next Round</button>
          </div>
        </div>
      ` : `
        <div style="text-align:center;font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:14px">
          Tap any token above (or log a trial below with Auto-Token ON) — <b>${targetTokens - tokenCount} more</b> to unlock <b>${activeRewardObj.icon} ${esc(activeRewardObj.label)}</b>!
        </div>
      `}

      <!-- Interactive Visual Reinforcer Choice Board -->
      <div class="kid-choice-section">
        <div class="flex-between" style="margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div style="font-weight:800;font-size:0.86rem;color:var(--primary);text-transform:uppercase;letter-spacing:0.04em;font-family:var(--font-mono)">
            Visual Choice Board — Tap to Choose What ${esc(client.name)} Is Working For:
          </div>
          <span class="badge p">Selected: ${activeRewardObj.icon} ${esc(activeRewardObj.label)}</span>
        </div>
        <div class="kid-choice-grid">
          ${rewardOptions.map((r) => {
            const isSel = r.label === activeRewardObj.label;
            return `
              <div class="kid-choice-card ${isSel ? 'selected' : ''}" onclick="act.selectKidReward('${esc(r.label)}')">
                <div class="kid-choice-ic">${r.icon}</div>
                <div class="kid-choice-lbl">${esc(r.label)}</div>
                ${isSel ? `<div class="kid-choice-check">✓ Working For</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Interactive Digital First / Then Visual Schedule -->
      <div class="first-then-grid">
        <div class="first-box ${kidFirstDone ? 'done' : ''}">
          <div class="flex-between" style="margin-bottom:8px">
            <div class="ft-label" style="color:#1d4ed8;margin:0">01 · FIRST (My Learning Task)</div>
            <button class="${kidFirstDone ? 'ok' : 'sec'}" style="font-size:0.78rem;padding:4px 10px;border-radius:999px" onclick="act.toggleKidFirstDone('${esc(client.name)}')">
              ${kidFirstDone ? '✓ Task Completed!' : '○ Mark Task Done'}
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:8px 0">
            <div style="font-size:2.4rem">${kidFirstDone ? '✅' : '📚'}</div>
            <div style="text-align:left">
              <div style="font-weight:800;font-size:1.05rem;color:#1e3a8a">${esc(activeFirstGoal.title)}</div>
              <div style="font-size:0.78rem;color:#3b82f6">Earn ${targetTokens} ${theme.tokenEarned} tokens doing this activity</div>
            </div>
          </div>
          ${goals.length > 1 ? `
            <select style="margin-top:6px;padding:6px 10px;font-size:0.82rem;border-radius:8px;background:#fff" onchange="act.setKidFirstGoal(this.value)">
              ${goals.map((g) => `<option value="${g.id}" ${g.id === activeFirstGoal.id ? 'selected' : ''}>Switch Task: ${esc(g.title)}</option>`).join('')}
            </select>
          ` : ''}
        </div>
        <div class="then-box ${tokenCount >= targetTokens || kidFirstDone ? 'unlocked' : ''}">
          <div class="flex-between" style="margin-bottom:8px">
            <div class="ft-label" style="color:#15803d;margin:0">02 · THEN (My Earned Reward!)</div>
            <span class="tag ${tokenCount >= targetTokens || kidFirstDone ? 'approved' : 'draft'}">
              ${tokenCount >= targetTokens || kidFirstDone ? 'UNLOCKED!' : `${targetTokens - tokenCount} more ${theme.tokenEarned}`}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:14px;justify-content:center;margin:10px 0">
            <div style="font-size:2.8rem;filter:drop-shadow(0 4px 8px rgba(22,163,74,0.25))">${activeRewardObj.icon}</div>
            <div style="text-align:left">
              <div style="font-weight:800;font-size:1.15rem;color:#14532d">${esc(activeRewardObj.label)}</div>
              <div style="font-size:0.8rem;color:#16a34a;font-weight:600">Tap any card in the Choice Board above to change reward</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ` : ''}

  <!-- Quick De-escalation Protocol Drawer -->
  ${plans.length ? `
    <details class="drawer">
      <summary>Emergency Behavior Intervention Plan Quick-Reference (${esc(plans[0].behavior)})</summary>
      <div style="margin-top:10px;font-size:0.92rem;line-height:1.5">
        <div style="background:var(--ok-light);padding:8px 12px;border-radius:6px;margin-bottom:8px">
          <b style="color:#065f46">Replacement Behavior:</b> ${esc(plans[0].data.replacement)}
        </div>
        <p style="margin:4px 0"><b>Staff Response Protocol:</b> ${esc(plans[0].data.staff.join(' · '))}</p>
        <p style="margin:4px 0;color:var(--slate-600)"><b>Antecedent Prevention:</b> ${esc(plans[0].data.prevention.join(' · '))}</p>
      </div>
    </details>
  ` : ''}

  <!-- Live Behavior Reduction Data Collection Bar (9 Measurement Methods · Build Spec §2) -->
  <div class="card" style="border-left:4px solid var(--bad)">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h4 style="margin:0;font-size:1.02rem;color:var(--slate-900)">Live Behavior Reduction Data Collection (9 Measurement Methods)</h4>
          <span class="badge p">Frequency · Rate · Duration · Latency · IRT · Partial/Whole Interval · MTS · ABC</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:0.76rem;color:var(--slate-600);margin-top:4px;display:flex;gap:12px;flex-wrap:wrap">
          <span>Session Frequency: <b>${behaviorSummary.frequencyCount || 0}</b></span>
          <span>Rate: <b>${behaviorSummary.ratePerHour || 0}/hr (${behaviorSummary.ratePerMinute || 0}/min)</b></span>
          <span>Duration: <b>${behaviorSummary.totalDurationSec || 0}s total (Avg ${behaviorSummary.avgDurationSec || 0}s)</b></span>
          <span>Avg Latency: <b>${behaviorSummary.avgLatencySec || 0}s</b></span>
          <span>Avg IRT: <b>${behaviorSummary.avgIrtSec || 0}s</b></span>
          <span>Intervals: <b>${behaviorSummary.intervalPct ?? 0}% (${esc(behaviorSummary.intervalNumDenom || '0/0')})</b></span>
        </div>
      </div>
      ${!ended ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="sec" style="font-size:0.78rem;padding:6px 10px" onclick="act.undoBehaviorEvent(${s.id})">↩ Undo Behavior Entry</button>
          <button class="sec" style="font-size:0.78rem;padding:6px 10px" onclick="act.openBehaviorEventModal(${client.id}, ${s.id})">+ Custom Duration / Latency / Interval</button>
          <button class="ok" style="font-size:0.78rem;padding:6px 10px" onclick="act.openAbcModal(${client.id}, ${s.id})">+ Log ABC Episode</button>
        </div>
      ` : ''}
    </div>

    ${!ended && behaviorPrograms.length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:10px;margin-top:12px">
        ${behaviorPrograms.map((bp) => {
          const bpStats = (behaviorSummary.byBehavior && (behaviorSummary.byBehavior[`id_${bp.id}`] || behaviorSummary.byBehavior[bp.name])) || { frequency: 0, ratePerHour: 0, avgDurationSec: 0, intervalPct: null, intervalNumDenom: '0/0' };
          const runningTimer = behTimers[bp.id];
          return `
            <div style="background:var(--slate-50);border:1.5px solid var(--slate-200);border-radius:10px;padding:10px 12px">
              <div class="flex-between" style="gap:6px;margin-bottom:4px">
                <b style="font-size:0.9rem;color:var(--slate-900)" title="${esc(bp.operational_definition)}">${esc(bp.name)}</b>
                <span class="badge p" style="font-size:0.68rem">${esc(bp.measurement_type)}</span>
              </div>
              <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--slate-600);margin-bottom:8px">
                Count: <b style="color:${bpStats.frequency > 0 ? 'var(--bad)' : 'var(--slate-900)'};font-size:0.84rem">${bpStats.frequency}</b> (${bpStats.ratePerHour}/hr) · Avg Dur: <b>${bpStats.avgDurationSec}s</b>${bpStats.intervalPct !== null ? ` · Int: <b>${bpStats.intervalPct}% (${bpStats.intervalNumDenom})</b>` : ''}
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="bad" style="padding:6px 12px;font-size:0.78rem;flex:1" onclick="act.quickTallyBehavior(${client.id}, ${s.id}, ${bp.id})">
                  +1 Tally ${bpStats.frequency > 0 ? `(${bpStats.frequency})` : ''}
                </button>
                <button id="beh_timer_${bp.id}" class="${runningTimer ? 'ok' : 'sec'}" style="padding:6px 10px;font-size:0.76rem"
                  onclick="act.toggleBehaviorTimer(${client.id}, ${s.id}, ${bp.id}, 'duration')">
                  ${runningTimer ? '⏹ Stop Duration' : '⏱ Start Duration'}
                </button>
                <button class="sec" style="padding:6px 9px;font-size:0.74rem" title="Record Partial/Whole Interval Occurrence (+)"
                  onclick="act.quickIntervalBehavior(${client.id}, ${s.id}, ${bp.id}, 1)">
                  Int +
                </button>
                <button class="sec" style="padding:6px 9px;font-size:0.74rem" title="Record Interval Non-Occurrence (-)"
                  onclick="act.quickIntervalBehavior(${client.id}, ${s.id}, ${bp.id}, 0)">
                  Int −
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  </div>

  <!-- In-Session ABC Incidents -->
  ${abcLogs.length ? `
    <div class="card" style="background:#fffbeb;border:1px solid #fde68a">
      <h4 style="margin:0 0 8px;color:#92400e">In-Session ABC Maladaptive Incidents (${abcLogs.length})</h4>
      ${abcLogs.map(a => `
        <div style="font-size:0.85rem;margin-bottom:4px;color:#78350f">
          <b>${esc(a.behavior)}</b> (<span class="badge ${a.perceived_function ? a.perceived_function.toLowerCase().slice(0,3) : 'esc'}">${esc(a.perceived_function)}</span>): Antecedent: ${esc(a.antecedent)} · Response: ${esc(a.consequence)}
        </div>
      `).join('')}
    </div>
  ` : ''}

  <!-- Teaching Mode Switcher (CentralReach Enhancement: DTT vs NET + Trial Type Selector) -->
  <div class="mode-switcher-bar">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="vital-emblem" style="width:42px;height:42px;font-size:0.78rem">
        ${sessionMode === 'net' ? 'NET' : 'DTT'}
      </div>
      <div>
        <div style="font-weight:700;font-size:0.98rem;color:var(--slate-900);font-family:var(--font-serif)">
          ${sessionMode === 'net' ? 'Natural Environment Teaching (NET Multi-Target Grid)' : 'Discrete Trial Training (DTT Single-Focus View)'}
        </div>
        <div style="font-size:0.78rem;color:var(--slate-500)">
          10 Prompt Categories · N/A Excluded from Denominator · Independent vs Prompted Separated
        </div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div class="mode-toggle-group" title="Select Trial Condition (Acquisition, Probe, Maintenance, Generalization)">
        ${[['acquisition', 'Acquisition'], ['probe', 'Cold Probe'], ['maintenance', 'Maintenance'], ['generalization', 'Generalization']].map(([tKey, tLbl]) => `
          <button class="${activeTrialType === tKey ? 'ok' : 'sec'}" style="font-size:0.76rem;padding:7px 11px" onclick="act.setTrialType('${tKey}')">${tLbl}</button>
        `).join('')}
      </div>
      <button class="ok" style="font-size:0.84rem;padding:9px 14px" onclick="act.openCreateGoalModal(${client.id})">+ Add / Create Goal</button>
      ${!ended ? `<button class="sec" style="font-size:0.84rem;padding:9px 14px" onclick="act.undo(${s.id})">↩ Undo Last Trial</button>` : ''}
      <div class="mode-toggle-group">
        <button class="${sessionMode === 'dtt' ? 'ok' : 'sec'}" style="font-size:0.84rem;padding:9px 16px" onclick="act.setSessionMode('dtt')">DTT View</button>
        <button class="${sessionMode === 'net' ? 'ok' : 'sec'}" style="font-size:0.84rem;padding:9px 16px" onclick="act.setSessionMode('net')">NET Grid</button>
      </div>
    </div>
  </div>

  ${sessionMode === 'net' ? `
    <div class="net-grid">
      ${goals.map((g) => {
        const total = g.summary ? g.summary.total : 0;
        const indepPct = g.summary ? g.summary.pct.I : 0;
        const indepND = g.summary ? (g.summary.indepNumDenom || `${g.summary.counts?.I || 0}/${total}`) : '0/0';
        return `
        <div class="net-card">
          <div>
            <div class="net-card-head" style="cursor:pointer" onclick="act.openGoalModal(${g.id})" title="Click to review data, edit, or master this goal">
              <h4 style="margin:0;font-size:1.02rem;font-weight:700;color:var(--primary);line-height:1.35;text-decoration:underline;text-underline-offset:3px">${esc(g.title)}</h4>
              <span class="badge p" style="font-size:0.72rem;flex-shrink:0">Review #${g.id}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:4px">
              <div class="net-stats-row">
                <span>Session: <b>${indepPct}% (${indepND})</b> Indep</span>
                <span style="color:var(--slate-300)">•</span>
                <span>Target: <b>${g.target || 80}%</b></span>
              </div>
              ${g.mastery_met ? `<span class="tag approved" style="font-size:0.68rem">Mastery Met</span>` : g.stalled ? `<span class="tag draft" style="font-size:0.68rem">Stalled</span>` : ''}
            </div>
          </div>
          <div>
            ${ended ? '' : `
              <div class="net-actions">
                <button class="net-btn btn-i" title="Independent (I)" onclick="act.trial(${s.id}, ${g.id}, 'I')">
                  <span class="net-btn-ic">I</span><span>Indep</span>
                </button>
                <button class="net-btn btn-v" title="Verbal Prompt (V)" onclick="act.trial(${s.id}, ${g.id}, 'V')">
                  <span class="net-btn-ic">V</span><span>Verbal</span>
                </button>
                <button class="net-btn btn-g" title="Gestural Prompt (G)" onclick="act.trial(${s.id}, ${g.id}, 'G')">
                  <span class="net-btn-ic">G</span><span>Gestural</span>
                </button>
                <button class="net-btn btn-m" title="Model Prompt (M)" onclick="act.trial(${s.id}, ${g.id}, 'M')">
                  <span class="net-btn-ic">M</span><span>Model</span>
                </button>
                <button class="net-btn btn-p" title="Full Physical Prompt (P)" onclick="act.trial(${s.id}, ${g.id}, 'P')">
                  <span class="net-btn-ic">P</span><span>Physical</span>
                </button>
                <button class="net-btn btn-n" title="No Response / Refusal (N)" onclick="act.trial(${s.id}, ${g.id}, 'N')">
                  <span class="net-btn-ic">N</span><span>Refusal</span>
                </button>
              </div>
            `}
            <div class="bar" style="height:8px;margin:14px 0 0">
              <div style="width:${indepPct}%"></div>
            </div>
          </div>
        </div>
      `;
      }).join('')}
    </div>
  ` : `
    ${goals.map((g) => `
      <div class="card" style="border-left:4px solid ${g.mastery_met ? 'var(--ok)' : g.stalled ? 'var(--warn)' : 'var(--primary)'}">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px">
          <div style="cursor:pointer" onclick="act.openGoalModal(${g.id})" title="Click to review longitudinal data & edit goal">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <h3 style="margin:0;color:var(--slate-900);text-decoration:underline;text-decoration-color:var(--primary-border);text-underline-offset:4px">${esc(g.title)}</h3>
              <span class="badge p">Goal #${g.id}</span>
              <span class="badge">${esc(g.domain || 'Skill Acquisition')}</span>
              <span class="badge">${esc(g.prompt_strategy || 'Least-to-Most (LTM)')}</span>
              <span class="tag ${g.mastery_met ? 'approved' : g.stalled ? 'draft' : 'approved'}">
                ${g.mastery_met ? 'Mastery Criteria Met' : g.stalled ? 'Plateau / Stalled' : esc(g.trend || 'Active')}
              </span>
            </div>
            <div style="font-size:0.84rem;color:var(--slate-500);margin-top:4px;font-family:var(--font-mono)">
              Baseline: <b>${g.baseline ?? 20}%</b> · ${g.mastery_sessions || 3}-Session Avg: <b>${g.current ?? '—'}${g.current !== null && g.current !== undefined ? '%' : ''}</b> · Mastery Target: <b>${g.target ?? 80}%</b> · Scoring: <b>${g.scoring_rule === 'include_prompted' ? 'Include Prompted' : 'Independent Only'}</b>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="sec" style="font-size:0.82rem;padding:7px 13px" onclick="act.openGoalModal(${g.id})">Review Data & Edit Goal</button>
            <button class="ok" style="font-size:0.82rem;padding:7px 13px" onclick="act.quickMasterGoal(${g.id})">✓ Master Goal</button>
          </div>
        </div>

        ${g.mastery_met ? `
          <div class="mastery-banner" style="margin-top:10px">
            <span><b>Ready for Mastery:</b> ${esc(g.recommendation)}</span>
            <button class="ok" style="font-size:0.78rem;padding:4px 10px" onclick="act.quickMasterGoal(${g.id})">✓ Advance to Mastered</button>
          </div>
        ` : g.stalled || g.regression ? `
          <div class="stalled-banner" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <span><b>Clinical Alert:</b> ${esc(g.recommendation)}</span>
            <button class="sec" style="font-size:0.78rem;padding:4px 10px;background:#fff" onclick="act.openGoalModal(${g.id})">Modify Target / Criteria</button>
          </div>
        ` : ''}

        ${ended ? '' : `
          <div class="levels">
            ${Object.entries(LV).map(([k, cfg]) => `
              <button class="${cfg.cls}" onclick="act.trial(${s.id}, ${g.id}, '${k}')">
                <span>${cfg.icon} ${cfg.label}</span>
                <span style="font-family:var(--font-mono);font-size:0.82rem;opacity:0.85">[${k}]</span>
              </button>
            `).join('')}
          </div>
        `}
        ${sum(g)}
      </div>
    `).join('') || `
      <div class="card" style="text-align:center;padding:28px">
        <h3 style="margin:0 0 6px">All Active Goals Mastered or None Defined</h3>
        <p style="color:var(--slate-500);margin:0 0 14px">Add a new skill acquisition target below to continue collecting DTT trials.</p>
        <button class="ok" onclick="act.openCreateGoalModal(${client.id})">+ Create New Skill Target</button>
      </div>
    `}

    <!-- Quick Add Goal Card inside DTT View -->
    <div class="card" style="background:var(--slate-100);border:1.5px dashed var(--slate-300);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h4 style="margin:0;color:var(--slate-900)">Need to Introduce a New Skill Acquisition Goal?</h4>
        <p style="margin:2px 0 0;font-size:0.84rem;color:var(--slate-600)">Create a custom DTT/NET target or pick from clinical ABA templates without leaving the session.</p>
      </div>
      <button class="ok" onclick="act.openCreateGoalModal(${client.id})">+ Create / Set New Goal</button>
    </div>

    ${masteredGoals.length ? `
      <details class="drawer" style="background:#f0fdf4;border-color:#86efac">
        <summary style="color:#065f46">🏆 Mastered, On-Hold & Discontinued Targets (${masteredGoals.length}) — Click to Review Data or Reactivate</summary>
        <div style="margin-top:12px;display:grid;gap:10px">
          ${masteredGoals.map((mg) => {
            const stMeta = GOAL_STATUS_META[mg.status] || GOAL_STATUS_META.mastered;
            return `
            <div style="background:#ffffff;padding:12px 16px;border-radius:12px;border:1px solid #bbf7d0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;cursor:pointer" onclick="act.openGoalModal(${mg.id})">
              <div>
                <b style="color:#065f46">${esc(mg.title)}</b>
                <span class="tag ${stMeta.cls}" style="margin-left:8px">${esc(stMeta.label)}</span>
                <div style="font-size:0.8rem;color:var(--slate-500);margin-top:2px">Baseline: ${mg.baseline}% · Avg: ${mg.current ?? '—'}% · Target: ${mg.target}% · Indep: ${mg.indep_pct ?? 0}% (${esc(mg.indep_num_denom || '0/0')})</div>
              </div>
              <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
                <button class="sec" style="font-size:0.78rem;padding:5px 10px" onclick="act.openGoalModal(${mg.id})">📊 Review Data</button>
                <button class="sec" style="font-size:0.78rem;padding:5px 10px" onclick="act.quickReactivateGoal(${mg.id})">🔄 Move to Active</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </details>
    ` : ''}
  `}

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
        <p style="font-size:0.85rem;color:var(--slate-500);margin:2px 0 0">Attendance, Barriers, SOAP Narrative & Multi-Disciplinary Dual-Signature</p>
      </div>
      ${ended && s.note_status !== 'signed' ? `
        <button class="sec" onclick="act.genNote(${s.id})">🤖 Auto-Draft Note from Trials, Behavior & ABC</button>
      ` : ''}
    </div>

    <div class="row" style="margin-top:12px">
      <div>
        <label>Attendance Status</label>
        <select id="sess_attendance" onchange="act.saveSessionMeta(${s.id})" ${s.note_status === 'signed' ? 'disabled' : ''}>
          ${['Present - Full Session', 'Late Arrival', 'Early Departure', 'Cancelled - Client Sick', 'No Show'].map((opt) => `
            <option value="${opt}" ${(s.attendance_status || 'Present - Full Session') === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>
      <div>
        <label>Environmental / Setting Event Barriers (Sleep, Illness, Meds, Schedule Change)</label>
        <input id="sess_barriers" value="${esc(s.barriers || 'None reported')}" onchange="act.saveSessionMeta(${s.id})" ${s.note_status === 'signed' ? 'disabled' : ''}>
      </div>
    </div>

    ${ended ? `
      <div style="margin-top:8px">
        <label>Session Narrative (Trials + Continuous/Interval Behavior + ABC Incidents + Interventions)</label>
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
    ` : '<p style="color:var(--slate-500);margin-top:12px">End the session when complete to synthesize trial percentages, behavior rates, and ABC incidents into the clinical documentation.</p>'}
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
  let fidelityForm = '';
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

    const fidSteps = [
      'Antecedent environment & visual schedule prepared prior to SD',
      'Discriminative stimulus (SD) delivered clearly and concisely',
      'Prescribed prompt hierarchy (LTM / MTL / Time Delay) followed accurately',
      'Immediate differential reinforcement delivered per FR/VR token schedule',
      'BIP replacement communication (FCT) prompted prior to escalation',
      'Trial-by-trial and continuous/interval behavior data recorded immediately'
    ];
    fidelityForm = `
    <div class="card" style="border-left:4px solid var(--primary)">
      <div class="flex-between" style="flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <h3 style="margin:0">Treatment Integrity (Fidelity %) & Interobserver Agreement (IOA %) Calculator</h3>
          <p style="font-size:0.84rem;color:var(--slate-500);margin:2px 0 0">Clinical Quality Assurance: Calculate RBT procedural fidelity and Observer 1 vs Observer 2 IOA (Target ≥80%).</p>
        </div>
        <span class="badge p">BACB Quality & IOA Standard</span>
      </div>
      <div class="row">
        <div><label>Client</label><select id="fid_c">${cs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>RBT Observed</label><select id="fid_r">${rbts.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>
        <div>
          <label>IOA Calculation Method</label>
          <select id="fid_method">
            <option value="trial_by_trial">Trial-by-Trial IOA (Agreements / Total Trials)</option>
            <option value="total_count">Total Count IOA (Smaller / Larger Count)</option>
            <option value="interval_by_interval">Interval-by-Interval IOA</option>
            <option value="exact_count_interval">Exact Count-Per-Interval IOA</option>
            <option value="duration">Total Duration IOA</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div><label>Observer 1 (RBT Count or Agreed Trials)</label><input id="fid_o1" type="number" value="11"></div>
        <div><label>Observer 2 (BCBA Count or Total Trials)</label><input id="fid_o2" type="number" value="12"></div>
        <div><label>Clinical Feedback & Action Plan</label><input id="fid_notes" placeholder="e.g. 92% Trial-by-Trial IOA; 100% BIP fidelity"></div>
      </div>
      <label>Treatment Integrity Checklist (Check all steps implemented correctly by RBT):</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;margin:8px 0 14px">
        ${fidSteps.map((st, idx) => `
          <label style="display:flex;align-items:center;gap:8px;background:var(--slate-50);padding:8px 12px;border-radius:6px;border:1px solid var(--slate-200);cursor:pointer;font-weight:500;text-transform:none">
            <input type="checkbox" class="fid-step-cb" data-step="${esc(st)}" checked style="width:auto;margin:0">
            <span style="font-size:0.82rem">${esc(st)}</span>
          </label>
        `).join('')}
      </div>
      <button class="ok" onclick="act.submitFidelityIoa()">✓ Calculate & Log Fidelity % + IOA %</button>
    </div>`;
  }

  const fidLogs = sup.fidelityIoaLogs || [];

  return `
  <div class="page-header">
    <div>
      <h1>BACB Monthly Supervision, Fidelity & IOA Tracking</h1>
      <p class="page-sub">Mandatory 5% Minimum RBT Supervision, Procedural Treatment Integrity & Interobserver Agreement (IOA)</p>
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
  ${fidelityForm}
  <div class="card">
    <h3>Treatment Integrity (Fidelity %) & Interobserver Agreement (IOA %) Log</h3>
    ${fidLogs.length ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>RBT Observed</th>
            <th>BCBA Evaluator</th>
            <th>Fidelity %</th>
            <th>IOA % & Method</th>
            <th>Feedback Notes</th>
          </tr>
        </thead>
        <tbody>
          ${fidLogs.map(fl => `
            <tr>
              <td><span style="font-family:'JetBrains Mono',monospace">${fmtT(fl.ts)}</span></td>
              <td><b>${esc(fl.client)}</b></td>
              <td>${esc(fl.rbt)}</td>
              <td>${esc(fl.bcba)}</td>
              <td><span class="tag ${(fl.fidelity_pct ?? 100) >= 80 ? 'approved' : 'draft'}">${fl.fidelity_pct ?? '—'}%</span></td>
              <td>
                <span class="tag ${(fl.ioa_pct ?? 100) >= 80 ? 'approved' : 'draft'}">${fl.ioa_pct ?? '—'}%</span>
                <span style="font-size:0.76rem;color:var(--slate-500);margin-left:4px">(${esc((fl.ioa_method || 'trial_by_trial').replace(/_/g, ' '))})</span>
              </td>
              <td style="font-size:0.85rem">${esc(fl.notes || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:var(--slate-400)">No treatment integrity or IOA logs recorded yet.</p>'}
  </div>
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
      <div class="modal-card" style="max-width:640px;width:95%">
        <div class="flex-between">
          <h3 style="margin:0">⚡ Log ABC Incident</h3>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <p style="font-size:0.85rem;color:var(--slate-500);margin:6px 0 14px">Structured Antecedent–Behavior–Consequence field entry with setting, activity, and intensity rating.</p>
        
        <div class="row">
          <div>
            <label>Target Maladaptive Behavior</label>
            <select id="m_behavior">${BEHAVIORS.map(b => `<option>${b}</option>`).join('')}</select>
          </div>
          <div>
            <label>Perceived Behavioral Function</label>
            <select id="m_function">
              <option value="Escape">Escape / Avoidance</option>
              <option value="Attention">Attention Seeking</option>
              <option value="Tangible">Access to Preferred Tangible / Item</option>
              <option value="Sensory">Automatic / Sensory Reinforcement</option>
            </select>
          </div>
        </div>

        <label>Antecedent (What immediately preceded the behavior?)</label>
        <select id="m_antecedent">${ANTS.map(a => `<option>${a}</option>`).join('')}</select>
        
        <label>Consequence / Staff Response</label>
        <input id="m_consequence" value="Prompted replacement communication, provided calm break space">
        
        <div class="row">
          <div>
            <label>Setting</label>
            <select id="m_setting">
              <option>Clinic</option>
              <option>School</option>
              <option>Home</option>
              <option>Community</option>
            </select>
          </div>
          <div>
            <label>Ongoing Activity</label>
            <input id="m_activity" value="Tabletop DTT / Transition">
          </div>
          <div>
            <label>Intensity Rating</label>
            <select id="m_intensity">
              <option>Mild</option>
              <option selected>Moderate</option>
              <option>Severe</option>
            </select>
          </div>
          <div>
            <label>Duration (seconds)</label>
            <input id="m_duration_sec" type="number" min="0" value="45">
          </div>
        </div>
        
        <label>Clinical Notes & People Present</label>
        <textarea id="m_notes" rows="2" placeholder="e.g. RBT + peer present; client accepted visual timer after FCT prompt."></textarea>
        
        <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitAbcModal(${cid}, ${sid || 'null'})">Save ABC Incident</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'behavior_program') {
    const cid = activeModal.clientId;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:640px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge p">Behavior Reduction Operational Definition</span>
            <h3 style="margin:4px 0 0">Define Client Target Behavior</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <div class="row" style="margin-top:12px">
          <div>
            <label>Target Behavior Name</label>
            <input id="bp_name" placeholder="e.g. Vocal Protest / Screaming" value="Vocal Protest / Screaming">
          </div>
          <div>
            <label>Primary Measurement Method</label>
            <select id="bp_method">
              <option value="frequency">Frequency / Event Recording</option>
              <option value="rate">Rate per Unit of Time</option>
              <option value="duration">Duration Recording</option>
              <option value="latency">Latency Recording</option>
              <option value="irt">Inter-Response Time (IRT)</option>
              <option value="partial_interval">Partial-Interval Recording</option>
              <option value="whole_interval">Whole-Interval Recording</option>
              <option value="mts">Momentary Time Sampling (MTS)</option>
              <option value="abc">ABC Narrative Recording</option>
            </select>
          </div>
        </div>
        <label>Objective Operational Definition (Observable & Measurable)</label>
        <textarea id="bp_def" rows="2" placeholder="Any vocalization above conversational volume lasting 3+ seconds..."></textarea>
        <label>Non-Examples (What is excluded from counting?)</label>
        <input id="bp_non" placeholder="e.g. Laughing or cheering during gross-motor play">
        <div class="row">
          <div>
            <label>Hypothesized Function</label>
            <select id="bp_fn">
              <option value="Escape">Escape / Avoidance</option>
              <option value="Attention">Attention Seeking</option>
              <option value="Tangible">Access to Tangible</option>
              <option value="Sensory">Automatic / Sensory</option>
            </select>
          </div>
          <div>
            <label>Baseline Rate (per day/hr)</label>
            <input id="bp_base" type="number" step="0.1" value="3.0">
          </div>
          <div>
            <label>Target Criterion Rate</label>
            <input id="bp_target" type="number" step="0.1" value="0.5">
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitBehaviorProgramModal(${cid})">✓ Save Target Behavior Definition</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'behavior_event') {
    const cid = activeModal.clientId;
    const sid = activeModal.sessionId;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:640px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge p">Continuous & Discontinuous Interval Recording</span>
            <h3 style="margin:4px 0 0">Log Behavior Measurement Data</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <div class="row" style="margin-top:12px">
          <div>
            <label>Behavior Topography</label>
            <select id="be_behavior">${BEHAVIORS.map(b => `<option>${b}</option>`).join('')}</select>
          </div>
          <div>
            <label>Measurement Method</label>
            <select id="be_type">
              <option value="frequency">Frequency / Event Count</option>
              <option value="duration">Duration (Seconds)</option>
              <option value="latency">Latency from SD (Seconds)</option>
              <option value="irt">Inter-Response Time / IRT (Seconds)</option>
              <option value="partial_interval">Partial-Interval Recording</option>
              <option value="whole_interval">Whole-Interval Recording</option>
              <option value="mts">Momentary Time Sampling (MTS)</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div>
            <label>Frequency Count</label>
            <input id="be_val" type="number" min="1" value="1">
          </div>
          <div>
            <label>Duration (Seconds)</label>
            <input id="be_dur" type="number" min="0" value="45">
          </div>
          <div>
            <label>Latency (Seconds)</label>
            <input id="be_lat" type="number" min="0" value="10">
          </div>
          <div>
            <label>IRT (Seconds)</label>
            <input id="be_irt" type="number" min="0" value="180">
          </div>
        </div>
        <div class="row">
          <div>
            <label>Interval Outcome (For Partial / Whole / MTS)</label>
            <select id="be_int_occ">
              <option value="1">1 — Behavior Occurred in Interval (+)</option>
              <option value="0">0 — Behavior Did Not Occur (−)</option>
            </select>
          </div>
          <div>
            <label>Total Intervals Observed in Block</label>
            <input id="be_int_tot" type="number" min="1" value="1">
          </div>
          <div>
            <label>Setting</label>
            <select id="be_setting">
              <option>Clinic</option>
              <option>School</option>
              <option>Home</option>
            </select>
          </div>
        </div>
        <label>Observation Notes</label>
        <input id="be_notes" placeholder="e.g. Timed with digital stopwatch during transition.">
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitBehaviorEventModal(${cid}, ${sid || 'null'})">✓ Save Measurement Entry</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'create_ta') {
    const cid = activeModal.clientId;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:600px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge p">Task Analysis & Chaining (Build Spec §6)</span>
            <h3 style="margin:4px 0 0">Create Multi-Step Task Analysis</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <div class="row" style="margin-top:12px">
          <div>
            <label>Routine / Skill Title</label>
            <input id="ta_title" value=" Independent Backpack Unpacking Routine (5-Step)">
          </div>
          <div>
            <label>Chaining Method</label>
            <select id="ta_chain">
              <option value="Forward Chaining">Forward Chaining</option>
              <option value="Backward Chaining">Backward Chaining</option>
              <option value="Total-Task Presentation" selected>Total-Task Presentation</option>
            </select>
          </div>
        </div>
        <label>Task Analysis Steps (One step per line, in sequential order)</label>
        <textarea id="ta_steps" rows="5">1. Walk to cubby hook
2. Unzip main backpack compartment
3. Place lunchbox on counter
4. Place communication folder in bin
5. Hang backpack on hook</textarea>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitCreateTaModal(${cid})">✓ Create Task Analysis</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'audit_logs') {
    const logs = activeModal.logs || [];
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:780px;width:95%;max-height:88vh;overflow-y:auto">
        <div class="flex-between">
          <div>
            <span class="badge p">21 CFR Part 11 / BACB Data Integrity Audit Trail</span>
            <h3 style="margin:4px 0 0">Immutable Clinical Data & Undo Audit Log</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <p style="font-size:0.84rem;color:var(--slate-500);margin:6px 0 12px">All trial entries, undo corrections, goal status changes, and behavior logs are timestamped with staff attribution.</p>
        ${logs.length ? `
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff Member</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td><span style="font-family:var(--font-mono);font-size:0.78rem">${fmtT(l.ts)}</span></td>
                  <td><b>${esc(l.user_name)}</b> <span class="badge">${esc(l.user_role)}</span></td>
                  <td><span class="badge ${l.action.includes('UNDO') ? 'esc' : 'tan'}">${esc(l.action)}</span></td>
                  <td>${esc(l.entity_type)} #${l.entity_id || '—'}</td>
                  <td style="font-size:0.82rem">${esc(l.details)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color:var(--slate-400)">No audit events recorded yet.</p>'}
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
  if (activeModal.type === 'goal_review') {
    const g = activeModal.goal;
    const totalTrials = g.total_trials || 0;
    const pt = g.prompt_totals || { I: 0, V: 0, G: 0, Vi: 0, M: 0, PP: 0, P: 0, INC: 0, N: 0, NA: 0 };
    const stMeta = GOAL_STATUS_META[g.status] || GOAL_STATUS_META.active;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:820px;width:95%;max-height:92vh;overflow-y:auto">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--slate-200)">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge p">Goal #${g.id} · ${esc(g.client_name || 'Client')}</span>
              <span class="tag ${stMeta.cls}">${esc(stMeta.label)}</span>
              <span class="badge">${esc(g.domain || 'Communication / Manding')}</span>
              <span class="badge">${esc(g.prompt_strategy || 'Least-to-Most (LTM)')}</span>
            </div>
            <h3 style="margin:6px 0 0;font-size:1.3rem;color:var(--slate-900)">${esc(g.title)}</h3>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${g.status !== 'mastered'
              ? `<button class="ok" style="font-size:0.82rem;padding:7px 14px" onclick="act.quickMasterGoal(${g.id})">🏆 Mark Goal Mastered</button>`
              : `<button class="sec" style="font-size:0.82rem;padding:7px 14px" onclick="act.quickReactivateGoal(${g.id})">🔄 Move Back to Active</button>`}
            <button class="sec" style="font-size:0.82rem;padding:7px 12px" onclick="act.openCreateGoalModal(${g.client_id}, 'Next Step: ' + ${JSON.stringify(g.title).replace(/"/g, '&quot;')})">+ Add New Goal</button>
            <button class="sec" style="padding:5px 10px" onclick="act.closeModal()">✕</button>
          </div>
        </div>

        <!-- Clinical Intelligence Recommendation -->
        ${g.recommendation ? `
          <div class="${g.status === 'mastered' || g.mastery_met ? 'mastery-banner' : 'stalled-banner'}" style="margin:14px 0">
            <span><b>🧠 Clinical Data Analysis:</b> ${esc(g.recommendation)}</span>
          </div>
        ` : ''}

        <!-- 4 KPI Summary Metrics Based on Collected Data (Explicit Numerator/Denominator) -->
        <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0">
          <div style="background:var(--slate-50);padding:12px;border-radius:12px;border:1px solid var(--slate-200);text-align:center">
            <div style="font-size:0.72rem;font-weight:800;color:var(--slate-500);text-transform:uppercase">Baseline</div>
            <div style="font-size:1.4rem;font-weight:800;color:var(--slate-800)">${g.baseline}%</div>
          </div>
          <div style="background:var(--slate-50);padding:12px;border-radius:12px;border:1px solid var(--slate-200);text-align:center">
            <div style="font-size:0.72rem;font-weight:800;color:var(--slate-500);text-transform:uppercase">${g.mastery_sessions || 3}-Session Avg</div>
            <div style="font-size:1.4rem;font-weight:800;color:${(g.current || 0) >= g.target ? 'var(--ok)' : 'var(--primary)'}">${g.current ?? '—'}${g.current !== null ? '%' : ''}</div>
          </div>
          <div style="background:var(--slate-50);padding:12px;border-radius:12px;border:1px solid var(--slate-200);text-align:center">
            <div style="font-size:0.72rem;font-weight:800;color:var(--slate-500);text-transform:uppercase">Indep Ratio</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--ok)">${g.indep_pct ?? 0}% (${esc(g.indep_num_denom || `${pt.I || 0}/${totalTrials}`)})</div>
          </div>
          <div style="background:var(--slate-50);padding:12px;border-radius:12px;border:1px solid var(--slate-200);text-align:center">
            <div style="font-size:0.72rem;font-weight:800;color:var(--slate-500);text-transform:uppercase">Prompted Ratio</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--slate-900)">${g.prompted_pct ?? 0}% (${esc(g.prompted_num_denom || `0/${totalTrials}`)})</div>
          </div>
        </div>

        <!-- Longitudinal Trendline Chart -->
        <h4 style="margin:14px 0 6px;font-size:0.95rem">📈 Longitudinal Mastery Trajectory (${(g.series || []).length} Sessions · Criterion: ${g.target}% across ${g.mastery_sessions || 3} sessions)</h4>
        ${chart(g.series || [], g.baseline, g.target)}

        <!-- Aggregate Prompt Hierarchy Breakdown -->
        <h4 style="margin:16px 0 8px;font-size:0.95rem">🎯 Aggregate 10-Level Prompt Hierarchy Breakdown (${totalTrials} Scored Opportunities)</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px">
          ${Object.entries(LV).map(([code, cfg]) => {
            const cnt = pt[code] || 0;
            const pct = code === 'NA' ? 0 : (totalTrials ? Math.round((cnt / totalTrials) * 100) : 0);
            return `
              <div style="background:var(--slate-50);padding:8px 10px;border-radius:10px;border:1px solid var(--slate-200);font-size:0.8rem">
                <div style="font-weight:700;color:var(--slate-700)">${cfg.icon} ${code} (${cfg.label.split(' ')[0]})</div>
                <div style="font-size:1rem;font-weight:800;color:var(--slate-900);margin-top:2px">
                  ${code === 'NA' ? `${cnt} excl` : `${cnt}/${totalTrials} <span style="font-size:0.76rem;color:var(--slate-500);font-weight:600">(${pct}%)</span>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Session-by-Session Data Table -->
        ${g.series && g.series.length ? `
          <details class="drawer" style="margin:12px 0">
            <summary>📋 View Session-by-Session Trial Breakdown (${g.series.length} Sessions)</summary>
            <table style="margin-top:10px">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Scored Opps</th>
                  <th>% & Ratio</th>
                  <th>Prompted Ratio</th>
                  <th>Prompt Distribution</th>
                </tr>
              </thead>
              <tbody>
                ${g.series.map((sRow) => `
                  <tr>
                    <td><b>Session #${sRow.session}</b></td>
                    <td>${sRow.n} opps${sRow.naCount ? ` (+${sRow.naCount} N/A)` : ''}</td>
                    <td><b style="color:${sRow.pct >= g.target ? 'var(--ok)' : 'var(--slate-800)'}">${sRow.pct}% (${esc(sRow.numDenom || `${sRow.prompts?.I || 0}/${sRow.n}`)})</b></td>
                    <td>${sRow.promptedPct ?? 0}% (${esc(sRow.promptedNumDenom || `0/${sRow.n}`)})</td>
                    <td style="font-size:0.8rem">
                      ${Object.entries(sRow.prompts || {}).filter(([, c]) => c > 0).map(([k, c]) => `<span class="badge ${k === 'I' ? 'tan' : 'p'}">${k}: ${c}</span>`).join(' ')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </details>
        ` : ''}

        <!-- Modify / Edit Goal Parameters Form -->
        <div style="background:var(--slate-100);border:1.5px solid var(--slate-300);border-radius:10px;padding:18px;margin-top:16px">
          <h4 style="margin:0 0 10px;color:var(--slate-900)">Modify Goal Parameters, Prompt Strategy, Scoring Rule & Clinical Status</h4>
          <div class="row">
            <div style="grid-column:span 2">
              <label>Operational Goal Title / Target Behavior</label>
              <input id="edit_g_title" value="${esc(g.title)}">
            </div>
          </div>
          <div class="row">
            <div>
              <label>Clinical Domain</label>
              <select id="edit_g_domain">
                ${GOAL_DOMAINS.map((d) => `<option value="${esc(d)}" ${g.domain === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Prompt Fading Strategy</label>
              <select id="edit_g_strategy">
                ${PROMPT_STRATEGIES.map((ps) => `<option value="${esc(ps)}" ${g.prompt_strategy === ps ? 'selected' : ''}>${esc(ps)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Mastery Scoring Rule</label>
              <select id="edit_g_scoring">
                <option value="independent_only" ${g.scoring_rule !== 'include_prompted' ? 'selected' : ''}>Independent Responses Only (Default)</option>
                <option value="include_prompted" ${g.scoring_rule === 'include_prompted' ? 'selected' : ''}>Include Prompted Responses (BCBA Override)</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div>
              <label>Baseline %</label>
              <input id="edit_g_base" type="number" min="0" max="100" value="${g.baseline}">
            </div>
            <div>
              <label>Mastery Criterion %</label>
              <input id="edit_g_target" type="number" min="1" max="100" value="${g.target}">
            </div>
            <div>
              <label>Consecutive Sessions</label>
              <input id="edit_g_sess" type="number" min="1" max="10" value="${g.mastery_sessions || 3}">
            </div>
            <div>
              <label>Clinical Status (5 States)</label>
              <select id="edit_g_status">
                <option value="active" ${g.status === 'active' ? 'selected' : ''}>Active (Acquisition)</option>
                <option value="on_hold" ${g.status === 'on_hold' ? 'selected' : ''}>On Hold</option>
                <option value="mastered" ${g.status === 'mastered' ? 'selected' : ''}>Mastered (Maintenance)</option>
                <option value="revised" ${g.status === 'revised' ? 'selected' : ''}>Revised (Phase Change)</option>
                <option value="discontinued" ${g.status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
              </select>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:8px">
            <button class="ok" onclick="act.masterAndAddNext(${g.id}, ${g.client_id}, ${JSON.stringify(g.title).replace(/"/g, '&quot;')})">
              ✓ Master This Goal & Create Next Progression Target →
            </button>
            <div style="display:flex;gap:8px">
              <button class="sec" onclick="act.closeModal()">Cancel</button>
              <button class="ok" onclick="act.saveGoalModal(${g.id})">Save Goal Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'create_goal') {
    const cid = activeModal.clientId;
    const prefill = activeModal.prefillTitle || '';
    const templates = [
      { title: '2-Step Motor Imitation ("Do this")', base: 20, target: 80 },
      { title: 'Functional Manding for Break ("Break please")', base: 15, target: 80 },
      { title: 'Peer Turn-Taking During Tabletop Play (3 exchanges)', base: 25, target: 80 },
      { title: 'Following 2-Step Classroom Teacher Directions', base: 30, target: 85 },
      { title: 'Tacting 10 Emotion Picture Cards ("Happy, Frustrated, Calm")', base: 20, target: 80 },
      { title: 'Independent Transition Using First/Then Visual Schedule', base: 20, target: 80 }
    ];
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:680px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge p">Skill Acquisition & DTT / NET Program</span>
            <h3 style="margin:4px 0 0">Create & Set New Skill Acquisition Goal</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>
        <p style="font-size:0.85rem;color:var(--slate-500);margin:6px 0 14px">
          Define a custom operational target below, or tap a clinical ABA template to auto-fill:
        </p>

        <div style="margin-bottom:14px">
          <div style="font-size:0.75rem;font-weight:800;color:var(--slate-500);text-transform:uppercase;margin-bottom:6px;font-family:var(--font-mono)">1-Tap Clinical ABA Goal Templates:</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${templates.map((t) => `
              <button class="sec" style="font-size:0.76rem;padding:5px 10px;border-radius:6px" onclick="act.fillGoalTemplate(${JSON.stringify(t.title).replace(/"/g, '&quot;')}, ${t.base}, ${t.target})">
                + ${esc(t.title)}
              </button>
            `).join('')}
          </div>
        </div>

        <label>Target Operational Title</label>
        <input id="new_g_title" placeholder="e.g. Following 2-step classroom directions" value="${esc(prefill)}">

        <div class="row">
          <div>
            <label>Clinical Domain</label>
            <select id="new_g_domain">
              ${GOAL_DOMAINS.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Prompt Fading Strategy</label>
            <select id="new_g_strategy">
              ${PROMPT_STRATEGIES.map((ps) => `<option value="${esc(ps)}">${esc(ps)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Scoring Rule</label>
            <select id="new_g_scoring">
              <option value="independent_only">Independent Only (Standard)</option>
              <option value="include_prompted">Include Prompted</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div>
            <label>Baseline % Independent</label>
            <input id="new_g_base" type="number" min="0" max="100" value="20">
          </div>
          <div>
            <label>Mastery Criterion %</label>
            <input id="new_g_target" type="number" min="1" max="100" value="80">
          </div>
          <div>
            <label>Consecutive Sessions</label>
            <input id="new_g_sess" type="number" min="1" max="10" value="3">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitCreateGoalModal(${cid})">✓ Create & Activate Goal</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'fba_report') {
    const report = activeModal.report;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:860px;width:95%;max-height:92vh;overflow-y:auto">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--slate-200)">
          <div>
            <span class="badge p">CPT 97151 / 97155 Functional Behavior Assessment (FBA)</span>
            <h3 style="margin:4px 0 0">${esc(report.title)}</h3>
            <div style="font-size:0.85rem;color:var(--slate-500)">Client: <b>${esc(report.client_name)}</b> · Date: ${esc(report.date)} · Total ABC Episodes: <b>${report.totalIncidents}</b></div>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0">
          <div style="background:var(--bad-light);border:1px solid var(--bad-border);padding:10px 12px;border-radius:8px;text-align:center">
            <div style="font-size:0.7rem;font-weight:700;color:var(--bad);text-transform:uppercase;font-family:var(--font-mono)">Primary Function</div>
            <div style="font-size:1.25rem;font-weight:700;color:var(--bad);font-family:var(--font-serif)">${esc(report.primaryFunction)} (${report.primaryFunctionPct}%)</div>
          </div>
          <div style="background:var(--slate-100);border:1px solid var(--slate-200);padding:10px 12px;border-radius:8px;text-align:center">
            <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase;font-family:var(--font-mono)">Baseline → Current</div>
            <div style="font-size:1.25rem;font-weight:700;color:var(--slate-900);font-family:var(--font-serif)">${report.baselineRate}/d → ${report.currentRate}/d</div>
          </div>
          <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:10px 12px;border-radius:8px;text-align:center">
            <div style="font-size:0.7rem;font-weight:700;color:#065f46;text-transform:uppercase;font-family:var(--font-mono)">Net Rate Change</div>
            <div style="font-size:1.25rem;font-weight:700;color:var(--ok);font-family:var(--font-serif)">${report.pctChange <= 0 ? `↓ ${Math.abs(report.pctChange)}%` : `↑ ${report.pctChange}%`}</div>
          </div>
          <div style="background:var(--primary-light);border:1px solid var(--primary-border);padding:10px 12px;border-radius:8px;text-align:center">
            <div style="font-size:0.7rem;font-weight:700;color:var(--primary);text-transform:uppercase;font-family:var(--font-mono)">FCT De-escalation</div>
            <div style="font-size:1.25rem;font-weight:700;color:var(--primary);font-family:var(--font-serif)">${report.replacementSuccessRate}%</div>
          </div>
        </div>

        <div class="report-content" id="report_text_body" style="background:#fff;border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:18px;font-size:0.86rem;line-height:1.65;white-space:pre-wrap;font-family:var(--font-mono);color:var(--slate-800)">${esc(report.text)}</div>

        <div style="display:flex;gap:10px;margin-top:16px;justify-content:space-between;align-items:center;flex-wrap:wrap">
          <div style="font-size:0.8rem;color:var(--slate-500)">
            BACB Functional Behavior Assessment & Progress Report Draft · Supervising BCBA Signature Required
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="sec" onclick="act.copyReport()">Copy FBA Report</button>
            <button class="ok" onclick="window.print()">Print / Save as PDF</button>
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
  quickPillar: (cid, targetTab) => {
    tab = targetTab;
    const targetHash = `client/${cid || 1}`;
    if (location.hash === `#${targetHash}` || location.hash === targetHash) {
      render();
    } else {
      location.hash = targetHash;
    }
  },
  toggleCrisis: () => { showCrisis = !showCrisis; render(); },
  openAbcModal: (cid, sid = null) => { activeModal = { type: 'abc', clientId: cid, sessionId: sid }; render(); },
  openBehaviorProgramModal: (cid) => { activeModal = { type: 'behavior_program', clientId: cid }; render(); },
  submitBehaviorProgramModal: safe(async (cid) => {
    await api('POST', `/api/clients/${cid}/behaviors`, {
      name: val('bp_name'),
      measurement_type: val('bp_method'),
      operational_definition: val('bp_def'),
      non_examples: val('bp_non'),
      function_hypothesis: val('bp_fn'),
      baseline_rate: +val('bp_base') || 0,
      target_rate: +val('bp_target') || 0
    });
    activeModal = null;
    render();
  }),
  openBehaviorEventModal: (cid, sid = null) => { activeModal = { type: 'behavior_event', clientId: cid, sessionId: sid }; render(); },
  submitBehaviorEventModal: safe(async (cid, sid) => {
    const ts = new Date(Date.now() + (++tallySeq)).toISOString();
    const bName = val('be_behavior');
    const payload = {
      ts,
      behavior: bName,
      behavior_name: bName,
      measurement_type: val('be_type'),
      count: +val('be_val') || 1,
      value: +val('be_val') || 1,
      duration_sec: +val('be_dur') || 0,
      latency_sec: +val('be_lat') || 0,
      irt_sec: +val('be_irt') || 0,
      interval_occurred: +val('be_int_occ') ? 1 : 0,
      interval_total: +val('be_int_tot') || 1,
      setting: val('be_setting') || 'Clinic',
      notes: val('be_notes')
    };
    localBehEvents.push({ ...payload, client_id: cid, session_id: sid || null, localUid: tallySeq });
    if (sid) {
      await api('POST', `/api/sessions/${sid}/behavior-events`, payload);
    } else {
      await api('POST', `/api/clients/${cid}/behavior-events`, payload);
    }
    activeModal = null;
    render();
  }),
  quickTallyBehavior: safe(async (cid, sid, bpId) => {
    const ts = new Date(Date.now() + (++tallySeq)).toISOString();
    const behName = bpNameMap[bpId] || 'Target Behavior';
    const payload = {
      ts,
      behavior_id: bpId,
      behavior_program_id: bpId,
      behavior: behName,
      behavior_name: behName,
      measurement_type: 'frequency',
      count: 1,
      value: 1,
      setting: 'Clinic',
      notes: '1-Tap Frequency Tally'
    };
    localBehEvents.push({ ...payload, client_id: cid, session_id: sid || null, localUid: tallySeq });
    if (sid) await api('POST', `/api/sessions/${sid}/behavior-events`, payload);
    else await api('POST', `/api/clients/${cid}/behavior-events`, payload);
    render();
  }),
  toggleBehaviorTimer: safe(async (cid, sid, bpId, mode = 'duration') => {
    const behName = bpNameMap[bpId] || 'Target Behavior';
    if (behTimers[bpId]) {
      const elapsedSec = Math.max(1, Math.round((Date.now() - behTimers[bpId].startMs) / 1000));
      delete behTimers[bpId];
      const ts = new Date(Date.now() + (++tallySeq)).toISOString();
      const payload = {
        ts,
        behavior_id: bpId,
        behavior_program_id: bpId,
        behavior: behName,
        behavior_name: behName,
        measurement_type: mode,
        count: 1,
        value: 1,
        duration_sec: mode === 'duration' ? elapsedSec : 0,
        latency_sec: mode === 'latency' ? elapsedSec : 0,
        setting: 'Clinic',
        notes: `Live ${mode} stopwatch (${elapsedSec}s)`
      };
      localBehEvents.push({ ...payload, client_id: cid, session_id: sid || null, localUid: tallySeq });
      if (sid) await api('POST', `/api/sessions/${sid}/behavior-events`, payload);
      else await api('POST', `/api/clients/${cid}/behavior-events`, payload);
    } else {
      behTimers[bpId] = { startMs: Date.now(), mode };
    }
    render();
  }),
  quickIntervalBehavior: safe(async (cid, sid, bpId, occurred) => {
    const ts = new Date(Date.now() + (++tallySeq)).toISOString();
    const behName = bpNameMap[bpId] || 'Target Behavior';
    const payload = {
      ts,
      behavior_id: bpId,
      behavior_program_id: bpId,
      behavior: behName,
      behavior_name: behName,
      measurement_type: 'partial_interval',
      count: occurred ? 1 : 0,
      value: occurred ? 1 : 0,
      interval_occurred: occurred ? 1 : 0,
      interval_total: 1,
      setting: 'Clinic',
      notes: occurred ? 'Interval + (Occurred)' : 'Interval − (Did not occur)'
    };
    localBehEvents.push({ ...payload, client_id: cid, session_id: sid || null, localUid: tallySeq });
    if (sid) await api('POST', `/api/sessions/${sid}/behavior-events`, payload);
    else await api('POST', `/api/clients/${cid}/behavior-events`, payload);
    render();
  }),
  undoBehaviorEvent: safe(async (sid) => {
    for (let i = localBehEvents.length - 1; i >= 0; i--) {
      if (Number(localBehEvents[i].session_id) === Number(sid)) {
        if (localBehEvents[i].ts) localUndoneIds.add(localBehEvents[i].ts);
        localBehEvents.splice(i, 1);
        break;
      }
    }
    const res = await api('DELETE', `/api/sessions/${sid}/behavior-events/last`);
    if (res && res.undone && res.undone.ts) {
      localUndoneIds.add(res.undone.ts);
    }
    render();
  }),
  openCreateTaModal: (cid) => { activeModal = { type: 'create_ta', clientId: cid }; render(); },
  submitCreateTaModal: safe(async (cid) => {
    const steps = val('ta_steps').split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
    await api('POST', `/api/clients/${cid}/task-analysis`, {
      title: val('ta_title'),
      chaining_type: val('ta_chain'),
      steps
    });
    activeModal = null;
    render();
  }),
  setTaDraftStep: (taId, stepIdx, code, totalSteps) => {
    if (!taDraftSteps[taId]) taDraftSteps[taId] = Array.from({ length: totalSteps }, () => 'I');
    taDraftSteps[taId][stepIdx] = code;
    render();
  },
  submitTaRun: safe(async (taId) => {
    const codes = taDraftSteps[taId] || ['I', 'I', 'I', 'I', 'I', 'I'];
    const results = codes.map((c, idx) => ({ step: `Step ${idx + 1}`, status: c }));
    await api('POST', `/api/task-analysis/${taId}/log`, { results });
    render();
  }),
  openAuditModal: safe(async (cid) => {
    const logs = await api('GET', `/api/clients/${cid}/audit-logs`);
    activeModal = { type: 'audit_logs', logs };
    render();
  }),
  submitFidelityIoa: safe(async () => {
    const cbs = [...document.querySelectorAll('.fid-step-cb')];
    const checklist = cbs.map((cb) => ({ step: cb.getAttribute('data-step'), completed: cb.checked }));
    await api('POST', '/api/supervision/fidelity-ioa', {
      client_id: +val('fid_c') || 1,
      rbt_id: +val('fid_r') || 2,
      ioa_method: val('fid_method'),
      observer1_value: +val('fid_o1') || 0,
      observer2_value: +val('fid_o2') || 0,
      checklist,
      notes: val('fid_notes')
    });
    alert('Treatment Integrity (Fidelity %) & IOA % Logged');
    render();
  }),
  setTrialType: (tKey) => { activeTrialType = tKey; render(); },
  saveSessionMeta: safe(async (sid) => {
    await api('PUT', `/api/sessions/${sid}/meta`, {
      attendance_status: val('sess_attendance'),
      barriers: val('sess_barriers')
    });
  }),
  openFbaReportModal: safe(async (cid) => {
    const report = await api('GET', `/api/clients/${cid}/fba-report`);
    activeModal = { type: 'fba_report', report };
    render();
  }),
  setFbaBehavior: (beh) => {
    fbaFilterBehavior = fbaFilterBehavior === beh ? 'ALL' : beh;
    render();
  },
  setFbaFunction: (fn) => {
    fbaFilterFunction = fbaFilterFunction === fn ? 'ALL' : fn;
    render();
  },
  setFbaHour: (hr) => {
    fbaFilterHour = fbaFilterHour === hr ? null : hr;
    render();
  },
  resetFbaFilters: () => {
    fbaFilterBehavior = 'ALL';
    fbaFilterFunction = 'ALL';
    fbaFilterHour = null;
    render();
  },
  closeModal: () => { activeModal = null; render(); },
  submitAbcModal: safe(async (cid, sid) => {
    const payload = {
      behavior: val('m_behavior'),
      antecedent: val('m_antecedent'),
      consequence: val('m_consequence'),
      perceived_function: val('m_function'),
      setting: val('m_setting') || 'Clinic',
      activity: val('m_activity') || 'Structured Therapy',
      intensity: val('m_intensity') || 'Moderate',
      duration_sec: +val('m_duration_sec') || 0,
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
  openGoalModal: safe(async (gid) => {
    const goal = await api('GET', `/api/goals/${gid}`);
    activeModal = { type: 'goal_review', goal };
    render();
  }),
  saveGoalModal: safe(async (gid) => {
    const title = val('edit_g_title');
    const baseline = +val('edit_g_base');
    const target = +val('edit_g_target');
    const status = val('edit_g_status');
    const domain = val('edit_g_domain');
    const prompt_strategy = val('edit_g_strategy');
    const scoring_rule = val('edit_g_scoring');
    const mastery_sessions = +val('edit_g_sess') || 3;
    await api('PUT', `/api/goals/${gid}`, { title, baseline, target, status, domain, prompt_strategy, scoring_rule, mastery_sessions });
    activeModal = null;
    render();
  }),
  quickMasterGoal: safe(async (gid) => {
    await api('PUT', `/api/goals/${gid}`, { status: 'mastered' });
    playKidSound('victory');
    activeModal = null;
    render();
  }),
  quickReactivateGoal: safe(async (gid) => {
    await api('PUT', `/api/goals/${gid}`, { status: 'active' });
    activeModal = null;
    render();
  }),
  masterAndAddNext: safe(async (gid, cid, oldTitle) => {
    await api('PUT', `/api/goals/${gid}`, { status: 'mastered' });
    playKidSound('victory');
    activeModal = { type: 'create_goal', clientId: cid, prefillTitle: `Advanced Step: ${oldTitle}` };
    render();
  }),
  openCreateGoalModal: (cid, prefillTitle = '') => {
    activeModal = { type: 'create_goal', clientId: cid, prefillTitle };
    render();
  },
  fillGoalTemplate: (title, base, target) => {
    const tEl = document.getElementById('new_g_title');
    const bEl = document.getElementById('new_g_base');
    const gEl = document.getElementById('new_g_target');
    if (tEl) tEl.value = title;
    if (bEl) bEl.value = base;
    if (gEl) gEl.value = target;
  },
  submitCreateGoalModal: safe(async (cid) => {
    const title = val('new_g_title').trim();
    if (!title) return alert('Please enter a Target Operational Title');
    const baseline = +val('new_g_base') || 20;
    const target = +val('new_g_target') || 80;
    const domain = val('new_g_domain') || 'Communication / Manding';
    const prompt_strategy = val('new_g_strategy') || 'Least-to-Most (LTM)';
    const scoring_rule = val('new_g_scoring') || 'independent_only';
    const mastery_sessions = +val('new_g_sess') || 3;
    await api('POST', `/api/clients/${cid}/goals`, { title, baseline, target, domain, prompt_strategy, scoring_rule, mastery_sessions });
    activeModal = null;
    render();
  }),
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
  trial: safe(async (sid, gid, level) => {
    await api('POST', `/api/sessions/${sid}/trials`, { goal_id: gid, level, trial_type: activeTrialType });
    if (showKidMode && kidAutoToken && !['N', 'INC', 'NA'].includes(level) && tokenCount < targetTokens) {
      tokenCount++;
      if (tokenCount >= targetTokens) {
        playKidSound('victory');
        kidPraiseMsg = '🎉 ALL TOKENS EARNED! REWARD TIME!';
      } else {
        playKidSound('token');
        kidPraiseMsg = PRAISE_CHEERS[tokenCount % PRAISE_CHEERS.length];
      }
    }
    render();
  }),
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
    await api('PUT', `/api/goals/${gid}`, { status });
    alert(`Goal marked as: ${status}`);
    render();
  }),
  toggleKidMode: () => { showKidMode = !showKidMode; render(); },
  setKidTheme: (th) => { kidTheme = th; playKidSound('token'); render(); },
  setTargetTokens: (num) => { targetTokens = +num || 5; if (tokenCount > targetTokens) tokenCount = targetTokens; render(); },
  toggleKidAutoToken: () => { kidAutoToken = !kidAutoToken; render(); },
  toggleKidSound: () => { kidSound = !kidSound; render(); },
  selectKidReward: (label) => { kidRewardChoice = label; playKidSound('token'); render(); },
  setKidFirstGoal: (gid) => { kidFirstGoalId = +gid; render(); },
  toggleKidFirstDone: (clientName) => {
    kidFirstDone = !kidFirstDone;
    if (kidFirstDone) {
      playKidSound('victory');
      kidPraiseMsg = `🌟 Awesome job finishing your task, ${clientName || 'Superstar'}!`;
    }
    render();
  },
  triggerPraiseBurst: (clientName) => {
    playKidSound('praise');
    const msg = PRAISE_CHEERS[Math.floor(Math.random() * PRAISE_CHEERS.length)];
    kidPraiseMsg = msg;
    speakKidPraise(`Awesome job ${clientName || ''}! ${msg.replace(/[^\w\s!]/g, '')}`);
    render();
  },
  awardBonusToken: (clientName, rewardLabel) => {
    if (tokenCount < targetTokens) {
      tokenCount++;
      if (tokenCount >= targetTokens) {
        playKidSound('victory');
        kidPraiseMsg = `🎉 HOORAY ${clientName || ''}! All ${targetTokens} tokens earned for ${rewardLabel || 'your reward'}!`;
        speakKidPraise(`Hooray ${clientName || ''}! You earned all ${targetTokens} tokens! Time for ${rewardLabel || 'your reward'}!`);
      } else {
        playKidSound('token');
        kidPraiseMsg = PRAISE_CHEERS[tokenCount % PRAISE_CHEERS.length];
      }
      render();
    }
  },
  toggleToken: (idx, clientName, rewardLabel) => {
    if (idx < tokenCount) {
      tokenCount = idx;
    } else {
      tokenCount = idx + 1;
      if (tokenCount >= targetTokens) {
        playKidSound('victory');
        kidPraiseMsg = `🎉 HOORAY ${clientName || ''}! All ${targetTokens} tokens earned for ${rewardLabel || 'your reward'}!`;
        speakKidPraise(`Amazing job ${clientName || ''}! You earned all ${targetTokens} tokens! Time for ${rewardLabel || 'your reward'}!`);
      } else {
        playKidSound('token');
        kidPraiseMsg = PRAISE_CHEERS[tokenCount % PRAISE_CHEERS.length];
      }
    }
    render();
  },
  resetTokens: () => { tokenCount = 0; kidFirstDone = false; kidPraiseMsg = ''; render(); },
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
  setPitchSlide: (idx) => {
    pitchSlide = Math.max(0, Math.min(9, idx));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
  },
  endPitchTour: () => {
    pitchTourActive = false;
    render();
  },
  updateRoi: (bcbaCount, rbtCount) => {
    if (bcbaCount !== null) roiBcba = Math.max(1, +bcbaCount || 1);
    if (rbtCount !== null) roiRbt = Math.max(1, +rbtCount || 1);
    render();
  },
  pitchDemo: safe(async (target, slideIdx) => {
    if (typeof slideIdx === 'number') pitchSlide = slideIdx;
    pitchTourActive = true;
    activeModal = null;

    const ensureRole = async (role, email) => {
      if (!me || me.role !== role) {
        me = await api('POST', '/api/login', { email, password: 'password' });
      }
    };

    if (target === 'client360_crisis') {
      await ensureRole('BCBA', 'bcba@eba.test');
      tab = 'overview';
      showCrisis = true;
      location.hash = 'client/1';
      render();
    } else if (target === 'session_kidmode') {
      await ensureRole('RBT', 'rbt@eba.test');
      const r = await api('POST', '/api/appointments/1/start');
      showKidMode = true;
      tokenCount = 4;
      sessionMode = 'dtt';
      location.hash = 'session/' + r.id;
      render();
    } else if (target === 'session_net') {
      await ensureRole('RBT', 'rbt@eba.test');
      const r = await api('POST', '/api/appointments/1/start');
      showKidMode = false;
      sessionMode = 'net';
      location.hash = 'session/' + r.id;
      render();
    } else if (target === 'fba_scatterplot') {
      await ensureRole('BCBA', 'bcba@eba.test');
      tab = 'behavior_abc';
      showCrisis = false;
      location.hash = 'client/1';
      render();
    } else if (target === 'mastery_intelligence') {
      await ensureRole('BCBA', 'bcba@eba.test');
      tab = 'skills';
      showCrisis = false;
      location.hash = 'client/1';
      render();
    } else if (target === 'reauth_report') {
      await ensureRole('BCBA', 'bcba@eba.test');
      tab = 'overview';
      showCrisis = false;
      location.hash = 'client/1';
      const report = await api('GET', '/api/clients/1/reauth-report');
      activeModal = { type: 'reauth_report', report };
      render();
    } else if (target === 'dual_sign') {
      await ensureRole('BCBA', 'bcba@eba.test');
      location.hash = 'session/4';
      render();
    } else if (target === 'ai_guardrails') {
      await ensureRole('BCBA', 'bcba@eba.test');
      tab = 'stories';
      showCrisis = false;
      location.hash = 'client/1';
      render();
    } else if (target === 'parent_portal') {
      await ensureRole('PARENT', 'parent@eba.test');
      tab = 'stories';
      location.hash = 'clients';
      render();
    } else if (target === 'supervision_radar') {
      await ensureRole('BCBA', 'bcba@eba.test');
      location.hash = 'supervision';
      render();
    }
  }),
};
window.act = act;

function presentationView() {
  const slideTitles = [
    '1. Executive Vision',
    '2. Broken Status Quo',
    '3. Competitive Matrix',
    '4. Unified Client 360',
    '5. Field Cockpit & Kid Mode',
    '6. FBA & Hourly Scatterplot',
    '7. Mastery & Stall AI',
    '8. Zero "Pajama Time"',
    '9. Guardrails & Parent Portal',
    '10. Clinic ROI & Demo Script'
  ];

  // Calculate ROI metrics for Slide 10
  const caseload = roiBcba * 10;
  const reauthHoursSavedYr = Math.round(caseload * 2 * 4.5); // 2 re-auths/yr * 4.5 hrs saved each
  const soapHoursSavedYr = Math.round(roiRbt * 250 * 0.35); // 250 clinic days * 21 mins saved/day
  const totalHoursSaved = reauthHoursSavedYr + soapHoursSavedYr;
  const estFinancialValue = (reauthHoursSavedYr * 95 + soapHoursSavedYr * 35).toLocaleString();

  const slides = [
    // SLIDE 0: Executive Vision
    `
      <div class="pitch-kicker">🌟 Slide 1 of 10 · Executive Vision & Therapist-First Thesis</div>
      <h1 class="pitch-title">Effective Behavioral Approach (EBA): Built for the Therapy Floor, Not Billing Clearinghouses</h1>
      <p class="pitch-lead">
        Most ABA software was designed top-down by insurance billing clearinghouses 15 years ago—forcing clinicians to juggle fragmented binders, clunky spreadsheets, and 12-tab enterprise menus while trying to support a child in crisis. <b>EBA unifies all 8 clinical pillars into a single, field-ready Unified Behavioral Health Record (UBHR).</b>
      </p>

      <div class="pitch-quote">
        "Every minute an RBT spends hunting through nested menus or re-typing trial counts at 8:00 PM is a minute stolen from direct clinical care with the child."
        <div style="font-size:0.8rem;color:#38bdf8;margin-top:6px;font-weight:700">— Core Clinical Design Principle behind EBA</div>
      </div>

      <div class="pitch-grid-3">
        <div class="pitch-box highlight">
          <div class="pitch-emblem">⚡</div>
          <h3 style="margin:0 0 6px;font-size:1.08rem">Zero Context Switching</h3>
          <p style="margin:0;font-size:0.88rem;color:var(--slate-600)">Vitals, Crisis De-escalation, DTT/NET Trials, ABC Logs, Token Boards, SOAP Notes, and BACB Supervision live in one cohesive record.</p>
        </div>
        <div class="pitch-box highlight">
          <div class="pitch-emblem">📱</div>
          <h3 style="margin:0 0 6px;font-size:1.08rem">One-Handed Field Ergonomics</h3>
          <p style="margin:0;font-size:0.88rem;color:var(--slate-600)">60px+ thumb-friendly prompt buttons, instant 1-tap undo, embedded Kid Mode token economy, and zero-lag architecture for school hallways.</p>
        </div>
        <div class="pitch-box highlight">
          <div class="pitch-emblem">🛡️</div>
          <h3 style="margin:0 0 6px;font-size:1.08rem">Clinical Guardrails Built In</h3>
          <p style="margin:0;font-size:0.88rem;color:var(--slate-600)">AI drafts BIPs, Social Stories, and 6-month Re-Auth packets in seconds—but nothing reaches a parent or payer without BCBA co-signature.</p>
        </div>
      </div>

      <div class="card" style="background:var(--slate-100);margin-bottom:0">
        <div class="flex-between" style="flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:14px">
            <div class="pitch-emblem" style="margin:0;background:var(--primary);color:var(--brass-light);border:1px solid var(--brass);font-size:0.85rem">DEMO</div>
            <div>
              <h4 style="margin:0;color:var(--slate-900);font-size:1.05rem">Interactive Presentation Mode: Jump Straight into Live Prototype</h4>
              <p style="margin:4px 0 0;font-size:0.86rem;color:var(--slate-600)">Every slide includes a <b>"Launch Live Demo"</b> button that logs into the right role, opens the exact feature, and gives you a floating <b>"↩ Back to Deck"</b> button.</p>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="ok" onclick="act.pitchDemo('client360_crisis', 0)">Preview Eleanor's Client 360 →</button>
            <button class="sec" onclick="act.setPitchSlide(1)">Explore Competitive Landscape →</button>
          </div>
        </div>
      </div>
    `,

    // SLIDE 1: The Broken Status Quo in Existing Technology
    `
      <div class="pitch-kicker">🔍 Slide 2 of 10 · Market Analysis & Existing Technology Pain Points</div>
      <h1 class="pitch-title">Why Existing ABA Technology Frustrates Clinicians</h1>
      <p class="pitch-lead">
        Today's behavioral therapy practices are forced to choose between bloated enterprise billing portals, disconnected point apps, or manual paper binders. None of them solve the complete clinical loop.
      </p>

      <div class="pitch-grid-2">
        <div class="pitch-box pain">
          <div class="flex-between" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="pitch-emblem" style="margin:0;width:48px;height:48px;font-size:1.5rem;border-color:#fda4af">🏢</div>
              <h3 style="margin:0;color:#9f1239;font-size:1.08rem">1. Legacy Enterprise EHRs</h3>
            </div>
            <span class="badge bad">CentralReach · RethinkBH</span>
          </div>
          <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:var(--slate-700);line-height:1.6">
            <li><b>Built for Billing Clearinghouses, Not RBTs:</b> Requires 10–14 clicks across nested tabs just to check a child's BIP or sensory triggers mid-session.</li>
            <li><b>Desktop Grid UI on Tablets:</b> Tiny hit targets cause accidental mis-taps while an RBT is actively blocking elopement or managing behavior on the floor.</li>
            <li><b>"Pajama Time" Burnout:</b> Session data doesn't automatically synthesize with ABC logs into a clean dual-signed SOAP narrative.</li>
          </ul>
        </div>

        <div class="pitch-box pain">
          <div class="flex-between" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="pitch-emblem" style="margin:0;width:48px;height:48px;font-size:1.5rem;border-color:#fda4af">📲</div>
              <h3 style="margin:0;color:#9f1239;font-size:1.08rem">2. Standalone Data Collection Apps</h3>
            </div>
            <span class="badge bad">Catalyst · Passage · Hi Rasmus</span>
          </div>
          <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:var(--slate-700);line-height:1.6">
            <li><b>Siloed from Practice Ops:</b> Disconnected from CPT authorization burn-down counters, CMS 8-minute unit math, and BACB 5% supervision tracking.</li>
            <li><b>Manual 6-Month Re-Auth Agony:</b> BCBAs still spend 4–6 hours per child screenshotting graphs and pasting into Word templates for insurance re-authorization.</li>
            <li><b>No Embedded Kid Tools:</b> RBTs still carry physical laminated Velcro token boards and paper First/Then cards alongside their iPad.</li>
          </ul>
        </div>

        <div class="pitch-box pain">
          <div class="flex-between" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="pitch-emblem" style="margin:0;width:48px;height:48px;font-size:1.5rem;border-color:#fda4af">🛋️</div>
              <h3 style="margin:0;color:#9f1239;font-size:1.08rem">3. Generic Mental Health EHRs</h3>
            </div>
            <span class="badge bad">SimplePractice · TherapyNotes</span>
          </div>
          <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:var(--slate-700);line-height:1.6">
            <li><b>Built for 50-Min Talk Therapy:</b> Zero support for Discrete Trial Training (DTT), prompt fading hierarchies (I/V/G/M/P/N), or multi-target NET play grids.</li>
            <li><b>Zero Functional Behavior Analysis (FBA):</b> No Antecedent-Behavior-Consequence logging, no 4-function matrices, and no temporal scatterplot heatmaps.</li>
          </ul>
        </div>

        <div class="pitch-box pain">
          <div class="flex-between" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="pitch-emblem" style="margin:0;width:48px;height:48px;font-size:1.5rem;border-color:#fda4af">📋</div>
              <h3 style="margin:0;color:#9f1239;font-size:1.08rem">4. Paper Binders, Clickers & Excel</h3>
            </div>
            <span class="badge bad">The Manual Workaround</span>
          </div>
          <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:var(--slate-700);line-height:1.6">
            <li><b>Delayed Clinical Decisions:</b> Paper tally sheets sit in backpacks until Friday—so children stay on mastered or stalled targets for weeks too long.</li>
            <li><b>Compliance & Audit Risk:</b> Missing RBT/BCBA timestamps, unmonitored 5% BACB supervision ratios, and zero parent transparency.</li>
          </ul>
        </div>
      </div>
    `,

    // SLIDE 2: Head-to-Head Competitive Matrix
    `
      <div class="pitch-kicker">⚔️ Slide 3 of 10 · Head-to-Head Competitive Matrix</div>
      <h1 class="pitch-title">How EBA Compares to Existing ABA Platforms</h1>
      <p class="pitch-lead">
        We took the enterprise power of CentralReach, the field speed of modern mobile apps, and added automated clinical intelligence and child-facing tools that <b>no single platform offers under one roof</b>.
      </p>

      <div style="overflow-x:auto">
        <table class="comp-table">
          <thead>
            <tr>
              <th style="width:22%">Clinical / Operational Capability</th>
              <th style="width:24%">CentralReach / RethinkBH<br><span style="font-weight:400;opacity:0.8">(Legacy Enterprise EHRs)</span></th>
              <th style="width:22%">Catalyst / Point Apps<br><span style="font-weight:400;opacity:0.8">(Standalone Data Apps)</span></th>
              <th class="eba-col" style="width:32%">🚀 Effective Behavioral Approach (EBA)<br><span style="font-weight:400;opacity:0.95">(Our Unified Clinical Cockpit)</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>1. Access to Crisis Plan & BIP Mid-Session</b></td>
              <td>❌ Buried 5–8 clicks deep in separate "Documents" tab</td>
              <td>⚠️ PDF attachment viewer; requires leaving trial screen</td>
              <td class="eba-cell">✅ 1-Tap Pinned Crisis Banner + In-Session Emergency BIP Drawer</td>
            </tr>
            <tr>
              <td><b>2. DTT ↔ NET Teaching Mode Toggle</b></td>
              <td>⚠️ Rigid program sheets; slow switching during natural play</td>
              <td>✅ Good trial buttons, but separate setup for NET vs DTT</td>
              <td class="eba-cell">✅ Instant 1-Tap Toggle between Focused DTT & Multi-Target NET Play Grid</td>
            </tr>
            <tr>
              <td><b>3. Child-Facing Token Board & First/Then</b></td>
              <td>❌ None (RBTs must carry physical laminated Velcro boards)</td>
              <td>❌ None built into the data collection screen</td>
              <td class="eba-cell">✅ Embedded Interactive "⭐ Kid Mode" (5-Star Token Board + First/Then)</td>
            </tr>
            <tr>
              <td><b>4. Temporal FBA Scatterplot Heatmap</b></td>
              <td>⚠️ Requires manual Excel export or complex custom BI report</td>
              <td>⚠️ Basic frequency bar charts; no time-of-day setting event heatmap</td>
              <td class="eba-cell">✅ Live 8 AM–5 PM Hourly Scatterplot Heatmap + Peak Window Detection</td>
            </tr>
            <tr>
              <td><b>5. Mastery & Plateau Detection</b></td>
              <td>⚠️ Manual rule configuration per target; buried alerts</td>
              <td>⚠️ Flags mastery, but weak plateau/prompt-dependency diagnostics</td>
              <td class="eba-cell">✅ Auto Mastery (≥80% × 3) + Stall Alerts + Prompt Hierarchy Breakdown</td>
            </tr>
            <tr>
              <td><b>6. End-of-Session SOAP Note Synthesis</b></td>
              <td>❌ Manual template typing or copy-pasting trial percentages</td>
              <td>⚠️ Exports raw numbers; clinician still writes narrative</td>
              <td class="eba-cell">✅ 1-Click Auto-Compiled SOAP Note (Trials + ABC + CMS 8-Min Units)</td>
            </tr>
            <tr>
              <td><b>7. 6-Month Insurance Re-Auth Packet</b></td>
              <td>❌ 4–6 hours assembling Word docs & pasting chart screenshots</td>
              <td>❌ Requires exporting data to external EHR/Word template</td>
              <td class="eba-cell">✅ 1-Click 5-Section CPT 97151/97155 Medical Necessity Progress Report</td>
            </tr>
            <tr>
              <td><b>8. Caregiver Social Stories & Portal</b></td>
              <td>❌ Separate parent portal; no integrated Social Story builder</td>
              <td>❌ No family-facing story generator or read-aloud tools</td>
              <td class="eba-cell">✅ AI Social Story Builder + Web Speech Read-Aloud + Guarded Parent View</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,

    // SLIDE 3: Uniqueness #1 - Unified Client 360 & Crisis Safety
    `
      <div class="pitch-kicker">🛡️ Slide 4 of 10 · Core Innovation #1: Unified Clinical Record (UBHR)</div>
      <h1 class="pitch-title">The Client 360 Cockpit & 1-Tap Crisis De-Escalation</h1>
      <p class="pitch-lead">
        When an RBT walks into a classroom or home session, they shouldn't have to open four PDFs to remember how a child communicates, what sensory triggers to avoid, or what to do during an escalation.
      </p>

      <div class="pitch-grid-2">
        <div class="pitch-box">
          <div class="pitch-emblem" style="border-color:#fda4af">🗂️</div>
          <div><span class="badge bad" style="margin-bottom:8px">The Old Way (Legacy Systems)</span></div>
          <h3 style="margin:4px 0 8px">Fragmented Across 5 Tabs</h3>
          <p style="font-size:0.88rem;color:var(--slate-600);line-height:1.6">
            Communication modality is in the intake PDF. Reinforcers are on a clipboard. The Crisis Plan is buried in a folder called <code>BIP_Final_v3_Signed.pdf</code>. By the time an RBT opens it on tablet Wi-Fi, the behavior has already escalated.
          </p>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">🚨</div>
          <div><span class="badge p" style="margin-bottom:8px">The EBA Advantage</span></div>
          <h3 style="margin:4px 0 8px">Pinned Vitals Header + Instant Crisis Protocol</h3>
          <p style="font-size:0.88rem;color:var(--slate-700);line-height:1.6">
            Every client record pins <b>Communication Modality</b>, <b>Sensory Profile</b>, <b>Known Antecedents</b>, <b>Reinforcer Hierarchy</b>, live <b>CPT Unit Counters</b>, and a red <b>"🚨 Emergency / Crisis Plan"</b> toggle at the top of every view—plus an in-session BIP drawer.
          </p>
        </div>
      </div>

      <div class="card" style="background:var(--slate-900);color:#fff;border:none">
        <div class="flex-between" style="flex-wrap:wrap;gap:14px">
          <div>
            <div style="font-size:0.75rem;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Live Prototype Walkthrough</div>
            <h3 style="margin:4px 0;color:#fff">See Eleanor's Consolidated Client 360 & Crisis Banner</h3>
            <p style="margin:0;font-size:0.85rem;color:#cbd5e1">Automatically logs in as <b>Dr. Dana Rivera, BCBA</b>, opens Eleanor's 360 Cockpit, and expands the Crisis De-escalation Protocol.</p>
          </div>
          <button class="ok" style="padding:12px 20px;font-size:0.95rem" onclick="act.pitchDemo('client360_crisis', 3)">🚀 Launch Live Client 360 Demo</button>
        </div>
      </div>
    `,

    // SLIDE 4: Uniqueness #2 - Field Session Cockpit, DTT <-> NET & Kid Mode
    `
      <div class="pitch-kicker">⚡ Slide 5 of 10 · Core Innovation #2: Field Ergonomics & Child Engagement</div>
      <h1 class="pitch-title">One-Handed Session Cockpit, DTT ↔ NET Toggle & Embedded Kid Mode</h1>
      <p class="pitch-lead">
        Real pediatric therapy isn't static. Clinicians move constantly between structured table work (<b>Discrete Trial Training</b>) and child-led play on the floor (<b>Natural Environment Teaching</b>)—while reinforcing the child with visual tokens.
      </p>

      <div class="pitch-grid-3">
        <div class="pitch-box highlight">
          <div class="pitch-emblem">🧩</div>
          <div><span class="badge p">1-Tap Mode Switch</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">🎯 DTT Mode ↔ 🧩 NET Play Grid</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            In <b>DTT Mode</b>, focus on one skill with oversized 60px+ buttons across all 6 BACB prompt levels (<code>I / V / G / M / P / N</code>) + instant undo. Tap <b>🧩 NET Mode</b> to see all active goals in a compact multi-target grid for floor play!
          </p>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">⭐</div>
          <div><span class="badge tan">Industry First</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">⭐ Embedded Interactive Kid Mode</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            Tap <b>"⭐ Kid Mode"</b> inside any active session to open an interactive <b>5-Star Token Economy Board</b> + <b>Digital First/Then Visual Schedule</b> right on the tablet—no more lost Velcro stars!
          </p>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">⏱️</div>
          <div><span class="badge sen">Automated Billing Math</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">⏱️ CMS 8-Minute Rule Engine</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            Dark-mode elapsed timer calculates billable 15-minute CPT units in real time using the exact CMS 8-minute threshold rule (e.g., 23 mins = 2 units; 180 mins = 12 units).
          </p>
        </div>
      </div>

      <div class="card" style="background:var(--slate-900);color:#fff;border:none">
        <div class="flex-between" style="flex-wrap:wrap;gap:14px">
          <div>
            <div style="font-size:0.75rem;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Live Prototype Walkthrough</div>
            <h3 style="margin:4px 0;color:#fff">Test the RBT Session Cockpit: Kid Mode Token Board & NET Grid</h3>
            <p style="margin:0;font-size:0.85rem;color:#cbd5e1">Logs in as <b>Sam Lee, RBT</b> and launches Eleanor's active school session so you can tap stars, switch between DTT and NET, and log trials.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="ok" style="padding:12px 18px;font-size:0.9rem" onclick="act.pitchDemo('session_kidmode', 4)">⭐ Launch Session + Kid Mode</button>
            <button class="sec" style="padding:12px 18px;font-size:0.9rem;background:#1e293b;color:#fff;border-color:#475569" onclick="act.pitchDemo('session_net', 4)">🧩 Launch NET Multi-Target Grid</button>
          </div>
        </div>
      </div>
    `,

    // SLIDE 5: Uniqueness #3 - Functional Behavior Reduction & Hourly Scatterplot Heatmap
    `
      <div class="pitch-kicker">📊 Slide 6 of 10 · Core Innovation #3: Functional Behavior Analytics</div>
      <h1 class="pitch-title">4-Function FBA Matrix & Live Hourly Scatterplot Heatmap</h1>
      <p class="pitch-lead">
        Standard ABA apps let RBTs log an ABC event, but bury the data in a chronological table. EBA transforms every ABC log into an instant <b>Functional Behavior Assessment (FBA)</b> with an automated <b>8:00 AM – 5:00 PM Temporal Scatterplot Heatmap</b>.
      </p>

      <div class="pitch-grid-2">
        <div class="pitch-box">
          <div class="pitch-emblem">🧠</div>
          <h3 style="margin:0 0 8px;font-size:1.05rem">Automatic 4-Function Classification</h3>
          <p style="font-size:0.86rem;color:var(--slate-600);line-height:1.6;margin:0 0 12px">
            Every behavior incident is tagged and color-coded across the four clinical functions of behavior:
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge esc">Escape / Avoidance</span>
            <span class="badge att">Attention Seeking</span>
            <span class="badge tan">Tangible / Access</span>
            <span class="badge sen">Sensory / Automatic</span>
          </div>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">⏰</div>
          <h3 style="margin:0 0 8px;font-size:1.05rem">Why the Hourly Scatterplot Matters to BCBAs</h3>
          <p style="font-size:0.86rem;color:var(--slate-700);line-height:1.6;margin:0">
            In Eleanor's pre-loaded clinical record, our heatmap immediately reveals that <b>60% of her behaviors cluster in the 11:00 AM hour</b> (right before noisy cafeteria transition). Instead of guessing, the BCBA can immediately introduce a 10:55 AM visual countdown and sensory headphones!
          </p>
        </div>
      </div>

      <div class="card" style="background:var(--slate-900);color:#fff;border:none">
        <div class="flex-between" style="flex-wrap:wrap;gap:14px">
          <div>
            <div style="font-size:0.75rem;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Live Prototype Walkthrough</div>
            <h3 style="margin:4px 0;color:#fff">Inspect Eleanor's 11:00 AM Setting Event Peak on the Scatterplot</h3>
            <p style="margin:0;font-size:0.85rem;color:#cbd5e1">Opens Eleanor's <b>Behavior & ABC</b> portal showing the 4-Function Matrix and the 8 AM–5 PM Temporal Scatterplot Heatmap.</p>
          </div>
          <button class="ok" style="padding:12px 20px;font-size:0.95rem" onclick="act.pitchDemo('fba_scatterplot', 5)">🚀 View Live Scatterplot Heatmap</button>
        </div>
      </div>
    `,

    // SLIDE 6: Uniqueness #4 - Automated Mastery & Plateau Intelligence
    `
      <div class="pitch-kicker">🎯 Slide 7 of 10 · Core Innovation #4: Clinical Decision Support</div>
      <h1 class="pitch-title">Automated Mastery Detection & Target Plateau Alerts</h1>
      <p class="pitch-lead">
        When a BCBA manages a caseload of 10–15 children, manually reviewing 150 skill acquisition graphs every week is nearly impossible. EBA's <code>goalProgress()</code> engine audits every session automatically.
      </p>

      <div class="pitch-grid-3">
        <div class="pitch-box" style="background:#f0fdf4;border-color:#86efac">
          <div class="pitch-emblem" style="border-color:#86efac">🏆</div>
          <div><span class="tag approved">🎯 Mastery Criteria Met</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem;color:#065f46">Auto-Detects ≥80% × 3 Sessions</h3>
          <p style="margin:0;font-size:0.85rem;color:#047857">
            Eleanor's <i>"Following teacher directions"</i> goal hit 83%, 86%, and 90% independent across her last 3 sessions. EBA flags it with a 1-tap <b>"✓ Advance to Mastered"</b> button for the BCBA.
          </p>
        </div>

        <div class="pitch-box" style="background:#fffbeb;border-color:#fde68a">
          <div class="pitch-emblem" style="border-color:#fde68a">⚠️</div>
          <div><span class="tag draft">⚠️ Target Stalled / Plateau</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem;color:#92400e">Flags Stagnant Targets Early</h3>
          <p style="margin:0;font-size:0.85rem;color:#b45309">
            Eleanor's <i>"Waiting for a turn"</i> goal has stayed flat at 20% across 3 sessions (baseline 20%). EBA alerts the BCBA to modify the prompt hierarchy before weeks are wasted.
          </p>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">📊</div>
          <div><span class="badge p">Prompt Dependency Audit</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">Prompt Fading Breakdown</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            Under every skill graph, EBA displays the exact prompt distribution (<code>I / V / G / M / P / N</code>) from the latest session so BCBAs can spot verbal or physical prompt dependency at a glance.
          </p>
        </div>
      </div>

      <div class="card" style="background:var(--slate-900);color:#fff;border:none">
        <div class="flex-between" style="flex-wrap:wrap;gap:14px">
          <div>
            <div style="font-size:0.75rem;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Live Prototype Walkthrough</div>
            <h3 style="margin:4px 0;color:#fff">See Live Mastery, Plateau & Improving Targets Side-by-Side</h3>
            <p style="margin:0;font-size:0.85rem;color:#cbd5e1">Opens Eleanor's <b>Skills & DTT</b> tab with 3 pre-seeded clinical trajectories (Mastery Met, Stalled Alert, and Improving).</p>
          </div>
          <button class="ok" style="padding:12px 20px;font-size:0.95rem" onclick="act.pitchDemo('mastery_intelligence', 6)">🚀 Open Skills & Mastery Radar</button>
        </div>
      </div>
    `,

    // SLIDE 7: Uniqueness #5 - Eliminating "Pajama Time" (Auto-SOAP + 6-Month Re-Auth)
    `
      <div class="pitch-kicker">📝 Slide 8 of 10 · Core Innovation #5: Zero "Pajama Time" Documentation</div>
      <h1 class="pitch-title">1-Click Auto-SOAP Notes & 6-Month Insurance Re-Auth Packets</h1>
      <p class="pitch-lead">
        Clinician burnout in ABA is driven by unpaid evening documentation. EBA automates both daily RBT session notes and 6-month BCBA insurance re-authorization reports while enforcing 21 CFR Part 11 dual-signature compliance.
      </p>

      <div class="pitch-grid-2">
        <div class="pitch-box highlight">
          <div class="pitch-emblem">✍️</div>
          <div><span class="badge tan">Daily RBT → BCBA Workflow</span></div>
          <h3 style="margin:8px 0 6px">Auto-Compiled SOAP Note + Co-Signature</h3>
          <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:var(--slate-700);line-height:1.6">
            <li>Combines session duration, CMS 8-minute billable units, exact trial percentages per goal, client reinforcers, and in-session ABC incidents into a structured narrative in 1 click.</li>
            <li><b>Strict Role Separation:</b> RBTs click <i>"Submit for BCBA Co-Signature"</i> (<code>pending_approval</code>). Only a BCBA can click <i>"✍️ Co-Sign & Finalize"</i> (<code>signed</code>).</li>
          </ul>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">📄</div>
          <div><span class="badge p">Every 6 Months · Saves 4–6 Hours/Client</span></div>
          <h3 style="margin:8px 0 6px">1-Click Insurance Re-Authorization Generator</h3>
          <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:var(--slate-700);line-height:1.6">
            <li>Generates a complete 5-section <b>CPT 97151 / 97155 Treatment Plan & Re-Authorization Progress Report</b> directly from live Client 360 data.</li>
            <li>Includes Client Vitals, Skill Mastery Table, FBA Behavior Reduction Summary, BACB 5% Supervision Audit, and Medical Necessity Justification—ready to Copy or Print to PDF.</li>
          </ul>
        </div>
      </div>

      <div class="card" style="background:var(--slate-900);color:#fff;border:none">
        <div class="flex-between" style="flex-wrap:wrap;gap:14px">
          <div>
            <div style="font-size:0.75rem;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Live Prototype Walkthrough</div>
            <h3 style="margin:4px 0;color:#fff">Test Both Documentation Superpowers Live</h3>
            <p style="margin:0;font-size:0.85rem;color:#cbd5e1">Generate Eleanor's 6-Month Insurance Re-Authorization Packet or co-sign Leon's pending RBT session note in 1 click.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="ok" style="padding:12px 18px;font-size:0.9rem" onclick="act.pitchDemo('reauth_report', 7)">📄 Generate 6-Month Re-Auth Packet</button>
            <button class="sec" style="padding:12px 18px;font-size:0.9rem;background:#1e293b;color:#fff;border-color:#475569" onclick="act.pitchDemo('dual_sign', 7)">✍️ Co-Sign Pending RBT Note</button>
          </div>
        </div>
      </div>
    `,

    // SLIDE 8: Uniqueness #6 - AI Clinical Guardrails, BACB 5% Radar & Parent Portal
    `
      <div class="pitch-kicker">🔒 Slide 9 of 10 · Core Innovation #6: Compliance, Ethics & Family Care</div>
      <h1 class="pitch-title">AI Clinical Guardrails, BACB 5% Radar & Guarded Parent Portal</h1>
      <p class="pitch-lead">
        Unlike generic AI wrappers that hallucinate clinical advice, EBA enforces deterministic ABA taxonomy and hard BACB ethical guardrails across every AI tool, supervision tracker, and parent view.
      </p>

      <div class="pitch-grid-3">
        <div class="pitch-box highlight">
          <div class="pitch-emblem">📖</div>
          <div><span class="badge p">Hard Clinical Guardrail</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">AI Social Stories & BIPs</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            Generates child-tailored Social Stories (incorporating special interests like LEGO or Space Rockets + Web Speech Read-Aloud) and FCT Behavior Plans. <b>Locked as <code>draft</code> until BCBA approval.</b>
          </p>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">👨‍👩‍👧</div>
          <div><span class="badge esc">Zero-Leakage RBAC</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">Guarded Parent Portal</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            When Mrs. Carter signs in, the API strips all raw ABC logs, internal clinical notes, CPT billing units, and unapproved drafts—showing only her child's progress and BCBA-shared stories.
          </p>
        </div>

        <div class="pitch-box highlight">
          <div class="pitch-emblem">🎯</div>
          <div><span class="badge tan">Licensure Protection</span></div>
          <h3 style="margin:8px 0 6px;font-size:1rem">BACB 5% Supervision Radar</h3>
          <p style="margin:0;font-size:0.85rem;color:var(--slate-600)">
            Automatically tracks supervised minutes against total RBT direct therapy hours, alerting the clinic if supervision drops below the mandatory 5% BACB threshold.
          </p>
        </div>
      </div>

      <div class="card" style="background:var(--slate-900);color:#fff;border:none">
        <div class="flex-between" style="flex-wrap:wrap;gap:14px">
          <div>
            <div style="font-size:0.75rem;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Live Prototype Walkthrough</div>
            <h3 style="margin:4px 0;color:#fff">Experience the BCBA Approval Guardrail & Mrs. Carter's Parent View</h3>
            <p style="margin:0;font-size:0.85rem;color:#cbd5e1">Compare what the BCBA sees (1 Shared LEGO Story + 1 Draft Fire Drill Story) vs. what Mrs. Carter sees in the Parent Portal.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="ok" style="padding:12px 16px;font-size:0.88rem" onclick="act.pitchDemo('ai_guardrails', 8)">📖 BCBA Social Story & Audio Demo</button>
            <button class="sec" style="padding:12px 16px;font-size:0.88rem;background:#1e293b;color:#fff;border-color:#475569" onclick="act.pitchDemo('parent_portal', 8)">👨‍👩‍👧 Switch to Parent Portal</button>
            <button class="sec" style="padding:12px 16px;font-size:0.88rem;background:#1e293b;color:#fff;border-color:#475569" onclick="act.pitchDemo('supervision_radar', 8)">🎯 5% Supervision Radar</button>
          </div>
        </div>
      </div>
    `,

    // SLIDE 9: Interactive Clinic ROI Calculator & 5-Minute Live Demo Choreography
    `
      <div class="pitch-kicker">🚀 Slide 10 of 10 · Practice Impact & Guided Demo Script</div>
      <h1 class="pitch-title">Interactive Clinic ROI Calculator & 5-Minute Live Demo Flow</h1>
      <p class="pitch-lead">
        Adjust the clinic size below to see how much clinician time and unbilled administrative overhead EBA returns to direct child care every year—or use the 5-step buttons below to run the live walkthrough.
      </p>

      <div class="card" style="background:var(--slate-100);border:1.5px solid var(--slate-300)">
        <h3 style="margin:0 0 12px;color:var(--slate-900)">Interactive Practice Time-Savings & ROI Estimator</h3>
        <div class="row" style="margin-bottom:16px">
          <div>
            <label>Supervising BCBAs in Clinic: <b>${roiBcba} BCBAs</b> (~${caseload} active clients)</label>
            <input type="range" min="1" max="25" value="${roiBcba}" oninput="act.updateRoi(this.value, null)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>Field RBTs in Clinic: <b>${roiRbt} RBTs</b></label>
            <input type="range" min="1" max="80" value="${roiRbt}" oninput="act.updateRoi(null, this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>
        <div class="grid" style="margin-bottom:0">
          <div class="stat-card ok">
            <div class="stat-label">BCBA Re-Auth & Audit Time Saved</div>
            <div class="stat" style="color:var(--ok)">${reauthHoursSavedYr} hrs/yr</div>
            <div class="stat-sub">1-click 6-month packets + auto mastery alerts</div>
          </div>
          <div class="stat-card ok">
            <div class="stat-label">RBT SOAP Note Time Saved</div>
            <div class="stat" style="color:var(--primary)">${soapHoursSavedYr} hrs/yr</div>
            <div class="stat-sub">Auto-compiled trial + ABC session narratives</div>
          </div>
          <div class="stat-card ok">
            <div class="stat-label">Total Clinical Capacity Reclaimed</div>
            <div class="stat" style="color:var(--slate-900)">${totalHoursSaved} hrs/yr</div>
            <div class="stat-sub">~$${estFinancialValue}/yr in clinical labor value</div>
          </div>
        </div>
      </div>

      <h3 style="margin:20px 0 10px">🎬 Recommended 5-Minute Live Demo Choreography for the Founding Therapist</h3>
      <div class="pitch-grid-2" style="margin-bottom:0">
        <div class="pitch-box">
          <b>Step 1: The Client 360 & Crisis Safety (1 Min)</b>
          <p style="font-size:0.83rem;color:var(--slate-600);margin:4px 0 10px">Show how Vitals, Communication, Reinforcers, and the 1-Tap Crisis Plan live in one header.</p>
          <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="act.pitchDemo('client360_crisis', 9)">1. Launch Client 360 →</button>
        </div>
        <div class="pitch-box">
          <b>Step 2: Active Session Cockpit, Kid Mode & NET (1.5 Mins)</b>
          <p style="font-size:0.83rem;color:var(--slate-600);margin:4px 0 10px">Tap the 5-Star Kid Mode token board, switch from DTT to NET Play Grid, and log trials.</p>
          <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="act.pitchDemo('session_kidmode', 9)">2. Launch Session Cockpit →</button>
        </div>
        <div class="pitch-box">
          <b>Step 3: 11 AM FBA Scatterplot & Mastery AI (1.5 Mins)</b>
          <p style="font-size:0.83rem;color:var(--slate-600);margin:4px 0 10px">Show Eleanor's 11:00 AM pre-lunch behavior cluster and the Mastery vs. Stalled goal alerts.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="act.pitchDemo('fba_scatterplot', 9)">3a. FBA Scatterplot →</button>
            <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="act.pitchDemo('mastery_intelligence', 9)">3b. Mastery AI →</button>
          </div>
        </div>
        <div class="pitch-box">
          <b>Step 4: 1-Click 6-Month Re-Auth & Parent Portal (1 Min)</b>
          <p style="font-size:0.83rem;color:var(--slate-600);margin:4px 0 10px">Generate the 5-section CPT 97151/97155 insurance packet and preview Mrs. Carter's Parent Portal.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="act.pitchDemo('reauth_report', 9)">4a. Re-Auth Packet →</button>
            <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="act.pitchDemo('parent_portal', 9)">4b. Parent View →</button>
          </div>
        </div>
      </div>
    `
  ];

  const inner = `
  <div class="pitch-deck-wrap">
    <div class="pitch-topbar">
      <div style="display:flex;align-items:center;gap:16px">
        ${brandEmblem('lg')}
        <div>
          <div style="font-weight:800;font-size:1.18rem;letter-spacing:-0.015em;color:#031d24">Founder & Clinical Advisor Pitch Deck</div>
          <div style="font-size:0.82rem;color:#0b4650;font-weight:600;margin-top:2px">Existing ABA Technology vs. Effective Behavioral Approach · Use ← / → keys or slide numbers</div>
        </div>
      </div>
      <div class="pitch-dots">
        ${slides.map((_, i) => `
          <button class="pitch-dot ${pitchSlide === i ? 'active' : ''}" title="${esc(slideTitles[i])}" onclick="act.setPitchSlide(${i})">${i + 1}</button>
        `).join('')}
      </div>
      <div>
        ${me ? `<button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="go('dashboard')">Exit to App</button>`
             : `<button class="ok" style="padding:8px 14px;font-size:0.82rem" onclick="act.demoLogin('bcba@eba.test')">Sign In to Live App →</button>`}
      </div>
    </div>

    <div class="pitch-slide">
      ${slides[pitchSlide]}

      <div class="pitch-cta-bar">
        <button class="sec" ${pitchSlide === 0 ? 'disabled' : ''} onclick="act.setPitchSlide(${pitchSlide - 1})">← Previous Slide</button>
        <div style="font-size:0.82rem;font-weight:700;color:var(--slate-500)">
          ${esc(slideTitles[pitchSlide])} (${pitchSlide + 1} / ${slides.length})
        </div>
        ${pitchSlide < slides.length - 1
          ? `<button class="ok" onclick="act.setPitchSlide(${pitchSlide + 1})">Next: ${esc(slideTitles[pitchSlide + 1])} →</button>`
          : `<button class="ok" onclick="act.pitchDemo('client360_crisis', 9)">🚀 Start Full Live Demo Tour</button>`}
      </div>
    </div>
  </div>`;

  return me ? inner : `<div class="pitch-public-shell">${inner}</div>`;
}

window.addEventListener('keydown', (e) => {
  if (!location.hash.startsWith('#presentation')) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target || {}).tagName)) return;
  if (e.key === 'ArrowRight' && pitchSlide < 9) act.setPitchSlide(pitchSlide + 1);
  if (e.key === 'ArrowLeft' && pitchSlide > 0) act.setPitchSlide(pitchSlide - 1);
});

async function render() {
  const rawRoute = (location.hash.slice(1) || '').split('/')[0];
  if (!me) {
    try { me = await api('GET', '/api/me'); } catch {
      if (rawRoute === 'presentation') { $app.innerHTML = presentationView(); return; }
      $app.innerHTML = loginView();
      return;
    }
  }
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
    else if (route === 'presentation') html = presentationView();
    else html = '<h1>View Not Found</h1><div class="card">Please select an option from the navigation menu.</div>';
    $app.innerHTML = shell(html, route === 'client' ? 'clients' : route === 'session' ? 'notes' : route);
  } catch (e) { $app.innerHTML = shell(`<div class="card err">${esc(e.message)}</div>`, ''); }
}

window.addEventListener('hashchange', render);
render();
}
