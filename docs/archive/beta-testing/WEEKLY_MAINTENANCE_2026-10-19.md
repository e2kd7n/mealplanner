# Weekly Maintenance — 2026-10-19

## Issue and Repository Hygiene

- [x] Reviewed all 20 open issues
- [x] Closed completed issues: **#417** (deepmerge-ts/mysql2 Prisma vulns — resolved by Prisma 7.10.1 upgrade via audit fix)
- [x] New issues created: **#422** (braces HIGH via nodemon dev dep — new finding from this run)
- [x] No other issues found clearly resolved by recent commits
- [x] Stale issues (30+ days no activity): #307, #261, #200, #170, #116, #84, #66, #64, #63, #20, #19, #14, #13, #12, #9, #8 — all P3-low or P4-future, intentionally deferred, no comment added
- [x] ISSUE_PRIORITIES.md regenerated via `./scripts/update-issue-priorities.sh`
- [x] Credential-leak scan of last 7 days' commits: **no matches found**
- [x] Secret rotation status: `docs/SECRET_ROTATION_STATUS.json` present; last rotation 2026-08-19; all secrets due 2026-11-17 — **not overdue**, no action needed

**Note:** Pi's `weekly-repo-hygiene.sh` cron ran 2026-10-18 (yesterday); only one commit since last maintenance (`1a7f347 chore: update issue priorities`). No resolved issues beyond #417 identified.

## Database Maintenance

- [x] **DB backup SKIPPED** — no live container access from cloud environment
- [x] Backup script DB name verified: `backup-database.sh` uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✅ correct

## Security Updates

### npm audit — backend

**Before fix:** 7 HIGH — `deepmerge-ts <8.0.0` (GHSA-ggr8-5vv4-36mx) and `mysql2 <=3.23.0` (GHSA-3f6p-5ww8-9rcr, GHSA-rgwj-5xj2-c3m3) via Prisma transitive deps.

`npm audit fix --legacy-peer-deps` run: ✅ upgraded Prisma to **7.10.1**, pulling in `deepmerge-ts@8.0.2` and `mysql2@3.24.4`. Backend TypeScript build confirmed clean after upgrade.

**Remaining after fix (3 HIGH):** `braces` (GHSA-vfj7-8cjw-p6xm) via `chokidar → nodemon` (devDependency only). Fix requires `--force` (would downgrade nodemon to 1.14.10 — breaking change). **Not applied.** Tracked in new issue **#422**.

### npm audit — frontend

**Before fix:** 0 vulnerabilities (from `package-lock.json`)

**After fresh install:** `braces` (GHSA-vfj7-8cjw-p6xm) via `chokidar → nodemon` (devDependency) — same chain as backend. Fix requires `--force`. `package-lock.json` unchanged (no fixable changes available). Tracked in **#422**.

### Issue activity

- Closed #417 (deepmerge-ts/mysql2 HIGH via Prisma — now resolved by Prisma 7.10.1)
- Opened #422 (braces HIGH via nodemon dev dep — GHSA-vfj7-8cjw-p6xm, dev-only, no production risk)

### Credential leak scan

- `git log --since="7 days ago"` scanned for AWS keys, private keys, and secret assignments: **no matches found** ✅

### Secret rotation

- `docs/SECRET_ROTATION_STATUS.json` present ✅
- `lastRunAt`: 2026-08-19T23:05:19Z
- All 5 secrets due: **2026-11-17** — not overdue, no action needed

## Code Quality

### TypeScript build

| Target | Result |
|---|---|
| backend | ✅ Compiles clean (tsc exit 0, with Prisma 7.10.1) |
| frontend | ✅ Compiles clean (tsc -b exit 0) |

Frontend Vite build: ✅ 1.73s. Chunk size warnings for `mui-core` (509 kB) and `react-core` (230 kB) — pre-existing, Pi RAM budget acknowledged in `vite.config.ts`.

### Lint

| Target | Result |
|---|---|
| backend | ✅ 0 errors, 276 warnings (all `no-explicit-any` — pre-existing) |
| frontend | ❌ 25 problems: **18 errors, 7 warnings** — tracked in #421 |

Frontend lint errors are the same react-hooks violations (set-state-in-effect, exhaustive-deps) filed in #421 last week. No change.

### TODO / FIXME scan

No `TODO` or `FIXME` comments found in `backend/src` or `frontend/src` ✅

## Performance Monitoring

**SKIPPED** — no live container access (podman/docker not available in cloud environment). Applies to: container logs, API response times, memory usage, cache hit rates.

## Documentation

- No documentation updates required this run
- `ISSUE_PRIORITIES.md` updated (committed)

## User Feedback Review

**SKIPPED** — Pi-side `scripts/feedback-log-triage.sh` handles this automatically; no `data/maintenance-logs/feedback-triage-status.txt` accessible from cloud environment.

## Summary

**Commits made this run:**
1. `fix(deps): npm audit fix — weekly maintenance` — upgrades Prisma to 7.10.1, fixes 4 HIGH deepmerge-ts/mysql2 backend vulns
2. `chore: update issue priorities — weekly maintenance (2026-10-19)`
3. `chore(maintenance): weekly maintenance 2026-10-19` — this report

**Issues closed:** #417 (deepmerge-ts/mysql2 via Prisma — resolved)  
**Issues opened:** #422 (braces HIGH via nodemon devDep — not fixable without breaking change)  
**Items skipped:** DB backup, performance monitoring, container log review, user feedback review (all require live Pi/container access)

**Critical findings:** None. The long-standing Prisma transitive vuln in #417 is now resolved. Remaining 3 HIGH in `braces/nodemon` are dev-only and carry no production risk.
