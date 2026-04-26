# GitHub Issues for E2E Test Re-enablement

This document contains the GitHub issue templates to track the work needed to re-enable E2E tests in GitHub Actions.

---

## Main Tracking Issue

**Title:** Re-enable E2E Tests in GitHub Actions

**Labels:** `testing`, `ci/cd`, `priority: high`, `type: infrastructure`

**Body:**

```markdown
## Overview

GitHub Actions E2E tests have been temporarily disabled due to consistent failures in the CI/CD pipeline. While tests pass 70-80% locally on Chromium, they are not stable enough for automated CI/CD execution.

**Related Documentation:** `docs/E2E_TESTS_DISABLED.md`

## Current Status

- ✅ Local Testing: 70-80% pass rate on Chromium (9-10 of 11 tests passing)
- ❌ CI/CD Testing: Consistent failures in GitHub Actions
- 🔴 Workflow Status: Disabled (manual trigger only)
- 📊 Test Coverage: 11 tests covering authentication and recipe browsing

## Known Issues

1. **Rate Limiting** - Auth endpoints hit rate limits during test runs
2. **Browser Compatibility** - Firefox (40-50%) and WebKit (20-30%) have low pass rates
3. **Test Flakiness** - Intermittent failures due to timing and race conditions
4. **Database Seeding** - Inconsistent test data between runs
5. **CI/CD Environment** - Tests pass locally but fail in GitHub Actions

## Resolution Plan

### Phase 1: Critical Fixes (Weeks 1-2)
- [ ] #[ISSUE_NUMBER] Implement session reuse pattern
- [ ] #[ISSUE_NUMBER] Add API authentication for tests
- [ ] #[ISSUE_NUMBER] Fix sort selector in RecipesPage
- [ ] #[ISSUE_NUMBER] Increase authentication delays

### Phase 2: Stability Improvements (Weeks 3-4)
- [ ] #[ISSUE_NUMBER] Implement test data management
- [ ] #[ISSUE_NUMBER] Add retry logic for flaky tests
- [ ] #[ISSUE_NUMBER] Tune CI/CD environment configuration

### Phase 3: Re-enable and Monitor (Week 5)
- [ ] Re-enable GitHub Actions workflow
- [ ] Monitor test pass rates
- [ ] Document lessons learned

## Success Criteria

Before re-enabling, we must achieve:
- ✅ 90%+ pass rate on Chromium in CI/CD
- ✅ <5 minute execution time
- ✅ 5 consecutive successful runs in GitHub Actions
- ✅ Session reuse implemented
- ✅ API authentication implemented
- ✅ Proper test data management

## Timeline

**Estimated Duration:** 5 weeks
- Phase 1: 2 weeks
- Phase 2: 2 weeks
- Phase 3: 1 week

## How to Test Locally

```bash
# Start the application
./scripts/local-run.sh

# In another terminal, run E2E tests
cd frontend
npm run test:e2e
```

**Note:** Ensure `E2E_TESTING=true` is set in `backend/.env`
```

---

## Issue 1: Implement Session Reuse Pattern

**Title:** E2E Tests: Implement session reuse pattern to avoid rate limiting

**Labels:** `testing`, `priority: high`, `type: enhancement`

**Body:**

```markdown
## Problem

E2E tests currently perform a full login for each test, causing rate limiting issues:
- Backend rate limiter restricts auth endpoints to 5 requests per 15 minutes
- E2E mode increases to 50 requests per minute, but still insufficient
- Multiple test runs in quick succession hit rate limits
- Slows down test execution significantly

## Solution

Implement Playwright's global setup pattern to authenticate once and reuse the session across all tests.

## Implementation Tasks

- [ ] Create `frontend/e2e/global-setup.ts` for authentication
- [ ] Store auth state in `.auth/user.json`
- [ ] Update `playwright.config.ts` to use global setup
- [ ] Modify test fixtures to use stored auth state
- [ ] Remove redundant login operations from individual tests
- [ ] Update documentation

## Expected Benefits

- Eliminate rate limiting issues
- Reduce test execution time by 30-40%
- More reliable test runs
- Better CI/CD performance

## Acceptance Criteria

- [ ] Tests run without hitting rate limits
- [ ] Authentication happens once per test run
- [ ] All tests still pass with shared session
- [ ] Documentation updated

## References

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- Related: Parent tracking issue #[ISSUE_NUMBER]
- Documentation: `docs/E2E_TESTS_DISABLED.md`

**Estimated Effort:** 4-6 hours
```

---

## Issue 2: Add API Authentication for E2E Tests

**Title:** E2E Tests: Add API authentication to bypass UI login

**Labels:** `testing`, `priority: high`, `type: enhancement`

**Body:**

```markdown
## Problem

Tests currently authenticate through the UI login flow, which:
- Is slow (adds 2-3 seconds per test)
- Contributes to rate limiting issues
- Is less reliable than API authentication
- Makes tests more brittle

## Solution

Create API authentication helper that generates JWT tokens programmatically, bypassing the UI login entirely.

## Implementation Tasks

- [ ] Create `frontend/e2e/helpers/api-auth.ts`
- [ ] Implement `generateAuthToken()` function
- [ ] Add direct API call to `/api/auth/login`
- [ ] Store tokens in Playwright storage state
- [ ] Update test fixtures to use API auth
- [ ] Remove UI login from test setup
- [ ] Keep one UI login test for coverage
- [ ] Update documentation

## Expected Benefits

- Faster test execution (save 2-3 seconds per test)
- More reliable authentication
- Reduced rate limiting pressure
- Cleaner test code

## Acceptance Criteria

- [ ] API authentication helper created and tested
- [ ] Tests use API auth instead of UI login
- [ ] At least one test still covers UI login flow
- [ ] All tests pass with API authentication
- [ ] Documentation updated

## References

- Related: Parent tracking issue #[ISSUE_NUMBER]
- Related: Session reuse issue #[ISSUE_NUMBER]
- Documentation: `docs/E2E_TESTS_DISABLED.md`

**Estimated Effort:** 6-8 hours
```

---

## Issue 3: Fix Sort Selector in Recipe Browse Tests

**Title:** E2E Tests: Fix sort dropdown selector in RecipesPage

**Labels:** `testing`, `priority: high`, `type: bug`

**Body:**

```markdown
## Problem

The sort recipes test is failing because the selector doesn't match the actual UI element:

```
Recipe Browsing (6 tests):
- ⚠️ Sort recipes (selector needs fix)
```

## Root Cause

The `RecipesPage` page object uses an incorrect selector for the sort dropdown that doesn't match the current UI implementation.

## Solution

Update the selector in `RecipesPage.ts` to match the actual sort dropdown element.

## Implementation Tasks

- [ ] Inspect the actual sort dropdown in BrowseRecipes page
- [ ] Update selector in `frontend/e2e/page-objects/RecipesPage.ts`
- [ ] Consider adding `data-testid="recipe-sort"` to the UI component
- [ ] Test the updated selector locally
- [ ] Verify test passes consistently
- [ ] Update documentation if needed

## Files to Modify

- `frontend/e2e/page-objects/RecipesPage.ts`
- `frontend/src/pages/BrowseRecipes.tsx` (if adding data-testid)

## Acceptance Criteria

- [ ] Sort test passes consistently (10/10 runs)
- [ ] Selector is robust and maintainable
- [ ] Documentation updated if needed

## References

- Related: Parent tracking issue #[ISSUE_NUMBER]
- Documentation: `docs/archive/E2E_TESTING_FINAL_SUMMARY.md`

**Estimated Effort:** 2-3 hours
```

---

## Issue 4: Increase Authentication Delays in E2E Tests

**Title:** E2E Tests: Increase authentication delays to reduce timing failures

**Labels:** `testing`, `priority: high`, `type: enhancement`

**Body:**

```markdown
## Problem

Tests occasionally fail due to insufficient wait times after authentication:
- Current delay: 3 seconds
- Some environments need more time for auth to complete
- Causes intermittent test failures

## Solution

Increase authentication delay from 3 seconds to 10 seconds and make it configurable.

## Implementation Tasks

- [ ] Update auth fixture delay from 3s to 10s
- [ ] Add `AUTH_DELAY_MS` environment variable
- [ ] Update `playwright.config.ts` with configurable delay
- [ ] Test with various delay values
- [ ] Document the configuration option
- [ ] Update CI/CD workflow if needed

## Files to Modify

- `frontend/e2e/fixtures/auth.fixture.ts`
- `frontend/playwright.config.ts`
- `.github/workflows/e2e-tests.yml` (when re-enabled)

## Acceptance Criteria

- [ ] Authentication delay increased to 10s
- [ ] Delay is configurable via environment variable
- [ ] Tests pass consistently with new delay
- [ ] Documentation updated

## References

- Related: Parent tracking issue #[ISSUE_NUMBER]
- Documentation: `docs/E2E_TESTS_DISABLED.md`

**Estimated Effort:** 1 hour
```

---

## Issue 5: Implement Test Data Management

**Title:** E2E Tests: Implement proper test data management and cleanup

**Labels:** `testing`, `priority: medium`, `type: enhancement`

**Body:**

```markdown
## Problem

Current test data management has issues:
- Tests rely on specific seed data being present
- No test data isolation between runs
- Potential race conditions with database state
- Cleanup is not consistent

## Solution

Implement proper test data management with seeding, isolation, and cleanup.

## Implementation Tasks

- [ ] Create test data factory functions
- [ ] Implement database transaction wrapper for tests
- [ ] Add cleanup hooks in test fixtures
- [ ] Create dedicated test database schema
- [ ] Update seed scripts for test environment
- [ ] Add data verification in CI/CD workflow
- [ ] Document test data requirements
- [ ] Update test setup documentation

## Expected Benefits

- Consistent test environment
- Better test isolation
- Reduced flakiness
- Easier debugging

## Acceptance Criteria

- [ ] Test data is created and cleaned up properly
- [ ] Tests don't interfere with each other
- [ ] Database state is predictable
- [ ] Documentation updated

## References

- Related: Parent tracking issue #[ISSUE_NUMBER]
- Documentation: `docs/E2E_TESTS_DISABLED.md`

**Estimated Effort:** 8-12 hours
```

---

## Issue 6: Add Retry Logic for Flaky Tests

**Title:** E2E Tests: Add retry logic to handle flaky tests

**Labels:** `testing`, `priority: medium`, `type: enhancement`

**Body:**

```markdown
## Problem

Some tests fail intermittently due to:
- Network timing issues
- UI rendering delays
- Race conditions
- External service availability

## Solution

Configure Playwright retry settings and add custom retry logic where needed.

## Implementation Tasks

- [ ] Configure global retry settings in `playwright.config.ts`
- [ ] Identify consistently flaky tests
- [ ] Add test-specific retry configuration
- [ ] Implement custom retry logic for known issues
- [ ] Add retry reporting to test results
- [ ] Document retry strategy
- [ ] Update CI/CD configuration

## Configuration Example

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  // ... other config
});
```

## Acceptance Criteria

- [ ] Retry logic configured and tested
- [ ] Flaky tests identified and handled
- [ ] Test reports show retry information
- [ ] Documentation updated

## References

- [Playwright Retries](https://playwright.dev/docs/test-retries)
- Related: Parent tracking issue #[ISSUE_NUMBER]
- Documentation: `docs/E2E_TESTS_DISABLED.md`

**Estimated Effort:** 4-6 hours
```

---

## Issue 7: Tune CI/CD Environment for E2E Tests

**Title:** E2E Tests: Optimize GitHub Actions configuration for reliability

**Labels:** `testing`, `ci/cd`, `priority: medium`, `type: enhancement`

**Body:**

```markdown
## Problem

Tests pass locally but fail in GitHub Actions due to:
- Different network conditions
- Different resource constraints
- Timing differences
- Environment configuration issues

## Solution

Optimize the GitHub Actions workflow for E2E test reliability.

## Implementation Tasks

- [ ] Increase timeout values in workflow
- [ ] Optimize health check logic
- [ ] Add more detailed logging
- [ ] Configure resource limits appropriately
- [ ] Add test result artifacts
- [ ] Improve error reporting
- [ ] Add workflow status badges
- [ ] Document CI/CD best practices

## Workflow Improvements

- [ ] Increase backend startup timeout
- [ ] Increase frontend startup timeout
- [ ] Add retry logic for service startup
- [ ] Improve log collection on failure
- [ ] Add screenshot/video artifacts
- [ ] Configure proper cleanup

## Acceptance Criteria

- [ ] Tests run reliably in GitHub Actions
- [ ] Failures are well-documented with logs
- [ ] Artifacts are properly collected
- [ ] Documentation updated

## References

- Related: Parent tracking issue #[ISSUE_NUMBER]
- Workflow: `.github/workflows/e2e-tests.yml`
- Documentation: `docs/E2E_TESTS_DISABLED.md`

**Estimated Effort:** 4-6 hours
```

---

## How to Create These Issues

1. Copy each issue template above
2. Create a new GitHub issue
3. Paste the template content
4. Update `#[ISSUE_NUMBER]` references with actual issue numbers
5. Assign appropriate team members
6. Link issues together using GitHub's issue linking

## Issue Dependencies

```
Main Tracking Issue
├── Issue 1: Session Reuse (blocks Issue 2)
├── Issue 2: API Authentication (depends on Issue 1)
├── Issue 3: Fix Sort Selector (independent)
├── Issue 4: Increase Auth Delays (independent)
├── Issue 5: Test Data Management (independent)
├── Issue 6: Retry Logic (independent)
└── Issue 7: CI/CD Tuning (depends on Issues 1-6)
```

---

**Created:** April 25, 2026  
**Status:** Ready to create in GitHub