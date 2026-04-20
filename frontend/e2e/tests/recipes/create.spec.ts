import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Create Recipe', () => {
  test('should create a new recipe with all fields', async ({ authenticatedPage }) => {
    // Navigate to create recipe page
    await authenticatedPage.goto('/recipes/new');
    
    // Fill in recipe details
    await authenticatedPage.getByLabel(/title/i).fill('E2E Test Recipe');
    await authenticatedPage.getByLabel(/description/i).fill('A test recipe created by E2E tests');
    
    // Fill in cooking details
    await authenticatedPage.getByLabel(/prep time/i).fill('15');
    await authenticatedPage.getByLabel(/cook time/i).fill('30');
    await authenticatedPage.getByLabel(/servings/i).fill('4');
    
    // Select difficulty
    await authenticatedPage.getByLabel(/difficulty/i).click();
    await authenticatedPage.getByRole('option', { name: /medium/i }).click();
    
    // Add instructions
    await authenticatedPage.getByLabel(/instructions/i).fill('1. Prepare ingredients\n2. Cook\n3. Serve');
    
    // Submit form
    await authenticatedPage.getByRole('button', { name: /create recipe/i }).click();
    
    // Should redirect to recipe detail page
    await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+/);
    
    // Should show success message
    await expect(authenticatedPage.getByText(/recipe created successfully/i)).toBeVisible();
    
    // Should display the recipe details
    await expect(authenticatedPage.getByRole('heading', { name: /e2e test recipe/i })).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/new');
    
    // Try to submit without filling required fields
    await authenticatedPage.getByRole('button', { name: /create recipe/i }).click();
    
    // Should show validation errors
    await expect(authenticatedPage.getByText(/title is required/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/description is required/i)).toBeVisible();
  });

  test('should add and remove ingredients', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/new');
    
    // Add first ingredient
    await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();
    await authenticatedPage.getByLabel(/ingredient name/i).first().fill('Flour');
    await authenticatedPage.getByLabel(/quantity/i).first().fill('2');
    await authenticatedPage.getByLabel(/unit/i).first().fill('cups');
    
    // Add second ingredient
    await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();
    await authenticatedPage.getByLabel(/ingredient name/i).last().fill('Sugar');
    await authenticatedPage.getByLabel(/quantity/i).last().fill('1');
    await authenticatedPage.getByLabel(/unit/i).last().fill('cup');
    
    // Should have 2 ingredients
    const ingredients = authenticatedPage.getByLabel(/ingredient name/i);
    await expect(ingredients).toHaveCount(2);
    
    // Remove first ingredient
    await authenticatedPage.getByRole('button', { name: /remove ingredient/i }).first().click();
    
    // Should have 1 ingredient
    await expect(ingredients).toHaveCount(1);
  });

  test('should cancel recipe creation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/new');
    
    // Fill in some data
    await authenticatedPage.getByLabel(/title/i).fill('Test Recipe');
    
    // Click cancel
    await authenticatedPage.getByRole('button', { name: /cancel/i }).click();
    
    // Should navigate back to recipes list
    await expect(authenticatedPage).toHaveURL('/recipes');
  });
});

// Made with Bob
