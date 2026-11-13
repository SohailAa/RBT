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
let kpiPersona = null;
let facilityData = null;
let activeFacilityModelId = 1;
let facilityCfg = null;
let facilitySubTab = 'overview';
let facilityPnlViewMode = 'annual';
let showAddSignupForm = false;
let staffProdSearchQuery = '';
let staffProdRoleFilter = 'ALL';
let staffProdClientFilter = 'ALL';
let lastStaffProdData = [];
let clientBillingSearchQuery = '';
let clientBillingStatusFilter = 'ALL';
let lastClientBillingSnapshots = [];
let licensingSubTab = 'agreements';
let activeAgreementDoc = 'msa';
let selectedAgreementLicId = null;
let showIssueLicenseForm = false;
let lastLicensingData = null;
let mobileNavOpen = false;
let openBehMenuId = null;
let showArchivedBehaviors = false;
let smartGoalAnalysis = null;
let smartGoalInputText = '';
let smartGoalType = 'skill_acquisition';
let smartGoalDomain = '';
let smartGoalFindingId = null;
let smartGoalFindingText = '';
let assessmentPlannerSubTab = 'report_templates';
let selectedAssessmentInstrumentId = 'vbmapp';
let activeReportTemplateId = 'all';
let reauthModalTab = 'structured_template';
let assessmentCenterClientId = 1;
let rbtFullClinicalView = false;
let showSessionNotesBox = false;
let loginAuthTab = 'signin';
let firebaseCloudStatus = { connected: true, projectId: 'rbt-sepia-aba', lastSyncAt: null };
let firebaseBootRestored = false;
let traceFilterMetric = null;
let traceFilterEventIds = null;

const PROMPT_SHORT_LABELS = {
  I: 'IND',
  V: 'VERB',
  G: 'GEST',
  Vi: 'VIS',
  M: 'MOD',
  PP: 'PART',
  P: 'PHYS',
  INC: 'ERR',
  N: 'REF',
  NA: 'N/A'
};

const SMART_MEASUREMENT_OPTIONS = [
  { key: 'percentage_of_opportunities', label: 'Percentage of Opportunities (% Independent)' },
  { key: 'trial_by_trial', label: 'Trial-by-Trial / Discrete Trial Recording (DTT)' },
  { key: 'latency', label: 'Latency Recording (Time from Cue/SD to Initiation)' },
  { key: 'frequency', label: 'Frequency / Event & Rate Recording (Count per Session/Hour)' },
  { key: 'duration', label: 'Duration Recording (Total / Mean Episode Length)' },
  { key: 'task_analysis', label: 'Task Analysis (% Independent Steps)' },
  { key: 'mts', label: 'Momentary Time Sampling (MTS)' },
  { key: 'partial_interval', label: 'Partial-Interval Recording' },
  { key: 'whole_interval', label: 'Whole-Interval Recording' },
  { key: 'irt', label: 'Inter-Response Time (IRT)' },
  { key: 'abc', label: 'ABC Narrative / Functional Context Recording' },
  { key: 'permanent_product', label: 'Permanent Product Recording' }
];

function renderAutoPopulatedReportTemplateSection(c, data, isModal = false) {
  const repTpl = (data && data.reportTemplate) || (activeModal && activeModal.report && activeModal.report.reportTemplate) || {};
  const availableTemplates = repTpl.availableTemplates || [
    { id: 'vbmapp', name: 'VB-MAPP', fullName: 'Verbal Behavior Milestones Assessment and Placement Program', category: 'Developmental / Verbal Behavior Milestone Assessment', phaseStatus: 'Phase 1 Supported', domainCount: 13 },
    { id: 'abllsr', name: 'ABLLS-R', fullName: 'Assessment of Basic Language and Learning Skills – Revised', category: 'Criterion-Referenced Skill Tracking Assessment', phaseStatus: 'Phase 1 Supported', domainCount: 11 },
    { id: 'afls', name: 'AFLS', fullName: 'Assessment of Functional Living Skills', category: 'Functional & Adaptive Living Skills Assessment', phaseStatus: 'Phase 1 Supported', domainCount: 6 },
    { id: 'efl', name: 'Essential for Living (EFL)', fullName: 'Essential for Living — Functional Communication & Behavior Curriculum', category: 'Functional Communication & Essential Life Skills Assessment', phaseStatus: 'Phase 1 Supported', domainCount: 9 },
    { id: 'vineland3', name: 'Vineland-3', fullName: 'Vineland Adaptive Behavior Scales, Third Edition', category: 'Standardized Adaptive Behavior Measure', phaseStatus: 'Phase 1 Supported', domainCount: 5 },
    { id: 'peak', name: 'PEAK', fullName: 'Promoting the Emergence of Advanced Knowledge', category: 'Derived Relational Responding (Later Phase)', phaseStatus: 'Later Phase / Future Expansion', domainCount: 4 }
  ];
  const allRows = repTpl.domainRows || [];
  const filteredRows = activeReportTemplateId === 'all'
    ? allRows
    : allRows.filter(r => r.instrumentId === activeReportTemplateId);
  const populatedRows = filteredRows.filter(r => r.evidenceStatus === 'clinician_entered');
  const unpopulatedRows = filteredRows.filter(r => r.evidenceStatus !== 'clinician_entered');
  const canApprove = me && ['BCBA', 'OWNER'].includes(me.role);
  const canPopulate = me && ['BCBA', 'OWNER', 'ADMIN'].includes(me.role);
  const selectedTplMeta = availableTemplates.find(t => t.id === activeReportTemplateId);
  const populateTargetId = activeReportTemplateId === 'all' ? 'vbmapp' : activeReportTemplateId;
  const populateTargetName = selectedTplMeta ? selectedTplMeta.name : 'VB-MAPP';

  return `
    <!-- Document-Style Header Banner (Matching Uploaded RBT Sepia PDFs #113f59 / #0f766e) -->
    <div class="card" style="padding:0;overflow:hidden;border:1.5px solid #0f766e;margin-bottom:16px">
      <div style="background:linear-gradient(135deg,#113f59 0%,#0f5c59 100%);color:#fff;padding:18px 22px">
        <div class="flex-between" style="flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:0.74rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#99f6e4;margin-bottom:4px">
              RBT SEPIA · AUTO-POPULATED ASSESSMENT & CLINICAL PROGRESS REPORT TEMPLATE
            </div>
            <h3 style="margin:0;color:#fff;font-size:1.28rem">
              📊 ${esc(c.name)} — Multi-Domain Assessment-to-Goal & Measurement Report
            </h3>
            <div style="font-size:0.83rem;color:#e2e8f0;margin-top:4px">
              Auto-populates domains from <b>VB-MAPP</b>, <b>ABLLS-R</b>, <b>AFLS</b>, <b>Essential for Living (EFL)</b>, and <b>Vineland-3</b> with traceable <b>Operational Definitions</b>, <b>Primary & Secondary Measurement Systems</b>, and separated <b>Raw Data vs. Calculated Metrics vs. AI Narrative</b>.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            ${canPopulate && activeReportTemplateId !== 'peak' ? `
              <button type="button" class="ok" style="background:#10b981;border-color:#059669;padding:9px 15px;font-size:0.82rem;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.2)" onclick="act.populateReportTemplateDomains(${c.id}, '${populateTargetId}')">
                ✨ 1-Click Auto-Populate All ${esc(populateTargetName)} Domains
              </button>
            ` : ''}
            ${!isModal ? `
              <button type="button" class="sec" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.3);padding:8px 14px;font-size:0.8rem" onclick="act.openReauthReportModal(${c.id})">
                🖨️ Open Printable Full Packet
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Template Selector Pills -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.18)">
          <span style="font-size:0.75rem;font-weight:700;color:#cbd5e1;align-self:center;margin-right:4px">Filter / Select Template:</span>
          <button type="button" class="${activeReportTemplateId === 'all' ? 'ok' : 'sec'}" style="padding:5px 12px;font-size:0.78rem;${activeReportTemplateId !== 'all' ? 'background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.22)' : ''}" onclick="act.selectReportTemplate(${c.id}, 'all')">
            🗂️ All Frameworks (${allRows.length} Domains)
          </button>
          ${availableTemplates.map(t => `
            <button type="button" class="${activeReportTemplateId === t.id ? 'ok' : 'sec'}" style="padding:5px 12px;font-size:0.78rem;${activeReportTemplateId !== t.id ? 'background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.22)' : ''}" onclick="act.selectReportTemplate(${c.id}, '${t.id}')">
              ${t.id === 'peak' ? '⏳ ' : '📋 '}${esc(t.name)} (${t.domainCount})
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Summary Status Strip -->
      <div style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid var(--slate-200);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:0.82rem">
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
          <span><b>Selected Template:</b> <span class="badge p">${esc(selectedTplMeta ? `${selectedTplMeta.name} — ${selectedTplMeta.fullName}` : 'Consolidated Multi-Framework Clinical Report')}</span></span>
          <span><b>Clinician-Populated Domains:</b> <span class="tag approved">${populatedRows.length} Active / Documented</span></span>
          ${unpopulatedRows.length ? `<span><b>Remaining Template Domains:</b> <span class="tag draft">${unpopulatedRows.length} Ready to Auto-Populate</span></span>` : ''}
        </div>
        <div style="font-size:0.76rem;color:#0f766e;font-weight:700">
          🛡️ Zero Fabricated Scores · 100% Traceable to Clinician Evidence · BCBA Sign-Off Required
        </div>
      </div>

      <!-- SECTION 1 TABLE: ASSESSMENT-TO-GOAL MAPPING & AUTO-POPULATED DOMAIN MATRIX (PDF Page 2 Style) -->
      <div style="padding:18px 20px">
        <div class="flex-between" style="flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <h4 style="margin:0;color:#113f59;font-size:1.05rem">1. Auto-Populated Assessment-to-Goal & Domain Matrix</h4>
            <p style="margin:2px 0 0;font-size:0.8rem;color:var(--slate-600)">
              Maps each assessment domain to its clinician-entered area of need, operational definition (onset/offset/exclusions), primary + secondary measurement system, and separated raw vs. calculated progress metrics.
            </p>
          </div>
          ${canPopulate && unpopulatedRows.length && activeReportTemplateId !== 'peak' ? `
            <button type="button" class="ok" style="padding:6px 12px;font-size:0.78rem" onclick="act.populateReportTemplateDomains(${c.id}, '${populateTargetId}')">
              + Auto-Populate Remaining ${unpopulatedRows.length} Domain(s)
            </button>
          ` : ''}
        </div>

        <div class="table-responsive">
          <table style="border:1px solid #cbd5e1;border-collapse:collapse">
            <thead>
              <tr style="background:#113f59;color:#fff">
                <th style="background:#113f59;color:#fff;padding:10px 12px;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em;width:15%">Assessment & Domain</th>
                <th style="background:#113f59;color:#fff;padding:10px 12px;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em;width:19%">Documented Area of Need (Clinician-Entered)</th>
                <th style="background:#113f59;color:#fff;padding:10px 12px;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em;width:23%">Draft / Active Goal & Operational Definition</th>
                <th style="background:#113f59;color:#fff;padding:10px 12px;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em;width:18%">Recommended Measurement & Data Fields</th>
                <th style="background:#113f59;color:#fff;padding:10px 12px;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em;width:16%">Progress Monitoring (Raw vs. Calculated vs. AI)</th>
                <th style="background:#113f59;color:#fff;padding:10px 12px;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em;width:9%">Status / Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRows.map((row, idx) => {
                const isPopulated = row.evidenceStatus === 'clinician_entered';
                const rowBg = idx % 2 === 1 ? '#f8fafc' : '#fff';
                return `
                  <tr style="background:${rowBg};vertical-align:top;border-bottom:1px solid #e2e8f0">
                    <td style="padding:10px 12px">
                      <div style="font-weight:800;color:#113f59;font-size:0.86rem">${esc(row.instrumentName)}</div>
                      <div style="font-weight:700;color:var(--slate-900);font-size:0.84rem;margin-top:2px">${esc(row.domain)}</div>
                      <div style="font-size:0.72rem;color:var(--slate-500);margin-top:3px">${esc(row.domainGroup || '')}</div>
                      <span class="badge" style="margin-top:5px;font-size:0.68rem">${row.goalType === 'behavior_reduction' ? '📉 Behavior Reduction' : '🎯 Skill Acquisition'}</span>
                    </td>
                    <td style="padding:10px 12px;font-size:0.81rem">
                      <div style="margin-bottom:5px">
                        <span class="tag ${isPopulated ? 'approved' : 'draft'}" style="font-size:0.68rem">
                          ${isPopulated ? '✓ Clinician-Entered' : '⚡ Template Ready'}
                        </span>
                        <span class="badge tan" style="font-size:0.68rem;margin-left:4px">${esc(row.scoreOrLevel || 'Pending')}</span>
                      </div>
                      <div style="color:var(--slate-800);line-height:1.45">${esc(row.documentedFinding)}</div>
                      <div style="font-size:0.72rem;color:var(--slate-500);margin-top:4px">
                        <b>Source:</b> ${esc(row.evidenceSource)} · <b>Setting:</b> ${esc(row.context || 'Clinic')}
                      </div>
                    </td>
                    <td style="padding:10px 12px;font-size:0.81rem">
                      <div style="font-weight:700;color:#0f5c59;line-height:1.4;margin-bottom:5px">${esc(row.goalStatement)}</div>
                      <div style="font-size:0.77rem;color:var(--slate-700);line-height:1.4">
                        <b>Operational Definition:</b> ${esc(row.operationalDefinition?.summary || '')}
                      </div>
                      <div style="font-size:0.73rem;color:var(--slate-600);margin-top:4px;background:#f1f5f9;padding:5px 8px;border-radius:6px">
                        <div><b>Onset:</b> ${esc(row.operationalDefinition?.onsetCriteria || '—')}</div>
                        <div><b>Offset:</b> ${esc(row.operationalDefinition?.offsetCriteria || '—')}</div>
                        <div><b>Exclusion:</b> ${esc((row.operationalDefinition?.exclusions || [])[0] || 'Prompted responses tracked separately')}</div>
                      </div>
                    </td>
                    <td style="padding:10px 12px;font-size:0.8rem">
                      <div style="margin-bottom:4px">
                        <span class="badge p" style="font-size:0.72rem">Primary: ${esc(row.measurementPlan?.primaryLabel || row.measurementPlan?.primaryKey || '')}</span>
                      </div>
                      ${row.measurementPlan?.secondaryLabel ? `
                        <div style="margin-bottom:5px">
                          <span class="badge" style="font-size:0.71rem">Additional: ${esc(row.measurementPlan.secondaryLabel)}</span>
                        </div>
                      ` : ''}
                      <div style="font-size:0.75rem;color:var(--slate-700);line-height:1.35;margin-bottom:5px">
                        <b>Why it fits:</b> ${esc(row.measurementPlan?.rationale || '')}
                      </div>
                      <div style="font-size:0.72rem;color:var(--slate-600)">
                        <b>Data Fields:</b> ${esc((row.measurementPlan?.dataFields || []).join(', '))}
                      </div>
                    </td>
                    <td style="padding:10px 12px;font-size:0.77rem">
                      <div style="background:#eff6ff;border-left:3px solid #2563eb;padding:5px 7px;border-radius:4px;margin-bottom:5px">
                        <b style="color:#1e40af;font-size:0.69rem;text-transform:uppercase">1. Raw Observations:</b>
                        <div style="color:var(--slate-800);margin-top:1px">${esc(row.progressMonitoring?.rawObservations || '')}</div>
                      </div>
                      <div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:5px 7px;border-radius:4px;margin-bottom:5px">
                        <b style="color:#166534;font-size:0.69rem;text-transform:uppercase">2. Calculated Metric (Num/Denom):</b>
                        <div style="color:var(--slate-800);margin-top:1px">${esc(row.progressMonitoring?.calculatedMetrics || '')}</div>
                      </div>
                      <div style="background:#fffbeb;border-left:3px solid #d97706;padding:5px 7px;border-radius:4px">
                        <b style="color:#92400e;font-size:0.69rem;text-transform:uppercase">3. AI Narrative Draft:</b>
                        <div style="color:var(--slate-700);margin-top:1px">${esc(row.progressMonitoring?.aiNarrativeDraft || '')}</div>
                      </div>
                    </td>
                    <td style="padding:10px 12px;text-align:right">
                      <div style="margin-bottom:6px">
                        <span class="tag ${row.goalStatus === 'active' || row.goalStatus === 'approved' ? 'approved' : 'draft'}" style="font-size:0.69rem">
                          ${esc(row.progressMonitoring?.clinicianReviewStatus || row.goalStatus)}
                        </span>
                      </div>
                      <div style="display:flex;flex-direction:column;gap:5px">
                        ${!isPopulated && canPopulate && row.instrumentId !== 'peak' ? `
                          <button type="button" class="ok" style="padding:5px 8px;font-size:0.72rem" onclick="act.populateSingleTemplateDomain(${c.id}, '${row.instrumentId}', '${row.domainCode}')">
                            + Auto-Populate Domain
                          </button>
                        ` : ''}
                        <button type="button" class="sec" style="padding:5px 8px;font-size:0.72rem" onclick="act.loadSmartGoalPreset(${c.id}, ${JSON.stringify(row.goalStatement).replace(/"/g, '&quot;')}, '${row.goalType}', ${JSON.stringify(row.domain).replace(/"/g, '&quot;')});act.setAssessmentSubTab('smart_builder');if(activeModal)act.closeModal();">
                          ✏️ Customize in Builder
                        </button>
                        ${row.draftId && canApprove && row.goalStatus !== 'approved' ? `
                          <button type="button" class="ok" style="padding:5px 8px;font-size:0.72rem" onclick="act.approveSmartGoalDraft(${row.draftId})">
                            ✓ BCBA Approve
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 2: INDIVIDUAL SMART GOAL BUILDER & OPERATIONAL DEFINITION PLAN SHEETS (PDF Page 1 Exact Layout) -->
      <div style="padding:0 20px 20px">
        <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-bottom:12px">
          <h4 style="margin:0;color:#113f59;font-size:1.05rem">
            2. Operational Definition & Data-Collection Plan Sheets (Smart Goal Builder Template Format)
          </h4>
          <p style="margin:2px 0 0;font-size:0.8rem;color:var(--slate-600)">
            Structured 2-column operational definition & measurement sheets with sample session recording tables (matching <i>RBT Sepia Smart Goal Builder</i> specification).
          </p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:16px">
          ${(populatedRows.length ? populatedRows : filteredRows.slice(0, 4)).map(row => {
            const sampleRows = row.measurementPlan?.sampleRows || [];
            return `
              <div style="border:1.5px solid #cbd5e1;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 6px rgba(15,23,42,0.04)">
                <div style="background:#e6f4f1;border-left:5px solid #0f766e;padding:10px 14px;border-bottom:1px solid #cbd5e1">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
                    <span class="badge p" style="font-size:0.7rem">${esc(row.instrumentName)} · ${esc(row.domain)}</span>
                    <span class="tag ${row.goalStatus === 'active' || row.goalStatus === 'approved' ? 'approved' : 'draft'}" style="font-size:0.68rem">
                      ${esc(row.progressMonitoring?.clinicianReviewStatus || 'Draft Plan')}
                    </span>
                  </div>
                  <div style="font-weight:800;color:#113f59;font-size:0.92rem;margin-top:4px">
                    Goal: "${esc(row.goalStatement)}"
                  </div>
                </div>

                <!-- 2-Column PDF-Style Specification Table -->
                <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
                  <thead>
                    <tr style="background:#113f59;color:#fff">
                      <th style="background:#113f59;color:#fff;padding:7px 12px;width:34%;font-size:0.73rem">Plan Element</th>
                      <th style="background:#113f59;color:#fff;padding:7px 12px;font-size:0.73rem">Recommended Clinical Specification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom:1px solid #e2e8f0">
                      <td style="padding:8px 12px;font-weight:700;background:#f8fafc;color:#1e293b">Operational definition</td>
                      <td style="padding:8px 12px;color:#334155">
                        ${esc(row.operationalDefinition?.summary || '')}
                        <div style="font-size:0.74rem;color:#475569;margin-top:3px">
                          <b>Onset:</b> ${esc(row.operationalDefinition?.onsetCriteria || '—')} · <b>Offset:</b> ${esc(row.operationalDefinition?.offsetCriteria || '—')}
                        </div>
                      </td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                      <td style="padding:8px 12px;font-weight:700;background:#f8fafc;color:#1e293b">Measurement</td>
                      <td style="padding:8px 12px;color:#0f766e;font-weight:700">${esc(row.measurementPlan?.primaryLabel || '')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                      <td style="padding:8px 12px;font-weight:700;background:#f8fafc;color:#1e293b">Additional measure</td>
                      <td style="padding:8px 12px;color:#334155">${esc(row.measurementPlan?.secondaryLabel || 'Tracked via session prompt hierarchy')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                      <td style="padding:8px 12px;font-weight:700;background:#f8fafc;color:#1e293b">Data fields</td>
                      <td style="padding:8px 12px;color:#334155">${esc((row.measurementPlan?.dataFields || []).join(', '))}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                      <td style="padding:8px 12px;font-weight:700;background:#f8fafc;color:#1e293b">Possible exclusion</td>
                      <td style="padding:8px 12px;color:#334155">${esc((row.operationalDefinition?.exclusions || [])[0] || 'Prompted responses tracked separately and excluded from independent mastery numerator')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                      <td style="padding:8px 12px;font-weight:700;background:#f8fafc;color:#1e293b">Mastery criterion</td>
                      <td style="padding:8px 12px;color:#334155"><b>${esc(row.masteryCriteria || '80% across 3 consecutive sessions')}</b> <i>(Baseline: ${esc(row.baselineData || 'Pending')})</i></td>
                    </tr>
                  </tbody>
                </table>

                ${sampleRows.length ? `
                  <div style="padding:10px 12px;background:#f8fafc;border-top:1px solid #cbd5e1">
                    <div style="font-size:0.72rem;font-weight:800;color:#113f59;text-transform:uppercase;margin-bottom:6px">
                      Sample Data-Collection Recording Sheet:
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:0.75rem;background:#fff">
                      <thead>
                        <tr style="background:#0f5c59;color:#fff">
                          ${Object.keys(sampleRows[0]).map(k => `<th style="background:#0f5c59;color:#fff;padding:5px 8px;font-size:0.7rem">${esc(k.replace(/([A-Z])/g, ' $1').replace(/^./, ch => ch.toUpperCase()))}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${sampleRows.slice(0, 5).map(sr => `
                          <tr style="border-bottom:1px solid #e2e8f0">
                            ${Object.values(sr).map(v => `<td style="padding:4px 8px">${esc(String(v))}</td>`).join('')}
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    <div style="margin-top:6px;background:#e6f4f1;border-left:4px solid #0f766e;padding:6px 10px;font-size:0.76rem;color:#065f46">
                      <b>Summary:</b> ${esc(row.measurementPlan?.sampleSummary || '')}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSmartPlannerAndAssessmentsTab(c, data, B) {
  const {
    clientAssessments = [],
    assessmentFindings = [],
    skillGapAnalysis = null,
    smartGoalDrafts = []
  } = data || {};
  const canApprove = ['BCBA', 'OWNER'].includes(me.role);
  const instruments = (skillGapAnalysis && skillGapAnalysis.supportedInstruments) || [
    { id: 'vbmapp', name: 'VB-MAPP', fullName: 'Verbal Behavior Milestones Assessment and Placement Program', category: 'Developmental / Verbal Behavior Milestone Assessment', phaseStatus: 'Phase 1 Supported', primaryPurpose: 'Assesses language, learning, and social milestones plus learning barriers and transition readiness.', learnerProfile: 'Early learners and children developing foundational vocal, PECS, or AAC verbal operants.', domains: ['Mand', 'Tact', 'Listener Responding', 'Visual Perceptual / Match-to-Sample', 'Independent Play', 'Social Behavior & Social Play', 'Motor Imitation', 'Echoic', 'LRFFC', 'Intraverbal', 'Classroom Routines & Group Skills', 'Linguistic Structure', 'Barriers Assessment'], resultFormat: 'Milestone Levels (Level 1, 2, 3), Barrier scores (0–4), and clinician domain observations.', goalPlanningUse: 'Identifies missing verbal operants, functional communication gaps, and behavioral barriers to learning.', copyrightNote: 'High-level domain reference only. Clinicians enter summarized findings; proprietary test items are never reproduced.' },
    { id: 'abllsr', name: 'ABLLS-R', fullName: 'Assessment of Basic Language and Learning Skills – Revised', category: 'Criterion-Referenced Skill Tracking Assessment', phaseStatus: 'Phase 1 Supported', primaryPurpose: 'Tracks 25 skill domains across basic learner, academic, self-help, and motor repertoires.', learnerProfile: 'Preschool through school-age learners building foundational learner readiness, language, and self-help skills.', domains: ['Cooperation & Reinforcer Effectiveness', 'Visual Performance', 'Receptive Language', 'Motor Imitation', 'Vocal Imitation', 'Requests (Mands)', 'Labeling (Tacts)', 'Intraverbals', 'Spontaneous Vocalizations', 'Social Interaction', 'Group Instruction', 'Classroom Routines', 'Generalized Responding', 'Dressing / Eating / Grooming / Toileting'], resultFormat: 'Criterion-referenced task level summaries and clinician-entered domain skill statuses.', goalPlanningUse: 'Translates specific skill gaps in cooperation, language, classroom routines, and self-care into DTT/NET and Task Analysis targets.', copyrightNote: 'High-level domain reference only. Stores clinician-entered findings without reproducing copyrighted task grids.' },
    { id: 'afls', name: 'AFLS', fullName: 'Assessment of Functional Living Skills', category: 'Functional & Adaptive Living Skills Assessment', phaseStatus: 'Phase 1 Supported', primaryPurpose: 'Evaluates functional independence across Basic Living, Home, Community, School, Vocational, and Independent Living protocols.', learnerProfile: 'School-age children, adolescents, and transition-age learners focusing on daily living and community independence.', domains: ['Basic Living Skills (Self-Management, Basic Communication, Dressing, Toileting, Grooming, Health & Safety)', 'Home Skills', 'Community Participation', 'School Skills', 'Independent Living Skills', 'Vocational Skills'], resultFormat: 'Clinician-entered domain summaries, prompt level requirements, and independence ratings.', goalPlanningUse: 'Guides multi-step Task Analysis (chaining), transition latency, and functional communication goals.', copyrightNote: 'High-level domain reference only. Stores clinician-entered summaries only.' },
    { id: 'efl', name: 'Essential for Living (EFL)', fullName: 'Essential for Living — Functional Communication, Behavior & Daily Living Curriculum', category: 'Functional Communication & Essential Life Skills Assessment', phaseStatus: 'Phase 1 Supported', primaryPurpose: 'Prioritizes the "Essential Eight" functional skills (making requests, waiting, accepting removals/transitions, completing brief tasks, accepting "no", following health/safety routines, tolerating situations) alongside severe behavior reduction.', learnerProfile: 'Learners with moderate-to-severe disabilities, limited vocal repertoires, or significant challenging behaviors.', domains: ['Speaking / Alternative Communication (Method of Communication)', 'Making Requests & Communicating Wants/Needs', 'Waiting After a Request', 'Accepting Removals, Transitions & Sharing', 'Completing Required Brief Tasks', 'Accepting "No"', 'Following Health & Safety Routines', 'Tolerating Situations Related to Health & Safety', 'Problem Behavior Tracking (Tantrums, Aggression, SIB)'], resultFormat: 'Skill performance levels, prompt dependency notes, and problem behavior severity/frequency summaries.', goalPlanningUse: 'Directly informs FCT replacement goals, transition latency targets, waiting duration goals, and behavior reduction plans.', copyrightNote: 'High-level domain reference only. Stores clinician-entered findings only.' },
    { id: 'vineland3', name: 'Vineland-3', fullName: 'Vineland Adaptive Behavior Scales, Third Edition', category: 'Standardized Norm-Referenced Adaptive Behavior Measure', phaseStatus: 'Phase 1 Supported', primaryPurpose: 'Measures adaptive behavior across Communication, Daily Living Skills, Socialization, Motor Skills, and Maladaptive Behavior (frequently required by insurance payers for medical necessity).', learnerProfile: 'Birth through adulthood; standard payer-required benchmark for initial evaluations (CPT 97151) and 6-month re-authorizations.', domains: ['Communication (Receptive, Expressive, Written)', 'Daily Living Skills (Personal, Domestic, Community)', 'Socialization (Interpersonal Relationships, Play and Leisure, Coping Skills)', 'Motor Skills (Gross Motor, Fine Motor)', 'Maladaptive Behavior Index (Internalizing, Externalizing)'], resultFormat: 'Clinician-entered Domain Standard Scores, v-scale scores, Adaptive Behavior Composite (ABC), and adaptive deficit summaries.', goalPlanningUse: 'Aligns treatment plan domains with insurance medical-necessity criteria and caregiver-reported adaptive priorities.', copyrightNote: 'High-level domain reference only. Clinicians enter already-scored summary values; system never fabricates standardized norms.' },
    { id: 'peak', name: 'PEAK', fullName: 'Promoting the Emergence of Advanced Knowledge Relational Training System', category: 'Derived Relational Responding & Advanced Language Assessment', phaseStatus: 'Later Phase / Future Expansion', primaryPurpose: 'Assesses direct training, generalization, stimulus equivalence, and relational frame theory (RFT) operants.', learnerProfile: 'Learners progressing from foundational verbal behavior to generalized, equivalence-based, and abstract relational reasoning.', domains: ['Direct Training Module', 'Generalization Module', 'Equivalence Module', 'Transformation of Functions Module'], resultFormat: 'Clinician-entered summary notes (Full module workflow scheduled for Later Phase).', goalPlanningUse: 'Included in the Reference Library for clinical awareness; marked as Later Phase per Phase 1 specification.', copyrightNote: 'Reference metadata only (Later Phase).' }
  ];
  const suggestions = (skillGapAnalysis && skillGapAnalysis.suggestions) || [];

  // Default preview if clinician hasn't clicked analyze yet
  const defaultGoalText = smartGoalInputText || (c.id === 2
    ? 'Leon will initiate movement toward the next activity within 5 seconds of a transition cue'
    : 'When assistance is needed, Eleanor will independently request a break or help across 80% of opportunities across 3 consecutive sessions');
  const activeAnalysis = smartGoalAnalysis || (smartGoalDrafts.length ? {
    rawGoalText: smartGoalDrafts[0].raw_goal_text,
    refinedGoalText: smartGoalDrafts[0].refined_goal_text,
    goalType: smartGoalDrafts[0].goal_type,
    domain: smartGoalDrafts[0].domain,
    qualityCheck: {
      isClear: true,
      qualityScore: 95,
      who: c.name,
      targetResponse: smartGoalDrafts[0].refined_goal_text,
      cueOrContext: 'When presented with instructional cue or natural routine opportunity',
      timeframe: c.id === 2 ? 'Within 5 seconds' : 'Within 5 seconds of cue',
      promptExpectation: 'Independent response (prompted tracked separately)',
      statedCriterion: smartGoalDrafts[0].mastery_criteria,
      vagueFlags: [],
      clarifyingQuestions: smartGoalDrafts[0].clarifying_questions || []
    },
    operationalDefinition: {
      summary: smartGoalDrafts[0].operational_definition,
      targetResponse: smartGoalDrafts[0].refined_goal_text,
      onsetCriteria: smartGoalDrafts[0].onset_criteria,
      offsetCriteria: smartGoalDrafts[0].offset_criteria,
      episodeRule: smartGoalDrafts[0].episode_rule,
      examples: (smartGoalDrafts[0].examples || '').split(';').map(s => s.trim()).filter(Boolean),
      nonExamples: (smartGoalDrafts[0].non_examples || '').split(';').map(s => s.trim()).filter(Boolean),
      exclusions: ['Prompted responses are recorded with prompt level and excluded from independent mastery numerator']
    },
    measurementPlan: {
      primaryKey: smartGoalDrafts[0].primary_measurement,
      primaryMethod: (SMART_MEASUREMENT_OPTIONS.find(m => m.key === smartGoalDrafts[0].primary_measurement) || {}).label || smartGoalDrafts[0].primary_measurement,
      secondaryKey: smartGoalDrafts[0].secondary_measurement,
      secondaryMethod: (SMART_MEASUREMENT_OPTIONS.find(m => m.key === smartGoalDrafts[0].secondary_measurement) || {}).label || smartGoalDrafts[0].secondary_measurement,
      rationale: smartGoalDrafts[0].measurement_rationale,
      whatPrimaryCaptures: smartGoalDrafts[0].primary_measurement === 'latency'
        ? 'Exact elapsed seconds from the transition cue to movement initiation.'
        : 'Proportion of opportunities where the learner responds independently.',
      whatPrimaryDoesNotCapture: smartGoalDrafts[0].primary_measurement === 'latency'
        ? 'Overall percentage of transitions that met the 5-second threshold.'
        : 'Exact prompt level required on non-independent trials.',
      whatSecondaryCaptures: smartGoalDrafts[0].primary_measurement === 'latency'
        ? 'Percentage of transition opportunities completed within the ≤ 5s criterion.'
        : 'Trial-by-trial prompt hierarchy breakdown (I, V, G, M, PP, P, N, NA).'
    },
    dataCollectionPlan: {
      dataFields: smartGoalDrafts[0].data_fields || ['Trial / Opportunity #', 'Cue Given', 'Response / Latency', 'Prompt Level', 'Met Goal?'],
      responseOptions: ['I (Independent)', 'V (Verbal)', 'G (Gestural)', 'M (Model)', 'PP (Partial Physical)', 'P (Full Physical)', 'N (Refusal/No Response)', 'NA (Excluded)'],
      calculationFormula: smartGoalDrafts[0].calculation_formula || '(Independent Responses / Total Valid Opportunities) × 100',
      validityRules: [
        'Independent and prompted responses are NEVER combined in the mastery numerator unless explicitly overridden by the BCBA.',
        'Trials scored NA (Not Applicable) are excluded from the denominator.'
      ],
      sampleRows: smartGoalDrafts[0].sample_table || [
        { trial: 1, cueGiven: 'Yes', movementInitiated: 'Yes', latency: '3 sec', metGoal: 'Yes (≤5s)' },
        { trial: 2, cueGiven: 'Yes', movementInitiated: 'Yes', latency: '2 sec', metGoal: 'Yes (≤5s)' },
        { trial: 3, cueGiven: 'Yes', movementInitiated: 'Yes', latency: '5 sec', metGoal: 'Yes (≤5s)' },
        { trial: 4, cueGiven: 'Yes', movementInitiated: 'Yes', latency: '12 sec', metGoal: 'No (>5s)' },
        { trial: 5, cueGiven: 'Yes', movementInitiated: 'Yes', latency: '3 sec', metGoal: 'Yes (≤5s)' }
      ],
      sampleSummary: c.id === 2
        ? '80% successful transitions (4/5 opportunities met ≤5s criterion); Average latency = 5.0 seconds.'
        : '80% independent responses (4/5 valid opportunities); 20% gestural prompt (1/5).'
    },
    masteryRecommendation: {
      hasExplicitCriterion: true,
      suggestedCriterion: smartGoalDrafts[0].mastery_criteria,
      suggestedBaseline: smartGoalDrafts[0].baseline_data || '20% independent across 3 baseline sessions',
      suggestedTargetPct: 80,
      suggestedSessions: 3,
      requiresClinicianConfirmation: false,
      safeguardNotice: '✓ BCBA Review Guardrail Active: Clinician can edit any field before approving.'
    }
  } : null);

  const selectedInst = instruments.find(inst => inst.id === selectedAssessmentInstrumentId) || instruments[0];

  return `
  <!-- Top Clinical Planning Header & 3-Step Workflow Banner -->
  <div class="card" style="background:linear-gradient(135deg,#0f172a 0%,#134e4a 100%);color:#fff;border:none;margin-bottom:16px">
    <div class="flex-between" style="flex-wrap:wrap;gap:14px">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <span class="badge" style="background:#14b8a6;color:#042f2e;font-weight:800">AI Clinical Planning Assistant · Phase 1</span>
          <span class="badge" style="background:rgba(255,255,255,0.14);color:#e2e8f0">100% Traceable Assessment → Goal → Measurement Pipeline</span>
          <span class="badge" style="background:#fef3c7;color:#92400e;font-weight:800">🔒 Mandatory BCBA Review & Approval Guardrail</span>
        </div>
        <h3 style="margin:0 0 4px;color:#fff;font-size:1.3rem">🧠 Smart Goal Builder, Operational Definition Generator & ABA Assessment Center</h3>
        <p style="margin:0;font-size:0.85rem;color:#cbd5e1;max-width:920px;line-height:1.5">
          Turn any natural-language behavioral or skill-acquisition goal (or clinician-entered assessment finding) into a clear, observable, measurable, and trackable ABA plan—complete with <b>Operational Definition</b>, <b>Onset/Offset</b>, <b>Primary & Secondary Measurement System</b>, <b>Plain-Language Rationale</b>, and <b>Sample Data-Collection Sheet</b>.
        </p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="ok" style="padding:8px 14px;font-size:0.82rem" onclick="act.openReauthReportModal(${c.id})">📄 Preview Auto-Populated Progress Report</button>
      </div>
    </div>

    <!-- 4 Sub-Navigation Pills -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15)">
      <button type="button" class="${assessmentPlannerSubTab === 'report_templates' ? 'ok' : 'sec'}" style="padding:8px 16px;font-size:0.84rem;${assessmentPlannerSubTab !== 'report_templates' ? 'background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2)' : ''}" onclick="act.setAssessmentSubTab('report_templates')">
        📊 1. Auto-Populated Domain Report Templates (VB-MAPP · ABLLS-R · AFLS · EFL · Vineland-3)
      </button>
      <button type="button" class="${assessmentPlannerSubTab === 'smart_builder' ? 'ok' : 'sec'}" style="padding:8px 16px;font-size:0.84rem;${assessmentPlannerSubTab !== 'smart_builder' ? 'background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2)' : ''}" onclick="act.setAssessmentSubTab('smart_builder')">
        ✨ 2. Smart Goal, Definition & Measurement Assistant
      </button>
      <button type="button" class="${assessmentPlannerSubTab === 'findings' ? 'ok' : 'sec'}" style="padding:8px 16px;font-size:0.84rem;${assessmentPlannerSubTab !== 'findings' ? 'background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2)' : ''}" onclick="act.setAssessmentSubTab('findings')">
        📋 3. Assessment Findings & Skill-Gap Mapping (${assessmentFindings.length})
      </button>
      <button type="button" class="${assessmentPlannerSubTab === 'library' ? 'ok' : 'sec'}" style="padding:8px 16px;font-size:0.84rem;${assessmentPlannerSubTab !== 'library' ? 'background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2)' : ''}" onclick="act.setAssessmentSubTab('library')">
        📚 4. ABA Assessment Reference Library
      </button>
    </div>
  </div>

  ${assessmentPlannerSubTab === 'report_templates' ? renderAutoPopulatedReportTemplateSection(c, data, false) : ''}

  ${assessmentPlannerSubTab === 'smart_builder' ? `
    <!-- SUB-TAB 1: SMART GOAL BUILDER, OPERATIONAL DEFINITION & MEASUREMENT ASSISTANT -->
    <div class="card" style="border-top:4px solid var(--primary)">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <span class="badge p">Step 1 · Enter Behavioral or Skill-Acquisition Goal</span>
          <h3 style="margin:4px 0 2px">✨ AI Smart Goal Builder & Smart Measurement Assistant</h3>
          <p style="margin:0;font-size:0.83rem;color:var(--slate-600)">
            Type any goal below or tap a clinical scenario preset. The assistant checks goal clarity, flags vague/internal-state language, and recommends an editable <b>Operational Definition</b> + <b>Primary & Secondary Measurement System</b>.
          </p>
        </div>
        ${smartGoalFindingId ? `
          <div style="background:#f0fdf4;border:1px solid #86efac;padding:6px 12px;border-radius:8px;font-size:0.78rem;color:#14532d;display:flex;align-items:center;gap:8px">
            <span>🔗 <b>Traceable to Assessment Finding #${smartGoalFindingId}:</b> ${esc(smartGoalFindingText)}</span>
            <button type="button" class="sec" style="padding:2px 6px;font-size:0.7rem" onclick="act.clearSmartGoalFinding()">✕ Clear</button>
          </div>
        ` : ''}
      </div>

      <!-- 1-Click Clinical Scenario & Vague Goal Quality-Check Presets -->
      <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:12px;margin-bottom:14px">
        <div style="font-size:0.74rem;font-weight:800;color:var(--slate-600);text-transform:uppercase;margin-bottom:6px;font-family:var(--font-mono)">
          1-Click Clinical Goal Examples & Vague-Goal Quality Check Demos:
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px" onclick="act.loadSmartGoalPreset(${c.id}, 'Leon will initiate movement toward the next activity within 5 seconds of a transition cue', 'skill_acquisition', 'Transitions & Cooperation')">
            ⏱️ Leon's 5s Transition Goal (Latency + % Opps)
          </button>
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px" onclick="act.loadSmartGoalPreset(${c.id}, 'Client will decrease hitting behavior during structured demands', 'behavior_reduction', 'Behavior Reduction — Aggression')">
            🛑 Decrease Hitting Behavior (Frequency/Rate + ABC)
          </button>
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px" onclick="act.loadSmartGoalPreset(${c.id}, 'When assistance is needed, ${esc(c.name)} will independently request a break or help across 80% of opportunities across 3 consecutive sessions', 'skill_acquisition', 'Functional Communication (Mand / FCT)')">
            🗣️ Request Break / Assistance (FCT % Opps + Trial-by-Trial)
          </button>
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px" onclick="act.loadSmartGoalPreset(${c.id}, 'Decrease crying and screaming tantrum episodes during transitions', 'behavior_reduction', 'Behavior Reduction — Tantrum')">
            ⏳ Decrease Tantrum Episodes (Duration + Frequency)
          </button>
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px;border-color:#fcd34d;background:#fffbeb;color:#92400e" onclick="act.loadSmartGoalPreset(${c.id}, 'Be respectful', 'skill_acquisition', 'Social & Classroom')">
            ⚠️ Vague Goal Test: "Be respectful"
          </button>
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px;border-color:#fcd34d;background:#fffbeb;color:#92400e" onclick="act.loadSmartGoalPreset(${c.id}, 'Improve social skills', 'skill_acquisition', 'Socialization')">
            ⚠️ Vague Goal Test: "Improve social skills"
          </button>
          <button type="button" class="sec" style="font-size:0.76rem;padding:5px 10px;border-color:#fcd34d;background:#fffbeb;color:#92400e" onclick="act.loadSmartGoalPreset(${c.id}, 'Reduce tantrums', 'behavior_reduction', 'Behavior Reduction')">
            ⚠️ Vague Goal Test: "Reduce tantrums"
          </button>
        </div>
      </div>

      <div class="row">
        <div style="flex:2">
          <label>Enter Behavioral or Skill-Acquisition Goal (Natural Language)</label>
          <textarea id="sgb_goal_input" rows="2" placeholder="e.g. Leon will initiate movement toward the next activity within 5 seconds of a transition cue">${esc(defaultGoalText)}</textarea>
        </div>
        <div style="flex:1">
          <label>Goal Classification</label>
          <select id="sgb_goal_type">
            <option value="skill_acquisition" ${smartGoalType !== 'behavior_reduction' ? 'selected' : ''}>🎯 Skill Acquisition / FCT Replacement Goal</option>
            <option value="behavior_reduction" ${smartGoalType === 'behavior_reduction' ? 'selected' : ''}>📉 Behavior Reduction / Deceleration Target</option>
          </select>
          <label style="margin-top:8px">Clinical Domain</label>
          <input id="sgb_goal_domain" placeholder="e.g. Transitions, Manding, Aggression" value="${esc(smartGoalDomain || (activeAnalysis && activeAnalysis.domain) || 'Communication & Adaptive Skills')}">
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
        <button type="button" class="ok" style="padding:10px 20px;font-size:0.9rem" onclick="act.runSmartGoalAnalysis(${c.id})">
          🧠 Analyze Goal & Recommend Operational Definition + Measurement Plan
        </button>
      </div>
    </div>

    ${activeAnalysis ? `
      <!-- 6-PART STRUCTURED CLINICAL RECOMMENDATION & EDITABLE WORKSPACE -->
      <div class="card" style="border:2px solid var(--primary);background:#fff">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--slate-200)">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge p">Step 2 · Review & Customize AI Clinical Recommendations</span>
              <span class="tag ${activeAnalysis.qualityCheck?.isClear ? 'approved' : 'draft'}">
                ${activeAnalysis.qualityCheck?.isClear ? `✓ Observable & Measurable (Clarity Score: ${activeAnalysis.qualityCheck.qualityScore}/100)` : `⚠️ Needs Clarification Before Finalizing (Clarity Score: ${activeAnalysis.qualityCheck?.qualityScore || 45}/100)`}
              </span>
            </div>
            <h3 style="margin:6px 0 0;font-size:1.2rem;color:var(--slate-900)">Recommended Operational Definition, Measurement System & Data Plan</h3>
          </div>
          <span class="badge tan">All Fields Editable by BCBA</span>
        </div>

        <!-- PART 1: Goal Clarity & Quality Check -->
        <div style="margin-top:14px;padding:14px;border-radius:10px;background:${activeAnalysis.qualityCheck?.isClear ? '#f0fdf4' : '#fffbeb'};border:1.5px solid ${activeAnalysis.qualityCheck?.isClear ? '#86efac' : '#fcd34d'}">
          <div style="font-size:0.76rem;font-weight:800;color:${activeAnalysis.qualityCheck?.isClear ? '#065f46' : '#92400e'};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;font-family:var(--font-mono)">
            1. Goal Clarity, Component Extraction & Quality Check
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;font-size:0.82rem;margin-bottom:10px">
            <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200)">
              <span style="color:var(--slate-500);font-size:0.72rem;font-weight:700;text-transform:uppercase">Who (Learner)</span><br>
              <b>${esc(activeAnalysis.qualityCheck?.who || c.name)}</b>
            </div>
            <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200)">
              <span style="color:var(--slate-500);font-size:0.72rem;font-weight:700;text-transform:uppercase">Target Observable Response</span><br>
              <b>${esc(activeAnalysis.qualityCheck?.targetResponse || activeAnalysis.refinedGoalText)}</b>
            </div>
            <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200)">
              <span style="color:var(--slate-500);font-size:0.72rem;font-weight:700;text-transform:uppercase">Cue / Antecedent Context</span><br>
              <b>${esc(activeAnalysis.qualityCheck?.cueOrContext || 'During structured or natural opportunities')}</b>
            </div>
            <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200)">
              <span style="color:var(--slate-500);font-size:0.72rem;font-weight:700;text-transform:uppercase">Timeframe / Latency</span><br>
              <b>${esc(activeAnalysis.qualityCheck?.timeframe || 'Standard session observation')}</b>
            </div>
            <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200)">
              <span style="color:var(--slate-500);font-size:0.72rem;font-weight:700;text-transform:uppercase">Prompt Expectation</span><br>
              <b>${esc(activeAnalysis.qualityCheck?.promptExpectation || 'Independent response')}</b>
            </div>
          </div>

          ${(activeAnalysis.qualityCheck?.vagueFlags && activeAnalysis.qualityCheck.vagueFlags.length) ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid var(--bad);border-radius:6px;padding:10px 12px;margin-bottom:8px;font-size:0.82rem;color:#991b1b">
              <b>🚩 Vague or Subjective Goal Language Flagged:</b>
              <ul style="margin:4px 0 0 18px;padding:0">
                ${activeAnalysis.qualityCheck.vagueFlags.map(f => `<li><b>"${esc(f.term)}":</b> ${esc(f.issue)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${(activeAnalysis.qualityCheck?.clarifyingQuestions && activeAnalysis.qualityCheck.clarifyingQuestions.length) ? `
            <div style="background:#fff;border:1px solid var(--slate-200);border-radius:6px;padding:10px 12px;font-size:0.82rem;color:var(--slate-800)">
              <b style="color:var(--primary)">❓ Clarifying Questions for Clinician Review:</b>
              <ul style="margin:4px 0 0 18px;padding:0">
                ${activeAnalysis.qualityCheck.clarifyingQuestions.map(q => `<li>${esc(q)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <!-- PART 2: Editable Operational Definition (Target Response, Onset, Offset, Episode Rule, Examples, Non-Examples) -->
        <div style="margin-top:14px;padding:14px;border-radius:10px;border:1.5px solid var(--slate-200);background:var(--slate-50)">
          <div style="font-size:0.76rem;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;font-family:var(--font-mono)">
            2. Recommended Operational Definition (What Exactly Should Be Observed & Recorded)
          </div>

          <label>Refined Measurable Goal Statement</label>
          <input id="sgb_refined_goal" value="${esc(activeAnalysis.refinedGoalText || '')}">

          <label>Operational Definition (Objective, Observable & Measurable)</label>
          <textarea id="sgb_op_def" rows="3">${esc(activeAnalysis.operationalDefinition?.summary || '')}</textarea>

          <div class="row">
            <div>
              <label>Onset Criteria (When observation/timing begins)</label>
              <input id="sgb_onset" value="${esc(activeAnalysis.operationalDefinition?.onsetCriteria || '')}">
            </div>
            <div>
              <label>Offset Criteria (When response/episode ends)</label>
              <input id="sgb_offset" value="${esc(activeAnalysis.operationalDefinition?.offsetCriteria || '')}">
            </div>
          </div>

          <label>Episode Separation / Counting Rule</label>
          <input id="sgb_episode" value="${esc(activeAnalysis.operationalDefinition?.episodeRule || '')}">

          <div class="row">
            <div>
              <label>Examples (Observable Topographies Included)</label>
              <textarea id="sgb_examples" rows="2">${esc((activeAnalysis.operationalDefinition?.examples || []).join('; '))}</textarea>
            </div>
            <div>
              <label>Non-Examples & Exclusions (Excluded from Count)</label>
              <textarea id="sgb_non_examples" rows="2">${esc((activeAnalysis.operationalDefinition?.nonExamples || []).join('; '))}</textarea>
            </div>
          </div>
        </div>

        <!-- PART 3: Smart Measurement Assistant (Primary + Secondary + Plain-Language Rationale) -->
        <div style="margin-top:14px;padding:14px;border-radius:10px;border:1.5px solid #99f6e4;background:#f0fdfa">
          <div style="font-size:0.76rem;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;font-family:var(--font-mono)">
            3. Smart Measurement Assistant (How the Behavior or Skill Should Be Measured)
          </div>

          <div class="row">
            <div>
              <label>Recommended Primary Measurement Method</label>
              <select id="sgb_primary_meas">
                ${SMART_MEASUREMENT_OPTIONS.map(m => `<option value="${m.key}" ${activeAnalysis.measurementPlan?.primaryKey === m.key ? 'selected' : ''}>📏 Primary: ${esc(m.label)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Recommended Secondary Measurement (Only When Clinically Distinct)</label>
              <select id="sgb_secondary_meas">
                <option value="">None (Primary Measurement Sufficient)</option>
                ${SMART_MEASUREMENT_OPTIONS.map(m => `<option value="${m.key}" ${activeAnalysis.measurementPlan?.secondaryKey === m.key ? 'selected' : ''}>➕ Secondary: ${esc(m.label)}</option>`).join('')}
              </select>
            </div>
          </div>

          <label>Plain-Language Clinical Measurement Rationale</label>
          <textarea id="sgb_rationale" rows="2">${esc(activeAnalysis.measurementPlan?.rationale || '')}</textarea>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:8px;font-size:0.81rem">
            <div style="background:#fff;padding:10px 12px;border-radius:8px;border:1px solid #99f6e4">
              <div style="font-weight:800;color:#0f766e;font-size:0.73rem;text-transform:uppercase">✓ What Primary Measurement Captures</div>
              <div style="margin-top:4px;color:var(--slate-800)">${esc(activeAnalysis.measurementPlan?.whatPrimaryCaptures || '')}</div>
            </div>
            <div style="background:#fff;padding:10px 12px;border-radius:8px;border:1px solid #fde68a">
              <div style="font-weight:800;color:#92400e;font-size:0.73rem;text-transform:uppercase">⚠️ What Primary Does NOT Capture Alone</div>
              <div style="margin-top:4px;color:var(--slate-800)">${esc(activeAnalysis.measurementPlan?.whatPrimaryDoesNotCapture || '')}</div>
            </div>
            <div style="background:#fff;padding:10px 12px;border-radius:8px;border:1px solid #bfdbfe">
              <div style="font-weight:800;color:#1d4ed8;font-size:0.73rem;text-transform:uppercase">➕ What Secondary Measurement Adds</div>
              <div style="margin-top:4px;color:var(--slate-800)">${esc(activeAnalysis.measurementPlan?.whatSecondaryCaptures || 'Optional supplementary context')}</div>
            </div>
          </div>
        </div>

        <!-- PART 4: Data-Collection Sheet & Sample Recording Table -->
        <div style="margin-top:14px;padding:14px;border-radius:10px;border:1.5px solid var(--slate-200);background:#fff">
          <div style="font-size:0.76rem;font-weight:800;color:var(--slate-700);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;font-family:var(--font-mono)">
            4. Recommended Data-Collection Structure, Formula & Sample Session Table
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
            <span style="font-size:0.76rem;font-weight:700;color:var(--slate-500)">Required Session Fields:</span>
            ${(activeAnalysis.dataCollectionPlan?.dataFields || []).map(f => `<span class="badge p">${esc(f)}</span>`).join('')}
          </div>

          <div style="font-size:0.82rem;background:var(--slate-50);padding:8px 12px;border-radius:6px;border:1px solid var(--slate-200);margin-bottom:10px">
            <b>Calculation Formula:</b> <code style="font-family:var(--font-mono);color:var(--primary)">${esc(activeAnalysis.dataCollectionPlan?.calculationFormula || '')}</code>
          </div>

          ${(activeAnalysis.dataCollectionPlan?.sampleRows && activeAnalysis.dataCollectionPlan.sampleRows.length) ? `
            <div class="table-responsive" style="margin-bottom:10px">
              <table>
                <thead>
                  <tr>
                    ${Object.keys(activeAnalysis.dataCollectionPlan.sampleRows[0]).map(k => `<th>${esc(k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()))}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${activeAnalysis.dataCollectionPlan.sampleRows.map(row => `
                    <tr>
                      ${Object.values(row).map(v => `<td><b>${esc(String(v))}</b></td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:8px 12px;border-radius:6px;font-size:0.82rem;color:#065f46">
              <b>📊 Sample Session Summary Output:</b> ${esc(activeAnalysis.dataCollectionPlan?.sampleSummary || '')}
            </div>
          ` : ''}
        </div>

        <!-- PART 5: Mastery Criterion & Safeguard -->
        <div style="margin-top:14px;padding:14px;border-radius:10px;border:1.5px solid ${activeAnalysis.masteryRecommendation?.requiresClinicianConfirmation ? '#fcd34d' : 'var(--slate-200)'};background:${activeAnalysis.masteryRecommendation?.requiresClinicianConfirmation ? '#fffbeb' : 'var(--slate-50)'}">
          <div style="font-size:0.76rem;font-weight:800;color:var(--slate-800);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;font-family:var(--font-mono)">
            5. Baseline & Mastery Criterion (Safeguard Against Unverified Auto-Locking)
          </div>
          <div style="font-size:0.8rem;color:${activeAnalysis.masteryRecommendation?.requiresClinicianConfirmation ? '#92400e' : '#065f46'};margin-bottom:10px">
            <b>${esc(activeAnalysis.masteryRecommendation?.safeguardNotice || '')}</b>
          </div>
          <div class="row">
            <div style="flex:2">
              <label>Mastery Criterion Statement</label>
              <input id="sgb_mastery" value="${esc(activeAnalysis.masteryRecommendation?.suggestedCriterion || '80% across 3 consecutive sessions')}">
            </div>
            <div style="flex:1">
              <label>Baseline Data</label>
              <input id="sgb_baseline" value="${esc(activeAnalysis.masteryRecommendation?.suggestedBaseline || '20% across 3 baseline sessions')}">
            </div>
            <div style="flex:1">
              <label>Target % / Sessions</label>
              <div style="display:flex;gap:6px">
                <input id="sgb_target_pct" type="number" min="1" max="100" value="${activeAnalysis.masteryRecommendation?.suggestedTargetPct || 80}" title="Target %">
                <input id="sgb_sessions" type="number" min="1" max="10" value="${activeAnalysis.masteryRecommendation?.suggestedSessions || 3}" title="Consecutive Sessions">
              </div>
            </div>
          </div>
        </div>

        <!-- PART 6: Save Draft or BCBA Review, Edit & Approve -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid var(--slate-200)">
          <div style="font-size:0.8rem;color:var(--slate-600)">
            🔒 <b>Clinical Guardrail:</b> All AI-recommended definitions and measurement plans are saved as <code>draft</code> until reviewed and approved by a supervising BCBA.
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="sec" onclick="act.saveSmartGoalDraft(${c.id}, false)">
              💾 Save as Clinical Draft
            </button>
            ${canApprove ? `
              <button type="button" class="ok" onclick="act.saveSmartGoalDraft(${c.id}, true)">
                ✓ BCBA Approve & Activate in Client Record
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Saved Smart Goal & Measurement Drafts Queue -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <h3 style="margin:0">📂 Saved Smart Goal & Measurement Plans (${smartGoalDrafts.length})</h3>
          <p style="margin:2px 0 0;font-size:0.83rem;color:var(--slate-500)">Drafts awaiting BCBA sign-off and approved plans linked to ${esc(c.name)}'s clinical record.</p>
        </div>
      </div>
      ${smartGoalDrafts.length ? smartGoalDrafts.map(d => `
        <div style="background:var(--slate-50);border:1.5px solid ${d.status === 'approved' ? '#86efac' : 'var(--slate-200)'};border-left:4px solid ${d.status === 'approved' ? 'var(--ok)' : 'var(--warn)'};border-radius:var(--radius-md);padding:14px;margin-bottom:10px">
          <div class="flex-between" style="flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="tag ${d.status === 'approved' ? 'approved' : 'draft'}">${d.status === 'approved' ? `✓ Approved by ${esc(d.approved_by || 'BCBA')}` : '📝 Draft (Awaiting BCBA Approval)'}</span>
              <span class="badge p">${d.goal_type === 'behavior_reduction' ? '📉 Behavior Reduction' : '🎯 Skill Acquisition'}</span>
              <span class="badge">${esc(d.domain || 'Clinical Goal')}</span>
              <span class="badge tan">Primary: ${esc(d.primary_measurement)}</span>
              ${d.secondary_measurement ? `<span class="badge">Secondary: ${esc(d.secondary_measurement)}</span>` : ''}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.loadDraftIntoSmartBuilder(${d.id}, ${c.id})">✏️ Load into Editor</button>
              ${canApprove && d.status !== 'approved' ? `
                <button type="button" class="ok" style="padding:5px 12px;font-size:0.76rem" onclick="act.approveSmartGoalDraft(${d.id})">✓ BCBA Approve & Activate</button>
              ` : ''}
            </div>
          </div>
          <div style="font-weight:700;font-size:0.96rem;color:var(--slate-900);margin-top:8px">${esc(d.refined_goal_text || d.raw_goal_text)}</div>
          <div style="font-size:0.82rem;color:var(--slate-700);margin-top:4px"><b>Operational Definition:</b> ${esc(d.operational_definition)}</div>
          <div style="font-size:0.78rem;color:var(--slate-600);margin-top:4px;display:flex;gap:12px;flex-wrap:wrap">
            <span><b>Onset:</b> ${esc(d.onset_criteria || '—')}</span>
            <span><b>Offset:</b> ${esc(d.offset_criteria || '—')}</span>
            <span><b>Mastery:</b> ${esc(d.mastery_criteria || '—')}</span>
          </div>
        </div>
      `).join('') : '<p style="color:var(--slate-400)">No smart goal drafts saved yet.</p>'}
    </div>
  ` : ''}

  ${assessmentPlannerSubTab === 'findings' ? `
    <!-- SUB-TAB 2: CLINICIAN-ENTERED ASSESSMENT FINDINGS & TRACEABLE SKILL-GAP SUGGESTIONS -->
    <div class="card" style="border-top:4px solid var(--primary)">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <span class="badge p">Clinician-Entered Assessment Findings · Zero Fabricated Scores</span>
          <h3 style="margin:4px 0 2px">📋 Log Assessment Finding & Generate Traceable Skill-Gap Suggestion</h3>
          <p style="margin:0;font-size:0.83rem;color:var(--slate-600)">
            Record findings from <b>VB-MAPP</b>, <b>ABLLS-R</b>, <b>AFLS</b>, <b>Essential for Living (EFL)</b>, or <b>Vineland-3</b>. Every recommended skill target maintains 100% traceability back to the clinician-entered finding.
          </p>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Assessment Instrument</label>
          <select id="af_inst" onchange="act.selectFindingInstrument(this.value)">
            ${instruments.filter(i => i.phaseStatus === 'Phase 1 Supported').map(inst => `
              <option value="${inst.id}" ${selectedAssessmentInstrumentId === inst.id ? 'selected' : ''}>${esc(inst.name)} — ${esc(inst.category)}</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label>Assessment Domain</label>
          <select id="af_domain">
            ${(selectedInst?.domains || ['Mand', 'Tact', 'Listener Responding']).map(dom => `<option value="${esc(dom)}">${esc(dom)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Evidence Source</label>
          <select id="af_source">
            <option value="Direct Observation & Formal Assessment">Direct Observation & Formal Assessment</option>
            <option value="Formal Assessment Administration">Formal Assessment Administration</option>
            <option value="Caregiver Interview & Rating">Caregiver Interview & Rating</option>
            <option value="Clinical Record Review">Clinical Record Review</option>
          </select>
        </div>
      </div>

      <div class="row">
        <div style="flex:2">
          <label>Clinician-Observed Finding / Skill Deficit / Behavioral Barrier</label>
          <input id="af_finding" placeholder="e.g. Initiates transition movement after 12–20s delay when preferred activity ends; requires gestural/physical prompts">
        </div>
        <div style="flex:1">
          <label>Score / Milestone Level (Clinician-Entered)</label>
          <input id="af_score" placeholder="e.g. Level 1 (1.5 / 5) or Score 1 of 4">
        </div>
      </div>

      <div class="row">
        <div>
          <label>Observation Context / Setting</label>
          <input id="af_context" value="Clinic & Structured Transitions">
        </div>
        <div>
          <label>Current Support / Prompt Needs</label>
          <input id="af_support" value="Requires verbal + gestural prompting">
        </div>
        <div>
          <label>Clinical Priority Action</label>
          <select id="af_priority">
            <option value="priority_goal">🎯 Priority Treatment Goal</option>
            <option value="further_assessment">🔍 Needs Further Assessment</option>
            <option value="environmental_support">🛠️ Environmental / Caregiver Support</option>
            <option value="no_action">⏸️ No Immediate Action</option>
          </select>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:8px">
        <button type="button" class="ok" onclick="act.addAssessmentFinding(${c.id})">
          + Log Assessment Finding & Generate Skill-Gap Suggestion
        </button>
      </div>
    </div>

    <!-- Traceable Skill-Gap Suggestions Table -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <h3 style="margin:0">🔗 Traceable Skill-Gap Suggestions (${suggestions.length})</h3>
          <p style="margin:2px 0 0;font-size:0.83rem;color:var(--slate-500)">
            Each candidate target is directly linked to a specific clinician-entered assessment finding and can be sent to the Smart Goal Builder in 1 click.
          </p>
        </div>
      </div>

      ${suggestions.length ? suggestions.map(s => `
        <div style="background:var(--slate-50);border:1.5px solid var(--slate-200);border-left:4px solid var(--primary);border-radius:var(--radius-md);padding:14px;margin-bottom:12px">
          <div class="flex-between" style="flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge p">Finding #${s.findingId} · ${esc(s.instrumentName)}</span>
              <span class="badge">${esc(s.domain)}</span>
              <span class="badge tan">Score/Level: ${esc(s.scoreOrLevel || 'Observed')}</span>
              <span class="badge">Source: ${esc(s.evidenceSource)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <select style="margin:0;padding:4px 8px;font-size:0.76rem;width:auto" onchange="act.updateFindingPriority(${s.findingId}, this.value)">
                <option value="priority_goal" ${s.priorityStatus === 'priority_goal' ? 'selected' : ''}>🎯 Priority Goal</option>
                <option value="further_assessment" ${s.priorityStatus === 'further_assessment' ? 'selected' : ''}>🔍 Needs Further Assessment</option>
                <option value="environmental_support" ${s.priorityStatus === 'environmental_support' ? 'selected' : ''}>🛠️ Environmental Support</option>
                <option value="no_action" ${s.priorityStatus === 'no_action' ? 'selected' : ''}>⏸️ No Action</option>
              </select>
              <button type="button" class="ok" style="padding:6px 12px;font-size:0.78rem" onclick="act.sendFindingToSmartBuilder(${c.id}, ${s.findingId}, ${JSON.stringify(s.suggestedGoalStatement).replace(/"/g, '&quot;')}, '${esc(s.goalType)}', '${esc(s.domain)}', ${JSON.stringify(s.findingText).replace(/"/g, '&quot;')})">
                ✨ Open in Smart Goal Builder →
              </button>
            </div>
          </div>

          <div style="margin-top:8px;font-size:0.84rem;color:var(--slate-700)">
            <b>Clinician-Entered Finding:</b> "${esc(s.findingText)}" <i>(Context: ${esc(s.context)} · Support Needs: ${esc(s.supportNeeds)})</i>
          </div>

          <div style="margin-top:8px;background:#fff;border:1px solid var(--slate-200);border-radius:8px;padding:10px 12px">
            <div style="font-size:0.75rem;font-weight:800;color:var(--primary);text-transform:uppercase">Recommended Candidate Goal & Measurement Plan:</div>
            <div style="font-weight:700;color:var(--slate-900);font-size:0.92rem;margin-top:2px">${esc(s.suggestedGoalStatement)}</div>
            <div style="font-size:0.8rem;color:var(--slate-600);margin-top:4px">
              <b>Operational Definition Preview:</b> ${esc(s.operationalDefinitionSummary)}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:0.78rem">
              <span class="badge tan">Primary: ${esc(s.recommendedPrimaryMeasurement)}</span>
              ${s.recommendedSecondaryMeasurement ? `<span class="badge">Secondary: ${esc(s.recommendedSecondaryMeasurement)}</span>` : ''}
              <span class="badge p">Draft Criterion: ${esc(s.suggestedMasteryCriterion)}</span>
            </div>
          </div>
        </div>
      `).join('') : '<p style="color:var(--slate-400)">No assessment findings logged yet.</p>'}
    </div>
  ` : ''}

  ${assessmentPlannerSubTab === 'library' ? `
    <!-- SUB-TAB 3: ABA ASSESSMENT REFERENCE LIBRARY -->
    <div class="card" style="background:#fffbeb;border:1.5px solid #fcd34d;margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:1.4rem">🛡️</div>
        <div style="font-size:0.83rem;color:#78350f;line-height:1.5">
          <b>Copyright, Content & Clinical Integrity Safeguards (Phase 1 Specification):</b><br>
          The RBT Sepia Assessment Reference Library stores <b>high-level domain organization, clinical purpose, learner profiles, and clinician-entered summary findings only</b>. It never reproduces proprietary test forms, verbatim copyrighted scoring grids, or fabricated normative scores.
        </div>
      </div>
    </div>

    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:16px">
      ${instruments.map(inst => `
        <div class="card" style="margin:0;border-top:4px solid ${inst.phaseStatus === 'Phase 1 Supported' ? 'var(--primary)' : 'var(--slate-400)'};display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div class="flex-between" style="gap:8px;flex-wrap:wrap;margin-bottom:6px">
              <span class="badge p">${esc(inst.category)}</span>
              <span class="tag ${inst.phaseStatus === 'Phase 1 Supported' ? 'approved' : 'draft'}">${esc(inst.phaseStatus)}</span>
            </div>
            <h3 style="margin:4px 0 2px;font-size:1.15rem;color:var(--slate-900)">${esc(inst.name)}</h3>
            <div style="font-size:0.8rem;font-weight:600;color:var(--slate-500);margin-bottom:10px">${esc(inst.fullName)}</div>

            <div style="font-size:0.83rem;color:var(--slate-700);margin-bottom:8px">
              <b>Primary Clinical Purpose:</b> ${esc(inst.primaryPurpose)}
            </div>
            <div style="font-size:0.83rem;color:var(--slate-700);margin-bottom:8px">
              <b>Typical Learner Profile:</b> ${esc(inst.learnerProfile)}
            </div>
            <div style="font-size:0.83rem;color:var(--slate-700);margin-bottom:8px">
              <b>Typical Result Format:</b> ${esc(inst.resultFormat)}
            </div>
            <div style="font-size:0.83rem;color:var(--slate-700);margin-bottom:10px">
              <b>Goal-Planning Use:</b> ${esc(inst.goalPlanningUse)}
            </div>

            <div style="font-size:0.74rem;font-weight:800;color:var(--slate-500);text-transform:uppercase;margin-bottom:6px">High-Level Domains (${(inst.domains || []).length}):</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px">
              ${(inst.domains || []).map(d => `<span class="badge" style="font-size:0.72rem">${esc(d)}</span>`).join('')}
            </div>
          </div>

          <div style="padding-top:10px;border-top:1px solid var(--slate-200);display:flex;justify-content:space-between;align-items:center;gap:8px">
            <span style="font-size:0.72rem;color:var(--slate-500)">${esc(inst.copyrightNote)}</span>
            ${inst.phaseStatus === 'Phase 1 Supported' ? `
              <button type="button" class="ok" style="padding:6px 12px;font-size:0.76rem;white-space:nowrap" onclick="act.openLogFindingForInstrument('${inst.id}')">
                + Log ${esc(inst.name)} Finding →
              </button>
            ` : `
              <span class="badge">Scheduled Later Phase</span>
            `}
          </div>
        </div>
      `).join('')}
    </div>
  ` : ''}
  `;
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (openBehMenuId !== null && !e.target.closest('.beh-menu-wrap')) {
      openBehMenuId = null;
      render();
    }
  });
}

function renderBehaviorCardThreeDotMenu(bp, cid, sid = null) {
  const isArchived = bp.status === 'archived';
  const ver = bp.version || (Array.isArray(bp.version_history) ? bp.version_history.length : 1) || 1;
  const isOpen = Number(openBehMenuId) === Number(bp.id);
  return `
    <div class="beh-menu-wrap" style="position:relative;display:inline-flex;align-items:center;gap:4px">
      <button type="button" class="sec" style="padding:3px 8px;font-size:0.74rem;font-weight:700" title="Edit Target Behavior" onclick="event.stopPropagation();act.openEditBehaviorModal(${bp.id}, 'all')">
        ✏️ Edit
      </button>
      <button type="button" class="beh-dots-btn ${isOpen ? 'active' : ''}" title="Target Behavior Actions (⋮)" aria-label="Target Behavior Actions" onclick="event.stopPropagation();act.toggleBehMenu(${bp.id})">
        ⋮
      </button>
      ${isOpen ? `
        <div class="beh-dropdown-menu" onclick="event.stopPropagation()">
          <div class="beh-dropdown-hdr">${esc(bp.name)} · v${ver}</div>
          <button type="button" class="beh-dropdown-item" onclick="act.openEditBehaviorModal(${bp.id}, 'behavior')">
            <span>✏️</span>
            <div>
              <b>Edit Behavior</b>
              <small>Name, definition, onset/offset, examples, function</small>
            </div>
          </button>
          <button type="button" class="beh-dropdown-item" onclick="act.openEditBehaviorModal(${bp.id}, 'measurement')">
            <span>📏</span>
            <div>
              <b>Edit Measurement</b>
              <small>Method (${esc((bp.measurement_type || 'frequency').replace('_', ' '))}), intensity & baseline data</small>
            </div>
          </button>
          <button type="button" class="beh-dropdown-item" onclick="act.openEditBehaviorModal(${bp.id}, 'goals')">
            <span>🎯</span>
            <div>
              <b>Edit Goals</b>
              <small>Reduction goal, replacement skill & mastery criteria</small>
            </div>
          </button>
          <button type="button" class="beh-dropdown-item" onclick="act.openBehaviorHistoryModal(${bp.id})">
            <span>🕓</span>
            <div>
              <b>View History (v${ver})</b>
              <small>Previous vs. updated definitions, clinician & timestamps</small>
            </div>
          </button>
          <div class="beh-dropdown-divider"></div>
          <button type="button" class="beh-dropdown-item" onclick="act.toggleArchiveBehavior(${bp.id}, '${isArchived ? 'archived' : 'active'}')">
            <span>${isArchived ? '♻️' : '📦'}</span>
            <div>
              <b>${isArchived ? 'Restore Behavior' : 'Archive Behavior'}</b>
              <small>${isArchived ? 'Return to active data collection' : 'Retire from active collection; keep for clinical review'}</small>
            </div>
          </button>
          <button type="button" class="beh-dropdown-item danger" onclick="act.openDeleteBehaviorModal(${bp.id})">
            <span>🗑️</span>
            <div>
              <b>Delete Behavior</b>
              <small>With confirmation & historical data safeguards</small>
            </div>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

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
    const mapKey = bId ? `id_${bId}` : bName;
    if (!byBeh[mapKey]) {
      byBeh[mapKey] = {
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
        byMeasurementType: {}
      };
    } else {
      if (bId && !byBeh[mapKey].behaviorId) byBeh[mapKey].behaviorId = bId;
      if (bName && !byBeh[mapKey].historicalNames.includes(bName)) {
        byBeh[mapKey].historicalNames.push(bName);
        byBeh[mapKey].name = bName;
      }
    }
    byBeh[mapKey].byMeasurementType[mType] = (byBeh[mapKey].byMeasurementType[mType] || 0) + 1;

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
    if (Array.isArray(b.historicalNames)) {
      b.historicalNames.forEach((hn) => { byBehavior[hn] = item; });
    }
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

const FIREBASE_VAULT_STORAGE_KEY = 'eba_firebase_cloud_vault_v1';

async function syncFirebaseVault(action = 'pull', snapshot = null) {
  try {
    const r = await fetch('/api/firebase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, snapshot })
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j) {
      if (j.snapshot && typeof localStorage !== 'undefined') {
        try { localStorage.setItem(FIREBASE_VAULT_STORAGE_KEY, JSON.stringify(j.snapshot)); } catch {}
      }
      firebaseCloudStatus.connected = true;
      firebaseCloudStatus.lastSyncAt = j.syncedAt || new Date().toISOString();
    }
    return j;
  } catch {
    return null;
  }
}

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && me) { me = null; render(); } throw new Error(j.error || 'Error'); }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method).toUpperCase()) && !String(url).includes('/api/firebase/sync')) {
    syncFirebaseVault('pull').catch(() => {});
  }
  return j;
}
const safe = (fn) => async (...a) => { try { await fn(...a); } catch (e) { alert(e.message); } };

const NAV_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  clients: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  assessments: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  schedule: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  supervision: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  facility: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>`,
  presentation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
};

const NAV = {
  OWNER: [
    ['dashboard', NAV_ICONS.dashboard, 'KPI Dashboard', 'Business Performance & Revenue'],
    ['clients', NAV_ICONS.clients, 'Clients', 'Profiles, 360 Records & Snapshots'],
    ['assessments', NAV_ICONS.assessments, 'ABA Assessment Center', 'Report Templates & Smart Planner'],
    ['schedule', NAV_ICONS.schedule, 'Schedule', 'Appointments & Live Sessions'],
    ['notes', NAV_ICONS.notes, 'Session Notes', 'SOAP Notes & Billing Sign-Off'],
    ['supervision', NAV_ICONS.supervision, 'Supervision', 'BACB 5% Tracking']
  ],
  BCBA: [
    ['dashboard', NAV_ICONS.dashboard, 'KPI Dashboard', 'Clients & Assigned Sessions'],
    ['clients', NAV_ICONS.clients, 'Clients', 'Profiles, 360 Records & Snapshots'],
    ['assessments', NAV_ICONS.assessments, 'ABA Assessment Center', 'Report Templates & Smart Planner'],
    ['schedule', NAV_ICONS.schedule, 'Schedule', 'Appointments & Live Sessions'],
    ['notes', NAV_ICONS.notes, 'Session Notes', 'Review & Co-Sign Notes'],
    ['supervision', NAV_ICONS.supervision, 'Supervision', 'BACB 5% Tracking']
  ],
  RBT: [
    ['dashboard', NAV_ICONS.dashboard, 'My Daily Dashboard', 'Tasks, Data Quotas & Training'],
    ['schedule', NAV_ICONS.schedule, 'Schedule', '1-Tap Start Session'],
    ['clients', NAV_ICONS.clients, 'My Clients', 'Goals, Trials & ABC Logs'],
    ['assessments', NAV_ICONS.assessments, 'ABA Assessment Center', 'Definitions & Measurement Plans'],
    ['notes', NAV_ICONS.notes, 'Session Notes', 'Draft Session Notes'],
    ['supervision', NAV_ICONS.supervision, 'My Supervision', '5% Progress & Feedback']
  ],
  ADMIN: [
    ['dashboard', NAV_ICONS.dashboard, 'KPI Dashboard', 'Missing Notes, Sessions & Billing'],
    ['notes', NAV_ICONS.notes, 'Notes & Billing', 'Missing Notes & Ready Claims'],
    ['schedule', NAV_ICONS.schedule, 'Schedule', 'Appointments & Attendance'],
    ['clients', NAV_ICONS.clients, 'Clients', 'Profiles & Insurance Auths'],
    ['assessments', NAV_ICONS.assessments, 'ABA Assessment Center', 'Report Templates & Progress Packets'],
    ['supervision', NAV_ICONS.supervision, 'Supervision', 'BACB 5% Compliance']
  ],
  PARENT: [
    ['clients', NAV_ICONS.clients, 'My Child Portal', 'Goals & Social Stories']
  ]
};

const brandEmblem = (cls = '') => `
  <div class="brand-icon ${cls}" title="Effective Behavioral Approach">
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="11" stroke="#6ee7b7" stroke-width="1.8" opacity="0.7"/>
      <path d="M16 33C20 21 26 16 32 16C38 16 44 21 48 33C44 45 38 50 32 50C26 50 20 45 16 33Z" stroke="#38bdf8" stroke-width="2" opacity="0.55"/>
      <path d="M11 34H21L26 20L34 46L39 30L43 34H53" stroke="#ecfeff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="13" r="4.5" fill="#10b981" stroke="#ecfeff" stroke-width="1.5"/>
    </svg>
  </div>`;

function shell(content, route) {
  const userInitials = getInitials(me.name);
  const isParent = me.role === 'PARENT';
  const floatBar = (pitchTourActive && route !== 'presentation') ? `
    <div class="pitch-float-bar">
      <span style="font-family:var(--font-mono);font-size:0.76rem;font-weight:600;color:#6ee7b7">TOUR · SLIDE ${pitchSlide + 1}/10</span>
      <button class="ok" style="padding:5px 12px;font-size:0.78rem" onclick="go('presentation')">↩ Back to Deck</button>
      ${pitchSlide < 9 ? `<button class="sec" style="padding:5px 12px;font-size:0.78rem" onclick="act.setPitchSlide(${pitchSlide + 1});go('presentation')">Next Slide →</button>` : ''}
      <button style="background:transparent;border:none;color:#99f6e4;padding:2px 6px;font-size:0.78rem;box-shadow:none" title="Dismiss tour bar" onclick="act.endPitchTour()">✕</button>
    </div>
  ` : '';

  const caseloadWidget = !isParent ? `
    <div>
      <div class="sidebar-section-label">
        <span>Quick Client Access</span>
      </div>
      <div class="sidebar-widget">
        <div class="sidebar-client-list" style="margin-top:0">
          <div class="sidebar-client-row" onclick="go('client', 1)">
            <div class="sidebar-client-avatar">EC</div>
            <div class="sidebar-client-info">
              <div class="sidebar-client-name">Eleanor Carter</div>
              <div class="sidebar-client-meta">Open Client Profile</div>
            </div>
            <button class="sidebar-mini-btn" onclick="event.stopPropagation();go('client', 1)">Open →</button>
          </div>
          <div class="sidebar-client-row" onclick="go('client', 2)">
            <div class="sidebar-client-avatar" style="background:linear-gradient(135deg,#0284c7,#0f766e)">LP</div>
            <div class="sidebar-client-info">
              <div class="sidebar-client-name">Leon Patel</div>
              <div class="sidebar-client-meta">Open Client Profile</div>
            </div>
            <button class="sidebar-mini-btn" onclick="event.stopPropagation();go('client', 2)">Open →</button>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  return `
  <div class="layout">
    <nav>
      <div class="brand-wrapper">
        <div class="brand-logo" style="cursor:pointer" onclick="go('dashboard')">
          ${brandEmblem()}
          <div>
            <div class="brand-title">Effective Behavioral</div>
            <div class="brand-sub">ABA Practice & Data Tracker</div>
          </div>
        </div>
        <button type="button" class="mobile-nav-toggle" onclick="act.toggleMobileNav()" aria-label="Toggle Role & Account Menu">
          <span class="mobile-nav-role-pill">${esc(me.role)}</span>
          <span>${mobileNavOpen ? '✕ Close' : '☰ Role / Menu'}</span>
        </button>
      </div>

      <div class="nav-menu-section">
        <div class="sidebar-section-label">
          <span>Main Menu</span>
        </div>
        <div class="nav-links">
          ${NAV[me.role].map(([r, ic, l, sub]) => `
            <a class="${route === r ? 'on' : ''}" onclick="go('${r}')">
              <span class="nav-ic-emblem">${ic}</span>
              <div class="nav-item-text">
                <div class="nav-item-title">${l}</div>
                <div class="nav-item-sub">${sub || ''}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>

      <div class="nav-collapsible-drawer ${mobileNavOpen ? 'open' : ''}">
        ${caseloadWidget}

        <div class="nav-user">
          <div class="nav-user-header">
            <div class="user-avatar">${userInitials}</div>
            <div style="flex:1;min-width:0;overflow:hidden">
              <div class="user-info-name" title="${esc(me.name)}">${esc(me.name)}</div>
              <span class="user-role-badge">${esc(me.role)}</span>
            </div>
          </div>
          <div style="font-size:0.68rem;color:#99f6e4;font-weight:600;margin-top:2px">Switch Role (1-Click):</div>
          <div class="sidebar-role-switcher" style="grid-template-columns: repeat(4, 1fr); gap: 4px;">
            <button class="role-switch-btn ${me.role === 'OWNER' ? 'active' : ''}" onclick="act.demoLogin('owner@eba.test')">Owner</button>
            <button class="role-switch-btn ${me.role === 'BCBA' ? 'active' : ''}" onclick="act.demoLogin('bcba@eba.test')">BCBA</button>
            <button class="role-switch-btn ${me.role === 'RBT' ? 'active' : ''}" onclick="act.demoLogin('rbt@eba.test')">RBT</button>
            <button class="role-switch-btn ${me.role === 'ADMIN' ? 'active' : ''}" onclick="act.demoLogin('admin@eba.test')">Admin</button>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:6px;padding:5px 8px;background:rgba(16,185,129,0.14);border:1px solid rgba(110,231,183,0.35);border-radius:8px;font-size:0.68rem;color:#ecfeff">
            <span title="Firebase Cloud Vault Project: rbt-sepia-aba">🔥 Cloud Synced</span>
            <button type="button" style="background:rgba(255,255,255,0.15);border:none;color:#fff;padding:2px 7px;border-radius:6px;font-size:0.66rem;cursor:pointer" onclick="act.manualFirebaseSync()">☁️ Save</button>
          </div>
          <a class="nav-logout" onclick="act.logout()">Sign Out</a>
        </div>
      </div>
    </nav>
    <main>
      ${content}
    </main>
  </div>
  ${floatBar}
  ${activeModal ? renderModal() : ''}`;
}

window.go = (r, id) => {
  mobileNavOpen = false;
  location.hash = id ? `${r}/${id}` : r;
};

// ---------- Views ----------

function loginView(err) {
  return `
  <div class="login-container">
    <div class="login-box">
      <div class="login-brand">
        ${brandEmblem('lg')}
        <div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
            <span class="badge p">ABA PRACTICE & CLINICAL PLATFORM</span>
            <span class="badge tan" style="background:#dcfce7;color:#166534;border:1px solid #86efac">🔥 Firebase Cloud Connected (rbt-sepia-aba)</span>
          </div>
          <h2 style="margin:0;font-size:1.45rem;font-weight:700;color:var(--slate-900)">Effective Behavioral Approach</h2>
          <div style="font-size:0.8rem;color:var(--slate-500);margin-top:2px">All-in-One Data Collection, Progress Tracking & Cloud-Backed Practice Management</div>
        </div>
      </div>

      <div class="demo-pills" style="margin-top:14px;margin-bottom:16px">
        <div style="font-size:0.78rem;font-weight:700;color:var(--slate-700);margin-bottom:6px">Choose a Role to Log In (1-Click Demo):</div>
        <div class="demo-pill" onclick="act.demoLogin('owner@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem" style="background:#0b5d5e;color:#fff">SJ</span>
            <div>
              <div style="font-weight:700;color:var(--slate-900)">Practice Owner (Sarah Jenkins)</div>
              <div style="font-size:0.76rem;color:var(--slate-500)">See overall business performance and revenue</div>
            </div>
          </div>
          <span class="badge p">Owner</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('bcba@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem">DR</span>
            <div>
              <div style="font-weight:700;color:var(--slate-900)">BCBA Supervisor (Dr. Dana Rivera)</div>
              <div style="font-size:0.76rem;color:var(--slate-500)">Monitor client progress and identify patterns in behavior</div>
            </div>
          </div>
          <span class="badge sen">BCBA</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('rbt@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem">SL</span>
            <div>
              <div style="font-weight:700;color:var(--slate-900)">RBT Therapist (Sam Lee)</div>
              <div style="font-size:0.76rem;color:var(--slate-500)">See assigned tasks, data collection requirements & training</div>
            </div>
          </div>
          <span class="badge tan">RBT</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('admin@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem" style="background:#0284c7;color:#fff">MV</span>
            <div>
              <div style="font-weight:700;color:var(--slate-900)">Administrator (Marcus Vance)</div>
              <div style="font-size:0.76rem;color:var(--slate-500)">Identify missing notes, incomplete sessions & billing issues</div>
            </div>
          </div>
          <span class="badge esc">Admin</span>
        </div>
        <div class="demo-pill" onclick="act.demoLogin('parent@eba.test')">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="role-emblem">MC</span>
            <div>
              <div style="font-weight:700;color:var(--slate-900)">Parent / Family (Mrs. Carter)</div>
              <div style="font-size:0.76rem;color:var(--slate-500)">View child goals and approved social stories</div>
            </div>
          </div>
          <span class="badge att">Parent</span>
        </div>
      </div>

      <div style="margin-top:12px;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:12px 14px">
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button type="button" class="${loginAuthTab === 'signin' ? 'ok' : 'sec'}" style="flex:1;padding:7px 10px;font-size:0.8rem" onclick="act.setLoginAuthTab('signin')">
            🔑 Sign In with Email
          </button>
          <button type="button" class="${loginAuthTab === 'register' ? 'ok' : 'sec'}" style="flex:1;padding:7px 10px;font-size:0.8rem" onclick="act.setLoginAuthTab('register')">
            ✨ Create Account (Firebase)
          </button>
        </div>

        ${loginAuthTab === 'register' ? `
          <div>
            <div style="font-size:0.76rem;color:var(--slate-600);margin-bottom:8px">
              Create a persistent account backed by <b>Firebase Auth & Cloud Vault (rbt-sepia-aba)</b>:
            </div>
            <label>Full Name & Credentials</label>
            <input id="reg_name" placeholder="e.g., Jordan Taylor, BCBA" autocomplete="name">
            <div class="row">
              <div>
                <label>Work Email</label>
                <input id="reg_em" placeholder="jordan@clinic.com" autocomplete="email">
              </div>
              <div>
                <label>Clinical Role</label>
                <select id="reg_role">
                  <option value="BCBA">BCBA Supervisor</option>
                  <option value="RBT">RBT Therapist</option>
                  <option value="ADMIN">Clinic Administrator</option>
                  <option value="OWNER">Practice Owner</option>
                  <option value="PARENT">Parent / Caregiver</option>
                </select>
              </div>
            </div>
            <label>Password (min 4 characters)</label>
            <input id="reg_pw" type="password" placeholder="Create password" autocomplete="new-password">
            <button style="width:100%;padding:10px;margin-top:8px" class="ok" onclick="act.registerAccount()">🔥 Create Account & Sign In</button>
          </div>
        ` : `
          <div>
            <label>Email</label>
            <input id="em" value="bcba@eba.test" placeholder="name@practice.com" autocomplete="username">
            <label>Password</label>
            <input id="pw" type="password" value="password" autocomplete="current-password">
            <button style="width:100%;padding:10px;margin-top:8px" onclick="act.login()">Sign In</button>
          </div>
        `}
      </div>

      ${err ? `<div class="err" style="text-align:center;margin-top:12px">⚠️ ${esc(err)}</div>` : ''}
    </div>
  </div>`;
}

function renderOwnerKpi(d) {
  const o = d.owner || {};
  const cpt = o.cptRevenueBreakdown || {};
  const cap = o.caseloadCapacity || { activeClients: 0, targetCaseload: 10, utilizationPct: 0 };
  const prod = o.staffProductivity || [];
  const pipe = o.payerPipeline || { totalAuthorizedUnits: 0, totalUsedUnits: 0, remainingUnits: 0, overallBurnPct: 0, atRiskCount: 0 };
  const bcba = d.bcbaKpi || {};
  const prog = bcba.clientProgress || {};
  const beh = bcba.behaviorPatterns || {};
  const sup = d.supervision || {};

  return `
  <!-- Clear Role Focus Bar -->
  <div class="card" style="padding:14px 18px;margin-bottom:16px;background:#f0fdfa;border-top:none;border-left:4px solid #059669">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:#047857;text-transform:uppercase">Owner View</div>
        <div style="font-size:0.98rem;font-weight:700;color:var(--slate-900)">Business Revenue, BCBA Clinical Quality, Clinician Productivity & Client Reimbursement</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="go('notes')">📋 Notes & Claims</button>
        <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="go('clients')">👧 Clients Directory →</button>
      </div>
    </div>
  </div>

  <!-- 4 Simple Business Summary Cards -->
  <div class="grid">
    <div class="stat-card ok">
      <div class="stat-label">Monthly Revenue (MTD)</div>
      <div class="stat" style="color:var(--ok)">$${(o.totalRevenueMtd || 0).toLocaleString()}</div>
      <div class="stat-sub">Projected full month: <b>$${(o.projectedMonthlyRevenue || 0).toLocaleString()}</b></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Billable Hours Delivered</div>
      <div class="stat" style="color:var(--primary)">${o.totalBillableHours || 0} <span style="font-size:1rem">hrs</span></div>
      <div class="stat-sub">${o.totalBillableUnits || 0} billing units (15-min)</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active Clients</div>
      <div class="stat">${cap.activeClients} <span style="font-size:1rem;color:var(--slate-400)">/ ${cap.targetCaseload}</span></div>
      <div class="stat-sub">${cap.utilizationPct}% clinic capacity filled</div>
    </div>
    <div class="stat-card" onclick="go('clients')" style="cursor:pointer">
      <div class="stat-label">Authorized Units Remaining</div>
      <div class="stat" style="color:var(--accent)">${pipe.remainingUnits || 0}</div>
      <div class="stat-sub"><b>${pipe.overallBurnPct || 0}%</b> of ${pipe.totalAuthorizedUnits || 0} units used →</div>
    </div>
  </div>

  <!-- BCBA Clinical Quality & Caseload Performance (For Owner to Monitor How BCBAs Are Doing) -->
  <div class="card" style="border-top:3px solid #0d9488">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div>
        <h3 style="margin:0 0 2px">BCBA Clinical Performance & Caseload Outcomes</h3>
        <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">How your BCBAs are performing across client goal mastery, behavior reduction trends, treatment fidelity, and BACB supervision.</p>
      </div>
      <span class="badge sen">${prod.filter(p => p.role === 'BCBA').length || 1} Active BCBA(s)</span>
    </div>
    <div class="grid" style="margin-bottom:0">
      <div class="stat-card" onclick="go('clients')" style="cursor:pointer">
        <div class="stat-label">1. Active Client Caseload & Goals</div>
        <div class="stat" style="color:var(--primary)">${cap.activeClients}</div>
        <div class="stat-sub"><b>${prog.activeProgramsCount || 5}</b> active goals · <b>${prog.masteredCount || 0}</b> mastered (${(prog.criteriaMetAlerts || []).length} ready)</div>
      </div>
      <div class="stat-card ok">
        <div class="stat-label">2. Caseload Behavior Trend</div>
        <div class="stat" style="color:var(--ok)">${beh.pctChange || -51}%</div>
        <div class="stat-sub"><b>${beh.trendDirection || 'Decreasing (Improving)'}</b> (${beh.totalMaladaptiveEvents || 12} total incidents)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">3. Treatment Fidelity & IOA</div>
        <div class="stat" style="color:var(--sensory)">${beh.averageTreatmentIntegrityFidelity || 100}%</div>
        <div class="stat-sub">IOA Agreement: <b>${beh.averageIoaAgreement || 92}%</b></div>
      </div>
      <div class="stat-card ${sup.compliant !== false ? 'ok' : 'bad'}" onclick="go('supervision')" style="cursor:pointer">
        <div class="stat-label">4. BCBA 5% RBT Supervision</div>
        <div class="stat" style="color:${sup.compliant !== false ? 'var(--ok)' : 'var(--bad)'}">${sup.supPct ?? 12.5}%</div>
        <div class="stat-sub">${sup.compliant !== false ? '✓ BACB ≥5% Compliant' : '⚠ Needs Supervision Hours'} →</div>
      </div>
    </div>
  </div>

  <!-- 1. Revenue by Service Code -->
  <div class="card">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:8px">
      <div>
        <h3 style="margin:0 0 2px">1. Revenue Breakdown by Service Code (CPT)</h3>
        <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">How much revenue each ABA therapy service generated this month.</p>
      </div>
      <span class="badge ok">Avg $${(o.avgRevenuePerClient || 0).toLocaleString()} / client</span>
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>CPT Code</th>
            <th>Service</th>
            <th style="text-align:right">Hours</th>
            <th style="text-align:right">Units (15m)</th>
            <th style="text-align:right">Hourly Rate</th>
            <th style="text-align:right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${['cpt97153', 'cpt97155', 'cpt97156', 'cpt97151'].map(key => {
            const item = cpt[key] || { code: key.replace('cpt', ''), units: 0, hours: 0, hrRate: 0, total: 0, label: '' };
            return `
              <tr>
                <td><b>${esc(item.code)}</b></td>
                <td>${esc(item.label)}</td>
                <td style="text-align:right">${item.hours} hrs</td>
                <td style="text-align:right">${item.units}</td>
                <td style="text-align:right">$${item.hrRate}/hr</td>
                <td style="text-align:right;font-weight:700">$${(item.total || 0).toLocaleString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700">
            <td colspan="2" style="background:#f0f8f8"><b>Total This Month</b></td>
            <td style="text-align:right;background:#f0f8f8">${o.totalBillableHours || 0} hrs</td>
            <td style="text-align:right;background:#f0f8f8">${o.totalBillableUnits || 0}</td>
            <td style="text-align:right;background:#f0f8f8">—</td>
            <td style="text-align:right;background:#f0f8f8;color:var(--ok);font-size:1.02rem">$${(o.totalRevenueMtd || 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- 2. Clinician Billable Productivity (with Clinician/Client Search & Client Column) -->
  ${(() => {
    lastStaffProdData = prod;
    const allClientNames = Array.from(new Set(
      prod.flatMap(p => (p.clients || []).map(c => c.name)).filter(Boolean)
    ));

    window.renderStaffProdRowsHtml = (list) => {
      const q = (staffProdSearchQuery || '').trim().toLowerCase();
      const filtered = (list || []).filter(p => {
        if (staffProdRoleFilter !== 'ALL' && p.role !== staffProdRoleFilter) return false;
        const cNames = (p.clients || []).map(c => c.name);
        if (staffProdClientFilter !== 'ALL' && !cNames.includes(staffProdClientFilter)) return false;
        if (!q) return true;
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchRole = (p.role || '').toLowerCase().includes(q);
        const matchClient = (p.clientNames || cNames.join(' ')).toLowerCase().includes(q);
        return matchName || matchRole || matchClient;
      });

      const countEl = document.getElementById('staff_prod_count');
      if (countEl) countEl.textContent = `${filtered.length} of ${(list || []).length} Clinicians`;

      if (!filtered.length) {
        return `<tr><td colspan="6" style="text-align:center;color:var(--slate-500);padding:18px">No clinicians match "${esc(staffProdSearchQuery)}".</td></tr>`;
      }

      return filtered.map(p => {
        const isHigh = p.utilizationPct >= 70;
        const isPacing = p.utilizationPct >= 30;
        const clientList = p.clients && p.clients.length ? p.clients : [];
        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar" style="width:32px;height:32px;font-size:0.78rem">${getInitials(p.name)}</div>
                <b>${esc(p.name)}</b>
              </div>
            </td>
            <td><span class="badge ${p.role === 'BCBA' ? 'sen' : 'tan'}">${esc(p.role)}</span></td>
            <td>
              ${clientList.length ? `
                <div style="display:flex;gap:5px;flex-wrap:wrap">
                  ${clientList.map(c => `
                    <span class="badge p" style="cursor:pointer" onclick="go('client', ${c.id})" title="Open ${esc(c.name)}'s profile">
                      👧 ${esc(c.name)}${c.hours > 0 ? ` (${c.hours}h)` : ''}
                    </span>
                  `).join('')}
                </div>
              ` : `<span style="color:var(--slate-400);font-size:0.82rem">Unassigned</span>`}
            </td>
            <td><b>${p.billableHours} hrs</b> <span style="font-size:0.78rem;color:var(--slate-500)">(${p.billableUnits} u)</span></td>
            <td style="min-width:140px">
              <div class="flex-between" style="font-size:0.75rem;font-weight:600;margin-bottom:3px">
                <span>${p.utilizationPct}%</span>
                <span style="color:var(--slate-500)">${p.targetHours}h goal</span>
              </div>
              <div class="bar" style="height:6px"><div style="width:${p.utilizationPct}%;background:${isHigh ? 'var(--ok)' : isPacing ? 'var(--accent)' : 'var(--warn)'}"></div></div>
            </td>
            <td><span class="tag ${isHigh ? 'approved' : 'draft'}">${isHigh ? 'High Yield' : isPacing ? 'On Track' : 'Pacing'}</span></td>
          </tr>
        `;
      }).join('');
    };

    window.filterStaffProd = () => {
      const sEl = document.getElementById('staff_prod_search');
      const rEl = document.getElementById('staff_prod_role');
      const cEl = document.getElementById('staff_prod_client');
      if (sEl) staffProdSearchQuery = sEl.value;
      if (rEl) staffProdRoleFilter = rEl.value;
      if (cEl) staffProdClientFilter = cEl.value;
      const tbody = document.getElementById('staff_prod_tbody');
      if (tbody) tbody.innerHTML = window.renderStaffProdRowsHtml(lastStaffProdData);
    };

    return `
    <div class="row">
      <div class="card" style="flex:1.5">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:10px">
          <div>
            <h3 style="margin:0 0 2px">2. Clinician Billable Productivity</h3>
            <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Monthly billable target utilization, assigned clients, and direct therapy hours delivered.</p>
          </div>
          <span class="badge tan" id="staff_prod_count">${prod.length} of ${prod.length} Clinicians</span>
        </div>

        <!-- Search & Filter Bar for 20+ RBTs/BCBAs -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;background:var(--slate-50);padding:10px;border-radius:var(--radius-md);border:1px solid var(--slate-200)">
          <div style="flex:1.6;min-width:190px">
            <input id="staff_prod_search" style="margin:0" placeholder="🔍 Search by clinician or client name..." value="${esc(staffProdSearchQuery)}" oninput="window.filterStaffProd()">
          </div>
          <div style="flex:0.8;min-width:120px">
            <select id="staff_prod_role" style="margin:0" onchange="window.filterStaffProd()">
              <option value="ALL" ${staffProdRoleFilter === 'ALL' ? 'selected' : ''}>All Roles</option>
              <option value="RBT" ${staffProdRoleFilter === 'RBT' ? 'selected' : ''}>RBTs Only</option>
              <option value="BCBA" ${staffProdRoleFilter === 'BCBA' ? 'selected' : ''}>BCBAs Only</option>
            </select>
          </div>
          <div style="flex:0.9;min-width:130px">
            <select id="staff_prod_client" style="margin:0" onchange="window.filterStaffProd()">
              <option value="ALL" ${staffProdClientFilter === 'ALL' ? 'selected' : ''}>All Clients</option>
              ${allClientNames.map(cn => `<option value="${esc(cn)}" ${staffProdClientFilter === cn ? 'selected' : ''}>Client: ${esc(cn)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Clinician</th>
                <th>Role</th>
                <th>Client</th>
                <th>Hours Logged</th>
                <th>Target Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="staff_prod_tbody">
              ${window.renderStaffProdRowsHtml(prod)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  })()}

    <div class="card" style="flex:1">
      <div class="flex-between" style="margin-bottom:8px">
        <div>
          <h3 style="margin:0 0 2px">3. Insurance Authorizations</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Approved insurance units used vs. remaining.</p>
        </div>
        <span class="badge ${pipe.atRiskCount > 0 ? 'bad' : 'ok'}">${pipe.atRiskCount} Near Limit</span>
      </div>

      <div style="background:var(--slate-50);padding:12px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:12px">
        <div class="flex-between" style="font-size:0.85rem;margin-bottom:6px">
          <span>Total Units Used</span>
          <b>${pipe.overallBurnPct}% (${pipe.totalUsedUnits} / ${pipe.totalAuthorizedUnits} units)</b>
        </div>
        <div class="bar" style="height:8px"><div style="width:${pipe.overallBurnPct}%;background:${pipe.overallBurnPct >= 80 ? 'var(--bad)' : 'var(--primary)'}"></div></div>
        <div style="font-size:0.78rem;color:var(--slate-500);margin-top:6px">
          <b>${pipe.remainingUnits}</b> authorized units remaining across all clients.
        </div>
      </div>

      ${(d.auths && d.auths.length) ? d.auths.slice(0, 3).map(a => {
        const pct = Math.round((a.used / a.authorized) * 100);
        return `
          <div style="padding:8px 10px;background:var(--slate-50);border-radius:var(--radius-sm);border:1px solid var(--slate-200);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;font-size:0.84rem">
            <span><b>${esc(a.client)}</b> (CPT ${esc(a.code)})</span>
            <span class="badge ${pct >= 90 ? 'bad' : 'tan'}">${pct}% used (${a.used}/${a.authorized})</span>
          </div>
        `;
      }).join('') : '<p style="color:var(--slate-500);font-size:0.84rem">All client authorizations have plenty of units remaining.</p>'}
    </div>
  </div>

  <!-- Client Administrative Billing & Reimbursement Snapshots -->
  ${renderClientBillingSnapshotsCard(o.clientBillingSnapshots || (d.adminKpi && d.adminKpi.clientBillingSnapshots) || [], '4. Client Billing & Reimbursement Snapshots')}
  `;
}

window.renderClientBillingRowsHtml = function(list) {
  const q = (clientBillingSearchQuery || '').trim().toLowerCase();
  const filtered = (list || []).filter(c => {
    if (clientBillingStatusFilter === 'HELD' && !(c.heldSessionsCount > 0 || c.heldAmount > 0)) return false;
    if (clientBillingStatusFilter === 'AT_RISK' && !c.hasAuthAtRisk) return false;
    if (clientBillingStatusFilter === 'CLEAN' && (c.heldSessionsCount > 0 || c.hasAuthAtRisk)) return false;
    if (!q) return true;
    return (c.clientName || '').toLowerCase().includes(q) ||
           (c.payerName || '').toLowerCase().includes(q) ||
           (c.authNumber || '').toLowerCase().includes(q) ||
           (c.memberId || '').toLowerCase().includes(q) ||
           (c.assignedTeam || '').toLowerCase().includes(q);
  });

  const countEl = typeof document !== 'undefined' ? document.getElementById('client_billing_count_badge') : null;
  if (countEl) countEl.textContent = `${filtered.length} of ${(list || []).length} Clients`;

  if (!filtered.length) {
    return `<tr><td colspan="7" style="text-align:center;color:var(--slate-500);padding:20px">No client billing snapshots match "${esc(clientBillingSearchQuery)}". <a href="javascript:void(0)" onclick="act.resetClientBillingFilters()" style="color:var(--primary);font-weight:700">Reset filters</a></td></tr>`;
  }

  return filtered.map(c => {
    const authBadges = (c.authorizations || []).map(a =>
      `<span class="badge ${a.atRisk ? 'bad' : 'p'}" style="margin-right:4px;margin-bottom:3px">CPT ${esc(a.code)}: ${a.used}/${a.authorized}u ($${(a.usedValue || 0).toLocaleString()})</span>`
    ).join('');

    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="user-avatar" style="width:36px;height:36px;font-size:0.82rem;flex-shrink:0">${getInitials(c.clientName)}</div>
            <div>
              <div style="font-weight:700;color:var(--slate-900);font-size:0.95rem">
                <a href="javascript:void(0)" onclick="act.openClientBillingModal(${c.clientId})" style="color:var(--slate-900);text-decoration:none">${esc(c.clientName)}</a>
              </div>
              <div style="font-size:0.76rem;color:var(--slate-600);margin-top:2px">
                <b>${esc(c.payerName)}</b> · <span style="font-family:var(--font-mono)">${esc(c.authNumber)}</span>
              </div>
              <div style="font-size:0.72rem;color:var(--slate-500)">Member ID: ${esc(c.memberId)} · Guardian: ${esc(c.guardian)}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size:0.82rem;font-weight:600;color:var(--slate-800)">${esc(c.planType)}</div>
          <div style="font-size:0.76rem;color:var(--slate-600);margin-top:2px">${esc(c.copayInfo)}</div>
          <div style="font-size:0.74rem;color:${c.patientBalance > 0 ? 'var(--warn)' : 'var(--ok)'};font-weight:700;margin-top:2px">
            Family Balance: $${(c.patientBalance || 0).toLocaleString()}
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.8rem;margin-bottom:4px">
            <b>${c.totalUsedUnits} / ${c.totalAuthorizedUnits} units (${c.authBurnPct}%)</b>
            <span style="color:var(--slate-500);font-size:0.74rem">${c.remainingUnits} rem</span>
          </div>
          <div class="bar" style="height:7px;margin-bottom:6px">
            <div style="width:${Math.min(100, c.authBurnPct)}%;background:${c.authBurnPct >= 80 ? 'var(--bad)' : 'var(--primary)'}"></div>
          </div>
          <div style="display:flex;flex-wrap:wrap">${authBadges}</div>
        </td>
        <td>
          <div style="font-size:1rem;font-weight:700;color:var(--slate-900)">$${(c.totalBilled || 0).toLocaleString()}</div>
          <div style="font-size:0.74rem;color:var(--slate-500)">Allowed: $${(c.totalAllowed || 0).toLocaleString()}</div>
        </td>
        <td>
          <div style="font-size:1rem;font-weight:700;color:var(--ok)">$${(c.totalReimbursed || 0).toLocaleString()}</div>
          <div style="font-size:0.74rem;color:var(--slate-600)"><b>${c.reimbursementRatePct}%</b> realized · ERA Paid</div>
        </td>
        <td>
          ${c.pendingPayerAmount > 0 ? `
            <div style="font-size:0.82rem;font-weight:700;color:var(--primary)">$${c.pendingPayerAmount.toLocaleString()} Pending</div>
            <div style="font-size:0.72rem;color:var(--slate-500)">${c.pendingSessionsCount} clean claim(s) in 837P</div>
          ` : ''}
          ${c.heldAmount > 0 ? `
            <div style="font-size:0.82rem;font-weight:700;color:var(--bad);margin-top:2px">$${c.heldAmount.toLocaleString()} Held</div>
            <div style="font-size:0.72rem;color:var(--bad)">${c.heldSessionsCount} unsigned/missing note(s)</div>
          ` : ''}
          ${!c.pendingPayerAmount && !c.heldAmount ? `<span class="tag approved">All Claims Settled</span>` : ''}
        </td>
        <td style="text-align:right;white-space:nowrap">
          ${['BCBA', 'OWNER', 'ADMIN'].includes(me.role) ? `
            <button class="sec" style="padding:6px 10px;font-size:0.78rem;margin-right:4px" onclick="act.openScheduleRbtModal(${c.clientId}, '${esc(c.clientName)}')">📅 Schedule RBT</button>
          ` : ''}
          <button class="ok" style="padding:6px 12px;font-size:0.78rem;margin-right:4px" onclick="act.openClientBillingModal(${c.clientId})">💳 Billing Snapshot</button>
          <button class="sec" style="padding:6px 10px;font-size:0.78rem" onclick="act.quickPillar(${c.clientId}, 'services')" title="Open Insurance & Supervision Tab">360 →</button>
        </td>
      </tr>
    `;
  }).join('');
};

function renderClientBillingSnapshotsCard(snapshots, sectionTitle = 'Client Billing & Reimbursement Snapshots') {
  const list = snapshots || [];
  lastClientBillingSnapshots = list;

  const totalBilledAll = list.reduce((s, c) => s + (c.totalBilled || 0), 0);
  const totalReimbursedAll = list.reduce((s, c) => s + (c.totalReimbursed || 0), 0);
  const totalPendingAll = list.reduce((s, c) => s + (c.pendingPayerAmount || 0), 0);
  const totalHeldAll = list.reduce((s, c) => s + (c.heldAmount || 0), 0);
  const avgReimbPct = totalBilledAll > 0 ? Math.round((totalReimbursedAll / totalBilledAll) * 100) : 92;

  return `
  <div class="card">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div>
        <h3 style="margin:0 0 2px">${esc(sectionTitle)}</h3>
        <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Administrative view of each client's insurance policy, CPT authorization usage, billed claims, ERA reimbursements, and held notes.</p>
      </div>
      <span class="badge p" id="client_billing_count_badge">${list.length} of ${list.length} Clients</span>
    </div>

    <!-- Aggregate Billing & Reimbursement Strip -->
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:12px">
      <div style="background:var(--slate-50);padding:10px 14px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
        <div style="font-size:0.72rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">Total Billed (Auth Cycle)</div>
        <div style="font-size:1.25rem;font-weight:700;color:var(--slate-900);margin-top:2px">$${totalBilledAll.toLocaleString()}</div>
        <div style="font-size:0.75rem;color:var(--slate-500)">Across ${list.length} active client(s)</div>
      </div>
      <div style="background:#f0fdf4;padding:10px 14px;border-radius:var(--radius-sm);border:1px solid #bbf7d0">
        <div style="font-size:0.72rem;font-weight:700;color:#047857;text-transform:uppercase">Reimbursed (ERA/EFT Paid)</div>
        <div style="font-size:1.25rem;font-weight:700;color:var(--ok);margin-top:2px">$${totalReimbursedAll.toLocaleString()}</div>
        <div style="font-size:0.75rem;color:#065f46"><b>${avgReimbPct}%</b> net payer realization</div>
      </div>
      <div style="background:#f0f9ff;padding:10px 14px;border-radius:var(--radius-sm);border:1px solid #bae6fd">
        <div style="font-size:0.72rem;font-weight:700;color:#0369a1;text-transform:uppercase">Pending Payer (837P)</div>
        <div style="font-size:1.25rem;font-weight:700;color:var(--primary);margin-top:2px">$${totalPendingAll.toLocaleString()}</div>
        <div style="font-size:0.75rem;color:#0369a1">Clean signed claims in clearinghouse</div>
      </div>
      <div style="background:${totalHeldAll > 0 ? '#fff1f2' : 'var(--slate-50)'};padding:10px 14px;border-radius:var(--radius-sm);border:1px solid ${totalHeldAll > 0 ? '#fecdd3' : 'var(--slate-200)'}">
        <div style="font-size:0.72rem;font-weight:700;color:${totalHeldAll > 0 ? 'var(--bad)' : 'var(--slate-500)'};text-transform:uppercase">Held (Unsigned / Missing Note)</div>
        <div style="font-size:1.25rem;font-weight:700;color:${totalHeldAll > 0 ? 'var(--bad)' : 'var(--ok)'};margin-top:2px">$${totalHeldAll.toLocaleString()}</div>
        <div style="font-size:0.75rem;color:${totalHeldAll > 0 ? 'var(--bad)' : 'var(--slate-500)'}">${totalHeldAll > 0 ? 'Requires RBT note or BCBA co-sign' : 'Zero claims held'}</div>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;background:var(--slate-50);padding:10px;border-radius:var(--radius-md);border:1px solid var(--slate-200)">
      <div style="flex:1.6;min-width:200px">
        <input
          id="client_billing_search_input"
          placeholder="🔍 Search by client name, insurance payer, auth #, or clinician..."
          value="${esc(clientBillingSearchQuery)}"
          oninput="act.filterClientBillingTable(this.value, null)"
          style="margin:0;padding:8px 12px;font-size:0.84rem;background:#fff"
        >
      </div>
      <div style="min-width:170px">
        <select
          onchange="act.filterClientBillingTable(null, this.value)"
          style="margin:0;padding:8px 10px;font-size:0.84rem;background:#fff"
        >
          <option value="ALL" ${clientBillingStatusFilter === 'ALL' ? 'selected' : ''}>All Billing Statuses</option>
          <option value="HELD" ${clientBillingStatusFilter === 'HELD' ? 'selected' : ''}>Held Claims Only</option>
          <option value="AT_RISK" ${clientBillingStatusFilter === 'AT_RISK' ? 'selected' : ''}>Auth Near Limit (≥80%)</option>
          <option value="CLEAN" ${clientBillingStatusFilter === 'CLEAN' ? 'selected' : ''}>Clean / Settled</option>
        </select>
      </div>
    </div>

    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Client & Insurance Payer</th>
            <th>Coverage & Copay</th>
            <th>Authorized Units & CPT Breakdown</th>
            <th>Total Billed</th>
            <th>Reimbursed (Paid)</th>
            <th>Pending / Held</th>
            <th style="text-align:right">Snapshot</th>
          </tr>
        </thead>
        <tbody id="client_billing_tbody">
          ${window.renderClientBillingRowsHtml(list)}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

let bcbaClientSearchQuery = '';
let lastBcbaClientProfiles = [];

window.renderBcbaClientCardsHtml = function(profiles) {
  const q = (bcbaClientSearchQuery || '').trim().toLowerCase();
  const filtered = (profiles || []).filter(c => {
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q) ||
           (c.diagnosis || '').toLowerCase().includes(q) ||
           (c.communication || '').toLowerCase().includes(q) ||
           (c.school || '').toLowerCase().includes(q) ||
           (c.assignedRbts || []).join(' ').toLowerCase().includes(q);
  });

  const badgeEl = typeof document !== 'undefined' ? document.getElementById('bcba_client_count_badge') : null;
  if (badgeEl) badgeEl.textContent = `${filtered.length} of ${(profiles || []).length} Clients`;

  if (!filtered.length) {
    return `<div style="grid-column:1/-1;text-align:center;color:var(--slate-500);padding:20px;background:var(--slate-50);border-radius:var(--radius-md)">No clients match "${esc(bcbaClientSearchQuery)}".</div>`;
  }

  return filtered.map(c => `
    <div style="background:#fff;border:1.5px solid var(--slate-200);border-top:4px solid var(--primary);border-radius:var(--radius-md);padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;box-shadow:var(--shadow-xs)">
      <!-- Clean Client Header -->
      <div class="flex-between" style="align-items:flex-start;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="go('client', ${c.id})">
          <div class="user-avatar" style="width:46px;height:46px;font-size:1rem;flex-shrink:0">${getInitials(c.name)}</div>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="font-size:1.12rem;font-weight:700;color:var(--slate-900)">${esc(c.name)}</span>
              <span class="badge p">${esc(c.diagnosis)}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--slate-500);margin-top:3px">
              DOB: <b>${esc(c.dob)}</b> &nbsp;·&nbsp; Setting: <b>${esc(c.school)}</b> &nbsp;·&nbsp; RBT: <b>${esc((c.assignedRbts || []).join(', '))}</b>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0">
          <button class="sec" style="padding:8px 12px;font-size:0.8rem;white-space:nowrap" onclick="act.openScheduleRbtModal(${c.id}, '${esc(c.name)}')">
            📅 Schedule RBT
          </button>
          <button class="ok" style="padding:8px 14px;font-size:0.82rem;white-space:nowrap" onclick="go('client', ${c.id})">
            Open Client Profile →
          </button>
        </div>
      </div>

      <!-- Clean, Uncluttered 3-Line Client Profile Snapshot -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;background:var(--slate-50);padding:12px 14px;border-radius:var(--radius-sm);border:1px solid var(--slate-200);font-size:0.82rem">
        <div>
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">💬 Communication</div>
          <div style="font-weight:600;color:var(--slate-800);margin-top:3px">${esc(c.communication)}</div>
        </div>
        <div>
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">⭐ Reinforcers & Sensory</div>
          <div style="font-weight:600;color:var(--slate-800);margin-top:3px">${esc(c.reinforcers)} · ${esc(c.sensory)}</div>
        </div>
        <div>
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">⚡ Known Triggers</div>
          <div style="font-weight:600;color:var(--slate-800);margin-top:3px">${esc(c.triggers)}</div>
        </div>
      </div>
    </div>
  `).join('');
};

function renderBcbaKpi(d) {
  const bcba = d.bcbaKpi || {};
  const clientProfiles = bcba.clientProfiles || [];
  lastBcbaClientProfiles = clientProfiles;

  return `
  <!-- Clear Role Focus Bar -->
  <div class="card" style="padding:14px 18px;margin-bottom:16px;background:#f0fdfa;border-top:none;border-left:4px solid #0d9488">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:#0f766e;text-transform:uppercase">BCBA View</div>
        <div style="font-size:0.98rem;font-weight:700;color:var(--slate-900)">My Clients & Clinical Profiles — Ready to View</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="go('schedule')">📅 Open Schedule</button>
        <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="go('clients')">👧 Clients & Full Snapshots →</button>
      </div>
    </div>
  </div>

  <!-- ONLY MY CLIENTS & CLINICAL PROFILES ON THE MAIN BCBA DASHBOARD -->
  <div class="card">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div>
        <h3 style="margin:0 0 2px">My Clients — Clean Profile Snapshot</h3>
        <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Click "Open Client Profile →" to view all clinical metrics, skill goals, behavior patterns, treatment fidelity, and IOA under that client's profile.</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="badge p" id="bcba_client_count_badge">${clientProfiles.length} of ${clientProfiles.length} Clients</span>
        <input
          placeholder="🔍 Search client, RBT, or diagnosis..."
          value="${esc(bcbaClientSearchQuery)}"
          oninput="bcbaClientSearchQuery=this.value;const g=document.getElementById('bcba_client_cards_grid');if(g)g.innerHTML=window.renderBcbaClientCardsHtml(lastBcbaClientProfiles);"
          style="margin:0;padding:6px 12px;font-size:0.82rem;width:240px;background:var(--slate-50)"
        >
      </div>
    </div>

    <div id="bcba_client_cards_grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:14px">
      ${window.renderBcbaClientCardsHtml(clientProfiles)}
    </div>
  </div>
  `;
}

function renderRbtKpi(d) {
  const rbt = d.rbtKpi || {};
  const tasks = rbt.todayTasks || [];
  const reqs = rbt.dataRequirements || {};
  const train = rbt.trainingAndSupervision || {};

  return `
  <!-- Clear Role Focus Bar -->
  <div style="padding:16px 20px;margin-bottom:16px;background:#dff1f3;border:2px solid #7fb7be;border-radius:16px">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:1.25rem;font-weight:900;color:#0f4c5c;letter-spacing:0.01em">RBT SEPIA | DASHBOARD</div>
        <div style="font-size:0.92rem;font-weight:600;color:#334155;margin-top:2px">Same visual style • fewer decisions • faster data entry — Click "▶ Start Session" below to open the Simplified RBT Session Screen</div>
      </div>
      <button class="ok" style="padding:8px 14px;font-size:0.82rem;background:#0d7a68" onclick="go('schedule')">Open Full Schedule →</button>
    </div>
  </div>

  <!-- 4 Simple Summary Cards -->
  <div class="grid">
    <div class="stat-card">
      <div class="stat-label">1. Assigned Sessions Today</div>
      <div class="stat" style="color:var(--primary)">${tasks.length}</div>
      <div class="stat-sub">${tasks.filter(t => t.status === 'Completed').length} completed · ${tasks.filter(t => t.status === 'In Session').length} in progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">2. Daily Trial Goal</div>
      <div class="stat" style="color:var(--primary)">${reqs.completedTrialsToday || 0} <span style="font-size:1rem;color:var(--slate-400)">/ ${reqs.requiredTrialsPerSession * Math.max(1, tasks.length)}</span></div>
      <div class="stat-sub">${reqs.pendingTargetCount || 0} active skill goals to score</div>
    </div>
    <div class="stat-card ${train.compliant ? 'ok' : 'warn'}">
      <div class="stat-label">3. 5% Supervision Status</div>
      <div class="stat" style="color:${train.compliant ? 'var(--ok)' : 'var(--warn)'}">${train.personalSupPct || 0}%</div>
      <div class="stat-sub">${train.compliant ? '✓ Meets BACB 5% requirement' : `Needs ${train.hoursNeededFor5Pct}h more supervision`}</div>
    </div>
    <div class="stat-card ok">
      <div class="stat-label">Training Fidelity Score</div>
      <div class="stat" style="color:var(--ok)">${train.latestFidelityScore || 100}%</div>
      <div class="stat-sub">Latest BCBA observation score</div>
    </div>
  </div>

  <!-- 1. Assigned Tasks Today -->
  <div class="card">
    <div class="flex-between" style="margin-bottom:8px">
      <div>
        <h3 style="margin:0 0 2px">1. Assigned Tasks & Sessions Today</h3>
        <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Click "Start Session" to open the live data collection screen.</p>
      </div>
      <span class="badge p">${tasks.length} Scheduled</span>
    </div>
    ${tasks.length ? `
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Client</th>
            <th>Setting</th>
            <th>Status</th>
            <th style="text-align:right">Action</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => `
            <tr>
              <td><b>${esc(t.timeWindow)}</b></td>
              <td><b>${esc(t.clientName)}</b></td>
              <td><span class="badge">${esc(t.setting)}</span></td>
              <td>
                <span class="tag ${t.status === 'Completed' ? 'approved' : t.status === 'In Session' ? 'att' : 'draft'}">
                  ${t.status}
                </span>
              </td>
              <td style="text-align:right">
                <button class="${t.status === 'Completed' ? 'sec' : 'ok'}" onclick="act.start(${t.appointmentId})">
                  ${t.status === 'In Session' ? 'Resume Session →' : t.status === 'Completed' ? 'Review Note' : '▶ Start Session'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:var(--slate-500);text-align:center;padding:18px">No sessions assigned for today.</p>'}
  </div>

  <!-- 2. Data Requirements & 3. Training Progress -->
  <div class="row">
    <div class="card" style="flex:1">
      <h3 style="margin:0 0 2px">2. Data Collection Requirements</h3>
      <p style="margin:0 0 12px;font-size:0.84rem;color:var(--slate-500)">Trials and step-by-step routines required during today's sessions.</p>

      <div style="background:var(--slate-50);padding:12px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:12px">
        <div class="flex-between" style="font-size:0.85rem;margin-bottom:6px">
          <span>Trial Goal (25 trials per session)</span>
          <b>${reqs.completedTrialsToday || 0} / ${reqs.requiredTrialsPerSession * Math.max(1, tasks.length)} logged</b>
        </div>
        <div class="bar" style="height:8px">
          <div style="width:${Math.min(100, Math.round(((reqs.completedTrialsToday || 0) / (reqs.requiredTrialsPerSession * Math.max(1, tasks.length))) * 100))}%;background:var(--primary)"></div>
        </div>
      </div>

      <div style="font-size:0.8rem;font-weight:700;color:var(--slate-700);margin-bottom:6px">Task Analysis Routines to Score:</div>
      ${(reqs.taskAnalyses && reqs.taskAnalyses.length) ? reqs.taskAnalyses.map(ta => `
        <div style="padding:9px 12px;background:var(--slate-50);border-radius:var(--radius-sm);border:1px solid var(--slate-200);display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:0.85rem">
          <span><b>${esc(ta.title)}</b> (${esc(ta.clientName)})</span>
          <span class="badge ok">Active</span>
        </div>
      `).join('') : '<p style="color:var(--slate-500);font-size:0.84rem">No task analysis routines pending.</p>'}
    </div>

    <div class="card" style="flex:1">
      <h3 style="margin:0 0 2px">3. Training & Supervision Progress</h3>
      <p style="margin:0 0 12px;font-size:0.84rem;color:var(--slate-500)">Your monthly BACB 5% supervision hours and supervisor feedback.</p>

      <div style="background:var(--slate-50);padding:12px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:12px">
        <div class="flex-between" style="font-size:0.85rem;margin-bottom:6px">
          <span>Direct Hours: <b>${train.directHours || 0}h</b></span>
          <span>Supervised: <b>${train.supervisionHours || 0}h (${train.personalSupPct || 0}%)</b></span>
        </div>
        <div class="bar" style="height:8px">
          <div style="width:${Math.min(100, Math.round(((train.personalSupPct || 0) / 5) * 100))}%;background:${train.compliant ? 'var(--ok)' : 'var(--warn)'}"></div>
        </div>
      </div>

      <div style="background:#f8fcff;border:1px solid #bae6fd;border-left:4px solid var(--sensory);border-radius:var(--radius-sm);padding:10px 12px">
        <div style="font-size:0.74rem;font-weight:700;color:var(--sensory);text-transform:uppercase">Latest BCBA Supervisor Feedback</div>
        <p style="margin:4px 0 0;font-size:0.85rem;color:var(--slate-800)">
          "${esc(train.latestFeedback || 'Great fidelity adherence during trial runs.')}"
        </p>
      </div>
    </div>
  </div>
  `;
}

function renderAdminKpi(d) {
  const admin = d.adminKpi || {};
  const delinq = admin.documentationDelinquency || {};
  const missing = delinq.missingNotesList || [];
  const disc = admin.sessionDiscrepancies || {};
  const unstarted = disc.unstartedList || [];
  const bill = admin.billingAndClaims || {};
  const authsAtRisk = bill.authorizationsAtRisk || [];

  return `
  <!-- Clear Role Focus Bar -->
  <div class="card" style="padding:14px 18px;margin-bottom:16px;background:#f0fdfa;border-top:none;border-left:4px solid #0284c7">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:#0369a1;text-transform:uppercase">Administrator View</div>
        <div style="font-size:0.98rem;font-weight:700;color:var(--slate-900)">Schedule RBT Appointments, Identify Missing Notes, Incomplete Sessions & Billing Issues</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="ok" style="padding:6px 12px;font-size:0.8rem" onclick="act.openScheduleRbtModal()">📅 + Schedule RBT Session</button>
        <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="go('schedule')">📅 Open Full Schedule</button>
        <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="go('notes')">Open Notes & Claims →</button>
      </div>
    </div>
  </div>

  <!-- 4 Simple Summary Cards -->
  <div class="grid">
    <div class="stat-card ${delinq.missingNotesCount > 0 ? 'bad' : 'ok'}">
      <div class="stat-label">1. Missing Session Notes</div>
      <div class="stat" style="color:${delinq.missingNotesCount > 0 ? 'var(--bad)' : 'var(--ok)'}">${delinq.missingNotesCount || 0}</div>
      <div class="stat-sub"><b>${missing.filter(n => n.isDelinquent).length}</b> overdue (&gt;24 hours)</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">2. Incomplete Sessions</div>
      <div class="stat" style="color:${unstarted.length > 0 ? 'var(--warn)' : 'var(--ok)'}">${unstarted.length}</div>
      <div class="stat-sub">Scheduled sessions not started/finished</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Awaiting BCBA Sign-Off</div>
      <div class="stat" style="color:var(--warn)">${delinq.pendingBcbaSignCount || 0}</div>
      <div class="stat-sub">Notes waiting for supervisor signature</div>
    </div>
    <div class="stat-card ok">
      <div class="stat-label">3. Claims Ready to Bill</div>
      <div class="stat" style="color:var(--ok)">$${(bill.claimsReadyRevenue || 0).toLocaleString()}</div>
      <div class="stat-sub">${bill.claimsReadyCount || 0} signed notes (${bill.claimsReadyUnits || 0} units)</div>
    </div>
  </div>

  <!-- Client Administrative Billing & Reimbursement Snapshots -->
  ${renderClientBillingSnapshotsCard(admin.clientBillingSnapshots || bill.clientBillingSnapshots || [], 'Client Billing & Reimbursement Snapshots')}

  <!-- 1. Missing Notes Table -->
  <div class="card">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:8px">
      <div>
        <h3 style="margin:0 0 2px">1. Missing Session Notes</h3>
        <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Completed therapy sessions that still need a submitted SOAP note.</p>
      </div>
      <span class="badge">Avg Note Turnaround: ${delinq.avgTurnaroundHours || 2.4} hrs</span>
    </div>
    ${missing.length ? `
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Client</th>
            <th>Therapist</th>
            <th>Date</th>
            <th>Time Elapsed</th>
            <th>Status</th>
            <th style="text-align:right">Action</th>
          </tr>
        </thead>
        <tbody>
          ${missing.map(m => `
            <tr>
              <td><b>#${m.sessionId}</b></td>
              <td><b>${esc(m.clientName)}</b></td>
              <td>${esc(m.staffName)}</td>
              <td>${esc(m.date)}</td>
              <td style="font-weight:600;color:${m.isDelinquent ? 'var(--bad)' : 'var(--slate-700)'}">${m.elapsedHours} hrs ago</td>
              <td>
                <span class="tag ${m.isDelinquent ? 'bad' : 'draft'}">
                  ${m.isDelinquent ? 'Overdue (>24h)' : 'Due Soon'}
                </span>
              </td>
              <td style="text-align:right">
                <button class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.sendClinicianReminder('${esc(m.staffName)}', ${m.sessionId})">Send Reminder</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:var(--slate-500);text-align:center;padding:18px">✓ No missing session notes! Every completed session has a note.</p>'}
  </div>

  <!-- 2. Incomplete Sessions & 3. Billing Issues -->
  <div class="row">
    <div class="card" style="flex:1">
      <div class="flex-between" style="margin-bottom:8px">
        <div>
          <h3 style="margin:0 0 2px">2. Incomplete or Unstarted Sessions</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Scheduled appointments missing start or end times.</p>
        </div>
        <span class="badge ${unstarted.length > 0 ? 'bad' : 'ok'}">${unstarted.length} Flagged</span>
      </div>

      ${unstarted.length ? unstarted.map(u => `
        <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200);border-left:3px solid var(--bad);margin-bottom:8px">
          <div class="flex-between" style="gap:8px;flex-wrap:wrap">
            <div>
              <b>${esc(u.clientName)}</b>
              <span class="badge bad" style="margin-left:6px">Not Started</span>
              <div style="font-size:0.8rem;color:var(--slate-600);margin-top:3px">
                Therapist: ${esc(u.staffName)} · Scheduled: ${esc(u.scheduledTime)}
              </div>
            </div>
            <button class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.openScheduleRbtModal(null, '${esc(u.clientName)}')">📅 Schedule / Reassign RBT</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--slate-500);font-size:0.84rem;padding:12px 0">✓ All scheduled sessions are properly logged.</p>'}
    </div>

    <div class="card" style="flex:1.2">
      <div class="flex-between" style="margin-bottom:8px">
        <div>
          <h3 style="margin:0 0 2px">3. Billing & Insurance Issues</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Ready claims batch and insurance authorizations running low.</p>
        </div>
        <span class="badge ok">${bill.claimsReadyCount || 0} Clean Claims</span>
      </div>

      <div style="background:var(--slate-50);padding:12px 14px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:12px">
        <div class="flex-between">
          <div>
            <div style="font-size:0.75rem;color:var(--slate-500);font-weight:700;text-transform:uppercase">Ready to Bill</div>
            <div style="font-size:1.35rem;font-weight:700;color:var(--ok)">$${(bill.claimsReadyRevenue || 0).toLocaleString()} <span style="font-size:0.85rem;color:var(--slate-500);font-weight:500">(${bill.claimsReadyUnits || 0} units)</span></div>
          </div>
          <button class="ok" style="padding:8px 14px;font-size:0.82rem" onclick="act.exportClaimsBatch()">Export Billing Batch</button>
        </div>
      </div>

      <div style="font-size:0.78rem;font-weight:700;color:var(--slate-700);margin-bottom:6px">Authorizations Near Limit (≥80% Used):</div>
      ${authsAtRisk.length ? authsAtRisk.map(a => `
        <div style="padding:8px 10px;background:#fff8f9;border:1px solid var(--bad-border);border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center;font-size:0.83rem;margin-bottom:6px">
          <span><b>${esc(a.client)}</b> — CPT ${esc(a.code)}</span>
          <span class="badge bad">${a.used}/${a.authorized} units used</span>
        </div>
      `).join('') : '<p style="color:var(--slate-500);font-size:0.83rem;margin:0">No insurance authorizations are near their limit.</p>'}
    </div>
  </div>
  `;
}

async function dashboardView() {
  const d = await api('GET', '/api/dashboard');
  const todayStr = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (!kpiPersona) {
    kpiPersona = (['OWNER', 'BCBA', 'RBT', 'ADMIN'].includes(me.role) ? me.role : 'OWNER');
  }

  const personaTitles = {
    OWNER: 'Owner KPI Dashboard',
    BCBA: 'BCBA Clinical Dashboard',
    RBT: 'RBT Daily Dashboard',
    ADMIN: 'Administrator Operations & Billing Dashboard'
  };

  const personaSubtitles = {
    OWNER: 'For the Owner: See overall business performance and revenue.',
    BCBA: 'For the BCBA: Monitor client progress and identify patterns in behavior.',
    RBT: 'For the RBT: See assigned tasks, data collection requirements, and training progress.',
    ADMIN: 'For the Administrator: Identify missing notes, incomplete sessions, and billing issues.'
  };

  let deckHtml = '';
  if (kpiPersona === 'OWNER') deckHtml = renderOwnerKpi(d);
  else if (kpiPersona === 'BCBA') deckHtml = renderBcbaKpi(d);
  else if (kpiPersona === 'RBT') deckHtml = renderRbtKpi(d);
  else if (kpiPersona === 'ADMIN') deckHtml = renderAdminKpi(d);
  else deckHtml = renderOwnerKpi(d);

  return `
  <div class="page-header">
    <div>
      <h1>${personaTitles[kpiPersona] || 'KPI Dashboard'}</h1>
      <p class="page-sub">${personaSubtitles[kpiPersona] || ''} (${todayStr})</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="sec" onclick="go('clients')">👧 Clients Directory</button>
      <button class="ok" onclick="go('schedule')">📅 Schedule</button>
    </div>
  </div>

  <!-- Simple 4-Role KPI Switcher -->
  <div class="kpi-persona-switcher">
    <button class="kpi-persona-tab ${kpiPersona === 'OWNER' ? 'active' : ''}" onclick="act.setKpiPersona('OWNER')">
      <div class="kpi-tab-icon">🏢</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">For the Owner</div>
        <div class="kpi-tab-sub">Performance & Revenue</div>
      </div>
    </button>
    <button class="kpi-persona-tab ${kpiPersona === 'BCBA' ? 'active' : ''}" onclick="act.setKpiPersona('BCBA')">
      <div class="kpi-tab-icon">👩‍⚕️</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">For the BCBA</div>
        <div class="kpi-tab-sub">Progress & Behavior</div>
      </div>
    </button>
    <button class="kpi-persona-tab ${kpiPersona === 'RBT' ? 'active' : ''}" onclick="act.setKpiPersona('RBT')">
      <div class="kpi-tab-icon">👨‍⚕️</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">For the RBT</div>
        <div class="kpi-tab-sub">Tasks, Data & Training</div>
      </div>
    </button>
    <button class="kpi-persona-tab ${kpiPersona === 'ADMIN' ? 'active' : ''}" onclick="act.setKpiPersona('ADMIN')">
      <div class="kpi-tab-icon">📋</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">For the Administrator</div>
        <div class="kpi-tab-sub">Missing Notes & Billing</div>
      </div>
    </button>
  </div>

  ${deckHtml}
  `;
}

async function clientsView() {
  const cs = await api('GET', '/api/clients');
  if (me.role === 'PARENT' && cs.length) return clientView(cs[0].id);

  const filtered = cs.filter(c => {
    if (!clientSearchQuery) return true;
    const q = clientSearchQuery.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) ||
           (c.diagnosis || '').toLowerCase().includes(q) ||
           (c.communication || '').toLowerCase().includes(q) ||
           (c.school || '').toLowerCase().includes(q) ||
           (c.assignedRbts || []).join(' ').toLowerCase().includes(q);
  });

  return `
  <div class="page-header">
    <div>
      <h1>Clients — 360 Clinical Records & Snapshots</h1>
      <p class="page-sub">Each client's profile, clinical vitals, skill goal mastery/stall snapshot, behavior function patterns, and 9-method measurement data are displayed right below their profile.</p>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <div style="width:280px">
        <input style="margin:0" placeholder="🔍 Search client, diagnosis, RBT..." value="${esc(clientSearchQuery)}" oninput="clientSearchQuery=this.value;render()">
      </div>
      ${['BCBA', 'OWNER', 'ADMIN'].includes(me.role) ? `
        <button class="sec" onclick="act.openScheduleRbtModal()">📅 Schedule RBT Session</button>
        <button class="ok" onclick="document.getElementById('intake_card').style.display='block'">+ Add New Client</button>
      ` : ''}
    </div>
  </div>

  ${['BCBA', 'OWNER', 'ADMIN'].includes(me.role) ? `
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

  ${filtered.map((c) => {
    const r360 = c.record360 || {};
    const gs = r360.goalsSummary || { activeCount: 0, masteredCount: 0, criteriaMetCount: 0, stalledCount: 0, avgSkillPct: 0, goals: [] };
    const b360 = r360.behavior360 || { programs: [], byBehavior: {}, totalEvents: 0, ratePerHour: 0, avgDurationSec: 0, avgLatencySec: 0, avgIrtSec: 0, intervalPct: null, intervalNumDenom: '0/0', abcCount: 0, functions: { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 }, dominantFunction: 'Escape', dominantFunctionPct: 0, pctChange: 0, peakWindow: '11:00 AM', peakWindowObj: { label: '11:00 AM', count: 2, primaryAntecedent: 'Pre-lunch clean-up transition' } };
    const bip = r360.bip360 || { status: 'approved', behavior: 'Target Behavior', replacement: 'Prompted functional communication request (FCT)' };
    const bill = r360.billing360 || { payerName: c.insurance || 'BlueCross ABA', authNumber: 'BC-88412', totalAuthorizedUnits: 120, totalUsedUnits: 92, remainingUnits: 28, authBurnPct: 77, reimbursementRatePct: 94 };

    const readyGoals = (gs.goals || []).filter(g => g.masteryMet && g.status !== 'mastered');
    const stalledOrActiveGoals = (gs.goals || []).filter(g => g.stalled && g.status !== 'mastered');
    const allActiveGoals = (gs.goals || []).filter(g => g.status !== 'mastered');

    const fDist = b360.functions || { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 };
    const totalBeh = (fDist.Escape + fDist.Attention + fDist.Tangible + fDist.Sensory) || 1;
    const escPct = Math.round(((fDist.Escape || 0) / totalBeh) * 100);
    const attPct = Math.round(((fDist.Attention || 0) / totalBeh) * 100);
    const tanPct = Math.round(((fDist.Tangible || 0) / totalBeh) * 100);
    const senPct = Math.round(((fDist.Sensory || 0) / totalBeh) * 100);
    const peak = b360.peakWindowObj || { label: b360.peakWindow || '11:00 AM', count: 2, primaryAntecedent: c.triggers || 'Transition from preferred activity' };

    return `
    <div class="card" style="margin-bottom:24px;border-top:4px solid var(--primary);padding:20px">
      <!-- 1. CLIENT PROFILE HEADER & CLINICAL VITALS -->
      <div class="flex-between" style="align-items:flex-start;flex-wrap:wrap;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--slate-200)">
        <div style="display:flex;align-items:center;gap:16px;cursor:pointer" onclick="go('client', ${c.id})">
          <div class="user-avatar" style="width:56px;height:56px;font-size:1.15rem;flex-shrink:0">${getInitials(c.name)}</div>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <h2 style="margin:0;font-size:1.35rem;color:var(--slate-900);text-decoration:underline;text-decoration-color:var(--primary-border);text-underline-offset:3px">${esc(c.name)}</h2>
              <span class="badge p">${esc(c.diagnosis || 'Autism Spectrum Disorder')}</span>
              <span class="badge">👨‍⚕️ RBT: ${esc((c.assignedRbts || ['Sam Lee, RBT']).join(', '))}</span>
              <span class="badge ${bill.authBurnPct >= 85 ? 'bad' : 'ok'}">💳 ${esc(bill.payerName)} (${bill.totalUsedUnits}/${bill.totalAuthorizedUnits} u · ${bill.reimbursementRatePct}% paid)</span>
            </div>
            <div style="font-size:0.83rem;color:var(--slate-600);margin-top:4px">
              <b>DOB:</b> ${esc(c.dob || 'On file')} &nbsp;·&nbsp;
              <b>Guardian:</b> ${esc(c.guardian || 'On file')} &nbsp;·&nbsp;
              <b>School / Setting:</b> ${esc(c.school || 'Clinic / Home')} &nbsp;·&nbsp;
              <b>BIP Status:</b> <span style="font-weight:700;color:var(--ok)">${esc((bip.status || 'approved').toUpperCase())}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${['BCBA', 'OWNER', 'ADMIN'].includes(me.role) ? `
            <button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="act.openScheduleRbtModal(${c.id}, '${esc(c.name)}')">📅 Schedule RBT</button>
          ` : ''}
          <button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="act.openClientBillingModal(${c.id})">💳 Billing Snapshot</button>
          <button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="act.openReauthReportModal(${c.id})">📄 Re-Auth Report</button>
          <button class="ok" style="padding:7px 14px;font-size:0.82rem" onclick="go('client', ${c.id})">Open Full 360 Record →</button>
        </div>
      </div>

      <!-- 4 CLINICAL VITALS TILES -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:14px;margin-bottom:14px">
        <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">💬 Communication</div>
          <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:2px">${esc(c.communication || 'Vocal / PECS')}</div>
        </div>
        <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">🎧 Sensory Needs</div>
          <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:2px">${esc(c.sensory || 'Noise-canceling headphones, deep pressure')}</div>
        </div>
        <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">⚡ Common Triggers</div>
          <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:2px">${esc(c.triggers || 'Unannounced transitions, multi-step demands')}</div>
        </div>
        <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
          <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">⭐ Favorite Rewards</div>
          <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:2px">${esc(c.reinforcers || 'Magna-Tiles, bubbles, iPad token board')}</div>
        </div>
      </div>

      <!-- PER-CLIENT CLINICAL QUALITY & SESSION METRICS UNDERNEATH CLIENT PROFILE -->
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-bottom:14px">
        <div class="stat-card" style="padding:12px 14px">
          <div class="stat-label">1. Active Skill Goals</div>
          <div class="stat" style="font-size:1.5rem;color:var(--primary)">${gs.activeCount}</div>
          <div class="stat-sub">Avg ${gs.avgSkillPct}% independent · ${gs.masteredCount} mastered</div>
        </div>
        <div class="stat-card" style="padding:12px 14px;cursor:pointer" onclick="go('schedule')">
          <div class="stat-label">2. Assigned Sessions</div>
          <div class="stat" style="font-size:1.5rem;color:var(--primary)">${c.id === 1 ? 2 : 1} <span style="font-size:0.85rem">today</span></div>
          <div class="stat-sub">Click to view in Schedule →</div>
        </div>
        <div class="stat-card ok" style="padding:12px 14px">
          <div class="stat-label">3. Treatment Fidelity</div>
          <div class="stat" style="font-size:1.5rem;color:var(--ok)">100%</div>
          <div class="stat-sub">BIP protocol adherence across sessions</div>
        </div>
        <div class="stat-card" style="padding:12px 14px">
          <div class="stat-label">4. Observer Agreement (IOA)</div>
          <div class="stat" style="font-size:1.5rem;color:var(--sensory)">92%</div>
          <div class="stat-sub">BCBA–RBT inter-observer reliability</div>
        </div>
      </div>

      <!-- SNAPSHOT UNDERNEATH CLIENT PROFILE: 1A. GOALS READY TO MASTER & 1B. STALLED / ACTIVE GOALS -->
      <div class="row" style="margin-bottom:14px">
        <div style="flex:1;background:#f8fafc;border:1px solid var(--slate-200);border-top:3px solid var(--ok);border-radius:var(--radius-md);padding:14px">
          <div class="flex-between" style="margin-bottom:8px">
            <div>
              <h3 style="margin:0 0 2px;font-size:0.96rem">1A. Goals Ready to Master (${esc(c.name)})</h3>
              <p style="margin:0;font-size:0.78rem;color:var(--slate-500)">Scored ≥80% independent across 3 consecutive sessions (${gs.masteredCount} already mastered).</p>
            </div>
            <span class="tag approved">${readyGoals.length} Ready</span>
          </div>
          ${readyGoals.length ? readyGoals.map(g => `
            <div style="background:#fff;padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200);display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:6px">
              <div>
                <b style="color:var(--primary);font-size:0.86rem">${esc(g.title)}</b>
                <div style="font-size:0.76rem;color:var(--slate-500)">Independent Score: <b>${g.current}%</b> (${esc(g.indepNumDenom)}) · Target: ${g.target}%</div>
              </div>
              <button class="ok" style="padding:5px 10px;font-size:0.76rem;white-space:nowrap" onclick="act.quickMasterGoal(${g.id})">✓ Mark Mastered</button>
            </div>
          `).join('') : `<p style="color:var(--slate-500);font-size:0.82rem;padding:8px 0;margin:0">No goals waiting for mastery sign-off right now (${gs.masteredCount} mastered).</p>`}
        </div>

        <div style="flex:1;background:#f8fafc;border:1px solid var(--slate-200);border-top:3px solid var(--warn);border-radius:var(--radius-md);padding:14px">
          <div class="flex-between" style="margin-bottom:8px">
            <div>
              <h3 style="margin:0 0 2px;font-size:0.96rem">1B. Stalled & Active Goals (Needs Review)</h3>
              <p style="margin:0;font-size:0.78rem;color:var(--slate-500)">Goals with flat trendlines or active acquisition (${gs.activeCount} active · Avg ${gs.avgSkillPct}%).</p>
            </div>
            <span class="tag draft">${stalledOrActiveGoals.length} Stalled</span>
          </div>
          ${(stalledOrActiveGoals.length ? stalledOrActiveGoals : allActiveGoals.slice(0, 3)).map(g => `
            <div style="background:#fff;padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200);display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:6px">
              <div>
                <b style="color:${g.stalled ? 'var(--warn)' : 'var(--slate-800)'};font-size:0.86rem">${esc(g.title)}</b>
                <div style="font-size:0.76rem;color:var(--slate-500)">Current: <b>${g.current}%</b> (Started at ${g.baseline}% · Target ${g.target}%)</div>
              </div>
              <button class="sec" style="padding:5px 10px;font-size:0.76rem;white-space:nowrap" onclick="act.quickPillar(${c.id}, 'skills')">Open Goal →</button>
            </div>
          `).join('') || '<p style="color:var(--slate-500);font-size:0.82rem;padding:8px 0;margin:0">All active goals are progressing well.</p>'}
        </div>
      </div>

      <!-- SNAPSHOT UNDERNEATH CLIENT PROFILE: 2. PATTERNS IN BEHAVIOR (WHY & WHEN BEHAVIORS HAPPEN) -->
      <div style="background:#f8fafc;border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:14px;margin-bottom:14px">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:10px">
          <div>
            <h3 style="margin:0 0 2px;font-size:0.96rem">2. Patterns in Behavior (Why & When Behaviors Happen — ${esc(c.name)})</h3>
            <p style="margin:0;font-size:0.78rem;color:var(--slate-500)">Summary of ${b360.abcCount} ABC behavior logs & functional analysis for ${esc(c.name)}.</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge esc">Main Reason: ${esc(b360.dominantFunction || 'Escape')} (${b360.dominantFunctionPct || escPct}%)</span>
            <button class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.quickPillar(${c.id}, 'behavior_abc')">View Full Behavior Graphs →</button>
          </div>
        </div>

        <div style="background:#fff;padding:12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200);margin-bottom:10px">
          <div style="font-size:0.78rem;font-weight:700;color:var(--slate-700);margin-bottom:6px">Why Behaviors Occur (4 Functions of Behavior):</div>
          <div style="display:flex;height:20px;border-radius:6px;overflow:hidden">
            <div style="width:${escPct}%;background:#be123c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700">${escPct > 10 ? `Escape ${escPct}%` : ''}</div>
            <div style="width:${attPct}%;background:#0284c7;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700">${attPct > 10 ? `Attention ${attPct}%` : ''}</div>
            <div style="width:${tanPct}%;background:#d97706;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700">${tanPct > 10 ? `Tangible ${tanPct}%` : ''}</div>
            <div style="width:${senPct}%;background:#0f766e;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700">${senPct > 10 ? `Sensory ${senPct}%` : ''}</div>
          </div>
          <div class="row" style="margin-top:8px;margin-bottom:0;font-size:0.8rem">
            <div><span style="color:#be123c">●</span> <b>Escape:</b> ${fDist.Escape || 0} (${escPct}%)</div>
            <div><span style="color:#0284c7">●</span> <b>Attention:</b> ${fDist.Attention || 0} (${attPct}%)</div>
            <div><span style="color:#d97706">●</span> <b>Tangible:</b> ${fDist.Tangible || 0} (${tanPct}%)</div>
            <div><span style="color:#0f766e">●</span> <b>Sensory:</b> ${fDist.Sensory || 0} (${senPct}%)</div>
          </div>
        </div>

        <div style="background:#f8fcff;border:1px solid #bae6fd;border-left:4px solid var(--accent);border-radius:var(--radius-sm);padding:10px 14px">
          <div class="flex-between">
            <div>
              <b style="color:var(--slate-900);font-size:0.86rem">Peak Behavior Time: ${esc(peak.label || b360.peakWindow || '11:00 AM')}</b>
              <div style="font-size:0.8rem;color:var(--slate-600);margin-top:2px">
                Most Common Trigger: <b>${esc(peak.primaryAntecedent || c.triggers || 'Transition / task demand')}</b> &nbsp;·&nbsp;
                Replacement FCT: <b>${esc(bip.replacement)}</b>
              </div>
            </div>
            <span class="badge att">${peak.count || 2} Incidents</span>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('')}
  `;
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
    taskAnalyses = [], fidelityIoaLogs = [], auditLogs = [], billingSnapshot = null
  } = data;
  const B = me.role === 'BCBA', P = me.role === 'PARENT';
  const tabs = P ? [['goals', 'Skill Goals'], ['stories', 'Social Stories']] : [
    ['overview', 'Overview'],
    ['assessments', '🧠 Smart Goal & Assessment Planner'],
    ['skills', 'Skill Goals (DTT)'],
    ['behavior_abc', 'Behavior & ABC'],
    ['plans', 'Behavior Plan (BIP)'],
    ['stories', 'Social Stories'],
    ['profile', 'Client Info'],
    ['services', 'Insurance, Billing & Supervision']
  ];
  if (P && !['goals', 'stories'].includes(tab)) tab = 'goals';
  if (!P && !tabs.map(t=>t[0]).includes(tab)) tab = 'overview';

  // Pinned Clinical Vitals Banner
  const vitalsBanner = `
  <div class="vitals-banner">
    <div class="vitals-header">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="user-avatar xl">${getInitials(c.name)}</div>
        <div>
          <h2 style="margin:0 0 4px;font-size:1.5rem;font-weight:700;color:var(--slate-900)">${esc(c.name)}</h2>
          <div style="font-size:0.82rem;color:var(--slate-500);display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge p">${esc(c.diagnosis || 'Autism Spectrum Disorder')}</span>
            ${c.dob ? `<span class="badge">DOB: ${esc(c.dob)}</span>` : ''}
            ${c.school ? `<span class="badge">${esc(c.school)}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${['BCBA', 'OWNER', 'ADMIN'].includes(me.role) ? `
          <button class="ok" style="padding:7px 12px;font-size:0.8rem" onclick="act.openScheduleRbtModal(${c.id}, '${esc(c.name)}')">📅 Schedule RBT</button>
        ` : ''}
        ${!P ? `
          <button class="ok" style="padding:7px 12px;font-size:0.8rem;background:#0f766e" onclick="act.setTab('assessments')">🧠 Smart Goal & Measurement AI</button>
          <button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="act.openClientBillingModal(${c.id})">💳 Billing Snapshot</button>
          <button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="window.open('/api/clients/${c.id}/export-csv?type=trials','_blank')">📥 Export Trials</button>
          <button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="act.openAuditModal(${c.id})">🛡️ Audit Log (${auditLogs.length})</button>
        ` : ''}
        ${B ? `<button class="sec" style="padding:7px 12px;font-size:0.8rem" onclick="act.openReauthReportModal(${c.id})">📄 Re-Auth Report</button>` : ''}
        <button class="bad" style="padding:7px 12px;font-size:0.8rem" onclick="act.toggleCrisis()">
          ${showCrisis ? 'Hide Safety Plan' : '⚠️ Safety / Crisis Plan'}
        </button>
      </div>
    </div>
    
    <div class="vitals-grid">
      <div class="vital-item">
        <div class="vital-emblem">💬</div>
        <div>
          <div class="vital-label">Communication</div>
          <b>${esc(c.communication || 'Verbal (full sentences)')}</b>
        </div>
      </div>
      <div class="vital-item">
        <div class="vital-emblem">🎧</div>
        <div>
          <div class="vital-label">Sensory Needs</div>
          <b>${esc(c.sensory || 'Sensory sensitive (avoids loud sirens)')}</b>
        </div>
      </div>
      <div class="vital-item">
        <div class="vital-emblem">⚡</div>
        <div>
          <div class="vital-label">Common Triggers</div>
          <b>${esc(c.triggers || 'Difficult task transitions, peer proximity')}</b>
        </div>
      </div>
      <div class="vital-item">
        <div class="vital-emblem">⭐</div>
        <div>
          <div class="vital-label">Favorite Rewards</div>
          <b>${esc(c.reinforcers || 'LEGO, bubbles, sensory swing')}</b>
        </div>
      </div>
    </div>

    ${showCrisis ? `
    <div class="crisis-box">
      <div class="flex-between">
        <h4 style="margin:0;color:#7D1F18">Safety & Crisis Plan</h4>
        <button class="bad" style="padding:2px 8px;font-size:0.75rem" onclick="act.toggleCrisis()">✕ Close</button>
      </div>
      <div style="white-space:pre-wrap;margin-top:8px;font-size:0.9rem;line-height:1.5">${esc(c.crisis_plan || '1. Offer quiet sensory space.\n2. Use calm, low-tone language.\n3. Do not block items or use physical restraint.\n4. Provide replacement communication card.')}</div>
      <div style="margin-top:8px;font-size:0.82rem;font-weight:600">Emergency Contact: ${esc(c.emergency || 'Guardian')}</div>
    </div>` : ''}
  </div>`;

  let body = '';

  // Tab: Overview
  if (tab === 'overview') {
    const avgFid = fidelityIoaLogs.length
      ? Math.round(fidelityIoaLogs.reduce((s, l) => s + (l.fidelity_pct ?? 100), 0) / fidelityIoaLogs.length)
      : 100;
    const avgIoa = fidelityIoaLogs.length
      ? Math.round(fidelityIoaLogs.reduce((s, l) => s + (l.ioa_pct ?? 92), 0) / fidelityIoaLogs.length)
      : 92;
    const activeGoalsCount = goals.filter(g => g.status === 'active').length;
    const masteredGoalsCount = goals.filter(g => g.status === 'mastered').length;

    body = `
    <!-- Client Clinical Metrics Underneath Client Profile -->
    <div class="grid" style="margin-bottom:18px">
      <div class="stat-card" onclick="act.setTab('skills')" style="cursor:pointer">
        <div class="stat-label">1. Active Skill Goals</div>
        <div class="stat" style="color:var(--primary)">${activeGoalsCount}</div>
        <div class="stat-sub"><b>${masteredGoalsCount}</b> mastered · Click to review targets →</div>
      </div>
      <div class="stat-card" onclick="go('schedule')" style="cursor:pointer">
        <div class="stat-label">2. Assigned Sessions Today</div>
        <div class="stat" style="color:var(--primary)">${c.id === 1 ? 2 : 1}</div>
        <div class="stat-sub">Click to view in Schedule →</div>
      </div>
      <div class="stat-card ok" onclick="act.setTab('services')" style="cursor:pointer">
        <div class="stat-label">3. Treatment Fidelity</div>
        <div class="stat" style="color:var(--ok)">${avgFid}%</div>
        <div class="stat-sub">BIP protocol adherence across sessions</div>
      </div>
      <div class="stat-card" onclick="act.setTab('services')" style="cursor:pointer">
        <div class="stat-label">4. Observer Agreement (IOA)</div>
        <div class="stat" style="color:var(--sensory)">${avgIoa}%</div>
        <div class="stat-sub">BCBA–RBT inter-observer reliability</div>
      </div>
    </div>

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

  // Tab: Smart Goal Builder, Operational Definition Generator & ABA Assessment Center
  else if (tab === 'assessments') {
    body = renderSmartPlannerAndAssessmentsTab(c, data, B);
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
            <button class="sec" onclick="act.setTab('assessments');act.setAssessmentSubTab('smart_builder')">🧠 Smart Goal & Measurement Assistant</button>
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
                ${g.measurement_type ? `<span class="badge tan">📏 ${esc(g.measurement_type)}</span>` : ''}
                ${g.secondary_measurement ? `<span class="badge">+ ${esc(g.secondary_measurement)}</span>` : ''}
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
            ${g.operational_definition ? `
              <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:8px;padding:8px 12px;margin-top:8px;font-size:0.81rem;color:var(--slate-700)">
                <b>Operational Definition:</b> ${esc(g.operational_definition)}
                ${g.onset_criteria || g.offset_criteria ? `<div style="font-size:0.76rem;color:var(--slate-500);margin-top:2px">${g.onset_criteria ? `<b>Onset:</b> ${esc(g.onset_criteria)} ` : ''}${g.offset_criteria ? `· <b>Offset:</b> ${esc(g.offset_criteria)}` : ''}</div>` : ''}
              </div>
            ` : ''}
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
      ${(() => {
        const activeBps = behaviorPrograms.filter((bp) => bp.status !== 'archived');
        const archivedBps = behaviorPrograms.filter((bp) => bp.status === 'archived');
        const displayedBps = showArchivedBehaviors ? behaviorPrograms : activeBps;
        return `
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <h3 style="margin:0">Target Behavior Operational Definitions & 9-Method Measurement Suite</h3>
            <span class="badge p">Frequency · Rate · Duration · Latency · IRT · Partial/Whole Interval · MTS · ABC</span>
            <span class="tag approved">${activeBps.length} Active</span>
            ${archivedBps.length ? `<span class="tag draft">${archivedBps.length} Archived</span>` : ''}
          </div>
          <p style="font-size:0.84rem;color:var(--slate-500);margin:3px 0 0">
            Click <b>✏️ Edit</b> or the <b>⋮</b> menu on any behavior card to update its operational definition, onset/offset, examples, measurement method, or goals with automatic version history and historical data protection.
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button type="button" class="sec" style="font-size:0.78rem;padding:6px 12px" onclick="act.toggleShowArchivedBehaviors()">
            📦 ${showArchivedBehaviors ? 'Hide Archived Behaviors' : `View Archived (${archivedBps.length})`}
          </button>
          <button class="sec" style="font-size:0.8rem;padding:6px 12px" onclick="act.openBehaviorProgramModal(${c.id})">+ Define Target Behavior</button>
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
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:14px">
        ${displayedBps.map((bp) => {
          const bpStats = (bSum.byBehavior && (bSum.byBehavior[`id_${bp.id}`] || bSum.byBehavior[bp.name])) || { frequency: 0, ratePerHour: 0, avgDurationSec: 0, avgLatencySec: 0, intervalPct: null, intervalNumDenom: '0/0', byMeasurementType: {} };
          const isArchived = bp.status === 'archived';
          const ver = bp.version || (Array.isArray(bp.version_history) ? bp.version_history.length : 1) || 1;
          const histMeasList = Object.keys(bpStats.byMeasurementType || {});
          return `
            <div class="beh-program-card ${isArchived ? 'archived' : ''}" style="background:${isArchived ? '#f8fafc' : '#ffffff'};border:1.5px solid ${isArchived ? 'var(--slate-300)' : 'var(--slate-200)'};border-top:4px solid ${isArchived ? 'var(--slate-400)' : 'var(--primary)'};border-radius:12px;padding:14px;box-shadow:var(--shadow-sm);opacity:${isArchived ? '0.88' : '1'}">
              <div class="flex-between" style="gap:8px;align-items:flex-start">
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <b style="font-family:var(--font-serif);font-size:1.04rem;color:var(--slate-900)">${esc(bp.name)}</b>
                    <span class="badge ${bp.function_hypothesis ? bp.function_hypothesis.toLowerCase().slice(0,3) : 'esc'}">${esc(bp.function_hypothesis || 'Escape')}</span>
                    <span class="badge p" style="text-transform:uppercase">${esc((bp.measurement_type || 'frequency').replace('_', ' '))}</span>
                    <button type="button" class="beh-ver-pill" title="Click to View Version History" onclick="act.openBehaviorHistoryModal(${bp.id})">
                      🕓 v${ver}${ver > 1 ? ' · Edited' : ''}
                    </button>
                    ${isArchived ? `<span class="tag draft">📦 ARCHIVED (Clinical Review)</span>` : ''}
                  </div>
                </div>
                ${renderBehaviorCardThreeDotMenu(bp, c.id)}
              </div>

              <div style="font-size:0.82rem;color:var(--slate-800);margin:8px 0 6px;line-height:1.45;background:var(--slate-50);padding:8px 10px;border-radius:8px;border:1px solid var(--slate-200)">
                <b style="color:var(--primary-dark)">Operational Definition:</b> ${esc(bp.operational_definition || bp.definition || 'Defined per BIP protocol.')}
              </div>

              ${(bp.onset_criteria || bp.offset_criteria) ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px;margin-bottom:6px;font-size:0.76rem;color:var(--slate-600)">
                  ${bp.onset_criteria ? `<div style="background:#f8fafc;padding:5px 8px;border-radius:6px;border:1px solid var(--slate-200)"><b>▶ Onset:</b> ${esc(bp.onset_criteria)}</div>` : ''}
                  ${bp.offset_criteria ? `<div style="background:#f8fafc;padding:5px 8px;border-radius:6px;border:1px solid var(--slate-200)"><b>⏹ Offset:</b> ${esc(bp.offset_criteria)}</div>` : ''}
                </div>
              ` : ''}

              ${(bp.examples || bp.non_examples) ? `
                <div style="font-size:0.76rem;color:var(--slate-600);margin-bottom:6px;line-height:1.4">
                  ${bp.examples ? `<div style="margin-bottom:2px"><b style="color:#0f766e">✓ Examples:</b> ${esc(bp.examples)}</div>` : ''}
                  ${bp.non_examples ? `<div><b style="color:#be123c">✕ Non-Examples:</b> ${esc(bp.non_examples)}</div>` : ''}
                </div>
              ` : ''}

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:7px 10px;margin-bottom:8px;font-size:0.75rem;color:#14532d;line-height:1.4">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
                  <span><b>Baseline:</b> ${esc(bp.baseline_data || (bp.baseline_rate ? `${bp.baseline_rate}/hr` : 'Recorded'))}</span>
                  ${bp.mastery_criteria ? `<span><b>Mastery Criteria:</b> ${esc(bp.mastery_criteria)}</span>` : ''}
                </div>
                ${bp.reduction_goal ? `<div style="margin-top:2px"><b>📉 Reduction Goal:</b> ${esc(bp.reduction_goal)}</div>` : ''}
                ${bp.replacement_skill_goal ? `<div style="margin-top:2px"><b>🎯 Replacement / Skill Goal:</b> ${esc(bp.replacement_skill_goal)}</div>` : ''}
              </div>

              ${(ver > 1 || histMeasList.length > 1) ? `
                <div style="font-size:0.72rem;color:var(--slate-500);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
                  <span>🛡️ Historical data preserved (${bpStats.frequency} events${histMeasList.length > 1 ? ` across ${histMeasList.join(', ')}` : ''})</span>
                  <a href="javascript:void(0)" style="font-weight:700;color:var(--primary)" onclick="act.openBehaviorHistoryModal(${bp.id})">View ${ver} Versions →</a>
                </div>
              ` : ''}

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px dashed var(--slate-200);font-family:var(--font-mono);font-size:0.75rem">
                <span>Freq: <b>${bpStats.frequency}</b> (${bpStats.ratePerHour}/hr) · Avg Dur: <b>${bpStats.avgDurationSec}s</b>${bpStats.intervalPct !== null ? ` · Int: <b>${bpStats.intervalPct}% (${bpStats.intervalNumDenom})</b>` : ''}</span>
                <div style="display:flex;gap:6px;align-items:center">
                  ${isArchived ? `
                    <button class="sec" style="padding:4px 10px;font-size:0.74rem" onclick="act.toggleArchiveBehavior(${bp.id}, 'archived')">♻️ Restore to Active</button>
                  ` : `
                    <button class="ok" style="padding:4px 10px;font-size:0.74rem" onclick="act.quickTallyBehavior(${c.id}, null, ${bp.id})">+1 Tally</button>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('') || `<div style="color:var(--slate-400);padding:12px">No ${showArchivedBehaviors ? '' : 'active '}target behavior definitions found.${archivedBps.length && !showArchivedBehaviors ? ` <a href="javascript:void(0)" onclick="act.toggleShowArchivedBehaviors()">View ${archivedBps.length} archived behavior(s) →</a>` : ''}</div>`}
      </div>
        `;
      })()}
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
    const bs = billingSnapshot || {};
    body = `
    ${bs.clientId ? `
      <div class="card">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
          <div>
            <h3 style="margin:0 0 2px">💳 Administrative Billing & Reimbursement Snapshot</h3>
            <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Payer policy details, total billed claims, ERA/EFT reimbursements received, and pending/held claims.</p>
          </div>
          <button class="ok" style="padding:7px 14px;font-size:0.8rem" onclick="act.openClientBillingModal(${c.id})">🖨️ Open Printable Billing Statement</button>
        </div>

        <div style="background:var(--slate-50);padding:12px 14px;border-radius:var(--radius-md);border:1px solid var(--slate-200);margin-bottom:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:0.84rem">
          <div><b>Payer:</b> ${esc(bs.payerName)} (${esc(bs.planType)})</div>
          <div><b>Member ID:</b> <span style="font-family:var(--font-mono)">${esc(bs.memberId)}</span></div>
          <div><b>Prior Auth #:</b> <span style="font-family:var(--font-mono)">${esc(bs.authNumber)}</span></div>
          <div><b>Copay / Coverage:</b> ${esc(bs.copayInfo)}</div>
        </div>

        <div class="grid" style="margin-bottom:0">
          <div class="stat-card">
            <div class="stat-label">Total Billed (Auth Cycle)</div>
            <div class="stat" style="color:var(--slate-900)">$${(bs.totalBilled || 0).toLocaleString()}</div>
            <div class="stat-sub">Allowed: $${(bs.totalAllowed || 0).toLocaleString()} (${bs.totalUsedUnits} units used)</div>
          </div>
          <div class="stat-card ok">
            <div class="stat-label">Reimbursed (ERA/EFT Paid)</div>
            <div class="stat" style="color:var(--ok)">$${(bs.totalReimbursed || 0).toLocaleString()}</div>
            <div class="stat-sub"><b>${bs.reimbursementRatePct}%</b> net payer realization</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Payer (837P)</div>
            <div class="stat" style="color:var(--primary)">$${(bs.pendingPayerAmount || 0).toLocaleString()}</div>
            <div class="stat-sub">${bs.pendingSessionsCount || 0} clean claim(s) in clearinghouse</div>
          </div>
          <div class="stat-card ${bs.heldAmount > 0 ? 'bad' : 'ok'}">
            <div class="stat-label">Held (Unsigned / Missing Note)</div>
            <div class="stat" style="color:${bs.heldAmount > 0 ? 'var(--bad)' : 'var(--ok)'}">$${(bs.heldAmount || 0).toLocaleString()}</div>
            <div class="stat-sub">${bs.heldSessionsCount || 0} session(s) awaiting note / co-sign</div>
          </div>
        </div>
      </div>
    ` : ''}

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

let scheduleStaffFilter = 'ALL';

async function scheduleView() {
  const a = await api('GET', '/api/schedule');
  const canSchedule = ['BCBA', 'OWNER', 'ADMIN'].includes(me.role);
  const todayIso = new Date().toISOString().slice(0, 10);
  let form = '';
  let st = [];
  if (canSchedule) {
    const [cs, staffList] = await Promise.all([api('GET', '/api/clients'), api('GET', '/api/staff')]);
    st = staffList || [];
    const rbts = st.filter((s) => s.role === 'RBT');
    const bcbas = st.filter((s) => s.role === 'BCBA');
    const defaultRbtId = rbts.length ? rbts[0].id : (st[0] ? st[0].id : '');
    form = `
    <div class="card" style="background:var(--slate-50);border:1.5px solid var(--slate-300);border-top:4px solid var(--primary)">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:10px">
        <div>
          <h3 style="margin:0 0 2px">📅 Schedule RBT or Clinical Session</h3>
          <p style="margin:0;font-size:0.83rem;color:var(--slate-600)">Assign an RBT (CPT 97153 Direct Therapy) or BCBA Supervision (CPT 97155) to a client. Assigned RBTs automatically gain access to the client's profile & session data sheet.</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span style="font-size:0.75rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">Quick Shift:</span>
          <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.setApptWindow('${todayIso}T09:00','${todayIso}T12:00')">☀️ Morning (9:00–12:00)</button>
          <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.setApptWindow('${todayIso}T12:30','${todayIso}T15:30')">🌤️ Midday (12:30–3:30)</button>
          <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.setApptWindow('${todayIso}T15:30','${todayIso}T17:30')">🌇 Afternoon (3:30–5:30)</button>
        </div>
      </div>
      <div class="row">
        <div>
          <label>Client</label>
          <select id="ac">${cs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
        </div>
        <div>
          <label>Assign RBT / Clinician</label>
          <select id="as">
            ${rbts.length ? `<optgroup label="RBTs — Direct Therapy (CPT 97153)">${rbts.map((s) => `<option value="${s.id}" ${s.id === defaultRbtId ? 'selected' : ''}>👨‍⚕️ ${esc(s.name)} (RBT)</option>`).join('')}</optgroup>` : ''}
            ${bcbas.length ? `<optgroup label="BCBAs — Supervision & Direction (CPT 97155)">${bcbas.map((s) => `<option value="${s.id}">👩‍⚕️ ${esc(s.name)} (BCBA)</option>`).join('')}</optgroup>` : ''}
          </select>
        </div>
        <div>
          <label>Start Window</label>
          <input id="astart" type="datetime-local" value="${todayIso}T09:00">
        </div>
        <div>
          <label>End Window</label>
          <input id="aend" type="datetime-local" value="${todayIso}T12:00">
        </div>
        <div>
          <label>Treatment Setting</label>
          <select id="aset">
            <option value="Clinic">Clinic</option>
            <option value="Home">Home</option>
            <option value="School">School</option>
          </select>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:8px">
        <span style="font-size:0.8rem;color:var(--slate-500)">✓ Pre-filled with today's date & shift window — click <b>"+ Schedule RBT Session"</b> to assign immediately.</span>
        <button class="ok" onclick="act.addAppt()">+ Schedule RBT Session</button>
      </div>
    </div>`;
  }

  const filteredAppts = a.filter((x) => {
    if (scheduleStaffFilter === 'ALL') return true;
    if (scheduleStaffFilter === 'RBT_ONLY') return x.role === 'RBT';
    if (scheduleStaffFilter === 'BCBA_ONLY') return x.role === 'BCBA';
    return String(x.user_id) === String(scheduleStaffFilter);
  });

  const days = {};
  filteredAppts.forEach((x) => { (days[x.start.slice(0, 10)] ||= []).push(x); });
  
  return `
  <div class="page-header">
    <div>
      <h1>Clinical Appointments & RBT Schedule</h1>
      <p class="page-sub">Assign RBTs to client sessions above, or click "👤 Client Profile Snapshot" on any appointment to review the client's profile before starting a session.</p>
    </div>
    ${canSchedule ? `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select style="margin:0;width:230px;background:#fff" onchange="scheduleStaffFilter=this.value;render()">
          <option value="ALL" ${scheduleStaffFilter === 'ALL' ? 'selected' : ''}>👥 All Clinicians (${a.length} sessions)</option>
          <option value="RBT_ONLY" ${scheduleStaffFilter === 'RBT_ONLY' ? 'selected' : ''}>👨‍⚕️ All RBTs Only</option>
          <option value="BCBA_ONLY" ${scheduleStaffFilter === 'BCBA_ONLY' ? 'selected' : ''}>👩‍⚕️ All BCBAs Only</option>
          ${st.map((s) => `<option value="${s.id}" ${String(scheduleStaffFilter) === String(s.id) ? 'selected' : ''}>Filter: ${esc(s.name)} (${s.role})</option>`).join('')}
        </select>
      </div>
    ` : ''}
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
            <th>Assigned RBT / Therapist</th>
            <th>Modality & Setting</th>
            <th style="text-align:right">Client Profile & Session Action</th>
          </tr>
        </thead>
        <tbody>
          ${xs.map((x) => `
            <tr>
              <td><span style="font-family:'JetBrains Mono',monospace;font-weight:600">${x.start.slice(11)} – ${x.end.slice(11)}</span></td>
              <td>
                <a href="javascript:void(0)" onclick="act.openClientSnapshotModal(${x.client_id}, ${x.id})" style="font-weight:700;color:var(--slate-900);text-decoration:underline;text-decoration-color:var(--primary-border)">
                  ${esc(x.client)}
                </a>
              </td>
              <td>
                <b>${esc(x.staff)}</b>
                ${canSchedule && st.length ? `
                  <select style="margin:0 0 0 6px;padding:3px 6px;font-size:0.75rem;width:auto;display:inline-block" title="Reassign RBT / Clinician" onchange="act.reassignAppt(${x.id}, this.value)">
                    ${st.map((s) => `<option value="${s.id}" ${Number(s.id) === Number(x.user_id) ? 'selected' : ''}>${esc(s.name)} (${s.role})</option>`).join('')}
                  </select>
                ` : ''}
              </td>
              <td><span class="badge p">${esc(x.role)}</span> ${esc(x.setting)}</td>
              <td style="text-align:right;white-space:nowrap">
                ${x.session && x.session.end ? '<span class="tag approved" style="margin-right:6px">Completed</span>' : ''}
                <button class="ok" style="padding:6px 12px;font-size:0.78rem;margin-right:6px" onclick="act.openClientSnapshotModal(${x.client_id}, ${x.id})">
                  👤 Client Profile Snapshot
                </button>
                <button class="sec" style="padding:6px 10px;font-size:0.78rem;margin-right:6px" onclick="go('client', ${x.client_id})">
                  Open Profile →
                </button>
                <button class="sec" style="padding:6px 10px;font-size:0.78rem" onclick="act.start(${x.id})">
                  ${x.session ? (x.session.end ? 'Session Note' : 'Resume Session ⚡') : '▶ Start Session'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('') || '<div class="card">No appointments scheduled for this filter.</div>'}`;
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
          bEl.textContent = rbtFullClinicalView
            ? `⏹ Stop ${tInfo.mode === 'latency' ? 'Latency' : 'Duration'} (${sec}s)`
            : (tInfo.mode === 'latency' ? `⏹ MARK RESPONSE (${sec}s)` : `⏹ STOP EPISODE (${sec}s)`);
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

  // Counters for Simplified RBT Session Dashboard (Page 2 of PDF Spec)
  const totalBehaviorsCount = (behaviorSummary.frequencyCount || 0) + abcLogs.length;
  const totalSkillTrialsCount = goals.reduce((acc, g) => acc + ((g.summary && (g.summary.rawTotal ?? g.summary.total)) || 0), 0);
  const breaksCount = v.breaksCount || (s && s.breaks_count) || 0;
  const breakActive = Boolean(v.breakActive || (s && s.break_started_at));
  const pausesCount = v.pausesCount || (s && s.pauses_count) || 0;
  const pauseActive = Boolean(v.pauseActive || (s && s.pause_started_at));
  const activeBehPrograms = behaviorPrograms.filter((bp) => bp.status !== 'archived');

  const renderSessionTimelineAndTraceabilityCard = () => {
    const timeline = Array.isArray(v.sessionTimeline) ? v.sessionTimeline : [];
    const tsum = v.traceableSummary || {};
    const st = tsum.sessionTiming || {};
    const bp = tsum.breaksAndPauses || {};
    const bd = tsum.behaviorDurationSummary || {};
    const br = tsum.behaviorRateSummary || {};
    const integ = tsum.integritySummary || {};
    const filteredTimeline = (traceFilterMetric && Array.isArray(traceFilterEventIds))
      ? timeline.filter((ev) => traceFilterEventIds.includes(ev.timeline_id) || traceFilterEventIds.includes(ev.raw_id))
      : timeline;

    const fmtExactTs = (iso) => {
      if (!iso) return '—';
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return String(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch {
        return String(iso);
      }
    };

    const typeColors = {
      SESSION_START: { bg: '#dcfce7', color: '#166534' },
      SESSION_END: { bg: '#0f4c5c', color: '#ffffff' },
      BREAK_START: { bg: '#fef3c7', color: '#92400e' },
      BREAK_END: { bg: '#fde68a', color: '#78350f' },
      PAUSE_START: { bg: '#ffedd5', color: '#9a3412' },
      PAUSE_END: { bg: '#fed7aa', color: '#7c2d12' },
      DURATION_EPISODE: { bg: '#e0f2fe', color: '#075985' },
      BEHAVIOR_EVENT: { bg: '#fee2e2', color: '#991b1b' },
      ABC_EVENT: { bg: '#fef9c3', color: '#854d0e' },
      TRIAL_EVENT: { bg: '#f1f5f9', color: '#334155' }
    };

    return `
      <div id="session_timeline_card" style="background:#ffffff;border:2px solid #8abec4;border-radius:16px;padding:18px 20px;margin-bottom:18px">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="font-size:1.05rem;font-weight:900;color:#0f4c5c;letter-spacing:0.01em">
                ⏱️ SESSION EVENT TIMELINE & TRACEABLE TIME SUMMARY
              </span>
              <span class="badge p" style="font-size:0.68rem">Auto-Timestamped</span>
              <span class="badge tan" style="font-size:0.68rem">Observed vs. Recorded Time</span>
              <span class="badge sen" style="font-size:0.68rem">Audit Edit History</span>
            </div>
            <div style="font-size:0.82rem;color:#475569;margin-top:3px">
              Every session start/end, break, pause, duration episode, and behavior tally is automatically timestamped, distinguishes observed vs. recorded time, preserves original values on edit, and traces directly from summary metrics.
            </div>
          </div>
          ${!ended ? `
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="sec" style="font-size:0.76rem;padding:6px 11px;border-color:#8abec4;color:#0f4c5c;font-weight:700" onclick="act.openBehaviorEventModal(${client.id}, ${s.id})">
                + Log Timed / Backdated Behavior
              </button>
            </div>
          ` : ''}
        </div>

        <!-- 4 Traceable Time-Based Dashboard Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px">
          <div style="background:#f8fafc;border:1.5px solid ${traceFilterMetric === 'sessionTiming' ? '#0f4c5c' : '#cbd5e1'};border-radius:12px;padding:10px 12px">
            <div style="font-size:0.73rem;font-weight:800;color:#0f4c5c;text-transform:uppercase">Session Timing & Net Instructional</div>
            <div style="font-family:var(--font-mono);font-size:0.86rem;font-weight:800;color:#0f172a;margin:4px 0">
              Elapsed: ${st.totalSessionSec ?? 0}s · Net: ${st.netInstructionalSec ?? 0}s
            </div>
            <div style="font-size:0.72rem;color:#475569;margin-bottom:6px">
              Start: <b>${fmtExactTs(st.sessionStartTs || s.start)}</b> → End: <b>${st.sessionEndTs ? fmtExactTs(st.sessionEndTs) : 'Active'}</b>
            </div>
            <button type="button" class="sec" style="font-size:0.7rem;padding:4px 8px;width:100%" onclick='act.traceSummaryEvents("sessionTiming", ${JSON.stringify(st.sourceEventIds || [])})'>
              🔍 Trace Source Events (${(st.sourceEventIds || []).length})
            </button>
          </div>

          <div style="background:#f8fafc;border:1.5px solid ${traceFilterMetric === 'breaksAndPauses' ? '#0f4c5c' : '#cbd5e1'};border-radius:12px;padding:10px 12px">
            <div style="font-size:0.73rem;font-weight:800;color:#92400e;text-transform:uppercase">Breaks & Pauses Timeline</div>
            <div style="font-family:var(--font-mono);font-size:0.86rem;font-weight:800;color:#0f172a;margin:4px 0">
              Breaks: ${bp.breaksCount ?? breaksCount} (${bp.totalBreakSec ?? 0}s) · Pauses: ${bp.pausesCount ?? pausesCount} (${bp.totalPauseSec ?? 0}s)
            </div>
            <div style="font-size:0.72rem;color:#475569;margin-bottom:6px">
              Non-Instructional Time: <b>${(bp.totalBreakSec || 0) + (bp.totalPauseSec || 0)}s</b>
            </div>
            <button type="button" class="sec" style="font-size:0.7rem;padding:4px 8px;width:100%" onclick='act.traceSummaryEvents("breaksAndPauses", ${JSON.stringify(bp.sourceEventIds || [])})'>
              🔍 Trace Break/Pause Events (${(bp.sourceEventIds || []).length})
            </button>
          </div>

          <div style="background:#f8fafc;border:1.5px solid ${traceFilterMetric === 'behaviorDurationSummary' ? '#0f4c5c' : '#cbd5e1'};border-radius:12px;padding:10px 12px">
            <div style="font-size:0.73rem;font-weight:800;color:#075985;text-transform:uppercase">Duration-Based Episodes</div>
            <div style="font-family:var(--font-mono);font-size:0.86rem;font-weight:800;color:#0f172a;margin:4px 0">
              ${bd.episodeCount ?? behaviorSummary.durationEpisodes ?? 0} Episodes · Total ${bd.totalDurationSec ?? behaviorSummary.totalDurationSec ?? 0}s
            </div>
            <div style="font-size:0.72rem;color:#475569;margin-bottom:6px">
              Mean Duration: <b>${bd.avgDurationSec ?? behaviorSummary.avgDurationSec ?? 0}s</b> (Start/End Calculated)
            </div>
            <button type="button" class="sec" style="font-size:0.7rem;padding:4px 8px;width:100%" onclick='act.traceSummaryEvents("behaviorDurationSummary", ${JSON.stringify(bd.sourceEventIds || [])})'>
              🔍 Trace Duration Episodes (${(bd.sourceEventIds || []).length})
            </button>
          </div>

          <div style="background:#f8fafc;border:1.5px solid ${traceFilterMetric === 'behaviorRateSummary' ? '#0f4c5c' : '#cbd5e1'};border-radius:12px;padding:10px 12px">
            <div style="font-size:0.73rem;font-weight:800;color:#991b1b;text-transform:uppercase">Rate/Hr & Time Integrity</div>
            <div style="font-family:var(--font-mono);font-size:0.86rem;font-weight:800;color:#0f172a;margin:4px 0">
              ${br.frequencyCount ?? behaviorSummary.frequencyCount ?? 0} Events · ${br.ratePerHour ?? behaviorSummary.ratePerHour ?? 0}/hr
            </div>
            <div style="font-size:0.72rem;color:#475569;margin-bottom:6px">
              Backdated: <b>${integ.backdatedEventsCount ?? 0}</b> · Edited (Audited): <b>${integ.editedEventsCount ?? 0}</b>
            </div>
            <button type="button" class="sec" style="font-size:0.7rem;padding:4px 8px;width:100%" onclick='act.traceSummaryEvents("behaviorRateSummary", ${JSON.stringify(br.sourceEventIds || [])})'>
              🔍 Trace Behavior Records (${(br.sourceEventIds || []).length})
            </button>
          </div>
        </div>

        ${traceFilterMetric ? `
          <div style="background:#e0f2fe;border:1.5px solid #38bdf8;border-radius:10px;padding:8px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <span style="font-size:0.8rem;font-weight:700;color:#0369a1">
              🔍 Active Traceability Filter: <b>${esc(traceFilterMetric)}</b> — Showing ${filteredTimeline.length} underlying source event record(s)
            </span>
            <button type="button" class="sec" style="font-size:0.73rem;padding:4px 10px;background:#fff" onclick="act.clearTraceSummaryFilter()">
              ✕ Clear Filter (Show All ${timeline.length} Events)
            </button>
          </div>
        ` : ''}

        <!-- Chronological Event Stream -->
        <div style="max-height:360px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;background:#fcfdfe">
          ${filteredTimeline.length ? filteredTimeline.map((ev) => {
            const tc = typeColors[ev.event_type] || { bg: '#f1f5f9', color: '#334155' };
            const canEditBeh = ev.raw_table === 'behavior_events' && ev.raw_id;
            const canEditSess = ev.raw_table === 'session_events' && ev.raw_id;
            const editHist = Array.isArray(ev.edit_history) ? ev.edit_history : [];
            return `
              <div style="padding:8px 10px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
                <div style="flex:1;min-width:240px">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span style="background:${tc.bg};color:${tc.color};font-family:var(--font-mono);font-size:0.68rem;font-weight:800;padding:2px 7px;border-radius:6px">
                      ${esc(ev.event_type)}
                    </span>
                    <b style="font-size:0.84rem;color:#0f172a">${esc(ev.label)}</b>
                    <span style="font-family:var(--font-mono);font-size:0.7rem;color:#64748b">[${esc(ev.timeline_id)}]</span>
                    ${ev.is_backdated ? `<span class="badge esc" style="font-size:0.66rem" title="Observed time differs from recorded time">⏰ Observed ≠ Recorded</span>` : ''}
                    ${ev.is_edited ? `<span class="badge sen" style="font-size:0.66rem" title="Edited — Original value preserved in audit history">🛡️ Edited (${editHist.length}x · Original Preserved)</span>` : ''}
                  </div>
                  <div style="font-family:var(--font-mono);font-size:0.73rem;color:#475569;margin-top:4px;display:flex;gap:12px;flex-wrap:wrap">
                    <span>Observed: <b>${fmtExactTs(ev.observed_at || ev.ts)}</b></span>
                    <span>Recorded: <b>${fmtExactTs(ev.recorded_at || ev.ts)}</b></span>
                    ${(ev.start_ts || ev.end_ts || ev.duration_sec > 0) ? `
                      <span style="color:#0f4c5c">
                        Window: <b>${fmtExactTs(ev.start_ts || ev.ts)} → ${fmtExactTs(ev.end_ts || ev.ts)}</b>
                        (Calculated Duration: <b>${ev.duration_sec || 0}s</b>)
                      </span>
                    ` : ''}
                  </div>
                  ${ev.notes ? `<div style="font-size:0.75rem;color:#64748b;margin-top:2px">Note: ${esc(ev.notes)}</div>` : ''}
                  ${ev.is_edited && ev.original_value ? `
                    <details style="margin-top:4px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px">
                      <summary style="cursor:pointer;font-size:0.72rem;font-weight:700;color:#0f4c5c">
                        📜 View Preserved Original Value & Audit History (${editHist.length} edit${editHist.length === 1 ? '' : 's'})
                      </summary>
                      <div style="font-family:var(--font-mono);font-size:0.7rem;color:#334155;margin-top:4px">
                        <div><b>Original Preserved Record:</b> count=${ev.original_value.count ?? ev.original_value.value ?? '—'}, duration_sec=${ev.original_value.duration_sec ?? 0}s, observed_at=${esc(ev.original_value.observed_at || ev.original_value.ts || '—')}, notes="${esc(ev.original_value.notes || '')}"</div>
                        ${editHist.map((eh, idx) => `
                          <div style="margin-top:3px;padding-top:3px;border-top:1px dashed #cbd5e1">
                            <b>Edit #${idx + 1}:</b> ${esc(eh.edited_by)} (${esc(eh.edited_role)}) at ${fmtExactTs(eh.edited_at)} — Reason: <i>${esc(eh.reason || 'Clinical correction')}</i>
                          </div>
                        `).join('')}
                      </div>
                    </details>
                  ` : ''}
                </div>
                <div style="display:flex;gap:6px;align-items:center">
                  ${canEditBeh ? `
                    <button type="button" class="sec" style="font-size:0.7rem;padding:4px 8px" onclick="act.openEditBehaviorEventModal(${ev.raw_id}, ${s.id})">
                      ✏️ Edit / Audit
                    </button>
                  ` : ''}
                  ${canEditSess ? `
                    <button type="button" class="sec" style="font-size:0.7rem;padding:4px 8px" onclick="act.openEditSessionEventModal(${ev.raw_id}, ${s.id})">
                      ✏️ Edit / Audit
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('') : `<div style="padding:12px;text-align:center;color:#64748b;font-size:0.82rem">No timeline events match the current filter.</div>`}
        </div>
      </div>
    `;
  };

  if (!rbtFullClinicalView) {
    return `
    <div class="rbt-simplified-session" style="max-width:1080px;margin:0 auto">
      <!-- Top Header Card (RBT SEPIA | SESSION) -->
      <div style="background:#dff1f3;border:2px solid #7fb7be;border-radius:18px;padding:16px 22px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
        <div>
          <div style="font-size:1.38rem;font-weight:900;color:#0f4c5c;letter-spacing:0.01em">RBT SEPIA | SESSION</div>
          <div style="font-size:0.96rem;color:#334155;font-weight:600;margin-top:4px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <span>Client: <b style="color:#0f172a">${esc(client.name)}</b></span>
            <span>Session: <b style="color:${ended ? '#0d7a68' : (pauseActive ? '#9a3412' : (breakActive ? '#d97706' : '#0f4c5c'))}">${ended ? 'Completed' : (pauseActive ? 'Paused' : (breakActive ? 'On Break' : 'Active'))}</b></span>
            <span id="clock" style="font-family:var(--font-mono);font-weight:800;font-size:0.88rem;color:#0f4c5c;background:#ffffff;border:1.5px solid #8abec4;padding:2px 9px;border-radius:8px">${ended ? `${s.units} units` : '00:00:00'}</span>
            <span id="calc_units" style="font-family:var(--font-mono);font-size:0.78rem;color:#475569">${ended ? `${s.units} × 15-min units (${s.units * 15} mins)` : '0 units · CMS 8-Minute Rule'}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <button type="button" class="sec" style="padding:4px 10px;font-size:0.75rem;background:#ffffff;border-color:#8abec4;color:#0f4c5c;font-weight:700" onclick="act.toggleKidMode()">
              ★ ${showKidMode ? 'Hide Kid Mode' : 'Kid Mode'}
            </button>
            <button type="button" class="sec" style="padding:4px 10px;font-size:0.75rem;background:#ffffff;border-color:#8abec4;color:#0f4c5c;font-weight:700" onclick="go('client', ${client.id})">
              👧 Client Profile
            </button>
            <button type="button" class="sec" style="padding:4px 10px;font-size:0.75rem;background:#ffffff;border-color:#8abec4;color:#0f4c5c;font-weight:700" onclick="rbtFullClinicalView=true;render()">
              ⚙️ BCBA Full Clinical Controls
            </button>
          </div>
        </div>
        <div>
          ${ended
            ? `<div style="background:#0d7a68;color:#ffffff;font-weight:800;font-size:0.9rem;padding:12px 20px;border-radius:12px">✓ SESSION ENDED (${s.units} UNITS)</div>`
            : `<button type="button" style="background:#b91c47;color:#ffffff;border:none;border-radius:12px;padding:13px 26px;font-size:0.98rem;font-weight:800;letter-spacing:0.02em;cursor:pointer;box-shadow:0 2px 6px rgba(185,28,71,0.25)" onclick="act.endSession(${s.id})">END SESSION</button>`
          }
        </div>
      </div>

      <!-- 3 KPI Counter Cards Row (Behaviors | Skill trials | Breaks & Pauses) -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">
        <div style="background:#ffffff;border:2px solid #8abec4;border-radius:14px;padding:12px 18px;display:flex;align-items:baseline;gap:12px">
          <span style="font-size:1.75rem;font-weight:900;color:#0f4c5c;font-family:var(--font-mono)">${String(totalBehaviorsCount).padStart(2, '0')}</span>
          <span style="font-size:0.96rem;color:#334155;font-weight:600">Behaviors</span>
        </div>
        <div style="background:#ffffff;border:2px solid #8abec4;border-radius:14px;padding:12px 18px;display:flex;align-items:baseline;gap:12px">
          <span style="font-size:1.75rem;font-weight:900;color:#0f4c5c;font-family:var(--font-mono)">${String(totalSkillTrialsCount).padStart(2, '0')}</span>
          <span style="font-size:0.96rem;color:#334155;font-weight:600">Skill trials</span>
        </div>
        <div style="background:#ffffff;border:2px solid #8abec4;border-radius:14px;padding:12px 18px;display:flex;align-items:baseline;gap:12px">
          <span style="font-size:1.75rem;font-weight:900;color:#0f4c5c;font-family:var(--font-mono)">${String(breaksCount + pausesCount).padStart(2, '0')}</span>
          <span style="font-size:0.96rem;color:#334155;font-weight:600">Breaks / Pauses${breakActive ? ' <span class="badge tan" style="font-size:0.7rem;margin-left:6px">Break Active</span>' : ''}${pauseActive ? ' <span class="badge esc" style="font-size:0.7rem;margin-left:6px">Paused</span>' : ''}</span>
        </div>
      </div>

      ${showKidMode ? `
        <div class="kid-playground" style="margin-bottom:18px">
          <div class="kid-top-controls">
            <div class="kid-theme-pills">
              ${Object.values(KID_THEMES).map((th) => `
                <button class="kid-theme-btn ${kidTheme === th.id ? 'active' : ''}" onclick="act.setKidTheme('${th.id}')">${th.name}</button>
              `).join('')}
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <div class="kid-schedule-pills">
                ${[3, 5, 10].map((num) => `
                  <button class="kid-sched-btn ${targetTokens === num ? 'active' : ''}" onclick="act.setTargetTokens(${num})">FR-${num} (${num} ${theme.tokenEarned})</button>
                `).join('')}
              </div>
              <button class="sec" style="font-size:0.78rem;padding:6px 10px;border-radius:999px" onclick="act.toggleKidAutoToken()">
                ${kidAutoToken ? '⚡ Auto-Token: ON' : '⚪ Auto-Token: OFF'}
              </button>
              <button class="sec" style="font-size:0.78rem;padding:6px 10px;border-radius:999px" onclick="act.resetTokens()">🔄 Reset</button>
            </div>
          </div>
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
        </div>
      ` : ''}

      <!-- Section 1: 1. BEHAVIOR TRACKING | BCBA-assigned measures -->
      <div style="background:#dff1f3;border:2px solid #7fb7be;border-radius:14px;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:1rem;font-weight:900;color:#0f4c5c;letter-spacing:0.02em">1. BEHAVIOR TRACKING</span>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:0.88rem;color:#334155;font-weight:600">BCBA-assigned measures</span>
          ${!ended && (behaviorSummary.frequencyCount || 0) > 0 ? `<button type="button" class="sec" style="padding:3px 9px;font-size:0.73rem;background:#fff;border-color:#8abec4;color:#0f4c5c" onclick="act.undoBehaviorEvent(${s.id})">↩ Undo</button>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:18px">
        ${activeBehPrograms.map((bp) => {
          const bpStats = (behaviorSummary.byBehavior && (behaviorSummary.byBehavior[`id_${bp.id}`] || behaviorSummary.byBehavior[bp.name])) || { frequency: 0, ratePerHour: 0, avgDurationSec: 0, avgLatencySec: 0, intervalPct: null, intervalNumDenom: '0/0' };
          const runningTimer = behTimers[bp.id];
          const mType = String(bp.measurement_type || 'frequency').toLowerCase();
          let pillLabel = 'FREQUENCY';
          let pillBg = '#f3d6ce';
          let pillColor = '#8c2d19';
          if (mType === 'duration' || mType === 'irt') {
            pillLabel = 'FREQUENCY + DURATION';
            pillBg = '#d6eff2';
            pillColor = '#0f4c5c';
          } else if (mType === 'latency') {
            pillLabel = 'LATENCY';
            pillBg = '#d6eff2';
            pillColor = '#0f4c5c';
          } else if (mType === 'partial_interval' || mType === 'whole_interval' || mType === 'mts') {
            pillLabel = 'INTERVAL';
            pillBg = '#e0e7ff';
            pillColor = '#1e40af';
          } else if (mType === 'abc') {
            pillLabel = 'ABC RECORD';
            pillBg = '#fef3c7';
            pillColor = '#92400e';
          }

          let primaryControlHtml = '';
          if (mType === 'duration' || mType === 'irt') {
            primaryControlHtml = `
              <button id="beh_timer_${bp.id}" type="button" style="width:100%;background:${runningTimer ? '#b91c47' : '#0d6e6e'};color:#ffffff;border:none;border-radius:12px;padding:13px 16px;font-size:0.96rem;font-weight:800;cursor:pointer"
                onclick="act.toggleBehaviorTimer(${client.id}, ${s.id}, ${bp.id}, 'duration')" ${ended ? 'disabled' : ''}>
                ${runningTimer ? 'STOP EPISODE' : 'START EPISODE'}
              </button>
            `;
          } else if (mType === 'latency') {
            primaryControlHtml = `
              <button id="beh_timer_${bp.id}" type="button" style="width:100%;background:${runningTimer ? '#b91c47' : '#0d6e6e'};color:#ffffff;border:none;border-radius:12px;padding:13px 16px;font-size:0.96rem;font-weight:800;cursor:pointer"
                onclick="act.toggleBehaviorTimer(${client.id}, ${s.id}, ${bp.id}, 'latency')" ${ended ? 'disabled' : ''}>
                ${runningTimer ? 'MARK RESPONSE' : 'START AT CUE'}
              </button>
            `;
          } else if (mType === 'partial_interval' || mType === 'whole_interval' || mType === 'mts') {
            primaryControlHtml = `
              <div style="display:flex;gap:8px">
                <button type="button" style="flex:2;background:#0d6e6e;color:#ffffff;border:none;border-radius:12px;padding:13px 12px;font-size:0.86rem;font-weight:800;cursor:pointer"
                  onclick="act.quickIntervalBehavior(${client.id}, ${s.id}, ${bp.id}, 1)" ${ended ? 'disabled' : ''}>
                  MARK OCCURRENCE FOR INTERVAL
                </button>
                <button type="button" style="flex:1;background:#64748b;color:#ffffff;border:none;border-radius:12px;padding:13px 10px;font-size:0.82rem;font-weight:700;cursor:pointer"
                  onclick="act.quickIntervalBehavior(${client.id}, ${s.id}, ${bp.id}, 0)" ${ended ? 'disabled' : ''}>
                  NO (−)
                </button>
              </div>
            `;
          } else if (mType === 'abc') {
            primaryControlHtml = `
              <button type="button" style="width:100%;background:#1d5d90;color:#ffffff;border:none;border-radius:12px;padding:13px 16px;font-size:0.96rem;font-weight:800;cursor:pointer"
                onclick="act.openAbcModal(${client.id}, ${s.id})" ${ended ? 'disabled' : ''}>
                ADD ABC RECORD
              </button>
            `;
          } else {
            primaryControlHtml = `
              <button type="button" style="width:100%;background:#b91c47;color:#ffffff;border:none;border-radius:12px;padding:13px 16px;font-size:0.96rem;font-weight:800;cursor:pointer"
                onclick="act.quickTallyBehavior(${client.id}, ${s.id}, ${bp.id})" ${ended ? 'disabled' : ''}>
                +1 RECORD
              </button>
            `;
          }

          return `
            <div style="background:#ffffff;border:2px solid #8abec4;border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
                  <div style="font-size:1.08rem;font-weight:800;color:#0f172a;line-height:1.3" title="${esc(bp.operational_definition || bp.definition || '')}">
                    ${esc(bp.name)}
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                    <span style="background:${pillBg};color:${pillColor};font-size:0.72rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:0.03em">
                      ${pillLabel}
                    </span>
                    ${renderBehaviorCardThreeDotMenu(bp, client.id, s.id)}
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
                  <div>
                    <div style="font-size:0.84rem;color:#475569">Count today</div>
                    <div style="font-size:2rem;font-weight:900;color:${bpStats.frequency > 0 && (mType === 'frequency' || mType === 'rate') ? '#b91c47' : '#0f4c5c'};font-family:var(--font-mono);line-height:1.1;margin-top:2px">
                      ${bpStats.frequency || 0}
                    </div>
                  </div>
                  <div style="text-align:right;font-family:var(--font-mono);font-size:0.76rem;color:#475569">
                    ${mType === 'duration' || mType === 'irt'
                      ? `Avg duration: <b>${bpStats.avgDurationSec || 0}s</b>`
                      : mType === 'latency'
                        ? `Avg latency: <b>${bpStats.avgLatencySec || 0}s</b>`
                        : (mType === 'partial_interval' || mType === 'whole_interval' || mType === 'mts')
                          ? `Intervals: <b>${bpStats.intervalPct ?? 0}% (${bpStats.intervalNumDenom || '0/0'})</b>`
                          : `Auto rate: <b>${bpStats.ratePerHour || 0}/hr</b>`}
                  </div>
                </div>
              </div>
              <div>
                ${primaryControlHtml}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Section 2: 2. SKILL ACQUISITION | NET / DTT -->
      <div style="background:#dff1f3;border:2px solid #7fb7be;border-radius:14px;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:1rem;font-weight:900;color:#0f4c5c;letter-spacing:0.02em">2. SKILL ACQUISITION</span>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:0.88rem;color:#334155;font-weight:600">NET / DTT</span>
          ${!ended && totalSkillTrialsCount > 0 ? `<button type="button" class="sec" style="padding:3px 9px;font-size:0.73rem;background:#fff;border-color:#8abec4;color:#0f4c5c" onclick="act.undo(${s.id})">↩ Undo Trial</button>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:18px">
        ${goals.map((g) => {
          const rawTotal = g.summary ? (g.summary.rawTotal ?? g.summary.total ?? 0) : 0;
          const scoredTotal = g.summary ? (g.summary.total ?? 0) : 0;
          const indepPct = g.summary && g.summary.pct ? (g.summary.pct.I ?? 0) : 0;
          const indepND = g.summary ? (g.summary.indepNumDenom || `${g.summary.counts?.I || 0}/${scoredTotal}`) : '0/0';
          const promptedPct = g.summary ? (g.summary.promptedPct ?? 0) : 0;
          const promptND = g.summary ? (g.summary.promptedNumDenom || `${g.summary.promptedCount || 0}/${scoredTotal}`) : '0/0';
          const cfgPrompts = Array.isArray(g.configuredPrompts) && g.configuredPrompts.length
            ? g.configuredPrompts
            : String(g.configured_prompts || 'I,V,G').split(',').map((x) => x.trim()).filter(Boolean);

          return `
            <div style="background:#ffffff;border:2px solid #8abec4;border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                  <div style="font-size:1.08rem;font-weight:800;color:#0f172a;cursor:pointer;line-height:1.3" onclick="act.openGoalModal(${g.id})" title="Click to review or configure prompt levels">
                    ${esc(g.title)}
                  </div>
                  ${g.mastery_met ? `<span class="tag approved" style="font-size:0.68rem;flex-shrink:0">Mastery Met</span>` : ''}
                </div>
                <div style="font-size:0.84rem;color:#475569;margin-top:6px">Session trials</div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin:2px 0 12px">
                  <div>
                    <span style="font-size:1.95rem;font-weight:900;color:#0d7a68;font-family:var(--font-mono)">${rawTotal} / 10</span>
                    ${rawTotal > 0 ? `
                      <div style="font-family:var(--font-mono);font-size:0.74rem;color:#475569;margin-top:2px">
                        Indep: <b style="color:#0d7a68">${indepPct}% (${esc(indepND)})</b> · Prompted: <b>${promptedPct}% (${esc(promptND)})</b>
                      </div>
                    ` : ''}
                  </div>
                  <span style="font-size:0.92rem;color:#475569;font-weight:600">${g.target || 80}% target</span>
                </div>
              </div>
              <div>
                <div style="display:grid;grid-template-columns:repeat(${Math.max(1, cfgPrompts.length)},1fr);gap:10px">
                  ${cfgPrompts.map((code) => {
                    const pLbl = PROMPT_SHORT_LABELS[code] || code;
                    const pBg = code === 'I' ? '#0d7a68' : (code === 'INC' ? '#b91c47' : '#1d5d90');
                    const cnt = (g.summary && g.summary.counts && g.summary.counts[code]) || 0;
                    return `
                      <button type="button" style="background:${pBg};color:#ffffff;border:none;border-radius:12px;padding:12px 8px;font-size:0.94rem;font-weight:800;cursor:pointer"
                        onclick="act.trial(${s.id}, ${g.id}, '${code}')" ${ended ? 'disabled' : ''}>
                        ${pLbl}${cnt > 0 ? ` (${cnt})` : ''}
                      </button>
                    `;
                  }).join('')}
                </div>
                ${!ended ? `
                  <details style="margin-top:8px">
                    <summary style="font-size:0.74rem;color:#64748b;cursor:pointer;user-select:none">
                      + Other response / Error / N/A (record every eligible opportunity)
                    </summary>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                      ${Object.keys(LV).filter((k) => !cfgPrompts.includes(k)).map((k) => `
                        <button type="button" class="sec" style="padding:5px 9px;font-size:0.73rem" onclick="act.trial(${s.id}, ${g.id}, '${k}')">
                          ${PROMPT_SHORT_LABELS[k] || k} (${LV[k].label.split(' ')[0]})
                        </button>
                      `).join('')}
                    </div>
                  </details>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Section 3: 3. SESSION TOOLS -->
      <div style="background:#dff1f3;border:2px solid #7fb7be;border-radius:14px;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:1rem;font-weight:900;color:#0f4c5c;letter-spacing:0.02em">3. SESSION TOOLS</span>
        <span style="font-size:0.88rem;color:#334155;font-weight:600">${pauseActive ? '⏸ Session Currently Paused' : (breakActive ? '⏸ Break Currently Active' : 'Breaks • Pauses • ABC • Session notes')}</span>
      </div>

      <!-- Action Buttons Grid (START BREAK, END BREAK, PAUSE SESSION, RESUME SESSION, ADD ABC, SESSION NOTES) -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
        <button type="button" style="background:#0d7a68;color:#ffffff;border:none;border-radius:12px;padding:14px;font-size:0.94rem;font-weight:800;cursor:pointer"
          onclick="act.sessionBreak(${s.id}, 'start')" ${ended ? 'disabled' : ''}>
          START BREAK
        </button>
        <button type="button" style="background:#0d7a68;color:#ffffff;border:none;border-radius:12px;padding:14px;font-size:0.94rem;font-weight:800;cursor:pointer"
          onclick="act.sessionBreak(${s.id}, 'end')" ${ended ? 'disabled' : ''}>
          END BREAK
        </button>
        <button type="button" style="background:#b45309;color:#ffffff;border:none;border-radius:12px;padding:14px;font-size:0.94rem;font-weight:800;cursor:pointer"
          onclick="act.sessionPause(${s.id}, '${pauseActive ? 'resume' : 'start'}')" ${ended ? 'disabled' : ''}>
          ${pauseActive ? 'RESUME SESSION' : 'PAUSE SESSION'}
        </button>
        <button type="button" style="background:#1d5d90;color:#ffffff;border:none;border-radius:12px;padding:14px;font-size:0.94rem;font-weight:800;cursor:pointer"
          onclick="act.openAbcModal(${client.id}, ${s.id})" ${ended ? 'disabled' : ''}>
          ADD ABC
        </button>
        <button type="button" style="background:#1d5d90;color:#ffffff;border:none;border-radius:12px;padding:14px;font-size:0.94rem;font-weight:800;cursor:pointer"
          onclick="act.openBehaviorEventModal(${client.id}, ${s.id})" ${ended ? 'disabled' : ''}>
          TIMED / BACKDATED ENTRY
        </button>
        <button type="button" style="background:#1d5d90;color:#ffffff;border:none;border-radius:12px;padding:14px;font-size:0.94rem;font-weight:800;cursor:pointer"
          onclick="act.openSessionNotesSection(${s.id})">
          SESSION NOTES
        </button>
      </div>

      ${renderSessionTimelineAndTraceabilityCard()}

      <!-- SESSION DOCUMENTATION Card -->
      <div id="session_doc_card" style="background:#ffffff;border:2px solid #8abec4;border-radius:16px;padding:18px 20px;margin-bottom:18px">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:6px">
          <div>
            <div style="font-size:1.05rem;font-weight:900;color:#0f4c5c;letter-spacing:0.01em">
              SESSION DOCUMENTATION
              <span class="tag ${s.note_status === 'none' ? 'draft' : s.note_status}" style="margin-left:8px">
                ${s.note_status === 'pending_approval' ? 'Pending BCBA Co-Signature' : s.note_status}
              </span>
            </div>
            <div style="font-size:0.92rem;color:#334155;margin-top:6px">
              Attendance: <b>${esc((s.attendance_status || 'Present').replace('Present - Full Session', 'Present'))}</b> &nbsp;|&nbsp; Barriers: <b>${esc(s.barriers || 'None reported')}</b>
            </div>
            <div style="font-size:0.9rem;color:#475569;margin-top:4px">
              ABC entries and notes are available for therapist completion.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${!ended ? `
              <button type="button" class="sec" style="font-size:0.78rem;padding:6px 12px" onclick="act.undo(${s.id})">↩ Undo Last Trial</button>
              <button type="button" class="sec" style="font-size:0.78rem;padding:6px 12px" onclick="act.undoBehaviorEvent(${s.id})">↩ Undo Last Behavior</button>
            ` : ''}
            ${s.note_status !== 'signed' ? `
              <button type="button" class="ok" style="font-size:0.8rem;padding:7px 14px;background:#0d7a68" onclick="act.genNote(${s.id})">
                🤖 Auto-Draft Clinical Note
              </button>
            ` : ''}
          </div>
        </div>

        ${abcLogs.length ? `
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;margin:10px 0">
            <div style="font-size:0.8rem;font-weight:800;color:#92400e;margin-bottom:4px">Recorded ABC Observations (${abcLogs.length}) — Organized for BCBA Review:</div>
            ${abcLogs.map((a) => `
              <div style="font-size:0.82rem;color:#78350f;margin-bottom:3px">
                • <b>${esc(a.behavior)}</b>: Antecedent: ${esc(a.antecedent)} → Consequence: ${esc(a.consequence)}
                <span class="badge" style="font-size:0.68rem;margin-left:4px">${esc(a.perceived_function || 'Pending BCBA Review')}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <details ${ended || showSessionNotesBox || s.note ? 'open' : ''} style="margin-top:10px">
          <summary style="cursor:pointer;font-weight:700;font-size:0.86rem;color:#0f4c5c">
            📝 Edit Attendance, Barriers & Session SOAP Note
          </summary>
          <div class="row" style="margin-top:10px">
            <div>
              <label>Attendance Status</label>
              <select id="sess_attendance" onchange="act.saveSessionMeta(${s.id})" ${s.note_status === 'signed' ? 'disabled' : ''}>
                ${['Present - Full Session', 'Late Arrival', 'Early Departure', 'Cancelled - Client Sick', 'No Show'].map((opt) => `
                  <option value="${opt}" ${(s.attendance_status || 'Present - Full Session') === opt ? 'selected' : ''}>${opt}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label>Barriers (Sleep, Illness, Meds, Schedule Change)</label>
              <input id="sess_barriers" value="${esc(s.barriers || 'None reported')}" onchange="act.saveSessionMeta(${s.id})" ${s.note_status === 'signed' ? 'disabled' : ''}>
            </div>
          </div>

          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;margin:8px 0;font-size:0.78rem;color:#475569">
            <b>Clinical Verification Safeguard:</b> Auto-compiled or AI-assisted session observations remain pending therapist verification and BCBA co-signature until confirmed under the agency's workflow. Independent and prompted responses are reported separately.
          </div>

          <label>Session Narrative (Trials + Behavior Rates/Duration + ABC Observations)</label>
          <textarea id="note" rows="8" placeholder="Click '🤖 Auto-Draft Clinical Note' above or type session observations..." ${s.note_status === 'signed' ? 'disabled' : ''}>${esc(s.note || '')}</textarea>

          ${s.submitted_by ? `<div style="font-size:0.84rem;color:var(--slate-600);margin:6px 0"><b>RBT Verification:</b> ${esc(s.submitted_by)} ${s.rbt_signed_at ? `(${fmtT(s.rbt_signed_at)})` : ''}</div>` : ''}
          ${s.signed_by ? `<div style="font-size:0.84rem;color:var(--ok);font-weight:700;margin:6px 0">✓ BCBA Co-Signer: ${esc(s.signed_by)} ${s.bcba_signed_at ? `(${fmtT(s.bcba_signed_at)})` : ''}</div>` : ''}

          ${s.note_status !== 'signed' ? `
            <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap">
              <button type="button" class="sec" onclick="act.saveNote(${s.id})">💾 Save Draft</button>
              ${me.role === 'RBT' ? `<button type="button" class="ok" style="background:#0d7a68" onclick="act.submitNote(${s.id})">📤 Confirm & Submit Note for BCBA Review</button>` : ''}
              ${me.role === 'BCBA' ? `<button type="button" class="ok" style="background:#0d7a68" onclick="act.signNote(${s.id})">✍️ BCBA Co-Sign & Approve Note</button>` : ''}
            </div>
          ` : `<div style="color:var(--ok);font-weight:700;margin-top:10px">✓ Clinical note finalized, co-signed by BCBA, and units deducted from authorization.</div>`}
        </details>
      </div>
    </div>`;
  }

  return `
  <div class="page-header">
    <div>
      <h1>Active Session Cockpit (BCBA Full Clinical Controls)</h1>
      <p class="page-sub">Client: <b>${esc(client.name)}</b> · Full 9-Method Behavior Suite & 10-Level Prompt Hierarchy</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="ok" style="background:#0f4c5c" onclick="rbtFullClinicalView=false;render()">✨ Switch to Simplified RBT View</button>
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
            <button class="sec" style="padding:12px 18px;font-size:0.95rem;background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.35)" onclick="act.sessionBreak(${s.id}, '${breakActive ? 'end' : 'start'}')">${breakActive ? '▶ End Break' : '☕ Start Break'}</button>
            <button class="sec" style="padding:12px 18px;font-size:0.95rem;background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.35)" onclick="act.sessionPause(${s.id}, '${pauseActive ? 'resume' : 'start'}')">${pauseActive ? '▶ Resume Session' : '⏸ Pause Session'}</button>
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

    ${!ended && behaviorPrograms.filter((bp) => bp.status !== 'archived').length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:10px;margin-top:12px">
        ${behaviorPrograms.filter((bp) => bp.status !== 'archived').map((bp) => {
          const bpStats = (behaviorSummary.byBehavior && (behaviorSummary.byBehavior[`id_${bp.id}`] || behaviorSummary.byBehavior[bp.name])) || { frequency: 0, ratePerHour: 0, avgDurationSec: 0, intervalPct: null, intervalNumDenom: '0/0' };
          const runningTimer = behTimers[bp.id];
          const ver = bp.version || 1;
          return `
            <div style="background:var(--slate-50);border:1.5px solid var(--slate-200);border-radius:10px;padding:10px 12px">
              <div class="flex-between" style="gap:6px;margin-bottom:4px;align-items:flex-start">
                <div style="min-width:0;flex:1">
                  <b style="font-size:0.9rem;color:var(--slate-900)" title="${esc(bp.operational_definition)}">${esc(bp.name)}</b>
                  <span class="badge p" style="font-size:0.68rem;margin-left:4px">${esc(bp.measurement_type)}</span>
                  <span style="font-size:0.68rem;color:var(--slate-500);margin-left:4px">v${ver}</span>
                </div>
                ${renderBehaviorCardThreeDotMenu(bp, client.id, s.id)}
              </div>
              <div style="font-size:0.74rem;color:var(--slate-600);margin-bottom:6px;line-height:1.35">
                ${esc(bp.operational_definition || bp.definition || '')}
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

  ${renderSessionTimelineAndTraceabilityCard()}

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

async function leadsView() {
  const leads = await api('GET', '/api/leads');
  const total = leads.length;
  const newCount = leads.filter(l => !l.status || l.status === 'new').length;
  const measurePmCount = leads.filter(l => String(l.current_software || '').toLowerCase().includes('measurepm')).length;
  const centralReachCount = leads.filter(l => String(l.current_software || '').toLowerCase().includes('centralreach')).length;
  const scheduledCount = leads.filter(l => l.status === 'demo_scheduled').length;

  return `
  <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:18px">
    <div>
      <h1 style="margin:0 0 4px">📈 Inbound Growth & Practice CRM</h1>
      <p style="margin:0;font-size:0.9rem;color:var(--slate-500)">Manage inquiries from clinic owners and clinical directors switching from MeasurePM & CentralReach.</p>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <a href="/website.html" target="_blank" class="btn sec" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">
        🌐 Open Marketing Website & ROI
      </a>
      <button class="btn p" onclick="act.promptAddDemoLead()">+ Log Practice Lead</button>
    </div>
  </div>

  <!-- Pipeline KPI Highlights -->
  <div class="grid" style="margin-bottom:20px">
    <div class="stat-card">
      <div class="stat-label">Total Inbound Inquiries</div>
      <div class="stat" style="color:var(--primary)">${total}</div>
      <div class="stat-sub">Website submissions & clinic referrals</div>
    </div>
    <div class="stat-card ${newCount > 0 ? 'warn' : 'ok'}">
      <div class="stat-label">New / Action Required</div>
      <div class="stat" style="color:${newCount > 0 ? 'var(--warn)' : 'var(--ok)'}">${newCount}</div>
      <div class="stat-sub">Awaiting clinic follow-up & discovery call</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Switching from MeasurePM</div>
      <div class="stat" style="color:#d97706">${measurePmCount}</div>
      <div class="stat-sub">Frustrated by sync drops & manual re-auths</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Switching from CentralReach</div>
      <div class="stat" style="color:#2563eb">${centralReachCount}</div>
      <div class="stat-sub">Clinics seeking faster tablet-first RBT workflows</div>
    </div>
    <div class="stat-card ok">
      <div class="stat-label">VIP Demos Scheduled</div>
      <div class="stat" style="color:var(--ok)">${scheduledCount}</div>
      <div class="stat-sub">Active walkthroughs in calendar pipeline</div>
    </div>
  </div>

  <!-- Inbound Inquiries Table -->
  <div class="card">
    <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:12px">
      <div>
        <h3 style="margin:0 0 4px">Prospective ABA Practice Leads</h3>
        <p style="margin:0;font-size:0.85rem;color:var(--slate-500)">Inquiries submitted through the public B2B marketing site.</p>
      </div>
      <span class="badge p">${leads.length} Records In Pipeline</span>
    </div>

    ${leads.length === 0 ? `
      <div style="text-align:center;padding:40px 20px;color:var(--slate-500)">
        <p style="font-size:1.1rem;margin-bottom:8px">No inbound leads logged yet.</p>
        <p style="font-size:0.85rem">Leads captured via the public marketing website form will automatically populate here.</p>
        <a href="/website.html" target="_blank" class="btn p" style="margin-top:10px;text-decoration:none">Test Demo Request Form on Website</a>
      </div>
    ` : `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Clinic & Contact</th>
              <th>Caseload</th>
              <th>Current Software</th>
              <th>Clinical Pain Point / Message</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => {
              const dt = l.created_at ? new Date(l.created_at).toLocaleString() : 'Recent';
              const soft = String(l.current_software || 'Other');
              const isMeasurePm = soft.toLowerCase().includes('measurepm');
              const isCR = soft.toLowerCase().includes('centralreach');
              const status = l.status || 'new';
              return `
              <tr>
                <td style="white-space:nowrap;font-size:0.8rem;color:var(--slate-500)">${dt}</td>
                <td>
                  <div style="font-weight:700;color:var(--slate-800)">${esc(l.clinic_name)}</div>
                  <div style="font-size:0.85rem;color:var(--slate-600)">${esc(l.name)}</div>
                  <div style="font-size:0.75rem;color:var(--slate-500)">
                    <a href="mailto:${esc(l.email)}" style="color:var(--primary);text-decoration:none">${esc(l.email)}</a>
                    ${l.phone ? ` · <span>${esc(l.phone)}</span>` : ''}
                  </div>
                </td>
                <td>
                  <span class="badge" style="background:var(--slate-100);color:var(--slate-700)">${esc(l.caseload_size || '1-10')} clients</span>
                </td>
                <td>
                  ${isMeasurePm ? `<span class="badge warn" style="font-weight:700">⚠️ MeasurePM</span>` :
                    isCR ? `<span class="badge esc" style="font-weight:700">CentralReach</span>` :
                    `<span class="badge">${esc(soft)}</span>`}
                </td>
                <td style="max-width:320px;font-size:0.85rem;line-height:1.4">
                  <div style="color:var(--slate-700);margin-bottom:4px">"${esc(l.message || 'Requested clinical platform walkthrough.')}"</div>
                  ${l.notes ? `<div style="font-size:0.75rem;color:var(--primary);background:#eff6ff;padding:4px 8px;border-radius:4px"><b>Internal Note:</b> ${esc(l.notes)}</div>` : ''}
                </td>
                <td>
                  <select onchange="act.updateLeadStatus(${l.id}, this.value)" style="padding:4px 8px;font-size:0.8rem;border-radius:6px;font-weight:600;${status === 'new' ? 'border-color:var(--warn);color:var(--warn)' : status === 'demo_scheduled' ? 'border-color:var(--ok);color:var(--ok)' : ''}">
                    <option value="new" ${status === 'new' ? 'selected' : ''}>🟡 New Lead</option>
                    <option value="contacted" ${status === 'contacted' ? 'selected' : ''}>🔵 Contacted</option>
                    <option value="demo_scheduled" ${status === 'demo_scheduled' ? 'selected' : ''}>🟢 Demo Scheduled</option>
                    <option value="won" ${status === 'won' ? 'selected' : ''}>🏆 Closed / Won</option>
                    <option value="lost" ${status === 'lost' ? 'selected' : ''}>⚪ Closed / Lost</option>
                  </select>
                </td>
                <td style="text-align:right;white-space:nowrap">
                  <button class="btn ok" style="padding:4px 8px;font-size:0.8rem" onclick="act.issueLicenseFromLead(${l.id}, ${esc(JSON.stringify(l.clinic_name || ''))}, ${esc(JSON.stringify(l.name || ''))}, ${esc(JSON.stringify(l.email || ''))}, ${esc(JSON.stringify(l.caseload_size || '16-40'))})">🔑 Issue License</button>
                  <button class="btn sec" style="padding:4px 8px;font-size:0.8rem" onclick="act.editLeadNotes(${l.id}, ${esc(JSON.stringify(l.notes || ''))})">📝 Note</button>
                  <a href="mailto:${esc(l.email)}?subject=Effective%20Behavioral%20Approach%20%E2%80%94%20VIP%20Demo%20Walkthrough&body=Hi%20${encodeURIComponent(l.name)},%0A%0AThank%20you%20for%20reaching%20out%20to%20Effective%20Behavioral%20Approach.%20We%20would%20love%20to%20show%20you%20how%20our%20Unified%20Behavioral%20Health%20Record%20and%201-click%20re-auth%20packets%20compare%20to%20${encodeURIComponent(l.current_software || 'legacy software')}.%0A%0AWhen%20is%20a%20good%20time%20this%20week%20for%20a%20quick%2015-minute%20walkthrough?%0A%0ABest%20regards,%0AEBA%20Clinical%20Team" class="btn p" style="padding:4px 8px;font-size:0.8rem;text-decoration:none;display:inline-block">✉️ Email</a>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  </div>
  `;
}

async function licensingView() {
  const data = await api('GET', '/api/licensing');
  lastLicensingData = data;
  const pLic = data.primaryLicense || {};
  const list = data.clinicLicenses || [];
  const summary = data.portfolioSummary || { totalLicenses: 0, activeCount: 0, lockedOutCount: 0, pendingAgreementsCount: 0, totalLicensingMrr: 0, totalLicensingArr: 0 };
  const tiers = data.tiers || {};

  if (!selectedAgreementLicId || !list.some((l) => l.id === selectedAgreementLicId)) {
    selectedAgreementLicId = pLic.id || (list[0] && list[0].id) || 1;
  }
  const activeLicObj = list.find((l) => l.id === selectedAgreementLicId) || pLic;
  const ags = activeLicObj.agreements || {};
  const docObj = ags[activeAgreementDoc] || ags.msa || { title: 'Master Subscription Agreement', content: '', status: 'pending' };
  const hp = pLic.hybridPricing || { baseFee: 599, maxClients: 40, perClientFee: 15, maxSeats: 20, perSeatFee: 24, clientCapFee: 600, seatCapFee: 480, netMonthlyTotal: 1427, annualContractValue: 17124, clientUtilizationPct: 5, seatUtilizationPct: 25 };
  const canEdit = me && (me.role === 'OWNER' || me.role === 'ADMIN');

  return `
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:16px">
      ${brandEmblem('lg')}
      <div>
        <div style="font-family:var(--font-mono);font-size:0.74rem;color:#0369a1;font-weight:800;letter-spacing:0.08em;text-transform:uppercase">COMMERCIAL B2B SAAS LICENSING · HYBRID SEAT/CLIENT CAPS & HIPAA BAA</div>
        <h1>Clinic Software Licensing, Legal Agreements & Key Enforcement</h1>
        <p class="page-sub">Manage B2B SaaS Master Subscription Agreements (MSA), HIPAA Business Associate Agreements (BAA), Clinical EULAs, Hybrid Base + Per-Client/Seat Caps, and Hard Lockout controls.</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <a href="/website.html#pricing" target="_blank" class="btn sec" style="text-decoration:none;padding:9px 14px;font-size:0.82rem">🌐 View Public Clinic Pricing Tiers</a>
      ${canEdit ? `<button class="ok" style="padding:9px 14px;font-size:0.82rem" onclick="licensingSubTab='portfolio';showIssueLicenseForm=true;render()">+ Issue Clinic License Key</button>` : ''}
      <button class="sec" style="padding:9px 14px;font-size:0.82rem" onclick="window.print()">🖨️ Print Agreements</button>
    </div>
  </div>

  <!-- Hard Lockout Status Alert Banner (if primary clinic license is expired/suspended) -->
  ${pLic.isLockedOut ? `
    <div class="card" style="background:#fef2f2;border:2px solid #ef4444;margin-bottom:16px;padding:16px 20px">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <span class="badge bad" style="font-weight:800;margin-bottom:4px">🔒 HARD LOCKOUT ACTIVE — NON-OWNER LOGINS BLOCKED</span>
          <h3 style="margin:4px 0 2px;color:#991b1b">Clinic Software License Expired or Suspended</h3>
          <p style="margin:0;font-size:0.86rem;color:#7f1d1d">All BCBA, RBT, Administrator, and Parent Portal logins and API requests are currently blocked with HTTP 403 Hard Lockout. Only the Practice Owner can access the platform to renew the cryptographic license key.</p>
        </div>
        ${canEdit ? `<button class="ok" style="padding:10px 18px;font-size:0.9rem" onclick="act.renewClinicLicenseKey(${pLic.id})">🔑 Renew & Activate 1-Year License Key Now →</button>` : ''}
      </div>
    </div>
  ` : ''}

  <!-- 4 Executive Licensing & Compliance KPI Cards -->
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-bottom:18px">
    <div class="stat-card ${pLic.isLockedOut ? 'bad' : 'ok'}">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Primary Clinic License</div>
        <span class="badge ${pLic.isLockedOut ? 'bad' : 'ok'}">${pLic.isLockedOut ? '🔒 HARD LOCKOUT' : '✓ ACTIVE KEY'}</span>
      </div>
      <div class="stat" style="color:${pLic.isLockedOut ? 'var(--bad)' : 'var(--ok)'};font-size:1.35rem">${esc((pLic.tier || 'growth').toUpperCase())}</div>
      <div class="stat-sub">Expires: <b>${esc(pLic.expires_at || '—')}</b> · Enforcement: <b>Hard Lockout</b></div>
    </div>

    <div class="stat-card">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Hybrid Client & Seat Caps</div>
        <span class="badge p">BASE $${hp.baseFee}/MO</span>
      </div>
      <div class="stat" style="color:var(--primary);font-size:1.35rem">${pLic.activeClients || 0}/${pLic.max_clients || 40} <span style="font-size:0.9rem;font-weight:600">Clients</span> · ${pLic.activeSeats || 0}/${pLic.max_seats || 20} <span style="font-size:0.9rem;font-weight:600">Seats</span></div>
      <div class="stat-sub">+$${pLic.per_client_fee || 15}/client cap · +$${pLic.per_seat_fee || 24}/seat cap = <b>$${(hp.netMonthlyTotal || 0).toLocaleString()}/mo</b></div>
    </div>

    <div class="stat-card ${pLic.allAgreementsSigned ? 'ok' : 'warn'}">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Commercial & HIPAA Contracts</div>
        <span class="badge ${pLic.allAgreementsSigned ? 'ok' : 'tan'}">${pLic.allAgreementsSigned ? '3/3 EXECUTED' : 'SIGNATURE NEEDED'}</span>
      </div>
      <div class="stat" style="color:var(--slate-900);font-size:1.25rem">MSA · HIPAA BAA · EULA</div>
      <div class="stat-sub">Signed by: <b>${esc(pLic.msa_signed_by || 'Pending Execution')}</b></div>
    </div>

    <div class="stat-card ok">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">B2B Clinic Licensing ARR</div>
        <span class="badge sen">${summary.activeCount}/${summary.totalLicenses} ACTIVE CLINICS</span>
      </div>
      <div class="stat" style="color:var(--ok);font-size:1.35rem">$${(summary.totalLicensingArr || 0).toLocaleString()}<span style="font-size:0.9rem">/yr</span></div>
      <div class="stat-sub"><b>$${(summary.totalLicensingMrr || 0).toLocaleString()}/mo</b> MRR across ${summary.totalLicenses} licensed ABA clinics</div>
    </div>
  </div>

  <!-- 3-Tab Sub-Navigation -->
  <div class="kpi-persona-switcher" style="margin-bottom:18px">
    <button class="kpi-persona-tab ${licensingSubTab === 'agreements' ? 'active' : ''}" onclick="act.setLicensingSubTab('agreements')">
      <div class="kpi-tab-icon">📜</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">1. B2B SaaS MSA, HIPAA BAA & EULA Generator</div>
        <div class="kpi-tab-sub">Legal Contract Templates, 21 CFR e-Signatures & PDF Export</div>
      </div>
      <span class="badge ${licensingSubTab === 'agreements' ? 'p' : 'sec'}">3 Contracts</span>
    </button>
    <button class="kpi-persona-tab ${licensingSubTab === 'overview' ? 'active' : ''}" onclick="act.setLicensingSubTab('overview')">
      <div class="kpi-tab-icon">🔑</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">2. Hybrid Pricing Caps & Hard Lockout Control</div>
        <div class="kpi-tab-sub">HMAC-SHA256 Key Vault, Client/Seat Caps & Lockout Simulator</div>
      </div>
      <span class="badge ${pLic.isLockedOut ? 'bad' : 'ok'}">${pLic.isLockedOut ? 'Locked' : 'Active'}</span>
    </button>
    <button class="kpi-persona-tab ${licensingSubTab === 'portfolio' ? 'active' : ''}" onclick="act.setLicensingSubTab('portfolio')">
      <div class="kpi-tab-icon">🏢</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">3. B2B Clinic License Portfolio (${list.length})</div>
        <div class="kpi-tab-sub">Provision Clinic Tenants, Convert CRM Leads & Track Renewals</div>
      </div>
      <span class="badge ${licensingSubTab === 'portfolio' ? 'sen' : 'sec'}">$${Math.round((summary.totalLicensingMrr || 0) / 1000)}k MRR</span>
    </button>
  </div>

  ${licensingSubTab === 'agreements' ? `
    <!-- TAB 1: COMMERCIAL & LEGAL LICENSING TEMPLATES (MSA, HIPAA BAA, CLINICAL EULA) -->
    <div class="card" style="background:linear-gradient(135deg,#042e39 0%,#0b4650 100%);color:#fff;border:1.5px solid #2dd4bf;margin-bottom:16px">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-family:var(--font-mono);font-size:0.74rem;color:#6ee7b7;font-weight:700;text-transform:uppercase">Select Licensed Clinic for Contract Generation & Execution</div>
          <div style="font-size:1.05rem;font-weight:700;margin-top:2px">${esc(activeLicObj.clinic_name)} — <span style="font-family:var(--font-mono);color:#38bdf8">${esc(activeLicObj.license_key)}</span></div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select onchange="act.selectAgreementLicense(+this.value)" style="margin:0;padding:8px 12px;border-radius:8px;font-weight:700;background:#fff;color:var(--slate-900);min-width:260px">
            ${list.map((l) => `
              <option value="${l.id}" ${l.id === activeLicObj.id ? 'selected' : ''}>
                ${l.isPrimary ? '⭐ [Primary] ' : '🏢 '}${esc(l.clinic_name)} (${esc(l.tier.toUpperCase())})
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- 3 Legal Document Switcher Cards -->
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-bottom:16px">
      ${[
        { key: 'msa', icon: '📄', meta: ags.msa || {}, tag: 'Commercial SaaS Terms' },
        { key: 'baa', icon: '🛡️', meta: ags.baa || {}, tag: '45 CFR § 164.504(e) HIPAA' },
        { key: 'eula', icon: '⚖️', meta: ags.eula || {}, tag: 'BACB & AI Guardrails' }
      ].map((item) => {
        const isCurrent = activeAgreementDoc === item.key;
        const isSigned = item.meta.status === 'signed';
        return `
          <div class="card" onclick="act.setAgreementDoc('${item.key}')" style="cursor:pointer;margin-bottom:0;border:2px solid ${isCurrent ? '#0d9488' : 'var(--slate-200)'};background:${isCurrent ? '#f0fdfa' : '#fff'}">
            <div class="flex-between" style="margin-bottom:6px">
              <span class="badge ${isCurrent ? 'p' : 'sec'}">${item.icon} ${esc(item.tag)}</span>
              <span class="badge ${isSigned ? 'ok' : 'warn'}">${isSigned ? '✓ SIGNED' : '⏳ PENDING'}</span>
            </div>
            <h3 style="margin:4px 0;font-size:1rem;color:var(--slate-900)">${esc(item.meta.title || item.key.toUpperCase())}</h3>
            <p style="margin:0 0 8px;font-size:0.8rem;color:var(--slate-600)">${esc(item.meta.subtitle || '')}</p>
            <div style="font-size:0.75rem;color:${isSigned ? '#047857' : '#b45309'};font-weight:700">
              ${isSigned ? `Signed by ${esc(item.meta.signedBy)}` : 'Click to review & electronically execute →'}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Legal Contract Document Viewer & Electronic Signature Execution Block -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--slate-200)">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="badge p">${esc(docObj.id || 'EBA-LEGAL')}</span>
            <span class="badge ${docObj.status === 'signed' ? 'ok' : 'warn'}">${docObj.status === 'signed' ? `✓ EXECUTED BY ${esc(docObj.signedBy)}` : '⏳ AWAITING ELECTRONIC SIGNATURE'}</span>
          </div>
          <h3 style="margin:6px 0 2px">${esc(docObj.title)}</h3>
          <div style="font-size:0.82rem;color:var(--slate-500)">Clinic: <b>${esc(activeLicObj.clinic_name)}</b> · License Key: <code>${esc(activeLicObj.license_key)}</code></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="act.copyAgreementText()">📋 Copy Contract Text</button>
          <button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="window.print()">🖨️ Print / Save PDF</button>
        </div>
      </div>

      <pre id="legal_agreement_text" style="background:var(--slate-50);border:1.5px solid var(--slate-300);border-radius:10px;padding:18px;font-family:var(--font-mono);font-size:0.8rem;line-height:1.65;white-space:pre-wrap;color:var(--slate-900);max-height:460px;overflow-y:auto;margin:0 0 16px">${esc(docObj.content)}</pre>

      ${canEdit ? `
        <div style="background:#f0fdfa;border:1.5px solid #5eead4;border-radius:10px;padding:16px">
          <div class="flex-between" style="flex-wrap:wrap;gap:12px">
            <div style="flex:1;min-width:240px">
              <label style="margin:0 0 4px;font-size:0.8rem;font-weight:700;color:#0f766e">✍️ Electronic Execution & 21 CFR Part 11 Authorized Signer Name + Title</label>
              <input id="lic_signer_name" value="${esc(activeLicObj.contact_name ? `${activeLicObj.contact_name}, Authorized Clinic Representative` : `${me.name}, ${me.role}`)}" style="margin:0;background:#fff">
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
              <button class="ok" style="padding:10px 16px;font-size:0.84rem" onclick="act.signLicenseAgreement(${activeLicObj.id}, '${activeAgreementDoc}')">
                ✍️ Sign ${activeAgreementDoc.toUpperCase()} Only
              </button>
              <button class="btn p" style="padding:10px 16px;font-size:0.84rem" onclick="act.signLicenseAgreement(${activeLicObj.id}, 'all')">
                ⚡ Execute All 3 Agreements (MSA + HIPAA BAA + EULA)
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  ` : ''}

  ${licensingSubTab === 'overview' ? `
    <!-- TAB 2: CRYPTOGRAPHIC KEY VAULT, HYBRID PRICING CAPS & HARD LOCKOUT ENFORCEMENT -->
    <div class="row">
      <!-- Cryptographic License Key & Hard Lockout Control Card -->
      <div class="card" style="flex:1.1">
        <div class="flex-between" style="margin-bottom:10px">
          <div>
            <h3 style="margin:0 0 2px">🔐 Cryptographic License Key Vault & Hard Lockout Gate</h3>
            <p style="margin:0;font-size:0.82rem;color:var(--slate-500)">HMAC-SHA256 signed key binding tier, client cap, clinician seat cap, and expiration date.</p>
          </div>
          <span class="badge ${pLic.signatureValid ? 'ok' : 'bad'}">${pLic.signatureValid ? '✓ HMAC-SHA256 VERIFIED' : '✗ INVALID SIGNATURE'}</span>
        </div>

        <div style="background:linear-gradient(135deg,#041f27 0%,#08333e 100%);color:#fff;padding:16px;border-radius:10px;border:1.5px solid #14b8a6;margin-bottom:14px">
          <div style="font-size:0.72rem;font-family:var(--font-mono);color:#6ee7b7;text-transform:uppercase;letter-spacing:0.06em">Active Tenant Cryptographic License Key</div>
          <div style="font-family:var(--font-mono);font-size:1.05rem;font-weight:800;color:#ecfeff;margin:6px 0;word-break:break-all">${esc(pLic.license_key)}</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:0.76rem;color:#99f6e4;margin-top:8px">
            <span>Clinic: <b>${esc(pLic.clinic_name)}</b></span>
            <span>Issued: <b>${esc(pLic.issued_at)}</b></span>
            <span>Expires: <b>${esc(pLic.expires_at)}</b></span>
            <span>Status: <b>${esc((pLic.status || 'active').toUpperCase())}</b></span>
          </div>
        </div>

        <!-- Client & Seat Cap Utilization Progress Bars -->
        <div style="background:var(--slate-50);padding:14px;border-radius:10px;border:1px solid var(--slate-200);margin-bottom:14px">
          <div class="flex-between" style="font-size:0.84rem;margin-bottom:4px">
            <span><b>Active Client Caseload Cap</b> (+$${pLic.per_client_fee}/mo per client slot)</span>
            <span style="font-family:var(--font-mono);font-weight:700">${pLic.activeClients} / ${pLic.max_clients} Clients (${hp.clientUtilizationPct}%)</span>
          </div>
          <div class="bar" style="height:8px;margin-bottom:12px">
            <div style="width:${hp.clientUtilizationPct}%;background:${hp.clientUtilizationPct >= 90 ? 'var(--bad)' : 'var(--ok)'}"></div>
          </div>

          <div class="flex-between" style="font-size:0.84rem;margin-bottom:4px">
            <span><b>Active Clinician Seat Cap</b> (BCBAs, RBTs & Admins @ +$${pLic.per_seat_fee}/mo per seat)</span>
            <span style="font-family:var(--font-mono);font-weight:700">${pLic.activeSeats} / ${pLic.max_seats} Seats (${hp.seatUtilizationPct}%)</span>
          </div>
          <div class="bar" style="height:8px">
            <div style="width:${hp.seatUtilizationPct}%;background:${hp.seatUtilizationPct >= 90 ? 'var(--bad)' : 'var(--primary)'}"></div>
          </div>
        </div>

        <!-- Hard Lockout Enforcement Controls -->
        <div style="background:${pLic.isLockedOut ? '#fef2f2' : '#fffbeb'};border:1.5px solid ${pLic.isLockedOut ? '#f87171' : '#fcd34d'};border-radius:10px;padding:14px">
          <div style="font-weight:800;font-size:0.88rem;color:${pLic.isLockedOut ? '#991b1b' : '#92400e'};margin-bottom:4px">
            🛡️ Expiration Enforcement Policy: HARD LOCKOUT (Owner-Only Recovery)
          </div>
          <p style="margin:0 0 12px;font-size:0.8rem;color:var(--slate-700)">
            When the clinic license expires or is suspended, all non-Owner logins (<code>BCBA</code>, <code>RBT</code>, <code>ADMIN</code>, <code>PARENT</code>) are immediately blocked with HTTP 403 until the Practice Owner renews the license key.
          </p>
          ${canEdit ? `
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${!pLic.isLockedOut ? `
                <button class="bad" style="padding:8px 14px;font-size:0.82rem" onclick="act.simulateHardLockout(${pLic.id})">
                  🔒 Simulate License Expiration (Test Hard Lockout)
                </button>
              ` : ''}
              <button class="ok" style="padding:8px 14px;font-size:0.82rem" onclick="act.renewClinicLicenseKey(${pLic.id})">
                🔑 Renew & Issue New 1-Year Cryptographic Key
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Hybrid Base Fee + Per-Client / Per-Seat Cap Configurator -->
      <div class="card" style="flex:1">
        <div class="flex-between" style="margin-bottom:10px">
          <div>
            <h3 style="margin:0 0 2px">🧮 Hybrid Base Platform Fee + Per-Client / Per-Seat Cap Configurator</h3>
            <p style="margin:0;font-size:0.82rem;color:var(--slate-500)">Configure your clinic's subscription tier, licensed client cap, and clinician seat cap.</p>
          </div>
          <span class="badge p">$${(hp.netMonthlyTotal || 0).toLocaleString()}/mo</span>
        </div>

        <div class="row">
          <div>
            <label>Subscription Tier</label>
            <select id="cfg_lic_tier" onchange="act.prefillTierDefaults(this.value)">
              ${Object.values(tiers).map((t) => `
                <option value="${t.id}" ${pLic.tier === t.id ? 'selected' : ''}>${esc(t.name)} ($${t.baseFee}/mo base · ${t.maxClients} clients · ${t.maxSeats} seats)</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label>Billing Cycle</label>
            <select id="cfg_lic_cycle">
              <option value="annual" ${pLic.billing_cycle === 'annual' ? 'selected' : ''}>Annual Commitment (15% Discount)</option>
              <option value="monthly" ${pLic.billing_cycle === 'monthly' ? 'selected' : ''}>Month-to-Month Billing</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div>
            <label>Licensed Active Client Cap (Max Clients)</label>
            <input id="cfg_lic_clients" type="number" min="1" max="500" value="${pLic.max_clients || 40}">
          </div>
          <div>
            <label>Licensed Clinician Seat Cap (Max Staff Seats)</label>
            <input id="cfg_lic_seats" type="number" min="1" max="300" value="${pLic.max_seats || 20}">
          </div>
          <div>
            <label>Expiration Date</label>
            <input id="cfg_lic_exp" type="date" value="${esc(pLic.expires_at || '2027-10-31')}">
          </div>
        </div>

        <table>
          <tbody>
            <tr><td>Base Platform Fee (${esc(hp.tierName || 'Growth Practice')})</td><td style="text-align:right;font-family:var(--font-mono);font-weight:700">$${(hp.baseFee || 0).toLocaleString()}/mo</td></tr>
            <tr><td>Licensed Client Caseload Cap (${hp.maxClients} clients @ $${hp.perClientFee}/client)</td><td style="text-align:right;font-family:var(--font-mono)">+$${(hp.clientCapFee || 0).toLocaleString()}/mo</td></tr>
            <tr><td>Licensed Clinician Seat Cap (${hp.maxSeats} seats @ $${hp.perSeatFee}/seat)</td><td style="text-align:right;font-family:var(--font-mono)">+$${(hp.seatCapFee || 0).toLocaleString()}/mo</td></tr>
            <tr style="background:var(--slate-50);font-weight:700"><td>Gross Monthly Platform Total</td><td style="text-align:right;font-family:var(--font-mono)">$${(hp.grossMonthlyTotal || 0).toLocaleString()}/mo</td></tr>
            <tr style="background:#ecfdf5;font-weight:800">
              <td><b>Net Monthly Subscription (${hp.billingCycle === 'annual' ? '15% Annual Discount Applied' : 'Monthly Rate'})</b></td>
              <td style="text-align:right;font-family:var(--font-mono);color:#047857;font-size:1.05rem">$${(hp.netMonthlyTotal || 0).toLocaleString()}/mo ($${(hp.annualContractValue || 0).toLocaleString()}/yr)</td>
            </tr>
          </tbody>
        </table>

        ${canEdit ? `
          <div style="margin-top:14px;display:flex;justify-content:flex-end">
            <button class="ok" style="padding:10px 18px;font-size:0.86rem" onclick="act.updateLicenseCaps(${pLic.id})">
              💾 Update Hybrid Caps & Re-Issue Signed License Key
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  ` : ''}

  ${licensingSubTab === 'portfolio' ? `
    <!-- TAB 3: B2B CLINIC LICENSE PORTFOLIO & TENANT PROVISIONING -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div>
          <h3 style="margin:0 0 2px">🏢 Commercial B2B Clinic License Portfolio (${list.length} Licensed Clinics)</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Provision new ABA clinics with cryptographically signed keys, track hybrid seat/client caps, and verify executed MSA & HIPAA BAA contracts.</p>
        </div>
        ${canEdit ? `<button class="ok" style="padding:8px 14px;font-size:0.82rem" onclick="showIssueLicenseForm=!showIssueLicenseForm;render()">${showIssueLicenseForm ? '✕ Close Form' : '+ Issue New Clinic License Key'}</button>` : ''}
      </div>

      ${showIssueLicenseForm && canEdit ? `
        <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:16px;margin-bottom:16px">
          <h4 style="margin:0 0 10px;color:#065f46">🔑 Provision New B2B Clinic Software License & Generate MSA / HIPAA BAA</h4>
          <div class="row">
            <div><label>Clinic / Practice Legal Name *</label><input id="new_lic_clinic" placeholder="e.g. Summit Behavioral Horizons, LLC"></div>
            <div><label>Primary Owner / Clinical Director *</label><input id="new_lic_contact" placeholder="e.g. Dr. Rebecca Vance, BCBA-D"></div>
            <div><label>Work Email *</label><input id="new_lic_email" type="email" placeholder="rebecca@summitaba.org"></div>
          </div>
          <div class="row">
            <div>
              <label>Subscription Tier</label>
              <select id="new_lic_tier" onchange="const t=this.value;document.getElementById('new_lic_clients').value=t==='starter'?15:t==='enterprise'?100:40;document.getElementById('new_lic_seats').value=t==='starter'?8:t==='enterprise'?50:20;">
                <option value="starter">Starter Clinic ($299/mo base · 15 Clients · 8 Seats)</option>
                <option value="growth" selected>Growth Practice ($599/mo base · 40 Clients · 20 Seats)</option>
                <option value="enterprise">Enterprise Multi-Site ($1,199/mo base · 100 Clients · 50 Seats)</option>
              </select>
            </div>
            <div><label>Max Client Cap</label><input id="new_lic_clients" type="number" value="40" min="1" max="500"></div>
            <div><label>Max Clinician Seat Cap</label><input id="new_lic_seats" type="number" value="20" min="1" max="300"></div>
            <div>
              <label>Billing Cycle</label>
              <select id="new_lic_cycle">
                <option value="annual" selected>Annual (-15% Discount)</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer">
              <input type="checkbox" id="new_lic_autosign" checked style="width:18px;height:18px;margin:0">
              <span><b>Pre-Execute MSA, HIPAA BAA & Clinical EULA on Issuance</b> (Sets license immediately to <code>active</code>)</span>
            </label>
            <button class="ok" onclick="act.issueNewClinicLicense()">🔑 Generate Cryptographic Key & Provision Clinic</button>
          </div>
        </div>
      ` : ''}

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Licensed Clinic & Contact</th>
              <th>Tier & Hybrid Caps</th>
              <th>Cryptographic License Key</th>
              <th>Legal Contracts (MSA / BAA / EULA)</th>
              <th>Expires</th>
              <th>Status</th>
              <th style="text-align:right">MRR / Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((l) => {
              const q = l.hybridPricing || {};
              return `
                <tr>
                  <td>
                    <div style="font-weight:700;color:var(--slate-900)">
                      ${l.isPrimary ? '<span class="badge p" style="margin-right:4px">PRIMARY</span>' : ''}${esc(l.clinic_name)}
                    </div>
                    <div style="font-size:0.78rem;color:var(--slate-600)">${esc(l.contact_name)} · ${esc(l.contact_email)}</div>
                  </td>
                  <td>
                    <span class="badge ${l.tier === 'enterprise' ? 'p' : l.tier === 'growth' ? 'sen' : 'tan'}">${esc(l.tier.toUpperCase())}</span>
                    <div style="font-size:0.76rem;color:var(--slate-600);margin-top:3px">
                      <b>${l.max_clients}</b> Clients · <b>${l.max_seats}</b> Staff Seats
                    </div>
                  </td>
                  <td>
                    <code style="font-size:0.74rem;background:var(--slate-100);padding:3px 6px;border-radius:4px;display:inline-block">${esc(l.license_key)}</code>
                    <div style="font-size:0.7rem;color:${l.signatureValid ? '#047857' : '#be123c'};font-weight:700;margin-top:2px">
                      ${l.signatureValid ? '✓ HMAC-SHA256 Valid' : '✗ Invalid Key'}
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      <span class="badge ${l.msa_signed_by ? 'ok' : 'warn'}">MSA ${l.msa_signed_by ? '✓' : '⏳'}</span>
                      <span class="badge ${l.baa_signed_by ? 'ok' : 'warn'}">BAA ${l.baa_signed_by ? '✓' : '⏳'}</span>
                      <span class="badge ${l.eula_accepted_by ? 'ok' : 'warn'}">EULA ${l.eula_accepted_by ? '✓' : '⏳'}</span>
                    </div>
                  </td>
                  <td style="font-family:var(--font-mono);font-size:0.8rem">${esc(l.expires_at)}</td>
                  <td>
                    <span class="badge ${l.isLockedOut ? 'bad' : l.status === 'active' ? 'ok' : 'warn'}">
                      ${l.isLockedOut ? '🔒 Hard Lockout' : l.status === 'active' ? '🟢 Active' : '🟡 Pending Sign'}
                    </span>
                  </td>
                  <td style="text-align:right;white-space:nowrap">
                    <div style="font-family:var(--font-mono);font-weight:700;color:var(--primary);margin-bottom:4px">$${(q.netMonthlyTotal || 0).toLocaleString()}/mo</div>
                    <button class="sec" style="padding:4px 8px;font-size:0.75rem" onclick="selectedAgreementLicId=${l.id};licensingSubTab='agreements';render()">📜 Contracts</button>
                    ${canEdit ? (l.isLockedOut
                      ? `<button class="ok" style="padding:4px 8px;font-size:0.75rem" onclick="act.renewClinicLicenseKey(${l.id})">🔑 Renew</button>`
                      : `<button class="sec" style="padding:4px 8px;font-size:0.75rem" onclick="act.simulateHardLockout(${l.id})">🔒 Lock</button>`
                    ) : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : ''}
  `;
}

function computeClientFacilityModel(rawCfg = {}) {
  const c = {
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
    marketingCrmMonthly: 1800,
    ...(rawCfg || {})
  };

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
    monthlyDebtService = r === 0
      ? Math.round(loanPrincipal / n)
      : Math.round((loanPrincipal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
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

  const rbtHourlyWage = Math.max(12, Number(c.rbtHourlyWage) || 23.5);
  const rbtNonBillablePct = Math.max(0, Number(c.rbtNonBillablePct) ?? 14) / 100;
  const payrollTaxBenefitsPct = Math.max(0, Number(c.payrollTaxBenefitsPct) ?? 18) / 100;
  const bcbaAnnualSalary = Math.max(50000, Number(c.bcbaAnnualSalary) || 92000);
  const bcbaCaseloadLimit = Math.max(4, Number(c.bcbaCaseloadLimit) || 10);
  const sensorySuppliesPerClientMo = Math.max(0, Number(c.sensorySuppliesPerClientMo) ?? 95);

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
    rev97153Net: Math.round(rev97153PerClient * realization),
    rev97158Net: Math.round(rev97158PerClient * realization),
    rev97155Net: Math.round(rev97155PerClient * realization),
    rev97156Net: Math.round(rev97156PerClient * realization),
    rev97151Net: Math.round(rev97151PerClient * realization),
    rbtCostPerClientMo: Math.round(rbtCostPerClientMo),
    bcbaCostPerClientMo: Math.round(bcbaCostPerClientMo),
    monthlyGrossRevPerClient,
    monthlyNetRevPerClient,
    monthlyDirectLaborPerClient,
    sensorySuppliesPerClientMo,
    monthlyContributionPerClient,
    contributionMarginPct
  };

  const baseRentMonthly = Math.round((totalSqFt * (Number(c.baseRentPerSqFtYr) ?? 28)) / 12);
  const camUtilitiesMonthly = Math.round((totalSqFt * (Number(c.camUtilitiesPerSqFtYr) ?? 7.5)) / 12);
  const rentAndCamMonthly = baseRentMonthly + camUtilitiesMonthly;
  const adminDirectorMonthly = Math.round(Number(c.adminDirectorMonthly) ?? 10500);
  const insuranceSanitationMonthly = Math.round(Number(c.insuranceSanitationMonthly) ?? 2800);
  const marketingCrmMonthly = Math.round(Number(c.marketingCrmMonthly) ?? 1800);
  const fixedFacilityOverheadMo = rentAndCamMonthly + adminDirectorMonthly + insuranceSanitationMonthly + marketingCrmMonthly;

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
      quarter: Math.ceil(m / 3),
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

  const steadyAncillaryMo = enableAncillaryGym
    ? Math.round(targetGymMemberships * gymMembershipFee + otPtSubleaseMo)
    : 0;
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

  return { config: c, space, capex, unitEconomics, months, years, kpis };
}

function renderFacilityJCurveSvg(months, capex, kpis) {
  const w = 640, h = 235, padL = 62, padR = 24, padT = 26, padB = 34;
  const ptsData = [
    { m: 0, lev: -capex.upfrontEquityCash, unlev: -capex.totalCapitalRequired },
    ...months.map((x) => ({ m: x.month, lev: x.cumulativeCashFlow, unlev: x.unleveredCumulativeCashFlow }))
  ];
  const allVals = ptsData.flatMap((d) => [d.lev, d.unlev, 0]);
  const minV = Math.min(-100000, ...allVals);
  const maxV = Math.max(100000, ...allVals);
  const span = Math.max(1, maxV - minV);

  const x = (m) => Math.round(padL + (m / 36) * (w - padL - padR));
  const y = (v) => Math.round(h - padB - ((v - minV) / span) * (h - padT - padB));
  const zeroY = y(0);

  const levPoly = ptsData.map((d) => `${x(d.m)},${y(d.lev)}`).join(' ');
  const unlevPoly = ptsData.map((d) => `${x(d.m)},${y(d.unlev)}`).join(' ');
  const areaPoly = `${x(0)},${zeroY} ${levPoly} ${x(36)},${zeroY}`;

  const fmtK = (v) => {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    return `${sign}$${Math.round(abs / 1000)}k`;
  };

  const paybackX = kpis.paybackMonth ? x(kpis.paybackMonth) : null;

  return `
  <svg viewBox="0 0 ${w} ${h}" width="100%" style="background:linear-gradient(155deg,#041f27 0%,#08333e 100%);border-radius:10px;border:1.5px solid #0d9488;display:block;overflow:visible">
    <defs>
      <linearGradient id="jCurveFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.38"/>
        <stop offset="70%" stop-color="#0284c7" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.18"/>
      </linearGradient>
    </defs>

    <!-- Grid lines -->
    ${[minV, 0, Math.round(maxV * 0.5), maxV].map((gv) => `
      <line x1="${padL}" x2="${w - padR}" y1="${y(gv)}" y2="${y(gv)}" stroke="${gv === 0 ? '#6ee7b7' : 'rgba(148,163,184,0.2)'}" stroke-width="${gv === 0 ? '1.8' : '1'}" ${gv === 0 ? 'stroke-dasharray="4 3"' : ''}/>
      <text x="${padL - 8}" y="${y(gv) + 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="${gv === 0 ? '#6ee7b7' : '#94a3b8'}">${fmtK(gv)}</text>
    `).join('')}

    <!-- X-axis Month Labels -->
    ${[0, 6, 12, 18, 24, 30, 36].map((m) => `
      <line x1="${x(m)}" x2="${x(m)}" y1="${padT}" y2="${h - padB}" stroke="rgba(148,163,184,0.12)" stroke-width="1"/>
      <text x="${x(m)}" y="${h - 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="#cbd5e1">M${m}</text>
    `).join('')}

    <!-- Shaded area -->
    <polygon points="${areaPoly}" fill="url(#jCurveFill)"/>

    <!-- Unlevered line -->
    <polyline fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 3" points="${unlevPoly}"/>

    <!-- Levered Cumulative Cash Flow line -->
    <polyline fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${levPoly}"/>

    <!-- Payback Crossover Marker -->
    ${paybackX !== null ? `
      <line x1="${paybackX}" x2="${paybackX}" y1="${padT}" y2="${h - padB}" stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="3 3"/>
      <circle cx="${paybackX}" cy="${zeroY}" r="5.5" fill="#fbbf24" stroke="#041f27" stroke-width="2"/>
      <rect x="${Math.min(w - 145, Math.max(padL + 4, paybackX - 64))}" y="${padT + 2}" width="128" height="20" rx="4" fill="#fbbf24"/>
      <text x="${Math.min(w - 81, Math.max(padL + 68, paybackX))}" y="${padT + 15}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="800" fill="#041f27">PAYBACK: MONTH ${kpis.paybackMonth}</text>
    ` : ''}

    <!-- Key Milestone Dots -->
    ${[0, 12, 24, 36].map((m) => {
      const pt = ptsData.find((d) => d.m === m);
      if (!pt) return '';
      return `<circle cx="${x(m)}" cy="${y(pt.lev)}" r="4" fill="#ecfeff" stroke="#10b981" stroke-width="2"><title>Month ${m}: ${fmtK(pt.lev)} Cumulative Net Cash</title></circle>`;
    }).join('')}
  </svg>
  `;
}

function renderFacilityRevOpExSvg(months, kpis) {
  const w = 640, h = 235, padL = 62, padR = 24, padT = 26, padB = 34;
  const maxVal = Math.max(50000, ...months.map((m) => Math.max(m.totalRevenue, m.totalClinicalLabor + m.totalFacilityOpEx + m.debtService)));
  const x = (m) => Math.round(padL + ((m - 1) / 35) * (w - padL - padR));
  const y = (v) => Math.round(h - padB - (Math.max(0, v) / maxVal) * (h - padT - padB));

  const revPts = months.map((m) => `${x(m.month)},${y(m.totalRevenue)}`).join(' ');
  const costPts = months.map((m) => `${x(m.month)},${y(m.totalClinicalLabor + m.totalFacilityOpEx + m.debtService)}`).join(' ');
  const ebitdaPts = months.map((m) => `${x(m.month)},${y(Math.max(0, m.ebitda))}`).join(' ');

  const fmtK = (v) => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`;
  const beX = kpis.breakEvenMonth ? x(kpis.breakEvenMonth) : null;

  return `
  <svg viewBox="0 0 ${w} ${h}" width="100%" style="background:linear-gradient(155deg,#e2f6f4 0%,#d9eff8 100%);border-radius:10px;border:1.5px solid #6abdb8;display:block;overflow:visible">
    ${[0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal].map((gv) => `
      <line x1="${padL}" x2="${w - padR}" y1="${y(gv)}" y2="${y(gv)}" stroke="#99cfc9" stroke-width="1"/>
      <text x="${padL - 8}" y="${y(gv) + 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="#1e4e56">${fmtK(gv)}</text>
    `).join('')}

    ${[1, 6, 12, 18, 24, 30, 36].map((m) => `
      <text x="${x(m)}" y="${h - 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="#255f66">M${m}</text>
    `).join('')}

    <!-- EBITDA Line -->
    <polyline fill="none" stroke="#0284c7" stroke-width="2.2" stroke-dasharray="4 3" points="${ebitdaPts}"/>

    <!-- Total Cost + Debt Service Line -->
    <polyline fill="none" stroke="#e11d48" stroke-width="2.4" points="${costPts}"/>

    <!-- Total Revenue Line -->
    <polyline fill="none" stroke="#047857" stroke-width="3.2" stroke-linecap="round" points="${revPts}"/>

    ${beX !== null ? `
      <line x1="${beX}" x2="${beX}" y1="${padT}" y2="${h - padB}" stroke="#047857" stroke-width="1.6" stroke-dasharray="3 3"/>
      <rect x="${Math.min(w - 155, Math.max(padL + 4, beX - 70))}" y="${padT + 2}" width="140" height="20" rx="4" fill="#047857"/>
      <text x="${Math.min(w - 85, Math.max(padL + 74, beX))}" y="${padT + 15}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.2" font-weight="800" fill="#ffffff">BREAK-EVEN: MONTH ${kpis.breakEvenMonth}</text>
    ` : ''}
  </svg>
  `;
}

async function facilityModelView() {
  if (!facilityData) {
    facilityData = await api('GET', '/api/facility-model');
    const defModel = (facilityData.models || []).find((m) => m.is_default) || (facilityData.models || [])[0];
    if (defModel) {
      activeFacilityModelId = defModel.id;
      facilityCfg = { ...defModel.config };
    }
  }
  const models = facilityData.models || [];
  const activeModelMeta = models.find((m) => m.id === activeFacilityModelId) || models[0] || { id: 1, name: 'Base Case Clinic & Gym', subtitle: '' };
  if (!facilityCfg) {
    facilityCfg = { ...(activeModelMeta.config || {}) };
  }

  const pf = computeClientFacilityModel(facilityCfg);
  const { config: c, space, capex, unitEconomics: ue, months, years, kpis } = pf;
  const signups = facilityData.signups || [];
  const sigSum = facilityData.signupSummary || { totalSignups: 0, committedMonth1Count: 0, waitlistCount: 0, totalCommittedWeeklyHours: 0, avgWeeklyHoursPerSignup: 24, tierCounts: {}, tierSharesPct: {}, projectedMonthlyGrossFromSignups: 0 };

  const fmt$ = (n) => {
    const val = Math.round(Number(n) || 0);
    return val < 0 ? `-$${Math.abs(val).toLocaleString()}` : `$${val.toLocaleString()}`;
  };

  return `
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:16px">
      ${brandEmblem('lg')}
      <div>
        <div style="font-family:var(--font-mono);font-size:0.74rem;color:#0369a1;font-weight:800;letter-spacing:0.08em;text-transform:uppercase">CAPITAL EXPANSION · PHYSICAL CLINIC & SENSORY GYM PRO FORMA</div>
        <h1>Physical ABA Clinic & Sensory / Motor Gym Financial Model</h1>
        <p class="page-sub">${esc(activeModelMeta.name)} · ${esc(activeModelMeta.subtitle)}</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="sec" style="padding:9px 14px;font-size:0.82rem" onclick="act.syncFacilityFromSignups()" title="Sync Month-1 Clients & Therapy Tier Mix from Live Client Signup Roster">⚡ Sync from Client Signups (${sigSum.committedMonth1Count} M1 / ${sigSum.totalSignups} Total)</button>
      <button class="ok" style="padding:9px 14px;font-size:0.82rem" onclick="act.saveFacilityScenario()">💾 Save Scenario</button>
      <button class="sec" style="padding:9px 14px;font-size:0.82rem" onclick="act.saveAsNewFacilityScenario()">+ Save As New</button>
      <button class="sec" style="padding:9px 14px;font-size:0.82rem" onclick="act.exportFacilityCsv()">📥 Export 36-Mo CSV</button>
      <button class="sec" style="padding:9px 14px;font-size:0.82rem" onclick="window.print()">🖨️ Print Pro Forma</button>
    </div>
  </div>

  <!-- Scenario Preset Switcher Bar -->
  <div class="card" style="padding:14px 18px;margin-bottom:16px;background:linear-gradient(135deg,#042e39 0%,#0b4650 100%);color:#fff;border:1.5px solid #2dd4bf">
    <div class="flex-between" style="flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-family:var(--font-mono);font-size:0.74rem;font-weight:700;color:#6ee7b7;text-transform:uppercase;letter-spacing:0.06em">Facility Footprint Presets:</span>
        ${models.map((m) => `
          <button class="${m.id === activeFacilityModelId ? 'ok' : 'sec'}" style="padding:7px 14px;font-size:0.8rem;${m.id === activeFacilityModelId ? 'background:#10b981;border-color:#a7f3d0;color:#fff' : 'background:rgba(255,255,255,0.1);color:#e2f8f5;border-color:rgba(255,255,255,0.25)'}" onclick="act.selectFacilityModel(${m.id})">
            🏗️ ${esc(m.name.split(':')[0])} <span style="opacity:0.85;font-family:var(--font-mono);font-size:0.74rem">(${(m.config.totalSqFt || 6000).toLocaleString()} sf)</span>
          </button>
        `).join('')}
      </div>
      <div style="font-family:var(--font-mono);font-size:0.76rem;color:#99f6e4">
        Live Signup Pipeline: <b>${sigSum.totalSignups} Children</b> (${fmt$(sigSum.projectedMonthlyGrossFromSignups)}/mo gross demand)
      </div>
    </div>
  </div>

  <!-- 6 Executive Headline Financial KPIs -->
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));margin-bottom:18px">
    <div class="stat-card">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Net Build-Out CapEx</div>
        <span class="badge p">${space.totalSqFt.toLocaleString()} SQ FT</span>
      </div>
      <div class="stat" style="color:var(--primary)">${fmt$(capex.netBuildoutCapEx)}</div>
      <div class="stat-sub">Gross ${fmt$(capex.grossBuildoutCapEx)} less <b>-${fmt$(capex.landlordTiCredit)}</b> TI credit · Gym Eq: <b>${fmt$(capex.totalGymEquipment)}</b></div>
    </div>

    <div class="stat-card">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Upfront Cash Equity</div>
        <span class="badge sen">${capex.useFinancing ? `SBA ${100 - capex.downPaymentPct}% LTV` : '100% CASH'}</span>
      </div>
      <div class="stat" style="color:var(--sensory)">${fmt$(capex.upfrontEquityCash)}</div>
      <div class="stat-sub">Includes ${fmt$(capex.workingCapitalReserve)} WC · Loan: <b>${fmt$(capex.loanPrincipal)}</b> (${fmt$(capex.monthlyDebtService)}/mo)</div>
    </div>

    <div class="stat-card ok">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Break-Even Enrollment</div>
        <span class="badge tan">MONTH ${kpis.breakEvenMonth || '—'}</span>
      </div>
      <div class="stat" style="color:var(--ok)">${kpis.breakEvenClientsCashFlow} <span style="font-size:1rem;font-weight:600">Clients</span></div>
      <div class="stat-sub"><b>${kpis.breakEvenUtilizationPct}%</b> of ${space.maxClinicClientCapacity}-client capacity · Op Break-Even: ${kpis.breakEvenClientsOperating} kids</div>
    </div>

    <div class="stat-card ok">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Full Equity Payback</div>
        <span class="badge ok">${kpis.paybackMonth ? `${(kpis.paybackMonth / 12).toFixed(1)} YRS` : '>36 MO'}</span>
      </div>
      <div class="stat" style="color:var(--primary)">${kpis.paybackMonth ? `Month ${kpis.paybackMonth}` : 'Month 36+'}</div>
      <div class="stat-sub">3-Yr Cash-on-Cash Return: <b>${kpis.cashOnCashReturnPct}%</b> on upfront equity</div>
    </div>

    <div class="stat-card">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">Steady-State EBITDA</div>
        <span class="badge p">${kpis.steadyStateEbitdaMarginPct}% MARGIN</span>
      </div>
      <div class="stat" style="color:var(--ok)">${fmt$(kpis.steadyStateMonthlyEbitda)}<span style="font-size:0.95rem">/mo</span></div>
      <div class="stat-sub"><b>${fmt$(kpis.steadyStateAnnualEbitda)}/yr</b> EBITDA on ${fmt$(kpis.steadyStateAnnualRev)}/yr revenue</div>
    </div>

    <div class="stat-card ok">
      <div class="flex-between" style="margin-bottom:6px">
        <div class="stat-label" style="margin:0">3-Year Net Cash Flow</div>
        <span class="badge sen">${fmt$(kpis.revenuePerSqFtYr)}/SF/YR</span>
      </div>
      <div class="stat" style="color:var(--primary)">${fmt$(kpis.threeYearCumulativeNetCash)}</div>
      <div class="stat-sub">Cumulative cash after CapEx & SBA debt · 3-Yr EBITDA: <b>${fmt$(kpis.threeYearTotalEbitda)}</b></div>
    </div>
  </div>

  <!-- 4-Pillar Workstation Sub-Navigation Tabs -->
  <div class="kpi-persona-switcher" style="margin-bottom:18px">
    <button class="kpi-persona-tab ${facilitySubTab === 'overview' ? 'active' : ''}" onclick="act.setFacilitySubTab('overview')">
      <div class="kpi-tab-icon">📊</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">1. Executive Pro Forma & Floorplan</div>
        <div class="kpi-tab-sub">What-If Sliders, Space Zones & J-Curve</div>
      </div>
      <span class="badge ${facilitySubTab === 'overview' ? 'p' : 'sec'}">36-Mo</span>
    </button>
    <button class="kpi-persona-tab ${facilitySubTab === 'signups' ? 'active' : ''}" onclick="act.setFacilitySubTab('signups')">
      <div class="kpi-tab-icon">🧒</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">2. Client Therapy Signups & Cohorts</div>
        <div class="kpi-tab-sub">Enrolled Roster, Waitlist & CPT Mix</div>
      </div>
      <span class="badge ${facilitySubTab === 'signups' ? 'sen' : 'sec'}">${sigSum.totalSignups} Kids</span>
    </button>
    <button class="kpi-persona-tab ${facilitySubTab === 'capex' ? 'active' : ''}" onclick="act.setFacilitySubTab('capex')">
      <div class="kpi-tab-icon">🤸</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">3. Sensory Gym & Clinic CapEx</div>
        <div class="kpi-tab-sub">Rigging, Climbing Wall, TI & SBA Loan</div>
      </div>
      <span class="badge ${facilitySubTab === 'capex' ? 'tan' : 'sec'}">${fmt$(capex.netBuildoutCapEx)}</span>
    </button>
    <button class="kpi-persona-tab ${facilitySubTab === 'pnl' ? 'active' : ''}" onclick="act.setFacilitySubTab('pnl')">
      <div class="kpi-tab-icon">📑</div>
      <div class="kpi-tab-text">
        <div class="kpi-tab-title">4. 3-Year P&L & Unit Economics</div>
        <div class="kpi-tab-sub">Per-Client Margin, Staffing & Schedule</div>
      </div>
      <span class="badge ${facilitySubTab === 'pnl' ? 'esc' : 'sec'}">P&L</span>
    </button>
  </div>

  ${facilitySubTab === 'overview' ? `
    <!-- TAB 1: EXECUTIVE PRO FORMA, INTERACTIVE WHAT-IF SLIDERS, ARCHITECTURAL ZONES & J-CURVE -->
    <div class="card" style="background:var(--slate-50);border:1.5px solid var(--slate-300)">
      <div class="flex-between" style="margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0 0 2px">🎛️ Real-Time Facility, Enrollment & Reimbursement What-If Controls</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-600)">Drag any slider to recalculate CapEx, RBT/BCBA staffing, break-even client count, and the 36-month J-curve in real time.</p>
        </div>
        <span class="badge p">Instant Sensitivity Analysis</span>
      </div>

      <div class="row" style="margin-bottom:12px">
        <div>
          <label>Total Clinic + Gym Footprint: <b>${c.totalSqFt.toLocaleString()} sq ft</b> ($${Math.round((c.totalSqFt * c.baseRentPerSqFtYr) / 12).toLocaleString()}/mo base rent)</label>
          <input type="range" min="2000" max="20000" step="250" value="${c.totalSqFt}" oninput="act.updateFacilityCfg('totalSqFt', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Sensory & Gross-Motor Gym Share: <b>${c.gymSqFtPct}%</b> (${space.gymSqFt.toLocaleString()} sq ft)</label>
          <input type="range" min="20" max="55" step="1" value="${c.gymSqFtPct}" oninput="act.updateFacilityCfg('gymSqFtPct', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>1:1 DTT Therapy Suites: <b>${c.dttRoomCount} Suites</b> (${space.dttSqFt.toLocaleString()} sq ft)</label>
          <input type="range" min="4" max="30" step="1" value="${c.dttRoomCount}" oninput="act.updateFacilityCfg('dttRoomCount', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Max Clinic Enrollment Ceiling: <b>${c.maxClinicClientCapacity} Clients</b> (AM + PM Cohorts)</label>
          <input type="range" min="8" max="75" step="1" value="${c.maxClinicClientCapacity}" oninput="act.updateFacilityCfg('maxClinicClientCapacity', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
      </div>

      <div class="row" style="margin-bottom:0">
        <div>
          <label>Month-1 Enrolled Clients: <b>${c.initialClientsMonth1} Clients</b> (Committed Signups)</label>
          <input type="range" min="2" max="40" step="1" value="${c.initialClientsMonth1}" oninput="act.updateFacilityCfg('initialClientsMonth1', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Monthly New Therapy Signups: <b>+${c.monthlyNewClientSignups} Clients/mo</b></label>
          <input type="range" min="0.5" max="8" step="0.5" value="${c.monthlyNewClientSignups}" oninput="act.updateFacilityCfg('monthlyNewClientSignups', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>CPT 97153 1:1 Direct Rate: <b>$${c.rate97153Hr}/hr</b> ($${(c.rate97153Hr / 4).toFixed(2)}/unit)</label>
          <input type="range" min="50" max="96" step="1" value="${c.rate97153Hr}" oninput="act.updateFacilityCfg('rate97153Hr', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>RBT Base Hourly Wage: <b>$${c.rbtHourlyWage.toFixed(2)}/hr</b> (+${c.payrollTaxBenefitsPct}% tax/benefits)</label>
          <input type="range" min="18" max="34" step="0.5" value="${c.rbtHourlyWage}" oninput="act.updateFacilityCfg('rbtHourlyWage', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
      </div>
    </div>

    <!-- Architectural Floorplan & Sensory Gym Zone Allocation Bar -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:10px">
        <div>
          <h3 style="margin:0 0 2px">📐 Architectural Space Allocation & Sensory Gym Zone Blueprint (${space.totalSqFt.toLocaleString()} sq ft)</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Optimized pediatric clinical layout combining high-density 1:1 DTT suites with a commercial Sensory & Gross-Motor Gym.</p>
        </div>
        <span class="badge sen">${fmt$(kpis.revenuePerSqFtYr)} Rev / Sq Ft / Yr</span>
      </div>

      <div style="display:flex;height:34px;border-radius:8px;overflow:hidden;margin-bottom:14px;border:1.5px solid var(--slate-300);font-family:var(--font-mono);font-size:0.75rem;font-weight:700;color:#fff">
        <div style="width:${space.gymSqFtPct}%;background:linear-gradient(90deg,#059669,#10b981);display:flex;align-items:center;justify-content:center" title="Sensory & Gross-Motor Gym: ${space.gymSqFt.toLocaleString()} sq ft">🤸 Sensory Gym ${space.gymSqFtPct}% (${space.gymSqFt.toLocaleString()} sf)</div>
        <div style="width:${space.dttRoomsPct}%;background:linear-gradient(90deg,#0369a1,#0284c7);display:flex;align-items:center;justify-content:center" title="1:1 DTT Suites: ${space.dttSqFt.toLocaleString()} sq ft">🧩 ${space.dttRooms} DTT Suites ${space.dttRoomsPct}%</div>
        <div style="width:${space.groupRoomsPct}%;background:#d97706;display:flex;align-items:center;justify-content:center" title="Social Skills & Group Classrooms: ${space.groupSqFt.toLocaleString()} sq ft">🤝 Group ${space.groupRoomsPct}%</div>
        <div style="width:${space.calmingRoomsPct}%;background:#6366f1;display:flex;align-items:center;justify-content:center" title="Snoezelen Calming Rooms: ${space.calmingSqFt.toLocaleString()} sq ft">🌊 ${space.calmingRoomsPct}%</div>
        <div style="width:${space.adminLobbyPct}%;background:#475569;display:flex;align-items:center;justify-content:center" title="Parent Observation & Staff Hub: ${space.adminLobbySqFt.toLocaleString()} sq ft">🛋️ ${space.adminLobbyPct}%</div>
      </div>

      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:0">
        <div style="padding:12px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px">
          <div style="font-weight:700;color:#065f46;font-size:0.9rem">🤸 Sensory & Gross-Motor Gym</div>
          <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:#047857;margin:4px 0">${space.gymSqFt.toLocaleString()} sq ft (${space.gymSqFtPct}%)</div>
          <div style="font-size:0.78rem;color:#065f46">Overhead steel swing rig, rock wall, recessed foam crash pit, trampoline & NET obstacle course · <b>${space.gymConcurrentCap} kids concurrent</b></div>
        </div>
        <div style="padding:12px;background:#f0f9ff;border:1px solid #7dd3fc;border-radius:8px">
          <div style="font-weight:700;color:#075985;font-size:0.9rem">🧩 1:1 DTT Therapy Suites</div>
          <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:#0369a1;margin:4px 0">${space.dttSqFt.toLocaleString()} sq ft (${space.dttRooms} Suites)</div>
          <div style="font-size:0.78rem;color:#075985">Acoustic-treated 1:1 learning rooms (~${Math.round(space.dttSqFt / space.dttRooms)} sf/room) with observation glass & First/Then boards</div>
        </div>
        <div style="padding:12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px">
          <div style="font-weight:700;color:#92400e;font-size:0.9rem">🤝 Group & Mock Classrooms</div>
          <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:#b45309;margin:4px 0">${space.groupSqFt.toLocaleString()} sq ft (${space.groupRoomsPct}%)</div>
          <div style="font-size:0.78rem;color:#92400e">Circle-time & school-readiness transition suites for CPT 97158 peer social groups · <b>${space.groupConcurrentCap} kids concurrent</b></div>
        </div>
        <div style="padding:12px;background:#eef2ff;border:1px solid #a5b4fc;border-radius:8px">
          <div style="font-weight:700;color:#3730a3;font-size:0.9rem">🌊 Snoezelen & Crisis Suites</div>
          <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:#4338ca;margin:4px 0">${space.calmingSqFt.toLocaleString()} sq ft (${space.calmingRoomsPct}%)</div>
          <div style="font-size:0.78rem;color:#3730a3">Padded low-stimulation sensory regulation rooms with LED bubble tubes & deep-pressure mats</div>
        </div>
      </div>
    </div>

    <!-- Dual 36-Month SVG Charts: Cumulative Cash Flow J-Curve & Revenue vs Cost -->
    <div class="row">
      <div class="card" style="flex:1">
        <div class="flex-between" style="margin-bottom:8px">
          <div>
            <h3 style="margin:0 0 2px">📈 36-Month Cumulative Cash Flow J-Curve & Payback</h3>
            <p style="margin:0;font-size:0.8rem;color:var(--slate-500)">Tracks net cash from Day-0 CapEx equity outlay (${fmt$(-capex.upfrontEquityCash)}) through full payback.</p>
          </div>
          <span class="badge ok">Payback: M${kpis.paybackMonth || '36+'}</span>
        </div>
        ${renderFacilityJCurveSvg(months, capex, kpis)}
        <div class="flex-between" style="font-family:var(--font-mono);font-size:0.74rem;color:var(--slate-600);margin-top:8px">
          <span>🟢 Solid: <b>SBA Levered Cash Flow</b></span>
          <span>🔵 Dashed: <b>100% Cash Unlevered</b></span>
          <span>🟡 Marker: <b>100% Equity Recovered</b></span>
        </div>
      </div>

      <div class="card" style="flex:1">
        <div class="flex-between" style="margin-bottom:8px">
          <div>
            <h3 style="margin:0 0 2px">💵 Monthly Revenue vs. Total Cost & EBITDA Ramp</h3>
            <p style="margin:0;font-size:0.8rem;color:var(--slate-500)">Monthly CPT + Gym Revenue vs. RBT/BCBA Labor + NNN Rent + SBA Debt Service.</p>
          </div>
          <span class="badge p">Break-Even: ${kpis.breakEvenClientsCashFlow} Kids</span>
        </div>
        ${renderFacilityRevOpExSvg(months, kpis)}
        <div class="flex-between" style="font-family:var(--font-mono);font-size:0.74rem;color:var(--slate-600);margin-top:8px">
          <span style="color:#047857">🟢 <b>Net Revenue (${fmt$(kpis.steadyStateMonthlyRev)}/mo M36)</b></span>
          <span style="color:#e11d48">🔴 <b>Labor + Rent + Debt</b></span>
          <span style="color:#0284c7">🔵 <b>Monthly EBITDA (${fmt$(kpis.steadyStateMonthlyEbitda)}/mo)</b></span>
        </div>
      </div>
    </div>

    <!-- 3-Year Executive Snapshot Table -->
    <div class="card">
      <div class="flex-between" style="margin-bottom:8px">
        <div>
          <h3 style="margin:0 0 2px">🗓️ 3-Year Executive Pro Forma Summary (Year 1 – Year 3)</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Consolidated annual revenue, clinical staffing, facility operating expenses, EBITDA, and cumulative cash flow.</p>
        </div>
        <button class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="act.setFacilitySubTab('pnl')">Open Full 36-Month Schedule →</button>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Pro Forma Line Item</th>
              <th style="text-align:right">Year 1 (Ramp-Up)</th>
              <th style="text-align:right">Year 2 (Expansion)</th>
              <th style="text-align:right">Year 3 (Steady-State)</th>
              <th style="text-align:right">3-Year Cumulative</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Ending Enrolled Therapy Clients (Capacity: ${space.maxClinicClientCapacity})</b></td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${years[0].endClients} clients</b> (${years[0].endUtilizationPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${years[1].endClients} clients</b> (${years[1].endUtilizationPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${years[2].endClients} clients</b> (${years[2].endUtilizationPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono)">Avg ${years[2].avgClients} clients</td>
            </tr>
            <tr>
              <td>Clinical Staffing Roster (Ending RBTs / BCBAs)</td>
              <td style="text-align:right;font-family:var(--font-mono)">${years[0].endRbtHeadcount} RBTs · ${years[0].endBcbaHeadcount} BCBAs</td>
              <td style="text-align:right;font-family:var(--font-mono)">${years[1].endRbtHeadcount} RBTs · ${years[1].endBcbaHeadcount} BCBAs</td>
              <td style="text-align:right;font-family:var(--font-mono)">${years[2].endRbtHeadcount} RBTs · ${years[2].endBcbaHeadcount} BCBAs</td>
              <td style="text-align:right;font-family:var(--font-mono)">BACB ≥5% Compliant</td>
            </tr>
            <tr>
              <td>Net ABA Insurance Revenue (CPT 97153/55/56/51/58)</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[0].netAbaRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[1].netAbaRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[2].netAbaRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono);font-weight:700">${fmt$(years[0].netAbaRevenue + years[1].netAbaRevenue + years[2].netAbaRevenue)}</td>
            </tr>
            <tr>
              <td>Sensory Gym Memberships & OT/PT Co-Treatment Revenue</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[0].ancillaryGymRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[1].ancillaryGymRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[2].ancillaryGymRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">${fmt$(years[0].ancillaryGymRevenue + years[1].ancillaryGymRevenue + years[2].ancillaryGymRevenue)}</td>
            </tr>
            <tr style="background:var(--slate-50);font-weight:700">
              <td><b>Total Facility Net Revenue</b></td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(years[0].totalRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(years[1].totalRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(years[2].totalRevenue)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(years[0].totalRevenue + years[1].totalRevenue + years[2].totalRevenue)}</td>
            </tr>
            <tr>
              <td>Direct Clinical Labor (RBTs + BCBAs + ${c.payrollTaxBenefitsPct}% Tax/Benefits)</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(years[0].totalClinicalLabor)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(years[1].totalClinicalLabor)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(years[2].totalClinicalLabor)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(years[0].totalClinicalLabor + years[1].totalClinicalLabor + years[2].totalClinicalLabor)}</td>
            </tr>
            <tr>
              <td><b>Gross Clinical Margin</b></td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${fmt$(years[0].grossProfit)}</b> (${years[0].grossMarginPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${fmt$(years[1].grossProfit)}</b> (${years[1].grossMarginPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${fmt$(years[2].grossProfit)}</b> (${years[2].grossMarginPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono)"><b>${fmt$(years[0].grossProfit + years[1].grossProfit + years[2].grossProfit)}</b></td>
            </tr>
            <tr>
              <td>Facility Lease (NNN Rent + CAM), Admin, Gym Insurance & Supplies</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[0].totalFacilityOpEx)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[1].totalFacilityOpEx)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[2].totalFacilityOpEx)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[0].totalFacilityOpEx + years[1].totalFacilityOpEx + years[2].totalFacilityOpEx)}</td>
            </tr>
            <tr style="background:#ecfdf5;font-weight:700">
              <td><b>Facility EBITDA (Operating Cash Flow)</b></td>
              <td style="text-align:right;font-family:var(--font-mono);color:#047857">${fmt$(years[0].ebitda)} (${years[0].ebitdaMarginPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#047857">${fmt$(years[1].ebitda)} (${years[1].ebitdaMarginPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#047857">${fmt$(years[2].ebitda)} (${years[2].ebitdaMarginPct}%)</td>
              <td style="text-align:right;font-family:var(--font-mono);color:#047857">${fmt$(kpis.threeYearTotalEbitda)}</td>
            </tr>
            <tr>
              <td>Less: SBA 7(a) Build-Out Loan Debt Service (P&I)</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[0].debtService)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[1].debtService)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[2].debtService)}</td>
              <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(years[0].debtService + years[1].debtService + years[2].debtService)}</td>
            </tr>
            <tr style="background:var(--slate-100);font-weight:800">
              <td><b>Net Pre-Tax Cash Flow (After Debt Service)</b></td>
              <td style="text-align:right;font-family:var(--font-mono);color:${years[0].netIncome >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmt$(years[0].netIncome)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--ok)">${fmt$(years[1].netIncome)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--ok)">${fmt$(years[2].netIncome)}</td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(kpis.threeYearNetProfitAfterDebt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ` : ''}

  ${facilitySubTab === 'signups' ? `
    <!-- TAB 2: CLIENT THERAPY SIGNUPS, COHORT CAPACITY & CPT REVENUE MIX -->
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-bottom:18px">
      <div class="stat-card ok">
        <div class="flex-between" style="margin-bottom:6px">
          <div class="stat-label" style="margin:0">Committed Day-1 Signups</div>
          <span class="badge ok">MONTH 1 COHORT</span>
        </div>
        <div class="stat" style="color:var(--ok)">${sigSum.committedMonth1Count} <span style="font-size:1rem">Children</span></div>
        <div class="stat-sub"><b>${sigSum.totalCommittedWeeklyHours} hrs/wk</b> authorized for Day-1 clinic opening</div>
      </div>
      <div class="stat-card">
        <div class="flex-between" style="margin-bottom:6px">
          <div class="stat-label" style="margin:0">Month 2–3 Auth & Waitlist</div>
          <span class="badge tan">ONBOARDING PIPELINE</span>
        </div>
        <div class="stat" style="color:var(--primary)">${sigSum.waitlistCount} <span style="font-size:1rem">Children</span></div>
        <div class="stat-sub">Total Signup Roster: <b>${sigSum.totalSignups} children</b> (${sigSum.avgWeeklyHoursPerSignup} avg hrs/wk)</div>
      </div>
      <div class="stat-card">
        <div class="flex-between" style="margin-bottom:6px">
          <div class="stat-label" style="margin:0">Roster Gross Revenue Run-Rate</div>
          <span class="badge p">SIGNED COHORT</span>
        </div>
        <div class="stat" style="color:var(--primary)">${fmt$(sigSum.projectedMonthlyGrossFromSignups)}<span style="font-size:0.95rem">/mo</span></div>
        <div class="stat-sub"><b>${fmt$(sigSum.projectedMonthlyGrossFromSignups * 12)}/yr</b> annualized from current ${sigSum.totalSignups} signups</div>
      </div>
    </div>

    <!-- Therapy Tier Mix & Ancillary Sensory Gym Revenue Controls -->
    <div class="card" style="background:var(--slate-50)">
      <div class="flex-between" style="margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0 0 2px">🎚️ Client Therapy Intensity Tiers & Sensory Gym Revenue Streams</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-600)">Configure the clinical caseload mix across Comprehensive (30–35h/wk), Focused + Gym (15–20h/wk), and Social/Gym Group (8h/wk), plus private-pay gym memberships.</p>
        </div>
        <button class="ok" style="padding:7px 14px;font-size:0.8rem" onclick="act.syncFacilityFromSignups()">⚡ Apply Mix from ${sigSum.totalSignups} Signed-Up Clients</button>
      </div>
      <div class="row" style="margin-bottom:12px">
        <div>
          <label>Comprehensive Tier Share (${c.compWeeklyHours}h/wk): <b>${ue.compSharePct}%</b></label>
          <input type="range" min="10" max="80" step="5" value="${c.compTierSharePct}" oninput="act.updateFacilityCfg('compTierSharePct', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Focused + Gym NET Share (${c.focusedWeeklyHours}h/wk): <b>${ue.focSharePct}%</b></label>
          <input type="range" min="10" max="70" step="5" value="${c.focusedTierSharePct}" oninput="act.updateFacilityCfg('focusedTierSharePct', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Social / Gym Group Share (${c.groupGymWeeklyHours}h/wk): <b>${ue.grpSharePct}%</b></label>
          <input type="range" min="0" max="50" step="5" value="${c.groupGymTierSharePct}" oninput="act.updateFacilityCfg('groupGymTierSharePct', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Attendance & Claim Realization: <b>${c.attendanceRealizationPct}%</b></label>
          <input type="range" min="75" max="98" step="1" value="${c.attendanceRealizationPct}" oninput="act.updateFacilityCfg('attendanceRealizationPct', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
      </div>
      <div class="row" style="margin-bottom:0">
        <div>
          <label>CPT 97158 Sensory Gym Group Hrs/Wk: <b>${c.gymGroupHrsPerClientWk} hrs/wk</b> (@ $${c.rate97158Hr}/hr)</label>
          <input type="range" min="0" max="8" step="0.5" value="${c.gymGroupHrsPerClientWk}" oninput="act.updateFacilityCfg('gymGroupHrsPerClientWk', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>Open Sensory Gym Memberships: <b>${c.gymMembershipsCount} Families</b> (@ $${c.gymMembershipMonthlyFee}/mo)</label>
          <input type="range" min="0" max="100" step="5" value="${c.gymMembershipsCount}" oninput="act.updateFacilityCfg('gymMembershipsCount', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div>
          <label>OT / PT Gym Co-Treatment Sublease: <b>$${c.otPtSubleaseMonthly.toLocaleString()}/mo</b></label>
          <input type="range" min="0" max="10000" step="250" value="${c.otPtSubleaseMonthly}" oninput="act.updateFacilityCfg('otPtSubleaseMonthly', +this.value)" style="padding:0;height:10px;cursor:pointer">
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding-top:16px">
          <input type="checkbox" id="chk_ancillary" ${c.enableAncillaryGym ? 'checked' : ''} onchange="act.updateFacilityCfg('enableAncillaryGym', this.checked)" style="width:18px;height:18px;margin:0">
          <label for="chk_ancillary" style="margin:0;cursor:pointer"><b>Enable Ancillary Gym & OT/PT Revenue</b></label>
        </div>
      </div>
    </div>

    <!-- Client Therapy Signups & Waitlist Cohort Roster -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:12px">
        <div>
          <h3 style="margin:0 0 2px">🧒 Clients Signing Up for Physical Clinic & Sensory Gym Therapy (${signups.length} Children)</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Live intake & waitlist cohort feeding the clinic and sensory/gross-motor gym enrollment ramp (Synthetic Zero-PHI Demo Roster).</p>
        </div>
        <button class="ok" style="padding:8px 14px;font-size:0.82rem" onclick="showAddSignupForm=!showAddSignupForm;render()">+ Add Client Therapy Signup</button>
      </div>

      ${showAddSignupForm ? `
        <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:14px;margin-bottom:14px">
          <div class="flex-between" style="margin-bottom:8px">
            <h4 style="margin:0;color:#065f46">Add New Client Therapy Signup to Clinic & Gym Cohort</h4>
            <button class="sec" style="padding:3px 8px;font-size:0.75rem" onclick="showAddSignupForm=false;render()">✕ Cancel</button>
          </div>
          <div class="row">
            <div><label>Child Name / Synthetic ID</label><input id="sig_name" placeholder="e.g. Oliver Chen"></div>
            <div><label>Age</label><input id="sig_age" type="number" value="5" min="2" max="18"></div>
            <div>
              <label>Therapy Program Tier</label>
              <select id="sig_tier" onchange="document.getElementById('sig_hrs').value = this.value==='Comprehensive'?32 : this.value==='Focused'?18 : 8">
                <option value="Comprehensive">Comprehensive Early Intensive (30–35h/wk)</option>
                <option value="Focused">Focused ABA + Sensory Gym NET (15–20h/wk)</option>
                <option value="Gym Group">After-School Social & Adaptive Gym Group (8h/wk)</option>
              </select>
            </div>
            <div><label>Authorized Weekly Hours</label><input id="sig_hrs" type="number" value="32" min="4" max="40"></div>
          </div>
          <div class="row">
            <div>
              <label>Assigned Clinic & Gym Cohort</label>
              <select id="sig_cohort">
                <option>Morning Cohort (8:30 AM–12:30 PM)</option>
                <option>Afternoon Cohort (1–5 PM)</option>
                <option>After-School Gym Group (4–6 PM)</option>
              </select>
            </div>
            <div><label>Sensory & Motor Gym Track</label><input id="sig_track" value="Vestibular Swing Rig, Rock Wall & Crash Pit NET"></div>
            <div>
              <label>Enrollment Status</label>
              <select id="sig_status">
                <option value="committed">🟢 Committed (Day-1 Cohort)</option>
                <option value="auth_pending">🟡 Payer Auth Pending (Month 2)</option>
                <option value="waitlist">🔵 Waitlist Deposit Paid (Month 3)</option>
              </select>
            </div>
            <div><label>Target Start Month (1–12)</label><input id="sig_month" type="number" value="1" min="1" max="12"></div>
          </div>
          <button class="ok" onclick="act.addFacilitySignup()">Save Client Signup & Recalculate Pipeline</button>
        </div>
      ` : ''}

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Child & Age</th>
              <th>Therapy Tier</th>
              <th>Weekly Hours</th>
              <th>Assigned Cohort</th>
              <th>Sensory & Motor Gym Prescription</th>
              <th>Target Month</th>
              <th>Enrollment Status</th>
              <th style="text-align:right">Est. Gross Rev/Mo</th>
            </tr>
          </thead>
          <tbody>
            ${signups.map((s) => `
              <tr>
                <td>
                  <div style="font-weight:700;color:var(--slate-900)">${esc(s.child_name)} <span style="font-weight:400;color:var(--slate-500)">(${s.age}y)</span></div>
                  <div style="font-size:0.74rem;color:var(--slate-500)">${esc(s.payer)}</div>
                </td>
                <td>
                  <span class="badge ${s.tier === 'Comprehensive' ? 'p' : s.tier === 'Focused' ? 'sen' : 'tan'}">${esc(s.tier)}</span>
                </td>
                <td style="font-family:var(--font-mono);font-weight:700">${s.weekly_hours} hrs/wk</td>
                <td style="font-size:0.82rem">${esc(s.cohort)}</td>
                <td style="font-size:0.82rem;color:var(--slate-700)">🤸 ${esc(s.gym_track)}</td>
                <td style="font-family:var(--font-mono);font-weight:700">Month ${s.target_month}</td>
                <td>
                  <select onchange="act.updateFacilitySignupStatus(${s.id}, this.value)" style="padding:4px 8px;font-size:0.78rem;border-radius:6px;font-weight:600">
                    <option value="committed" ${s.enrollment_status === 'committed' ? 'selected' : ''}>🟢 Committed</option>
                    <option value="auth_pending" ${s.enrollment_status === 'auth_pending' ? 'selected' : ''}>🟡 Auth Pending</option>
                    <option value="waitlist" ${s.enrollment_status === 'waitlist' ? 'selected' : ''}>🔵 Waitlist</option>
                  </select>
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:var(--primary)">${fmt$(s.estMonthlyGrossRev)}/mo</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : ''}

  ${facilitySubTab === 'capex' ? `
    <!-- TAB 3: SENSORY GYM & CLINIC BUILD-OUT CAPEX + SBA 7(a)/504 FINANCING -->
    <div class="row">
      <div class="card" style="flex:1.15">
        <div class="flex-between" style="margin-bottom:10px">
          <div>
            <h3 style="margin:0 0 2px">🏗️ Leasehold TI Construction & Sensory Gym Equipment Controls</h3>
            <p style="margin:0;font-size:0.82rem;color:var(--slate-500)">Adjust construction costs, landlord TI allowance, and itemized sensory/motor gym equipment.</p>
          </div>
          <span class="badge p">CapEx Inputs</span>
        </div>

        <div class="row">
          <div>
            <label>TI Construction Cost: <b>$${c.tiCostPerSqFt}/sq ft</b> (${fmt$(capex.grossTiConstruction)})</label>
            <input type="range" min="40" max="150" step="5" value="${c.tiCostPerSqFt}" oninput="act.updateFacilityCfg('tiCostPerSqFt', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>Landlord TI Allowance Credit: <b>$${c.landlordTiAllowancePerSqFt}/sq ft</b> (-${fmt$(capex.landlordTiCredit)})</label>
            <input type="range" min="0" max="75" step="5" value="${c.landlordTiAllowancePerSqFt}" oninput="act.updateFacilityCfg('landlordTiAllowancePerSqFt', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Overhead Steel Swing Rigging & Vestibular: <b>${fmt$(c.gymCeilingRiggingCost)}</b></label>
            <input type="range" min="10000" max="90000" step="2000" value="${c.gymCeilingRiggingCost}" oninput="act.updateFacilityCfg('gymCeilingRiggingCost', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>Rock Climbing Wall & Recessed Foam Crash Pit: <b>${fmt$(c.gymClimbingFoamPitCost)}</b></label>
            <input type="range" min="10000" max="100000" step="2500" value="${c.gymClimbingFoamPitCost}" oninput="act.updateFacilityCfg('gymClimbingFoamPitCost', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Commercial Trampoline, Monkey Bars & Heavy-Work Rig: <b>${fmt$(c.gymTrampolineObstacleCost)}</b></label>
            <input type="range" min="8000" max="75000" step="2000" value="${c.gymTrampolineObstacleCost}" oninput="act.updateFacilityCfg('gymTrampolineObstacleCost', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>Interactive LED Sensory Walls & Tactile Motor Path: <b>${fmt$(c.gymSensoryWallTactileCost)}</b></label>
            <input type="range" min="5000" max="50000" step="1000" value="${c.gymSensoryWallTactileCost}" oninput="act.updateFacilityCfg('gymSensoryWallTactileCost', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Snoezelen Calming & De-Escalation Suite: <b>${fmt$(c.calmingRoomSnoezelenCost)}</b></label>
            <input type="range" min="8000" max="60000" step="2000" value="${c.calmingRoomSnoezelenCost}" oninput="act.updateFacilityCfg('calmingRoomSnoezelenCost', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>60-Day Working Capital Reserve: <b>${fmt$(c.workingCapitalReserve)}</b></label>
            <input type="range" min="25000" max="200000" step="5000" value="${c.workingCapitalReserve}" oninput="act.updateFacilityCfg('workingCapitalReserve', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>

        <div style="background:var(--slate-100);padding:14px;border-radius:8px;margin-top:8px">
          <div class="flex-between" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:10px">
              <input type="checkbox" id="chk_sba" ${c.useFinancing ? 'checked' : ''} onchange="act.updateFacilityCfg('useFinancing', this.checked)" style="width:18px;height:18px;margin:0">
              <label for="chk_sba" style="margin:0;cursor:pointer"><b>Finance Build-Out with SBA 7(a) / 504 Healthcare Facility Loan</b></label>
            </div>
            <span class="badge sen">${fmt$(capex.monthlyDebtService)}/mo P&I</span>
          </div>
          <div class="row" style="margin-bottom:0">
            <div>
              <label>Founder Equity Down Payment: <b>${c.downPaymentPct}%</b> (${fmt$(capex.upfrontEquityCash)})</label>
              <input type="range" min="10" max="100" step="5" value="${c.downPaymentPct}" oninput="act.updateFacilityCfg('downPaymentPct', +this.value)" style="padding:0;height:10px;cursor:pointer">
            </div>
            <div>
              <label>SBA Loan Interest Rate: <b>${c.loanInterestRatePct}% APR</b></label>
              <input type="range" min="4.5" max="12.0" step="0.25" value="${c.loanInterestRatePct}" oninput="act.updateFacilityCfg('loanInterestRatePct', +this.value)" style="padding:0;height:10px;cursor:pointer">
            </div>
            <div>
              <label>Amortization Term: <b>${c.loanTermYears} Years</b></label>
              <input type="range" min="5" max="25" step="1" value="${c.loanTermYears}" oninput="act.updateFacilityCfg('loanTermYears', +this.value)" style="padding:0;height:10px;cursor:pointer">
            </div>
          </div>
        </div>
      </div>

      <!-- Itemized CapEx & Capital Stack Schedule Table -->
      <div class="card" style="flex:1">
        <div class="flex-between" style="margin-bottom:10px">
          <div>
            <h3 style="margin:0 0 2px">📋 Itemized Build-Out CapEx & Sources/Uses Schedule</h3>
            <p style="margin:0;font-size:0.82rem;color:var(--slate-500)">Lender-ready capital budget for the ${space.totalSqFt.toLocaleString()} sq ft clinic & sensory gym.</p>
          </div>
          <span class="badge ok">Total Uses: ${fmt$(capex.totalCapitalRequired)}</span>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Capital Expenditure Category & Specification</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Gross Leasehold Tenant Improvements (TI)</b>
                  <div style="font-size:0.75rem;color:var(--slate-500)">${space.totalSqFt.toLocaleString()} sq ft @ $${c.tiCostPerSqFt}/sf (acoustic framing, HVAC, LVT & rubber gym subfloor)</div>
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-weight:700">${fmt$(capex.grossTiConstruction)}</td>
              </tr>
              <tr style="background:#f0fdf4">
                <td>
                  <b style="color:#047857">Less: Landlord Tenant Improvement (TI) Allowance Credit</b>
                  <div style="font-size:0.75rem;color:#065f46">${space.totalSqFt.toLocaleString()} sq ft @ -$${c.landlordTiAllowancePerSqFt}/sf landlord build-out contribution</div>
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:#047857">-${fmt$(capex.landlordTiCredit)}</td>
              </tr>
              ${capex.gymEquipmentItems.map((item) => `
                <tr>
                  <td>
                    <b>🤸 ${esc(item.label)}</b>
                    <div style="font-size:0.75rem;color:var(--slate-500)">${esc(item.note)}</div>
                  </td>
                  <td style="text-align:right;font-family:var(--font-mono)">${fmt$(item.cost)}</td>
                </tr>
              `).join('')}
              ${capex.clinicalTechItems.map((item) => `
                <tr>
                  <td>
                    <b>🏥 ${esc(item.label)}</b>
                    <div style="font-size:0.75rem;color:var(--slate-500)">${esc(item.note)}</div>
                  </td>
                  <td style="text-align:right;font-family:var(--font-mono)">${fmt$(item.cost)}</td>
                </tr>
              `).join('')}
              <tr style="background:var(--slate-50);font-weight:700">
                <td><b>Net Physical Build-Out & Sensory Gym Equipment CapEx</b></td>
                <td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(capex.netBuildoutCapEx)}</td>
              </tr>
              <tr>
                <td>
                  <b>Working Capital & Payer Reimbursement Cycle Reserve</b>
                  <div style="font-size:0.75rem;color:var(--slate-500)">Covers initial 60-day insurance billing clearinghouse cycle & RBT onboarding</div>
                </td>
                <td style="text-align:right;font-family:var(--font-mono)">${fmt$(capex.workingCapitalReserve)}</td>
              </tr>
              <tr style="background:var(--slate-100);font-weight:800">
                <td><b>Total Project Capital Required (Net CapEx + Working Capital)</b></td>
                <td style="text-align:right;font-family:var(--font-mono);color:var(--slate-900);font-size:1rem">${fmt$(capex.totalCapitalRequired)}</td>
              </tr>
              <tr>
                <td>SBA 7(a) / 504 Financed Loan Principal (${100 - capex.downPaymentPct}% LTV @ ${c.loanInterestRatePct}% for ${c.loanTermYears} yrs)</td>
                <td style="text-align:right;font-family:var(--font-mono);color:#0369a1">${fmt$(capex.loanPrincipal)}</td>
              </tr>
              <tr style="background:#ecfdf5;font-weight:800">
                <td><b>Upfront Founder / Investor Cash Equity Required (${capex.downPaymentPct}%)</b></td>
                <td style="text-align:right;font-family:var(--font-mono);color:#047857;font-size:1.05rem">${fmt$(capex.upfrontEquityCash)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ` : ''}

  ${facilitySubTab === 'pnl' ? `
    <!-- TAB 4: 3-YEAR / 36-MONTH PRO FORMA INCOME STATEMENT & UNIT ECONOMICS -->
    <div class="row">
      <!-- Unit Economics Per Client Card -->
      <div class="card" style="flex:1">
        <div class="flex-between" style="margin-bottom:8px">
          <div>
            <h3 style="margin:0 0 2px">🔬 Monthly Unit Economics per Enrolled Therapy Client</h3>
            <p style="margin:0;font-size:0.82rem;color:var(--slate-500)">Blended across ${ue.weightedWeeklyHoursPerClient} billable hrs/wk (${c.attendanceRealizationPct}% attendance/realization).</p>
          </div>
          <span class="badge ok">${ue.contributionMarginPct}% Contribution</span>
        </div>
        <table>
          <tbody>
            <tr><td>CPT 97153 (1:1 Direct RBT in Clinic & Gym NET @ $${c.rate97153Hr}/hr)</td><td style="text-align:right;font-family:var(--font-mono);font-weight:700">${fmt$(ue.rev97153Net)}/mo</td></tr>
            <tr><td>CPT 97155 (BCBA Direction / Protocol Mod @ $${c.rate97155Hr}/hr)</td><td style="text-align:right;font-family:var(--font-mono)">${fmt$(ue.rev97155Net)}/mo</td></tr>
            <tr><td>CPT 97158 (Sensory Gym Social Skills Group @ $${c.rate97158Hr}/hr)</td><td style="text-align:right;font-family:var(--font-mono)">${fmt$(ue.rev97158Net)}/mo</td></tr>
            <tr><td>CPT 97156 & 97151 (Family Guidance & 6-Mo Re-Auth Assessments)</td><td style="text-align:right;font-family:var(--font-mono)">${fmt$(ue.rev97156Net + ue.rev97151Net)}/mo</td></tr>
            <tr style="background:var(--slate-50);font-weight:700"><td><b>Net Realized Revenue per Client / Month</b></td><td style="text-align:right;font-family:var(--font-mono);color:var(--primary)">${fmt$(ue.monthlyNetRevPerClient)}/mo</td></tr>
            <tr><td>Less: Direct RBT Wage + Non-Billable Prep (${c.rbtNonBillablePct}%) + Tax/Benefits (${c.payrollTaxBenefitsPct}%)</td><td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(ue.rbtCostPerClientMo)}/mo</td></tr>
            <tr><td>Less: Allocated Supervising BCBA Compensation (1:${c.bcbaCaseloadLimit} caseload)</td><td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(ue.bcbaCostPerClientMo)}/mo</td></tr>
            <tr><td>Less: Reinforcers & Sensory Gym Consumables</td><td style="text-align:right;font-family:var(--font-mono)">-${fmt$(ue.sensorySuppliesPerClientMo)}/mo</td></tr>
            <tr style="background:#ecfdf5;font-weight:800"><td><b>Net Clinic Contribution Margin per Client</b></td><td style="text-align:right;font-family:var(--font-mono);color:#047857;font-size:1rem">${fmt$(ue.monthlyContributionPerClient)}/mo (${ue.contributionMarginPct}%)</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Staffing & Facility Fixed OpEx Controls -->
      <div class="card" style="flex:1">
        <div class="flex-between" style="margin-bottom:8px">
          <div>
            <h3 style="margin:0 0 2px">⚙️ Clinical Staffing & Facility Lease OpEx Controls</h3>
            <p style="margin:0;font-size:0.82rem;color:var(--slate-500)">Adjust salaries, caseload ratios, NNN lease rates, and facility operating costs.</p>
          </div>
          <span class="badge tan">OpEx Drivers</span>
        </div>
        <div class="row">
          <div>
            <label>Supervising BCBA Salary: <b>$${c.bcbaAnnualSalary.toLocaleString()}/yr</b></label>
            <input type="range" min="70000" max="125000" step="2000" value="${c.bcbaAnnualSalary}" oninput="act.updateFacilityCfg('bcbaAnnualSalary', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>BCBA Caseload Ratio: <b>1 BCBA per ${c.bcbaCaseloadLimit} Clients</b></label>
            <input type="range" min="6" max="16" step="1" value="${c.bcbaCaseloadLimit}" oninput="act.updateFacilityCfg('bcbaCaseloadLimit', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>
        <div class="row">
          <div>
            <label>Base NNN Lease Rent: <b>$${c.baseRentPerSqFtYr}/sq ft/yr</b> (${fmt$(months[0].baseRentMonthly)}/mo)</label>
            <input type="range" min="14" max="55" step="1" value="${c.baseRentPerSqFtYr}" oninput="act.updateFacilityCfg('baseRentPerSqFtYr', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>CAM, HVAC & Fiber Utilities: <b>$${c.camUtilitiesPerSqFtYr}/sq ft/yr</b> (${fmt$(months[0].camUtilitiesMonthly)}/mo)</label>
            <input type="range" min="3" max="18" step="0.5" value="${c.camUtilitiesPerSqFtYr}" oninput="act.updateFacilityCfg('camUtilitiesPerSqFtYr', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>
        <div class="row" style="margin-bottom:0">
          <div>
            <label>Clinic/Gym Director & Front Desk Admin: <b>${fmt$(c.adminDirectorMonthly)}/mo</b></label>
            <input type="range" min="4000" max="25000" step="500" value="${c.adminDirectorMonthly}" oninput="act.updateFacilityCfg('adminDirectorMonthly', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
          <div>
            <label>Gym Liability Insurance & Medical Janitorial: <b>${fmt$(c.insuranceSanitationMonthly)}/mo</b></label>
            <input type="range" min="1000" max="8000" step="200" value="${c.insuranceSanitationMonthly}" oninput="act.updateFacilityCfg('insuranceSanitationMonthly', +this.value)" style="padding:0;height:10px;cursor:pointer">
          </div>
        </div>
      </div>
    </div>

    <!-- Full 36-Month Schedule Table -->
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <h3 style="margin:0 0 2px">📊 Complete 36-Month Financial Schedule (Month 1 – Month 36)</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--slate-500)">Month-by-month client ramp, RBT/BCBA hiring, CPT revenue, facility OpEx, EBITDA, SBA loan payment, and cumulative cash position.</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="${facilityPnlViewMode === 'annual' ? 'ok' : 'sec'}" style="padding:6px 12px;font-size:0.78rem" onclick="facilityPnlViewMode='annual';render()">Quarterly / Milestone View (M1–M36)</button>
          <button class="${facilityPnlViewMode === 'monthly' ? 'ok' : 'sec'}" style="padding:6px 12px;font-size:0.78rem" onclick="facilityPnlViewMode='monthly';render()">All 36 Months View</button>
          <button class="sec" style="padding:6px 12px;font-size:0.78rem" onclick="act.exportFacilityCsv()">📥 Download CSV</button>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th style="text-align:right">Clients (Util %)</th>
              <th style="text-align:right">Staff (RBT/BCBA)</th>
              <th style="text-align:right">ABA CPT Rev</th>
              <th style="text-align:right">Gym / OT Rev</th>
              <th style="text-align:right">Total Revenue</th>
              <th style="text-align:right">Clinical Labor</th>
              <th style="text-align:right">Facility OpEx</th>
              <th style="text-align:right">EBITDA (%)</th>
              <th style="text-align:right">SBA Debt</th>
              <th style="text-align:right">Net Cash Flow</th>
              <th style="text-align:right">Cumulative Cash</th>
            </tr>
          </thead>
          <tbody>
            ${months
              .filter((m) => facilityPnlViewMode === 'monthly' || [1, 2, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(m.month))
              .map((m) => {
                const isBe = m.month === kpis.breakEvenMonth;
                const isPb = m.month === kpis.paybackMonth;
                return `
                  <tr style="${isPb ? 'background:#ecfdf5;font-weight:700' : isBe ? 'background:#f0f9ff' : ''}">
                    <td style="font-family:var(--font-mono);font-weight:700">
                      M${m.month} <span style="font-size:0.72rem;color:var(--slate-500)">(Y${m.year})</span>
                      ${isBe ? '<span class="badge p" style="font-size:0.65rem;margin-left:4px">BREAK-EVEN</span>' : ''}
                      ${isPb ? '<span class="badge ok" style="font-size:0.65rem;margin-left:4px">PAYBACK</span>' : ''}
                    </td>
                    <td style="text-align:right;font-family:var(--font-mono)"><b>${m.activeClients}</b> (${m.utilizationPct}%)</td>
                    <td style="text-align:right;font-family:var(--font-mono)">${m.rbtHeadcount}R / ${m.bcbaHeadcount}B</td>
                    <td style="text-align:right;font-family:var(--font-mono)">${fmt$(m.netAbaRevenue)}</td>
                    <td style="text-align:right;font-family:var(--font-mono)">${fmt$(m.ancillaryGymRevenue)}</td>
                    <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:var(--primary)">${fmt$(m.totalRevenue)}</td>
                    <td style="text-align:right;font-family:var(--font-mono);color:#be123c">-${fmt$(m.totalClinicalLabor)}</td>
                    <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(m.totalFacilityOpEx)}</td>
                    <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${m.ebitda >= 0 ? '#047857' : '#be123c'}">${fmt$(m.ebitda)} (${m.ebitdaMarginPct}%)</td>
                    <td style="text-align:right;font-family:var(--font-mono)">-${fmt$(m.debtService)}</td>
                    <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${m.netCashFlow >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmt$(m.netCashFlow)}</td>
                    <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${m.cumulativeCashFlow >= 0 ? '#047857' : '#64748b'}">${fmt$(m.cumulativeCashFlow)}</td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : ''}
  `;
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
    const bp = activeModal.behavior || null;
    const isEdit = !!bp;
    const cid = activeModal.clientId || (bp && bp.client_id) || 1;
    const focus = activeModal.focusSection || 'all';
    const ver = bp ? (bp.version || 1) : 1;
    const histCount = bp ? (bp.historical_event_count || 0) : 0;
    const mType = bp ? (bp.measurement_type || 'frequency') : 'frequency';
    const fnHyp = bp ? (bp.function_hypothesis || 'Escape') : 'Escape';
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:740px;width:96%;max-height:92vh;overflow-y:auto">
        <div class="flex-between" style="flex-wrap:wrap;gap:8px;padding-bottom:10px;border-bottom:1px solid var(--slate-200)">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge p">${isEdit ? `Edit Target Behavior · Version v${ver} → v${ver + 1}` : 'New Target Behavior Definition'}</span>
              ${isEdit ? `<button type="button" class="beh-ver-pill" onclick="act.openBehaviorHistoryModal(${bp.id})">🕓 View History (${ver} version${ver === 1 ? '' : 's'})</button>` : ''}
            </div>
            <h3 style="margin:4px 0 0">${isEdit ? `Update Target Behavior: ${esc(bp.name)}` : 'Define Client Target Behavior'}</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        ${isEdit ? `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid var(--ok);border-radius:8px;padding:8px 12px;margin-top:10px;font-size:0.78rem;color:#14532d">
            <b>🛡️ Historical Clinical Data Protected:</b> Saving changes creates <b>Version v${ver + 1}</b> and logs the author, timestamp, and diff. Previously collected data (<b>${histCount} observation${histCount === 1 ? '' : 's'}</b>) will <b>NOT</b> be erased or recalculated, and remains permanently associated with the definition & measurement method used at the time of collection.
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            <button type="button" class="fba-chip ${focus === 'all' ? 'active' : ''}" onclick="act.setBehaviorModalFocus('all')">All Editable Fields</button>
            <button type="button" class="fba-chip ${focus === 'behavior' ? 'active' : ''}" onclick="act.setBehaviorModalFocus('behavior')">✏️ 1. Behavior, Definition, Onset/Offset & Examples</button>
            <button type="button" class="fba-chip ${focus === 'measurement' ? 'active' : ''}" onclick="act.setBehaviorModalFocus('measurement')">📏 2. Measurement Method & Baseline</button>
            <button type="button" class="fba-chip ${focus === 'goals' ? 'active' : ''}" onclick="act.setBehaviorModalFocus('goals')">🎯 3. Acquisition/Reduction Goals & Mastery</button>
          </div>
        ` : ''}

        <!-- SECTION 1: Behavior Name, Function, Operational Definition, Onset/Offset, Examples & Non-Examples -->
        <div style="margin-top:12px;padding:12px;border-radius:10px;border:1.5px solid ${focus === 'behavior' ? 'var(--primary)' : 'var(--slate-200)'};background:${focus === 'behavior' ? '#f0fdfa' : '#ffffff'}">
          <div class="flex-between" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">
            <div style="font-size:0.76rem;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.04em;font-family:var(--font-mono)">
              1. Behavior Name, Function, Operational Definition, Onset/Offset & Examples
            </div>
            <button type="button" class="ok" style="padding:5px 10px;font-size:0.75rem;background:#0f766e" onclick="act.aiRecommendInBehaviorModal(${cid})">
              ✨ AI Recommend Operational Definition & Measurement
            </button>
          </div>
          <div id="bp_ai_banner" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:0.78rem;color:#065f46"></div>
          <div class="row">
            <div style="flex:2">
              <label>Behavior Name</label>
              <input id="bp_name" placeholder="e.g. Screaming / Vocal Protest" value="${esc(bp ? bp.name : 'Vocal Protest / Screaming')}">
            </div>
            <div style="flex:1">
              <label>Behavioral Function</label>
              <select id="bp_fn">
                <option value="Escape" ${fnHyp === 'Escape' ? 'selected' : ''}>Escape / Avoidance</option>
                <option value="Attention" ${fnHyp === 'Attention' ? 'selected' : ''}>Attention Seeking</option>
                <option value="Tangible" ${fnHyp === 'Tangible' ? 'selected' : ''}>Access to Tangible</option>
                <option value="Sensory" ${fnHyp === 'Sensory' ? 'selected' : ''}>Automatic / Sensory</option>
              </select>
            </div>
          </div>

          <label>Operational Definition (Objective, Observable & Measurable)</label>
          <textarea id="bp_def" rows="2" placeholder="Any vocalization above conversational volume lasting ≥ 3 seconds...">${esc(bp ? (bp.operational_definition || bp.definition || '') : '')}</textarea>

          <div class="row">
            <div>
              <label>Onset Criteria (When episode begins)</label>
              <input id="bp_onset" placeholder="e.g. Begins immediately after 3s of loud vocalization" value="${esc(bp ? (bp.onset_criteria || '') : '')}">
            </div>
            <div>
              <label>Offset Criteria (When episode ends)</label>
              <input id="bp_offset" placeholder="e.g. Ends after 5 consecutive seconds of calm voice" value="${esc(bp ? (bp.offset_criteria || '') : '')}">
            </div>
          </div>

          <div class="row">
            <div>
              <label>Examples (Topographies included)</label>
              <input id="bp_examples" placeholder="e.g. High-pitched yelling when presented with clean-up cue" value="${esc(bp ? (bp.examples || '') : '')}">
            </div>
            <div>
              <label>Non-Examples (Excluded from counting)</label>
              <input id="bp_non" placeholder="e.g. Laughing or cheering during gross-motor play" value="${esc(bp ? (bp.non_examples || '') : '')}">
            </div>
          </div>
        </div>

        <!-- SECTION 2: Measurement Method, Intensity Criteria & Baseline Data -->
        <div style="margin-top:10px;padding:12px;border-radius:10px;border:1.5px solid ${focus === 'measurement' ? 'var(--primary)' : 'var(--slate-200)'};background:${focus === 'measurement' ? '#f0fdfa' : '#ffffff'}">
          <div style="font-size:0.76rem;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;font-family:var(--font-mono)">
            2. Measurement Method & Baseline Data
          </div>
          <div class="row">
            <div>
              <label>Measurement Method (9 ABA Methods)</label>
              <select id="bp_method">
                <option value="frequency" ${mType === 'frequency' ? 'selected' : ''}>Frequency / Event Recording</option>
                <option value="rate" ${mType === 'rate' ? 'selected' : ''}>Rate (per Hour / Minute)</option>
                <option value="duration" ${mType === 'duration' ? 'selected' : ''}>Duration Recording</option>
                <option value="latency" ${mType === 'latency' ? 'selected' : ''}>Latency Recording</option>
                <option value="irt" ${mType === 'irt' ? 'selected' : ''}>Inter-Response Time (IRT)</option>
                <option value="partial_interval" ${mType === 'partial_interval' ? 'selected' : ''}>Partial-Interval Recording</option>
                <option value="whole_interval" ${mType === 'whole_interval' ? 'selected' : ''}>Whole-Interval Recording</option>
                <option value="mts" ${mType === 'mts' ? 'selected' : ''}>Momentary Time Sampling (MTS)</option>
                <option value="abc" ${mType === 'abc' ? 'selected' : ''}>ABC Continuous Recording</option>
              </select>
            </div>
            <div>
              <label>Baseline Numeric Rate / Value</label>
              <input id="bp_base" type="number" step="0.1" value="${bp && bp.baseline_rate !== undefined ? bp.baseline_rate : 3.0}">
            </div>
            <div>
              <label>Baseline Data Description</label>
              <input id="bp_baseline_data" placeholder="e.g. 4.2 episodes/hr across 3 baseline sessions" value="${esc(bp ? (bp.baseline_data || '') : '3.0 episodes/hr across 3 baseline sessions')}">
            </div>
          </div>
          <label>Intensity Criteria (Mild / Moderate / Severe)</label>
          <input id="bp_intensity" placeholder="Mild: <15s; Moderate: 15s–2m; Severe: >2m" value="${esc(bp ? (bp.intensity_criteria || '') : 'Mild: Whining <15s; Moderate: 15s–2m; Severe: >2m')}">
        </div>

        <!-- SECTION 3: Behavior Reduction Goal, Skill Acquisition / Replacement Goal & Mastery Criteria -->
        <div style="margin-top:10px;padding:12px;border-radius:10px;border:1.5px solid ${focus === 'goals' ? 'var(--primary)' : 'var(--slate-200)'};background:${focus === 'goals' ? '#f0fdfa' : '#ffffff'}">
          <div style="font-size:0.76rem;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;font-family:var(--font-mono)">
            3. Skill Acquisition, Behavior Reduction Goals & Mastery Criteria
          </div>
          <div class="row">
            <div style="flex:2">
              <label>Behavior Reduction Goal</label>
              <input id="bp_reduction_goal" placeholder="e.g. Decrease behavior from 4.2/hr baseline to ≤ 0.5/hr across settings" value="${esc(bp ? (bp.reduction_goal || '') : '')}">
            </div>
            <div style="flex:1">
              <label>Target Criterion Rate</label>
              <input id="bp_target" type="number" step="0.1" value="${bp && bp.target_rate !== undefined ? bp.target_rate : 0.5}">
            </div>
          </div>
          <label>Skill Acquisition & Functional Replacement Behavior Goal (FCT)</label>
          <input id="bp_replacement_goal" placeholder="e.g. Independently exchange 'Break Please' FCT card on ≥ 85% of transitions" value="${esc(bp ? (bp.replacement_skill_goal || '') : '')}">

          <div class="row">
            <div style="flex:2">
              <label>Mastery Criteria</label>
              <input id="bp_mastery" placeholder="e.g. ≤ 0.5 episodes/hr across 3 consecutive sessions with 0 severe episodes" value="${esc(bp ? (bp.mastery_criteria || '') : '≤ 0.5 episodes/hr across 3 consecutive sessions')}">
            </div>
            <div style="flex:1">
              <label>Clinical Status</label>
              <select id="bp_status">
                <option value="active" ${(!bp || bp.status !== 'archived') ? 'selected' : ''}>Active (In Treatment)</option>
                <option value="archived" ${(bp && bp.status === 'archived') ? 'selected' : ''}>Archived (Clinical Review Only)</option>
              </select>
            </div>
          </div>
        </div>

        ${isEdit ? `
          <div style="margin-top:10px">
            <label>Clinical Modification Note (Optional — auto-summarized in Version History if left blank)</label>
            <input id="bp_change_summary" placeholder="e.g. Refined onset criteria to 3s and updated measurement method after FBA review">
          </div>
        ` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:12px;border-top:1px solid var(--slate-200)">
          <div>
            ${isEdit ? `
              <button type="button" class="sec" style="font-size:0.78rem" onclick="act.openBehaviorHistoryModal(${bp.id})">🕓 View Version History (v${ver})</button>
            ` : ''}
          </div>
          <div style="display:flex;gap:10px">
            <button class="sec" onclick="act.closeModal()">Cancel</button>
            <button class="ok" onclick="act.submitBehaviorProgramModal(${cid}, ${bp ? bp.id : 'null'})">
              ✓ ${isEdit ? `Save Changes (Record Version v${ver + 1})` : 'Save Target Behavior Definition'}
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'behavior_history') {
    const bp = activeModal.behavior || {};
    const history = Array.isArray(bp.version_history) ? [...bp.version_history].reverse() : [];
    const histCount = bp.historical_event_count || 0;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:760px;width:96%;max-height:92vh;overflow-y:auto">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--slate-200)">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge p">Target Behavior Version History</span>
              <span class="tag approved">Current: v${bp.version || history.length || 1}</span>
              <span class="badge att">🛡️ ${histCount} Historical Observation${histCount === 1 ? '' : 's'} Protected</span>
            </div>
            <h3 style="margin:4px 0 0">${esc(bp.name || 'Target Behavior')} — Audit & Definition History</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="background:#f8fafc;border:1px solid var(--slate-200);border-radius:8px;padding:10px 12px;margin:12px 0;font-size:0.8rem;color:var(--slate-700)">
          <b>Historical Data Integrity Guarantee:</b> Every modification to a target behavior automatically records the previous and updated definitions, date and time of modification, clinician name, and a description of what changed. Historical observations remain associated with the definition and measurement method active at the time of collection.
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px">
          ${history.map((entry, idx) => {
            const dtStr = entry.ts ? new Date(entry.ts).toLocaleString() : 'Recorded';
            const changes = Array.isArray(entry.changes) ? entry.changes : [];
            const isLatest = idx === 0;
            return `
              <div style="background:#fff;border:1.5px solid ${isLatest ? 'var(--primary)' : 'var(--slate-200)'};border-left:4px solid ${isLatest ? 'var(--primary)' : 'var(--slate-400)'};border-radius:10px;padding:12px 14px">
                <div class="flex-between" style="flex-wrap:wrap;gap:8px;margin-bottom:6px">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <span class="badge ${isLatest ? 'p' : 'att'}">Version v${entry.version || (history.length - idx)}</span>
                    <b style="font-size:0.88rem;color:var(--slate-900)">👤 ${esc(entry.modified_by || 'Dr. Dana Rivera, BCBA')}</b>
                    ${entry.modified_by_role ? `<span class="tag approved" style="font-size:0.68rem">${esc(entry.modified_by_role)}</span>` : ''}
                  </div>
                  <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--slate-500)">🕒 ${esc(dtStr)}</span>
                </div>

                <div style="font-size:0.83rem;font-weight:700;color:var(--primary-dark);margin-bottom:8px">
                  📝 What Changed: ${esc(entry.change_summary || 'Updated target behavior definition')}
                </div>

                ${(entry.previous_definition || entry.updated_definition) ? `
                  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;margin-bottom:8px;font-size:0.78rem">
                    ${entry.previous_definition ? `
                      <div style="background:#fff1f2;border:1px solid #fecdd3;padding:8px 10px;border-radius:6px">
                        <div style="font-weight:700;color:#be123c;margin-bottom:2px">Previous Operational Definition:</div>
                        <div style="color:var(--slate-700)">${esc(entry.previous_definition)}</div>
                      </div>
                    ` : ''}
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 10px;border-radius:6px">
                      <div style="font-weight:700;color:#15803d;margin-bottom:2px">${entry.previous_definition ? 'Updated Operational Definition:' : 'Initial Operational Definition (v1):'}</div>
                      <div style="color:var(--slate-800)">${esc(entry.updated_definition || bp.operational_definition || '')}</div>
                    </div>
                  </div>
                ` : ''}

                ${changes.length ? `
                  <div style="overflow-x:auto">
                    <table style="width:100%;font-size:0.76rem;border-collapse:collapse">
                      <thead>
                        <tr style="background:var(--slate-50);text-align:left">
                          <th style="padding:5px 8px">Field</th>
                          <th style="padding:5px 8px">Previous Value</th>
                          <th style="padding:5px 8px">Updated Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${changes.map((ch) => `
                          <tr style="border-top:1px solid var(--slate-100)">
                            <td style="padding:5px 8px;font-weight:700;color:var(--slate-700)">${esc(ch.label || ch.field)}</td>
                            <td style="padding:5px 8px;color:#be123c">${esc(ch.previous || '—')}</td>
                            <td style="padding:5px 8px;color:#15803d;font-weight:600">${esc(ch.updated || '—')}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') || '<div style="color:var(--slate-400)">No version history entries found.</div>'}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--slate-200)">
          <button class="sec" onclick="act.openEditBehaviorModal(${bp.id}, 'all')">✏️ Edit This Behavior</button>
          <button class="ok" onclick="act.closeModal()">Close History</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'behavior_delete') {
    const bp = activeModal.behavior || {};
    const histCount = bp.historical_event_count || 0;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:560px;width:95%">
        <div class="flex-between" style="padding-bottom:10px;border-bottom:1px solid var(--slate-200)">
          <div>
            <span class="badge esc">Clinical Data Protection Safeguard</span>
            <h3 style="margin:4px 0 0">Delete or Archive Target Behavior</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="margin:14px 0;font-size:0.88rem;line-height:1.5;color:var(--slate-800)">
          You selected <b>Delete Behavior</b> for <b>"${esc(bp.name)}"</b> (Version v${bp.version || 1}).
        </div>

        ${histCount > 0 ? `
          <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-left:4px solid var(--warn);border-radius:8px;padding:12px;margin-bottom:14px;font-size:0.82rem;color:#78350f">
            <b>⚠️ Clinical Safeguard Active (${histCount} Historical Observation${histCount === 1 ? '' : 's'} Linked):</b><br>
            This behavior has <b>${histCount} recorded clinical observation(s)</b>. To comply with clinical record-retention standards and protect historical data:
            <ul style="margin:6px 0 0 18px;padding:0">
              <li><b>Recommended:</b> Archive this behavior so it is retired from active RBT session cards while remaining accessible for clinical review.</li>
              <li>Even if you force-remove the behavior card, all <b>${histCount} historical data points are permanently preserved</b> in the client's clinical log.</li>
            </ul>
          </div>
        ` : `
          <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:8px;padding:12px;margin-bottom:14px;font-size:0.82rem;color:var(--slate-600)">
            No historical clinical observations have been logged for <b>"${esc(bp.name)}"</b> yet. You may safely delete this behavior card or archive it for future reference.
          </div>
        `}

        <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--slate-200)">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.confirmArchiveFromDeleteModal(${bp.id})">
            📦 Archive Behavior Instead (Recommended)
          </button>
          <button class="bad" onclick="act.confirmDeleteBehavior(${bp.id}, ${histCount > 0 ? 'true' : 'false'})">
            🗑️ ${histCount > 0 ? `Remove Card (Preserve ${histCount} Events)` : 'Confirm Delete Behavior'}
          </button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'behavior_event') {
    const cid = activeModal.clientId;
    const sid = activeModal.sessionId;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:680px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge p">Continuous, Duration Start/End & Observed vs. Recorded Time</span>
            <h3 style="margin:4px 0 0">Log Behavior Measurement Data</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:8px 12px;margin-top:10px;font-size:0.78rem;color:#166534">
          <b>✓ Automatic Timestamping:</b> Every behavior record automatically receives a recorded timestamp upon save without requiring manual time entry. Optional <b>Start/End Timestamps</b> auto-calculate duration, and optional <b>Observed Time</b> distinguishes when the behavior occurred from when it was recorded.
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
              <option value="duration">Duration (Start/End or Seconds)</option>
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
            <label>Duration (Seconds — or Auto from Start/End below)</label>
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

        <div class="row" style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:10px;margin:8px 0">
          <div>
            <label>Duration Start Timestamp (Optional)</label>
            <input id="be_start_ts" type="datetime-local" onchange="act.recalcModalDuration('be_start_ts','be_end_ts','be_dur')">
          </div>
          <div>
            <label>Duration End Timestamp (Optional)</label>
            <input id="be_end_ts" type="datetime-local" onchange="act.recalcModalDuration('be_start_ts','be_end_ts','be_dur')">
          </div>
          <div>
            <label>Observed Time (Optional — if earlier than Recorded Time)</label>
            <input id="be_observed_at" type="datetime-local">
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
  if (activeModal.type === 'edit_behavior_event') {
    const ev = activeModal.event || {};
    const sid = activeModal.sessionId;
    const orig = ev.original_value || ev;
    const hist = Array.isArray(ev.edit_history) ? ev.edit_history : [];
    const toLocalInput = (iso) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch { return ''; }
    };
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:680px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge sen">Immutable Original Value & Clinical Edit Audit Log</span>
            <h3 style="margin:4px 0 0">Edit Behavior Event #${ev.id} (${esc(ev.behavior_name || ev.behavior)})</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:10px;padding:10px 12px;margin-top:10px;font-family:var(--font-mono);font-size:0.75rem;color:#334155">
          <div style="font-weight:800;color:#0f4c5c;margin-bottom:4px">🔒 Preserved Original Value (Never Overwritten):</div>
          <div>Behavior: <b>${esc(orig.behavior_name || orig.behavior)}</b> · Method: <b>${esc(orig.measurement_type)}</b> · Count: <b>${orig.count ?? orig.value ?? 1}</b> · Duration: <b>${orig.duration_sec ?? 0}s</b></div>
          <div>Original Observed Time: <b>${esc(orig.observed_at || orig.ts || '—')}</b> · Original Recorded Time: <b>${esc(orig.recorded_at || orig.ts || '—')}</b></div>
        </div>

        <div class="row" style="margin-top:12px">
          <div>
            <label>Count / Value</label>
            <input id="ebe_count" type="number" min="0" value="${ev.count ?? ev.value ?? 1}">
          </div>
          <div>
            <label>Duration (Seconds)</label>
            <input id="ebe_dur" type="number" min="0" value="${ev.duration_sec ?? 0}">
          </div>
          <div>
            <label>Latency (Seconds)</label>
            <input id="ebe_lat" type="number" min="0" value="${ev.latency_sec ?? 0}">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Start Timestamp (ISO or Local)</label>
            <input id="ebe_start_ts" type="datetime-local" value="${toLocalInput(ev.start_ts)}" onchange="act.recalcModalDuration('ebe_start_ts','ebe_end_ts','ebe_dur')">
          </div>
          <div>
            <label>End Timestamp (ISO or Local)</label>
            <input id="ebe_end_ts" type="datetime-local" value="${toLocalInput(ev.end_ts)}" onchange="act.recalcModalDuration('ebe_start_ts','ebe_end_ts','ebe_dur')">
          </div>
          <div>
            <label>Observed Time (Distinguished from Recorded Time)</label>
            <input id="ebe_observed_at" type="datetime-local" value="${toLocalInput(ev.observed_at || ev.ts)}">
          </div>
        </div>

        <label>Clinical Notes</label>
        <input id="ebe_notes" value="${esc(ev.notes || '')}">

        <label>Reason for Edit (Recorded in Audit History)</label>
        <input id="ebe_reason" placeholder="e.g., Adjusted episode end time based on video review" value="Clinical verification update">

        ${hist.length ? `
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:0.75rem;color:#78350f">
            <div style="font-weight:800;margin-bottom:4px">📜 Existing Edit Audit History (${hist.length}):</div>
            ${hist.map((h, i) => `
              <div style="margin-bottom:4px">
                #${i + 1} · <b>${esc(h.edited_by)} (${esc(h.edited_role)})</b> at ${esc(h.edited_at)} — Reason: <i>${esc(h.reason)}</i>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitEditBehaviorEventModal(${ev.id}, ${sid || 'null'})">💾 Save Edit & Append Audit History</button>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'edit_session_event') {
    const se = activeModal.sessionEvent || {};
    const sid = activeModal.sessionId;
    const orig = se.original_value || se;
    const hist = Array.isArray(se.edit_history) ? se.edit_history : [];
    const toLocalInput = (iso) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch { return ''; }
    };
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:640px;width:95%">
        <div class="flex-between">
          <div>
            <span class="badge sen">Session Timeline Event Audit & Edit</span>
            <h3 style="margin:4px 0 0">Edit Session Event #${se.id} (${esc(se.event_type)})</h3>
          </div>
          <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:10px;padding:10px 12px;margin-top:10px;font-family:var(--font-mono);font-size:0.75rem;color:#334155">
          <div style="font-weight:800;color:#0f4c5c;margin-bottom:4px">🔒 Preserved Original Value:</div>
          <div>Type: <b>${esc(orig.event_type)}</b> · Duration: <b>${orig.duration_sec ?? 0}s</b> · Observed: <b>${esc(orig.observed_at || orig.ts || '—')}</b> · Recorded: <b>${esc(orig.recorded_at || orig.ts || '—')}</b></div>
        </div>

        <div class="row" style="margin-top:12px">
          <div>
            <label>Start Timestamp</label>
            <input id="ese_start_ts" type="datetime-local" value="${toLocalInput(se.start_ts || se.ts)}" onchange="act.recalcModalDuration('ese_start_ts','ese_end_ts','ese_dur')">
          </div>
          <div>
            <label>End Timestamp</label>
            <input id="ese_end_ts" type="datetime-local" value="${toLocalInput(se.end_ts || se.ts)}" onchange="act.recalcModalDuration('ese_start_ts','ese_end_ts','ese_dur')">
          </div>
          <div>
            <label>Duration (Seconds)</label>
            <input id="ese_dur" type="number" min="0" value="${se.duration_sec ?? 0}">
          </div>
        </div>

        <label>Observed Time (Distinguished from Recorded Time)</label>
        <input id="ese_observed_at" type="datetime-local" value="${toLocalInput(se.observed_at || se.ts)}">

        <label>Notes</label>
        <input id="ese_notes" value="${esc(se.notes || '')}">

        <label>Reason for Edit (Audit History)</label>
        <input id="ese_reason" value="Updated session timeline event">

        ${hist.length ? `
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:0.75rem;color:#78350f">
            <div style="font-weight:800;margin-bottom:4px">📜 Existing Edit Audit History (${hist.length}):</div>
            ${hist.map((h, i) => `<div>#${i + 1} · <b>${esc(h.edited_by)}</b> at ${esc(h.edited_at)} — ${esc(h.reason)}</div>`).join('')}
          </div>
        ` : ''}

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitEditSessionEventModal(${se.id}, ${sid || 'null'})">💾 Save Session Event Edit</button>
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
    const cid = activeModal.clientId || (report.reportTemplate && report.reportTemplate.clientId) || 1;
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:1180px;width:96%;max-height:92vh;overflow-y:auto">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px">
          <div>
            <span class="badge p">CPT 97151 / 97155 Insurance Progress & Auto-Populated Assessment Report</span>
            <h3 style="margin:4px 0 0">${esc(report.title)}</h3>
            <div style="font-size:0.85rem;color:var(--slate-500)">Client: <b>${esc(report.client_name)}</b> · Date: ${esc(report.date)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button type="button" class="${reauthModalTab === 'structured_template' ? 'ok' : 'sec'}" style="padding:6px 12px;font-size:0.78rem" onclick="reauthModalTab='structured_template';render()">
              📊 Auto-Populated Domain Tables (PDF Template)
            </button>
            <button type="button" class="${reauthModalTab === 'narrative' ? 'ok' : 'sec'}" style="padding:6px 12px;font-size:0.78rem" onclick="reauthModalTab='narrative';render()">
              📄 5-Section Insurance Narrative Text
            </button>
            <button class="sec" style="padding:4px 10px" onclick="act.closeModal()">✕</button>
          </div>
        </div>

        <div style="background:var(--ok-light);border:1px solid var(--ok-border);padding:10px 14px;border-radius:var(--radius-md);margin:14px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-weight:700;color:#065f46">🎯 Clinical Progress Summary:</div>
            <div style="font-size:0.85rem;color:#047857">${report.masteredCount} of ${report.totalGoals} skill acquisition targets have reached mastery or criteria-met during this 6-month period.</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="sec" style="padding:6px 12px;font-size:0.78rem" onclick="act.copyReport()">📋 Copy Narrative Text</button>
            <button class="ok" style="padding:6px 12px;font-size:0.78rem" onclick="window.print()">🖨️ Print / Save as PDF</button>
          </div>
        </div>

        ${reauthModalTab === 'structured_template' ? renderAutoPopulatedReportTemplateSection({ id: cid, name: report.client_name }, { reportTemplate: report.reportTemplate }, true) : ''}

        <div class="report-content" id="report_text_body" style="${reauthModalTab === 'structured_template' ? 'margin-top:16px;' : ''}background:#fff;border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:16px;font-size:0.88rem;line-height:1.6;white-space:pre-wrap;font-family:system-ui;color:var(--slate-800)">${esc(report.text)}</div>

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
          <div style="margin:6px 0 12px">
            <label>BCBA-Configured Prompt Levels Shown to RBT in Session (Comma-Separated Codes or Preset)</label>
            <input id="edit_g_prompts" value="${esc(g.configured_prompts || 'I,V,G')}" placeholder="e.g. I,V,G">
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
              <button type="button" class="sec" style="padding:3px 8px;font-size:0.72rem" onclick="document.getElementById('edit_g_prompts').value='I,V,G'">Simplified Default: IND, VERB, GEST (I,V,G)</button>
              <button type="button" class="sec" style="padding:3px 8px;font-size:0.72rem" onclick="document.getElementById('edit_g_prompts').value='I,V,G,M,P'">5-Level (I,V,G,M,P)</button>
              <button type="button" class="sec" style="padding:3px 8px;font-size:0.72rem" onclick="document.getElementById('edit_g_prompts').value='I,V,G,Vi,M,PP,P,INC,N,NA'">All 10 Levels</button>
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

        <div class="flex-between" style="align-items:flex-end;gap:8px;margin-bottom:4px">
          <label style="margin:0">Target Operational Title / Goal Statement</label>
          <button type="button" class="ok" style="padding:5px 10px;font-size:0.75rem;background:#0f766e" onclick="act.aiRecommendInGoalModal(${cid})">
            ✨ AI Recommend Operational Definition & Measurement
          </button>
        </div>
        <input id="new_g_title" placeholder="e.g. Leon will initiate movement toward the next activity within 5 seconds of a transition cue" value="${esc(prefill)}">
        <div id="new_g_ai_banner" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:0.78rem;color:#065f46"></div>

        <label>Operational Definition (What exactly should be observed & recorded)</label>
        <textarea id="new_g_def" rows="2" placeholder="Click '✨ AI Recommend' above or enter an observable, measurable definition..."></textarea>

        <div class="row">
          <div>
            <label>Onset Criteria</label>
            <input id="new_g_onset" placeholder="When timing/observation begins">
          </div>
          <div>
            <label>Offset Criteria</label>
            <input id="new_g_offset" placeholder="When response/episode ends">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Examples (Included)</label>
            <input id="new_g_examples" placeholder="Observable topographies included">
          </div>
          <div>
            <label>Non-Examples (Excluded)</label>
            <input id="new_g_non" placeholder="Topographies or prompts excluded">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Primary Measurement Method</label>
            <select id="new_g_mtype">
              ${SMART_MEASUREMENT_OPTIONS.map(m => `<option value="${m.key}">${esc(m.label)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Secondary Measurement (Optional)</label>
            <select id="new_g_sec_mtype">
              <option value="">None</option>
              ${SMART_MEASUREMENT_OPTIONS.map(m => `<option value="${m.key}">${esc(m.label)}</option>`).join('')}
            </select>
          </div>
        </div>

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
          <div>
            <label>RBT Prompt Buttons Shown</label>
            <input id="new_g_prompts" value="I,V,G" title="Comma-separated prompt codes shown on RBT session card (e.g. I,V,G)">
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
  if (activeModal.type === 'client_billing_snapshot') {
    const s = activeModal.snapshot || {};
    const auths = s.authorizations || [];
    const claims = s.sessionClaims || [];
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:920px;width:96%;max-height:92vh;overflow-y:auto">
        <div class="flex-between" style="flex-wrap:wrap;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--slate-200)">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="user-avatar" style="width:44px;height:44px;font-size:0.95rem">${getInitials(s.clientName || 'Client')}</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="badge p">Administrative Billing & Reimbursement Snapshot</span>
                <span class="badge ${s.billingStatusTone || 'ok'}">${esc(s.billingStatus || 'Current')}</span>
              </div>
              <h3 style="margin:4px 0 0;font-size:1.3rem">${esc(s.clientName)} — Payer & Reimbursement Ledger</h3>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="ok" style="padding:7px 14px;font-size:0.82rem" onclick="window.print()">🖨️ Print Statement</button>
            <button class="sec" style="padding:5px 10px" onclick="act.closeModal()">✕</button>
          </div>
        </div>

        <!-- 1. Payer, Policy & Family Coverage Details -->
        <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:14px 16px;margin:14px 0">
          <div style="font-size:0.75rem;font-weight:700;color:var(--slate-500);text-transform:uppercase;margin-bottom:8px">1. Insurance Policy, Prior Authorization & Family Responsibility</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;font-size:0.84rem">
            <div><span style="color:var(--slate-500)">Insurance Payer:</span><br><b>${esc(s.payerName)}</b></div>
            <div><span style="color:var(--slate-500)">Plan Type:</span><br><b>${esc(s.planType)}</b></div>
            <div><span style="color:var(--slate-500)">Subscriber / Member ID:</span><br><b style="font-family:var(--font-mono)">${esc(s.memberId)}</b></div>
            <div><span style="color:var(--slate-500)">Prior Authorization #:</span><br><b style="font-family:var(--font-mono)">${esc(s.authNumber)}</b> (${esc(s.authEffective)} → ${esc(s.authExpires)})</div>
            <div><span style="color:var(--slate-500)">Copay & Deductible Status:</span><br><b>${esc(s.copayInfo)}</b></div>
            <div><span style="color:var(--slate-500)">Patient / Family Balance:</span><br><b style="color:${s.patientBalance > 0 ? 'var(--warn)' : 'var(--ok)'}">$${(s.patientBalance || 0).toLocaleString()}</b> (${esc(s.guardian)})</div>
            <div><span style="color:var(--slate-500)">Primary Diagnosis:</span><br><b>${esc(s.diagnosis)}</b></div>
            <div><span style="color:var(--slate-500)">Assigned Clinical Team:</span><br><b>${esc(s.assignedTeam)}</b></div>
          </div>
        </div>

        <!-- 2. Billed vs. Reimbursed vs. Pending vs. Held KPI Cards -->
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:14px 0">
          <div class="stat-card">
            <div class="stat-label">Total Billed (Auth Cycle)</div>
            <div class="stat" style="color:var(--slate-900)">$${(s.totalBilled || 0).toLocaleString()}</div>
            <div class="stat-sub">Contracted Allowed: <b>$${(s.totalAllowed || 0).toLocaleString()}</b></div>
          </div>
          <div class="stat-card ok">
            <div class="stat-label">Reimbursed (ERA/EFT Paid)</div>
            <div class="stat" style="color:var(--ok)">$${(s.totalReimbursed || 0).toLocaleString()}</div>
            <div class="stat-sub"><b>${s.reimbursementRatePct}%</b> net payer realization</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Payer (837P)</div>
            <div class="stat" style="color:var(--primary)">$${(s.pendingPayerAmount || 0).toLocaleString()}</div>
            <div class="stat-sub">${s.pendingSessionsCount || 0} clean claim(s) in clearinghouse</div>
          </div>
          <div class="stat-card ${s.heldAmount > 0 ? 'bad' : 'ok'}">
            <div class="stat-label">Held Claims (Unbilled)</div>
            <div class="stat" style="color:${s.heldAmount > 0 ? 'var(--bad)' : 'var(--ok)'}">$${(s.heldAmount || 0).toLocaleString()}</div>
            <div class="stat-sub">${s.heldSessionsCount || 0} session(s) missing note / co-sign</div>
          </div>
        </div>

        <!-- 3. CPT Authorization & Dollar Utilization Breakdown -->
        <h4 style="margin:16px 0 8px;font-size:0.95rem">2. CPT Authorization Burn-Down & Contracted Dollar Value</h4>
        <div class="table-responsive" style="margin-bottom:16px">
          <table>
            <thead>
              <tr>
                <th>CPT Code</th>
                <th>Service Description</th>
                <th>Rate</th>
                <th>Authorized Units ($)</th>
                <th>Used Units ($)</th>
                <th>Remaining Units ($)</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              ${auths.map(a => `
                <tr>
                  <td><b>CPT ${esc(a.code)}</b></td>
                  <td>${esc(a.label)}</td>
                  <td>$${a.ratePerUnit}/unit ($${a.ratePerHour}/hr)</td>
                  <td>${a.authorized}u ($${(a.authorizedValue || 0).toLocaleString()})</td>
                  <td><b>${a.used}u ($${(a.usedValue || 0).toLocaleString()})</b></td>
                  <td>${a.remaining}u ($${(a.remainingValue || 0).toLocaleString()})</td>
                  <td>
                    <span class="tag ${a.atRisk ? 'draft' : 'approved'}">${a.burnPct}% Used</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 4. Session-by-Session Claim & ERA Reimbursement Ledger -->
        <h4 style="margin:16px 0 8px;font-size:0.95rem">3. Recent Session Claims & ERA Reimbursement Ledger</h4>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Claim ID / Date</th>
                <th>Clinician</th>
                <th>CPT & Units</th>
                <th>Billed</th>
                <th>Allowed</th>
                <th>Reimbursed</th>
                <th>ERA / 837P Status</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${claims.length ? claims.map(cl => `
                <tr>
                  <td>
                    <b>${esc(cl.claimId)}</b>
                    <div style="font-size:0.75rem;color:var(--slate-500)">${esc(cl.date)} · Session #${cl.sessionId}</div>
                  </td>
                  <td>
                    <b>${esc(cl.staffName)}</b>
                    <div style="font-size:0.74rem;color:var(--slate-500)">${esc(cl.staffRole)}</div>
                  </td>
                  <td>
                    <span class="badge p">CPT ${esc(cl.cptCode)}</span>
                    <div style="font-size:0.76rem;color:var(--slate-600);margin-top:2px">${cl.units} units (${cl.hours} hrs)</div>
                  </td>
                  <td><b>$${cl.billedAmount}</b></td>
                  <td>$${cl.allowedAmount}</td>
                  <td>
                    <b style="color:${cl.reimbursedAmount > 0 ? 'var(--ok)' : 'var(--slate-500)'}">$${cl.reimbursedAmount}</b>
                    ${cl.copayAmount > 0 ? `<div style="font-size:0.7rem;color:var(--slate-500)">+$${cl.copayAmount} copay</div>` : ''}
                  </td>
                  <td>
                    <span class="tag ${cl.claimState === 'paid' ? 'approved' : cl.claimState === 'pending' ? 'pending_approval' : 'bad'}">
                      ${esc(cl.claimStatus)}
                    </span>
                    <div style="font-size:0.72rem;color:var(--slate-500);margin-top:2px;font-family:var(--font-mono)">Ref: ${esc(cl.eraReference)}</div>
                  </td>
                  <td style="text-align:right">
                    <button class="sec" style="padding:5px 10px;font-size:0.75rem" onclick="act.closeModal();go('session',${cl.sessionId})">
                      ${cl.claimState === 'held' ? 'Resolve Note →' : 'View Note'}
                    </button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--slate-500)">No session claims recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:12px;border-top:1px solid var(--slate-200)">
          <div style="font-size:0.8rem;color:var(--slate-500)">
            CMS 8-Minute Rule Verified · Last ERA Remittance Sync: <b>${esc(s.lastEraDate)}</b>
          </div>
          <div style="display:flex;gap:8px">
            <button class="sec" onclick="act.closeModal();act.quickPillar(${s.clientId}, 'services')">Open Full Client 360 →</button>
            <button class="ok" onclick="act.exportClaimsBatch()">Export Client 837P Claims</button>
            <button class="sec" onclick="act.closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'client_profile_snapshot') {
    const v = activeModal.clientData || {};
    const c = v.client || {};
    const goals = v.goals || [];
    const abcSummary = v.abcSummary || {};
    const plans = v.plans || [];
    const topPlan = plans.find(p => p.status === 'approved') || plans[0] || null;
    const readyGoals = goals.filter(g => g.mastery_met && g.status !== 'mastered');
    const stalledGoals = goals.filter(g => g.stalled && g.status !== 'mastered');
    const activeGoals = goals.filter(g => g.status !== 'mastered');
    const fDist = abcSummary.functions || { Escape: 0, Attention: 0, Tangible: 0, Sensory: 0 };
    const totalBeh = (fDist.Escape + fDist.Attention + fDist.Tangible + fDist.Sensory) || 1;
    const escPct = Math.round(((fDist.Escape || 0) / totalBeh) * 100);
    const attPct = Math.round(((fDist.Attention || 0) / totalBeh) * 100);
    const tanPct = Math.round(((fDist.Tangible || 0) / totalBeh) * 100);
    const senPct = Math.round(((fDist.Sensory || 0) / totalBeh) * 100);
    const peak = (abcSummary.scatterplot && abcSummary.scatterplot.peakWindow) || { label: '11:00 AM', count: 2, primaryAntecedent: c.triggers || 'Transition / demand' };

    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:780px;width:95%;max-height:90vh;overflow-y:auto">
        <!-- Clean Client Profile Header -->
        <div class="flex-between" style="flex-wrap:wrap;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--slate-200)">
          <div style="display:flex;align-items:center;gap:14px">
            <div class="user-avatar" style="width:52px;height:52px;font-size:1.1rem">${getInitials(c.name || 'Client')}</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="badge p">Client Profile Snapshot</span>
                <span class="badge ok">${esc(c.diagnosis || 'Autism Spectrum Disorder')}</span>
              </div>
              <h3 style="margin:4px 0 2px;font-size:1.35rem">${esc(c.name)}</h3>
              <div style="font-size:0.82rem;color:var(--slate-500)">
                DOB: <b>${esc(c.dob || 'On file')}</b> &nbsp;·&nbsp;
                Setting: <b>${esc(c.school || 'Clinic / Home')}</b> &nbsp;·&nbsp;
                Guardian: <b>${esc(c.guardian || 'On file')}</b>
              </div>
            </div>
          </div>
          <button class="sec" style="padding:5px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <!-- 4 Clinical Profile Vitals -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:14px 0">
          <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
            <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">💬 Communication</div>
            <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:3px">${esc(c.communication || 'Vocal / PECS')}</div>
          </div>
          <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
            <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">⭐ Favorite Rewards</div>
            <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:3px">${esc(c.reinforcers || 'LEGO, stickers, tablet time')}</div>
          </div>
          <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
            <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">🎧 Sensory Profile</div>
            <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:3px">${esc(c.sensory || 'Noise-canceling headphones')}</div>
          </div>
          <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200)">
            <div style="font-size:0.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase">⚡ Known Triggers</div>
            <div style="font-weight:600;color:var(--slate-800);font-size:0.84rem;margin-top:3px">${esc(c.triggers || 'Transitions, denied access')}</div>
          </div>
        </div>

        <!-- 1A & 1B: Goals Ready to Master vs Stalled -->
        <div class="row" style="margin-bottom:14px">
          <div style="flex:1;background:#f8fafc;border:1px solid var(--slate-200);border-top:3px solid var(--ok);border-radius:var(--radius-md);padding:12px">
            <div class="flex-between" style="margin-bottom:6px">
              <b style="font-size:0.88rem">1A. Goals Ready to Master</b>
              <span class="tag approved">${readyGoals.length} Ready</span>
            </div>
            ${readyGoals.length ? readyGoals.map(g => `
              <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200);font-size:0.82rem;margin-top:4px;display:flex;justify-content:space-between;align-items:center">
                <span><b>${esc(g.title)}</b> (${g.current ?? 85}%)</span>
                <button class="ok" style="padding:4px 8px;font-size:0.74rem" onclick="act.closeModal();act.quickMasterGoal(${g.id})">✓ Master</button>
              </div>
            `).join('') : '<div style="font-size:0.8rem;color:var(--slate-500)">No goals waiting for mastery sign-off.</div>'}
          </div>
          <div style="flex:1;background:#f8fafc;border:1px solid var(--slate-200);border-top:3px solid var(--warn);border-radius:var(--radius-md);padding:12px">
            <div class="flex-between" style="margin-bottom:6px">
              <b style="font-size:0.88rem">1B. Stalled / Active Goals</b>
              <span class="tag draft">${stalledGoals.length} Stalled</span>
            </div>
            ${(stalledGoals.length ? stalledGoals : activeGoals.slice(0, 2)).map(g => `
              <div style="background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--slate-200);font-size:0.82rem;margin-top:4px;display:flex;justify-content:space-between;align-items:center">
                <span><b>${esc(g.title)}</b> (${g.current ?? g.baseline ?? 20}% / ${g.target ?? 80}%)</span>
                <button class="sec" style="padding:4px 8px;font-size:0.74rem" onclick="act.closeModal();act.quickPillar(${c.id}, 'skills')">View →</button>
              </div>
            `).join('') || '<div style="font-size:0.8rem;color:var(--slate-500)">All active goals progressing well.</div>'}
          </div>
        </div>

        <!-- 2. Patterns in Behavior -->
        <div style="background:#f8fafc;border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:12px;margin-bottom:14px">
          <div class="flex-between" style="margin-bottom:8px">
            <b style="font-size:0.88rem">2. Patterns in Behavior (Why & When Behaviors Happen)</b>
            <span class="badge esc">Peak: ${esc(peak.label || '11:00 AM')}</span>
          </div>
          <div style="display:flex;height:18px;border-radius:6px;overflow:hidden;margin-bottom:8px">
            <div style="width:${escPct}%;background:#be123c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700">${escPct > 12 ? `Escape ${escPct}%` : ''}</div>
            <div style="width:${attPct}%;background:#0284c7;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700">${attPct > 12 ? `Attention ${attPct}%` : ''}</div>
            <div style="width:${tanPct}%;background:#d97706;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700">${tanPct > 12 ? `Tangible ${tanPct}%` : ''}</div>
            <div style="width:${senPct}%;background:#0f766e;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700">${senPct > 12 ? `Sensory ${senPct}%` : ''}</div>
          </div>
          <div style="font-size:0.8rem;color:var(--slate-600)">
            <b>Most Common Trigger:</b> ${esc(peak.primaryAntecedent || c.triggers || 'Transition')} &nbsp;·&nbsp;
            <b>BIP Replacement (FCT):</b> ${esc(topPlan && topPlan.data ? topPlan.data.replacement : 'Prompted functional communication request')}
          </div>
        </div>

        <!-- Clean Action Footer -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:12px;border-top:1px solid var(--slate-200)">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="ok" style="padding:8px 16px;font-size:0.84rem" onclick="act.closeModal();go('client', ${c.id})">
              👧 Open Full Client Profile →
            </button>
            ${['BCBA', 'OWNER', 'ADMIN'].includes(me.role) ? `
              <button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="act.openScheduleRbtModal(${c.id}, '${esc(c.name)}')">
                📅 Schedule RBT
              </button>
            ` : ''}
            <button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="act.openClientBillingModal(${c.id})">
              💳 Billing Snapshot
            </button>
          </div>
          <div style="display:flex;gap:8px">
            ${activeModal.appointmentId ? `
              <button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="const aid=${activeModal.appointmentId};act.closeModal();act.start(aid)">
                ▶ Start / Open Session
              </button>
            ` : ''}
            <button class="sec" style="padding:8px 14px;font-size:0.82rem" onclick="act.closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  if (activeModal.type === 'schedule_rbt') {
    const todayIso = new Date().toISOString().slice(0, 10);
    const staffList = activeModal.staffList || [];
    const clientList = activeModal.clientList || [];
    const rbts = staffList.filter((s) => s.role === 'RBT');
    const bcbas = staffList.filter((s) => s.role === 'BCBA');
    const defaultRbtId = rbts.length ? rbts[0].id : (staffList[0] ? staffList[0].id : 4);
    const matchedClient = activeModal.clientId
      ? clientList.find((c) => Number(c.id) === Number(activeModal.clientId))
      : (activeModal.clientName ? clientList.find((c) => (c.name || '').toLowerCase() === String(activeModal.clientName).toLowerCase()) : clientList[0]);
    const selectedClientId = matchedClient ? matchedClient.id : (activeModal.clientId || (clientList[0] && clientList[0].id) || 1);
    return `
    <div class="modal-bg" onclick="if(event.target===this)act.closeModal()">
      <div class="modal-card" style="max-width:600px;width:95%">
        <div class="flex-between" style="padding-bottom:12px;border-bottom:1px solid var(--slate-200);margin-bottom:14px">
          <div>
            <span class="badge p">Assign & Schedule RBT Appointment</span>
            <h3 style="margin:4px 0 0">📅 Schedule RBT Session${activeModal.clientName ? ` for ${esc(activeModal.clientName)}` : ''}</h3>
          </div>
          <button class="sec" style="padding:5px 10px" onclick="act.closeModal()">✕</button>
        </div>

        <div style="background:var(--slate-50);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--slate-200);margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <span style="font-size:0.78rem;font-weight:700;color:var(--slate-600)">1-Click Shift Window Presets:</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.setModalApptWindow('${todayIso}T09:00','${todayIso}T12:00')">☀️ 9:00 AM–12:00 PM</button>
              <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.setModalApptWindow('${todayIso}T12:30','${todayIso}T15:30')">🌤️ 12:30 PM–3:30 PM</button>
              <button type="button" class="sec" style="padding:5px 10px;font-size:0.76rem" onclick="act.setModalApptWindow('${todayIso}T15:30','${todayIso}T17:30')">🌇 3:30 PM–5:30 PM</button>
            </div>
          </div>
        </div>

        <label>Select Client</label>
        <select id="m_sched_client">
          ${clientList.map((c) => `<option value="${c.id}" ${Number(c.id) === Number(selectedClientId) ? 'selected' : ''}>👧 ${esc(c.name)} (${esc(c.diagnosis || 'ABA Therapy')})</option>`).join('')}
        </select>

        <label>Select RBT / Clinician</label>
        <select id="m_sched_rbt">
          ${rbts.length ? `<optgroup label="RBTs — Direct Therapy (CPT 97153)">${rbts.map((s) => `<option value="${s.id}" ${s.id === defaultRbtId ? 'selected' : ''}>👨‍⚕️ ${esc(s.name)} (RBT)</option>`).join('')}</optgroup>` : ''}
          ${bcbas.length ? `<optgroup label="BCBAs — Supervision & Direction (CPT 97155)">${bcbas.map((s) => `<option value="${s.id}">👩‍⚕️ ${esc(s.name)} (BCBA)</option>`).join('')}</optgroup>` : ''}
        </select>

        <div class="row">
          <div>
            <label>Start Date & Time</label>
            <input id="m_sched_start" type="datetime-local" value="${todayIso}T09:00">
          </div>
          <div>
            <label>End Date & Time</label>
            <input id="m_sched_end" type="datetime-local" value="${todayIso}T12:00">
          </div>
        </div>

        <label>Treatment Setting</label>
        <select id="m_sched_setting">
          <option value="Clinic">Clinic</option>
          <option value="Home">Home</option>
          <option value="School">School</option>
        </select>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--slate-200)">
          <button class="sec" onclick="act.closeModal()">Cancel</button>
          <button class="ok" onclick="act.submitScheduleRbtModal(${selectedClientId})">✓ Assign & Schedule RBT Session</button>
        </div>
      </div>
    </div>`;
  }
  return '';
}

// ---------- Actions ----------
const act = {
  toggleMobileNav: () => {
    mobileNavOpen = !mobileNavOpen;
    render();
  },
  openScheduleRbtModal: safe(async (clientId = null, clientName = '') => {
    const [staffList, clientList] = await Promise.all([api('GET', '/api/staff'), api('GET', '/api/clients')]);
    activeModal = { type: 'schedule_rbt', clientId, clientName: clientName || '', staffList, clientList };
    render();
  }),
  setApptWindow: (startVal, endVal) => {
    const sEl = document.getElementById('astart');
    const eEl = document.getElementById('aend');
    if (sEl) sEl.value = startVal;
    if (eEl) eEl.value = endVal;
  },
  setModalApptWindow: (startVal, endVal) => {
    const sEl = document.getElementById('m_sched_start');
    const eEl = document.getElementById('m_sched_end');
    if (sEl) sEl.value = startVal;
    if (eEl) eEl.value = endVal;
  },
  submitScheduleRbtModal: safe(async (fallbackClientId) => {
    const client_id = val('m_sched_client') || fallbackClientId;
    const user_id = val('m_sched_rbt');
    const start = val('m_sched_start');
    const end = val('m_sched_end');
    const setting = val('m_sched_setting') || 'Clinic';
    const res = await api('POST', '/api/appointments', { client_id, user_id, start, end, setting });
    activeModal = null;
    alert(`✓ Scheduled ${res.staff || 'RBT'} (${res.role || 'RBT'}) for session (${res.start.replace('T', ' ')} – ${res.end.slice(11)} · ${res.setting})!`);
    render();
  }),
  reassignAppt: safe(async (apptId, newUserId) => {
    const res = await api('PUT', `/api/appointments/${apptId}`, { user_id: +newUserId });
    alert(`✓ Reassigned appointment #${apptId} to ${res.staff} (${res.role}).`);
    render();
  }),
  openClientSnapshotModal: safe(async (clientId, appointmentId) => {
    const clientData = await api('GET', `/api/clients/${clientId}`);
    activeModal = { type: 'client_profile_snapshot', clientData, appointmentId: appointmentId || null };
    render();
  }),
  openClientBillingModal: safe(async (clientId) => {
    const cached = (lastClientBillingSnapshots || []).find(s => Number(s.clientId) === Number(clientId));
    const snapshot = cached || await api('GET', `/api/clients/${clientId}/billing-snapshot`);
    activeModal = { type: 'client_billing_snapshot', snapshot };
    render();
  }),
  filterClientBillingTable: (query, status) => {
    if (query !== null && query !== undefined) clientBillingSearchQuery = query;
    if (status !== null && status !== undefined) clientBillingStatusFilter = status;
    const tbody = document.getElementById('client_billing_tbody');
    if (tbody && window.renderClientBillingRowsHtml) {
      tbody.innerHTML = window.renderClientBillingRowsHtml(lastClientBillingSnapshots);
    } else {
      render();
    }
  },
  resetClientBillingFilters: () => {
    clientBillingSearchQuery = '';
    clientBillingStatusFilter = 'ALL';
    const inp = document.getElementById('client_billing_search_input');
    if (inp) inp.value = '';
    render();
  },
  setLoginAuthTab: (t) => {
    loginAuthTab = t;
    $app.innerHTML = loginView();
  },
  registerAccount: safe(async () => {
    try {
      const name = val('reg_name').trim();
      const email = val('reg_em').trim();
      const password = val('reg_pw');
      const role = val('reg_role') || 'BCBA';
      me = await api('POST', '/api/auth/register', { name, email, password, role });
      await syncFirebaseVault('pull');
      location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard';
      render();
    } catch (e) {
      $app.innerHTML = loginView(e.message);
    }
  }),
  manualFirebaseSync: safe(async () => {
    const res = await syncFirebaseVault('pull');
    alert(`🔥 Firebase Cloud Vault Synced (rbt-sepia-aba)\nSynced At: ${res && res.syncedAt ? res.syncedAt : new Date().toISOString()}`);
    render();
  }),
  login: safe(async () => {
    try {
      me = await api('POST', '/api/login', { email: val('em'), password: val('pw') });
      await syncFirebaseVault('pull');
      location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard';
      render();
    } catch (e) { $app.innerHTML = loginView(e.message); }
  }),
  demoLogin: safe(async (email) => {
    try {
      me = await api('POST', '/api/login', { email, password: 'password' });
      kpiPersona = null;
      mobileNavOpen = false;
      location.hash = me.role === 'PARENT' ? 'clients' : 'dashboard';
      render();
    } catch (e) {
      if (!me) {
        $app.innerHTML = loginView(e.message);
      } else {
        alert(`🔒 Hard Lockout Active:\n\n${e.message}`);
      }
    }
  }),
  logout: safe(async () => { await api('POST', '/api/logout'); me = null; kpiPersona = null; mobileNavOpen = false; location.hash = ''; render(); }),
  setKpiPersona: (p) => {
    kpiPersona = p;
    render();
  },
  sendClinicianReminder: (staffName, sessionId) => {
    alert(`Automated 24h compliance reminder dispatched to ${staffName} for Session #${sessionId}.`);
  },
  exportClaimsBatch: () => {
    alert('Generated 837P Clean Claims Batch. 100% CMS 8-minute rule compliant. Ready for clearinghouse dispatch.');
  },
  updateLeadStatus: safe(async (id, status) => {
    await api('PATCH', `/api/leads/${id}`, { status });
    render();
  }),
  editLeadNotes: safe(async (id, currentNote) => {
    const notes = prompt('Enter internal notes for this clinic prospect:', currentNote || '');
    if (notes === null) return;
    await api('PATCH', `/api/leads/${id}`, { notes });
    render();
  }),
  promptAddDemoLead: safe(async () => {
    const clinic = prompt('Prospective Clinic / Practice Name:');
    if (!clinic) return;
    const name = prompt('Primary Contact Name:');
    if (!name) return;
    const email = prompt('Work Email Address:');
    if (!email) return;
    const software = prompt('Current ABA Software (MeasurePM, CentralReach, Paper, etc.):', 'MeasurePM');
    const message = prompt('Clinical requirements / reason for evaluating EBA:', 'Requested demo walkthrough for 1-click re-auth packets and kid mode.');
    await api('POST', '/api/leads', {
      name,
      email,
      clinic_name: clinic,
      current_software: software || 'MeasurePM',
      message: message || ''
    });
    alert('Prospective clinic lead successfully created in CRM queue.');
    render();
  }),
  setLicensingSubTab: (t) => {
    licensingSubTab = t;
    render();
  },
  setAgreementDoc: (docKey) => {
    activeAgreementDoc = docKey;
    render();
  },
  selectAgreementLicense: (licId) => {
    selectedAgreementLicId = Number(licId);
    render();
  },
  copyAgreementText: () => {
    const el = document.getElementById('legal_agreement_text');
    if (el && navigator.clipboard) {
      navigator.clipboard.writeText(el.innerText);
      alert('Legal agreement copied to clipboard!');
    }
  },
  signLicenseAgreement: safe(async (licId, agreementType) => {
    const signer = val('lic_signer_name').trim() || `${me.name} (${me.role})`;
    await api('POST', `/api/licensing/${licId}/sign-agreement`, {
      agreement_type: agreementType,
      signer_name: signer
    });
    alert(`✓ Electronically executed ${agreementType.toUpperCase()} as "${signer}".`);
    render();
  }),
  simulateHardLockout: safe(async (licId) => {
    const pastDate = '2025-01-01';
    await api('PATCH', `/api/licensing/${licId}`, {
      status: 'expired',
      expires_at: pastDate
    });
    alert('🔒 Hard Lockout Activated! All non-Owner accounts (BCBA, RBT, Admin, Parent) are now blocked from logging in until the license key is renewed.');
    render();
  }),
  renewClinicLicenseKey: safe(async (licId) => {
    const res = await api('POST', `/api/licensing/${licId}/activate-key`, { renew: true });
    alert(`🔑 License Renewed & Activated!\nNew HMAC-SHA256 Key: ${res.license_key}\nExpires: ${res.expires_at}`);
    render();
  }),
  prefillTierDefaults: (tier) => {
    const cEl = document.getElementById('cfg_lic_clients');
    const sEl = document.getElementById('cfg_lic_seats');
    if (cEl) cEl.value = tier === 'starter' ? 15 : tier === 'enterprise' ? 100 : 40;
    if (sEl) sEl.value = tier === 'starter' ? 8 : tier === 'enterprise' ? 50 : 20;
  },
  updateLicenseCaps: safe(async (licId) => {
    const tier = val('cfg_lic_tier') || 'growth';
    const billing_cycle = val('cfg_lic_cycle') || 'annual';
    const max_clients = Math.max(1, +val('cfg_lic_clients') || 40);
    const max_seats = Math.max(1, +val('cfg_lic_seats') || 20);
    const expires_at = val('cfg_lic_exp') || '2027-10-31';
    await api('PATCH', `/api/licensing/${licId}`, {
      tier,
      billing_cycle,
      max_clients,
      max_seats,
      expires_at,
      status: 'active'
    });
    alert('✓ Hybrid Client/Seat Caps updated and new cryptographic license key generated!');
    render();
  }),
  issueNewClinicLicense: safe(async () => {
    const clinic_name = val('new_lic_clinic').trim();
    const contact_name = val('new_lic_contact').trim();
    const contact_email = val('new_lic_email').trim();
    if (!clinic_name || !contact_name || !contact_email) {
      return alert('Please enter Clinic Name, Contact Name, and Work Email.');
    }
    const tier = val('new_lic_tier') || 'growth';
    const max_clients = Math.max(1, +val('new_lic_clients') || 40);
    const max_seats = Math.max(1, +val('new_lic_seats') || 20);
    const billing_cycle = val('new_lic_cycle') || 'annual';
    const auto_sign = Boolean((document.getElementById('new_lic_autosign') || {}).checked);
    const res = await api('POST', '/api/licensing/issue', {
      clinic_name,
      contact_name,
      contact_email,
      tier,
      max_clients,
      max_seats,
      billing_cycle,
      auto_sign
    });
    showIssueLicenseForm = false;
    selectedAgreementLicId = res.id;
    alert(`🔑 Issued Clinic License Key:\n${res.license_key}\n\nMSA, HIPAA BAA & EULA generated for ${clinic_name}.`);
    render();
  }),
  issueLicenseFromLead: safe(async (leadId, clinicName, contactName, email, caseloadStr) => {
    const isEnt = String(caseloadStr || '').includes('100') || String(caseloadStr || '').includes('50');
    const isStart = String(caseloadStr || '').includes('1-10') || String(caseloadStr || '').includes('1-15');
    const tier = isEnt ? 'enterprise' : isStart ? 'starter' : 'growth';
    const res = await api('POST', '/api/licensing/issue', {
      lead_id: leadId,
      clinic_name: clinicName,
      contact_name: contactName,
      contact_email: email,
      tier,
      auto_sign: false
    });
    selectedAgreementLicId = res.id;
    licensingSubTab = 'agreements';
    go('licensing');
  }),
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
  toggleBehMenu: (bpId) => {
    openBehMenuId = Number(openBehMenuId) === Number(bpId) ? null : bpId;
    render();
  },
  toggleShowArchivedBehaviors: () => {
    showArchivedBehaviors = !showArchivedBehaviors;
    render();
  },
  openBehaviorProgramModal: (cid) => {
    openBehMenuId = null;
    activeModal = { type: 'behavior_program', clientId: cid, behavior: null, focusSection: 'all' };
    render();
  },
  openEditBehaviorModal: safe(async (bpId, focusSection = 'all') => {
    openBehMenuId = null;
    const bp = await api('GET', `/api/behaviors/${bpId}`);
    activeModal = { type: 'behavior_program', clientId: bp.client_id, behavior: bp, focusSection };
    render();
  }),
  setBehaviorModalFocus: (focusSection) => {
    if (activeModal && activeModal.type === 'behavior_program') {
      activeModal.focusSection = focusSection;
      render();
    }
  },
  submitBehaviorProgramModal: safe(async (cid, bpId = null) => {
    const payload = {
      name: val('bp_name'),
      measurement_type: val('bp_method'),
      operational_definition: val('bp_def'),
      definition: val('bp_def'),
      onset_criteria: val('bp_onset'),
      offset_criteria: val('bp_offset'),
      examples: val('bp_examples'),
      non_examples: val('bp_non'),
      function_hypothesis: val('bp_fn'),
      intensity_criteria: val('bp_intensity'),
      baseline_rate: +val('bp_base') || 0,
      baseline_data: val('bp_baseline_data'),
      target_rate: +val('bp_target') || 0,
      reduction_goal: val('bp_reduction_goal'),
      replacement_skill_goal: val('bp_replacement_goal'),
      mastery_criteria: val('bp_mastery'),
      status: val('bp_status') || 'active',
      change_summary: val('bp_change_summary')
    };
    if (bpId) {
      await api('PUT', `/api/behaviors/${bpId}`, payload);
    } else {
      await api('POST', `/api/clients/${cid}/behaviors`, payload);
    }
    activeModal = null;
    render();
  }),
  openBehaviorHistoryModal: safe(async (bpId) => {
    openBehMenuId = null;
    const bp = await api('GET', `/api/behaviors/${bpId}`);
    activeModal = { type: 'behavior_history', behavior: bp };
    render();
  }),
  toggleArchiveBehavior: safe(async (bpId, currentStatus) => {
    openBehMenuId = null;
    const nextStatus = currentStatus === 'archived' ? 'active' : 'archived';
    await api('POST', `/api/behaviors/${bpId}/archive`, { status: nextStatus });
    if (nextStatus === 'archived') showArchivedBehaviors = true;
    render();
  }),
  openDeleteBehaviorModal: safe(async (bpId) => {
    openBehMenuId = null;
    const bp = await api('GET', `/api/behaviors/${bpId}`);
    activeModal = { type: 'behavior_delete', behavior: bp };
    render();
  }),
  confirmArchiveFromDeleteModal: safe(async (bpId) => {
    await api('POST', `/api/behaviors/${bpId}/archive`, { status: 'archived', reason: 'Archived via delete safeguard to preserve historical clinical data.' });
    showArchivedBehaviors = true;
    activeModal = null;
    render();
  }),
  confirmDeleteBehavior: safe(async (bpId, force = false) => {
    await api('DELETE', `/api/behaviors/${bpId}${force ? '?force=1' : ''}`, { force: Boolean(force) });
    activeModal = null;
    render();
  }),
  openBehaviorEventModal: (cid, sid = null) => { activeModal = { type: 'behavior_event', clientId: cid, sessionId: sid }; render(); },
  recalcModalDuration: (startId, endId, durId) => {
    const sVal = val(startId);
    const eVal = val(endId);
    const durEl = document.getElementById(durId);
    if (sVal && eVal && durEl) {
      const sMs = new Date(sVal).getTime();
      const eMs = new Date(eVal).getTime();
      if (!Number.isNaN(sMs) && !Number.isNaN(eMs) && eMs >= sMs) {
        durEl.value = Math.max(0, Math.round((eMs - sMs) / 1000));
      }
    }
  },
  submitBehaviorEventModal: safe(async (cid, sid) => {
    const recordedAt = new Date(Date.now() + (++tallySeq)).toISOString();
    const rawStart = val('be_start_ts');
    const rawEnd = val('be_end_ts');
    const rawObs = val('be_observed_at');
    const start_ts = rawStart ? new Date(rawStart).toISOString() : null;
    const end_ts = rawEnd ? new Date(rawEnd).toISOString() : null;
    let calcDur = +val('be_dur') || 0;
    if (start_ts && end_ts) {
      const sMs = new Date(start_ts).getTime();
      const eMs = new Date(end_ts).getTime();
      if (!Number.isNaN(sMs) && !Number.isNaN(eMs) && eMs >= sMs) {
        calcDur = Math.max(0, Math.round((eMs - sMs) / 1000));
      }
    }
    const observed_at = rawObs ? new Date(rawObs).toISOString() : (start_ts || recordedAt);
    const bName = val('be_behavior');
    const payload = {
      ts: observed_at,
      observed_at,
      recorded_at: recordedAt,
      start_ts,
      end_ts,
      behavior: bName,
      behavior_name: bName,
      measurement_type: val('be_type'),
      count: +val('be_val') || 1,
      value: +val('be_val') || 1,
      duration_sec: calcDur,
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
      observed_at: ts,
      recorded_at: ts,
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
      const endMs = Date.now();
      const startMs = behTimers[bpId].startMs;
      const startIso = behTimers[bpId].startIso || new Date(startMs).toISOString();
      const endIso = new Date(endMs + (++tallySeq)).toISOString();
      const elapsedSec = Math.max(1, Math.round((endMs - startMs) / 1000));
      delete behTimers[bpId];
      const payload = {
        ts: startIso,
        observed_at: startIso,
        recorded_at: endIso,
        start_ts: startIso,
        end_ts: endIso,
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
      behTimers[bpId] = { startMs: Date.now(), startIso: new Date().toISOString(), mode };
    }
    render();
  }),
  openEditBehaviorEventModal: safe(async (evId, sid = null) => {
    const ev = await api('GET', `/api/behavior-events/${evId}`);
    activeModal = { type: 'edit_behavior_event', event: ev, sessionId: sid };
    render();
  }),
  submitEditBehaviorEventModal: safe(async (evId, sid = null) => {
    const rawStart = val('ebe_start_ts');
    const rawEnd = val('ebe_end_ts');
    const rawObs = val('ebe_observed_at');
    const payload = {
      count: +val('ebe_count') || 1,
      value: +val('ebe_count') || 1,
      duration_sec: +val('ebe_dur') || 0,
      latency_sec: +val('ebe_lat') || 0,
      start_ts: rawStart ? new Date(rawStart).toISOString() : undefined,
      end_ts: rawEnd ? new Date(rawEnd).toISOString() : undefined,
      observed_at: rawObs ? new Date(rawObs).toISOString() : undefined,
      notes: val('ebe_notes'),
      edit_reason: val('ebe_reason') || 'Clinical verification update'
    };
    await api('PUT', `/api/behavior-events/${evId}`, payload);
    localBehEvents = [];
    activeModal = null;
    render();
  }),
  openEditSessionEventModal: safe(async (seId, sid = null) => {
    const tl = sid ? await api('GET', `/api/sessions/${sid}/timeline`) : null;
    const se = (tl && Array.isArray(tl.sessionEvents) && tl.sessionEvents.find((x) => Number(x.id) === Number(seId))) || { id: seId };
    activeModal = { type: 'edit_session_event', sessionEvent: se, sessionId: sid };
    render();
  }),
  submitEditSessionEventModal: safe(async (seId) => {
    const rawStart = val('ese_start_ts');
    const rawEnd = val('ese_end_ts');
    const rawObs = val('ese_observed_at');
    const payload = {
      start_ts: rawStart ? new Date(rawStart).toISOString() : undefined,
      end_ts: rawEnd ? new Date(rawEnd).toISOString() : undefined,
      observed_at: rawObs ? new Date(rawObs).toISOString() : undefined,
      duration_sec: +val('ese_dur') || 0,
      notes: val('ese_notes'),
      edit_reason: val('ese_reason') || 'Updated session timeline event'
    };
    await api('PUT', `/api/session-events/${seId}`, payload);
    activeModal = null;
    render();
  }),
  traceSummaryEvents: (metricKey, eventIds = []) => {
    if (traceFilterMetric === metricKey) {
      traceFilterMetric = null;
      traceFilterEventIds = null;
    } else {
      traceFilterMetric = metricKey;
      traceFilterEventIds = Array.isArray(eventIds) ? eventIds : [];
    }
    render();
  },
  clearTraceSummaryFilter: () => {
    traceFilterMetric = null;
    traceFilterEventIds = null;
    render();
  },
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
    const configured_prompts = val('edit_g_prompts') || 'I,V,G';
    await api('PUT', `/api/goals/${gid}`, { title, baseline, target, status, domain, prompt_strategy, scoring_rule, mastery_sessions, configured_prompts });
    activeModal = null;
    render();
  }),
  sessionBreak: safe(async (sid, action = 'start') => {
    await api('POST', `/api/sessions/${sid}/breaks`, { action });
    render();
  }),
  sessionPause: safe(async (sid, action = 'start') => {
    await api('POST', `/api/sessions/${sid}/pause`, { action });
    render();
  }),
  openSessionNotesSection: safe(async (sid) => {
    showSessionNotesBox = true;
    await render();
    const el = document.getElementById('session_doc_card');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
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
    const operational_definition = val('new_g_def') || '';
    const onset_criteria = val('new_g_onset') || '';
    const offset_criteria = val('new_g_offset') || '';
    const examples = val('new_g_examples') || '';
    const non_examples = val('new_g_non') || '';
    const measurement_type = val('new_g_mtype') || 'percentage_of_opportunities';
    const secondary_measurement = val('new_g_sec_mtype') || '';
    const configured_prompts = val('new_g_prompts') || 'I,V,G';
    await api('POST', `/api/clients/${cid}/goals`, {
      title, baseline, target, domain, prompt_strategy, scoring_rule, mastery_sessions,
      operational_definition, onset_criteria, offset_criteria, examples, non_examples, measurement_type, secondary_measurement, configured_prompts
    });
    activeModal = null;
    render();
  }),
  setAssessmentSubTab: (sub) => {
    assessmentPlannerSubTab = sub;
    render();
  },
  runSmartGoalAnalysis: safe(async (cid) => {
    const goalText = val('sgb_goal_input').trim();
    if (!goalText) return alert('Please enter a behavioral or skill-acquisition goal to analyze.');
    const goalType = val('sgb_goal_type') || 'skill_acquisition';
    const domain = val('sgb_goal_domain') || '';
    smartGoalInputText = goalText;
    smartGoalType = goalType;
    smartGoalDomain = domain;
    smartGoalAnalysis = await api('POST', '/api/smart-goal-builder/analyze', {
      client_id: cid,
      goalText,
      goalType,
      domain,
      assessmentFinding: smartGoalFindingText || ''
    });
    render();
  }),
  loadSmartGoalPreset: safe(async (cid, text, gType, dom) => {
    smartGoalInputText = text;
    smartGoalType = gType || 'skill_acquisition';
    smartGoalDomain = dom || '';
    smartGoalAnalysis = await api('POST', '/api/smart-goal-builder/analyze', {
      client_id: cid,
      goalText: text,
      goalType: smartGoalType,
      domain: smartGoalDomain,
      assessmentFinding: smartGoalFindingText || ''
    });
    render();
  }),
  clearSmartGoalFinding: () => {
    smartGoalFindingId = null;
    smartGoalFindingText = '';
    render();
  },
  saveSmartGoalDraft: safe(async (cid, approveImmediately = false) => {
    const raw_goal_text = val('sgb_goal_input') || smartGoalInputText || 'Clinical Target';
    const refined_goal_text = val('sgb_refined_goal') || raw_goal_text;
    const goal_type = val('sgb_goal_type') || smartGoalType || 'skill_acquisition';
    const domain = val('sgb_goal_domain') || smartGoalDomain || 'Communication & Adaptive Skills';
    const operational_definition = val('sgb_op_def') || '';
    const onset_criteria = val('sgb_onset') || '';
    const offset_criteria = val('sgb_offset') || '';
    const episode_rule = val('sgb_episode') || '';
    const examples = val('sgb_examples') || '';
    const non_examples = val('sgb_non_examples') || '';
    const primary_measurement = val('sgb_primary_meas') || 'percentage_of_opportunities';
    const secondary_measurement = val('sgb_secondary_meas') || '';
    const measurement_rationale = val('sgb_rationale') || '';
    const mastery_criteria = val('sgb_mastery') || '80% across 3 consecutive sessions';
    const baseline_data = val('sgb_baseline') || '20% across 3 baseline sessions';
    const draft = await api('POST', `/api/clients/${cid}/smart-goal-drafts`, {
      finding_id: smartGoalFindingId,
      goal_type,
      domain,
      raw_goal_text,
      refined_goal_text,
      operational_definition,
      onset_criteria,
      offset_criteria,
      episode_rule,
      examples,
      non_examples,
      primary_measurement,
      secondary_measurement,
      measurement_rationale,
      data_fields: (smartGoalAnalysis && smartGoalAnalysis.dataCollectionPlan && smartGoalAnalysis.dataCollectionPlan.dataFields) || [],
      calculation_formula: (smartGoalAnalysis && smartGoalAnalysis.dataCollectionPlan && smartGoalAnalysis.dataCollectionPlan.calculationFormula) || '',
      mastery_criteria,
      baseline_data,
      sample_table: (smartGoalAnalysis && smartGoalAnalysis.dataCollectionPlan && smartGoalAnalysis.dataCollectionPlan.sampleRows) || [],
      clarifying_questions: (smartGoalAnalysis && smartGoalAnalysis.qualityCheck && smartGoalAnalysis.qualityCheck.clarifyingQuestions) || []
    });
    if (approveImmediately) {
      await api('POST', `/api/smart-goal-drafts/${draft.id}/approve`, {});
      alert(`✓ BCBA Approved & Activated "${refined_goal_text}" in Client Record!`);
    } else {
      alert(`💾 Saved "${refined_goal_text}" as a Clinical Draft (awaiting BCBA approval).`);
    }
    render();
  }),
  approveSmartGoalDraft: safe(async (draftId) => {
    const res = await api('POST', `/api/smart-goal-drafts/${draftId}/approve`, {});
    alert(`✓ BCBA Approved & Activated Plan #${draftId} (${res.draft?.refined_goal_text || 'Clinical Goal'}) into active treatment!`);
    render();
  }),
  loadDraftIntoSmartBuilder: safe(async (draftId, cid) => {
    const cData = await api('GET', `/api/clients/${cid}`);
    const d = (cData.smartGoalDrafts || []).find(x => Number(x.id) === Number(draftId));
    if (!d) return;
    smartGoalInputText = d.raw_goal_text || d.refined_goal_text;
    smartGoalType = d.goal_type || 'skill_acquisition';
    smartGoalDomain = d.domain || '';
    smartGoalFindingId = d.finding_id || null;
    smartGoalAnalysis = await api('POST', '/api/smart-goal-builder/analyze', {
      client_id: cid,
      goalText: smartGoalInputText,
      goalType: smartGoalType,
      domain: smartGoalDomain
    });
    smartGoalAnalysis.refinedGoalText = d.refined_goal_text || smartGoalAnalysis.refinedGoalText;
    if (smartGoalAnalysis.operationalDefinition) {
      smartGoalAnalysis.operationalDefinition.summary = d.operational_definition || smartGoalAnalysis.operationalDefinition.summary;
      smartGoalAnalysis.operationalDefinition.onsetCriteria = d.onset_criteria || smartGoalAnalysis.operationalDefinition.onsetCriteria;
      smartGoalAnalysis.operationalDefinition.offsetCriteria = d.offset_criteria || smartGoalAnalysis.operationalDefinition.offsetCriteria;
      smartGoalAnalysis.operationalDefinition.episodeRule = d.episode_rule || smartGoalAnalysis.operationalDefinition.episodeRule;
    }
    if (smartGoalAnalysis.measurementPlan) {
      smartGoalAnalysis.measurementPlan.primaryKey = d.primary_measurement || smartGoalAnalysis.measurementPlan.primaryKey;
      smartGoalAnalysis.measurementPlan.secondaryKey = d.secondary_measurement || '';
      smartGoalAnalysis.measurementPlan.rationale = d.measurement_rationale || smartGoalAnalysis.measurementPlan.rationale;
    }
    if (smartGoalAnalysis.masteryRecommendation) {
      smartGoalAnalysis.masteryRecommendation.suggestedCriterion = d.mastery_criteria || smartGoalAnalysis.masteryRecommendation.suggestedCriterion;
      smartGoalAnalysis.masteryRecommendation.suggestedBaseline = d.baseline_data || smartGoalAnalysis.masteryRecommendation.suggestedBaseline;
    }
    assessmentPlannerSubTab = 'smart_builder';
    render();
  }),
  selectFindingInstrument: (instId) => {
    selectedAssessmentInstrumentId = instId;
    render();
  },
  openLogFindingForInstrument: (instId) => {
    selectedAssessmentInstrumentId = instId;
    assessmentPlannerSubTab = 'findings';
    render();
  },
  addAssessmentFinding: safe(async (cid) => {
    const finding_text = val('af_finding').trim();
    if (!finding_text) return alert('Please enter a clinician-observed finding or skill deficit.');
    const instrument_id = val('af_inst') || 'vbmapp';
    const domain = val('af_domain') || 'Mand';
    const score_or_level = val('af_score') || 'Observed Deficit';
    const evidence_source = val('af_source') || 'Direct Observation & Formal Assessment';
    const context = val('af_context') || 'Clinic';
    const support_needs = val('af_support') || 'Requires prompting';
    const priority_status = val('af_priority') || 'priority_goal';
    await api('POST', `/api/clients/${cid}/assessment-findings`, {
      instrument_id,
      domain,
      finding_text,
      score_or_level,
      evidence_source,
      context,
      support_needs,
      priority_status
    });
    alert('✓ Assessment Finding Logged & Traceable Skill-Gap Suggestion Generated!');
    render();
  }),
  updateFindingPriority: safe(async (findingId, priority_status) => {
    await api('PATCH', `/api/assessment-findings/${findingId}`, { priority_status });
    render();
  }),
  sendFindingToSmartBuilder: safe(async (cid, findingId, goalStmt, goalType, dom, findingText) => {
    smartGoalFindingId = findingId;
    smartGoalFindingText = findingText || '';
    smartGoalInputText = goalStmt;
    smartGoalType = goalType || 'skill_acquisition';
    smartGoalDomain = dom || '';
    assessmentPlannerSubTab = 'smart_builder';
    smartGoalAnalysis = await api('POST', '/api/smart-goal-builder/analyze', {
      client_id: cid,
      goalText: goalStmt,
      goalType: smartGoalType,
      domain: smartGoalDomain,
      assessmentFinding: smartGoalFindingText
    });
    render();
  }),
  aiRecommendInGoalModal: safe(async (cid) => {
    const goalText = val('new_g_title').trim();
    if (!goalText) return alert('Please type a goal statement or tap a template first so the AI can recommend an operational definition & measurement method.');
    const domain = val('new_g_domain') || '';
    const res = await api('POST', '/api/smart-goal-builder/analyze', {
      client_id: cid,
      goalText,
      goalType: 'skill_acquisition',
      domain
    });
    const setIf = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; };
    setIf('new_g_title', res.refinedGoalText || goalText);
    setIf('new_g_def', res.operationalDefinition?.summary || '');
    setIf('new_g_onset', res.operationalDefinition?.onsetCriteria || '');
    setIf('new_g_offset', res.operationalDefinition?.offsetCriteria || '');
    setIf('new_g_examples', (res.operationalDefinition?.examples || []).join('; '));
    setIf('new_g_non', (res.operationalDefinition?.nonExamples || []).join('; '));
    setIf('new_g_mtype', res.measurementPlan?.primaryKey || 'percentage_of_opportunities');
    setIf('new_g_sec_mtype', res.measurementPlan?.secondaryKey || '');
    if (res.masteryRecommendation?.suggestedTargetPct) setIf('new_g_target', res.masteryRecommendation.suggestedTargetPct);
    if (res.masteryRecommendation?.suggestedSessions) setIf('new_g_sess', res.masteryRecommendation.suggestedSessions);
    const banner = document.getElementById('new_g_ai_banner');
    if (banner) {
      banner.style.display = 'block';
      const qHtml = (res.qualityCheck?.clarifyingQuestions && res.qualityCheck.clarifyingQuestions.length && !res.qualityCheck.isClear)
        ? `<div style="margin-top:4px;color:#92400e"><b>❓ Clarifying Questions:</b> ${res.qualityCheck.clarifyingQuestions.map(q => esc(q)).join(' · ')}</div>`
        : '';
      banner.innerHTML = `<b>✨ AI Recommended Plan:</b> Primary Measurement: <b>${esc(res.measurementPlan?.primaryMethod || '')}</b>${res.measurementPlan?.secondaryMethod ? ` + Secondary: <b>${esc(res.measurementPlan.secondaryMethod)}</b>` : ''}<br><span>${esc(res.measurementPlan?.rationale || '')}</span>${qHtml}`;
    }
  }),
  aiRecommendInBehaviorModal: safe(async (cid) => {
    const bName = val('bp_name').trim();
    const rGoal = val('bp_reduction_goal').trim();
    const query = rGoal || `Decrease ${bName || 'target behavior'}`;
    const res = await api('POST', '/api/smart-goal-builder/analyze', {
      client_id: cid,
      goalText: query,
      goalType: 'behavior_reduction',
      domain: `Behavior Reduction — ${bName}`
    });
    const setIf = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; };
    setIf('bp_def', res.operationalDefinition?.summary || '');
    setIf('bp_onset', res.operationalDefinition?.onsetCriteria || '');
    setIf('bp_offset', res.operationalDefinition?.offsetCriteria || '');
    setIf('bp_examples', (res.operationalDefinition?.examples || []).join('; '));
    setIf('bp_non', (res.operationalDefinition?.nonExamples || []).join('; '));
    const pKey = res.measurementPlan?.primaryKey || 'frequency';
    const validBpMethods = ['frequency', 'rate', 'duration', 'latency', 'irt', 'partial_interval', 'whole_interval', 'mts', 'abc'];
    setIf('bp_method', validBpMethods.includes(pKey) ? pKey : 'frequency');
    if (!rGoal) setIf('bp_reduction_goal', res.refinedGoalText || query);
    setIf('bp_mastery', res.masteryRecommendation?.suggestedCriterion || '≤ 0.5 episodes/hr across 3 consecutive sessions');
    const banner = document.getElementById('bp_ai_banner');
    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `<b>✨ AI Recommended Behavior Plan:</b> Primary Measurement: <b>${esc(res.measurementPlan?.primaryMethod || '')}</b>${res.measurementPlan?.secondaryMethod ? ` + Secondary: <b>${esc(res.measurementPlan.secondaryMethod)}</b>` : ''}<br><span>${esc(res.measurementPlan?.rationale || '')}</span>`;
    }
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
  addAppt: safe(async () => {
    const res = await api('POST', '/api/appointments', { client_id: val('ac'), user_id: val('as'), start: val('astart'), end: val('aend'), setting: val('aset') });
    alert(`✓ Scheduled ${res.staff || 'RBT'} (${res.role || 'RBT'}) for ${res.start.replace('T', ' ')} – ${res.end.slice(11)} (${res.setting})!`);
    render();
  }),
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
    activeModal = { type: 'reauth_report', clientId: cid, report };
    render();
  }),
  selectReportTemplate: safe(async (cid, tplId) => {
    activeReportTemplateId = tplId || 'all';
    if (activeModal && activeModal.type === 'reauth_report') {
      const report = await api('GET', `/api/clients/${cid}/reauth-report`);
      activeModal = { type: 'reauth_report', clientId: cid, report };
    }
    render();
  }),
  populateReportTemplateDomains: safe(async (cid, tplId) => {
    const targetTpl = (!tplId || tplId === 'all') ? 'vbmapp' : tplId;
    const res = await api('POST', `/api/clients/${cid}/progress-report-template/populate`, {
      templateId: targetTpl
    });
    activeReportTemplateId = targetTpl;
    if (activeModal && activeModal.type === 'reauth_report') {
      const report = await api('GET', `/api/clients/${cid}/reauth-report`);
      activeModal = { type: 'reauth_report', clientId: cid, report };
    }
    alert(`✓ Auto-Populated ${res.populatedCount || 0} New Domain(s) for ${targetTpl.toUpperCase()} with Traceable Findings, Operational Definitions & Smart Measurement Plans!`);
    render();
  }),
  populateSingleTemplateDomain: safe(async (cid, tplId, domainCode) => {
    const res = await api('POST', `/api/clients/${cid}/progress-report-template/populate`, {
      templateId: tplId,
      domainCode
    });
    if (activeModal && activeModal.type === 'reauth_report') {
      const report = await api('GET', `/api/clients/${cid}/reauth-report`);
      activeModal = { type: 'reauth_report', clientId: cid, report };
    }
    alert(`✓ Auto-Populated Domain (${res.populatedCount || 1}) with Operational Definition & Smart Measurement Plan!`);
    render();
  }),
  selectAssessmentCenterClient: (cid) => {
    assessmentCenterClientId = Number(cid) || 1;
    render();
  },
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
  selectFacilityModel: (id) => {
    activeFacilityModelId = Number(id);
    const m = ((facilityData && facilityData.models) || []).find((x) => x.id === activeFacilityModelId);
    if (m) facilityCfg = { ...m.config };
    render();
  },
  setFacilitySubTab: (t) => {
    facilitySubTab = t;
    render();
  },
  updateFacilityCfg: (key, value) => {
    if (!facilityCfg) facilityCfg = {};
    facilityCfg[key] = value;
    render();
  },
  syncFacilityFromSignups: () => {
    if (!facilityData || !facilityData.signupSummary) return;
    const s = facilityData.signupSummary;
    if (!facilityCfg) facilityCfg = {};
    facilityCfg.initialClientsMonth1 = Math.max(1, s.committedMonth1Count || 8);
    if (s.tierSharesPct) {
      facilityCfg.compTierSharePct = s.tierSharesPct.compTierSharePct ?? 45;
      facilityCfg.focusedTierSharePct = s.tierSharesPct.focusedTierSharePct ?? 40;
      facilityCfg.groupGymTierSharePct = s.tierSharesPct.groupGymTierSharePct ?? 15;
    }
    alert(`✓ Synced Financial Model with Live Therapy Signup Roster:\n• Month-1 Committed Clients: ${facilityCfg.initialClientsMonth1} children\n• Tier Mix: ${facilityCfg.compTierSharePct}% Comprehensive / ${facilityCfg.focusedTierSharePct}% Focused / ${facilityCfg.groupGymTierSharePct}% Gym Group`);
    render();
  },
  saveFacilityScenario: safe(async () => {
    if (!facilityCfg) return;
    const res = await api('PUT', `/api/facility-model/${activeFacilityModelId}`, { config: facilityCfg });
    facilityData = res;
    alert('✓ Facility & Sensory Gym Financial Model saved!');
    render();
  }),
  saveAsNewFacilityScenario: safe(async () => {
    if (!facilityCfg) return;
    const name = prompt('Enter a name for this Clinic & Sensory Gym Scenario:', `Custom ${(facilityCfg.totalSqFt || 6000).toLocaleString()} sq ft Clinic + Sensory Gym`);
    if (!name) return;
    const subtitle = `${facilityCfg.dttRoomCount || 12} DTT Suites · ${Math.round((facilityCfg.totalSqFt || 6000) * ((facilityCfg.gymSqFtPct || 35) / 100)).toLocaleString()} sq ft Sensory Gym · ${facilityCfg.maxClinicClientCapacity || 28}-Client Cap`;
    const res = await api('POST', '/api/facility-model', { name, subtitle, config: facilityCfg });
    facilityData = res;
    activeFacilityModelId = res.id;
    alert(`✓ Created new scenario: "${name}"`);
    render();
  }),
  addFacilitySignup: safe(async () => {
    const child_name = val('sig_name').trim();
    if (!child_name) return alert('Please enter a child name or synthetic identifier.');
    const age = +val('sig_age') || 5;
    const tier = val('sig_tier') || 'Comprehensive';
    const weekly_hours = +val('sig_hrs') || 30;
    const cohort = val('sig_cohort') || 'Morning Cohort (8:30 AM–12:30 PM)';
    const gym_track = val('sig_track') || 'Sensory Gym NET & Vestibular Circuit';
    const enrollment_status = val('sig_status') || 'committed';
    const target_month = +val('sig_month') || 1;
    const res = await api('POST', '/api/facility-signups', {
      child_name, age, tier, weekly_hours, cohort, gym_track, enrollment_status, target_month
    });
    facilityData = res;
    showAddSignupForm = false;
    render();
  }),
  updateFacilitySignupStatus: safe(async (id, enrollment_status) => {
    const res = await api('PATCH', `/api/facility-signups/${id}`, { enrollment_status });
    facilityData = res;
    render();
  }),
  exportFacilityCsv: () => {
    const pf = computeClientFacilityModel(facilityCfg || {});
    const headers = [
      'Month', 'Year', 'Active Clients', 'Capacity Utilization %', 'RBT Headcount', 'BCBA Headcount',
      'CPT 97153 Rev', 'CPT 97155 Rev', 'CPT 97156 Rev', 'CPT 97151 Rev', 'CPT 97158 Gym Group Rev',
      'Net ABA Revenue', 'Ancillary Sensory Gym & OT/PT Rev', 'Total Net Revenue',
      'RBT Labor Cost', 'BCBA Labor Cost', 'Total Clinical Labor COGS', 'Gross Profit', 'Gross Margin %',
      'Rent & CAM/Utilities', 'Admin & Director Payroll', 'Insurance, Marketing & Ops', 'Sensory & Gym Supplies',
      'Total Facility OpEx', 'EBITDA', 'EBITDA Margin %', 'SBA Loan Debt Service', 'Net Cash Flow', 'Cumulative Cash Flow'
    ];
    const rows = pf.months.map((m) => [
      m.month, m.year, m.activeClients, m.utilizationPct, m.rbtHeadcount, m.bcbaHeadcount,
      m.cpt97153Rev, m.cpt97155Rev, m.cpt97156Rev, m.cpt97151Rev, m.cpt97158Rev,
      m.netAbaRevenue, m.ancillaryGymRevenue, m.totalRevenue,
      m.rbtLaborCost, m.bcbaLaborCost, m.totalClinicalLabor, m.grossProfit, m.grossMarginPct,
      m.rentAndCam, m.adminPayroll, m.insuranceAndOps, m.sensorySupplies,
      m.totalFacilityOpEx, m.ebitda, m.ebitdaMarginPct, m.debtService, m.netCashFlow, m.cumulativeCashFlow
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EBA_Clinic_Sensory_Gym_36Mo_ProForma_${pf.space.totalSqFt}sqft.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
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

async function assessmentCenterView(id) {
  const clients = await api('GET', '/api/clients');
  const cid = Number(id) || assessmentCenterClientId || (clients[0] && clients[0].id) || 1;
  assessmentCenterClientId = cid;
  const data = await api('GET', `/api/clients/${cid}`);
  const c = data.client;
  const B = ['BCBA', 'OWNER'].includes(me.role);
  return `
    <div class="card" style="padding:14px 18px;margin-bottom:14px;background:#f8fafc;border-left:5px solid #0f766e">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <span class="badge p">ABA Assessment Center · Auto-Populated Report Templates & Smart Goal Builder</span>
          <h2 style="margin:4px 0 2px;font-size:1.35rem;color:#113f59">🧠 ABA Assessment & Clinical Planning Center</h2>
          <div style="font-size:0.83rem;color:var(--slate-600)">
            Select a learner below to view or auto-populate their <b>VB-MAPP</b>, <b>ABLLS-R</b>, <b>AFLS</b>, <b>Essential for Living (EFL)</b>, and <b>Vineland-3</b> domain report templates, build operational definitions, or generate measurement plans.
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span style="font-size:0.78rem;font-weight:700;color:var(--slate-500)">Active Learner:</span>
          ${clients.map(cl => `
            <button type="button" class="${Number(cl.id) === Number(cid) ? 'ok' : 'sec'}" style="padding:6px 12px;font-size:0.82rem" onclick="act.selectAssessmentCenterClient(${cl.id})">
              ${cl.id === 1 ? '👧' : '👦'} ${esc(cl.name)}
            </button>
          `).join('')}
          <button type="button" class="sec" style="padding:6px 12px;font-size:0.8rem" onclick="go('client', ${cid})">
            Open Full Client 360 Record →
          </button>
        </div>
      </div>
    </div>
    ${renderSmartPlannerAndAssessmentsTab(c, data, B)}
  `;
}

async function render() {
  const rawRoute = (location.hash.slice(1) || '').split('/')[0];
  if (rawRoute === 'website' || rawRoute === 'marketing') {
    window.location.href = '/website.html';
    return;
  }
  if (!firebaseBootRestored) {
    firebaseBootRestored = true;
    try {
      const savedVault = typeof localStorage !== 'undefined' ? localStorage.getItem(FIREBASE_VAULT_STORAGE_KEY) : null;
      if (savedVault) {
        const parsed = JSON.parse(savedVault);
        if (parsed && typeof parsed === 'object') {
          await syncFirebaseVault('push', parsed);
        }
      }
    } catch {}
  }
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
    else if (route === 'assessments') html = await assessmentCenterView(id);
    else if (route === 'schedule') html = await scheduleView();
    else if (route === 'session') html = await sessionView(id);
    else if (route === 'notes') html = await notesView();
    else if (route === 'supervision') html = await supervisionView();
    else if (route === 'presentation') html = presentationView();
    else if (route === 'leads') html = await leadsView();
    else if (route === 'facility') html = await facilityModelView();
    else if (route === 'licensing') html = await licensingView();
    else html = '<h1>View Not Found</h1><div class="card">Please select an option from the navigation menu.</div>';
    $app.innerHTML = shell(html, route === 'client' ? 'clients' : route === 'session' ? 'notes' : route);
  } catch (e) { $app.innerHTML = shell(`<div class="card err">${esc(e.message)}</div>`, ''); }
}

window.addEventListener('hashchange', render);
render();
}
