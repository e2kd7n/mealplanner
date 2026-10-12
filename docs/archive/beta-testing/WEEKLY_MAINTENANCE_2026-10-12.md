# Weekly Maintenance — 2026-10-12

## Issue and Repository Hygiene

- [x] Reviewed all 20 open issues
- [x] Closed completed issues: #420 (security vulns fixed by audit fix — see Security section)
- [x] No issues found that were clearly resolved by recent commits and left open
- [x] Stale issues (30+ days no activity): #417, #307, #261, #200, #170, #116, #84, #66, #64, #63, #20, #19, #14, #13, #12, #9, #8 — all are P3-low or P4-future enhancement/feature requests with no active work planned; no comment added as they are intentionally deferred
- [x] New issues created: #421 (frontend lint errors — 18 errors)
- [x] ISSUE_PRIORITIES.md regenerated via `./scripts/update-issue-priorities.sh`
- [x] Credential-leak scan of last 7 days' commits: **no matches found**
- [x] Secret rotation status: `docs/SECRET_ROTATION_STATUS.json` present; last rotation 2026-08-19; all secrets due 2026-11-17 — **not overdue**, no action needed

## Database Maintenance

- [x] **DB backup SKIPPED** — no live container access from cloud environment
- [x] Backup script DB name verified: `backup-database.sh` uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✅ correct

## Security Updates

### npm audit — backend

Before fix: **20 vulnerabilities (1 low, 4 moderate, 14 high, 1 critical)**

New findings vs last run:
- **CRITICAL — `proxy-addr` (GHSA-jqcg-44mw-7w3h)**: IP spoofing via IPv4-mapped IPv6 trust subnet — fixable without `--force`
- **HIGH — `source-map-js` (GHSA-68fv-2mgg-jv7q)**: event-loop DoS via indexed source-map section offsets — fixable without `--force`
- **HIGH — `undici`** (10 new advisories including WebSocket DoS, cookie disclosure, TLS bypass, response splitting) — fixable without `--force`

Remaining after fix (7 HIGH): all `mysql2`/`deepmerge-ts` via Prisma transitive deps — tracked in #417, require breaking `prisma@6.19.3` upgrade.

`npm audit fix --legacy-peer-deps` run: ✅ fixed critical + most high vulns.

### npm audit — frontend

Before fix: **7 vulnerabilities (3 moderate, 4 high)**

Findings:
- `axios` — 3 additional HIGH advisories (socket hijack GHSA-m8m8-qj5v-23w3, CIDR proxy bypass GHSA-44g4-m2mj-wpvx, redirect SSRF GHSA-r4gj-5m52-g5wh)
- `brace-expansion` — 3 HIGH advisories (DoS variants)
- `source-map-js` — HIGH (event-loop DoS)
- `undici` — HIGH (same advisories as backend)

`npm audit fix --legacy-peer-deps` run: ✅ **0 vulnerabilities remain**.

### Issue activity
- Closed #420 (security: undici/brace-expansion/engine.io/braces HIGH) — all tracked vulns fixed
- Issue #417 (Prisma mysql2/deepmerge-ts HIGH) remains open — requires breaking upgrade

## Code Quality

### TypeScript build

| Target | Result |
|---|---|
| backend | ✅ Compiles clean (exit 0) |
| frontend | ❌ FAILED — test files (`src/__tests__/**`) picked up by `tsconfig.app.json`'s `"include": ["src"]`, causing `@testing-library/react` type resolution errors in bundler mode |

**Frontend build fix**: Added `"exclude": ["src/**/__tests__/**"]` to `frontend/tsconfig.app.json`. Build now passes.

### Lint

| Target | Result |
|---|---|
| backend | ✅ 0 errors, 276 warnings (all `no-explicit-any` — pre-existing) |
| frontend | ❌ 25 problems: **18 errors, 7 warnings** |

New issue filed: **#421** — frontend lint errors (react-hooks/set-state-in-effect in RecipeDetail.tsx and others).

### TODO / FIXME scan

No `TODO` or `FIXME` comments found in `backend/src` or `frontend/src`.

## Performance Monitoring

**SKIPPED** — no live container access (podman/docker not available in cloud environment). Applies to: container logs, API response times, memory usage, cache hit rates.

## Documentation

- No documentation updates required this run
- `ISSUE_PRIORITIES.md` updated (committed)

## User Feedback Review

**SKIPPED** — Pi-side `scripts/feedback-log-triage.sh` handles this automatically; no `data/maintenance-logs/feedback-triage-status.txt` accessible from cloud environment.

## Secret Rotation Check

- `docs/SECRET_ROTATION_STATUS.json` present ✅
- `lastRunAt`: 2026-08-19T23:05:19Z
- All 5 secrets due: **2026-11-17** — not overdue, no action needed
- Next check: 2026-11-17

## Summary

**Commits made this run:**
1. `fix(frontend): exclude test files from production build tsconfig` — unblocks frontend CI builds
2. `fix(deps): npm audit fix — weekly maintenance` — fixes CRITICAL proxy-addr + HIGH undici/source-map-js (backend), all frontend vulns
3. `chore: update issue priorities — weekly maintenance (2026-10-12)`
4. `chore(maintenance): weekly maintenance 2026-10-12` — this report

**Issues opened:** #421 (frontend lint — 18 errors)  
**Issues closed:** #420 (security vulns resolved by audit fix)  
**Items skipped:** DB backup, performance monitoring, container log review, user feedback review (all require live Pi/container access)

**Critical findings:** None outstanding after this run. Previous CRITICAL `proxy-addr` vuln is now fixed.
