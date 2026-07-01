# Issue Prioritization

**Last Updated:** 2026-06-29 04:30:00 UTC

This file reflects the current state of GitHub issues organized by milestone and priority within each milestone.

**Priority is within a milestone** — P0/P1 issues in the active milestone take precedence over all issues in future milestones.

## 🎯 Public Launch (due 2026-06-30)

### 🔴 P0 - CRITICAL
- #246 - fix(ftue): MemberWelcome tour has no swipe/gesture support on mobile
- #231 - FTUE design review — Tracy walkthrough (15 issues)

### 🔴 P1 - HIGH
- #251 - FTUE cleanup: remaining work after initial deploy
- #252 - fix: backend TypeScript build fails with ~109 type errors

### 🟡 P2 - MEDIUM
- #253 - security: weekly audit 2026-06-29 — 14 high vulns fixed, 3 low remain

### 🟢 P3 - LOW
- #230 - chore: plan major dependency upgrades (MUI 9, Prisma 7, Express 5, TS 6)
- #209 - fix(monitoring): repair Glances service and add ClusterHAT cluster-wide monitoring
- #170 - ✨ Add photo capture and PDF upload for recipe creation
- #8 - Grocery List Optimization

### 📋 P4 - FUTURE
- #63 - Evaluate Scaling Strategy
- #20 - Implement Pantry Integration with Grocery Lists
- #19 - Implement Grocery List Regeneration and Sync Detection

---

## ⚠️ Issues Without Milestone Assignment

These issues need to be assigned to a milestone and prioritized.

### 🟡 P2 - MEDIUM
- #116 - [P2][UX] Add Cost Tracking for Budget-Conscious Users *(67d stale)*

### 🟢 P3 - LOW
- #200 - Pi: move Postgres data volume to USB SSD *(43d stale)*
- #84 - [P3][Feature] Add recipe document upload (PDF, images, DOCX) *(related to #170)*
- #14 - Implement Nutrition Guideline Warnings *(67d stale)*
- #13 - Implement Nutrition Dashboard *(67d stale)*
- #12 - Integrate Nutrition Database for Auto-Population *(67d stale)*
- #9 - MyFitnessPal Integration *(67d stale)*

### 📋 P4 - FUTURE
- #66 - Publish Meals to ICS Calendar feed *(70d stale)*
- #64 - Implement Advanced Features (Nutrition Tracking, etc.) *(97d stale)*

## 📊 Weekly Maintenance Summary — 2026-06-29

### Closed since last update
- #248, #247, #245, #244, #243, #242, #241, #240, #239, #238, #237, #236, #235, #234, #232 (FTUE overhaul batch)
- #218 (ntfy.sh push notifications)
- #213 (@types/node upgrade)
- #212 (ESLint v10 upgrade)
- #211 (Pi PSU upgrade)
- #210 (replace csurf)
- #142, #83, #45, #43, #42, #41, #171, #18 (removed from priorities — were stale/closed)

### New issues filed
- #252 - Backend TS build fails (~109 errors, pre-existing on main)
- #253 - Security audit writeup (14 high vulns fixed, 3 low remain)

### Build status
- **Frontend:** ✅ builds and lints cleanly (7 warnings)
- **Backend:** ❌ tsc fails (~109 errors); lint has 1 error + 132 warnings

### Security
- Backend: 2 low (cookie/csurf — needs csurf replacement)
- Frontend: 1 low (esbuild — dev-only, needs breaking change)

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
