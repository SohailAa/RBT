const fs = require('fs');
const path = require('path');
const { DEFAULT_FACILITY_MODELS, calculateFacilityModel } = require('../lib/generators');

const rootDir = path.join(__dirname, '..');

// Copy HTML into public/ so static hosting serves /facility-model and /Clinic_Sensory_Gym_Financial_Model.html
fs.copyFileSync(
  path.join(rootDir, 'Clinic_Sensory_Gym_Financial_Model.html'),
  path.join(rootDir, 'public', 'Clinic_Sensory_Gym_Financial_Model.html')
);

const baseModel = DEFAULT_FACILITY_MODELS[0];
const pf = calculateFacilityModel(baseModel.config);
const sp = pf.space;
const cx = pf.capex;
const ue = pf.unitEconomics;
const kp = pf.kpis;

// 1. Generate Excel-ready 36-Month CSV in root
const rows = [
  ['EFFECTIVE BEHAVIORAL APPROACH (EBA) - PHYSICAL CLINIC & SENSORY GYM 36-MONTH FINANCIAL MODEL'],
  ['Scenario Name', baseModel.name],
  ['Scenario Subtitle', baseModel.subtitle],
  [],
  ['1. EXECUTIVE SUMMARY & ARCHITECTURAL CAPACITY'],
  ['Metric', 'Value', 'Notes'],
  ['Total Facility Footprint (Sq Ft)', sp.totalSqFt, 'Leased commercial medical/retail shell'],
  ['Sensory & Gross-Motor Gym (Sq Ft)', sp.gymSqFt, `${sp.gymSqFtPct}% of total footprint (${sp.gymConcurrentCap} concurrent kids)`],
  ['1:1 DTT Clinical Suites (Sq Ft)', sp.dttSqFt, `${sp.dttRooms} private therapy suites`],
  ['Social Skills / NET Group Room (Sq Ft)', sp.groupSqFt, `${sp.groupConcurrentCap} concurrent group capacity`],
  ['Snoezelen Calming & De-Escalation Suite (Sq Ft)', sp.calmingSqFt, 'Padded sensory regulation suite'],
  ['Max Clinic Active Client Capacity', sp.maxClinicClientCapacity, 'Dual-cohort (AM + PM) + After-School Group'],
  ['Operating + Debt Break-Even Census (Clients)', kp.breakEvenClientsCashFlow, `${kp.breakEvenUtilizationPct}% of max capacity`],
  ['Full Equity Payback Month', `Month ${kp.paybackMonth}`, 'Cumulative net cash flow turns positive'],
  ['Steady-State Annual Revenue (Yr 3 Run-Rate)', kp.steadyStateAnnualRev, 'Net collected ABA + Ancillary Gym revenue'],
  ['Steady-State Annual EBITDA (Yr 3 Run-Rate)', kp.steadyStateAnnualEbitda, `${kp.steadyStateEbitdaMarginPct}% EBITDA margin`],
  ['3-Year Cumulative Net Cash Flow', kp.threeYearCumulativeNetCash, `${kp.cashOnCashReturnPct}% 3-Yr Cash-on-Cash Return`],
  [],
  ['2. BUILDOUT CAPEX, SENSORY GYM EQUIPMENT & SBA 7(a) FINANCING'],
  ['Line Item', 'Amount ($)', 'Details'],
  ['Gross Tenant Improvement (TI) Construction', cx.grossTiConstruction, `${sp.totalSqFt} sq ft @ $${cx.tiCostPerSqFt}/sq ft`],
  ['Less: Landlord TI Allowance Credit', -cx.landlordTiCredit, `$${cx.landlordTiAllowancePerSqFt}/sq ft landlord credit`],
  ['Net Out-of-Pocket TI Construction', cx.netTiConstruction, 'Net leasehold construction'],
  ...cx.gymEquipmentItems.map((i) => [i.label, i.cost, i.note]),
  ['Total Sensory & Gross-Motor Gym Equipment', cx.totalGymEquipment, 'Commercial pediatric gym apparatus'],
  ...cx.clinicalTechItems.map((i) => [i.label, i.cost, i.note]),
  ['Working Capital & 60-Day Payroll Reserve', cx.workingCapitalReserve, 'Payer credentialing & clearinghouse buffer'],
  ['Total Net Capital Required', cx.totalCapitalRequired, 'Net Buildout CapEx + Working Capital'],
  ['SBA 7(a) Loan Principal Financed (80%)', cx.loanPrincipal, `${cx.loanInterestRatePct}% interest, ${cx.loanTermYears}-yr amortization ($${cx.monthlyDebtService}/mo)`],
  ['Upfront Owner Equity Cash Required (20%)', cx.upfrontEquityCash, 'Initial cash outlay at Month 0'],
  [],
  ['3. 3-YEAR ANNUAL PRO-FORMA P&L SUMMARY'],
  ['Line Item', 'Year 1 (M1-M12)', 'Year 2 (M13-M24)', 'Year 3 (M25-M36)', '3-Year Total'],
  ['Ending Active Client Census', pf.years[0].endClients, pf.years[1].endClients, pf.years[2].endClients, '-'],
  ['Ending Capacity Utilization %', `${pf.years[0].endUtilizationPct}%`, `${pf.years[1].endUtilizationPct}%`, `${pf.years[2].endUtilizationPct}%`, '-'],
  ['Net ABA Therapy Revenue (CPT 97153/55/56/51/58)', pf.years[0].netAbaRevenue, pf.years[1].netAbaRevenue, pf.years[2].netAbaRevenue, pf.years.reduce((s, y) => s + y.netAbaRevenue, 0)],
  ['Ancillary Sensory Gym Memberships & OT/PT Sublease', pf.years[0].ancillaryGymRevenue, pf.years[1].ancillaryGymRevenue, pf.years[2].ancillaryGymRevenue, pf.years.reduce((s, y) => s + y.ancillaryGymRevenue, 0)],
  ['Total Operating Revenue', pf.years[0].totalRevenue, pf.years[1].totalRevenue, pf.years[2].totalRevenue, pf.years.reduce((s, y) => s + y.totalRevenue, 0)],
  ['Total Clinical Direct Labor (RBT + BCBA Loaded)', -pf.years[0].totalClinicalLabor, -pf.years[1].totalClinicalLabor, -pf.years[2].totalClinicalLabor, -pf.years.reduce((s, y) => s + y.totalClinicalLabor, 0)],
  ['Gross Profit', pf.years[0].grossProfit, pf.years[1].grossProfit, pf.years[2].grossProfit, pf.years.reduce((s, y) => s + y.grossProfit, 0)],
  ['Total Facility Rent, CAM, Admin & Gym OpEx', -pf.years[0].totalFacilityOpEx, -pf.years[1].totalFacilityOpEx, -pf.years[2].totalFacilityOpEx, -pf.years.reduce((s, y) => s + y.totalFacilityOpEx, 0)],
  ['EBITDA (Operating Cash Flow)', pf.years[0].ebitda, pf.years[1].ebitda, pf.years[2].ebitda, pf.years.reduce((s, y) => s + y.ebitda, 0)],
  ['EBITDA Margin %', `${pf.years[0].ebitdaMarginPct}%`, `${pf.years[1].ebitdaMarginPct}%`, `${pf.years[2].ebitdaMarginPct}%`, '-'],
  ['SBA 7(a) Debt Service (P&I)', -pf.years[0].debtService, -pf.years[1].debtService, -pf.years[2].debtService, -pf.years.reduce((s, y) => s + y.debtService, 0)],
  ['Net Cash Flow After Debt', pf.years[0].netIncome, pf.years[1].netIncome, pf.years[2].netIncome, pf.years.reduce((s, y) => s + y.netIncome, 0)],
  ['Ending Cumulative Cash Position', pf.years[0].endingCumulativeCash, pf.years[1].endingCumulativeCash, pf.years[2].endingCumulativeCash, pf.years[2].endingCumulativeCash],
  [],
  ['4. MONTH-BY-MONTH 36-MONTH PRO-FORMA SCHEDULE'],
  ['Month', 'Year', 'Active Clients', 'Utilization %', 'CPT 97153 (1:1 ABA)', 'CPT 97155 (BCBA Sup)', 'CPT 97156 (Parent)', 'CPT 97151 (Assess)', 'CPT 97158 (Gym Group)', 'Net ABA Revenue', 'Ancillary Gym Revenue', 'Total Revenue', 'RBT Staff', 'BCBA Staff', 'Total Clinical Labor', 'Gross Profit', 'Facility Rent & OpEx', 'EBITDA', 'EBITDA Margin %', 'SBA Debt Service', 'Net Cash Flow', 'Cumulative Cash Flow']
];

pf.months.forEach((m) => {
  rows.push([
    `Month ${m.month}`, `Year ${m.year}`, m.activeClients, `${m.utilizationPct}%`,
    m.cpt97153Rev, m.cpt97155Rev, m.cpt97156Rev, m.cpt97151Rev, m.cpt97158Rev,
    m.netAbaRevenue, m.ancillaryGymRevenue, m.totalRevenue,
    m.rbtHeadcount, m.bcbaHeadcount, m.totalClinicalLabor, m.grossProfit,
    m.totalFacilityOpEx, m.ebitda, `${m.ebitdaMarginPct}%`,
    m.debtService, m.netCashFlow, m.cumulativeCashFlow
  ]);
});

const csvContent = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(rootDir, 'Clinic_Sensory_Gym_Financial_Model_36Mo.csv'), csvContent, 'utf8');
fs.writeFileSync(path.join(rootDir, 'public', 'Clinic_Sensory_Gym_Financial_Model_36Mo.csv'), csvContent, 'utf8');

// 2. Generate clean UTF-8 PDF for WhatsApp sharing
const { execFileSync } = require('child_process');
const os = require('os');
const srcHtml = fs.readFileSync(path.join(rootDir, 'Clinic_Sensory_Gym_Financial_Model.html'), 'utf8');
const pdfHtml = srcHtml
  .replace('if (location.search.includes(\'pdf=1\'))', 'if (true)')
  .replace('* { box-sizing: border-box; }', '* { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }');
const tmpHtmlPath = path.join(rootDir, 'temp_pdf_render.html');
fs.writeFileSync(tmpHtmlPath, '\uFEFF' + pdfHtml, 'utf8');

const edgeCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const edgeExe = edgeCandidates.find((p) => fs.existsSync(p));
if (edgeExe) {
  const outPdf = path.join(rootDir, 'Clinic_Gym_Financial_Model.pdf');
  const tmpProfile = path.join(os.tmpdir(), 'eba_edge_pdf_' + Date.now());
  execFileSync(edgeExe, [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${tmpProfile}`,
    '--no-pdf-header-footer',
    `--print-to-pdf=${outPdf}`,
    tmpHtmlPath
  ]);
  fs.copyFileSync(outPdf, path.join(rootDir, 'public', 'Clinic_Gym_Financial_Model.pdf'));
}
try { fs.unlinkSync(tmpHtmlPath); } catch (e) {}

console.log('Exported shareable HTML, CSV, and UTF-8 PDF files successfully.');
