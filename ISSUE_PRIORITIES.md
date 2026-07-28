# Issue Prioritization

**Last Updated:** 2026-07-28 23:45:00 UTC

This file reflects the current state of GitHub issues organized by milestone and priority within each milestone.

**Priority is within a milestone** — P0/P1 issues in the active milestone take precedence over all issues in future milestones.

## No Active Milestone

Public Launch (due 2026-06-30) closed with all 56 issues resolved. Nothing has been assigned to
a new milestone yet — all open issues below are unassigned. The items surfaced by this week's
maintenance run (logs + CI audit) are the most urgent work regardless of milestone.

### 🔴 P0 - CRITICAL
- #281 - All 4 ClusterHAT Zero W backend nodes crash-looping (~76k restarts) — Prisma engine built for wrong architecture

### 🔴 P1 - HIGH
- #286 - nginx resolver still hardcoded to Docker's 127.0.0.11 instead of Podman's 10.89.1.1 — breaks the Pi 4B fallback #281 currently depends on entirely
- #282 - fix: backend/prisma/seed.ts still imports removed 'bcrypt' package, breaks e2e-tests DB seeding

### 🟡 P2 - MEDIUM
- #285 - security: weekly audit 2026-07-28 — pnpm audit found 27 backend + 6 frontend vulns
- #283 - ci: Dependabot PRs touching backend/ fail pnpm install with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
- #284 - dx: fresh 'npm install && npm run build' fails on backend — Prisma Client never gets regenerated
- #210 - security: replace csurf with modern CSRF middleware *(reopened — was falsely auto-closed 2026-05-26, never actually fixed)*
- #116 - [P2][UX] Add Cost Tracking for Budget-Conscious Users *(97d stale)*

### 🟢 P3 - LOW
- #200 - Pi: move Postgres data volume to USB SSD *(73d stale)*
- #170 - ✨ Add photo capture and PDF upload for recipe creation
- #84 - [P3][Feature] Add recipe document upload (PDF, images, DOCX) *(related to #170)*
- #14 - Implement Nutrition Guideline Warnings *(97d stale)*
- #13 - Implement Nutrition Dashboard *(97d stale)*
- #12 - Integrate Nutrition Database for Auto-Population *(97d stale)*
- #9 - MyFitnessPal Integration *(97d stale)*
- #8 - Grocery List Optimization

### 📋 P4 - FUTURE
- #66 - Publish Meals to ICS Calendar feed *(100d stale)*
- #64 - Implement Advanced Features (Nutrition Tracking, etc.)
- #63 - Evaluate Scaling Strategy
- #20 - Implement Pantry Integration with Grocery Lists
- #19 - Implement Grocery List Regeneration and Sync Detection

### ⚠️ Needs a priority label
- #261 - perf(e2e): use Playwright storageState to avoid per-test UI login in FTUE suite *(no priority/type labels — triage needed)*

## 🔀 Open PRs (all stalled on CI, see #283/#282/#284 above for root causes)
- #269 - chore(deps): MUI 7 → 9.1.2 *(open since 2026-07-02)*
- #268 - chore(deps): Prisma 6 → 7.8.0 *(open since 2026-07-02)*
- #267 - chore(deps): Express 4 → 5.2.1 *(open since 2026-07-02)*
- #266 - chore(deps): TypeScript 5 → 6.0.3 *(open since 2026-07-02)*
- #279 - chore(deps-dev): bump backend dev-deps group (8 updates) *(dependabot, open since 2026-07-27)*
- #278 - chore(deps-dev): bump frontend dev-deps group (10 updates) *(dependabot, open since 2026-07-27)*
- #277 - chore(deps): bump frontend prod-deps group (7 updates) *(dependabot, open since 2026-07-27)*
- #276 - chore(deps): bump backend prod-deps group (3 updates) *(dependabot, open since 2026-07-20)*

All 8 show at least one red CI check. Root causes are now understood (#282 breaks `e2e-tests`
for everything; #283 breaks install for Dependabot's own backend PRs specifically) — these
should largely go green once #282 lands, and the #266/#267/#268/#269 branches likely just need
a rebase onto main afterward.

## 📊 Weekly Maintenance Summary — 2026-07-28

### Closed since last update
- #252, #251, #246, #231, #230, #209 (closed 2026-07-01/07-02, before this run — carried over from last report's untracked gap)
- #253 (superseded by #285 — was based on an incomplete npm-audit picture, see below)

### New issues filed
- #281 - **P0** — All 4 Zero W nodes crash-looping since ~2026-07-01 on a Prisma binary-target mismatch; cluster has been silently down the whole time, all traffic falling back to the Pi 4B alone (confirmed live via SSH + journalctl)
- #286 - **P1** — nginx resolver still hardcoded to Docker's 127.0.0.11 instead of Podman's 10.89.1.1; the fix exists on an orphaned local branch but never reached main — matters a lot right now since #281 means the Pi 4B fallback path this bug affects is the *only* path currently serving traffic
- #282 - **P1** — `seed.ts` still imports removed `bcrypt`, breaking `e2e-tests` DB seed step on every CI run since 2026-07-01
- #283 - **P2** — Dependabot PRs touching `backend/` fail `pnpm install --frozen-lockfile` (lockfile `overrides` drift specific to Dependabot's own regeneration)
- #284 - **P2** — Documented `npm install && npm run build` workflow is broken on a fresh clone (npm blocks Prisma's postinstall; pnpm doesn't, which is why CI never caught it)
- #285 - **P2** — Corrected security audit: `pnpm audit` (the real, deployed lockfile) found far more than `npm audit` had been reporting; fixed the great majority automatically this run
- #210 reopened — falsely auto-closed 2026-05-26, csurf was never actually replaced

### Build status
- **Frontend:** ✅ builds and lints cleanly (0 errors, matches CI's `pnpm run lint`)
- **Backend:** ✅ `pnpm exec tsc --noEmit` and `pnpm run lint` clean (0 errors, 261 warnings, all `no-explicit-any`) — **but only via `pnpm`, matching CI**; plain `npm install && npm run build` is currently broken, see #284

### Security (via `pnpm audit`, the lockfile CI/deployment actually use — see #285)
- Backend: 27 → 4 vulnerabilities after `pnpm audit --fix=update` (1 high, 2 moderate, 1 low remain: `ws`, `qs`, `cookie`/csurf)
- Frontend: 6 → 3 vulnerabilities after `pnpm audit --fix=update` (1 high, 1 moderate, 1 low remain: `ws`, `react-router`)
- Remaining items need breaking-change review (`socket.io` major bump for `ws`; `react-router-dom` downgrade or forward-fix for the CSRF bypass) — not auto-applied

### Infrastructure (via live SSH to the Pi, new this week)
- Pi 4B containers (postgres, redis, backend, nginx): all healthy, clean logs, no errors in 7 days
- **Zero W cluster: all 4 nodes down** — see #281
- nginx access log: 0 requests recorded in its full 4-day container uptime (only health-check traffic reaches the Pi 4B backend directly) — worth confirming real user traffic is reaching the site at all
- Pi 4B memory: 119Mi free / 902Mi available of 1.8Gi — tight as expected, plus two unrelated containers (`ride-optimizer`, `jewel-coupon-clipper`) sharing the same box

---

## Priority System (Milestone-Aware)

**Key Principle:** Priority is within a milestone. A P1 issue in the active milestone takes precedence over a P0 issue in a future milestone.

### Work Order

1. **Active Milestone P0** — Drop everything
2. **Active Milestone P1** — Current sprint focus
3. **Active Milestone P2** — Next sprint planning
4. **Active Milestone P3** — Backlog for this milestone
5. **Future Milestone P0+** — Long-term planning

### P0 - CRITICAL
- Application is down or unusable
- Data loss or corruption
- Security vulnerabilities
- **Action:** Drop everything and fix immediately

### P1 - HIGH
- Core features broken or severely degraded
- Significant user pain points
- Blocks important workflows
- **Action:** Fix in current sprint (1-2 weeks)

### P2 - MEDIUM
- Feature improvements
- Moderate user pain points
- Quality of life enhancements
- **Action:** Plan for next sprint (2-4 weeks)

### P3 - LOW
- Minor UX improvements
- Edge cases
- Nice-to-have features
- **Action:** Backlog, address when time permits

### P4 - FUTURE
- New features
- Major enhancements
- Long-term improvements
- **Action:** Plan for future milestones

## How to Update Priorities

1. Assign issue to a milestone:  `gh issue edit <N> --milestone "Public Launch"`
2. Set priority label:           `gh issue edit <N> --add-label P1-high`
3. Regenerate this file:         `./scripts/update-issue-priorities.sh`
4. Commit:                       `git add ISSUE_PRIORITIES.md && git commit -m "chore: update issue priorities"`

## Managing Workspace TODOs

- Review code comments regularly and convert important ones to GitHub issues
- Use `TODO:` for tasks that should become issues
- Use `FIXME:` for bugs that need attention
- Use `HACK:` for temporary solutions that need proper fixes
- Use `NOTE:` for important information or context
