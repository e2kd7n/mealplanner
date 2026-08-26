# Issue Prioritization

**Last Updated:** 2026-08-26 13:02:32 UTC / 2026-08-26 08:02:32 CDT (manual edit, not via `update-issue-priorities.sh` — built against a live `gh issue list` snapshot; see note in "How to Update Priorities")

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
- #200 - Pi: move Postgres data volume to USB SSD

### 📋 P4 - FUTURE
- #357 - design: ad-hoc/custom grocery item entry — needs UX design before implementation
- #355 - ux: clarify that /register is for adding household members, not first-run setup
- #19 - Implement Grocery List Regeneration and Sync Detection

### ⚠️ Unprioritized (need P-label)
- #261 - perf(e2e): use Playwright storageState to avoid per-test UI login in FTUE suite

---

## ⚠️ Issues Without Milestone Assignment

These issues need to be assigned to a milestone and prioritized.

### 🔴 P1 - HIGH
- #399 - security: 2 remaining ws vulns via socket.io-adapter transitive dep
- #401 - fix(ftue): family members added via Setup wizard default to canCook=false — cook-assignment dropdown empty for every new household
- #402 - fix(ftue): 'Set up API Key' empty-state button links to /profile instead of /admin

> All three P1s above are sitting outside any milestone while August 2026 closes in 4 days with no P0/P1 currently assigned to it — worth deciding whether any belong in this milestone's remaining scope.

### 🟡 P2 - MEDIUM
- #116 - [P2][UX] Add Cost Tracking for Budget-Conscious Users

### 🟢 P3 - LOW
- #84 - [P3][Feature] Add recipe document upload (PDF, images, DOCX)
- #170 - ✨ Add photo capture and PDF upload for recipe creation
- #403 - enhancement(ftue): no bulk/quick-add for family members in Setup wizard
- #404 - test-debt: ftue-audit.spec.ts asserts against a removed OnboardingWizard dashboard dialog
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

**No TODO/FIXME/HACK comments found in code** ✅

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

**Note (2026-08-26):** Built by hand against a live `gh issue list --state open` snapshot instead
of running the script, per this file's standing caution that `update-issue-priorities.sh`
auto-closes issues on a commit-message heuristic that has produced confirmed false-closes
before (see #210 history) — review what it would close before ever running it unattended.
This pass also dropped the entire `#379`-`#391` CLI-script-style-guide block from "Without
Milestone Assignment," which the prior committed version still listed as open — all of it
closed with the epic on 2026-08-20, and the doc had drifted stale since. Added `#399`,
`#401`-`#404` (new since the last update); `#401`/`#402` came out of a simulated FTUE
tester-panel pass across four household sizes (solo, couple, family of 4, family of 5) that
also left a supporting repro comment on `#355`.

## Managing Workspace TODOs

- Review code comments regularly and convert important ones to GitHub issues
- Use `TODO:` for tasks that should become issues
- Use `FIXME:` for bugs that need attention
- Use `HACK:` for temporary solutions that need proper fixes
- Use `NOTE:` for important information or context
