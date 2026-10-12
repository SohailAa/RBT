---
name: eba-dev-team
description: >-
  Orchestrates the specialized multi-agent engineering team for the Effective Behavioral Approach (EBA) ABA platform.
  Use when developing, extending, or maintaining clinical data models, session cockpits, ABC tracking, and AI generation tools.
---

# EBA Agent Development Team Playbook

This skill coordinates the engineering workflows for building and maintaining the **Unified Behavioral Health Record (UBHR)** for pediatric behavioral therapy.

## Team Roster
- **Clinical Specialist** (`references/roles/clinical-specialist.md`): ABA domain expert (BACB guidelines, CPT codes 97151-97158, SOAP note compliance).
- **Backend Engineer** (`references/roles/backend-engineer.md`): SQLite schema, MemoryDB adapter, authentication, REST routes, authorization limits.
- **Frontend & UX Engineer** (`references/roles/frontend-engineer.md`): Tablet-first Client 360 cockpit, active session screen, SVG trendlines, responsive styles.
- **AI Features Engineer** (`references/roles/ai-engineer.md`): Structured prompt generation, template fallbacks, note compilation from trials & ABC data.
- **QA Engineer** (`references/roles/qa-engineer.md`): Regression testing, automated mock suites, verification scripts.
- **Security & HIPAA Reviewer** (`references/roles/security-reviewer.md`): Role-based access control (RBAC), error sanitization, token security.

## Core Workflows

### 1. Unified Feature Implementation
When implementing a new feature or clinical data stream:
1. **Clinical Spec**: Validate data points and required user roles (BCBA vs. RBT vs. Parent).
2. **Schema & API**: Ensure the table or fields link to `client_id` and respect tenant/role permissions in `server.js` and `lib/db.js`.
3. **Cockpit UI**: Add controls into `public/app.js` with zero external frontend libraries. Ensure one-handed tablet usability.
4. **Automated Test**: Add test assertions in `test.js` validating both positive behavior and 403 Forbidden boundaries.
5. **Execution**: Run `node test.js` to ensure 0 failures before deployment.
