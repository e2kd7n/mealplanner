/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Testing Documentation

This directory contains all testing-related documentation for the Meal Planner application.

## Quick Reference

### Common Tasks
- **Set up testing environment**: See [Testing Environment](TESTING_ENVIRONMENT.md)
- **Run E2E tests**: `cd frontend && pnpm test:e2e`
- **Run specific test**: `cd frontend && pnpm test:e2e -- tests/path/to/test.spec.ts`
- **Debug tests**: `cd frontend && pnpm test:e2e:debug`
- **View test report**: `cd frontend && pnpm exec playwright show-report`

## Documentation Files

### [Testing Environment](TESTING_ENVIRONMENT.md)
Comprehensive testing environment setup and configuration:
- Playwright E2E testing setup
- Test environment configuration
- Authentication handling
- Test execution
- Debugging tests
- CI/CD integration
- Best practices

**Key Features**:
- Session reuse for authenticated tests
- Sequential test execution (workers: 1)
- Configurable auth delay via AUTH_DELAY_MS
- Separate auth and authenticated test suites
- Automatic screenshot and video on failure

**Test Structure**:
```
frontend/e2e/
├── tests/
│   ├── auth/           # Authentication tests (no saved session)
│   └── authenticated/  # Tests requiring authentication
├── .auth/
│   └── user.json      # Saved authentication state
└── playwright.config.ts
```

## Testing Strategy

### Test Types

#### End-to-End (E2E) Tests
- **Tool**: Playwright
- **Location**: `frontend/e2e/tests/`
- **Purpose**: Test complete user workflows
- **Scope**: Frontend + Backend + Database
- **Execution**: Sequential (workers: 1)

**Test Categories**:
- Authentication flows
- Recipe management (CRUD)
- Meal planning
- Search functionality
- Recipe browsing
- User settings

#### Unit Tests
- **Tool**: Vitest (frontend), Jest (backend)
- **Location**: `*.test.ts` files alongside source
- **Purpose**: Test individual functions/components
- **Scope**: Isolated units
- **Execution**: Parallel

#### Integration Tests
- **Tool**: Vitest/Jest
- **Location**: `*.integration.test.ts`
- **Purpose**: Test component interactions
- **Scope**: Multiple units working together
- **Execution**: Parallel

### Test Execution

#### Run All E2E Tests
```bash
cd frontend
pnpm test:e2e
```

#### Run Specific Test File
```bash
cd frontend
pnpm test:e2e -- tests/authenticated/recipes.spec.ts
```

#### Run Tests in UI Mode
```bash
cd frontend
pnpm test:e2e:ui
```

#### Debug Tests
```bash
cd frontend
pnpm test:e2e:debug
```

#### View Test Report
```bash
cd frontend
pnpm exec playwright show-report
```

## E2E Testing Architecture

### Session Reuse
- Authentication state saved in `e2e/.auth/user.json`
- Auth tests run WITHOUT saved session
- Authenticated tests use saved session
- Reduces test execution time
- Avoids rate limiting

### Test Organization
```
e2e/tests/
├── auth/
│   ├── login.spec.ts          # Login flow
│   ├── register.spec.ts       # Registration flow
│   └── logout.spec.ts         # Logout flow
└── authenticated/
    ├── recipes.spec.ts        # Recipe CRUD
    ├── meal-planning.spec.ts  # Meal planning
    ├── search.spec.ts         # Search functionality
    └── browse.spec.ts         # Recipe browsing
```

### Authentication Flow
1. Auth tests run first (no saved session)
2. Login test saves authentication state
3. Authenticated tests load saved state
4. Tests run sequentially to avoid conflicts

### Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  workers: 1,                    // Sequential execution
  retries: 2,                    // Retry failed tests
  timeout: 30000,                // 30 second timeout
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Test Best Practices

### Writing Tests
1. **Use descriptive test names** - Clear what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test user behavior** - Not implementation details
4. **Use data-testid** - For reliable selectors
5. **Avoid hardcoded waits** - Use Playwright's auto-waiting
6. **Clean up after tests** - Delete created data
7. **Make tests independent** - No dependencies between tests

### Test Structure
```typescript
test.describe('Recipe Management', () => {
  test('should create a new recipe', async ({ page }) => {
    // Arrange
    await page.goto('/recipes/new');
    
    // Act
    await page.fill('[data-testid="recipe-title"]', 'Test Recipe');
    await page.click('[data-testid="save-button"]');
    
    // Assert
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

### Selectors
**Priority Order**:
1. `data-testid` attributes (most reliable)
2. ARIA roles and labels
3. Text content
4. CSS selectors (least reliable)

**Example**:
```typescript
// Good - data-testid
await page.click('[data-testid="submit-button"]');

// Good - ARIA role
await page.click('button[role="button"]:has-text("Submit")');

// Avoid - CSS classes (can change)
await page.click('.btn-primary');
```

### Assertions
```typescript
// Visibility
await expect(page.locator('[data-testid="element"]')).toBeVisible();

// Text content
await expect(page.locator('[data-testid="title"]')).toHaveText('Expected Text');

// Count
await expect(page.locator('[data-testid="item"]')).toHaveCount(5);

// URL
await expect(page).toHaveURL('/expected-path');

// Attribute
await expect(page.locator('[data-testid="input"]')).toHaveAttribute('disabled');
```

## Debugging Tests

### Debug Mode
```bash
cd frontend
pnpm test:e2e:debug
```
- Opens Playwright Inspector
- Step through tests
- Inspect selectors
- View console logs

### UI Mode
```bash
cd frontend
pnpm test:e2e:ui
```
- Visual test runner
- Watch mode
- Time travel debugging
- Network inspection

### Screenshots and Videos
- Automatically captured on failure
- Located in `frontend/test-results/`
- Screenshots: `test-results/*/test-failed-1.png`
- Videos: `test-results/*/video.webm`

### Console Logs
```typescript
// Add console logs in tests
console.log('Current URL:', page.url());

// Listen to page console
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### Test Artifacts
- Test reports uploaded as artifacts
- Screenshots and videos on failure
- Available for 30 days

### Test Status
- Required checks for PR merge
- Failing tests block deployment
- Flaky tests retried automatically

## Test Coverage

### Current Coverage
- Authentication flows: ✅ Complete
- Recipe CRUD: ✅ Complete
- Meal planning: ✅ Complete
- Search functionality: ✅ Complete
- Recipe browsing: ✅ Complete

### Coverage Goals
- E2E: Cover all critical user paths
- Unit: 80%+ code coverage
- Integration: Key component interactions

### Coverage Reports
```bash
# Frontend unit tests with coverage
cd frontend
pnpm test:coverage

# Backend unit tests with coverage
cd backend
npm run test:coverage
```

## Test Data Management

### Test Database
- Separate test database
- Reset between test runs
- Seeded with test data
- Isolated from development/production

### Test Users
- Created during test setup
- Cleaned up after tests
- Unique per test run
- Credentials in test config

### Test Data
- Minimal data for tests
- Realistic but not production data
- Cleaned up after tests
- Factories for data generation

## Common Issues

### Tests Timing Out
**Problem**: Tests exceed timeout
**Solutions**:
- Increase timeout in config
- Check for slow API calls
- Verify test environment is running
- Review network conditions

### Flaky Tests
**Problem**: Tests pass/fail inconsistently
**Solutions**:
- Remove hardcoded waits
- Use Playwright's auto-waiting
- Check for race conditions
- Ensure test independence
- Review test data cleanup

### Authentication Issues
**Problem**: Auth tests failing
**Solutions**:
- Check AUTH_DELAY_MS setting
- Verify credentials
- Clear saved auth state
- Check backend is running
- Review rate limiting

### Selector Issues
**Problem**: Elements not found
**Solutions**:
- Use data-testid attributes
- Check element visibility
- Verify page loaded completely
- Use Playwright Inspector
- Review selector specificity

## Performance Testing

### Load Testing
- Tool: k6 or Artillery
- Test API endpoints under load
- Measure response times
- Identify bottlenecks

### Stress Testing
- Push system to limits
- Identify breaking points
- Test error handling
- Verify recovery

### Endurance Testing
- Run for extended periods
- Check for memory leaks
- Monitor resource usage
- Verify stability

## Accessibility Testing

### Automated Testing
- Playwright accessibility checks
- axe-core integration
- WCAG compliance validation

### Manual Testing
- Screen reader testing
- Keyboard navigation
- Color contrast verification
- Focus management

## Related Documentation

### Development
- [Setup Guide](../development/SETUP.md) - Development environment
- [Workflow Guide](../development/WORKFLOW_GUIDE.md) - Development process

### User Testing
- [User Testing Overview](../usertesting/V1.1_TESTING_OVERVIEW.md) - UAT methodology
- [Feedback Collection](../usertesting/FEEDBACK_COLLECTION_PM_GUIDE.md) - Gathering feedback

### Root Documentation
- [E2E Tests Disabled](../E2E_TESTS_DISABLED.md) - Historical context
- [GitHub Issue E2E Tests](../GITHUB_ISSUE_E2E_TESTS.md) - E2E test issues

## Test Maintenance

### Regular Tasks
- Review and update tests for new features
- Remove obsolete tests
- Update test data
- Review flaky tests
- Update documentation

### Test Refactoring
- Extract common patterns
- Create test utilities
- Improve test readability
- Reduce duplication
- Optimize test execution

### Test Monitoring
- Track test execution time
- Monitor flaky tests
- Review failure patterns
- Analyze coverage trends
- Identify slow tests

## Best Practices Summary

### Do
✅ Write descriptive test names
✅ Use data-testid for selectors
✅ Test user behavior, not implementation
✅ Make tests independent
✅ Clean up test data
✅ Use Playwright's auto-waiting
✅ Debug with Playwright Inspector
✅ Review test reports

### Don't
❌ Use hardcoded waits (sleep)
❌ Depend on test execution order
❌ Use fragile CSS selectors
❌ Test implementation details
❌ Leave test data behind
❌ Ignore flaky tests
❌ Skip test documentation
❌ Commit failing tests

---

[← Back to Documentation Hub](../README.md)

// Made with Bob