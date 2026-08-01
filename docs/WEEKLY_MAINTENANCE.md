# Weekly Maintenance Tasks

This document outlines regular maintenance tasks to keep the Meal Planner application healthy, secure, and well-organized.

---

## 🗓️ Weekly Tasks

### 1. Issue and Repository Hygiene (30 minutes)

**Purpose:** Keep GitHub issues organized, close completed work, and maintain accurate project status.

**Tasks:**
- [ ] Review all open issues for completion status
- [ ] Close issues that have been completed but not closed
- [ ] Add progress updates to in-progress issues
- [ ] Update issue labels and priorities as needed
- [ ] Check for stale issues (no activity in 30+ days)
- [ ] Archive or close duplicate issues
- [ ] Ensure issue descriptions are still accurate
- [ ] Link related issues together
- [ ] Parse logs to identify P0/P1 issues and log them as github issues
- [ ] Look for security vulnerabilities and log all but critical as github issues
- [ ] Alert user to critical vulnerabilities and offer to fix them immediately, then log fix as github issue once closed and tested
- [ ] **Update ISSUE_PRIORITIES.md** to reflect current GitHub state
- [ ] **Verify all local issue documents are migrated to GitHub**
- [ ] **Remove local issue tracking files** (keep only ISSUE_PRIORITIES.md)
- [ ] Update time tracking report (docs/archive/TIME_TRACKING_REPORT.md)

**Commands:**
```bash
# List all open issues
gh issue list --state open --limit 100

# Check specific issue status
gh issue view <issue-number>

# Close completed issue with comment
gh issue close <issue-number> --comment "Completed: [brief description]"

# Update issue with progress
gh issue comment <issue-number> --body "Progress update: [details]"

# Update ISSUE_PRIORITIES.md from GitHub
./scripts/update-issue-priorities.sh
```

**Documentation to Review:**
- Check if completed work is documented in relevant .md files
- **Run `./scripts/update-issue-priorities.sh`** to regenerate ISSUE_PRIORITIES.md
- Update any implementation summary files
- **Verify no local issue tracking files exist** (except ISSUE_PRIORITIES.md)

**Issue Management Policy:**
- All issues, bugs, and tasks MUST be tracked in GitHub Issues
- ISSUE_PRIORITIES.md is the ONLY local file for issue tracking (references GitHub issues)
- Local issue documents (e.g., CRITICAL_BUGS_FOUND.md, USER_TESTING_ISSUES_LOG.md) should be migrated to GitHub and removed
- Use GitHub issue labels for priority (P0-critical, P1-high, P2-medium, P3-low, P4-future)

---

### 2. Database Maintenance (15 minutes)

**Purpose:** Ensure database health and prevent data issues.

**Tasks:**
- [ ] Check database size and growth
- [ ] Review slow query logs (if enabled)
- [ ] Verify backup completion
- [ ] Test backup restoration (monthly)
- [ ] Check for orphaned records
- [ ] Review database connection pool usage

**Commands:**
```bash
# Create backup
./scripts/backup-database.sh

# Check backup files
ls -lh data/backups/

# Test restoration (use test database)
./scripts/restore-database.sh data/backups/latest-backup.sql
```

---

### 3. Security Updates (20 minutes)

**Purpose:** Keep dependencies secure and up to date.

**Tasks:**
- [ ] Check for npm security vulnerabilities
- [ ] Update dependencies with security patches
- [ ] Review access logs for suspicious activity
- [ ] Verify SSL certificates are valid (if using HTTPS)
- [ ] Check for exposed secrets in logs
- [ ] Scan recent commits for accidentally-committed credentials
- [ ] Check Podman/Pi secret rotation status and rotate when applicable (see below)
- [ ] Review user access and permissions

**Commands:**
```bash
# Check for vulnerabilities
cd backend && npm audit
cd ../frontend && npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update specific packages
npm update <package-name>

# Scan this week's commits for likely credential leaks (AWS keys, private
# keys, JWTs, generic high-entropy assignments to *_SECRET/*_KEY/*_PASSWORD)
git log --since="7 days ago" -p -- . ':(exclude)*.lock' \
  | grep -EnI "AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(SECRET|TOKEN|PASSWORD|API_KEY)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{12,}"
```

**Secret Rotation (when applicable):**

Rotation happens in two halves, split by where each piece can actually run:

1. **Execution — `scripts/rotate-secrets-if-due.sh`, runs ON the Pi via its
   own weekly cron entry.** This is the piece that can actually touch
   `secrets/*.txt` and the running containers, so it's the only piece that
   can *execute* a rotation, not just flag one. It's a no-op most weeks:
   - Checks each `secrets/*.txt.metadata`'s `rotationDue` date; exits
     immediately if nothing is due (this is the "not every week" part —
     cron fires weekly, the script only acts every ~90 days).
   - When something is due: verifies it can authenticate to Postgres with
     the *current* password first (aborts before touching anything if not),
     runs `./scripts/generate-secrets.sh --yes` (non-interactive), issues
     `ALTER USER mealplanner WITH PASSWORD ...` against the live DB (the
     Postgres image only reads `POSTGRES_PASSWORD_FILE` on first init of an
     empty volume — swapping the secret file alone does **not** change the
     already-initialized role's password), force-recreates postgres/redis/backend,
     and health-checks the result.
   - If the health check fails, it automatically rolls back to the
     `.previous` secret files and the old DB password, re-verifies health,
     and alerts (`send-notification.sh`) either way.
   - Rotating `jwt_secret`/`jwt_refresh_secret`/`session_secret` invalidates
     every active session — expected, not a bug; everyone gets logged out.
   - Install it once with a crontab entry (adjust time to taste, ideally
     the same night as the weekly maintenance routine):
     ```bash
     # crontab -e on the Pi
     15 3 * * 0  cd /path/to/mealplanner && ./scripts/rotate-secrets-if-due.sh >> data/maintenance-logs/cron-secret-rotation.log 2>&1
     ```
   - It commits/pushes the updated `docs/SECRET_ROTATION_STATUS.json` after
     a successful rotation (best-effort — a failed push is logged, not fatal).

2. **Verification — the cloud maintenance routine**, which never has
   filesystem access to `secrets/` (same constraint as DB backups). Its job
   is to cross-check that rotation is *actually happening* on the Pi, using
   only what's visible from the git history:
   - [ ] Read `docs/SECRET_ROTATION_STATUS.json`.
   - [ ] **File missing** — no baseline yet; open/update a `security` issue
     asking a human to run `./scripts/generate-secrets.sh` once on the Pi.
   - [ ] **Any secret's `dueBy` is more than ~7 days in the past** — this
     means the Pi cron job itself is silent (not running, host down, script
     erroring before it can push). Open/update a `security` issue saying so
     explicitly — the fix is diagnosing the Pi's cron/script, not manually
     rotating from the cloud routine (it has no way to).
   - [ ] **Nothing overdue** — no action; note the next `dueBy` date in the
     report.
   - [ ] **If the commit-scan step above finds a plausible leaked
     credential** — treat as immediate/critical regardless of the 90-day
     schedule, per the existing "alert user to critical vulnerabilities and
     offer to fix them immediately" policy. This can't wait for the weekly
     Pi cron; also check whether the leak needs purging from git history
     (see #329-style leaks).

---

### 4. Performance Monitoring (15 minutes)

**Purpose:** Identify and address performance issues early.

**Tasks:**
- [ ] Review application logs for errors
- [ ] Check API response times
- [ ] Monitor memory usage
- [ ] Review cache hit rates
- [ ] Check for slow database queries
- [ ] Verify image optimization is working

**Commands:**
```bash
# Check backend logs
docker logs meals-backend --tail 100

# Check PostgreSQL logs
docker logs meals-postgres --tail 100

# Monitor container resource usage
docker stats meals-backend meals-postgres
```

---

### 5. Code Quality Review (20 minutes)

**Purpose:** Maintain code quality and consistency.

**Tasks:**
- [ ] Review recent commits for code quality
- [ ] Check for TODO/FIXME comments
- [ ] Verify TypeScript compilation has no errors
- [ ] Run linter and fix issues
- [ ] Check for unused imports/variables
- [ ] Review console warnings in development

**Commands:**
```bash
# TypeScript compilation check
cd backend && npm run build
cd ../frontend && npm run build

# Run linter (if configured)
npm run lint

# Search for TODOs
grep -r "TODO\|FIXME" backend/src frontend/src
```

---

### 6. Documentation Updates (15 minutes)

**Purpose:** Keep documentation accurate and helpful.

**Tasks:**
- [ ] Update README if features changed
- [ ] Review and update API documentation
- [ ] Check for outdated screenshots
- [ ] Update deployment guides if needed
- [ ] Verify setup instructions still work
- [ ] Update changelog/release notes

**Files to Review:**
- README.md
- SETUP.md
- DEPLOYMENT.md
- docs/ARCHITECTURE.md
- Any feature-specific documentation

---

### 7. User Feedback Review (10 minutes)

**Purpose:** Stay connected with user needs and issues.

**Tasks:**
- [ ] Review user-reported issues
- [ ] Check for common error patterns
- [ ] Identify frequently requested features
- [ ] Update user testing documentation
- [ ] Plan next user testing session

**Files to Update:**
- USER_TESTING_SUMMARY.md
- USER_TESTING_ISSUES_LOG.md

---

## 📅 Monthly Tasks

### 1. Comprehensive Security Audit (1 hour)
- Full dependency audit and updates
- Review all authentication flows
- Check for exposed secrets
- Review access logs thoroughly
- Update security documentation

### 2. Performance Optimization (1 hour)
- Analyze slow queries and optimize
- Review and optimize images
- Check bundle sizes
- Optimize database indexes
- Review caching strategy

### 3. Backup Testing (30 minutes)
- Full backup restoration test
- Verify backup integrity
- Test disaster recovery procedures
- Update backup documentation

### 4. User Testing Session (2 hours)
- Conduct user testing with real users
- Document feedback and issues
- Create GitHub issues for findings
- Update user testing documentation

---

## 🚨 Emergency Procedures

### If Issues Are Found:

1. **Critical Security Issue**
   - Immediately patch the vulnerability
   - Review access logs for exploitation
   - Notify users if data was compromised
   - Document incident and response

2. **Performance Degradation**
   - Check resource usage (CPU, memory, disk)
   - Review recent changes
   - Check for slow queries
   - Scale resources if needed

3. **Data Loss/Corruption**
   - Stop application immediately
   - Restore from latest backup
   - Investigate root cause
   - Implement prevention measures

---

## 📊 Maintenance Checklist Template

Copy this checklist for each weekly maintenance session:

```markdown
## Weekly Maintenance - [Date]

### Issue and Repository Hygiene
- [ ] Reviewed all open issues
- [ ] Closed completed issues: #__, #__, #__
- [ ] Updated in-progress issues: #__, #__
- [ ] No stale issues found / Addressed stale issues

### Database Maintenance
- [ ] Backup completed successfully
- [ ] Database size: __ MB (growth: __ MB)
- [ ] No slow queries detected

### Security Updates
- [ ] No vulnerabilities found / Fixed vulnerabilities: __
- [ ] Dependencies up to date
- [ ] No suspicious activity in logs

### Performance Monitoring
- [ ] Average API response time: __ ms
- [ ] Memory usage: __ MB
- [ ] No errors in logs / Errors addressed: __

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No critical linter issues
- [ ] TODOs reviewed: __ found, __ addressed

### Documentation
- [ ] Documentation is up to date
- [ ] No updates needed / Updated: __

### User Feedback
- [ ] No new user issues / Reviewed issues: __
- [ ] Common patterns identified: __

### Notes:
[Any additional observations or actions taken]
```

---

## 🔧 Automation Opportunities

Consider automating these tasks:

1. **Automated Backups** - Already implemented via cron
2. **Security Scanning** - GitHub Dependabot
3. **Performance Monitoring** - Application monitoring tools
4. **Issue Stale Bot** - GitHub Actions for stale issues
5. **Dependency Updates** - Renovate or Dependabot
6. **Secret Rotation** - Fully automated: `scripts/rotate-secrets-if-due.sh`
   runs weekly on the Pi via cron and rotates (with health-checked rollback)
   only when a secret is actually due; the cloud routine cross-checks it
   actually ran via `docs/SECRET_ROTATION_STATUS.json`. See Security Updates
   above.

---

## 📚 Related Documentation

- [Database Backup Guide](./DATABASE_BACKUP.md)
- [Security Setup](./SECURITY_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Issue Priorities](./ISSUE_PRIORITIES.md)
- [Monitoring Guide](./MONITORING.md)

---

**Last Updated:** 2026-08-01  
**Maintained By:** Development Team