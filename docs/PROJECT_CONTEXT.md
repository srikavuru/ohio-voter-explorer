# ohio-voter-explorer — Project Context Document
**Upload this to the ohio-voter-explorer Claude project.**
**Last updated: 2026-07-21**

---

## What This App Is

A single-operator dashboard for exploring the Ohio voter file Sri downloaded
as a spreadsheet — search/filter registrants by county, party, precinct,
district, and vote-history status, view individual records, and ask
natural-language questions over the dataset via Claude.

---

## The Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Azure Functions (managed in SWA, /api folder) |
| Database | TBD — see "Key Design Decisions" (Firestore vs. Postgres/SQLite vs. search index, depends on row count) |
| Auth | Firebase Auth (single operator, Google sign-in) |
| Hosting | Azure Static Web Apps |
| DNS | Cloudflare |
| AI | Anthropic Claude API — natural-language query translation |

---

## Current Build Status

| Phase | What | Status |
|---|---|---|
| 0 — Setup | Repo, Firebase, local dev | ⬜ Not started |
| 1 — Data pipeline | Pick data store, build CSV import | ⬜ Not started |
| 2 — Search dashboard | Filter/search/browse UI | ⬜ Not started |
| 3 — NL query | Claude-powered question answering over the data | ⬜ Not started |
| 4 — Deploy | Auth, production services, Azure deploy | ⬜ Not started |

---

## Repo

- GitHub: https://github.com/srikavuru/ohio-voter-explorer (private) — **not yet created**
- Local: `C:\Users\skavu\OneDrive\Documents\GitHub\ohio-voter-explorer`
- Branch: main

---

## Local Dev Setup

**Window 1** — from `C:\Users\skavu\OneDrive\Documents\GitHub\ohio-voter-explorer\api`:
```powershell
nvm use 20
func start
```

**Window 2** — from `C:\Users\skavu\OneDrive\Documents\GitHub\ohio-voter-explorer`:
```powershell
swa start http://localhost:5173 --api-location api
```

App runs at `localhost:4280`. Functions must start before SWA.

---

## Environment Variables

### `api/local.settings.json` (never committed)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "FIREBASE_SERVICE_ACCOUNT": "<base64 service account>",
    "ANTHROPIC_API_KEY": "<raw key>"
  }
}
```

### `.env` (root, never committed)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## Firebase Project

- Project: `ohio-voter-explorer` (create at console.firebase.google.com)
- Auth: Google sign-in, single operator account only
- Firestore: production mode, us-central1 — *only if Phase 1 decides Firestore is the right store*

---

## Data Structure (decide in Phase 1)

```
Not yet decided. Candidates:

Option A — Firestore (only viable if the downloaded file is a county-level
subset, tens of thousands of rows, not the full ~8M-row statewide file):
voters/
  {voterId}/
    county, precinct, party, status, districts, name, address, voteHistory[]

Option B — SQLite/Postgres queried from the Function (better fit for full
statewide file, real filtering/joins, no composite-index explosion)

Option C — Search index (Algolia/Typesense) fed from the CSV, for fast
full-text + faceted search at scale
```

**Before writing the import pipeline**: check the actual row count of the
downloaded spreadsheet and decide here.

---

## API Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | /api/search-voters | Filtered/paginated voter search (county, party, status, precinct, name) |
| GET | /api/voter-detail | Single voter record by ID |
| POST | /api/ask-ai | Natural-language question -> structured query -> answer, via Claude |
| POST | /api/import-voter-file | Ingests the voter file CSV into the chosen data store |

---

## Key Design Decisions

- **Not using `users/{uid}/` Firestore pattern**: this is a shared reference
  dataset for a single operator, not per-user app data. Standard pattern
  doesn't apply here.
- **Data store choice deferred to Phase 1**: depends entirely on how many
  rows are in the actual downloaded file. Check this first — don't default
  to Firestore out of habit if the file is the full statewide extract.
- **PII handling**: voter file data is public record in Ohio but is still
  personal data (name, address, birth year, party history). Raw CSV never
  touches the frontend or git; all access goes through gated API endpoints.

---

## What's Working

Nothing yet — Phase 0 not started.

---

## Known Issues / Notes

- Need to confirm: which Ohio voter file export is this (statewide SOS file,
  or a single county board of elections export)? Row count drives the
  Phase 1 data-store decision.

---

## Phase 1 — What's Left

- Determine row count / scope of the downloaded file
- Pick data store (Firestore / Postgres-SQLite / search index)
- Build CSV import Function
- Design Firestore security rules (or equivalent access control) so the
  frontend never reads voter data directly — only through gated endpoints
