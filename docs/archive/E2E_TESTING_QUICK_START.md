# E2E Testing Quick Start Guide

**For Issue #47** - Quick reference for developers working with E2E tests

---

## 🚀 Quick Commands

```bash
# Install dependencies (first time only)
cd frontend
pnpm add -D @playwright/test
pnpm exec playwright install

# Run all tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/auth/login.spec.ts

# Interactive UI mode (recommended for development)
pnpm test:e2e:ui

# Watch mode with browser visible
pnpm test:e2e:headed

# Debug a specific test
pnpm test:e2e:debug tests/recipes/create.spec.ts

# View last test report
pnpm test:e2e:report
```

---

## 📁 Project Structure

```
frontend/e2e/
├── tests/              # Test files organized by feature
│   ├── auth/          # Authentication tests
│   ├── recipes/       # Recipe management tests
│   ├── meal-planner/  # Meal planning tests
│   ├── grocery-list/  # Grocery list tests
│   └── recipe-import/ # Recipe import tests
├── fixtures/          # Test fixtures and data generators
├── helpers/           # API and utility helpers
├── page-objects/      # Page Object Models
└── playwright.config.ts
```

---

## ✍️ Writing Your First Test

### 1. Create Test File

```typescript
// frontend/e2e/tests/my-feature/my-test.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('My Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // Your test code here
    await authenticatedPage.goto('/my-page');
    await expect(authenticatedPage.getByText('Hello')).toBeVisible();
  });
});
```

### 2. Use Page Objects

```typescript
import { MyPage } from '../../page-objects/MyPage';

test('should use page object', async ({ authenticatedPage }) => {
  const myPage = new MyPage(authenticatedPage);
  await myPage.goto();
  await myPage.doSomething();
  await expect(myPage.successMessage).toBeVisible();
});
```

### 3. Generate Test Data

```typescript
import { generateTestRecipe } from '../../fixtures/test-data';

test('should create recipe', async ({ authenticatedPage }) => {
  const recipe = generateTestRecipe();
  // Use recipe data in your test
});
```

---

## 🎯 Common Patterns

### Authentication

```typescript
// Use authenticated fixture
test('my test', async ({ authenticatedPage }) => {
  // Already logged in as test@example.com
  await authenticatedPage.goto('/dashboard');
});

// Or login manually
test('my test', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login('test@example.com', 'TestPass123!');
});
```

### Waiting for Elements

```typescript
// Wait for element to be visible
await page.getByText('Loading...').waitFor({ state: 'hidden' });
await page.getByText('Content').waitFor({ state: 'visible' });

// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for API response
await page.waitForResponse(resp => resp.url().includes('/api/recipes'));
```

### Assertions

```typescript
// Element visibility
await expect(page.getByText('Hello')).toBeVisible();
await expect(page.getByText('Hidden')).not.toBeVisible();

// URL checks
await expect(page).toHaveURL(/.*dashboard/);

// Text content
await expect(page.getByRole('heading')).toHaveText('My Title');

// Count elements
await expect(page.locator('.recipe-card')).toHaveCount(12);
```

### Form Interactions

```typescript
// Fill inputs
await page.getByLabel('Email').fill('test@example.com');
await page.getByLabel('Password').fill('password123');

// Select options
await page.getByLabel('Difficulty').selectOption('easy');

// Check/uncheck
await page.getByLabel('Kid Friendly').check();
await page.getByLabel('Optional').uncheck();

// Click buttons
await page.getByRole('button', { name: 'Submit' }).click();
```

---

## 🐛 Debugging Tips

### 1. Use UI Mode (Best for Development)

```bash
pnpm test:e2e:ui
```

- See tests run in real-time
- Pause and inspect at any point
- Time-travel through test steps
- View network requests

### 2. Run in Headed Mode

```bash
pnpm test:e2e:headed
```

- Watch browser execute tests
- See what's happening visually

### 3. Use Debug Mode

```bash
pnpm test:e2e:debug tests/my-test.spec.ts
```

- Step through test line by line
- Inspect page state
- Try commands in console

### 4. Add Debug Statements

```typescript
test('my test', async ({ page }) => {
  await page.pause(); // Pauses execution
  console.log(await page.title()); // Log information
  await page.screenshot({ path: 'debug.png' }); // Take screenshot
});
```

### 5. Check Test Results

```bash
# View HTML report
pnpm test:e2e:report

# Check screenshots in test-results/
ls test-results/

# Watch videos of failed tests
open test-results/my-test-chromium/video.webm
```

---

## 🔧 Common Issues & Solutions

### Issue: Test times out

```typescript
// Increase timeout for slow operations
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await page.goto('/slow-page');
});
```

### Issue: Element not found

```typescript
// Wait for element before interacting
await page.getByText('Button').waitFor();
await page.getByText('Button').click();

// Or use more specific selectors
await page.getByRole('button', { name: 'Submit' }).click();
```

### Issue: Flaky tests

```typescript
// Use auto-waiting assertions
await expect(page.getByText('Success')).toBeVisible();

// Instead of manual waits
await page.waitForTimeout(1000); // ❌ Avoid this
```

### Issue: Test data conflicts

```typescript
// Generate unique test data
const recipe = generateTestRecipe(); // Uses timestamp

// Clean up after test
test.afterEach(async ({ request }) => {
  await apiHelpers.deleteTestRecipe(recipeId);
});
```

---

## 📊 Test Organization

### Naming Conventions

- **Files**: `feature.spec.ts` (e.g., `login.spec.ts`)
- **Describes**: Feature name (e.g., `'Login Flow'`)
- **Tests**: Action description (e.g., `'should login with valid credentials'`)

### Test Structure

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/page');
    
    // Act
    await page.getByRole('button').click();
    
    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });

  test.afterEach(async () => {
    // Cleanup after each test
  });
});
```

---

## 🎨 Page Object Example

```typescript
// frontend/e2e/page-objects/RecipesPage.ts
import { Page, Locator } from '@playwright/test';

export class RecipesPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search recipes');
    this.createButton = page.getByRole('button', { name: 'Create Recipe' });
  }

  async goto() {
    await this.page.goto('/recipes');
  }

  async searchRecipes(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async clickCreateRecipe() {
    await this.createButton.click();
  }
}
```

---

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

### View Results

1. Go to GitHub Actions tab
2. Click on the workflow run
3. Download artifacts:
   - `playwright-report` - HTML test report
   - `test-videos` - Videos of failed tests

### Local CI Simulation

```bash
# Run tests like CI does
CI=true pnpm test:e2e
```

---

## 📚 Resources

- **Full Plan**: [E2E_TESTING_IMPLEMENTATION_PLAN.md](E2E_TESTING_IMPLEMENTATION_PLAN.md)
- **Playwright Docs**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices
- **API Reference**: https://playwright.dev/docs/api/class-test

---

## 🆘 Getting Help

1. Check this guide first
2. Review [E2E_TESTING_IMPLEMENTATION_PLAN.md](E2E_TESTING_IMPLEMENTATION_PLAN.md)
3. Search Playwright documentation
4. Ask the team in Slack/Discord
5. Create an issue with:
   - Test code
   - Error message
   - Screenshots/videos

---

**Quick Tip**: Start with `pnpm test:e2e:ui` - it's the best way to develop and debug tests!

---

Made with Bob