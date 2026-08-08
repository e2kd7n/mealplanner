# Weekly Maintenance — 2026-08-05

Run manually in a local session — the cloud maintenance routine (`trig_01HqXarujCYtNDwtP4pokNqT`)
is still disabled (`ended_reason: auto_disabled_repo_access`, confirmed via `RemoteTrigger get`
at the start of this run). It needs a human to reconnect the GitHub App at
https://claude.ai/code/onboarding?magic=github-app-setup before it can run unattended again;
the stored routine prompt also still needs the secret-rotation step added back in 2026-08-01.

## Issue and Repository Hygiene
- [x] Reviewed all 25 open issues, cross-checked against `git log --oneline -40`
- [x] Closed **#349** (P0 — Express 5 wildcard-route crash) — verified the fix
      (`/{*splat}` in `backend/src/index.ts:163`) is actually on `main` via `bba3032`/PR #351.
      The PR that fixed it never included a "Fixes #349" keyword, so it sat open despite
      production already being healthy.
- [x] Closed **#301** and **#312** — both fixed by `aafb3b2`/PR #352, but GitHub only
      auto-linked one issue (#303) out of the five listed in that commit's multi-issue
      "Fixes #301, #303, #310, #312, #313" line. #310 and #313 *did* auto-close correctly;
      only #301/#312 needed a manual close. Worth noting for future multi-issue PRs — GitHub's
      closing-keyword parser doesn't reliably catch every issue in a comma-separated list.
- [x] Verified #305 (native `alert()`/`confirm()` usage) is still genuinely open — grepped
      `frontend/src`, all 4 files from the issue body (`BatchCookingDialog.tsx`,
      `GroceryList.tsx`, `MealPlanner.tsx`, `RecipeDetail.tsx`) still use native `alert()`.
- [x] Left a progress comment on **#307** (aria-labels) — it's partially fixed: the
      "Add ingredient" button got its `aria-label` in a recent pass, but the other 5 items
      (remove-ingredient, remove-instruction-step, and all 3 `Profile.tsx` buttons including
      the highest-priority delete-family-member button) are still missing one.
- [x] Verified #308 (keyboard shortcuts undiscoverable) is still open and accurate — the
      hook and its `getKeyboardShortcuts()` helper are still unused by any UI surface.
- [x] Flagged **#116** as stale — no activity since creation (2026-04-22, ~105 days), still
      labeled P2-medium/"should complete for the milestone" with no scoping work visible,
      unlike the nutrition-tracking cluster (#9/#12/#13/#14/#63/#64) which is explicitly
      P3/P4-future. Asked whether it should be reprioritized alongside that cluster.
- [x] `./scripts/update-issue-priorities.sh`'s auto-close heuristic flagged #20 as
      "appears resolved" (fuzzy match on a commit message mentioning "#20 (Pantry,
      deprioritized)") — false positive, left open. #20 already carries an explicit
      2026-08-03 product-decision comment keeping it P4-future/unmilestoned; the script's
      regex just isn't good at telling "closed the loop on a decision" from "actually shipped."
- [x] Updated ISSUE_PRIORITIES.md to reflect current GitHub state (script run, diff reviewed)
- [x] No local issue-tracking files found outside ISSUE_PRIORITIES.md — nothing to migrate

## Database Maintenance
- [ ] Skipped — no Pi/container access from this local session's worktree; backup script's
      `POSTGRES_DB` default (`meal_planner`) verified correct by inspection
      (`scripts/backup-database.sh`)

## Security Updates
- [x] **Credential scan** — `git log --since="7 days ago" -p` over commits from this week,
      grepped for AWS keys / private key headers / `SECRET|TOKEN|PASSWORD|API_KEY` literal
      assignments. Two hits, both false positives: a `PGPASSWORD="$OLD_PG_PASS"` shell
      variable reference in the secret-rotation script, and the long-standing
      `DEFAULT_TEST_PASSWORD` e2e fixture constant. No real leak found.
- [x] **Secret rotation status** — `docs/SECRET_ROTATION_STATUS.json` doesn't exist yet
      (confirmed via `git log --all` — never committed). This is the expected "no baseline"
      case per `docs/WEEKLY_MAINTENANCE.md`, not a sign of a failed rotation. Filed **#364**
      asking a human to run `./scripts/generate-secrets.sh --yes` once on the Pi to establish
      the baseline, plus confirm the `rotate-secrets-if-due.sh` cron entry is actually installed.
- [x] **`pnpm audit`** (backend + frontend — this repo's CI/deploy lockfile, not `npm audit`):
  - Backend: was 5 high / 3 moderate → `pnpm audit --fix update` (non-breaking, no `--force`)
    fixed 6, leaving **1 high / 1 moderate** (`ws`, via `socket.io > socket.io-adapter`,
    blocked on an upstream socket.io bump).
  - Frontend: was 5 high / 5 moderate → fixed 7, leaving **2 high / 1 moderate** (`ws` again,
    plus `react-router` — needs a 7→8 major upgrade of `react-router-dom`, out of scope for
    an automated fix).
  - Verified `tsc`/`vite build` and lint both still pass clean (0 errors) on both sides after
    the fix — only `pnpm-lock.yaml` changed, no `package.json` semver ranges moved.
  - Filed **#365** with the full before/after breakdown and the two follow-up items
    (socket.io's `ws` bump, react-router-dom major upgrade) that need a scoped PR.

## Code Quality
- [x] Backend: `tsc` clean, `eslint` clean (0 errors, 260 warnings — all pre-existing
      `@typescript-eslint/no-explicit-any`)
- [x] Frontend: `tsc -b && vite build` clean, `eslint` clean (0 errors, 8 warnings — all
      pre-existing `react-hooks/exhaustive-deps`, matches PR #363's baseline from three days ago)
- [x] `grep -r "TODO\|FIXME" backend/src frontend/src` — **zero results**, source is clean
- Frontend build note: `mui-core` chunk is 503.38 kB (gzip 152.42 kB), just over Vite's
  500 kB warning threshold — pre-existing, not introduced by this run's `pnpm audit fix`
  (only the lockfile changed). Matches the ongoing Pi bundle-size watch noted in past reports.

## New Issues Filed
- #364 — security — `SECRET_ROTATION_STATUS.json` missing, no rotation baseline established yet
- #365 — P1-high / security — weekly `pnpm audit`: 13 high vulns found, 11 fixed, 3 remain
  (ws x2, react-router x1)

## Issues Closed
- #349 — P0 crash-loop, fix verified live in `main`
- #301 — AppBar title fallback, fixed by #352
- #312 — grocery empty-state full-page-reload, fixed by #352

## Notes
- Worktree hygiene: `git worktree list` shows one other active worktree
  (`design-issues-august`) besides this run's own — left untouched since it may be another
  session's in-progress work; the automated weekly Windows Scheduled Task
  (`docs/project_worktree_hygiene_automation.md`) already covers safe-only pruning separately.
- Recommend prioritizing: (1) reconnecting the GitHub App so the cloud routine resumes running
  unattended, (2) #364's manual secret-rotation baseline on the Pi, (3) #365's socket.io/ws
  and react-router-dom follow-ups whenever there's a natural window for a dependency-bump PR.
