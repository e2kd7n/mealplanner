/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../page-objects/RecipesPage';

test.describe('Browse Recipes', () => {
  test('should display recipe list', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    // Should show at least one recipe (from seed data)
    const count = await recipesPage.getRecipeCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to recipe detail', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    // Get first recipe card
    const firstRecipe = recipesPage.recipeCards.first();
    await firstRecipe.waitFor({ state: 'visible' });
    
    // Get the title
    const title = await firstRecipe.locator('h2, h3, h5, h6').first().textContent();
    
    // Click the recipe
    await firstRecipe.click();
    
    // Should navigate to recipe detail page
    await expect(authenticatedPage).toHaveURL(/.*recipes\/\d+/);
    
    // Should show the recipe title
    if (title) {
      await expect(authenticatedPage.getByRole('heading', { name: title })).toBeVisible();
    }
  });

  test('should search recipes', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    // Search for a recipe
    await recipesPage.searchRecipes('pasta');
    
    // URL should contain search query
    await expect(authenticatedPage).toHaveURL(/.*search=pasta/);
  });

  test.skip('should sort recipes', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    // Sort by title
    await recipesPage.sortBy('title');
    
    // URL should contain sort parameter
    await expect(authenticatedPage).toHaveURL(/.*sortBy=title/);
  });

  test('should paginate through recipes', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    // Check if next button exists and is enabled
    const nextButton = recipesPage.nextPageButton;
    const isEnabled = await nextButton.isEnabled().catch(() => false);
    
    if (isEnabled) {
      await recipesPage.goToNextPage();
      
      // URL should contain page parameter
      await expect(authenticatedPage).toHaveURL(/.*page=2/);
    } else {
      // Skip if not enough recipes for pagination
      test.skip();
    }
  });

  test('should navigate to create recipe page', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
    
    // Click create recipe button
    await recipesPage.clickCreateRecipe();
    
    // Should navigate to create recipe page
    await expect(authenticatedPage).toHaveURL(/.*recipes\/create/);
  });
});

// Made with Bob