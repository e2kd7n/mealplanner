# E2E Testing Implementation Plan

**Issue:** #47 - Add E2E Tests for Critical User Flows  
**Status:** Planning Phase  
**Created:** 2026-04-19  
**Framework:** Playwright  
**CI/CD:** GitHub Actions  
**Approach:** Phased implementation with test fixtures

---

## Executive Summary

This document outlines the implementation plan for adding end-to-end (E2E) tests to the Meal Planner application using Playwright. The implementation will be done in two phases, starting with authentication and recipe management flows, then expanding to meal planning, grocery lists, and recipe import functionality.

## Goals

1. **Automated Testing**: Implement automated E2E tests for critical user workflows
2. **CI/CD Integration**: Run tests automatically on every pull request and merge
3. **Quality Assurance**: Catch regressions before they reach production
4. **Documentation**: Provide clear examples and maintenance guidelines
5. **Scalability**: Create a foundation for expanding test coverage over time

## Technology Stack

- **Framework**: Playwright (v1.40+)
- **Language**: TypeScript
- **Test Runner**: Playwright Test Runner
- **CI/CD**: GitHub Actions
- **Reporting**: Playwright HTML Reporter, GitHub Actions artifacts

## Project Structure

```
frontend/
├── e2e/
│   ├── tests/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── register.spec.ts
│   │   │   └── logout.spec.ts
│   │   ├── recipes/
│   │   │   ├── browse.spec.ts
│   │   │   ├── filter-search.spec.ts
│   │   │   ├── view-detail.spec.ts
│   │   │   ├── create.spec.ts
│   │   │   ├── edit.spec.ts
│   │   │   └── delete.spec.ts
│   │   ├── meal-planner/
│   │   │   ├── create-plan.spec.ts
│   │   │   ├── add-recipes.spec.ts
│   │   │   ├── edit-plan.spec.ts
│   │   │   └── delete-plan.spec.ts
│   │   ├── grocery-list/
│   │   │   ├── generate.spec.ts
│   │   │   ├── manage-items.spec.ts
│   │   │   └── check-off.spec.ts
│   │   └── recipe-import/
│   │       ├── import-url.spec.ts
│   │       └── validate-data.spec.ts
│   ├── fixtures/
│   │   ├── auth.fixture.ts
│   │   ├── recipe.fixture.ts
│   │   ├── meal-plan.fixture.ts
│   │   └── test-data.ts
│   ├── helpers/
│   │   ├── api-helpers.ts
│   │   ├── db-helpers.ts
│   │   └── test-utils.ts
│   ├── page-objects/
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── RecipesPage.ts
│   │   ├── RecipeDetailPage.ts
│   │   ├── CreateRecipePage.ts
│   │   ├── MealPlannerPage.ts
│   │   └── GroceryListPage.ts
│   └── playwright.config.ts
├── package.json (updated with test scripts)
└── .github/
    └── workflows/
        └── e2e-tests.yml
```

---

## Phase 1: Foundation & Core Flows

**Timeline:** Sprint 1 (2 weeks)  
**Priority:** High

### 1.1 Setup & Infrastructure

#### Install Dependencies

```bash
cd frontend
pnpm add -D @playwright/test
pnpm exec playwright install
```

#### Update package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

#### Create Playwright Configuration

**File:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.2 Test Fixtures & Utilities

#### Authentication Fixture

**File:** `frontend/e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

type AuthFixtures = {
  authenticatedPage: any;
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'TestPass123!');
    await page.waitForURL('**/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

#### Test Data Generator

**File:** `frontend/e2e/fixtures/test-data.ts`

```typescript
export const generateTestUser = () => ({
  email: `test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  familyName: `Test Family ${Date.now()}`,
});

export const generateTestRecipe = () => ({
  title: `Test Recipe ${Date.now()}`,
  description: 'A delicious test recipe',
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'medium',
  ingredients: [
    { name: 'Test Ingredient 1', quantity: 2, unit: 'cups' },
    { name: 'Test Ingredient 2', quantity: 1, unit: 'tbsp' },
  ],
  instructions: [
    'Step 1: Prepare ingredients',
    'Step 2: Cook',
    'Step 3: Serve',
  ],
});
```

#### API Helpers

**File:** `frontend/e2e/helpers/api-helpers.ts`

```typescript
import { APIRequestContext } from '@playwright/test';

export class ApiHelpers {
  constructor(private request: APIRequestContext) {}

  async createTestUser(userData: any) {
    const response = await this.request.post('/api/auth/register', {
      data: userData,
    });
    return response.json();
  }

  async deleteTestUser(userId: string, token: string) {
    await this.request.delete(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createTestRecipe(recipeData: any, token: string) {
    const response = await this.request.post('/api/recipes', {
      data: recipeData,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  async deleteTestRecipe(recipeId: string, token: string) {
    await this.request.delete(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
```

### 1.3 Page Object Models

#### Login Page

**File:** `frontend/e2e/page-objects/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
    this.registerLink = page.getByRole('link', { name: 'Register' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await this.errorMessage.waitFor();
    await this.page.waitForSelector(`text=${message}`);
  }
}
```

#### Recipes Page

**File:** `frontend/e2e/page-objects/RecipesPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class RecipesPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly sortSelect: Locator;
  readonly createButton: Locator;
  readonly recipeCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search recipes');
    this.filterButton = page.getByRole('button', { name: 'Filters' });
    this.sortSelect = page.getByLabel('Sort by');
    this.createButton = page.getByRole('button', { name: 'Create Recipe' });
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
  }

  async goto() {
    await this.page.goto('/recipes');
  }

  async searchRecipes(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async sortBy(option: string) {
    await this.sortSelect.selectOption(option);
  }

  async clickRecipe(title: string) {
    await this.page.getByText(title).click();
  }

  async getRecipeCount() {
    return await this.recipeCards.count();
  }
}
```

### 1.4 Authentication Tests

#### Login Tests

**File:** `frontend/e2e/tests/auth/login.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'TestPass123!');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    await loginPage.expectError('Invalid credentials');
  });

  test('should show validation errors for empty fields', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginButton.click();
    
    await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('should navigate to register page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.registerLink.click();
    
    await expect(page).toHaveURL(/.*register/);
  });
});
```

#### Register Tests

**File:** `frontend/e2e/tests/auth/register.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../fixtures/test-data';
import { ApiHelpers } from '../../helpers/api-helpers';

test.describe('Registration Flow', () => {
  let apiHelpers: ApiHelpers;
  let testUser: any;

  test.beforeEach(async ({ request }) => {
    apiHelpers = new ApiHelpers(request);
    testUser = generateTestUser();
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);
    await page.getByLabel('Family Name').fill(testUser.familyName);
    
    await page.getByRole('button', { name: 'Register' }).click();
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('TestPass123!');
    await page.getByLabel('Confirm Password').fill('TestPass123!');
    await page.getByLabel('Family Name').fill('Test Family');
    
    await page.getByRole('button', { name: 'Register' }).click();
    
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByLabel('Confirm Password').click();
    
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });
});
```

### 1.5 Recipe Management Tests

#### Browse Recipes Tests

**File:** `frontend/e2e/tests/recipes/browse.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../page-objects/RecipesPage';

test.describe('Browse Recipes', () => {
  test('should display recipe list', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    const count = await recipesPage.getRecipeCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to recipe detail', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    const firstRecipe = recipesPage.recipeCards.first();
    const title = await firstRecipe.getByRole('heading').textContent();
    
    await firstRecipe.click();
    
    await expect(authenticatedPage).toHaveURL(/.*recipes\/\d+/);
    await expect(authenticatedPage.getByRole('heading', { name: title! })).toBeVisible();
  });

  test('should paginate through recipes', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    const nextButton = authenticatedPage.getByRole('button', { name: 'Next' });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(authenticatedPage).toHaveURL(/.*page=2/);
    }
  });
});
```

#### Filter and Search Tests

**File:** `frontend/e2e/tests/recipes/filter-search.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../page-objects/RecipesPage';

test.describe('Recipe Filtering and Search', () => {
  test('should search recipes by title', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    await recipesPage.searchRecipes('pasta');
    
    const recipes = recipesPage.recipeCards;
    const count = await recipes.count();
    
    for (let i = 0; i < count; i++) {
      const text = await recipes.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('pasta');
    }
  });

  test('should sort recipes', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    await recipesPage.sortBy('title');
    
    await expect(authenticatedPage).toHaveURL(/.*sortBy=title/);
  });

  test('should filter by difficulty', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    await recipesPage.filterButton.click();
    await authenticatedPage.getByLabel('Easy').check();
    await authenticatedPage.getByRole('button', { name: 'Apply' }).click();
    
    await expect(authenticatedPage).toHaveURL(/.*difficulty=easy/);
  });
});
```

#### Create Recipe Tests

**File:** `frontend/e2e/tests/recipes/create.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { generateTestRecipe } from '../../fixtures/test-data';

test.describe('Create Recipe', () => {
  test('should create new recipe successfully', async ({ authenticatedPage }) => {
    const recipe = generateTestRecipe();
    
    await authenticatedPage.goto('/recipes/create');
    
    // Fill basic info
    await authenticatedPage.getByLabel('Title').fill(recipe.title);
    await authenticatedPage.getByLabel('Description').fill(recipe.description);
    await authenticatedPage.getByLabel('Prep Time').fill(recipe.prepTime.toString());
    await authenticatedPage.getByLabel('Cook Time').fill(recipe.cookTime.toString());
    await authenticatedPage.getByLabel('Servings').fill(recipe.servings.toString());
    
    // Add ingredients
    for (const ingredient of recipe.ingredients) {
      await authenticatedPage.getByRole('button', { name: 'Add Ingredient' }).click();
      await authenticatedPage.getByLabel('Ingredient Name').last().fill(ingredient.name);
      await authenticatedPage.getByLabel('Quantity').last().fill(ingredient.quantity.toString());
      await authenticatedPage.getByLabel('Unit').last().fill(ingredient.unit);
    }
    
    // Add instructions
    for (const instruction of recipe.instructions) {
      await authenticatedPage.getByRole('button', { name: 'Add Step' }).click();
      await authenticatedPage.getByLabel(/Step \d+/).last().fill(instruction);
    }
    
    // Submit
    await authenticatedPage.getByRole('button', { name: 'Create Recipe' }).click();
    
    // Verify redirect and success
    await expect(authenticatedPage).toHaveURL(/.*recipes\/\d+/);
    await expect(authenticatedPage.getByRole('heading', { name: recipe.title })).toBeVisible();
  });

  test('should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');
    
    await authenticatedPage.getByRole('button', { name: 'Create Recipe' }).click();
    
    await expect(authenticatedPage.getByText(/title is required/i)).toBeVisible();
  });
});
```

---

## Phase 2: Extended Flows

**Timeline:** Sprint 2 (2 weeks)  
**Priority:** Medium

### 2.1 Meal Planning Tests

#### Create Meal Plan Tests

**File:** `frontend/e2e/tests/meal-planner/create-plan.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Create Meal Plan', () => {
  test('should create new meal plan', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/meal-planner');
    
    await authenticatedPage.getByRole('button', { name: 'New Meal Plan' }).click();
    
    // Select date range
    await authenticatedPage.getByLabel('Start Date').fill('2026-05-01');
    await authenticatedPage.getByLabel('End Date').fill('2026-05-07');
    
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    await expect(authenticatedPage.getByText('Meal Plan Created')).toBeVisible();
  });
});
```

### 2.2 Grocery List Tests

#### Generate Grocery List Tests

**File:** `frontend/e2e/tests/grocery-list/generate.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Generate Grocery List', () => {
  test('should generate list from meal plan', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/grocery-list');
    
    await authenticatedPage.getByRole('button', { name: 'Generate from Meal Plan' }).click();
    
    // Select meal plan
    await authenticatedPage.getByRole('option').first().click();
    await authenticatedPage.getByRole('button', { name: 'Generate' }).click();
    
    await expect(authenticatedPage.getByText('Grocery List Generated')).toBeVisible();
  });
});
```

### 2.3 Recipe Import Tests

#### Import from URL Tests

**File:** `frontend/e2e/tests/recipe-import/import-url.spec.ts`

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Import Recipe from URL', () => {
  test('should import recipe successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/import');
    
    const testUrl = 'https://www.example.com/recipe/test';
    await authenticatedPage.getByLabel('Recipe URL').fill(testUrl);
    await authenticatedPage.getByRole('button', { name: 'Import' }).click();
    
    // Wait for import to complete
    await expect(authenticatedPage.getByText('Recipe Imported')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid URL', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/import');
    
    await authenticatedPage.getByLabel('Recipe URL').fill('not-a-url');
    await authenticatedPage.getByRole('button', { name: 'Import' }).click();
    
    await expect(authenticatedPage.getByText(/invalid url/i)).toBeVisible();
  });
});
```

---

## GitHub Actions Integration

**File:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: mealplanner
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: meal_planner_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: |
          cd backend && pnpm install
          cd ../frontend && pnpm install
      
      - name: Setup database
        run: |
          cd backend
          pnpm prisma migrate deploy
          pnpm prisma db seed
        env:
          DATABASE_URL: postgresql://mealplanner:testpassword@localhost:5432/meal_planner_test
      
      - name: Start backend
        run: |
          cd backend
          pnpm build
          pnpm start &
        env:
          DATABASE_URL: postgresql://mealplanner:testpassword@localhost:5432/meal_planner_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
      
      - name: Install Playwright Browsers
        run: cd frontend && pnpm exec playwright install --with-deps
      
      - name: Run E2E tests
        run: cd frontend && pnpm test:e2e
        env:
          BASE_URL: http://localhost:8080
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
      
      - name: Upload test videos
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-videos
          path: frontend/test-results/
          retention-days: 7
```

---

## Test Data Management

### Fixture Strategy

1. **Isolated Test Data**: Each test creates its own data using fixtures
2. **Cleanup**: Tests clean up after themselves using `afterEach` hooks
3. **Idempotency**: Tests can run in any order without dependencies
4. **Realistic Data**: Use generators to create realistic test data

### Example Cleanup Pattern

```typescript
test.afterEach(async ({ request }, testInfo) => {
  if (testInfo.annotations.find(a => a.type === 'cleanup')) {
    const apiHelpers = new ApiHelpers(request);
    // Clean up test data
    await apiHelpers.deleteTestRecipe(testInfo.testId);
  }
});
```

---

## Best Practices

### 1. Page Object Pattern
- Encapsulate page interactions in page objects
- Keep tests focused on business logic
- Reuse selectors and actions

### 2. Waiting Strategies
- Use `waitForSelector` for dynamic content
- Avoid `waitForTimeout` except for debouncing
- Use `waitForURL` for navigation

### 3. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up test data after each test

### 4. Assertions
- Use meaningful assertion messages
- Test both positive and negative cases
- Verify visual elements and data

### 5. Error Handling
- Take screenshots on failure
- Record videos for debugging
- Log relevant information

---

## Running Tests

### Local Development

```bash
# Run all tests
cd frontend
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/auth/login.spec.ts

# Run in UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

### CI/CD

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

View results in GitHub Actions tab.

---

## Maintenance Guidelines

### Adding New Tests

1. Create test file in appropriate directory
2. Use existing fixtures and page objects
3. Follow naming conventions: `feature.spec.ts`
4. Add cleanup logic if needed
5. Update this documentation

### Updating Tests

1. Keep tests in sync with UI changes
2. Update page objects when selectors change
3. Maintain test data generators
4. Review and update assertions

### Debugging Failures

1. Check screenshots in test results
2. Watch recorded videos
3. Run tests in headed mode locally
4. Use Playwright Inspector for step-by-step debugging

---

## Success Metrics

### Phase 1 Goals
- ✅ 100% of authentication flows covered
- ✅ 100% of recipe management flows covered
- ✅ Tests run in CI/CD
- ✅ < 5 minute test execution time
- ✅ < 5% flaky test rate

### Phase 2 Goals
- ✅ All 5 critical flows covered
- ✅ Cross-browser testing (Chrome, Firefox, Safari)
- ✅ Test reports generated
- ✅ Documentation complete

---

## Timeline

### Week 1-2: Phase 1
- Day 1-2: Setup infrastructure
- Day 3-5: Authentication tests
- Day 6-10: Recipe management tests

### Week 3-4: Phase 2
- Day 1-3: Meal planning tests
- Day 4-6: Grocery list tests
- Day 7-8: Recipe import tests
- Day 9-10: Documentation and refinement

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Project: [TESTING_ENVIRONMENT.md](TESTING_ENVIRONMENT.md)

---

**Document Status:** Planning Phase  
**Next Review:** After Phase 1 completion  
**Maintained By:** Development Team

---

Made with Bob