import { test, expect } from '../../fixtures/auth.fixture';
import { deleteTestRecipe } from '../../helpers/test-data';

// CreateRecipe is a 4-step wizard (Basic Info -> Ingredients -> Instructions
// -> Review), not a single-page form — these tests drive it step by step.
// formData defaults already satisfy every Basic Info requirement except
// title (prepTime/cookTime/servings/difficulty/mealTypes are pre-filled), so
// only title needs to be set before advancing past step 0.

test.describe('Create Recipe', () => {
  let createdRecipeId: string | null = null;

  test.afterEach(async ({ apiContext }) => {
    if (createdRecipeId !== null) {
      await deleteTestRecipe(apiContext, createdRecipeId);
      createdRecipeId = null;
    }
  });

  test('should create a new recipe with all fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    // Step 1: Basic Info
    await authenticatedPage.getByLabel(/recipe title/i).fill('E2E Test Recipe');
    await authenticatedPage.getByLabel(/description/i).fill('A test recipe created by E2E tests');
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Step 2: Ingredients — at least one is required to advance
    await authenticatedPage.getByLabel(/^ingredient$/i).fill('Flour');
    await authenticatedPage.getByLabel(/quantity/i).fill('2');
    await authenticatedPage.getByLabel(/^unit$/i).fill('cups');
    await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();
    await expect(authenticatedPage.getByText('2 cups Flour')).toBeVisible();
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Step 3: Instructions — bulk mode is the default
    await authenticatedPage.getByLabel(/instructions/i).fill('1. Prepare ingredients\n2. Cook\n3. Serve');
    await authenticatedPage.getByRole('button', { name: /apply instructions/i }).click();
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Step 4: Review — submit
    await authenticatedPage.getByRole('button', { name: /create recipe/i }).click();

    // Success message renders on this page before the redirect fires
    await expect(authenticatedPage.getByText(/recipe created successfully/i)).toBeVisible();

    // Should redirect to recipe detail page (recipe ids are UUIDs, not ints)
    await expect(authenticatedPage).toHaveURL(/\/recipes\/[0-9a-f-]+$/, { timeout: 5000 });

    // Capture created recipe ID for cleanup
    const match = authenticatedPage.url().match(/\/recipes\/([0-9a-f-]+)$/);
    if (match) createdRecipeId = match[1];

    // Should display the recipe details
    await expect(authenticatedPage.getByRole('heading', { name: /e2e test recipe/i })).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    // Title is the only required Basic Info field; leave it empty and try
    // to advance past step 1.
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Should show validation error and stay on step 1
    await expect(authenticatedPage.getByText(/recipe title is required/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/recipe title/i)).toBeVisible();
  });

  test('should add and remove ingredients', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');
    await authenticatedPage.getByLabel(/recipe title/i).fill('E2E Ingredients Recipe');
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Add first ingredient
    await authenticatedPage.getByLabel(/^ingredient$/i).fill('Flour');
    await authenticatedPage.getByLabel(/quantity/i).fill('2');
    await authenticatedPage.getByLabel(/^unit$/i).fill('cups');
    await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();

    // Add second ingredient
    await authenticatedPage.getByLabel(/^ingredient$/i).fill('Sugar');
    await authenticatedPage.getByLabel(/quantity/i).fill('1');
    await authenticatedPage.getByLabel(/^unit$/i).fill('cup');
    await authenticatedPage.getByRole('button', { name: /add ingredient/i }).click();

    // Should have 2 ingredients listed
    await expect(authenticatedPage.getByText('2 cups Flour')).toBeVisible();
    await expect(authenticatedPage.getByText('1 cup Sugar')).toBeVisible();
    await expect(authenticatedPage.getByText(/ingredients list \(2\)/i)).toBeVisible();

    // Remove the first ingredient
    await authenticatedPage.getByRole('listitem').filter({ hasText: 'Flour' })
      .getByRole('button').click();

    // Should have 1 ingredient left
    await expect(authenticatedPage.getByText(/ingredients list \(1\)/i)).toBeVisible();
    await expect(authenticatedPage.getByText('2 cups Flour')).not.toBeVisible();
  });

  test('should cancel recipe creation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    // Fill in some data
    await authenticatedPage.getByLabel(/recipe title/i).fill('Test Recipe');

    // Click the back link (there is no explicit "Cancel" button — the
    // wizard uses "Back to Recipes" for this)
    await authenticatedPage.getByRole('button', { name: /back to recipes/i }).click();

    // Should navigate back to recipes list
    await expect(authenticatedPage).toHaveURL('/recipes');
  });
});

// Made with Bob
