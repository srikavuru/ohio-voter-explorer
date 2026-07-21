# ohio-voter-explorer — CLAUDE.md
# Behavior rules for Claude Code. Read this entire file before doing anything.

---

## What This Project Is

A searchable, filterable web dashboard over Ohio's public voter file (a
downloaded CSV/spreadsheet export). Lets Sri browse and query registrants by
name, address, county, precinct, district, party (primary history), and
registration/vote-history status, plus ask natural-language questions over
the dataset via Claude (e.g. "how many active voters in Franklin County
voted in the last 3 general elections").

This is a personal research/analysis tool, not a multi-tenant SaaS product —
there is one operator (Sri). Do not add multi-user account systems, billing,
or sharing features unless asked.

Stack:
- **Frontend:** React + Vite + Tailwind CSS → Azure Static Web Apps
- **Backend:** Azure Functions (managed, lives in `/api` folder inside SWA)
- **Database:** Firebase Firestore — see "Data Model Deviation" below, this
  project does NOT use the standard `users/{uid}/` pattern
- **Auth:** Firebase Auth (single operator account, Google sign-in)
- **AI:** Anthropic Claude API — natural-language query translation over the
  voter dataset
- **DNS:** Cloudflare
- **Local dev:** SWA CLI (`swa start`) + Azure Functions Core Tools (`func start`)

Do not introduce new services, languages, or frameworks without being explicitly asked.

---

## Data Model Deviation — Read Before Touching Firestore

The voter file is a **shared reference dataset**, not per-user app data. Ohio's
statewide file is millions of rows — do not try to jam it under `users/{uid}/`.

Open questions to resolve in Phase 1 before importing real data (ask Sri, don't guess):
- **Scale check first:** how many rows is the actual downloaded file (statewide vs.
  one county)? This determines whether Firestore is even viable.
- If it's a single county or a filtered subset (tens of thousands of rows),
  Firestore in a top-level `voters/{voterId}` collection with composite
  indexes on (county, party, status, precinct) is workable.
- If it's the full statewide file (~8M rows), Firestore query limits
  (no full-text search, no OR across inequality fields, composite index
  explosion) make it a poor fit — flag this to Sri rather than building it
  and discovering it later. Alternatives worth raising: import into
  Postgres/SQLite and query from the Function, or a search index
  (Algolia/Typesense) fed from the CSV.
- Voter file data is public record but still PII (name, address, DOB or
  birth year, party history). Treat it as sensitive: don't expose raw CSVs
  to the frontend, don't log full rows, gate all endpoints behind the
  single-operator auth check.

---

## Mandatory Behavior Rules

### 1. Read Before You Write
Before creating or modifying any file — read the relevant section of this file first. If you're unsure how something works in this stack, say so. Do not guess.

### 2. One Change at a Time
When making multiple file changes, do them one at a time and state what you changed and why. Do not batch 10 files in one shot.

### 3. Verify After Every Change
Every file change or command must be paired with a verification step. Tell Sri exactly what to run to confirm it worked and what success looks like.

### 4. Secret Hygiene — Absolute Rule
NEVER put real API keys, tokens, secrets, or credentials in any file or response. Use placeholders like `YOUR_KEY_HERE`. Secrets live in `api/local.settings.json` (never committed) or Azure App Settings.

### 5. Directory Rule
ALWAYS specify which directory to run every command in. Never assume Sri knows the context.

### 6. Confession Block
End every non-trivial response with:
VERIFIED: [things you actually checked]
ASSUMED: [things you treated as true without checking]
GUESSED: [anything you're not sure about]

If GUESSED contains anything important, stop and ask before proceeding.

---

## Architecture Rules — Non-Negotiable

### Azure Functions
- Functions live in `/api/` — managed by SWA, NOT a separate Function App resource
- `func start` runs from `/api/` subfolder ONLY — never from project root
- `local.settings.json` lives in `api/local.settings.json` — not the project root
- Shared helpers live in `/api/shared/` — import them, don't duplicate
- Node version: v20 only (`nvm use 20` before `func start`)

### Firestore (or its replacement — see Data Model Deviation above)
- Voter data lives in its own top-level structure, NOT `users/{uid}/`
- Resolve the scale question (Firestore vs. Postgres/SQLite vs. search index)
  in Phase 1 before writing the import pipeline
- Security rules deny direct client reads of voter data — all access goes
  through gated Azure Functions endpoints, never a live Firestore listener
  from the frontend

### React Frontend
- No API keys or secrets in the frontend ever
- Firebase web config (apiKey, authDomain, projectId, appId) in `.env` is fine — it's public-facing
- API calls go through `src/lib/api.js` which attaches the Firebase auth token header
- Dark theme: `bg-gray-950` background, `bg-gray-900` cards

---

## File Structure

```
ohio-voter-explorer/
├── CLAUDE.md                           ← this file
├── src/
│   ├── App.jsx
│   ├── pages/                          ← Dashboard, VoterSearch, VoterDetail, AskAI
│   ├── components/                     ← SearchFilters, ResultsTable, VoterCard, NLQueryBox
│   ├── hooks/
│   └── lib/
│       ├── firebase.js
│       └── api.js
├── api/
│   ├── shared/
│   │   └── auth.js
│   ├── search-voters/                  ← filtered/paginated voter search
│   │   ├── index.js
│   │   └── function.json
│   ├── voter-detail/                   ← single voter record
│   │   ├── index.js
│   │   └── function.json
│   ├── ask-ai/                         ← NL query -> structured query via Claude
│   │   ├── index.js
│   │   └── function.json
│   ├── import-voter-file/              ← one-time/repeatable CSV ingest job
│   │   ├── index.js
│   │   └── function.json
│   ├── host.json
│   ├── package.json
│   └── local.settings.json             ← NEVER COMMIT
├── data/                                ← gitignored: raw voter file CSV lives here locally, never committed
├── staticwebapp.config.json
├── package.json
├── .env                                 ← NEVER COMMIT
└── .gitignore
```

---

## Environment Variables

### api/local.settings.json (local dev — never commit)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "FIREBASE_SERVICE_ACCOUNT": "YOUR_BASE64_SERVICE_ACCOUNT_HERE",
    "ANTHROPIC_API_KEY": "YOUR_KEY_HERE"
  }
}
```

### .env (frontend — never commit)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## Local Dev

**Window 1** — from `C:\Users\skavu\OneDrive\Documents\GitHub\ohio-voter-explorer\api`:
```powershell
nvm use 20
func start
```

**Window 2** — from `C:\Users\skavu\OneDrive\Documents\GitHub\ohio-voter-explorer`:
```powershell
swa start http://localhost:5173 --api-location api
```

App runs at `localhost:4280`. Start Functions first, then SWA.

---

## Current Build Phase

- [ ] Phase 0 — Setup (repo, Firebase, local dev running)
- [ ] Phase 1 — Decide data store (Firestore vs. Postgres/SQLite vs. search index) based on actual file size; build the CSV import pipeline
- [ ] Phase 2 — Search & filter dashboard (county, party, status, precinct, name/address)
- [ ] Phase 3 — Natural-language query via Claude (translate question -> structured filter/aggregation)
- [ ] Phase 4 — Deploy
