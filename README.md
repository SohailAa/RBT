# Effective Behavioral Approach – ABA Platform (MVP)

Child-centered ABA practice platform: child profiles, goals, AI-style (template-based) social stories and behavior plans, one-tap data collection, scheduling, session notes with BCBA sign-off.

Zero npm dependencies. Requires **Node 24+** (uses built-in `node:sqlite`).

## Run locally
```
npm start        # http://localhost:3000
npm test         # with the server running
```
Demo logins (password `password`): `bcba@eba.test`, `rbt@eba.test`, `parent@eba.test`.

## Deploy to Vercel
1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → import the repo**. No build settings needed (`vercel.json` handles it).
3. Add environment variable `SESSION_SECRET` = a long random string (e.g. `openssl rand -hex 32`).
4. Deploy.

> ⚠️ **Demo only on Vercel.** Serverless storage is ephemeral: the SQLite database lives in `/tmp`, is re-seeded with demo data on cold starts, and is not shared between instances. Changes can disappear.
> To go beyond a demo, replace the DB layer in `server.js` with a hosted database (Neon, Turso, Supabase).

## PHI / HIPAA
Do **not** enter real client data. Real use requires a hosting plan with a signed BAA (Vercel offers this only on Enterprise), a persistent encrypted database, audit logging, and BAAs with any AI provider. Change the demo passwords and seed data before any real use.

## Structure
- `server.js` – API + static fallback (exported as a handler for Vercel)
- `api/index.js` – Vercel function entry
- `lib/generators.js` – template generators for stories, plans, notes; unit calculation
- `public/` – single-page front end
