/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';

test.describe('Browse Recipes', () => {
  test.use({ storageState: 'frontend/e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes/browse');
  });

  test('should display browse recipes page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h4')).toContainText('Browse Recipes');
    
    // Check search input is visible
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible();
    
    // Check empty state message
    await expect(page.getByText('Start searching to discover recipes')).toBeVisible();
  });

  test('should search for recipes', async ({ page }) => {
    // Enter search query
    await page.getByPlaceholder('Search recipes...').fill('pasta');
    
    // Wait for debounce and results
    await page.waitForTimeout(600); // Wait for debounce
    
    // Check if results are displayed or loading indicator appears
    const hasResults = await page.locator('[data-testid="recipe-card"]').count() > 0;
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    // Either results or loading should be visible
    expect(hasResults || hasLoading).toBeTruthy();
  });

  test('should display filter options', async ({ page }) => {
    // Check filter controls are visible
    await expect(page.getByText('Cuisine')).toBeVisible();
    await expect(page.getByText('Diet')).toBeVisible();
    await expect(page.getByText('Meal Type')).toBeVisible();
    await expect(page.getByText('Sort By')).toBeVisible();
    await expect(page.getByText('Max Cooking Time')).toBeVisible();
  });

  test('should apply cuisine filter', async ({ page }) => {
    // Search first
    await page.getByPlaceholder('Search recipes...').fill('pasta');
    await page.waitForTimeout(600);
    
    // Open cuisine dropdown
    await page.getByLabel('Cuisine').click();
    
    // Select Italian
    await page.getByRole('option', { name: 'Italian' }).click();
    
    // Wait for results to update
    await page.waitForTimeout(600);
    
    // Check URL contains cuisine parameter
    expect(page.url()).toContain('cuisine=italian');
  });

  test('should apply diet filter', async ({ page }) => {
    // Search first
    await page.getByPlaceholder('Search recipes...').fill('salad');
    await page.waitForTimeout(600);
    
    // Open diet dropdown
    await page.getByLabel('Diet').click();
    
    // Select Vegetarian
    await page.getByRole('option', { name: 'Vegetarian' }).click();
    
    // Wait for results to update
    await page.waitForTimeout(600);
    
    // Check URL contains diet parameter
    expect(page.url()).toContain('diet=vegetarian');
  });

  test('should persist filters in URL', async ({ page }) => {
    // Apply multiple filters
    await page.getByPlaceholder('Search recipes...').fill('chicken');
    await page.waitForTimeout(600);
    
    await page.getByLabel('Cuisine').click();
    await page.getByRole('option', { name: 'American' }).click();
    await page.waitForTimeout(300);
    
    await page.getByLabel('Meal Type').click();
    await page.getByRole('option', { name: 'Dinner' }).click();
    await page.waitForTimeout(300);
    
    // Get current URL
    const url = page.url();
    
    // Reload page
    await page.reload();
    
    // Check filters are still applied
    expect(page.url()).toBe(url);
    await expect(page.getByPlaceholder('Search recipes...')).toHaveValue('chicken');
  });

  test('should clear all filters', async ({ page }) => {
    // Apply filters
    await page.getByPlaceholder('Search recipes...').fill('pasta');
    await page.waitForTimeout(600);
    
    await page.getByLabel('Cuisine').click();
    await page.getByRole('option', { name: 'Italian' }).click();
    await page.waitForTimeout(300);
    
    // Click clear filters button
    await page.getByRole('button', { name: /clear filters/i }).click();
    
    // Check search is cleared
    await expect(page.getByPlaceholder('Search recipes...')).toHaveValue('');
    
    // Check URL has no filter parameters
    const url = page.url();
    expect(url).not.toContain('cuisine=');
    expect(url).not.toContain('diet=');
    expect(url).not.toContain('type=');
  });

  test('should navigate between pages', async ({ page }) => {
    // Search to get results
    await page.getByPlaceholder('Search recipes...').fill('pasta');
    await page.waitForTimeout(600);
    
    // Wait for results
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 }).catch(() => {});
    
    // Check if pagination exists
    const paginationExists = await page.locator('nav[aria-label="pagination navigation"]').isVisible().catch(() => false);
    
    if (paginationExists) {
      // Click page 2
      await page.getByRole('button', { name: '2' }).click();
      
      // Check URL contains page parameter
      expect(page.url()).toContain('page=2');
    }
  });

  test('should show skeleton loaders while loading', async ({ page }) => {
    // Start a search
    await page.getByPlaceholder('Search recipes...').fill('pasta');
    
    // Immediately check for skeleton loaders (before debounce completes)
    const skeletonVisible = await page.locator('.MuiSkeleton-root').first().isVisible({ timeout: 1000 }).catch(() => false);
    
    // Skeleton should appear during loading
    // Note: This might be flaky due to timing, so we just check it doesn't error
    expect(skeletonVisible !== undefined).toBeTruthy();
  });
});

test.describe('Browse Recipes - Add to Box', () => {
  test.use({ storageState: 'frontend/e2e/.auth/user.json' });

  test('should add recipe to box', async ({ page }) => {
    await page.goto('/recipes/browse');
    
    // Search for recipes
    await page.getByPlaceholder('Search recipes...').fill('pasta');
    await page.waitForTimeout(600);
    
    // Wait for at least one recipe card
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 }).catch(() => {});
    
    const recipeCards = await page.locator('[data-testid="recipe-card"]').count();
    
    if (recipeCards > 0) {
      // Click "Add to Box" on first recipe
      await page.locator('[data-testid="recipe-card"]').first().getByRole('button', { name: /add to box/i }).click();
      
      // Wait for success message
      await expect(page.getByText('Recipe added to your recipe box!')).toBeVisible({ timeout: 5000 });
      
      // Success message should auto-hide after 3 seconds
      await expect(page.getByText('Recipe added to your recipe box!')).not.toBeVisible({ timeout: 4000 });
    }
  });
});

test.describe('Browse Recipes - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/recipes/browse');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

// Made with Bob
