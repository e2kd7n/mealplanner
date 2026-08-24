# Weekly Maintenance - 2026-08-24

Run context: cloud maintenance routine (no Pi/container access). Executed only the judgment-based half of the checklist; the Pi-side automated halves (`weekly-repo-hygiene.sh`, `security-audit.sh`, `feedback-log-triage.sh`, `rotate-secrets-if-due.sh`) run on their own weekly cron.

## Issue and Repository Hygiene

- [x] Reviewed all 19 open issues
- [x] Closed completed issues: #391 (all 11 child issues #379–#389 closed via PR #394; epic completion criteria met)
- [x] No other issues found closable — remaining open issues are all legitimately in-progress or backlogged
- [x] Flagged stale issues (no activity in 30+ days) with a comment: #8, #9, #12, #13, #14, #64, #66
- [x] `./scripts/update-issue-priorities.sh` — **skipped**, reason: `gh` CLI not installed in the cloud environment. The Pi's `weekly-repo-hygiene.sh` cron (`15 4 * * 0`) regenerates `ISSUE_PRIORITIES.md`; verify next Pi run picks up #391's closure.

### Open issues after this run (18)

| # | Title | Notes |
|---|-------|-------|
| 399 | security: 2 remaining ws vulns via socket.io-adapter transitive dep | **NEW this run** — see Security Updates below |
| 357 | design: ad-hoc/custom grocery item entry | P4-future, active design |
| 355 | ux: clarify /register vs first-run setup | P4-future |
| 307 | accessibility: missing aria-labels | P3-low |
| 261 | perf(e2e): Playwright storageState for FTUE | no label |
| 200 | Pi: move Postgres data volume to USB SSD | P3-low, infrastructure |
| 170 | photo/PDF upload for recipe creation | P3-low |
| 116 | cost tracking for budget users | P2-medium |
| 84 | recipe document upload (PDF/img/DOCX) | P3-low |
| 66, 64, 63, 20, 19 | future/backlog | P4-future |
| 14, 13, 12, 9, 8 | nutrition/grocery backlog | P3-low, several stale |

## Database Maintenance

- [ ] Backup completed successfully — **skipped**, reason: no container/Pi access from cloud routine
- [x] Verified `scripts/backup-database.sh` uses correct DB name — confirmed `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` (matches Prisma schema and Pi compose)

## Security Updates

### `npm audit` results

Both projects have `pnpm-lock.yaml` (production) and `package-lock.json` (both tracked in git). Both audit tools were exercised.

| Project | Tool | Before | After `audit fix` (no `--force`) |
|---------|------|--------|-----------------------------------|
| backend | npm | 16 (2 low, 5 mod, 9 high) | **3 high** (deepmerge-ts transitive, needs `--force` for prisma major bump) |
| backend | pnpm | 2 (1 mod, 1 high) | **2** (pnpm auto-fix can't resolve — needs manual override, see #399) |
| frontend | npm | 7 high | **0** |
| frontend | pnpm | 0 | **0** |

Notes on the divergence:
- **backend npm 3 remaining high**: all deepmerge-ts via `@prisma/config → prisma`. pnpm-lock already has a `deepmerge-ts: 8.0.0` override (added by #392 fix, commit 0429327) so pnpm sees 0 here. npm's `package-lock.json` doesn't respect pnpm overrides, so it still counts them. Fix requires `npm audit fix --force` bumping prisma across a major, which is out of scope for weekly non-breaking maintenance.
- **backend pnpm 2 remaining**: `socket.io-adapter@2.5.6` is still pulling `ws@8.18.3` (2 CVEs). Same shape as #365, the 0429327 fix's `~2.5.x` range didn't reach the patched adapter. Filed as **#399** with a suggested `socket.io-adapter@>=2.5.8` override. Rolling `auto-security-audit` tracker on the repo is empty, so this hasn't been caught by the Pi's `scripts/security-audit.sh` yet.

### `npm audit fix` — changes committed

Committed `backend/package-lock.json` and `frontend/package-lock.json` on the maintenance branch. No `package.json` changes (transitive-only). Skipped `--force` per policy.

### Credential leak scan

- [x] `git log --since="7 days ago"` credential-pattern scan — the matches returned are all script text (`PGPASSWORD="$OLD_PG_PASS"` variable references, `POSTGRES_PASSWORD_FILE`, `ADMIN_PASSWORD` env fallbacks in test-api scripts) not actual leaked secrets. No real credential leaks.

### Secret Rotation cross-check (`docs/SECRET_ROTATION_STATUS.json`)

- [x] File present. All 5 secrets rotated 2026-08-19, next `dueBy` = **2026-11-17** (all synchronized). Nothing overdue. Pi cron `rotate-secrets-if-due.sh` (`15 3 * * 0`) is expected to no-op every week until Nov 17.

## Performance Monitoring

- [ ] All performance monitoring tasks — **skipped**, reason: no live container access from cloud routine (docker logs, docker stats, memory/response-time metrics all require Pi shell).

## Code Quality

- [x] Backend TypeScript build (`npm run build`): passes cleanly
- [x] Frontend TypeScript build (`npm run build`): passes cleanly. Bundle sizes within expected chunk-split targets (mui-core 504KB is the largest — matches the vite.config.ts 500KB warning threshold called out in CLAUDE.md; no regression).
- [x] Backend lint (`npm run lint`): 275 warnings, **0 errors**. All warnings are `@typescript-eslint/no-explicit-any` in existing files (`secureLogger.ts`, request handlers) — pre-existing baseline, not regression.
- [x] Frontend lint (`npm run lint`): **18 errors, 8 warnings**. Errors are `react-hooks/set-state-in-effect` violations (calling setState directly in useEffect body — e.g. `RecipeDetail.tsx:105`, others). These are pre-existing and pass the build (build uses `tsc -b && vite build`, not lint). Worth its own P3 issue if not already tracked.
- [x] TODO/FIXME scan (`grep -r "TODO\|FIXME" backend/src frontend/src`): **0 hits** — clean.

## Documentation

- [x] No documentation updates triggered by this run's findings

## User Feedback

- [ ] `data/maintenance-logs/feedback-triage-status.txt` — **skipped**, reason: no Pi filesystem access. Verify locally on the Pi that `scripts/feedback-log-triage.sh` (`45 3 * * 0`) is still running clean.

## Skipped items summary

The following spec items require Pi/container access this cloud routine doesn't have:

1. Database backup + restoration test
2. Container resource stats (memory, CPU, response times)
3. Application/DB log inspection
4. Feedback-triage status file spot-check
5. `update-issue-priorities.sh` execution (needs `gh` CLI — Pi has it, cloud environment doesn't)

## Critical findings needing attention

- **#399 (P1-high, security)** — 2 open `ws` vulnerabilities in the backend pnpm lockfile (1 high memory-exhaustion DoS, 1 moderate uninit memory disclosure). Needs a manual pnpm override (suggested in the issue). Also worth checking why the Pi's `scripts/security-audit.sh` rolling tracker didn't catch it — either the Sunday cron hasn't fired since commit 0429327 landed or the tracker's fingerprint dedup missed this variant.

## Notes

- Local clone was on a detached HEAD initially (from a prior session's worktree) and was ~5 commits behind `origin/main`. Fetched and fast-forwarded main to c6dea62 before running the audit.
- Repo has both `package-lock.json` and `pnpm-lock.yaml` tracked. `pnpm audit` is the authoritative reading (per the memory `feedback_audit_pnpm_not_npm` — npm undercounts because it doesn't respect pnpm overrides); `npm audit fix` still worth running because the npm lockfile is tracked and used by dev-machine `npm install` fallbacks.
