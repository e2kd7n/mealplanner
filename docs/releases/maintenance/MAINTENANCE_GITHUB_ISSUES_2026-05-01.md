# GitHub Issues for Weekly Maintenance - May 1, 2026

Based on the weekly maintenance report, the following GitHub issues should be created for the next sprint.

---

## P2 (Low Priority) - Maintenance & Technical Debt

### Issue 1: Apply Minor Frontend Dependency Updates

**Title:** [Maintenance] Update Frontend Dependencies (Minor Versions)

**Labels:** `P2`, `maintenance`, `dependencies`, `frontend`

**Description:**

Apply minor version updates to frontend dependencies identified in weekly maintenance (May 1, 2026).

**Updates to Apply:**
- `@mui/icons-material`: 7.3.9 → 7.3.10
- `@mui/material`: 7.3.9 → 7.3.10
- `@types/node`: 24.12.0 → 24.12.2
- `eslint-plugin-react-hooks`: 7.0.1 → 7.1.1
- `globals`: 17.4.0 → 17.6.0
- `react`: 19.2.4 → 19.2.5
- `react-dom`: 19.2.4 → 19.2.5
- `react-hook-form`: 7.71.2 → 7.74.0
- `react-router-dom`: 7.13.1 → 7.14.2
- `recharts`: 3.8.0 → 3.8.1
- `typescript-eslint`: 8.59.0 → 8.59.1
- `vite`: 8.0.9 → 8.0.10
- `zod`: 4.3.6 → 4.4.2

**Acceptance Criteria:**
- [ ] Run `npm update` in frontend directory
- [ ] Verify all tests pass
- [ ] Test critical user flows (login, recipe creation, meal planning)
- [ ] Check for any console warnings or errors
- [ ] Update package-lock.json

**Estimated Effort:** 1-2 hours

**Reference:** `docs/releases/maintenance/WEEKLY_MAINTENANCE_2026-05-01.md`

---

### Issue 2: Evaluate Major Frontend Dependency Updates

**Title:** [Maintenance] Evaluate and Plan Major Frontend Dependency Updates

**Labels:** `P2`, `maintenance`, `dependencies`, `frontend`, `research`

**Description:**

Several frontend dependencies have major version updates available. These require evaluation, testing, and potentially code changes before upgrading.

**Major Updates Available:**
- `@eslint/js`: 9.39.4 → 10.0.1
- `@mui/icons-material`: 7.3.9 → 9.0.0 (major)
- `@mui/material`: 7.3.9 → 9.0.0 (major)
- `@types/node`: 24.12.0 → 25.6.0 (major)
- `eslint`: 9.39.4 → 10.3.0 (major)
- `typescript`: 5.9.3 → 6.0.3 (major)

**Tasks:**
- [ ] Review changelog for each major update
- [ ] Identify breaking changes
- [ ] Assess impact on codebase
- [ ] Create migration plan if updates are beneficial
- [ ] Estimate effort for upgrade
- [ ] Schedule upgrade work if approved

**Acceptance Criteria:**
- [ ] Document findings for each major update
- [ ] Provide recommendation (upgrade now, defer, or skip)
- [ ] Create follow-up issues for approved upgrades
- [ ] Update maintenance documentation

**Estimated Effort:** 3-4 hours (research only)

**Reference:** `docs/releases/maintenance/WEEKLY_MAINTENANCE_2026-05-01.md`

---

### Issue 3: Set Up Automated Database Backups

**Title:** [DevOps] Configure Automated Weekly Database Backups

**Labels:** `P2`, `devops`, `maintenance`, `database`, `automation`

**Description:**

Currently, database backups are manual. Set up automated weekly backups to ensure data protection.

**Current State:**
- Manual backup script exists: `scripts/backup-database.sh`
- Last backup: April 25, 2026
- 5 backups retained (2.7 MB total)
- Retention policy: 7 backups

**Tasks:**
- [ ] Create cron job or launchd configuration for weekly backups
- [ ] Test automated backup execution
- [ ] Verify backup rotation works correctly
- [ ] Set up backup monitoring/alerting
- [ ] Document automated backup setup in `docs/DATABASE_BACKUP.md`

**Acceptance Criteria:**
- [ ] Backups run automatically every week
- [ ] Old backups are cleaned up per retention policy
- [ ] Backup logs are generated
- [ ] Backup failures trigger alerts (if monitoring is available)
- [ ] Documentation is updated

**Estimated Effort:** 2-3 hours

**Reference:** `docs/releases/maintenance/WEEKLY_MAINTENANCE_2026-05-01.md`, `docs/DATABASE_BACKUP.md`

---

### Issue 4: Complete Backend Dependency Audit

**Title:** [Maintenance] Audit and Update Backend Dependencies

**Labels:** `P2`, `maintenance`, `dependencies`, `backend`

**Description:**

Complete the backend dependency audit that was in progress during weekly maintenance.

**Tasks:**
- [ ] Run `npm outdated` in backend directory
- [ ] Document available updates
- [ ] Categorize updates (minor vs major)
- [ ] Apply safe minor updates
- [ ] Create follow-up issues for major updates requiring evaluation

**Acceptance Criteria:**
- [ ] Backend dependencies are documented
- [ ] Minor updates are applied
- [ ] All tests pass after updates
- [ ] Major updates are tracked in separate issues
- [ ] Update maintenance report with backend findings

**Estimated Effort:** 2-3 hours

**Reference:** `docs/releases/maintenance/WEEKLY_MAINTENANCE_2026-05-01.md`

---

## Summary

**Total Issues:** 4  
**Priority Breakdown:**
- P0 (Critical): 0
- P1 (High): 0
- P2 (Low): 4

**Estimated Total Effort:** 8-12 hours

**Sprint Recommendation:**
These are all P2 maintenance tasks that can be scheduled for the next sprint based on team capacity. They are not blocking any features but will help maintain code quality and system reliability.

**Priority Order for Sprint Planning:**
1. Issue 4 - Complete Backend Dependency Audit (prerequisite for other work)
2. Issue 1 - Apply Minor Frontend Dependency Updates (low risk, high value)
3. Issue 3 - Set Up Automated Database Backups (improves reliability)
4. Issue 2 - Evaluate Major Frontend Dependency Updates (research for future work)

---

**Created:** May 1, 2026  
**Maintenance Report:** `docs/releases/maintenance/WEEKLY_MAINTENANCE_2026-05-01.md`