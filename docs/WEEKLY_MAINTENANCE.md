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

**Automation (mostly Pi-side, as of 2026-08-21):**

Split the same way as Secret Rotation below, now that `gh`/`jq` are
installed on the Pi (they weren't when `update-issue-priorities.sh` was
first written, hence its old dependency-check message telling people not
to run it there — that's stale and has been corrected):

1. **Execution — `scripts/weekly-repo-hygiene.sh`, runs ON the Pi via its
   own weekly cron entry.** A thin wrapper around
   `scripts/update-issue-priorities.sh` that adds the commit/push step:
   - Duplicate-issue detection, missing-label auto-add (`security`/`bug`
     inferred from title), workspace TODO/FIXME scan, and
     ISSUE_PRIORITIES.md regeneration all run for real.
   - Issues that *look* resolved by recent commit messages (`Fixes #N`,
     `Closes #N`, etc.) are **flagged only, never auto-closed** —
     `--auto-close` is deliberately not passed. Regex-pattern-based closing
     has produced false positives on this repo before (see memory
     `feedback_autoclose_bot_false_positives`), so a human (or the cloud
     routine's LLM judgment, see below) still reviews and closes those.
   - Commits and pushes ISSUE_PRIORITIES.md if it changed.
   - Install once with a crontab entry:
     ```bash
     # crontab -e on the Pi
     15 4 * * 0  cd /path/to/mealplanner && ./scripts/weekly-repo-hygiene.sh >> data/maintenance-logs/cron-issue-hygiene.log 2>&1
     ```
     (One hour after Secret Rotation's `15 3 * * 0` — clear of its
     container-recreate window and Feedback Triage's `45 3 * * 0`.)
2. **Verification/judgment — the cloud maintenance routine**, scoped down
   to just what genuinely needs an LLM reading actual issue/commit content
   rather than a regex:
   - [ ] Read the Pi-flagged "appears resolved but still open" candidates
     from the latest `data/maintenance-logs/issue-hygiene-*.log` and decide
     which are *actually* done — close those with a proper comment.
   - [ ] Comment on genuinely stale issues (30+ days, no real progress).
   - [ ] Everything else in this section (labels, dedup, ISSUE_PRIORITIES.md,
     TODO scan) is already handled by the Pi script — don't redo it.

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

**Dependency Vulnerability Scanning (fully automated, Pi-side, as of 2026-08-21):**

Runs entirely on the Pi via `scripts/security-audit.sh` — no cloud
verification half needed here, unlike Secret Rotation, because there's
nothing that requires live Pi/container access that the script itself
doesn't already have:

- Uses `pnpm audit` (not `npm audit` — see memory
  `feedback_audit_pnpm_not_npm`: npm undercounted 27 real vulns as 6
  because it wasn't reading the actual lockfile) for both `backend` and
  `frontend`, before and after `pnpm audit fix` (non-breaking, no
  `--force`).
- Also runs the credential-leak commit scan above. A match is **never**
  posted anywhere on GitHub — that would publish the very secret it found
  — only a local `send-notification.sh` alert fires.
- Keeps a **single rolling tracker issue** (label `auto-security-audit`)
  in sync with whatever HIGH/CRITICAL findings remain after the fix,
  editing its body in place each run rather than filing a new issue every
  week. Closes it automatically when nothing remains; comments + closes
  with a summary. Any CRITICAL finding also fires an urgent local
  notification immediately, per the "alert user to critical vulnerabilities"
  policy above.
- Commits/pushes `package.json`/`pnpm-lock.yaml` changes from `audit fix`
  if any were made.
- Pre-dates this automation: issues #365 and #392 (and similar) were
  filed manually by the old cloud-routine flow and aren't tracked by the
  new fingerprint-free tracker issue — worth a one-time reconciliation
  (close them into the new tracker or vice versa) rather than assuming
  they'll stay in sync automatically.
- Install once with a crontab entry:
  ```bash
  # crontab -e on the Pi
  45 4 * * 0  cd /path/to/mealplanner && ./scripts/security-audit.sh >> data/maintenance-logs/cron-security-audit.log 2>&1
  ```
  (Thirty minutes after Weekly Repo Hygiene's `15 4 * * 0`.)
- Test with `./scripts/security-audit.sh --dry-run` first — it still runs
  `pnpm audit` for real (read-only) but skips `pnpm audit fix`, the git
  commit/push, and all `gh issue` writes.

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

**Automated Feedback & Error-Log Triage (fully automated):**

Split the same way as Secret Rotation above, since the cloud maintenance
routine has no live Postgres access:

1. **Execution — `scripts/feedback-log-triage.sh`, runs ON the Pi via its
   own weekly cron entry** (needs direct database access, which only the Pi
   has). Most weeks it files zero or one issue:
   - Pulls the last 7 days of `UserFeedback` and error/warn `ClientLog` rows
     via `backend/dist/scripts/feedback-triage.js` (`podman exec
     meals-backend node dist/scripts/feedback-triage.js`), filters out known
     test/noise data (`@example.com`/`@test.com` accounts, `/test`-prefixed
     pages, boilerplate test messages — see
     `backend/src/scripts/feedback-triage.util.ts`), and clusters recurring
     errors (3+ occurrences) so a single flaky blip doesn't become an issue.
     Real user feedback isn't clustering-gated the same way — a single
     genuine report is enough to file.
   - Dedupes against **every** existing `auto-feedback-triage`-labeled issue
     (open, closed-fixed, and closed-wontfix all suppress re-filing) via a
     stable fingerprint embedded as a hidden HTML comment in each filed
     issue's body — the same underlying problem is never re-filed, and
     marking a false positive `wontfix` permanently silences it.
   - Files real `gh issue create` calls for genuinely new problems, with
     dynamic titles/bodies (severity, occurrence count, first/last seen,
     a redacted/capped excerpt — never the reporter's email or name) and
     existing repo labels only (`bug`/`enhancement`/`question` +
     `P1-high`/`P2-medium`/`P3-low`), capped at `MAX_ISSUES_PER_RUN`
     (default 5) per run; anything over the cap carries over to next week
     instead of being dropped.
   - Requires `secrets/github_token.txt` — a fine-grained PAT scoped to
     this repo only, `Issues: Read and write`, mode 600, created once
     manually (`gh` honors `GH_TOKEN` natively, no `gh auth login` needed).
     Not part of `rotate-secrets-if-due.sh`'s rotation set — a PAT has no
     `ALTER USER`-style in-place rotation, so rotate it manually.
   - Requires `gh`/`jq` installed on the Pi host (one-time
     `apt-get install -y gh jq`).
   - The full, unredacted view of everything a given run looked at
     (including filtered noise, with real names/messages intact) is written
     locally to `data/maintenance-logs/feedback-triage-raw-latest.json` —
     **never committed to this repo**. It's picked up by the existing daily
     backup job and archived privately at `github.com/e2kd7n/backups` →
     `mealplanner/feedback-triage/` (see the companion-change note below).
   - Install once with a crontab entry:
     ```bash
     # crontab -e on the Pi
     45 3 * * 0  cd /path/to/mealplanner && ./scripts/feedback-log-triage.sh >> data/maintenance-logs/cron-feedback-triage.log 2>&1
     ```
     (45 minutes after Secret Rotation's `15 3 * * 0` — clear of its
     container-recreate/health-check window.)
2. **Verification — spot-check locally**, since there's no separate cloud
   routine cross-check for this one (unlike Secret Rotation):
   - [ ] Read `data/maintenance-logs/feedback-triage-status.txt` for the
     latest `STATUS`/`MESSAGE`.
   - [ ] **STATUS=FAILED** — check the referenced `LOG_FILE`; common causes
     are a missing/expired `secrets/github_token.txt`, `meals-backend` not
     running, or a DB error.
   - [ ] **Issues filed this run** — skim them for label/priority
     correctness and confirm nothing identifying a household member leaked
     through; mark false positives `wontfix` (the fingerprint dedup treats
     that as handled permanently).
   - [ ] **Suspiciously few/zero candidates for several weeks running** —
     check the run's log for a `WARNING: ... MAX_DATABASE_LOGS_DAYS`
     message; the script self-checks the oldest `ClientLog` row it saw each
     run against the requested lookback window.

**Companion change required (one-time, in the separate `e2kd7n/backups`
repo, not this one):** `scripts/backup-mealplanner.sh`'s `_populate()`
needs a small addition to pick up the raw archive file if present:
```bash
# inside _populate(), alongside the existing backend.env / secrets/*.txt copies
local raw="${PROJECT_DIR}/data/maintenance-logs/feedback-triage-raw-latest.json"
[[ -f "$raw" ]] && mkdir -p "${dest}/feedback-triage" && cp "$raw" "${dest}/feedback-triage/"
```
Until this lands, `feedback-triage-raw-latest.json` stays local-only on the
Pi (never lost, just not off-device archived) — it does not block the rest
of this feature.

---

### 8. Worktree Hygiene (Local Only)

**Purpose:** Prevent stale Claude Code worktrees (and their full `node_modules`
installs) from accumulating in `.claude/worktrees/`.

Split the same way as Secret Rotation above, since the cloud maintenance routine
has no access to this laptop's filesystem:

1. **Execution — `scripts/prune-worktrees.sh`, runs locally on this machine
   via a weekly Windows Scheduled Task** (not the cloud routine — worktrees
   are local-only state, never pushed anywhere). For each worktree other than
   the repo root:
   - Skips it if it's locked by a still-running session.
   - Removes it (plus its local and remote branch) only if its branch has a
     merged or closed PR **and** it has zero uncommitted changes **and** zero
     commits ahead of `main` that aren't already on it.
   - Anything else (open/no PR, or real uncommitted/unpushed work) is left
     alone and reported, never guessed at.
   - On Windows, falls back to a robocopy mirror-of-empty trick if `git
     worktree remove` hits the MAX_PATH limit on deep `node_modules` trees
     (`core.longpaths` alone doesn't fix this — see global CLAUDE.md).
2. **Verification — none needed from the cloud routine.** This is purely
   local-machine housekeeping; there's nothing here for a cloud agent to
   check, unlike secret rotation where GitHub-visible state (commit history)
   lets it verify a Pi-side job actually ran.

**Commands:**
```bash
# Dry run — report only, changes nothing
./scripts/prune-worktrees.sh .

# Actually remove safe-to-remove worktrees and their branches
./scripts/prune-worktrees.sh . --apply
```

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
2. **Performance Monitoring** - Application monitoring tools
3. **Issue Stale Bot** - GitHub Actions for stale issues
4. **Dependency Updates** - Dependabot was tried and removed 2026-07-29
   (net churn — 30 PRs/10wk, most closed unmerged, see memory
   `project_dependabot_removed`); item 9 below is the replacement.
5. **Secret Rotation** - Fully automated: `scripts/rotate-secrets-if-due.sh`
   runs weekly on the Pi via cron and rotates (with health-checked rollback)
   only when a secret is actually due; the cloud routine cross-checks it
   actually ran via `docs/SECRET_ROTATION_STATUS.json`. See Security Updates
   above.
6. **Worktree Hygiene** - Fully automated: `scripts/prune-worktrees.sh --apply`
   runs weekly via a local Windows Scheduled Task and removes only worktrees
   whose branch is merged/closed with no uncommitted or unpushed work. See
   Worktree Hygiene above.
7. **Feedback/Error-Log Triage** - Fully automated:
   `scripts/feedback-log-triage.sh` runs weekly on the Pi via cron, clusters
   and dedupes recurring feedback/errors, and files `gh issue create` calls
   for genuinely new problems only — the full unredacted picture is archived
   privately, never committed here. See User Feedback Review above.
8. **Issue & Repository Hygiene** - Mostly automated:
   `scripts/weekly-repo-hygiene.sh` runs weekly on the Pi via cron
   (duplicate detection, label auto-add, ISSUE_PRIORITIES.md regen, TODO
   scan, commit/push); the cloud routine now only does the judgment-based
   piece — reviewing and closing issues the Pi script flagged as
   "appears resolved." See Issue and Repository Hygiene above.
9. **Dependency Vulnerability Scanning** - Fully automated:
   `scripts/security-audit.sh` runs weekly on the Pi via cron (`pnpm audit`
   + `audit fix` for both apps, a single rolling tracker issue instead of
   weekly spam, urgent alert on any CRITICAL finding). See Security Updates
   above.

---

## 📚 Related Documentation

- [Database Backup Guide](./DATABASE_BACKUP.md)
- [Security Setup](./SECURITY_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Issue Priorities](./ISSUE_PRIORITIES.md)
- [Monitoring Guide](./MONITORING.md)

---

**Last Updated:** 2026-08-21  
**Maintained By:** Development Team