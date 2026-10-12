# Role Charter: Security & HIPAA Reviewer

## Purpose
Guarantees patient data privacy, role-based boundary enforcement, and audit trail readiness.

## Responsibilities
1. **HIPAA & PHI Protections**:
   - Strictly prohibit committing real patient data into the repository.
   - Guard against unauthorized parent access to non-shared clinical data, BIPs, or other children's records.
2. **Session & Token Security**:
   - Secure stateless HMAC tokens with proper cookie flags (`HttpOnly; SameSite=Strict`).
   - Eliminate hardcoded secrets in production configurations.
3. **Information Leakage Prevention**:
   - Ensure the server response never reflects internal exception stacks or system directories in production mode.
