# GitHub Actions Workflow Analysis and Remediation Plan

## Overview

Analysis of the GitHub Actions E2E testing workflow to identify and resolve consistency issues.

## Current Workflow Status

**File:** `.github/workflows/e2e-tests.yml`

### Workflow Configuration

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches  
- Manual workflow dispatch

**Environment:**
- Runner: `ubuntu-latest`
- Timeout: 30 minutes
- Node.js: 20
- Package Manager: pnpm
- Database: PostgreSQL 15

### Workflow Steps

1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Install pnpm
4. ✅ Install backend dependencies
5. ✅ Install frontend dependencies
6. ✅ Setup database (Prisma migrate + seed)
7. ✅ Start backend server
8. ✅ Start frontend server
9. ✅ Create auth directory
10. ✅ Install Playwright browsers
11. ✅ Run E2E tests
12. ✅ Upload test results
13. ✅ Upload test videos (on failure)
14. ✅ Cleanup processes

## Potential Issues Identified

### 1. Race Conditions in Server Startup

**Issue:** Backend and frontend servers start in background with basic health checks

**Current Implementation:**
```yaml
# Backend startup
pnpm dev &
echo $! > backend.pid
timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

# Frontend startup  
pnpm run dev &
echo $! > frontend.pid
timeout 60 bash -c 'until curl -f http://localhost:5173; do sleep 2; done'
```

**Problems:**
- Health check may pass before server is fully ready
- No verification of database connectivity
- No verification of API endpoints
- Vite dev server may report ready before HMR is initialized

**Impact:** Intermittent test failures, flaky tests

### 2. Missing Health Endpoint

**Issue:** Backend health check endpoint may not exist

**Current:** Workflow assumes `/health` endpoint exists
**Reality:** Need to verify this endpoint is implemented

**Impact:** Health check fails, workflow times out

### 3. Database Seeding Timing

**Issue:** Database seed may not complete before tests run

**Current Implementation:**
```yaml
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run prisma:seed
```

**Problems:**
- No verification seed completed successfully
- No check for required test data
- Seed runs before server starts (good) but no validation

**Impact:** Tests fail due to missing test data

### 4. Environment Variable Inconsistencies

**Issue:** Environment variables may not match local development

**Backend ENV:**
```yaml
DATABASE_URL: postgresql://mealplanner:mealplanner_password@localhost:5432/mealplanner
JWT_SECRET: test-jwt-secret-for-ci
JWT_REFRESH_SECRET: test-jwt-refresh-secret-for-ci
SESSION_SECRET: test-session-secret-for-ci
NODE_ENV: test
E2E_TESTING: true
PORT: 3000
CORS_ORIGIN: http://localhost:5173
```

**Frontend ENV:**
```yaml
VITE_API_URL: http://localhost:3000
```

**Missing:**
- CSRF configuration
- Rate limiting settings
- Image upload paths
- Spoonacular API key (if needed for tests)

**Impact:** Tests may behave differently than local development

### 5. Process Cleanup Issues

**Issue:** Cleanup may not kill all processes

**Current Implementation:**
```yaml
if [ -f backend/backend.pid ]; then
  kill $(cat backend/backend.pid) || true
fi
if [ -f frontend/frontend.pid ]; then
  kill $(cat frontend/frontend.pid) || true
fi
```

**Problems:**
- PID files may not be created if startup fails
- Child processes may not be killed
- Ports may remain occupied
- Database connections may not close

**Impact:** Subsequent runs fail, resource leaks

### 6. Playwright Browser Installation

**Issue:** Only Chromium is installed

**Current:** `npx playwright install --with-deps chromium`

**Problems:**
- Tests may be configured for multiple browsers
- Firefox/WebKit tests would fail
- Inconsistent with local development

**Impact:** Partial test coverage, unexpected failures

### 7. Test Artifacts

**Issue:** Artifacts may be too large or incomplete

**Current:**
- Playwright report: 30 day retention
- Test videos: 7 day retention (failure only)

**Problems:**
- No screenshots on success
- No trace files
- Large video files may exceed limits

**Impact:** Difficult to debug intermittent failures

## Remediation Plan

### Priority 1: Critical Fixes (Immediate)

#### 1.1 Add Backend Health Endpoint

**File:** `backend/src/server.ts` or `backend/src/app.ts`

```typescript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected', // Add actual DB check
  });
});
```

#### 1.2 Improve Server Readiness Checks

**File:** `.github/workflows/e2e-tests.yml`

```yaml
- name: Start backend server
  working-directory: backend
  env:
    # ... existing env vars
  run: |
    pnpm dev > backend.log 2>&1 &
    echo $! > backend.pid
    
    # Wait for server to be ready
    echo "Waiting for backend..."
    timeout 60 bash -c '
      until curl -f http://localhost:3000/health && \
            curl -f http://localhost:3000/api/csrf-token; do
        echo "Backend not ready, waiting..."
        sleep 2
      done
    '
    echo "Backend is ready!"
    
- name: Start frontend server
  working-directory: frontend
  env:
    VITE_API_URL: http://localhost:3000
  run: |
    pnpm run dev > frontend.log 2>&1 &
    echo $! > frontend.pid
    
    # Wait for frontend to be ready
    echo "Waiting for frontend..."
    timeout 60 bash -c '
      until curl -f http://localhost:5173 && \
            curl -s http://localhost:5173 | grep -q "root"; do
        echo "Frontend not ready, waiting..."
        sleep 2
      done
    '
    echo "Frontend is ready!"
    
    # Additional wait for HMR
    sleep 5
```

#### 1.3 Verify Database Seed

```yaml
- name: Setup database
  working-directory: backend
  env:
    DATABASE_URL: postgresql://mealplanner:mealplanner_password@localhost:5432/mealplanner
  run: |
    pnpm prisma generate
    pnpm prisma migrate deploy
    pnpm run prisma:seed
    
    # Verify seed data
    echo "Verifying test data..."
    pnpm prisma db execute --stdin <<EOF
    SELECT COUNT(*) as user_count FROM users;
    SELECT COUNT(*) as recipe_count FROM recipes;
    EOF
```

### Priority 2: Reliability Improvements (This Week)

#### 2.1 Add Comprehensive Logging

```yaml
- name: Upload server logs
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: server-logs
    path: |
      backend/backend.log
      frontend/frontend.log
    retention-days: 7
```

#### 2.2 Improve Process Cleanup

```yaml
- name: Cleanup
  if: always()
  run: |
    echo "Cleaning up processes..."
    
    # Kill backend
    if [ -f backend/backend.pid ]; then
      PID=$(cat backend/backend.pid)
      kill -TERM $PID 2>/dev/null || true
      sleep 2
      kill -KILL $PID 2>/dev/null || true
    fi
    
    # Kill frontend
    if [ -f frontend/frontend.pid ]; then
      PID=$(cat frontend/frontend.pid)
      kill -TERM $PID 2>/dev/null || true
      sleep 2
      kill -KILL $PID 2>/dev/null || true
    fi
    
    # Kill any remaining node processes
    pkill -f "node.*backend" || true
    pkill -f "node.*frontend" || true
    pkill -f "vite" || true
    
    # Verify ports are free
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
```

#### 2.3 Add Retry Logic for Flaky Tests

**File:** `frontend/playwright.config.ts`

```typescript
export default defineConfig({
  // ... existing config
  retries: process.env.CI ? 2 : 0, // Retry twice in CI
  workers: process.env.CI ? 1 : undefined, // Single worker in CI for stability
});
```

### Priority 3: Enhanced Monitoring (Next Sprint)

#### 3.1 Add Test Timing Metrics

```yaml
- name: Run E2E tests
  working-directory: frontend
  env:
    E2E_TESTING: true
    BASE_URL: http://localhost:5173
  run: |
    START_TIME=$(date +%s)
    pnpm run test:e2e
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "Test duration: ${DURATION}s"
    echo "test_duration=${DURATION}" >> $GITHUB_OUTPUT
```

#### 3.2 Add Slack/Email Notifications

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'E2E tests failed on ${{ github.ref }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### 3.3 Add Test Result Summary

```yaml
- name: Test Summary
  if: always()
  uses: test-summary/action@v2
  with:
    paths: frontend/test-results/junit.xml
```

## Implementation Checklist

### Immediate (Today)
- [ ] Verify `/health` endpoint exists in backend
- [ ] Update workflow with improved readiness checks
- [ ] Add server log uploads
- [ ] Test workflow manually

### This Week
- [ ] Implement improved process cleanup
- [ ] Add retry logic to Playwright config
- [ ] Add database seed verification
- [ ] Document troubleshooting steps

### Next Sprint
- [ ] Add test timing metrics
- [ ] Implement notification system
- [ ] Add test result summaries
- [ ] Create workflow monitoring dashboard

## Testing the Fixes

### Local Testing

```bash
# Simulate CI environment locally
export CI=true
export E2E_TESTING=true
export NODE_ENV=test

# Run the workflow steps manually
cd backend && pnpm install
cd ../frontend && pnpm install

# Start services
cd ../backend && pnpm dev &
cd ../frontend && pnpm run dev &

# Wait and test
sleep 10
curl http://localhost:3000/health
curl http://localhost:5173

# Run tests
cd frontend && pnpm run test:e2e
```

### Monitoring Workflow Runs

1. Go to GitHub Actions tab
2. Check recent workflow runs
3. Review logs for each step
4. Check artifact uploads
5. Monitor success rate over time

## Success Metrics

- **Target:** 95%+ workflow success rate
- **Current:** Unknown (needs baseline)
- **Measure:** Track over 30 days

**Key Metrics:**
- Workflow success rate
- Average test duration
- Flaky test count
- Time to fix failures

## Related Files

- `.github/workflows/e2e-tests.yml` - Main workflow
- `frontend/playwright.config.ts` - Test configuration
- `backend/src/server.ts` - Health endpoint
- `docs/E2E_TESTING_*.md` - Test documentation

## Made with Bob