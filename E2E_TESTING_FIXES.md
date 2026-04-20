# E2E Testing Fixes and Configuration

## Issues Identified and Resolved

### 1. Rate Limiting Issues
**Problem:** Auth endpoints have strict rate limiting (5 requests per 15 minutes) which caused E2E tests to fail when multiple tests tried to authenticate.

**Solution:**
- Modified `backend/src/middleware/rateLimiter.ts` to detect E2E testing mode
- When `E2E_TESTING=true` environment variable is set:
  - Auth rate limit window: 1 minute (instead of 15 minutes)
  - Auth rate limit max: 50 requests (instead of 5)
- Added `E2E_TESTING=true` to `backend/.env`
- Updated `backend/.env.example` to document this variable
- Modified test scripts in `frontend/package.json` to set the variable

### 2. UI Selector Mismatches
**Problem:** Test selectors didn't match actual UI elements.

**Solutions:**
- **Dashboard heading:** Updated from `/dashboard/i` to `/welcome to meal planner/i` (actual h4 text)
- **Register link:** Updated from `/register/i` to `/don't have an account\? sign up/i` (actual link text)
- **Login button:** Already fixed to use `/sign in/i` instead of `/login/i`

### 3. Browser Compatibility (Firefox)
**Problem:** Firefox tests timing out on `networkidle` wait strategy.

**Solution:**
- Changed `LoginPage.goto()` to wait for visible login button instead of `networkidle`
- More reliable across different browsers

### 4. Sequential Test Execution
**Problem:** Parallel test execution hitting rate limits even with relaxed limits.

**Solution:**
- Set `workers: 1` in `playwright.config.ts` to run tests sequentially
- Added 3-second delay in auth fixture between authentication attempts

## Configuration Files Modified

1. **backend/src/middleware/rateLimiter.ts**
   - Added E2E testing mode detection
   - Relaxed rate limits for testing

2. **backend/.env** (and .env.example)
   - Added `E2E_TESTING=true` variable

3. **frontend/playwright.config.ts**
   - Set `workers: 1` for sequential execution
   - Configured proper base URL (localhost:5174)

4. **frontend/package.json**
   - Updated test scripts to set `E2E_TESTING=true`

5. **frontend/e2e/fixtures/auth.fixture.ts**
   - Added 3-second delay before authentication
   - Fixed selectors to match actual UI

6. **frontend/e2e/page-objects/LoginPage.ts**
   - Updated register link selector
   - Changed goto() to wait for visible button instead of networkidle

7. **frontend/e2e/tests/auth/login.spec.ts**
   - Updated dashboard heading assertion

## New Files Created

1. **scripts/run-e2e-tests.sh**
   - Helper script to run E2E tests with proper environment setup
   - Checks backend and frontend are running
   - Sets E2E_TESTING variable

## Running E2E Tests

### Method 1: Using npm scripts (Recommended)
```bash
# Make sure backend and frontend are running first
./scripts/run-local.sh

# In another terminal, run tests
cd frontend
npm run test:e2e          # Run all tests
npm run test:e2e:ui       # Run with UI mode
npm run test:e2e:headed   # Run in headed mode (see browser)
npm run test:e2e:debug    # Run in debug mode
```

### Method 2: Using helper script
```bash
# Make sure backend and frontend are running first
./scripts/run-local.sh

# In another terminal
./scripts/run-e2e-tests.sh
```

## Important Notes

1. **Backend must be restarted** after adding `E2E_TESTING=true` to `.env` for rate limit changes to take effect

2. **Sequential execution** is required due to rate limiting - tests run one at a time

3. **Test data cleanup** - Currently using existing test user (`test@example.com`). Future enhancement: implement proper test data cleanup between runs

4. **Rate limit timing** - With 50 requests per minute and 3-second delays, we can run approximately 20 authentication-based tests per minute

## Future Improvements

1. Implement test database seeding/cleanup
2. Add test user creation/deletion in fixtures
3. Consider using API authentication tokens instead of UI login for authenticated tests
4. Add retry logic for flaky tests
5. Implement parallel execution with proper test isolation

## Test Coverage Status

### Phase 1 (In Progress)
- ✅ Authentication flow tests (login, register navigation)
- ⏳ Recipe management tests (browse, filter, search)

### Phase 2 (Pending)
- ⏳ Meal planning flow tests
- ⏳ Grocery list flow tests
- ⏳ Recipe import flow tests

### CI/CD Integration (Pending)
- ⏳ GitHub Actions workflow
- ⏳ Automated test execution on PR
- ⏳ Test result reporting