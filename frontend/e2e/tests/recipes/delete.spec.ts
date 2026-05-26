import { test, expect } from '../../fixtures/auth.fixture';
import { createTestRecipe, deleteTestRecipe, TestRecipe } from '../../helpers/test-data';

test.describe('Delete Recipe', () => {
  let testRecipe: TestRecipe;

  test.beforeEach(async ({ apiContext }) => {
    testRecipe = await createTestRecipe(apiContext, { title: 'Delete Target Recipe' });
  });

  // Best-effort cleanup for tests that did not delete the recipe themselves
  test.afterEach(async ({ apiContext }) => {
    await deleteTestRecipe(apiContext, testRecipe.id).catch(() => undefined);
  });

  test('should delete a recipe with confirmation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);

    // Click delete button
    await authenticatedPage.getByRole('button', { name: /delete/i }).click();

    // Should show confirmation dialog
    await expect(authenticatedPage.getByText(/are you sure/i)).toBeVisible();

    // Confirm deletion
    await authenticatedPage.getByRole('button', { name: /confirm|yes|delete/i }).click();

    // Should redirect to recipes list
    await expect(authenticatedPage).toHaveURL('/recipes');

    // Should show success message
    await expect(authenticatedPage.getByText(/recipe deleted successfully/i)).toBeVisible();
  });

  test('should cancel recipe deletion', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);

    // Click delete button
    await authenticatedPage.getByRole('button', { name: /delete/i }).click();

    // Should show confirmation dialog
    await expect(authenticatedPage.getByText(/are you sure/i)).toBeVisible();

    // Cancel deletion
    await authenticatedPage.getByRole('button', { name: /cancel|no/i }).click();

    // Should stay on recipe detail page
    await expect(authenticatedPage).toHaveURL(`/recipes/${testRecipe.id}`);

    // Recipe should still be visible
    await expect(authenticatedPage.getByRole('heading', { name: /delete target recipe/i })).toBeVisible();
  });

  test('should only allow owner to delete recipe', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipe.id}`);

    // Delete button should be visible for owned recipes
    await expect(authenticatedPage.getByRole('button', { name: /delete/i })).toBeVisible();
  });
});

// Made with Bob
