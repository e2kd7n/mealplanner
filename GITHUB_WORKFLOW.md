# GitHub Issues Workflow

**Effective Date:** 2026-03-22

## Overview

All project issues, bugs, and feature requests are now tracked exclusively in GitHub Issues. The old ISSUES.md file has been deprecated.

## Core Principles

1. **Every problem gets an issue** - If it's not solved immediately, create a GitHub issue
2. **Reference commits when closing** - Always add the commit SHA when closing an issue
3. **Use ISSUE_PRIORITIES.md** - Maintain priority classifications in this file
4. **Link related issues** - Use "Related to #N" or "Depends on #N" in issue descriptions

## Creating Issues

### When to Create an Issue

Create a GitHub issue for:
- ✅ Bugs discovered during development or testing
- ✅ Feature requests
- ✅ Technical debt items
- ✅ Performance improvements
- ✅ Documentation needs
- ✅ Architecture decisions to evaluate
- ✅ Any TODO that can't be completed immediately

### Issue Template

```markdown
## Description
[Clear description of the problem or feature]

## Current Behavior
[What happens now]

## Expected Behavior
[What should happen]

## Steps to Reproduce (for bugs)
1. Step one
2. Step two
3. Step three

## Technical Details
- Affected files: [list files]
- Related issues: #N, #M
- Priority: [P0/P1/P2/P3/P4]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Using the CLI

```bash
# Create a new issue
gh issue create --title "Issue title" --body "Issue description"

# Create with editor
gh issue create

# List open issues
gh issue list

# View specific issue
gh issue view 123
```

## Working on Issues

### Starting Work

1. Assign the issue to yourself:
   ```bash
   gh issue edit 123 --add-assignee @me
   ```

2. Add "in-progress" label (if available):
   ```bash
   gh issue edit 123 --add-label "in-progress"
   ```

3. Create a branch (optional but recommended):
   ```bash
   git checkout -b fix/issue-123-short-description
   ```

### During Development

- Reference the issue in commit messages:
  ```bash
  git commit -m "Work on #123: Add validation logic"
  ```

- Add comments to the issue with progress updates:
  ```bash
  gh issue comment 123 --body "Implemented validation, working on tests"
  ```

## Closing Issues

### When Work is Complete

1. **Commit with closing keyword:**
   ```bash
   git commit -m "Fixes #123: Implement user validation

   - Added Zod schema validation
   - Added unit tests
   - Updated documentation"
   ```

   Closing keywords: `Fixes`, `Closes`, `Resolves`, `Fix`, `Close`, `Resolve`

2. **Push and create PR (if using PRs):**
   ```bash
   git push origin fix/issue-123-short-description
   gh pr create --title "Fix #123: Implement user validation"
   ```

3. **Add commit reference to issue:**
   ```bash
   gh issue comment 123 --body "Fixed in commit abc1234

   Changes:
   - Added validation logic
   - Added tests
   - Updated docs

   Verified working in local testing."
   ```

4. **Close the issue (if not auto-closed by PR):**
   ```bash
   gh issue close 123 --reason completed
   ```

### Closing Without Fix

If closing an issue without implementing (won't fix, duplicate, etc.):

```bash
# Mark as not planned
gh issue close 123 --reason "not planned" --comment "Closing because [reason]"

# Mark as duplicate
gh issue close 123 --reason "not planned" --comment "Duplicate of #456"
```

## Priority Management

### Update ISSUE_PRIORITIES.md

When priorities change:

1. Edit `ISSUE_PRIORITIES.md`
2. Move issues between priority sections
3. Commit the change:
   ```bash
   git add ISSUE_PRIORITIES.md
   git commit -m "Update priorities: Move #123 to P1"
   git push
   ```

### Priority Levels

- **P0 - CRITICAL**: Drop everything, fix immediately
- **P1 - HIGH**: Current sprint (1-2 weeks)
- **P2 - MEDIUM**: Next sprint (2-4 weeks)
- **P3 - LOW**: Backlog, when time permits
- **P4 - FUTURE**: Future releases, enhancements

## Labels (to be created in GitHub)

Recommended labels:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `high-priority` - P1 issues
- `in-progress` - Currently being worked on
- `backend` - Backend/API related
- `frontend` - Frontend/UI related
- `database` - Database related
- `security` - Security related
- `performance` - Performance optimization
- `ux` - User experience improvement

## Sprint Planning

### Weekly Review

1. Review open issues:
   ```bash
   gh issue list --label "high-priority"
   ```

2. Update ISSUE_PRIORITIES.md based on:
   - User feedback
   - Business needs
   - Technical dependencies
   - Resource availability

3. Assign issues for the sprint:
   ```bash
   gh issue edit 123 --add-assignee @me
   ```

### Sprint Retrospective

1. Review closed issues:
   ```bash
   gh issue list --state closed --limit 20
   ```

2. Verify all closed issues have:
   - Commit references
   - Resolution comments
   - Proper closing reason

## Best Practices

### DO ✅

- Create issues early and often
- Write clear, actionable descriptions
- Reference related issues
- Add commit SHAs when closing
- Update priorities regularly
- Use labels consistently
- Comment with progress updates

### DON'T ❌

- Don't use ISSUES.md anymore (deprecated)
- Don't close issues without commit references
- Don't leave issues unassigned during work
- Don't forget to update ISSUE_PRIORITIES.md
- Don't create duplicate issues (search first)

## Quick Reference

```bash
# Create issue
gh issue create

# List issues
gh issue list
gh issue list --label "bug"
gh issue list --assignee @me

# View issue
gh issue view 123

# Edit issue
gh issue edit 123 --add-label "bug"
gh issue edit 123 --add-assignee @me

# Comment on issue
gh issue comment 123 --body "Progress update"

# Close issue
gh issue close 123 --reason completed
gh issue close 123 --reason "not planned"

# Reopen issue
gh issue reopen 123
```

## Migration Notes

- **ISSUES.md** - Deprecated, added to .gitignore
- **ISSUE_STATUS_SUMMARY.md** - Deprecated, added to .gitignore
- **USER_TESTING_ISSUES_LOG.md** - Keep for historical reference, but new issues go to GitHub
- **ISSUE_PRIORITIES.md** - New file for priority management
- **GITHUB_ISSUES_SUMMARY.md** - One-time migration summary
- **GITHUB_WORKFLOW.md** - This file, workflow documentation