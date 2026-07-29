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
- **Database:** SQLite — a local file, read/written from the Function. Decided
  in Phase 1 (see "Data Model Deviation" below); not hosted online, by choice,
  to keep cost at zero while this is local-only. Revisit if/when this deploys.
- **Auth:** Firebase Auth (single operator account, Google sign-in) — currently
  disabled (`REQUIRE_AUTH = false` in `src/App.jsx`) since Firebase isn't
  configured yet; flip it back on when ready.
- **AI:** Anthropic Claude API — natural-language query translation over the
  voter dataset
- **DNS:** Cloudflare
- **Local dev:** SWA CLI (`swa start`) + Azure Functions Core Tools (`func start`)

Do not introduce new services, languages, or frameworks without being explicitly asked.

---

## Data Model Deviation — Decided: SQLite, Not Firestore

The voter file is a **shared reference dataset**, not per-user app data — it
was never going to fit `users/{uid}/` regardless of data store.

**Phase 1 decision (resolved):** SQLite, as a local file, not Firestore.

- Franklin County alone is ~893,000 rows (measured from the actual file:
  528,401,203 bytes / ~591 bytes per row), with 137 columns — 46 core
  identity/address/district fields plus 91 sparse per-election
  history columns (one per Ohio election since March 2000).
- Row count isn't what ruled out Firestore — 893K rows is trivial for either
  store. It's the **schema shape**: the 91 election columns are a textbook
  normalize-into-a-child-table case (`voters` + `vote_history`, melted from
  wide to long, non-blank cells only — roughly ~9M rows once normalized,
  still trivial for SQLite). Questions like "active voters in Franklin who
  voted in the last 3 generals" want a relational `GROUP BY`/join, which
  Firestore has no good answer for without reading every doc in a Function.
- SQLite specifically (not Postgres) because: single operator, not hosted
  online yet, cost matters right now, zero ops. Revisit Postgres only if/when
  this needs to run as a hosted, concurrent, always-on service.
- Statewide (~8M rows) was never in scope here — this file is Franklin
  County only (`COUNTY_NUMBER` = 25 on every row).
- Voter file data is public record but still PII (full name, address, DOB,
  primary-ballot/party history). Treat it as sensitive: don't expose raw CSV
  or the raw SQLite file to the frontend, don't log full rows, gate all
  endpoints behind the single-operator auth check once auth is back on.
- The SQLite file itself lives in `data/` (gitignored) — never committed,
  same rule as the raw CSV.

---

## Mandatory Behavior Rules

### 1. Read Before You Write
Before creating or modifying any file — read the relevant section of this file first. If you're unsure how something works in this stack, say so. Do not guess.

### 2. One Change at a Time
When making multiple file changes, do them one at a time and state what you changed and why. Do not batch 10 files in one shot.

### 3. Verify After Every Change — Run It Yourself, Live
Every change must be paired with a verification step **you actually execute**.
Do not hand Sri a list of commands and call that verification. Sri needs to see
the running version of what you are doing, not a description of it.

Default to the live app. `.claude/launch.json` is already configured — start it
with the preview tool (port 4280), then drive the real UI: click the control you
changed, read the values it actually renders, check the console for errors.

Order of preference:
1. **The live app in the Browser pane** — for any UI or end-to-end change.
2. **A direct query against `data/franklin.db`** (better-sqlite3, run from
   `/api`) — for any claim about counts, schema, or SQL behavior. Never state a
   number you have not run.
3. **`npm run build` from the project root** — catches syntax and import
   breakage only.

A passing build is NOT evidence that a UI change works. Neither is a correct SQL
query, on its own, evidence that the page renders it correctly.

Leave the preview running when you finish so Sri can look at it. Then tell Sri
what to click and what the correct result looks like — as a pointer to what you
already confirmed, not as a task you are delegating.

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

### SQLite (see Data Model Deviation above — decided, not Firestore)
- Voter data lives in its own SQLite file in `data/` (gitignored), NOT
  Firestore and NOT `users/{uid}/`
- Normalized schema: `voters` (46 core fields) + `elections` + `vote_history`
  (long/melted from the 91 wide per-election columns, non-blank only)
- All access goes through gated Azure Functions endpoints — the frontend
  never touches the SQLite file directly

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
├── .claude/
│   └── launch.json                     ← runs the app at :4280 in the Browser pane
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

**One window** — from `C:\Users\skavu\OneDrive\Documents\GitHub\ohio-voter-explorer`:
```powershell
nvm use 20
swa start http://localhost:5173 --api-location api --run "npm run dev"
```

App runs at `localhost:4280`. That single command starts all three pieces:

- `--api-location api` — the SWA CLI **starts the Functions host itself** from
  `/api`. Do NOT also run `func start` in another window; both default to port
  7071 and will collide.
- `--run "npm run dev"` — starts the Vite dev server on 5173. Plain
  `swa start http://localhost:5173` does not launch Vite, it only proxies to a
  server it expects to already be listening there, and hangs on
  `Waiting for http://localhost:5173 to be ready` if nothing is.
- the bare URL — where SWA proxies the frontend from.

In Claude Code, `.claude/launch.json` runs this same command in the Browser pane
— see "Live Preview" below. That is the default way to verify (rule 3), not a
fallback.

Run `func start` from `/api` on its own **only** when you want the Functions
host isolated (attaching a debugger, reading its logs without SWA's noise). In
that case point SWA at the already-running host rather than letting it spawn one:
```powershell
swa start http://localhost:5173 --api-devserver-url http://localhost:7071 --run "npm run dev"
```

Ignore the repeated `AzureWebJobsStorage ... Unhealthy` warnings — that's
Azurite not running, and every endpoint here is HTTP-triggered, so it does not
need storage.

### Live Preview (Claude Code)

`.claude/launch.json` defines one config, `ohio-voter-explorer`, on port 4280.
Start it with the preview tool by name — it runs the same `swa start` command
above, so Vite, the Functions host, and the SWA proxy all come up together.

Workflow for verifying a UI change:
1. Start the preview (reuses the server if already running).
2. Check the server logs for `validated successfully` on **both** 5173 and 7071
   before trusting anything on the page.
3. Read the page, interact with the control you changed, read the result.
4. Check the browser console for errors.
5. Leave it running so Sri can look at it.

Gotchas hit before, don't rediscover them:
- **Screenshots fail unless the Browser pane is actually displayed** ("not
  compositing frames"). Do not block on this — read the accessibility tree or
  query the DOM instead.
- **The accessibility tree truncates** and can cut off controls below the fold
  (e.g. the pagination footer under a 25-row table). Raising `max_chars` does
  not always help. Query the DOM directly for those.
- **`find` needs a cached `read_page` first**, and the cache is easily lost.
- **Selects need the form-input tool**, not a click — set the `value`
  (`NONE`, `ACTIVE`, …), not the visible label.
- **Scoped DOM queries**: wrap in an IIFE. Re-running a snippet that declares
  the same `const` at top level throws `Identifier already declared`.

---

## Current Build Phase

- [x] Phase 0 — Setup (repo, local dev running; Firebase project itself still not created — auth is off for now)
- [ ] Phase 1 — Data store decided (SQLite, see Data Model Deviation); still need: get the full Franklin County file onto disk here, build the CSV import pipeline, run it
- [ ] Phase 2 — Search & filter dashboard (county, party, status, precinct, name/address)
- [ ] Phase 3 — Natural-language query via Claude (translate question -> structured filter/aggregation)
- [ ] Phase 4 — Deploy
