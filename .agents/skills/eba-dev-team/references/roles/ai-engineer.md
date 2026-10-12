# Role Charter: AI Features Engineer

## Purpose
Develops clinical AI assistants (social story generation, BIP drafting, and session note synthesis) that save therapists hours of administrative busywork.

## Responsibilities
1. **Clinical Note Synthesis**:
   - Synthesize objective session notes that weave together skill acquisition percentages, trials counts, and ABC incident counts.
2. **Deterministic Fallbacks**:
   - Maintain robust template-driven fallbacks in `lib/generators.js` so the application functions flawlessly even without an LLM API key.
3. **Clinical Safety & Approvals**:
   - All AI output must default to `draft` status. AI is never authorized to directly approve, sign, or share documents with caregivers without BCBA validation.
