# Issue Prioritization

**Last Updated:** 2026-08-20 02:54:14 UTC / 2026-08-20 02:54:14 GMT

This file reflects the current state of GitHub issues organized by milestone and priority within each milestone.

**Priority is within a milestone** — P0/P1 issues in the active milestone take precedence over all issues in future milestones.

## 🎯 August 2026 (due 2026-08-30)

### 🔴 P0 - CRITICAL
**No issues** ✅

### 🔴 P1 - HIGH
**No issues** ✅

### 🟡 P2 - MEDIUM
**No issues** ✅

### 🟢 P3 - LOW
- #307 - accessibility: missing aria-labels on icon-only buttons in CreateRecipe and Profile (one destructive)
- #305 - ux: native alert()/window.confirm() used instead of the app's Alert/Snackbar/Dialog system
- #200 - Pi: move Postgres data volume to USB SSD

### 📋 P4 - FUTURE
- #357 - design: ad-hoc/custom grocery item entry — needs UX design before implementation
- #356 - feature: Welcome/FTUE flow should offer to register additional household members
- #355 - ux: clarify that /register is for adding household members, not first-run setup
- #19 - Implement Grocery List Regeneration and Sync Detection

### ⚠️ Unprioritized (need P-label)
- #261 - perf(e2e): use Playwright storageState to avoid per-test UI login in FTUE suite

---

## ⚠️ Issues Without Milestone Assignment

These issues need to be assigned to a milestone and prioritized.

### 🔴 P1 - HIGH
- #392 - security: deepmerge-ts stack exhaustion via prisma@7.9.1 config (backend)
- #365 - security: weekly audit 2026-08-05 — 13 high vulns found, 11 fixed via pnpm audit fix, 3 remain

### 🟡 P2 - MEDIUM
- #116 - [P2][UX] Add Cost Tracking for Budget-Conscious Users

### 🟢 P3 - LOW
- #391 - [Epic] CLI Script Design Language — Bring scripts/ up to the pi-deploy-registry.sh standard
- #389 - scripts: bring one-off dev-hygiene scripts up to the CLI style guide
- #388 - scripts: bring test-runner scripts up to the CLI style guide
- #387 - scripts: bring GitHub-issue-automation and notification scripts up to the CLI style guide
- #386 - scripts: bring local dev workflow scripts up to the CLI style guide
- #385 - scripts: bring secrets/security scripts up to the CLI style guide
- #384 - scripts: bring database backup/restore/migration scripts up to the CLI style guide
- #383 - scripts: bring Pi day-2 ops scripts up to the CLI style guide
- #382 - scripts: bring Pi deploy/build pipeline up to the CLI style guide
- #381 - scripts: bring onboarding/setup scripts up to the CLI style guide
- #380 - scripts: menu.sh doesn't use the section/spinner design language
- #379 - scripts: utilities.sh should respect NO_COLOR and non-TTY output
- #170 - ✨ Add photo capture and PDF upload for recipe creation
- #84 - [P3][Feature] Add recipe document upload (PDF, images, DOCX)
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

## 📝 Workspace TODOs & Tasks
Code comments and inline tasks found in the workspace that may need attention.

**No TODO/FIXME comments found in code** ✅

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
