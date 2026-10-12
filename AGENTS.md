# Effective Behavioral Approach (EBA) — Agent Development Team Charter

This project is an all-in-one clinical practice management and data collection platform for pediatric behavioral therapy (Applied Behavior Analysis / ABA).

## Core Directive: Unified Clinical Record (UBHR)
All clinical, operational, and documentation data that a behavioral therapist (BCBA or RBT) uses must reside in a single, consolidated record. Therapists should never need to juggle disjointed spreadsheets, paper ABC forms, or separate document portals.

The 8 interconnected data pillars are:
1. **Clinical Vitals & Sensory Profile**: Communication modality (vocal, PECS, AAC), sensory preferences, reinforcer hierarchy, known antecedents, crisis alerts.
2. **Skill Acquisition & Program Targets**: DTT trials, prompt hierarchies (Independent, Verbal, Gestural, Physical, Refusal), task analyses, trendlines, mastery criteria.
3. **Behavior Reduction & ABC Data**: Maladaptive behaviors, operational definitions, ABC logs (Antecedent -> Behavior -> Consequence), and the 4 functions of behavior (Escape, Attention, Tangible, Sensory).
4. **Behavior Intervention Plans (BIP)**: Proactive prevention strategies, replacement behaviors (FCT), consequence protocols, crisis management.
5. **Active Session Cockpit**: Real-time elapsed timer, 15-minute unit calculations (CMS 8-minute rule), 1-tap trial logging, instant undo, in-session ABC logging.
6. **Documentation & SOAP Notes**: Auto-compiled clinical notes combining skill trials + ABC incidents, RBT draft authoring, BCBA review & co-signature.
7. **Payers, Authorizations & BACB Supervision**: CPT codes (97151, 97153, 97155, 97156), authorized vs used units, burn-down warnings, mandatory BACB 5% RBT supervision tracking.
8. **Caregiver & Family Tools**: Illustrated social stories, visual schedules, parent guidance objectives, secure parent portal.

---

## Agent Roster & Ownership
- **Orchestrator**: Task prioritization, backlog management, cross-module integration, test execution.
- **ABA Clinical Specialist**: Ensures compliance with BACB ethics, CPT billing rules (CMS 8-minute rule), HIPAA principles, and clinical taxonomy.
- **Backend Engineer**: Owns `server.js`, `lib/db.js`, SQLite schemas, REST API endpoints, access control logic.
- **Frontend & UX Engineer**: Owns `public/app.js`, `public/style.css`, `public/index.html`. Focuses on tablet-first, one-handed field usability.
- **AI Features Engineer**: Owns `lib/generators.js` and future LLM integration. Guarantees deterministic fallbacks and ensures all AI content requires BCBA approval.
- **QA Engineer**: Owns `test.js` and automated regression suites.
- **Security & HIPAA Reviewer**: Audits authorization barriers, validates zero-PHI synthetic test data, verifies error sanitization.

---

## Non-Negotiable Engineering Rules
1. **Zero Real PHI**: Never write or commit real client health information. Use only synthetic demo data.
2. **Clinical Guardrails**: Every AI-generated story, plan, or note is generated as a `draft` and CANNOT be shared with parents or billed until a BCBA signs/approves it.
3. **Zero Runtime Dependencies**: Maintain the zero-npm-dependency lightweight architecture (Node 24 built-ins + native web frontend).
4. **Definition of Done**:
   - `node test.js` must pass 100% cleanly.
   - Code must be tested with both native `node:sqlite` and cloud-fallback `MemoryDB`.
   - Error messages must not leak internal stack traces to the client.
