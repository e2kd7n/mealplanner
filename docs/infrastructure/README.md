/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Infrastructure Documentation

This directory contains documentation for system operations, monitoring, logging, and infrastructure management.

## Quick Reference

### Common Tasks
- **Set up monitoring**: See [Monitoring](MONITORING.md)
- **Configure logging**: See [Logging System](LOGGING_SYSTEM.md)
- **Backup database**: See [Database Backup](DATABASE_BACKUP.md)
- **Optimize performance**: See [Performance Optimization](PERFORMANCE_OPTIMIZATION.md)
- **Optimize for Pi**: See [Pi Optimization](PI_OPTIMIZATION.md)
- **Configure ports**: See [Port Standardization](PORT_STANDARDIZATION.md)

## Documentation Files

### [Database Backup](DATABASE_BACKUP.md)
Comprehensive database backup and recovery procedures:
- Automated backup scripts
- Manual backup procedures
- Backup verification
- Restore procedures
- Backup retention policies
- Storage locations
- Encryption (if applicable)
- Disaster recovery

**Backup Locations**:
- Local: `data/backups/`
- Container: `/mealplanner/data/backups/`

**Backup Scripts**:
- `./scripts/backup-full.sh` - Full database backup
- `./scripts/pre-migration-backup.sh` - Pre-migration backup

**Best Practices**:
- Backup before migrations
- Test restore procedures regularly
- Keep at least 4 recent backups
- Delete backups older than 30 days
- Verify backup integrity

### [Logging System](LOGGING_SYSTEM.md)
Backend logging configuration and management:
- Winston logger setup
- Log levels and categories
- Log rotation
- Log storage locations
- Log analysis
- Error tracking
- Performance logging

**Log Locations**:
- Production: `/mealplanner/logs/`
- Development: `./logs/`

**Log Levels**:
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages (dev only)

**Key Features**:
- Automatic log rotation
- Structured logging (JSON)
- Error stack traces
- Request/response logging
- Performance metrics

### [Frontend Logging](FRONTEND_LOGGING.md)
Client-side logging system:
- Custom batched logger
- Production-only logging
- Automatic sanitization of sensitive fields
- Non-blocking log transmission
- Error throttling
- Session management

**Features**:
- Batches logs to `/api/logs/client`
- Uses `navigator.sendBeacon` for reliability
- Auto-sanitizes: password, token, secret, apiKey
- 5-second error cooldown
- Max 50 errors per session
- Only enabled in production

**Usage**:
```typescript
import logger from '@/utils/logger';

logger.info('User action', { action: 'click', target: 'button' });
logger.error('API error', { endpoint: '/api/recipes', error });
```

### [Monitoring](MONITORING.md)
System monitoring and observability:
- Prometheus setup
- Grafana dashboards
- Health checks
- Metrics collection
- Alerting rules
- Performance monitoring
- Resource usage tracking

**Monitoring Stack**:
- Prometheus - Metrics collection
- Grafana - Visualization
- Node Exporter - System metrics
- Custom metrics - Application metrics

**Key Metrics**:
- Request rate and latency
- Error rates
- Database connection pool
- Memory usage
- CPU usage
- Disk usage

### [Performance Optimization](PERFORMANCE_OPTIMIZATION.md)
Application performance tuning:
- Frontend optimization
- Backend optimization
- Database query optimization
- Caching strategies
- Asset optimization
- Network optimization
- Build optimization

**Frontend Optimizations**:
- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction
- Caching strategies

**Backend Optimizations**:
- Database connection pooling
- Query optimization
- Caching (NodeCache)
- Response compression
- Rate limiting

**Database Optimizations**:
- Indexes on frequently queried fields
- GIN trigram indexes for search
- Connection pooling
- Query analysis

### [Pi Optimization](PI_OPTIMIZATION.md)
Raspberry Pi specific optimizations:
- ARM architecture considerations
- Memory optimization
- Build optimization for ARM
- Resource constraints
- Performance tuning
- Monitoring on Pi
- Storage optimization

**Key Optimizations**:
- esbuild minifier (not rolldown) for ARM compatibility
- Reduced chunk splitting
- Optimized dependencies
- Lightweight monitoring tools
- Memory-efficient caching

**Build Considerations**:
- Build on Pi or cross-compile
- Use `./scripts/build-for-pi.sh`
- Test on actual Pi hardware
- Monitor build memory usage

### [Port Standardization](PORT_STANDARDIZATION.md)
Port configuration and standardization:
- Port assignments
- Development vs production ports
- Container port mapping
- Reverse proxy configuration
- Port conflict resolution

**Port Assignments**:
- Frontend Dev: 5173
- Backend Dev: 3000
- Production (unified): 8080
- Database: 5432
- Monitoring: 9090 (Prometheus), 3001 (Grafana)

## Infrastructure Overview

### System Architecture
```
┌─────────────────┐
│   Nginx/Proxy   │ :80/:443
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Frontend│ │ Backend │ :8080 (prod) / :3000 (dev)
└───────┘ └────┬────┘
               │
          ┌────▼────┐
          │Database │ :5432
          └─────────┘
```

### Deployment Modes

#### Local Development
- Frontend: Vite dev server (port 5173)
- Backend: Node.js (port 3000)
- Hot reload enabled
- Development tools active
- Source maps available

#### Container (Production)
- Unified port 8080
- Nginx reverse proxy
- Optimized builds
- Production logging
- Monitoring enabled

#### Raspberry Pi
- ARM64 architecture
- Resource-constrained
- Optimized builds
- Lightweight monitoring
- Efficient caching

## Monitoring & Observability

### Health Checks
- Backend: `GET /health`
- Database: Connection pool status
- Frontend: Build status
- Services: Container health checks

### Metrics Collection
- Application metrics (custom)
- System metrics (Node Exporter)
- Database metrics (Prisma)
- HTTP metrics (request/response)

### Alerting
- High error rates
- Service downtime
- Resource exhaustion
- Database issues
- Performance degradation

### Dashboards
- System overview
- Application performance
- Database performance
- Error tracking
- User activity

## Logging Strategy

### Log Levels
- **error**: Critical errors requiring attention
- **warn**: Warning conditions
- **info**: Informational messages
- **debug**: Detailed debugging (dev only)

### Log Categories
- **api**: API requests/responses
- **database**: Database operations
- **auth**: Authentication events
- **error**: Error tracking
- **performance**: Performance metrics

### Log Retention
- Keep logs for 30 days
- Archive older logs
- Rotate logs daily
- Compress archived logs

### Log Analysis
- Search logs for errors
- Track error patterns
- Monitor performance trends
- Identify bottlenecks

## Database Management

### Connection Pooling
```typescript
// Configured via DATABASE_URL
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

### Backup Strategy
- **Frequency**: Before migrations, weekly scheduled
- **Retention**: Keep 4 recent backups, delete >30 days
- **Verification**: Test restore procedures monthly
- **Storage**: Local filesystem, consider offsite backup

### Migration Safety
- Always backup before migrations
- Use `./scripts/safe-migrate.sh`
- Test migrations in development first
- Have rollback plan ready
- Monitor after migration

### Performance
- Use indexes appropriately
- Analyze slow queries
- Monitor connection pool
- Optimize N+1 queries
- Use `withRetry()` wrapper for transient errors

## Caching Strategy

### Backend Caching
- **NodeCache** for in-memory caching
- Default TTL: 600 seconds (10 minutes)
- Cache initialization required
- Pattern-based invalidation

**Cache Usage**:
```typescript
import { cacheGet, cacheSet, cacheDel } from '@/utils/cache';

// Get from cache
const data = cacheGet('key');

// Set in cache
cacheSet('key', data, 300); // 5 minutes

// Delete from cache
cacheDel('key');

// Delete by pattern
cacheDelPattern('user:*');
```

### Frontend Caching
- Browser cache for static assets
- Service worker (if implemented)
- LocalStorage for user preferences
- SessionStorage for temporary data

### API Response Caching
- Cache Spoonacular API responses
- Cache recipe search results
- Cache user data (with invalidation)
- Cache static content

## Performance Monitoring

### Key Performance Indicators (KPIs)
- **Response Time**: API endpoint latency
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Availability**: Uptime percentage
- **Resource Usage**: CPU, memory, disk

### Performance Targets
- API response time: < 200ms (p95)
- Page load time: < 2s
- Time to interactive: < 3s
- Error rate: < 1%
- Availability: > 99.9%

### Performance Testing
- Load testing with realistic scenarios
- Stress testing for limits
- Endurance testing for stability
- Spike testing for elasticity

## Troubleshooting

### High Memory Usage
**Symptoms**: Slow performance, OOM errors
**Solutions**:
- Check for memory leaks
- Review cache size
- Optimize database queries
- Reduce concurrent connections
- See [Pi Optimization](PI_OPTIMIZATION.md) for Pi-specific issues

### High CPU Usage
**Symptoms**: Slow response times, high load
**Solutions**:
- Profile application code
- Optimize expensive operations
- Review database queries
- Check for infinite loops
- Scale horizontally if needed

### Database Connection Issues
**Symptoms**: Connection timeouts, pool exhausted
**Solutions**:
- Check connection pool settings
- Review long-running queries
- Ensure connections are released
- Monitor connection count
- Use `withRetry()` wrapper

### Disk Space Issues
**Symptoms**: Write failures, backup failures
**Solutions**:
- Clean up old logs
- Remove old backups
- Clean up orphaned images
- Monitor disk usage
- Set up alerts

### Slow API Responses
**Symptoms**: High latency, timeouts
**Solutions**:
- Profile slow endpoints
- Optimize database queries
- Implement caching
- Review N+1 queries
- Check external API calls

## Maintenance Tasks

### Daily
- Monitor error logs
- Check service health
- Review performance metrics

### Weekly
- Review and close completed issues
- Update issue priorities
- Check for dependency updates
- Review security advisories
- See [Weekly Maintenance Checklist](../releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md)

### Monthly
- Database backup verification
- Security audit
- Performance review
- Capacity planning
- Documentation updates

### Quarterly
- Secret rotation
- Dependency major updates
- Architecture review
- Disaster recovery test

## Related Documentation

### Deployment
- [Deployment Guide](../deployment/DEPLOYMENT.md) - Production deployment
- [Raspberry Pi Deployment](../deployment/RASPBERRY_PI_DEPLOYMENT.md) - Pi deployment

### Security
- [Secrets Management](../security/SECRETS_MANAGEMENT.md) - Secure configuration

### Development
- [Setup Guide](../development/SETUP.md) - Development environment
- [Workflow Guide](../development/WORKFLOW_GUIDE.md) - Development process

### Root Documentation
- [Performance Optimization](../PERFORMANCE_OPTIMIZATION.md) - Additional optimization docs
- [Pi Build Optimization](../PI_BUILD_OPTIMIZATION.md) - Pi build details
- [Pi Lightweight Images](../PI_LIGHTWEIGHT_IMAGES.md) - Pi image optimization

## Best Practices

### Monitoring
1. **Monitor proactively** - Don't wait for issues
2. **Set up alerts** - Be notified of problems
3. **Review regularly** - Check dashboards daily
4. **Track trends** - Identify patterns over time
5. **Document incidents** - Learn from issues
6. **Test monitoring** - Verify alerts work
7. **Keep dashboards updated** - Reflect current system

### Logging
1. **Log appropriately** - Right level for right message
2. **Structure logs** - Use consistent format
3. **Sanitize sensitive data** - Never log secrets
4. **Rotate logs** - Prevent disk space issues
5. **Monitor log volume** - Watch for anomalies
6. **Analyze regularly** - Review for patterns
7. **Archive old logs** - Keep for compliance

### Performance
1. **Measure first** - Profile before optimizing
2. **Optimize bottlenecks** - Focus on biggest impact
3. **Test changes** - Verify improvements
4. **Monitor continuously** - Track performance over time
5. **Cache wisely** - Balance freshness and performance
6. **Scale appropriately** - Vertical vs horizontal
7. **Document optimizations** - Track what works

### Database
1. **Backup regularly** - Before migrations, weekly
2. **Test restores** - Verify backups work
3. **Monitor performance** - Track slow queries
4. **Use indexes** - Optimize frequently queried fields
5. **Pool connections** - Efficient resource usage
6. **Handle errors** - Use retry logic
7. **Plan capacity** - Monitor growth trends

---

[← Back to Documentation Hub](../README.md)

// Made with Bob