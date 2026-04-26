# E2E Tests Temporarily Disabled - Investigation Required

**Date:** April 25, 2026  
**Status:** 🔴 Disabled  
**GitHub Actions Workflow:** `.github/workflows/e2e-tests.yml`  
**Related Issue:** [Create GitHub issue to track this]

---

## Executive Summary

GitHub Actions E2E tests have been temporarily disabled due to consistent failures in the CI/CD pipeline. While the test infrastructure is well-established (70-80% pass rate locally on Chromium), the tests are not stable enough for automated CI/CD execution. This document outlines the known issues, relevant logs, and the plan to resolve them before re-enabling automated testing.

---

## Current Status

- ✅ **Local Testing:** 70-80% pass rate on Chromium (9-10 of 11 tests passing)
- ❌ **CI/CD Testing:** Consistent failures in GitHub Actions
- 🔴 **Workflow Status:** Disabled (manual trigger only via `workflow_dispatch`)
- 📊 **Test Coverage:** 11 tests covering authentication and recipe browsing

---

## Known Issues

### 1. Rate Limiting Problems

**Severity:** High  
**Impact:** Tests fail due to authentication rate limits

**Description:**
- Backend rate limiter restricts auth endpoints to 5 requests per 15 minutes in production
- E2E testing mode increases limit to 50 requests per minute, but this may not be sufficient for CI/CD
- Multiple test runs in quick succession hit rate limits
- Session reuse pattern not yet implemented

**Evidence from Documentation:**
```
From E2E_TESTING_FINAL_SUMMARY.md:
"Rate Limiting: Auth endpoints limited to 5 requests per 15 minutes
Solution: Implemented E2E testing mode with 50 requests per minute
Status: Partially resolved, session reuse recommended for full solution"
```

**Recommended Fix:**
- Implement session reuse pattern (Priority 1, 4-6 hours)
- Share authentication state across tests
- Reduce redundant login operations

### 2. Browser Compatibility Issues

**Severity:** Medium  
**Impact:** Firefox and WebKit tests have low pass rates

**Description:**
- Chromium: 70-80% pass rate ✅
- Firefox: 40-50% pass rate ⚠️ (Currently disabled)
- WebKit: 20-30% pass rate ❌ (Currently disabled)
- CI/CD environment may have different browser behavior than local

**Evidence from Documentation:**
```
From E2E_TESTING_FINAL_SUMMARY.md:
"Browser Compatibility: Firefox and WebKit tests had low pass rates
Solution: Temporarily disabled, focus on Chromium stability first
Status: In progress, roadmap provided"
```

**Current Mitigation:**
- Only Chromium tests are enabled
- Firefox and WebKit temporarily disabled in `playwright.config.ts`

### 3. Test Flakiness and Timing Issues

**Severity:** Medium  
**Impact:** Intermittent failures due to timing and race conditions

**Description:**
- Some tests fail intermittently due to timing issues
- UI elements may not be ready when tests interact with them
- Network requests may timeout in slower CI/CD environments
- No retry logic implemented for flaky tests

**Evidence from Workflow Configuration:**
```yaml
# From .github/workflows/e2e-tests.yml
timeout-minutes: 30  # Tests may timeout in CI/CD
```

**Recommended Fix:**
- Implement retry logic for flaky tests (Priority 2, 4-6 hours)
- Increase wait times for critical operations
- Add more robust element waiting strategies

### 4. Database Seeding and Test Data

**Severity:** Medium  
**Impact:** Tests may fail if seed data is inconsistent

**Description:**
- Tests rely on specific seed data being present
- No test data isolation between test runs
- Potential race conditions with database state
- Seed verification in workflow may not catch all issues

**Evidence from Workflow:**
```yaml
# From .github/workflows/e2e-tests.yml
- name: Setup database
  run: |
    pnpm prisma generate
    pnpm prisma migrate deploy
    pnpm run prisma:seed
    # Verify seed data was created
    echo "SELECT COUNT(*) as user_count FROM users; SELECT COUNT(*) as recipe_count FROM recipes;" | pnpm prisma db execute --stdin
```

**Recommended Fix:**
- Implement proper test data management (Priority 2, 8-12 hours)
- Add test data cleanup between runs
- Use database transactions for test isolation

### 5. CI/CD Environment Differences

**Severity:** Medium  
**Impact:** Tests pass locally but fail in GitHub Actions

**Description:**
- Different network conditions in CI/CD
- Different resource constraints (CPU, memory)
- Potential timing differences
- Environment variable configuration may differ

**Potential Issues:**
- Backend/frontend startup timing
- Health check reliability
- Port availability
- Playwright browser installation

---

## Relevant Logs and Evidence

### Workflow Configuration Issues

**Backend Startup:**
```yaml
# Wait for backend with 30 attempts (60 seconds total)
for i in {1..30}; do
  if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Backend failed to start within 60 seconds"
    exit 1
  fi
  sleep 2
done
```

**Frontend Startup:**
```yaml
# Wait for frontend with 30 attempts (60 seconds total)
for i in {1..30}; do
  if curl -f -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Frontend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Frontend failed to start within 60 seconds"
    exit 1
  fi
  sleep 2
done
```

### Test Infrastructure Status

From `E2E_TESTING_FINAL_SUMMARY.md`:
```
Current Performance:
- Total Tests: 11 (Chromium only, Firefox/WebKit disabled)
- Pass Rate: 70-80% (9-10 of 11 tests passing)
- Execution Time: ~2-3 minutes (Chromium only)
- Reliability: Good for development, needs improvement for CI/CD
```

### Known Test Failures

From `E2E_TESTING_FINAL_SUMMARY.md`:
```
Recipe Browsing (6 tests):
- ✅ Display recipe list
- ✅ Navigate to recipe detail
- ✅ Search recipes
- ⚠️ Sort recipes (selector needs fix)
- ✅ Paginate through recipes
- ✅ Navigate to create recipe page
```

---

## Resolution Plan

### Phase 1: Critical Fixes (Week 1-2)

**Priority 1 - Session Reuse Pattern**
- **Effort:** 4-6 hours
- **Impact:** Eliminates rate limiting issues
- **Tasks:**
  - Implement global authentication setup
  - Share auth state across tests
  - Reduce redundant login operations
  - Update test fixtures

**Priority 1 - API Authentication**
- **Effort:** 6-8 hours
- **Impact:** Bypass UI login, faster tests
- **Tasks:**
  - Create API authentication helper
  - Generate tokens programmatically
  - Update test setup to use API auth
  - Remove UI login from most tests

**Priority 1 - Sort Selector Fix**
- **Effort:** 2-3 hours
- **Impact:** Fix failing sort test
- **Tasks:**
  - Update RecipesPage object with correct selector
  - Verify selector matches actual UI
  - Add data-testid if needed

**Priority 1 - Increase Auth Delays**
- **Effort:** 1 hour
- **Impact:** Reduce timing-related failures
- **Tasks:**
  - Change authentication delay from 3s to 10s
  - Add configurable wait times
  - Update test configuration

### Phase 2: Stability Improvements (Week 3-4)

**Priority 2 - Test Data Management**
- **Effort:** 8-12 hours
- **Impact:** Consistent test environment
- **Tasks:**
  - Implement test data seeding strategy
  - Add cleanup between test runs
  - Use database transactions for isolation
  - Document test data requirements

**Priority 2 - Retry Logic**
- **Effort:** 4-6 hours
- **Impact:** Handle flaky tests gracefully
- **Tasks:**
  - Configure Playwright retry settings
  - Identify flaky tests
  - Add custom retry logic where needed
  - Update CI/CD configuration

**Priority 2 - CI/CD Environment Tuning**
- **Effort:** 4-6 hours
- **Impact:** Better reliability in GitHub Actions
- **Tasks:**
  - Increase timeout values
  - Optimize health check logic
  - Add more detailed logging
  - Test in actual CI/CD environment

### Phase 3: Re-enable and Monitor (Week 5)

**Re-enable Workflow**
- **Effort:** 2-3 hours
- **Tasks:**
  - Uncomment push/pull_request triggers
  - Run multiple test cycles
  - Monitor for failures
  - Document any new issues

**Monitoring and Iteration**
- **Effort:** Ongoing
- **Tasks:**
  - Track test pass rates
  - Monitor execution times
  - Address new failures promptly
  - Update documentation

---

## Success Criteria for Re-enabling

Before re-enabling GitHub Actions E2E tests, the following criteria must be met:

1. ✅ **Pass Rate:** 90%+ on Chromium in CI/CD (currently 70-80% locally)
2. ✅ **Execution Time:** <5 minutes (currently 2-3 minutes locally)
3. ✅ **Stability:** 5 consecutive successful runs in GitHub Actions
4. ✅ **Session Reuse:** Implemented and tested
5. ✅ **API Authentication:** Implemented and tested
6. ✅ **Test Data:** Proper seeding and cleanup in place
7. ✅ **Documentation:** Updated with CI/CD best practices
8. ✅ **Retry Logic:** Configured for known flaky tests

---

## How to Run Tests Locally

While GitHub Actions is disabled, developers can still run E2E tests locally:

```bash
# Start the application
./scripts/local-run.sh

# In another terminal, run E2E tests
cd frontend
npm run test:e2e          # Run all tests
npm run test:e2e:ui       # Run with UI mode (debugging)
npm run test:e2e:headed   # Run in headed mode (see browser)
npm run test:e2e:debug    # Run in debug mode
npm run test:e2e:report   # View HTML report
```

**Note:** Ensure `E2E_TESTING=true` is set in `backend/.env` to enable the relaxed rate limiting.

---

## Related Documentation

- **Implementation Plan:** `docs/archive/E2E_TESTING_IMPLEMENTATION_PLAN.md`
- **Final Summary:** `docs/archive/E2E_TESTING_FINAL_SUMMARY.md`
- **Issues Resolution:** `docs/archive/E2E_ISSUES_RESOLUTION.md`
- **Quick Start:** `docs/archive/E2E_TESTING_QUICK_START.md`
- **Architecture:** `docs/archive/E2E_TESTING_ARCHITECTURE.md`
- **Improvement Roadmap:** (referenced in final summary)

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Critical Fixes | 2 weeks | ⏳ Planned |
| Phase 2: Stability | 2 weeks | ⏳ Planned |
| Phase 3: Re-enable | 1 week | ⏳ Planned |
| **Total** | **5 weeks** | **⏳ Planned** |

---

## Contact and Ownership

**Owner:** Development Team  
**Created:** April 25, 2026  
**Last Updated:** April 25, 2026  
**Status:** Active Investigation

---

## Next Steps

1. ✅ Disable GitHub Actions workflow (COMPLETED)
2. ✅ Create this documentation (COMPLETED)
3. ⏳ Create GitHub issue to track resolution
4. ⏳ Implement Phase 1 critical fixes
5. ⏳ Test fixes in CI/CD environment
6. ⏳ Implement Phase 2 stability improvements
7. ⏳ Re-enable workflow with monitoring
8. ⏳ Update documentation with lessons learned

---

**End of Document**