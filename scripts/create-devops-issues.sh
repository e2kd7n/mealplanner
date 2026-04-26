#!/bin/bash

# Create GitHub issues for DevOps optimizations

gh issue create --title "CI/CD: Implement comprehensive CI/CD pipeline" \
  --body "Missing automated workflows for linting, testing, security scanning, and deployments.

**Current State:**
- Only E2E workflow exists (disabled)
- No linting/type checking on PR
- No security scanning
- No automated deployments

**Proposed Solution:**
- Add lint & type check workflow
- Add unit test workflow  
- Add security audit (npm audit, Snyk)
- Add Docker build validation
- Optimize dependency caching

**Impact:**
- Catch issues before merge
- Reduce manual testing burden
- Improve code quality
- Faster feedback loop

**Priority:** High
**Estimated Effort:** 2-3 days" \
  --label "devops,ci/cd,enhancement" \
  --assignee "@me"

gh issue create --title "CI/CD: Re-enable E2E tests in GitHub Actions" \
  --body "E2E tests exist but are disabled in CI (workflow_dispatch only).

**Current State:**
- Tests commented out in .github/workflows/e2e-tests.yml
- Regressions can slip through to production

**Proposed Solution:**
- Re-enable on pull_request and push to main
- Implement parallel test execution
- Add selective test runs based on changed files
- Optimize Playwright browser caching (currently wastes 30s)

**Impact:**
- Catch UI/integration bugs before merge
- Improve confidence in deployments

**Priority:** High
**Estimated Effort:** 1 day" \
  --label "testing,ci/cd,bug" \
  --assignee "@me"

gh issue create --title "Docker: Implement container registry and multi-arch builds" \
  --body "Images built locally on every deployment, wasting time and resources.

**Current State:**
- No registry push
- Builds from scratch every time
- No multi-arch support

**Proposed Solution:**
- Push to GitHub Container Registry
- Tag with commit SHA + semver
- Implement multi-arch builds (amd64/arm64)
- Cache layers between builds

**Impact:**
- 80% faster deployments
- Consistent images across environments
- Better Raspberry Pi support

**Priority:** Medium
**Estimated Effort:** 2 days" \
  --label "devops,docker,enhancement" \
  --assignee "@me"

gh issue create --title "Docker: Optimize image sizes (400MB → 200MB)" \
  --body "Backend Docker image is 400-600MB, can be reduced to ~200MB.

**Current Issues:**
- pnpm installed 3 times
- Prisma generated twice
- No BuildKit cache mounts
- Dev dependencies in production

**Proposed Optimizations:**
1. Use distroless base image
2. Remove pnpm after install
3. Implement BuildKit cache mounts
4. Copy only required node_modules files
5. Single Prisma generation

**Impact:**
- 50-60% smaller images
- Faster pulls and deployments
- Lower storage costs
- Better Pi performance

**Priority:** High
**Estimated Effort:** 1 day" \
  --label "docker,optimization,performance" \
  --assignee "@me"

gh issue create --title "Database: Add connection pooling and performance indexes" \
  --body "Missing critical database optimizations for production workloads.

**Current Issues:**
1. No explicit connection pool configuration
2. Missing composite indexes for common queries
3. No slow query monitoring

**Proposed Changes:**

**Connection Pooling:**
\`\`\`prisma
datasource db {
  provider = \"postgresql\"
  url      = env(\"DATABASE_URL\")
  connection_limit = 10
  pool_timeout = 20
}
\`\`\`

**Missing Indexes:**
- (userId, createdAt) on recipes
- (mealPlanId, date) on planned_meals  
- (userId, status) on grocery_lists

**Monitoring:**
- Enable Prisma query logging
- Alert on queries >100ms

**Impact:**
- Handle 10x more concurrent users
- 50% faster query response times
- Prevent connection exhaustion

**Priority:** High
**Estimated Effort:** 1 day" \
  --label "database,performance,enhancement" \
  --assignee "@me"

gh issue create --title "DevOps: Implement automated database backups" \
  --body "Backup script exists but no automation. Risk of data loss.

**Current State:**
- Manual backup script in scripts/backup-database.sh
- No scheduled backups
- No retention policy
- No backup verification

**Proposed Solution:**
- Cron job for daily backups
- Retention: 7 daily, 4 weekly, 12 monthly
- Automated backup verification
- Off-site storage (S3/B2)
- Restore testing

**Impact:**
- Protect against data loss
- Meet compliance requirements
- Enable point-in-time recovery

**Priority:** High
**Estimated Effort:** 1 day" \
  --label "devops,database,reliability" \
  --assignee "@me"

gh issue create --title "Infrastructure: Add resource limits to containers" \
  --body "Containers can consume unlimited resources, risking system stability.

**Current State:**
- No CPU/memory limits in podman-compose.yml
- Containers can starve each other
- No resource reservations

**Proposed Solution:**
\`\`\`yaml
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
\`\`\`

**Impact:**
- Prevent resource exhaustion
- Predictable performance
- Better multi-tenant support

**Priority:** High
**Estimated Effort:** 2 hours" \
  --label "devops,infrastructure,reliability" \
  --assignee "@me"

gh issue create --title "Monitoring: Implement centralized logging and metrics" \
  --body "No log aggregation or metrics export. Limited observability.

**Current Issues:**
1. Logs scattered across containers
2. No search or aggregation
3. No application metrics
4. No alerting

**Proposed Solution:**

**Logging:**
- Loki for log aggregation
- Structured JSON logging
- 30-day retention
- Alert on error patterns

**Metrics:**
- Prometheus for metrics
- Grafana for visualization
- Track: request rates, errors, latency, resources
- Alert on anomalies

**Impact:**
- 10x faster debugging
- Proactive issue detection
- Better capacity planning
- Meet SLA requirements

**Priority:** High
**Estimated Effort:** 3 days" \
  --label "monitoring,devops,observability" \
  --assignee "@me"

gh issue create --title "Security: Implement automated security scanning" \
  --body "No automated security scanning in CI. Vulnerabilities may go undetected.

**Current State:**
- Manual security audits only
- No dependency scanning
- No container scanning
- No SAST/DAST

**Proposed Solution:**
1. npm audit in CI (fail on high/critical)
2. Snyk for dependency scanning
3. Trivy for container scanning
4. CodeQL for SAST
5. OWASP ZAP for DAST

**Impact:**
- Catch vulnerabilities before production
- Automated CVE notifications
- Compliance requirements
- Reduce security debt

**Priority:** High
**Estimated Effort:** 2 days" \
  --label "security,ci/cd,enhancement" \
  --assignee "@me"

gh issue create --title "Performance: Add nginx compression and caching" \
  --body "Missing nginx optimizations wasting bandwidth and slowing responses.

**Current Issues:**
1. No gzip/brotli compression
2. No browser caching headers
3. Frontend proxied instead of served directly
4. No rate limiting at nginx level

**Proposed Changes:**

**Compression:**
\`\`\`nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
brotli on;
\`\`\`

**Caching:**
\`\`\`nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control \"public, immutable\";
}
\`\`\`

**Rate Limiting:**
\`\`\`nginx
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
\`\`\`

**Impact:**
- 70% bandwidth reduction
- 40% faster page loads
- DDoS protection
- Lower hosting costs

**Priority:** Medium
**Estimated Effort:** 4 hours" \
  --label "performance,nginx,optimization" \
  --assignee "@me"

echo "✅ Created 10 DevOps optimization issues"
