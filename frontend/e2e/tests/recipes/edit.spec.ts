import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Edit Recipe', () => {
  test('should edit an existing recipe', async ({ authenticatedPage }) => {
    // Navigate to recipes page
    await authenticatedPage.goto('/recipes');
    
    // Click on first recipe
    await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
    
    // Click edit button
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();
    
    // Should navigate to edit page
    await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+\/edit/);
    
    // Update title
    const titleInput = authenticatedPage.getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill('Updated Recipe Title');
    
    // Update description
    const descInput = authenticatedPage.getByLabel(/description/i);
    await descInput.clear();
    await descInput.fill('Updated description');
    
    // Save changes
    await authenticatedPage.getByRole('button', { name: /save changes/i }).click();
    
    // Should redirect back to recipe detail
    await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+$/);
    
    // Should show success message
    await expect(authenticatedPage.getByText(/recipe updated successfully/i)).toBeVisible();
    
    // Should display updated title
    await expect(authenticatedPage.getByRole('heading', { name: /updated recipe title/i })).toBeVisible();
  });

  test('should cancel editing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    
    // Click on first recipe
    await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
    const recipeUrl = authenticatedPage.url();
    
    // Click edit button
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();
    
    // Make some changes
    await authenticatedPage.getByLabel(/title/i).fill('Changed Title');
    
    // Click cancel
    await authenticatedPage.getByRole('button', { name: /cancel/i }).click();
    
    // Should navigate back to recipe detail
    await expect(authenticatedPage).toHaveURL(recipeUrl);
    
    // Changes should not be saved
    await expect(authenticatedPage.getByRole('heading', { name: /changed title/i })).not.toBeVisible();
  });

  test('should show validation errors when clearing required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    
    // Click on first recipe
    await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
    
    // Click edit button
    await authenticatedPage.getByRole('button', { name: /edit/i }).click();
    
    // Clear required fields
    await authenticatedPage.getByLabel(/title/i).clear();
    await authenticatedPage.getByLabel(/description/i).clear();
    
    // Try to save
    await authenticatedPage.getByRole('button', { name: /save changes/i }).click();
    
    // Should show validation errors
    await expect(authenticatedPage.getByText(/title is required/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/description is required/i)).toBeVisible();
  });
});

// Made with Bob
