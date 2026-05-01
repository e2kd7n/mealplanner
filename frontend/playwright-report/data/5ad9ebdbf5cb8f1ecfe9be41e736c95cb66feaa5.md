# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recipes/create.spec.ts >> Create Recipe >> should add and remove ingredients
- Location: e2e/tests/recipes/create.spec.ts:48:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /add ingredient/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Meal Planner
      - button "account of current user" [ref=e7] [cursor=pointer]:
        - generic [ref=e8]: U
  - navigation [ref=e9]:
    - generic [ref=e11]:
      - generic [ref=e13]: Meal Planner
      - list [ref=e14]:
        - listitem [ref=e15]:
          - button "Dashboard" [ref=e16] [cursor=pointer]:
            - img [ref=e18]
            - generic [ref=e21]: Dashboard
        - listitem [ref=e22]:
          - button "Recipes" [ref=e23] [cursor=pointer]:
            - img [ref=e25]
            - generic [ref=e28]: Recipes
        - listitem [ref=e29]:
          - button "Meal Planner" [ref=e30] [cursor=pointer]:
            - img [ref=e32]
            - generic [ref=e35]: Meal Planner
        - listitem [ref=e36]:
          - button "Grocery List" [ref=e37] [cursor=pointer]:
            - img [ref=e39]
            - generic [ref=e42]: Grocery List
        - listitem [ref=e43]:
          - button "Pantry" [ref=e44] [cursor=pointer]:
            - img [ref=e46]
            - generic [ref=e49]: Pantry
  - main [ref=e50]:
    - generic [ref=e51]:
      - alert [ref=e52]:
        - img [ref=e54]
        - generic [ref=e56]: Failed to fetch recipe
      - button "Back to Recipes" [ref=e57] [cursor=pointer]:
        - img [ref=e59]
        - text: Back to Recipes
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/auth.fixture';
  2  | 
  3  | test.describe('Create Recipe', () => {
  4  |   test('should create a new recipe with all fields', async ({ authenticatedPage }) => {
  5  |     // Navigate to create recipe page
  6  |     await authenticatedPage.goto('/recipes/new');
  7  |     
  8  |     // Fill in recipe details
  9  |     await authenticatedPage.getByLabel(/title/i).fill('E2E Test Recipe');
  10 |     await authenticatedPage.getByLabel(/description/i).fill('A test recipe created by E2E tests');
  11 |     
  12 |     // Fill in cooking details
  13 |     await authenticatedPage.getByLabel(/prep time/i).fill('15');
  14 |     await authenticatedPage.getByLabel(/cook time/i).fill('30');
  15 |     await authenticatedPage.getByLabel(/servings/i).fill('4');
  16 |     
  17 |     // Select difficulty
  18 |     await authenticatedPage.getByLabel(/difficulty/i).click();
  19 |     await authenticatedPage.getByRole('option', { name: /medium/i }).click();
  20 |     
  21 |     // Add instructions
  22 |     await authenticatedPage.getByLabel(/instructions/i).fill('1. Prepare ingredients\n2. Cook\n3. Serve');
  23 |     
  24 |     // Submit form
  25 |     await authenticatedPage.getByRole('button', { name: /create recipe/i }).click();
  26 |     
  27 |     // Should redirect to recipe detail page
  28 |     await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+/);
  29 |     
  30 |     // Should show success message
  31 |     await expect(authenticatedPage.getByText(/recipe created successfully/i)).toBeVisible();
  32 |     
  33 |     // Should display the recipe details
  34 |     await expect(authenticatedPage.getByRole('heading', { name: /e2e test recipe/i })).toBeVisible();
  35 |   });
  36 | 
  37 |   test('should show validation errors for required fields', async ({ authenticatedPage }) => {
  38 |     await authenticatedPage.goto('/recipes/new');
  39 |     
  40 |     // Try to submit without filling required fields
  41 |     await authenticatedPage.getByRole('button', { name: /create recipe/i }).click();
  42 |     
  43 |     // Should show validation errors
  44 |     await expect(authenticatedPage.getByText(/title is required/i)).toBeVisible();
  45 |     await expect(authenticatedPage.getByText(/description is required/i)).toBeVisible();
  46 |   });
  47 | 
  48 |   test('should add and remove ingredients', async ({ authenticatedPage }) => {
  49 |     await authenticatedPage.goto('/recipes/new');
  50 |     
  51 |     // Add first ingredient
> 52 |     await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();
     |                                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  53 |     await authenticatedPage.getByLabel(/ingredient name/i).first().fill('Flour');
  54 |     await authenticatedPage.getByLabel(/quantity/i).first().fill('2');
  55 |     await authenticatedPage.getByLabel(/unit/i).first().fill('cups');
  56 |     
  57 |     // Add second ingredient
  58 |     await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();
  59 |     await authenticatedPage.getByLabel(/ingredient name/i).last().fill('Sugar');
  60 |     await authenticatedPage.getByLabel(/quantity/i).last().fill('1');
  61 |     await authenticatedPage.getByLabel(/unit/i).last().fill('cup');
  62 |     
  63 |     // Should have 2 ingredients
  64 |     const ingredients = authenticatedPage.getByLabel(/ingredient name/i);
  65 |     await expect(ingredients).toHaveCount(2);
  66 |     
  67 |     // Remove first ingredient
  68 |     await authenticatedPage.getByRole('button', { name: /remove ingredient/i }).first().click();
  69 |     
  70 |     // Should have 1 ingredient
  71 |     await expect(ingredients).toHaveCount(1);
  72 |   });
  73 | 
  74 |   test('should cancel recipe creation', async ({ authenticatedPage }) => {
  75 |     await authenticatedPage.goto('/recipes/new');
  76 |     
  77 |     // Fill in some data
  78 |     await authenticatedPage.getByLabel(/title/i).fill('Test Recipe');
  79 |     
  80 |     // Click cancel
  81 |     await authenticatedPage.getByRole('button', { name: /cancel/i }).click();
  82 |     
  83 |     // Should navigate back to recipes list
  84 |     await expect(authenticatedPage).toHaveURL('/recipes');
  85 |   });
  86 | });
  87 | 
  88 | // Made with Bob
  89 | 
```