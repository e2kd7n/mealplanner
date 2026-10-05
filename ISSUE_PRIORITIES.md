# Issue Prioritization

**Last Updated:** 2026-10-05 04:22:45 UTC / 2026-10-04 23:22:45 CDT

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
**No issues** ✅

### 📋 P4 - FUTURE
**No issues** ✅

---

## ⚠️ Issues Without Milestone Assignment

These issues need to be assigned to a milestone and prioritized.

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
