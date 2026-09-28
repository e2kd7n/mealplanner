# Issue Prioritization

**Last Updated:** 2026-09-28 (weekly maintenance — manual edit against live GitHub state; `update-issue-priorities.sh` requires `gh` CLI not available in cloud environment)

This file reflects the current state of GitHub issues organized by milestone and priority within each milestone.

**Priority is within a milestone** — P0/P1 issues in the active milestone take precedence over all issues in future milestones.

## 🎯 Active Milestone — None

No active milestone is currently set. Issues below are either unassigned or carry over from the closed August 2026 milestone.

---

## ⚠️ Issues Without Milestone Assignment

These issues need to be assigned to a milestone and prioritized.

### 🔴 P1 - HIGH
- #417 - security: backend HIGH vulns in deepmerge-ts + mysql2 (transitive via prisma) require breaking prisma upgrade (**requires Prisma major version upgrade — non-breaking fix not available**)
- #406 - Grocery list generation likely 404s: frontend/backend route mismatch (**P1 candidate — unaddressed for 31 days, fix is straightforward**)

### 🟡 P2 - MEDIUM
- #116 - [P2][UX] Add Cost Tracking for Budget-Conscious Users

### 🟢 P3 - LOW
- #307 - accessibility: missing aria-labels on icon-only buttons in CreateRecipe and Profile (one destructive)
- #261 - perf(e2e): use Playwright storageState to avoid per-test UI login in FTUE suite
- #200 - Pi: move Postgres data volume to USB SSD
- #84 - [P3][Feature] Add recipe document upload (PDF, images, DOCX)
- #170 - ✨ Add photo capture and PDF upload for recipe creation
- #14 - Implement Nutrition Guideline Warnings
- #13 - Implement Nutrition Dashboard
- #12 - Integrate Nutrition Database for Auto-Population
- #9 - MyFitnessPal Integration
- #8 - Grocery List Optimization

### 📋 P4 - FUTURE
- #66 - Publish Meals to ICS Calendar feed
- #64 - Implement Advanced Features (Nutrition Tracking, etc.)
- #63 - Evaluate Scaling Strategy
- #20 - Implement Pantry Integration with Grocery Lists
- #19 - Implement Grocery List Regeneration and Sync Detection

### ⚠️ Unprioritized (need P-label)
- #416 - Verify maintenance-script logs actually get pruned automatically (needs investigation + automation)

## 📝 Workspace TODOs & Tasks
Code comments and inline tasks found in the workspace that may need attention.

**No TODO/FIXME/HACK comments found in code** ✅

---

## Recently Closed (for reference)
- #419 - security: multer HIGH vulns ≤2.2.0 — resolved by multer 2.4.0 upgrade (closed 2026-09-21)
- #399 - security: ws vulns via socket.io-adapter — resolved by ws override in 57231f5 (closed 2026-09-21)
- #418 - clusterctrl not on PATH over non-interactive SSH (closed 2026-09-13)
- #407 - createGroceryList name field bug (closed 2026-09-14)
- #408 - POST /grocery-lists Zod schema never wired in (closed 2026-09-14)
- #409 - MobileGroceryList.tsx orphaned (closed 2026-09-14)

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

1. Assign issue to a milestone:  `gh issue edit <N> --milestone "August 2026"`
2. Set priority label:           `gh issue edit <N> --add-label P1-high`
3. Regenerate this file:         `./scripts/update-issue-priorities.sh`
4. Commit:                       `git add ISSUE_PRIORITIES.md && git commit -m "chore: update issue priorities"`

**Note (2026-09-28):** Updated by the weekly maintenance cloud routine against a live GitHub MCP snapshot. The `update-issue-priorities.sh` script requires `gh` CLI which is not available in the cloud maintenance environment. Changes this pass: removed closed #399/#407/#408/#409, added #417 (mysql2 HIGH via prisma), moved #406 up to P1 section, updated last-updated date.

## Managing Workspace TODOs

- Review code comments regularly and convert important ones to GitHub issues
- Use `TODO:` for tasks that should become issues
- Use `FIXME:` for bugs that need attention
- Use `HACK:` for temporary solutions that need proper fixes
- Use `NOTE:` for important information or context
