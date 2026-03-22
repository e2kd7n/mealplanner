# Weekly Maintenance Tasks

**Copyright (c) 2026 Erik Didriksen. All rights reserved.**

## Overview

This document outlines weekly maintenance tasks for the Meal Planner application. Unlike simpler applications, this system has multiple components that require regular attention: frontend (React/Vite), backend (Node.js/Express), database (PostgreSQL), in-memory cache (node-cache), and containerization (Podman).

## Weekly Checklist

### 🔒 Security & Updates (Priority: High)

- [ ] **Check for security vulnerabilities**
  ```bash
  cd backend && pnpm audit
  cd frontend && pnpm audit
  ```
  - Review and address any high/critical vulnerabilities
  - Update packages with security patches
  - Document any breaking changes

- [ ] **Update dependencies**
  ```bash
  # Check for outdated packages
  cd backend && pnpm outdated
  cd frontend && pnpm outdated
  
  # Update non-breaking changes
  cd backend && pnpm update
  cd frontend && pnpm update
  ```
  - Test thoroughly after updates
  - Update lock files
  - Commit changes with clear message

- [ ] **Review authentication & authorization**
  - Check JWT token expiration settings
  - Review failed login attempts in logs
  - Verify rate limiting is working
  - Check for suspicious activity patterns

- [ ] **Secrets rotation check**
  - Review secrets age (rotate if > 90 days)
  - Verify secrets are not exposed in logs
  - Check `.env` files are not committed

### 🗄️ Database Maintenance (Priority: High)

- [ ] **Database health check**
  ```bash
  # Connect to database
  podman exec -it meals-postgres psql -U mealplanner -d mealplanner
  
  # Check database size
  SELECT pg_size_pretty(pg_database_size('mealplanner'));
  
  # Check table sizes
  SELECT schemaname, tablename, 
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  ```

- [ ] **Backup verification**
  ```bash
  # Create backup
  ./scripts/backup-database.sh
  
  # Verify backup exists and is recent
  ls -lh data/backups/
  
  # Test restore on dev environment (monthly)
  ```

- [ ] **Query performance review**
  ```sql
  -- Check slow queries
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
  
  -- Check missing indexes
  SELECT schemaname, tablename, attname, n_distinct, correlation
  FROM pg_stats
  WHERE schemaname = 'public'
  AND n_distinct > 100
  ORDER BY n_distinct DESC;
  ```

- [ ] **Database cleanup**
  - Archive old meal plans (> 6 months)
  - Clean up expired sessions
  - Remove orphaned records
  - Vacuum and analyze tables
  ```sql
  VACUUM ANALYZE;
  ```

### 💾 Redis Cache Maintenance (Priority: Medium)

- [ ] **Redis health check**
  ```bash
  docker exec -it meals-redis redis-cli INFO
  
  # Check memory usage
  docker exec -it meals-redis redis-cli INFO memory
  
  # Check connected clients
  docker exec -it meals-redis redis-cli CLIENT LIST
  ```

- [ ] **Cache performance**
  ```bash
  # Check hit rate
  docker exec -it meals-redis redis-cli INFO stats | grep keyspace
  
  # Review cache keys
  docker exec -it meals-redis redis-cli KEYS "*" | head -20
  ```

- [ ] **Cache cleanup**
  - Remove stale keys if needed
  - Verify TTL settings are appropriate
  - Check for memory leaks

### 🐳 Container & Infrastructure (Priority: Medium)

- [ ] **Container health**
  ```bash
  # Check container status
  podman ps -a

  # Check container logs for errors
  podman logs meals-backend --tail 100
  podman logs meals-postgres --tail 100

  # Check resource usage
  podman stats --no-stream
  ```

- [ ] **Disk space monitoring**
  ```bash
  # Check disk usage
  df -h
  
  # Check Docker disk usage
  docker system df
  
  # Clean up if needed (careful!)
  docker system prune -a --volumes
  ```

- [ ] **Image updates**
  ```bash
  # Pull latest base images
  docker pull node:20-alpine
  docker pull postgres:16-alpine
  docker pull redis:7-alpine
  
  # Rebuild if base images updated
  docker-compose build --no-cache
  ```

### 📊 Application Monitoring (Priority: High)

- [ ] **Review application logs**
  ```bash
  # Backend errors
  podman logs meals-backend 2>&1 | grep -i error | tail -50
  
  # Frontend errors (check browser console)
  # Review Sentry/error tracking if configured
  ```

- [ ] **Performance metrics**
  - Check API response times
  - Review slow endpoints
  - Monitor memory usage trends
  - Check for memory leaks

- [ ] **User activity review**
  - Check active users
  - Review feature usage
  - Identify unused features
  - Check for abuse patterns

### 🧪 Testing & Quality (Priority: Medium)

- [ ] **Run test suites**
  ```bash
  # Backend tests
  cd backend && pnpm test
  
  # Frontend tests
  cd frontend && pnpm test
  
  # Integration tests
  pnpm test:integration
  ```

- [ ] **Code quality checks**
  ```bash
  # Linting
  cd backend && pnpm lint
  cd frontend && pnpm lint
  
  # Type checking
  cd backend && pnpm type-check
  cd frontend && pnpm type-check
  ```

- [ ] **Review test coverage**
  ```bash
  cd backend && pnpm test:coverage
  cd frontend && pnpm test:coverage
  ```

### 📝 Documentation (Priority: Low)

- [ ] **Update documentation**
  - Review and update README.md
  - Update API documentation
  - Document any new features
  - Update troubleshooting guides

- [ ] **Review open issues**
  - Triage new issues in ISSUES.md
  - Update issue priorities
  - Close resolved issues
  - Update ISSUES_PRIORITIZATION.md

### 🔄 Backup & Recovery (Priority: High)

- [ ] **Verify backups**
  ```bash
  # Check backup schedule
  ls -lh data/backups/
  
  # Verify backup integrity
  pg_restore --list data/backups/latest.dump
  ```

- [ ] **Test recovery procedures**
  - Document recovery steps
  - Test restore on dev environment (monthly)
  - Update disaster recovery plan

### 🚀 Deployment & CI/CD (Priority: Medium)

- [ ] **Review deployment logs**
  - Check recent deployments
  - Review rollback procedures
  - Update deployment documentation

- [ ] **Environment parity check**
  - Verify dev/staging/prod configs match
  - Check environment variables
  - Verify secrets are synced

## Monthly Tasks

### 🔐 Security Deep Dive

- [ ] **Security audit**
  - Review authentication flows
  - Check authorization rules
  - Audit API endpoints
  - Review CORS settings
  - Check rate limiting effectiveness

- [ ] **Penetration testing**
  - Run automated security scans
  - Test common vulnerabilities (OWASP Top 10)
  - Review security headers
  - Test input validation

- [ ] **Access review**
  - Review user permissions
  - Audit admin accounts
  - Check API key usage
  - Review third-party integrations

### 📈 Performance Optimization

- [ ] **Database optimization**
  - Analyze query patterns
  - Add missing indexes
  - Optimize slow queries
  - Review table partitioning needs

- [ ] **Cache optimization**
  - Review cache hit rates
  - Optimize cache keys
  - Adjust TTL values
  - Implement new caching strategies

- [ ] **Frontend optimization**
  - Run Lighthouse audits
  - Optimize bundle sizes
  - Review lazy loading
  - Check image optimization

### 🧹 Cleanup Tasks

- [ ] **Code cleanup**
  - Remove dead code
  - Refactor technical debt
  - Update deprecated APIs
  - Consolidate duplicate code

- [ ] **Data cleanup**
  - Archive old data
  - Remove test data
  - Clean up orphaned records
  - Optimize storage

## Quarterly Tasks

### 📊 Architecture Review

- [ ] **System architecture**
  - Review current architecture
  - Identify bottlenecks
  - Plan improvements
  - Update architecture docs

- [ ] **Technology stack review**
  - Evaluate current stack
  - Research alternatives
  - Plan upgrades
  - Document decisions

### 🎯 Feature Planning

- [ ] **Roadmap review**
  - Review completed features
  - Update feature priorities
  - Plan next quarter
  - Update ISSUES.md

- [ ] **User feedback**
  - Collect user feedback
  - Prioritize feature requests
  - Plan improvements
  - Update documentation

## Emergency Procedures

### 🚨 Critical Issues

**Database Down:**
1. Check container status: `podman ps -a`
2. Check logs: `podman logs meals-postgres`
3. Restart container: `podman restart meals-postgres`
4. Restore from backup if needed

**Backend Down:**
1. Check logs: `podman logs meals-backend`
2. Check database connection
3. Restart container: `podman restart meals-backend`

**High Memory Usage:**
1. Check container stats: `podman stats`
2. Check for memory leaks in logs
3. Restart affected container
4. Investigate root cause

**Disk Space Full:**
1. Check disk usage: `df -h`
2. Clean Podman: `podman system prune`
3. Archive old backups
4. Clean application logs

## Automation Opportunities

Consider automating these tasks:

1. **Automated backups** - Daily database backups
2. **Security scanning** - Weekly dependency audits
3. **Health checks** - Continuous monitoring
4. **Log rotation** - Automatic log cleanup
5. **Metrics collection** - Performance tracking
6. **Alert system** - Notify on critical issues

## Tools & Scripts

### Useful Scripts

Create these helper scripts in `scripts/` directory:

- `backup-database.sh` - Database backup
- `restore-database.sh` - Database restore
- `health-check.sh` - System health check
- `cleanup.sh` - Cleanup old data
- `update-deps.sh` - Update dependencies
- `security-audit.sh` - Security scan

### Monitoring Tools

Consider implementing:

- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Sentry** - Error tracking
- **Uptime Kuma** - Uptime monitoring
- **Portainer** - Container management

## Notes

- Adjust task frequency based on usage patterns
- Document any issues encountered
- Update this checklist as needed
- Share knowledge with team members
- Keep emergency contacts updated

## Maintenance Log

Keep a log of maintenance activities:

```
Date: 2026-03-15
Tasks Completed:
- Updated backend dependencies
- Ran database vacuum
- Reviewed security logs
Issues Found:
- None
Next Actions:
- Monitor query performance
```

---

**Last Updated**: March 15, 2026  
**Version**: 1.0.0  
**Maintained By**: Development Team