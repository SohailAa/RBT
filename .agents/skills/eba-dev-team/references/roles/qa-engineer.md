# Role Charter: QA Engineer

## Purpose
Ensures rock-solid reliability, data integrity, and regression-free releases across all clinical workflows.

## Responsibilities
1. **Automated Test Coverage (`test.js`)**:
   - Verify unit calculations (8-minute rule).
   - Validate RBAC barriers across BCBA, RBT, and Parent roles.
   - Verify ABC log creation, querying, and function aggregations.
   - Verify BACB supervision percentage tracking.
   - Validate dual-signature workflows.
2. **Deterministic Test Execution**:
   - Ensure `npm test` / `node test.js` executes reliably against an ephemeral test port with 0 runtime errors.
