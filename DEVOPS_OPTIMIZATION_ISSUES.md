# DevOps & Runtime Optimization Issues

## CI/CD Pipeline

### Issue 1: Missing CI/CD Workflows
**Priority: High**
**Labels: devops, ci/cd**

E2E workflow exists but is disabled. No workflows for:
- Linting/type checking
- Unit tests
- Security scanning
- Dependency updates
- Docker image builds
- Automated deployments

**Recommendation:**
```yaml
# .github/workflows/ci.yml
- Lint & type check on PR
- Run unit tests
- Security audit (npm audit, Snyk)
- Build validation
- Dependency caching optimization
```

### Issue 2: E2E Tests Disabled in CI
**Priority: High**
**Labels: testing, ci/cd**

E2E workflow commented out (lines 7-10). Tests exist but don't run automatically.

**Impact:** Regressions slip through
**Fix:** Re-enable on PR, optimize runtime with:
- Parallel test execution
- Selective test runs based on changed files
- Better caching strategy

### Issue 3: No Docker Image Registry
**Priority: Medium**
**Labels: devops, docker**

Images built locally, no registry push. Wastes build time on every deployment.

**Recommendation:**
- Push to GitHub Container Registry
- Tag with commit SHA + semver
- Implement multi-arch builds (amd64/arm64)
- Cache layers between builds

### Issue 4: Inefficient Playwright Browser Caching
**Priority: Medium**
**Labels: ci/cd, performance**

Lines 66-74: Cache hit still runs `install-deps`. Wastes ~30s per run.

**Fix:**
```yaml
- if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps chromium
```

## Docker & Containerization

### Issue 5: Redundant pnpm Installation
**Priority: Medium**
**Labels: docker, optimization**

Backend Dockerfile installs pnpm 3 times (lines 22, 53, 82). Wastes ~15MB per stage.

**Fix:** Use base image with pnpm pre-installed or install once in base stage.

### Issue 6: Prisma Generate Runs Twice
**Priority: Low**
**Labels: docker, optimization**

Lines 65 & 98: Prisma client generated in builder then regenerated in production. Second generation unnecessary if using `--prod` correctly.

**Fix:** Copy generated client from builder stage.

### Issue 7: No Build Cache Optimization
**Priority: Medium**
**Labels: docker, performance**

No BuildKit cache mounts. Each build reinstalls all dependencies.

**Fix:**
```dockerfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

### Issue 8: Large Production Image
**Priority: High**
**Labels: docker, optimization**

Backend image 400-600MB. Can reduce to ~200MB:
- Use distroless base image
- Remove pnpm after install
- Multi-stage copy only node_modules needed files
- Prune dev dependencies properly

### Issue 9: Frontend Dockerfile Inefficiency
**Priority: Low**
**Labels: docker, optimization**

Lines 12-14: wget + manual pnpm install. Use npm or corepack instead.

**Fix:**
```dockerfile
RUN corepack enable && corepack prepare pnpm@10 --activate
```

## Database & Performance

### Issue 10: Missing Database Connection Pooling
**Priority: High**
**Labels: performance, database**

No explicit connection pool configuration in Prisma. Default pool may be insufficient under load.

**Fix:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10
  pool_timeout = 20
}
```

### Issue 11: No Database Backup Automation
**Priority: High**
**Labels: devops, database**

Backup script exists but no automation. Risk of data loss.

**Recommendation:**
- Cron job for daily backups
- Retention policy (7 daily, 4 weekly, 12 monthly)
- Backup verification
- Off-site storage

### Issue 12: Missing Database Indexes
**Priority: Medium**
**Labels: performance, database**

Schema has indexes but missing composite indexes for common queries:
- `(userId, createdAt)` on recipes
- `(mealPlanId, date)` on planned_meals
- `(userId, status)` on grocery_lists

### Issue 13: No Query Performance Monitoring
**Priority: Medium**
**Labels: monitoring, performance**

No slow query logging or APM integration.

**Recommendation:**
- Enable Prisma query logging in production
- Integrate with monitoring (DataDog, New Relic)
- Alert on queries >100ms

## Resource Utilization

### Issue 14: No Resource Limits in Compose
**Priority: High**
**Labels: devops, performance**

podman-compose.yml missing CPU/memory limits. Containers can consume all resources.

**Fix:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Issue 15: No Horizontal Scaling Support
**Priority: Low**
**Labels: architecture, scalability**

Single backend instance. No load balancing or session management for multiple instances.

**Recommendation:**
- Redis for session storage
- Stateless backend design
- Load balancer configuration

### Issue 16: Inefficient Static Asset Serving
**Priority: Medium**
**Labels: performance, nginx**

nginx serves frontend through proxy (line 71). Should serve static files directly.

**Fix:**
```nginx
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

### Issue 17: No CDN Integration
**Priority: Low**
**Labels: performance, infrastructure**

Static assets served from origin. High latency for distant users.

**Recommendation:** CloudFlare, AWS CloudFront, or Fastly for static assets.

## Monitoring & Observability

### Issue 18: No Centralized Logging
**Priority: High**
**Labels: monitoring, devops**

Logs scattered across containers. No aggregation or search.

**Recommendation:**
- ELK stack or Loki
- Structured JSON logging
- Log retention policy
- Alert on error patterns

### Issue 19: No Application Metrics
**Priority: High**
**Labels: monitoring, performance**

Monitoring utils exist but no metrics export. Can't track:
- Request rates
- Error rates
- Response times
- Resource usage

**Fix:** Prometheus + Grafana integration

### Issue 20: No Health Check Aggregation
**Priority: Medium**
**Labels: monitoring, devops**

Individual health checks but no dashboard. Can't see system health at a glance.

**Recommendation:** Status page showing all service health

## Security

### Issue 21: Secrets in Environment Variables
**Priority: High**
**Labels: security, devops**

Secrets passed as env vars. Visible in `docker inspect` and logs.

**Fix:** Use Docker secrets properly (already configured but verify usage)

### Issue 22: No Automated Security Scanning
**Priority: High**
**Labels: security, ci/cd**

No Snyk, Trivy, or similar in CI. Vulnerabilities may go undetected.

**Recommendation:**
```yaml
- name: Security scan
  run: |
    npm audit --audit-level=high
    docker scan meals-backend:latest
```

### Issue 23: No Rate Limiting at Nginx
**Priority: Medium**
**Labels: security, nginx**

Rate limiting only in Express. Should also limit at nginx for DDoS protection.

**Fix:**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

## Development Experience

### Issue 24: No Hot Reload in Docker Dev
**Priority: Low**
**Labels: dx, docker**

Development requires local node_modules. Docker dev mode would improve consistency.

**Recommendation:** docker-compose.dev.yml with volume mounts

### Issue 25: No Pre-commit Hooks
**Priority: Medium**
**Labels: dx, quality**

No husky/lint-staged. Code quality issues reach CI.

**Fix:**
```json
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
}
```

### Issue 26: Duplicate Terminal Processes
**Priority: Low**
**Labels: bug, dx**

Environment shows 2 backend dev servers running (Terminals 1 & 3). Port conflict.

**Fix:** Kill duplicate processes, investigate why multiple started.

## Cost Optimization

### Issue 27: No Image Layer Caching Strategy
**Priority: Medium**
**Labels: devops, cost**

Rebuilding entire images on every change. Wastes CI minutes and bandwidth.

**Fix:**
- Order Dockerfile commands by change frequency
- Use cache-from in builds
- Implement layer caching in CI

### Issue 28: Oversized Node Modules
**Priority: Medium**
**Labels: optimization, cost**

Backend: 81 dependencies, Frontend: 44 dependencies. Many may be unused.

**Recommendation:**
- Audit with `depcheck`
- Remove unused dependencies
- Use `pnpm prune` in production

### Issue 29: No Compression in Nginx
**Priority: Medium**
**Labels: performance, cost**

No gzip/brotli compression. Wasting bandwidth.

**Fix:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### Issue 30: No Image Optimization Pipeline
**Priority: Low**
**Labels: performance, cost**

User-uploaded images stored as-is. No resizing or compression.

**Recommendation:**
- Sharp for server-side optimization
- WebP conversion
- Multiple sizes for responsive images
- Lazy loading

---

## Summary

**Critical (Fix Immediately):**
- Missing CI/CD workflows (#1)
- No resource limits (#14)
- No centralized logging (#18)
- No metrics export (#19)
- Secrets exposure risk (#21)
- No security scanning (#22)

**High Priority (Next Sprint):**
- E2E tests disabled (#2)
- Large Docker images (#8)
- No DB connection pooling (#10)
- No automated backups (#11)

**Medium Priority (Backlog):**
- Docker optimization (#5, #6, #7, #9)
- Performance improvements (#12, #13, #16, #23, #27, #28, #29)
- Monitoring enhancements (#20)

**Low Priority (Nice to Have):**
- Scalability (#15, #17)
- DX improvements (#24, #25, #26)
- Advanced optimizations (#30)

**Estimated Impact:**
- 40% reduction in CI time
- 60% reduction in image sizes
- 50% improvement in deployment speed
- 30% reduction in resource costs
- 10x improvement in observability