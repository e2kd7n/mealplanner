# Weekly Maintenance — 2026-08-19

Run manually in a local session (dedicated worktree `weekly-maintenance`) — the cloud
maintenance routine (`trig_01HqXarujCYtNDwtP4pokNqT`) is still disabled, confirmed via
`RemoteTrigger get` at the start of this run: `enabled: false`,
`ended_reason: "auto_disabled_repo_access"`. Unchanged since the 2026-08-01/2026-08-05 reports —
still needs a human to reconnect the GitHub App at
https://claude.ai/code/onboarding?magic=github-app-setup before it can run unattended again.

## Issue and Repository Hygiene
- [x] Reviewed all 33 open issues, cross-checked against `git log --oneline -40`
- [x] Closed **#374** (feedback/error-log triage automation) — implementation (PR #376) and
      one-time setup wrapper (PR #390) are both merged, and the memory record from 2026-08-19
      confirms it was verified working end-to-end on the Pi (`STATUS=COMPLETE`).
- [x] Verified **#357** (ad-hoc grocery item entry) is correctly still open — design proposal
      (#367) and product decisions (#370) have landed but implementation hasn't started.
- [x] Verified **#305** (native `alert()`/`confirm()` usage) has no comments and no linked fix
      commits since filed — left open, still accurate.
- [x] Reviewed the 10 long-tail P3-low/P4-future backlog issues with no activity in 30+ days
      (#8, #9, #12, #13, #14, #63, #64, #66, #84, #170) — all are intentionally-parked feature
      requests (nutrition tracking cluster, ICS export, scaling eval, document upload), not
      issues that were expected to move. Did not post individual "stale" comments on each —
      that would be noise on issues that are dormant by design, not by neglect. Flagging here
      instead in case priorities should shift.
- [x] `./scripts/update-issue-priorities.sh`'s auto-close heuristic flagged **#20** and **#365**
      as "appears resolved" — both false positives (regex matching "#20" and "#365" inside this
      run's own commit messages, not actual fix-commit references). Left both open, matches the
      known unreliable-heuristic pattern from the 2026-08-05 report and `#210`'s history.
- [x] Updated ISSUE_PRIORITIES.md to reflect current GitHub state (script run, diff reviewed —
      picked up the #374 close, the new #392 security issue, and the 13 new CLI-style-guide
      tracking issues #379–#391 that weren't in the file yet)
- [x] No local issue-tracking files found outside ISSUE_PRIORITIES.md — nothing to migrate

## Database Maintenance
- [ ] Skipped — no Pi/container access from this local session's worktree; backup script's
      `POSTGRES_DB` default (`meal_planner`) verified correct by inspection
      (`scripts/backup-database.sh`)

## Security Updates
- [x] **Credential scan** — `git log --since="7 days ago" -p` over commits from this week,
      grepped for AWS keys / private key headers / `SECRET|TOKEN|PASSWORD|API_KEY` literal
      assignments. Zero hits.
- [x] **Secret rotation status** — `docs/SECRET_ROTATION_STATUS.json` shows all 5 secrets
      last rotated 2026-08-19T23:05:19Z (matches the `c2f9a04 chore: rotate secrets` commit),
      all `dueBy` 2026-11-17 — nothing overdue, Pi-side cron confirmed running.
- [x] **`pnpm audit`** (backend + frontend):
  - Backend: was 1 high / 1 moderate remaining as of #365 (2026-08-05) → this run found 3 new
    findings (nanoid high, dompurify moderate, deepmerge-ts high — the latter genuinely new,
    via `prisma@7.9.1`'s `@prisma/config`). `pnpm audit --fix update` (non-breaking, no
    `--force`) fixed nanoid and dompurify, leaving **2 high / 1 moderate**: `ws` (unchanged,
    tracked in #365) and `deepmerge-ts` (new, not auto-fixable — filed **#392**).
  - Frontend: was 2 high / 1 moderate remaining as of #365 → nanoid (high, dev-only) was new
    this week and got fixed. Leaves **2 high / 1 moderate** (`ws`, `react-router` — both
    unchanged from last week, still blocked on upstream/major-version work).
  - Verified `tsc`/`vite build` and lint both still pass clean (0 errors) on both sides after
    the fix.
  - Updated **#365** with this week's before/after instead of filing a duplicate — it's still
    accurately describing the `ws`/`react-router` follow-ups.
  - Filed **#392** for the new `deepmerge-ts` finding.

## Code Quality
- [x] Backend: `tsc` clean, `eslint` clean (0 errors, 260 warnings — all pre-existing
      `@typescript-eslint/no-explicit-any`)
- [x] Frontend: `tsc -b && vite build` clean, `eslint` clean (0 errors, 8 warnings — all
      pre-existing `react-hooks/exhaustive-deps` / one unused-disable-directive)
- [x] `grep -r "TODO\|FIXME" backend/src frontend/src` — **zero results**, source is clean
- Frontend build note: `mui-core` chunk is 503.38 kB (gzip 152.42 kB), just over Vite's
  500 kB warning threshold — pre-existing, unchanged from the 2026-08-05 report.

## New Issues Filed
- #392 — P1-high / security — `deepmerge-ts` stack exhaustion via `prisma@7.9.1`'s
  `@prisma/config`, not auto-fixable (transitive, needs upstream prisma bump)

## Issues Closed
- #374 — feedback/error-log triage automation, implementation verified working on the Pi

## Notes
- Worktree hygiene: `git worktree list` shows five other worktrees besides this run's own
  (`cli-script-style` and `script-design-issues`, both locked; `issue-371-372-364`,
  `issues-364-365`, and a nested `issue-369-ingredient-race`). All correspond to issues
  (#364/#365/#369/#371/#372) that are now closed or already dropped from ISSUE_PRIORITIES.md
  per commit #377 — likely stale, but left untouched here per policy (don't remove worktrees
  without confirming no live session owns them); the weekly Windows Scheduled Task
  (`scripts/prune-worktrees.sh --apply`) already covers safe-only pruning on its own schedule.
- Recommend prioritizing: (1) reconnecting the GitHub App so the cloud routine resumes running
  unattended — this is now three consecutive reports flagging the same disabled state,
  (2) #392's deepmerge-ts fix once prisma releases a bump, (3) #365's socket.io/ws and
  react-router-dom follow-ups whenever there's a natural window for a dependency-bump PR.
