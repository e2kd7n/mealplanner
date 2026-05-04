# Weekly Maintenance Checklist

This checklist should be completed every week to ensure system health and data protection.

## Pre-Maintenance

- [ ] Note the date and time of maintenance
- [ ] Verify you have access to all required systems
- [ ] Check if any deployments are scheduled this week

## 1. Database Backup & Health ⚠️ CRITICAL

### Production Database Backup
- [ ] Run production database backup: `./scripts/pre-migration-backup.sh`
- [ ] Verify backup was created successfully
- [ ] Check backup file size (should be > 0 bytes)
- [ ] Verify backup integrity: `gunzip -t data/backups/pre_migration_*.sql.gz`
- [ ] Record backup details:
  - Backup file: `_______________________`
  - File size: `_______________________`
  - User count: `_______________________`
  - Recipe count: `_______________________`

### Backup Retention
- [ ] List all backups: `ls -lh data/backups/`
- [ ] Count total backups: `_______`
- [ ] Delete backups older than 30 days (keep at least 4 weekly backups)
- [ ] Verify at least 4 recent backups exist
- [ ] Total backup storage used: `_______`

### Database Health Check
- [ ] Check database is accessible: `psql -l | grep mealplanner`
- [ ] Verify production database exists: `mealplanner_prod`
- [ ] Verify development database exists: `mealplanner_dev`
- [ ] Check database sizes: `psql -c "\l+" | grep mealplanner`
- [ ] Review any database errors in logs

## 2. Dependency Updates

### Frontend Dependencies
- [ ] Check for updates: `cd frontend && npm outdated`
- [ ] List critical security updates: `npm audit --audit-level=high`
- [ ] Record available updates:
  - Minor updates: `_______`
  - Major updates: `_______`
  - Security updates: `_______`
- [ ] Apply critical security updates if any
- [ ] Schedule non-critical updates for next development cycle

### Backend Dependencies
- [ ] Check for updates: `cd backend && npm outdated`
- [ ] List critical security updates: `npm audit --audit-level=high`
- [ ] Record available updates:
  - Minor updates: `_______`
  - Major updates: `_______`
  - Security updates: `_______`
- [ ] Apply critical security updates if any
- [ ] Schedule non-critical updates for next development cycle

## 3. Cleanup Operations

### Test Artifacts
- [ ] Remove old test videos: `find frontend/test-results -name "*.webm" -mtime +7 -delete`
- [ ] Remove old test screenshots: `find frontend/test-results -name "*.png" -mtime +7 -delete`
- [ ] Space freed: `_______`

### Log Files
- [ ] Check log file sizes: `du -sh backend/logs/* 2>/dev/null || echo "No logs"`
- [ ] Archive logs older than 30 days
- [ ] Delete logs older than 90 days
- [ ] Check client logs in database: `SELECT COUNT(*) FROM client_logs;`
- [ ] Prune old client logs if > 10,000 entries

### Temporary Files
- [ ] Clean npm cache: `npm cache verify`
- [ ] Remove old node_modules if needed
- [ ] Clean Docker/Podman images: `docker system prune -f` (if applicable)

## 4. Disk Usage Analysis

- [ ] Check total disk usage: `df -h`
- [ ] Check project directory size: `du -sh /path/to/mealplanner`
- [ ] Check data directory sizes:
  ```bash
  du -sh data/uploads
  du -sh data/backups
  du -sh data/images
  du -sh data/feedback-exports
  ```
- [ ] Record sizes:
  - Uploads: `_______`
  - Backups: `_______`
  - Images: `_______`
  - Feedback: `_______`
  - Total: `_______`

## 5. Security Review

### Access & Authentication
- [ ] Review failed login attempts (if logging enabled)
- [ ] Check for any blocked users
- [ ] Verify JWT secrets are not exposed
- [ ] Review API rate limiting logs

### Database Security
- [ ] Verify database passwords are strong
- [ ] Check database connection is encrypted (if remote)
- [ ] Review database user permissions
- [ ] Ensure backups are not publicly accessible

## 6. Performance Monitoring

### Application Performance
- [ ] Check application response times (if monitoring enabled)
- [ ] Review any performance degradation reports
- [ ] Check for memory leaks or high CPU usage
- [ ] Review slow query logs (if enabled)

### Database Performance
- [ ] Check database connection pool usage
- [ ] Review slow queries (if logging enabled)
- [ ] Check for missing indexes
- [ ] Verify database statistics are up to date

## 7. Error Monitoring

### Application Errors
- [ ] Review error logs: `tail -100 backend/logs/error.log`
- [ ] Check client error logs in database
- [ ] Identify any recurring error patterns
- [ ] Create issues for critical errors

### System Errors
- [ ] Check system logs for errors
- [ ] Review container logs (if using Docker/Podman)
- [ ] Check for any crashed processes
- [ ] Verify all services are running

## 8. Documentation Updates

- [ ] Update this maintenance report
- [ ] Document any issues found
- [ ] Update runbooks if procedures changed
- [ ] Note any configuration changes

## 9. Backup Verification (Monthly)

**Perform on first maintenance of each month:**

- [ ] Test restore from most recent backup
- [ ] Verify restored data integrity
- [ ] Document restore procedure
- [ ] Update disaster recovery plan if needed

## 10. Off-Site Backup (Monthly)

**Perform on first maintenance of each month:**

- [ ] Copy latest backup to external drive
- [ ] Copy latest backup to cloud storage (if configured)
- [ ] Verify off-site backup accessibility
- [ ] Document off-site backup location

## Post-Maintenance

- [ ] Create maintenance report (copy this checklist)
- [ ] Save report to: `docs/releases/maintenance/WEEKLY_MAINTENANCE_YYYY-MM-DD.md`
- [ ] Update system health status
- [ ] Schedule next maintenance date
- [ ] Notify team of any critical findings

## System Health Status

Rate each category (✅ Good, ⚠️ Warning, ❌ Critical):

- [ ] Database Health: `_______`
- [ ] Backups: `_______`
- [ ] Dependencies: `_______`
- [ ] Disk Usage: `_______`
- [ ] Security: `_______`
- [ ] Performance: `_______`
- [ ] Errors: `_______`

**Overall Status:** `_______`

## Notes

Document any issues, observations, or actions taken:

```
[Add notes here]
```

## Recommendations for Next Week

1. 
2. 
3. 

---

**Maintenance Completed By:** `_______________________`  
**Date:** `_______________________`  
**Duration:** `_______________________`  
**Next Scheduled Maintenance:** `_______________________`