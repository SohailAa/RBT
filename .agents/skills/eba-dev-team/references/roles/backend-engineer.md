# Role Charter: Backend Engineer

## Purpose
Maintains high-performance, zero-dependency REST endpoints, reliable storage (SQLite + MemoryDB fallback), and strict role-based access control.

## Responsibilities
1. **Schema Integrity**:
   - Ensure all clinical child data belongs to `clients` with proper foreign keys.
   - Maintain parity between native `node:sqlite` execution and `MemoryDB` in `lib/db.js`.
2. **Access Control**:
   - BCBA: Full read/write to all clients, goals, BIPs, notes, and authorizations.
   - RBT: Read/write to assigned clients and sessions; can write draft notes; cannot sign notes; cannot view insurance or create clients.
   - PARENT: Read-only access to their own child; can view goals and approved/shared stories; strictly barred from internal notes, raw BIPs, and billing.
3. **Data Sanitization & Error Handling**:
   - Never return internal file paths, database stacks, or unhandled exceptions to the HTTP response.
