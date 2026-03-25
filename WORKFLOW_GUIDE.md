# Meal Planner Workflow Guide

**Last Updated:** 2026-03-23

This is the **single source of truth** for development workflows, processes, and guidelines for the Meal Planner application. All team members should follow these guidelines.

---

## 📚 Table of Contents

1. [Development Principles](#development-principles)
2. [Issue Management](#issue-management)
3. [Development Workflow](#development-workflow)
4. [Testing & Quality](#testing--quality)
5. [Weekly Maintenance](#weekly-maintenance)
6. [Quick Reference](#quick-reference)

---

## 🎯 Development Principles

### Core Values

1. **Simplicity First** - Make every change as simple as possible. Impact minimal code.
2. **No Laziness** - Find root causes. No temporary fixes. Senior developer standards.
3. **Minimal Impact** - Changes should only touch what's necessary. Avoid introducing bugs.
4. **Test Everything** - Verify functionality before marking complete.

### Workflow Orchestration

#### 1. Plan Before Implementation
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
- Plans should be broken into sprintly phases of work

#### 2. Task Management Strategy
- Use subagents/new tasks liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to separate task instances
- For complex problems, throw more compute at it via parallel tasks
- One focused objective per task for clear execution

#### 3. Continuous Improvement
- After ANY correction from the user: document the pattern and lesson learned
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project context

#### 4. Verification Before Completion
- Never mark a task complete without testing to prove that it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

#### 5. Code Quality Standards
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

#### 6. Autonomous Problem Solving
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## 🎫 Issue Management

### GitHub Issues Workflow

**All project issues, bugs, and feature requests are tracked exclusively in GitHub Issues.**

#### When to Create an Issue

Create a GitHub issue for:
- ✅ Bugs discovered during development or testing
- ✅ Feature requests
- ✅ Technical debt items
- ✅ Performance improvements
- ✅ Documentation needs
- ✅ Architecture decisions to evaluate
- ✅ Any TODO that can't be completed immediately

#### Issue Template

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

#### Priority Levels

- **P0 - CRITICAL**: Drop everything, fix immediately (app down, data loss, security)
- **P1 - HIGH**: Current sprint (1-2 weeks) - core features broken
- **P2 - MEDIUM**: Next sprint (2-4 weeks) - important improvements
- **P3 - LOW**: Backlog - nice-to-have features
- **P4 - FUTURE**: Future releases - major enhancements

#### Working on Issues

**Starting Work:**
```bash
# Assign to yourself
gh issue edit 123 --add-assignee @me

# Add in-progress label
gh issue edit 123 --add-label "in-progress"

# Create branch (optional)
git checkout -b fix/issue-123-short-description
```

**During Development:**
```bash
# Reference in commits
git commit -m "Work on #123: Add validation logic"

# Add progress updates
gh issue comment 123 --body "Implemented validation, working on tests"
```

**Closing Issues:**
```bash
# Commit with closing keyword
git commit -m "Fixes #123: Implement user validation

- Added Zod schema validation
- Added unit tests
- Updated documentation"

# Close manually if needed
gh issue close 123 --reason completed --comment "Fixed in commit abc1234"
```

#### Priority Management

Update `ISSUE_PRIORITIES.md` when priorities change:
1. Edit the file to move issues between priority sections
2. Update issue labels in GitHub to match
3. Commit changes with descriptive message
4. Communicate priority changes to team

---

## 💻 Development Workflow

### Environment Setup

#### Test Accounts (ALWAYS USE FOR DEVELOPMENT)

**Test User (Regular):**
- Email: `test@example.com`
- Password: `TestPass123!`
- User ID: `test-user-00-0000-0000-000000000001`

**Test Admin:**
- Email: `testadmin@example.com`
- Password: `AdminPass123!`
- User ID: `test-admin-0-0000-0000-000000000002`

#### Deployment Configuration

**Current Deployment Mode: Single-Family**

The application is currently configured for single-family deployment where all users share access to all recipes. This is optimal for a family using the app together.

**Key Behaviors:**
- All recipes are visible to all users in the system
- Any family member can view any recipe
- Only the recipe creator can edit or delete their recipes
- No public/private recipe distinction

**Multi-Tenant Considerations:**

If deploying for multiple families or organizations, see **[MULTITENANT_CONSIDERATIONS.md](./MULTITENANT_CONSIDERATIONS.md)** for:
- Features to re-enable for data isolation
- Recipe privacy and access control
- Migration path from single-family to multi-tenant
- All code locations marked with `// MULTITENANT:` comments

**Search for Multi-Tenant Code:**
```bash
# Find all locations that need changes for multi-tenant
grep -r "MULTITENANT" backend/src/
grep -r "MULTITENANT" backend/prisma/
```

#### Database Architecture

**Single Database for Dev & Production:**
- Container: `meals-postgres`
- Port: `localhost:5432`
- Database: `meal_planner`

**Data Separation:**
- Test/Dev users: IDs start with `test-`
- Production users: Standard UUIDs

### Production Data Protection

**⚠️ CRITICAL: NEVER modify production user data in development**

```typescript
// ❌ WRONG - Don't use production user
const productionUserId = 'c70eaeea-20eb-40ac-8ee8-1a7fd947dc57';

// ✅ CORRECT - Use test user
const testUserId = 'test-user-00-0000-0000-000000000001';

// Implement guards
function isProductionUser(userId: string): boolean {
  return userId === 'c70eaeea-20eb-40ac-8ee8-1a7fd947dc57';
}

function isTestUser(userId: string): boolean {
  return userId.startsWith('test-');
}

// Use in code
if (isProductionUser(userId)) {
  throw new Error('Cannot modify production user data in development');
}
```

### Browser Preferences

**Always use Chrome for project URLs:**
```bash
# ✅ CORRECT - Use Chrome for project links
open -a "Google Chrome" http://localhost:8080
open -a "Google Chrome" http://localhost:3000

# ❌ WRONG - Don't use system default
open http://localhost:8080
```

**Use system default for Bob authentication:**
```bash
# ✅ CORRECT - Use system default for Bob auth
open https://bob.build/login
```

### Code Review Checklist

Before committing code, verify:
- [ ] No hardcoded production user IDs
- [ ] No test data creation for production users
- [ ] All test code uses test user accounts
- [ ] No modifications to e2kd7n's user data
- [ ] Test data is properly isolated
- [ ] Database queries filter by user ID correctly
- [ ] TypeScript compiles without errors
- [ ] No console errors or warnings
- [ ] Tests pass (if applicable)

---

## 🧪 Testing & Quality

### Testing Best Practices

#### 1. Isolation
Each test should:
- Use test user accounts
- Clean up after itself
- Not affect other tests
- Not modify production data

#### 2. Idempotency
Test data scripts should be idempotent:
- Use `ON CONFLICT DO NOTHING`
- Check for existing data
- Safe to run multiple times

#### 3. Documentation
Document any test data you create:
- Purpose of the data
- How to clean it up
- Dependencies

### Resetting Test Data

```bash
# Clear all test data
psql -U mealplanner -d meal_planner -c "
  DELETE FROM recipe_ratings WHERE user_id LIKE 'test-%';
  DELETE FROM pantry_inventory WHERE user_id LIKE 'test-%';
  DELETE FROM grocery_list_items WHERE grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id LIKE 'test-%');
  DELETE FROM grocery_lists WHERE user_id LIKE 'test-%';
  DELETE FROM planned_meals WHERE meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id LIKE 'test-%');
  DELETE FROM meal_plans WHERE user_id LIKE 'test-%';
  DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id LIKE 'test-%');
  DELETE FROM recipes WHERE user_id LIKE 'test-%';
  DELETE FROM family_members WHERE user_id LIKE 'test-%';
  DELETE FROM user_preferences WHERE user_id LIKE 'test-%';
  DELETE FROM users WHERE id LIKE 'test-%';
"

# Re-run test data script
psql -U mealplanner -d meal_planner -f database/init/02-test-data.sql
```

---

## 🔧 Weekly Maintenance

### Issue and Repository Hygiene (30 minutes)

**Every week, perform these tasks:**

```bash
# 1. Review all open issues
gh issue list --state open --limit 100

# 2. Close completed issues
gh issue close <number> --comment "Completed: [description]"

# 3. Update in-progress issues
gh issue comment <number> --body "Progress update: [details]"

# 4. Check for stale issues (30+ days no activity)
gh issue list --state open --json number,title,updatedAt

# 5. Update ISSUE_PRIORITIES.md
# Edit file and commit changes
```

**Tasks:**
- [ ] Review all open issues for completion status
- [ ] Close issues that have been completed but not closed
- [ ] Add progress updates to in-progress issues
- [ ] Update issue labels and priorities as needed
- [ ] Check for stale issues (no activity in 30+ days)
- [ ] Archive or close duplicate issues
- [ ] Ensure issue descriptions are still accurate
- [ ] Link related issues together
- [ ] Update ISSUE_PRIORITIES.md

### Other Weekly Tasks

**Database Maintenance (15 min):**
- [ ] Check database size and growth
- [ ] Verify backup completion
- [ ] Review slow query logs

**Security Updates (20 min):**
- [ ] Check for npm security vulnerabilities: `npm audit`
- [ ] Update dependencies with security patches
- [ ] Review access logs for suspicious activity

**Performance Monitoring (15 min):**
- [ ] Review application logs for errors
- [ ] Check API response times
- [ ] Monitor memory usage
- [ ] Review cache hit rates

**Code Quality Review (20 min):**
- [ ] Review recent commits for code quality
- [ ] Check for TODO/FIXME comments
- [ ] Verify TypeScript compilation
- [ ] Run linter and fix issues

**Documentation Updates (15 min):**
- [ ] Update README if features changed
- [ ] Review and update API documentation
- [ ] Check for outdated screenshots
- [ ] Verify setup instructions still work

### Monthly Tasks

- **Comprehensive Security Audit** (1 hour)
- **Performance Optimization** (1 hour)
- **Backup Testing** (30 minutes)
- **User Testing Session** (2 hours)

---

## 📖 Quick Reference

### Common Commands

```bash
# Issues
gh issue create                          # Create new issue
gh issue list                            # List open issues
gh issue view 123                        # View specific issue
gh issue edit 123 --add-assignee @me     # Assign to yourself
gh issue comment 123 --body "Update"     # Add comment
gh issue close 123 --reason completed    # Close issue

# Git
git checkout -b fix/issue-123            # Create branch
git commit -m "Fixes #123: Description"  # Commit with issue ref
git push origin fix/issue-123            # Push branch

# Database
psql -U mealplanner -d meal_planner      # Connect to database
podman-compose up -d postgres            # Start PostgreSQL
./scripts/backup-database.sh             # Create backup

# Development
cd backend && npm run dev                # Start backend
cd frontend && npm run dev               # Start frontend
npm run build                            # Build for production
npm audit                                # Check for vulnerabilities

# Testing
npm test                                 # Run tests
npm run lint                             # Run linter
```

### Test User Credentials

```bash
# Regular User
Email: test@example.com
Password: TestPass123!

# Admin User
Email: testadmin@example.com
Password: AdminPass123!
```

### File Locations

```
Key Documentation:
- WORKFLOW_GUIDE.md (this file)
- ISSUE_PRIORITIES.md
- WEEKLY_MAINTENANCE.md
- README.md

Setup & Deployment:
- SETUP.md
- DEPLOYMENT.md
- SECURITY_SETUP.md
- DATABASE_BACKUP.md

Architecture & Technical:
- docs/ARCHITECTURE.md
- ARCHITECTURE_EVALUATION.md
- MULTITENANT_CONSIDERATIONS.md
- PHASE1_IMPLEMENTATION_SUMMARY.md
- PHASE2_IMPLEMENTATION_SUMMARY.md
- PHASE3_IMPLEMENTATION_SUMMARY.md

Test Data:
- database/init/02-test-data.sql
- database/init/03-additional-recipes.sql
```

---

## 🚨 Emergency Procedures

### Critical Security Issue
1. Immediately patch the vulnerability
2. Review access logs for exploitation
3. Notify users if data was compromised
4. Document incident and response

### Performance Degradation
1. Check resource usage (CPU, memory, disk)
2. Review recent changes
3. Check for slow queries
4. Scale resources if needed

### Data Loss/Corruption
1. Stop application immediately
2. Restore from latest backup
3. Investigate root cause
4. Implement prevention measures

---

## 📋 Golden Rules

1. ✅ **Always use test@example.com for development**
2. ✅ **Never modify e2kd7n's production data**
3. ✅ **Test data IDs start with 'test-'**
4. ✅ **Use guards to prevent production data modification**
5. ✅ **Document any new test data you create**
6. ✅ **Every problem gets a GitHub issue**
7. ✅ **Reference commits when closing issues**
8. ✅ **Update ISSUE_PRIORITIES.md regularly**
9. ✅ **Test everything before marking complete**
10. ✅ **Perform weekly maintenance tasks**

---

## 📚 Related Documentation

For detailed information on specific topics, see:

- **[WEEKLY_MAINTENANCE.md](./WEEKLY_MAINTENANCE.md)** - Detailed maintenance procedures
- **[ISSUE_PRIORITIES.md](./ISSUE_PRIORITIES.md)** - Current issue priorities
- **[SETUP.md](./SETUP.md)** - Development environment setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment procedures
- **[SECURITY_SETUP.md](./SECURITY_SETUP.md)** - Security configuration
- **[MULTITENANT_CONSIDERATIONS.md](./MULTITENANT_CONSIDERATIONS.md)** - Multi-tenant deployment guide
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[DATABASE_BACKUP.md](./DATABASE_BACKUP.md)** - Backup procedures

---

**This guide consolidates:**
- DEVELOPMENT_GUIDELINES.md
- GITHUB_WORKFLOW.md
- ISSUE_PRIORITIES.md (referenced, not replaced)
- WEEKLY_MAINTENANCE.md (referenced, not replaced)

**Last Updated:** 2026-03-23  
**Maintained By:** Development Team