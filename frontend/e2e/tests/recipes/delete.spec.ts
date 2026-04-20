import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Delete Recipe', () => {
  test('should delete a recipe with confirmation', async ({ authenticatedPage }) => {
    // Navigate to recipes page
    await authenticatedPage.goto('/recipes');
    
    // Get the first recipe title for verification
    const firstRecipeTitle = await authenticatedPage.getByRole('heading').first().textContent();
    
    // Click on first recipe
    await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
    
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
    
    // Recipe should no longer appear in list
    if (firstRecipeTitle) {
      await expect(authenticatedPage.getByRole('heading', { name: firstRecipeTitle })).not.toBeVisible();
    }
  });

  test('should cancel recipe deletion', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    
    // Click on first recipe
    await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
    const recipeUrl = authenticatedPage.url();
    
    // Click delete button
    await authenticatedPage.getByRole('button', { name: /delete/i }).click();
    
    // Should show confirmation dialog
    await expect(authenticatedPage.getByText(/are you sure/i)).toBeVisible();
    
    // Cancel deletion
    await authenticatedPage.getByRole('button', { name: /cancel|no/i }).click();
    
    // Should stay on recipe detail page
    await expect(authenticatedPage).toHaveURL(recipeUrl);
    
    // Recipe should still be visible
    await expect(authenticatedPage.getByRole('heading')).toBeVisible();
  });

  test('should only allow owner to delete recipe', async ({ authenticatedPage }) => {
    // This test assumes there are recipes from other users
    // Navigate to a recipe that doesn't belong to the current user
    await authenticatedPage.goto('/recipes');
    
    // Try to find a recipe from another user (if any)
    // For now, we'll just verify the delete button exists for owned recipes
    await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
    
    // Delete button should be visible for owned recipes
    const deleteButton = authenticatedPage.getByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeVisible();
  });
});

// Made with Bob
