import { test, expect } from '../../fixtures/auth.fixture';
import { createTestRecipe, deleteTestRecipe, TestRecipe } from '../../helpers/test-data';

// The edit route (/recipes/:id/edit) renders the same 4-step wizard as
// create (Basic Info -> Ingredients -> Instructions -> Review). The test
// recipe's seeded ingredient/instruction (see helpers/test-data.ts) already
// satisfy the Ingredients/Instructions step validation, so editing only
// needs to touch Basic Info and then click through the remaining steps.

test.describe('Edit Recipe', () => {
  let testRecipe: TestRecipe;

  test.beforeEach(async ({ apiContext }) => {
    testRecipe = await createTestRecipe(apiContext, { title: 'Edit Target Recipe' });
  });

  test.afterEach(async ({ apiContext }) => {
    await deleteTestRecipe(apiContext, testRecipe.id);
  });

  test('should edit an existing recipe', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);

    // Click edit button
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();

    // Should navigate to edit page (recipe ids are UUIDs, not ints)
    await expect(authenticatedPage).toHaveURL(/\/recipes\/[0-9a-f-]+\/edit/);

    // Update title and description on step 1 (Basic Info)
    const titleInput = authenticatedPage.getByLabel(/recipe title/i);
    await titleInput.clear();
    await titleInput.fill('Updated Recipe Title');

    const descInput = authenticatedPage.getByLabel(/description/i);
    await descInput.clear();
    await descInput.fill('Updated description');

    // The seeded ingredient/instruction already satisfy steps 2 and 3, so
    // just click through to Review.
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Save changes
    await authenticatedPage.getByRole('button', { name: /update recipe/i }).click();

    // Should show success message before the redirect fires
    await expect(authenticatedPage.getByText(/recipe updated successfully/i)).toBeVisible();

    // Should redirect back to recipe detail
    await expect(authenticatedPage).toHaveURL(`/recipes/${testRecipe.id}`, { timeout: 5000 });

    // Should display updated title
    await expect(authenticatedPage.getByRole('heading', { name: /updated recipe title/i })).toBeVisible();
  });

  test('should cancel editing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);

    // Click edit button
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();

    // Make some changes
    await authenticatedPage.getByLabel(/recipe title/i).fill('Changed Title');

    // There is no explicit "Cancel" button — the wizard uses "Back to
    // Recipes", which returns to the recipes list rather than this recipe's
    // detail page.
    await authenticatedPage.getByRole('button', { name: /back to recipes/i }).click();
    await expect(authenticatedPage).toHaveURL('/recipes');

    // Changes should not have been saved
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);
    await expect(authenticatedPage.getByRole('heading', { name: /edit target recipe/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: /changed title/i })).not.toBeVisible();
  });

  test('should show validation errors when clearing required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);

    // Click edit button
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();

    // Clear the required title field
    await authenticatedPage.getByLabel(/recipe title/i).clear();

    // Try to advance past step 1
    await authenticatedPage.getByRole('button', { name: /^next$/i }).click();

    // Should show validation error and stay on step 1
    await expect(authenticatedPage.getByText(/recipe title is required/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/recipe title/i)).toBeVisible();
  });
});

// Made with Bob
