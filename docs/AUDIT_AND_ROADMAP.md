# Code Audit & Product Roadmap — Ohio Voter Explorer

_Audited 2026-07-26 against the working tree on `claude/repo-setup-40diiw` (last commit `33913e1`), with the real Franklin County import loaded (891,350 voters / 9,672,773 vote-history rows / 91 elections, 870 MB SQLite file). Every timing below was measured against that database on this machine._

---

## 1. Where the product stands

| Feature | Status | Notes |
|---|---|---|
| Dashboard | **Working** (uncommitted) | Real aggregates via `dashboard-stats`: totals, party, districts, cities, turnout chart with honest caveats about purge bias |
| Voter Search | **Working** (partly uncommitted) | Filters: name/address, party (incl. never-pulled-primary), status, precinct, 3 district types, tenure brackets, housing type; paginated |
| Voter Detail | **Working** | Full vote history; deliberately strips DOB to birth year and omits mailing address |
| Ask AI | **Stub** | `api/ask-ai` returns 501; the Ask button in `NLQueryBox.jsx` has no click handler at all |
| Import pipeline | **Working, verified** | Streaming CSV → batched upserts; ran clean on the real 528 MB file in 248s |
| Auth | **Off by design** | `REQUIRE_AUTH = false`; Firebase project not created yet |

Phase 2 (search & filter dashboard) is functionally ~90% done. Phase 3 hasn't started. Phase 4 has unresolved blockers (below).

---

## 2. Audit findings

### Critical — must fix before any deploy (fine for local-only use today)

**C1. `verifyAuth` fails open.** In [api/shared/auth.js](../api/shared/auth.js), a request with **no** Authorization header is treated as the local dev user and allowed through. Deployed as-is, every endpoint — all 891k voters' PII — is publicly readable by simply omitting the header. The check must invert before Phase 4: when auth is enabled, no token (or an invalid one) must mean 401.

**C2. `import-voter-file` accepts an arbitrary `filePath` from the request body.** Combined with C1, a deployed instance would let anyone POST a path and have the server attempt to parse any file on disk into the database. Locally harmless; before deploy either delete this function (the CLI script in `api/scripts/import.js` already covers the job) or gate it behind an env flag.

**C3. The 870 MB SQLite file has no deployment story yet.** SWA-managed Functions get an ephemeral, size-limited filesystem; `data/franklin.db` can't ship in the deployment package. This was a known, deliberate deferral (CLAUDE.md), but it hard-gates Phase 4. Realistic options, cheapest first: keep the app local-only indefinitely; a standalone Functions app with an Azure Files mount; or graduate to hosted Postgres. Decide before investing in any other Phase 4 work.

### Bugs & loose ends

**B1. The Ask AI page is dead UI.** The button does nothing (`NLQueryBox.jsx` never calls the `askAI()` helper that already exists in `api.js`). Until Phase 3 lands, either hide the nav link or have the button return a "coming soon" response — a button that silently does nothing reads as broken.

**B2. LIKE wildcards in user input aren't escaped.** Searching for text containing `%` or `_` produces wrong matches (parameterization prevents injection — this is a correctness nit, not a security one).

**B3. A meaningful slice of the product exists only as uncommitted changes.** The entire `dashboard-stats` endpoint and the expanded filter set (districts, tenure, housing) are sitting unstaged in the working tree. Commit them — right now a `git checkout .` would silently destroy the dashboard.

### Performance — measured, not guessed

| Query shape | Measured | Verdict |
|---|---|---|
| Name/address `LIKE '%smith%'` scan | 776 ms (×2 per search: count + page) | Acceptable for one operator; FTS5 is the upgrade path if it starts to grate |
| District filter (no index) | 408 ms | Fine; add an index only if it annoys |
| Tenure bracket (date functions) | 390 ms | Fine |
| **"Voted in all of the last 3 countywide generals"** | **19.6 s** | **Not fine** — and this is exactly the flagship query Ask AI is supposed to answer |

That last row is the important one: the GROUP BY/HAVING over millions of `vote_history` rows is the natural shape for every "voted in N of the last M elections" question, and it's ~20s per ask. **Recommendation:** precompute per-voter participation at import time — e.g. a `generals_voted` count column or a small summary table refreshed by `import.js`. That collapses these questions to millisecond indexed filters and should land *before* Phase 3, or the AI feature will feel broken on day one.

(`dashboard-stats` already handles its own version of this correctly with an in-memory cache; note its documented quirk — restart the Functions host after a re-import to refresh the numbers.)

### Code quality — genuinely good

Credit where due: every SQL statement is parameterized (no injection anywhere); `voter-detail` proactively minimizes PII; pagination correctly snapshots submitted filters so mid-edit paging can't mix queries; the analytics code comments explain *why* (index-friendly grouping, denominator choices, the 47-ballot fake "general") rather than *what*. This is a maintainable codebase.

Gaps: zero tests (riskiest around the import's column-mapping and the WHERE-builder — a small smoke-test file would pay for itself before Phase 3); no lint script; **Node 20 hit end-of-life in April 2026** and the Functions host warns on every start — plan the Node 22 bump; `staticwebapp.config.json` has no route-level auth rules yet (pair with C1 in Phase 4).

---

## 3. Recommended roadmap

### Now — close out Phase 2 (1–2 sessions)
1. **Commit the uncommitted work** (B3) — dashboard, filters, `.gitignore`, CLAUDE.md.
2. Neutralize the dead Ask button (B1).
3. Escape LIKE wildcards (B2) — ~5-line fix in `search-voters`.
4. **Add vote-history participation columns at import** (the 19.6s fix) and surface them as search filters — "voted in last 3 generals" as a dropdown is arguably the single highest-value feature for a voter-file tool, independent of AI.
5. Nice-to-haves as appetite allows: CSV export of filtered results, column sorting, precinct autocomplete.

### Next — Phase 3: Ask AI (2–3 sessions)
- **Architecture: Claude translates the question into a structured filter/aggregation spec** (tool-use / JSON schema), which is executed by the same WHERE-builder logic `search-voters` already uses. The model never writes raw SQL — that keeps the whole PII dataset behind a whitelist of columns and operations you control.
- Guardrails: read-only, whitelisted fields, hard LIMIT caps, and show the interpreted query back to the user so wrong answers are inspectable rather than mysterious.
- Wire up `NLQueryBox`: loading state, then render a count, a table, or a bar chart depending on the spec's shape.
- Depends on item 4 above — without precomputed participation, most interesting questions take 20 seconds.

### Then — Phase 4: Deploy (decision-gated)
Ordered so security lands before exposure:
1. Fix `verifyAuth` fail-open (C1) and add an allowlist of your UID/email.
2. Create the Firebase project, set `REQUIRE_AUTH = true`, add route rules to `staticwebapp.config.json`.
3. Remove or flag-gate the HTTP import endpoint (C2).
4. **Make the database decision (C3)** — this determines whether "deploy" means SWA as designed or a variant. Zero-cost fallback: keep it local and skip Phase 4 entirely; the tool is fully useful on localhost.
5. Node 22 upgrade; Cloudflare DNS last.

### Later — ideas beyond the current phases
- **Household view** — group voters by address; the data's already there and it's a natural browse mode.
- **Snapshot diffing** — re-import monthly SOS exports and show who was added/purged/moved between snapshots (the import is already idempotent-upsert, so this mostly needs a snapshot-date dimension).
- **Precinct choropleth map** — turnout or party share by precinct.
- **More counties** — schema and importer are already county-agnostic; it's disk space and a dropdown.
- **Likely-voter scoring** — simple recency/frequency score from vote_history; pairs well with CSV export.

---

## 4. One-glance priority list

| # | Item | Effort | Why now |
|---|---|---|---|
| 1 | Commit uncommitted dashboard/filter work | minutes | It's one bad checkout from gone |
| 2 | Precompute participation counts at import | small | Kills the 19.6s query; unblocks Phase 3 and the best Phase 2 filter |
| 3 | Dead Ask button → hide or stub message | minutes | Looks broken |
| 4 | LIKE wildcard escaping | minutes | Correctness |
| 5 | Ask AI via structured-spec translation | medium | The differentiating feature |
| 6 | Auth fail-open + import lockdown + DB hosting decision | medium | Gates any deploy; skippable while local-only |
