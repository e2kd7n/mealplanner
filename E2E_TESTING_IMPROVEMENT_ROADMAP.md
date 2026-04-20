# E2E Testing Improvement Roadmap

**Document Purpose:** Detailed recommendations and implementation guide for improving E2E test reliability, coverage, and maintainability.

**Last Updated:** 2026-04-19

---

## Table of Contents
1. [Critical Improvements (Week 1-2)](#critical-improvements)
2. [High Priority Improvements (Week 3-4)](#high-priority-improvements)
3. [Medium Priority Improvements (Month 2)](#medium-priority-improvements)
4. [Long-term Enhancements (Month 3+)](#long-term-enhancements)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Best Practices & Patterns](#best-practices--patterns)

---

## Critical Improvements (Week 1-2)

### 1. Implement Session Reuse Pattern ⭐⭐⭐

**Problem:** Each test authenticates via UI, causing rate limiting and slow execution.

**Solution:** Share authenticated browser context across tests.

**Implementation:**

```typescript
// frontend/e2e/fixtures/shared-auth.fixture.ts
import { test as base, chromium, FullConfig } from '@playwright/test';

let sharedContext: any;
let sharedPage: any;

export const test = base.extend({
  // Use shared authenticated context
  context: async ({}, use, workerInfo) => {
    if (!sharedContext) {
      const browser = await chromium.launch();
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      
      // Login once per worker
      await sharedPage.goto('/login');
      await sharedPage.getByLabel(/email/i).fill('test@example.com');
      await sharedPage.getByLabel(/password/i).fill('TestPass123!');
      await sharedPage.getByRole('button', { name: /sign in/i }).click();
      await sharedPage.waitForURL('**/dashboard');
    }
    
    await use(sharedContext);
  },
  
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});
```

**Benefits:**
- Reduces auth requests from 33 to 1-3 per test run
- Eliminates rate limiting issues
- Speeds up test execution by 60-70%

**Estimated Time:** 4-6 hours

---

### 2. Implement API Authentication Alternative ⭐⭐⭐

**Problem:** UI authentication is slow and fragile.

**Solution:** Use API to obtain auth tokens, inject into browser context.

**Implementation:**

```typescript
// frontend/e2e/fixtures/api-auth.fixture.ts
import { test as base } from '@playwright/test';
import { request } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Get auth token via API
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
    });
    
    const response = await apiContext.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'TestPass123!',
      },
    });
    
    const { accessToken, refreshToken } = await response.json();
    
    // Inject tokens into browser storage
    await page.goto('/');
    await page.evaluate(({ access, refresh }) => {
      sessionStorage.setItem('accessToken', access);
      sessionStorage.setItem('refreshToken', refresh);
    }, { access: accessToken, refresh: refreshToken });
    
    // Navigate to authenticated page
    await page.goto('/dashboard');
    await use(page);
  },
});
```

**Benefits:**
- Bypasses UI completely for authentication
- No rate limiting issues
- Faster and more reliable
- Can test API and UI separately

**Estimated Time:** 6-8 hours

---

### 3. Fix Sort Dropdown Selector ⭐⭐

**Problem:** Sort functionality test failing due to incorrect selector.

**Investigation Steps:**
1. Inspect actual sort dropdown in Recipes page
2. Check if it's a native select or custom component
3. Update RecipesPage object with correct selector

**Implementation:**

```typescript
// frontend/e2e/page-objects/RecipesPage.ts
export class RecipesPage {
  // Option 1: If native select
  readonly sortSelect: Locator;
  
  constructor(page: Page) {
    // Try different selector strategies
    this.sortSelect = page.locator('select[name="sortBy"]'); // Native select
    // OR
    this.sortSelect = page.getByRole('combobox', { name: /sort/i }); // ARIA combobox
    // OR
    this.sortSelect = page.locator('[data-testid="sort-select"]'); // Test ID
  }
  
  async sortBy(option: string) {
    // For native select
    await this.sortSelect.selectOption(option);
    
    // OR for custom dropdown
    await this.sortSelect.click();
    await this.page.getByRole('option', { name: new RegExp(option, 'i') }).click();
    
    await this.page.waitForLoadState('networkidle');
  }
}
```

**Recommendation:** Add `data-testid` attributes to UI components for reliable selection.

**Estimated Time:** 2-3 hours

---

### 4. Increase Authentication Delay ⭐

**Problem:** 3-second delay insufficient for rate limit recovery.

**Solution:** Increase to 10 seconds or implement exponential backoff.

**Implementation:**

```typescript
// frontend/e2e/fixtures/auth.fixture.ts
authenticatedPage: async ({ page }, use) => {
  // Exponential backoff for rate limiting
  const delay = Math.min(10000, 3000 * Math.pow(1.5, testAttempt));
  await page.waitForTimeout(delay);
  
  // ... rest of authentication logic
}
```

**Estimated Time:** 1 hour

---

## High Priority Improvements (Week 3-4)

### 5. Implement Test Data Management ⭐⭐⭐

**Problem:** Tests interfere with each other, no cleanup between runs.

**Solution:** Database seeding and cleanup utilities.

**Implementation:**

```typescript
// frontend/e2e/utils/test-data-manager.ts
export class TestDataManager {
  private apiContext: APIRequestContext;
  
  async setup() {
    // Create test-specific data
    const recipe = await this.createRecipe({
      title: `Test Recipe ${Date.now()}`,
      // ... other fields
    });
    return { recipe };
  }
  
  async cleanup() {
    // Delete test data
    await this.deleteTestRecipes();
    await this.deleteTestMealPlans();
    await this.deleteTestGroceryLists();
  }
  
  private async createRecipe(data: RecipeData) {
    const response = await this.apiContext.post('/api/recipes', { data });
    return response.json();
  }
  
  private async deleteTestRecipes() {
    // Delete recipes created during tests
    const recipes = await this.apiContext.get('/api/recipes?test=true');
    for (const recipe of await recipes.json()) {
      await this.apiContext.delete(`/api/recipes/${recipe.id}`);
    }
  }
}

// Usage in tests
test.beforeEach(async ({ page }) => {
  const dataManager = new TestDataManager();
  await dataManager.setup();
});

test.afterEach(async ({ page }) => {
  const dataManager = new TestDataManager();
  await dataManager.cleanup();
});
```

**Estimated Time:** 8-12 hours

---

### 6. Add Retry Logic for Flaky Tests ⭐⭐

**Problem:** Some tests fail intermittently due to timing issues.

**Solution:** Configure retries and implement custom retry logic.

**Implementation:**

```typescript
// frontend/playwright.config.ts
export default defineConfig({
  // Retry failed tests
  retries: process.env.CI ? 2 : 1,
  
  // Increase timeout for slow operations
  timeout: 60000,
  
  // Configure expect timeout
  expect: {
    timeout: 10000,
  },
});

// Custom retry wrapper
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Estimated Time:** 4-6 hours

---

### 7. Disable Firefox/WebKit Temporarily ⭐

**Problem:** Firefox and WebKit tests have low pass rates, slowing down development.

**Solution:** Focus on Chromium until core issues resolved.

**Implementation:**

```typescript
// frontend/playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  // Temporarily disabled - re-enable after fixing compatibility issues
  // {
  //   name: 'firefox',
  //   use: { ...devices['Desktop Firefox'] },
  // },
  // {
  //   name: 'webkit',
  //   use: { ...devices['Desktop Safari'] },
  // },
],
```

**Estimated Time:** 15 minutes

---

### 8. Complete Phase 1 Tests ⭐⭐

**Missing Tests:**
- Recipe create flow
- Recipe edit flow
- Recipe delete flow
- Logout flow
- Password validation

**Implementation Example:**

```typescript
// frontend/e2e/tests/recipes/crud.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Recipe CRUD Operations', () => {
  test('should create a new recipe', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/new');
    
    // Fill form
    await authenticatedPage.getByLabel(/title/i).fill('Test Recipe');
    await authenticatedPage.getByLabel(/description/i).fill('Test description');
    await authenticatedPage.getByLabel(/prep time/i).fill('15');
    await authenticatedPage.getByLabel(/cook time/i).fill('30');
    
    // Submit
    await authenticatedPage.getByRole('button', { name: /save/i }).click();
    
    // Verify redirect and success
    await expect(authenticatedPage).toHaveURL(/.*recipes\/[a-f0-9-]+/);
    await expect(authenticatedPage.getByText('Test Recipe')).toBeVisible();
  });
  
  test('should edit an existing recipe', async ({ authenticatedPage }) => {
    // Navigate to recipe detail
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.getByRole('link', { name: /first recipe/i }).click();
    
    // Click edit
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();
    
    // Update fields
    await authenticatedPage.getByLabel(/title/i).fill('Updated Recipe');
    await authenticatedPage.getByRole('button', { name: /save/i }).click();
    
    // Verify update
    await expect(authenticatedPage.getByText('Updated Recipe')).toBeVisible();
  });
  
  test('should delete a recipe', async ({ authenticatedPage }) => {
    // Navigate to recipe
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.getByRole('link', { name: /test recipe/i }).click();
    
    // Delete with confirmation
    await authenticatedPage.getByRole('button', { name: /delete/i }).click();
    await authenticatedPage.getByRole('button', { name: /confirm/i }).click();
    
    // Verify redirect
    await expect(authenticatedPage).toHaveURL(/.*recipes$/);
  });
});
```

**Estimated Time:** 12-16 hours

---

## Medium Priority Improvements (Month 2)

### 9. Implement Phase 2 Tests ⭐⭐⭐

**Meal Planning Tests:**
- Create meal plan
- Add recipes to meal plan
- View calendar
- Edit meal plan
- Delete meal plan

**Grocery List Tests:**
- Generate from meal plan
- Add custom items
- Check off items
- Clear completed items
- Delete list

**Recipe Import Tests:**
- Import from URL
- Validate imported data
- Handle import errors
- Save imported recipe

**Estimated Time:** 40-60 hours

---

### 10. GitHub Actions CI/CD Integration ⭐⭐⭐

**Implementation:**

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: meal_planner_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run database migrations
        run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/meal_planner_test
      
      - name: Start backend
        run: cd backend && npm start &
        env:
          E2E_TESTING: true
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/meal_planner_test
      
      - name: Start frontend
        run: cd frontend && npm run dev &
      
      - name: Wait for services
        run: |
          npx wait-on http://localhost:3000/health
          npx wait-on http://localhost:5173
      
      - name: Install Playwright browsers
        run: cd frontend && npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
      
      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-videos
          path: frontend/test-results/
          retention-days: 7
```

**Estimated Time:** 8-12 hours

---

### 11. Fix Firefox Compatibility ⭐⭐

**Issues to Address:**
1. Page load timeouts
2. Network idle detection
3. Element interaction timing

**Solutions:**
- Use more reliable wait strategies
- Increase timeouts for Firefox
- Add Firefox-specific configuration

```typescript
// frontend/playwright.config.ts
projects: [
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      // Firefox-specific settings
      launchOptions: {
        firefoxUserPrefs: {
          'dom.ipc.processCount': 8,
        },
      },
    },
    timeout: 45000, // Longer timeout for Firefox
  },
],
```

**Estimated Time:** 16-24 hours

---

## Long-term Enhancements (Month 3+)

### 12. Visual Regression Testing ⭐⭐

**Tool:** Playwright's built-in screenshot comparison

**Implementation:**

```typescript
test('recipe page should match screenshot', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page).toHaveScreenshot('recipes-page.png', {
    maxDiffPixels: 100,
  });
});
```

**Estimated Time:** 20-30 hours

---

### 13. Performance Testing ⭐

**Metrics to Track:**
- Page load times
- API response times
- Time to interactive
- Largest contentful paint

**Implementation:**

```typescript
test('recipe list should load quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/recipes');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3 seconds max
});
```

**Estimated Time:** 16-24 hours

---

### 14. Accessibility Testing ⭐⭐

**Tool:** axe-core integration

**Implementation:**

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('recipe page should be accessible', async ({ page }) => {
  await page.goto('/recipes');
  await injectAxe(page);
  await checkA11y(page);
});
```

**Estimated Time:** 12-20 hours

---

## Technical Implementation Details

### Session Storage vs Cookies

**Current:** Application uses sessionStorage for tokens

**Recommendation:** Continue with sessionStorage but add cookie fallback for better test reliability.

### Test Isolation Strategies

1. **Database per test:** Slow but complete isolation
2. **Transaction rollback:** Fast but complex
3. **Namespace isolation:** Good balance (recommended)

### Parallel Execution

**Current:** Sequential (workers: 1)
**Future:** Parallel with proper isolation (workers: 4-8)

**Requirements:**
- Session reuse implemented
- Test data isolation
- No shared state between tests

---

## Best Practices & Patterns

### 1. Page Object Model

**Always use page objects** - Never interact with page directly in tests.

### 2. Test Data Builders

```typescript
class RecipeBuilder {
  private data: Partial<Recipe> = {};
  
  withTitle(title: string) {
    this.data.title = title;
    return this;
  }
  
  withPrepTime(minutes: number) {
    this.data.prepTime = minutes;
    return this;
  }
  
  build(): Recipe {
    return {
      title: this.data.title || 'Default Recipe',
      prepTime: this.data.prepTime || 15,
      // ... defaults
    };
  }
}

// Usage
const recipe = new RecipeBuilder()
  .withTitle('Test Recipe')
  .withPrepTime(30)
  .build();
```

### 3. Custom Assertions

```typescript
export async function expectRecipeToBeVisible(
  page: Page,
  recipeName: string
) {
  await expect(
    page.getByRole('heading', { name: recipeName })
  ).toBeVisible();
}
```

### 4. Test Hooks

```typescript
test.beforeEach(async ({ page }) => {
  // Setup
  await setupTestData();
});

test.afterEach(async ({ page }) => {
  // Cleanup
  await cleanupTestData();
});
```

---

## Priority Matrix

| Task | Impact | Effort | Priority | Timeline |
|------|--------|--------|----------|----------|
| Session Reuse | High | Medium | P0 | Week 1 |
| API Auth | High | Medium | P0 | Week 1 |
| Sort Selector Fix | Medium | Low | P1 | Week 1 |
| Auth Delay | Low | Low | P1 | Week 1 |
| Test Data Mgmt | High | High | P1 | Week 2-3 |
| Retry Logic | Medium | Medium | P1 | Week 2 |
| Disable FF/WK | Low | Low | P1 | Week 1 |
| Complete Phase 1 | High | High | P1 | Week 3-4 |
| Phase 2 Tests | High | Very High | P2 | Month 2 |
| CI/CD | High | Medium | P2 | Month 2 |
| Firefox Fix | Medium | High | P2 | Month 2 |
| Visual Testing | Low | Medium | P3 | Month 3+ |
| Performance | Medium | Medium | P3 | Month 3+ |
| Accessibility | Medium | Medium | P3 | Month 3+ |

---

## Success Metrics

### Current State
- Test Pass Rate: 39% (all browsers), 70% (Chromium)
- Test Execution Time: ~6 minutes
- Test Coverage: 11 tests (Phase 1 partial)

### Target State (Month 1)
- Test Pass Rate: 90%+ (Chromium)
- Test Execution Time: <3 minutes
- Test Coverage: 25+ tests (Phase 1 complete)

### Target State (Month 2)
- Test Pass Rate: 85%+ (all browsers)
- Test Execution Time: <5 minutes
- Test Coverage: 50+ tests (Phase 1 + Phase 2)

### Target State (Month 3+)
- Test Pass Rate: 95%+ (all browsers)
- Test Execution Time: <10 minutes
- Test Coverage: 100+ tests (comprehensive)
- CI/CD Integration: Complete
- Visual/Performance/A11y: Implemented

---

## Conclusion

This roadmap provides a structured approach to improving E2E test reliability and coverage. Focus on critical improvements first (session reuse, API auth) to establish a stable foundation, then expand coverage and browser support systematically.

**Next Action:** Implement session reuse pattern (highest impact, reasonable effort).