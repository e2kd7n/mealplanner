# Weekly Maintenance — 2026-09-28

**Run by:** Cloud maintenance routine (automated)
**Environment:** Remote cloud container — no live Pi/container access

---

## Issue and Repository Hygiene

- [x] Reviewed all 19 open issues
- [x] No issues identified as newly completed by recent commits
- [x] Stale issues flagged (see below)
- [x] ISSUE_PRIORITIES.md updated (manual MCP snapshot — `update-issue-priorities.sh` requires `gh` CLI unavailable in cloud)

**ISSUE_PRIORITIES.md changes:**
- Removed closed #399 (ws vulns, resolved 2026-09-21), #407, #408, #409 (grocery list bugs, resolved 2026-09-14)
- Added #417 (mysql2 HIGH via prisma) to P1 section
- Promoted #406 (grocery list 404) to P1 section with note it's 31 days old

**Pi-side hygiene log:** No `data/maintenance-logs/issue-hygiene-*.log` present in this clone — Pi cron scripts have not run in this environment (expected).

**Stale issues (30+ days since last update):**
- **#406** (2026-08-28 — 31 days): Grocery list generation likely 404s — P1 bug, easy fix described in issue body, no progress. Stale comment posted.
- **#66** (2026-08-24 — 35 days): Publish Meals to ICS Calendar — P4-future, intentionally deferred.
- **#64** (2026-08-24 — 35 days): Implement Advanced Features — P4-future, intentionally deferred.
- **#14, #13, #12, #9, #8** (2026-08-24 — 35 days): Nutrition/grocery backlog — P3-low, intentionally deferred.

P4-future and P3-low staleness is expected; no comment added to those (they're intentional long-term backlog). Only #406 received a stale comment.

**`update-issue-priorities.sh` skipped:** `gh` CLI not installed in cloud environment. ISSUE_PRIORITIES.md updated via MCP tools instead.

---

## Database Maintenance

- [x] **SKIPPED — no container access.** Cannot run `backup-database.sh` from cloud environment.
- [x] Backup script DB name verified: `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✅

---

## Security Updates

**pnpm audit — backend:**
- 1 HIGH: `mysql2` — Auth Plugin Downgrade leaks plaintext credentials (GHSA-3f6p-5ww8-9rcr, requires mysql2 ≥3.22.0)
- 1 moderate: `mysql2` — Decompression-bomb DoS in compressed protocol (GHSA-rgwj-5xj2-c3m3, requires mysql2 ≥3.23.1)
- Both are transitive via `@prisma/client → prisma → mysql2`; fix requires a breaking Prisma major version upgrade
- Already tracked in **#417** — no new issue needed

**pnpm audit — frontend:** No known vulnerabilities ✅

**npm audit fix:** Not run — no new fixable issues. pnpm audit is authoritative (npm undercounts due to lockfile differences).

**Credential-leak scan (last 7 days of commits):** No matches found ✅

**Secret rotation check (`docs/SECRET_ROTATION_STATUS.json`):**
- Last rotated: 2026-08-19
- All secrets due: **2026-11-17** (~50 days away)
- Status: ✅ No action needed

---

## Code Quality

**Backend build (`npm run build` / `tsc`):** ✅ PASS — 0 errors

**Frontend build (`pnpm run build` / `tsc -b && vite build`):** ✅ PASS — built in 2.57s
- Warning: `react-core` chunk is 817 kB (> 500 kB threshold) — pre-existing, React 19 core bundle; acceptable given Pi RAM constraints drive the aggressive chunking strategy.

**Backend lint (`pnpm run lint`):** ✅ 0 errors, 276 pre-existing `any`-type warnings in `backend/src/utils/secureLogger.ts` — unchanged from last week.

**Frontend lint (`pnpm run lint`):** ✅ 0 errors, 276 warnings (same secureLogger.ts warnings appear due to ESLint traversal; pre-existing behavior).

**TODO/FIXME scan:** No results found ✅

---

## Database Maintenance (Live Checks)

All live checks require container access — **SKIPPED**:
- Database size and growth check
- Slow query log review
- Connection pool usage
- Orphaned record check

---

## Performance Monitoring

**SKIPPED** — no container access for `docker logs`/`podman stats`.

---

## User Feedback Review

**Feedback triage status file:** Not present in this clone — Pi-side `feedback-log-triage.sh` has not run here (expected).

---

## Open Issue Summary (19 open)

| # | Title | Priority | Age |
|---|-------|----------|-----|
| #417 | security: mysql2 HIGH via prisma (needs breaking upgrade) | P1-high | 21d |
| #416 | Verify maintenance-script log pruning is automated | unprioritized | 28d |
| #406 | Grocery list generation likely 404s: route mismatch | P1 candidate | 31d ⚠️ |
| #307 | accessibility: missing aria-labels on icon-only buttons | P3-low | 60d |
| #261 | perf(e2e): use storageState in FTUE suite | unprioritized | 89d |
| #200 | Pi: move Postgres to USB SSD | P3-low | 135d |
| #170 | Add photo capture and PDF upload | P3-low | 155d |
| #116 | Cost Tracking UX | P2-medium | 159d |
| #84 | Recipe document upload | P3-low | 161d |
| #66 | Publish Meals to ICS Calendar | P4-future | 162d |
| #64 | Advanced Features (Nutrition) | P4-future | 189d |
| #63 | Evaluate Scaling Strategy | P4-future | 189d |
| #20 | Pantry Integration with Grocery Lists | P4-future | 190d |
| #19 | Grocery List Regeneration and Sync | P4-future | 190d |
| #14–#8 | Nutrition/grocery feature backlog | P3-low | 190d |

---

## Actions Taken

1. Updated `ISSUE_PRIORITIES.md` — removed closed issues, added #417 to P1, promoted #406 to P1 section
2. Commented on #406 flagging 31-day staleness and easy available fix
3. Committed and pushed this report + ISSUE_PRIORITIES.md

## Items Skipped (cloud environment limitations)

- Database backup (no container access)
- Live database health checks
- Container resource monitoring
- Feedback triage log review (Pi-side only)
- Issue hygiene log review (Pi-side only)
- `update-issue-priorities.sh` (requires `gh` CLI not in cloud env)
- Worktree hygiene (local-machine only)
- Secret rotation execution (Pi-side only)

## Findings Needing Attention

1. **#417 — mysql2 HIGH vuln (P1):** Persists. Fix requires Prisma major version upgrade. Assess whether the upgrade is feasible; this has been open 3 weeks.
2. **#406 — Grocery list 404 (P1 candidate):** Real bug, easy fix. The frontend calls `/grocery-lists/generate` but the backend only has `/from-meal-plan/:mealPlanId`. Fix: change `groceryListAPI.generateFromMealPlan` in `frontend/src/services/api.ts:252-253` to call `POST /grocery-lists/from-meal-plan/${mealPlanId}`. This has been open 31 days.

---

*Generated by cloud maintenance routine — 2026-09-28*
