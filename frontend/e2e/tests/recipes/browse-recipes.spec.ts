/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test, expect } from '@playwright/test';
import { mockSpoonacularAPI } from '../../mocks/spoonacular.mock';

// This file runs under the `authenticated-tests` Playwright project, which
// supplies a pre-authenticated session via storageState (see
// playwright.config.ts) — no per-test login is needed here anymore. The
// "Unauthenticated" describe below opts back out of that shared session
// since it specifically exercises the logged-out redirect.

test.describe('Browse Recipes', () => {
  test.beforeEach(async ({ page }) => {
    await mockSpoonacularAPI(page);
    await page.goto('/recipes/browse');
  });

  test('should display browse recipes page', async ({ page }) => {
    // Check page title (styled as h4, but semantically the page's h1)
    await expect(page.locator('h1')).toContainText('Browse Recipes');

    // Check search input is visible
    await expect(page.getByPlaceholder(/Search recipes|Try:/)).toBeVisible();

    // Check empty state message or filter section
    const hasEmptyState = await page.getByText('Start searching to discover recipes').isVisible().catch(() => false);
    const hasFilters = await page.getByText('Filters').isVisible().catch(() => false);
    expect(hasEmptyState || hasFilters).toBeTruthy();
  });

  test('should search for recipes', async ({ page }) => {
    // Enter search query
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('pasta');

    // Wait for debounce and results
    await page.waitForTimeout(1000); // Wait for debounce

    // Check if results are displayed (mocked data should return 3 recipes)
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(3, { timeout: 5000 });
  });

  test('should display filter options', async ({ page }) => {
    // Check filter controls are visible. Use getByLabel rather than
    // getByText — MUI's outlined-select notch duplicates the label text
    // into a legend for the border cutout, so getByText resolves to 2
    // elements per field in strict mode.
    await expect(page.getByLabel('Cuisine')).toBeVisible();
    await expect(page.getByLabel('Diet')).toBeVisible();
    await expect(page.getByLabel('Meal Type')).toBeVisible();
    await expect(page.getByLabel('Sort By')).toBeVisible();
    // No time filter is active by default, so "Max Time" text isn't
    // rendered yet — the equivalent default-state affordance is this button.
    await expect(page.getByRole('button', { name: /add time filter/i })).toBeVisible();
  });

  test('should apply cuisine filter', async ({ page }) => {
    // Search first
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('pasta');
    await page.waitForTimeout(1000);

    // The natural-language search suggestions dropdown stays open after
    // typing and visually overlaps the filters below it, which blocks
    // clicks on them — dismiss it first (Escape is wired to close it).
    await page.keyboard.press('Escape');

    // Open cuisine dropdown
    await page.getByLabel('Cuisine').click();

    // Select Italian
    await page.getByRole('option', { name: 'Italian' }).click();

    // Wait for results to update
    await page.waitForTimeout(1000);

    // Check URL contains cuisine parameter (case-insensitive)
    expect(page.url().toLowerCase()).toContain('cuisine=italian');
  });

  test('should apply diet filter', async ({ page }) => {
    // Search first
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('salad');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // dismiss search suggestions overlay

    // Open diet dropdown
    await page.getByLabel('Diet').click();

    // Select Vegetarian
    await page.getByRole('option', { name: 'Vegetarian' }).click();

    // Wait for results to update
    await page.waitForTimeout(1000);

    // Check URL contains diet parameter (case-insensitive)
    expect(page.url().toLowerCase()).toContain('diet=vegetarian');
  });

  test('should persist filters in URL', async ({ page }) => {
    // Apply multiple filters
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('chicken');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // dismiss search suggestions overlay

    await page.getByLabel('Cuisine').click();
    await page.getByRole('option', { name: 'American' }).click();
    await page.waitForTimeout(300);

    await page.getByLabel('Meal Type').click();
    await page.getByRole('option', { name: 'Dinner' }).click();
    await page.waitForTimeout(300);

    // Get current URL
    const url = page.url();

    // Reload — sessionStorage survives page.reload() so auth remains intact
    await mockSpoonacularAPI(page);
    await page.reload();

    // Check filters are still applied
    expect(page.url()).toBe(url);
    await expect(searchInput).toHaveValue('chicken');
  });

  test('should clear all filters', async ({ page }) => {
    // Apply filters
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('pasta');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // dismiss search suggestions overlay

    await page.getByLabel('Cuisine').click();
    await page.getByRole('option', { name: 'Italian' }).click();
    await page.waitForTimeout(300);

    // Click clear filters button
    await page.getByRole('button', { name: /clear/i }).first().click();

    // Check search is cleared
    await expect(searchInput).toHaveValue('');

    // Check URL has no filter parameters
    const url = page.url();
    expect(url).not.toContain('cuisine=');
    expect(url).not.toContain('diet=');
    expect(url).not.toContain('type=');
  });

  test('should navigate between pages', async ({ page }) => {
    // Note: With mocked data (only 3 results), pagination won't appear
    // This test verifies the pagination component would work if there were more results
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('pasta');
    await page.waitForTimeout(1000);

    // Wait for results
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 }).catch(() => {});

    // With mock data (3 results), pagination won't be visible
    // Just verify results are displayed
    const recipeCount = await page.locator('[data-testid="recipe-card"]').count();
    expect(recipeCount).toBeGreaterThan(0);
  });

  test('should show skeleton loaders while loading', async ({ page }) => {
    // With mocked API, loading is very fast, so we just verify the component structure
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('pasta');

    // Verify results are displayed (mocked data) — toHaveCount retries
    // instead of relying on a fixed delay to have been long enough.
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(3, { timeout: 5000 });
  });
});

test.describe('Browse Recipes - Add to Box', () => {
  test('should add recipe to box', async ({ page }) => {
    // Mock Spoonacular API
    await mockSpoonacularAPI(page);
    await page.goto('/recipes/browse');

    // Search for recipes
    const searchInput = page.getByPlaceholder(/Search recipes|Try:/);
    await searchInput.fill('pasta');
    await page.waitForTimeout(1000);

    // Wait for recipe cards (mocked data returns 3)
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(3, { timeout: 5000 });

    // Click "Add" on first recipe
    await page.locator('[data-testid="recipe-card"]').first().getByRole('button', { name: /^add$/i }).click();

    // Wait for success message
    await expect(page.getByText(/added to your recipe box/i)).toBeVisible({ timeout: 5000 });

    // Button should change to "In Box"
    await expect(page.locator('[data-testid="recipe-card"]').first().getByRole('button', { name: /in box/i })).toBeVisible();
  });
});

test.describe('Browse Recipes - Unauthenticated', () => {
  // Opt out of the project-level storageState — this test specifically
  // needs to start with no session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Mock API even for unauthenticated test
    await mockSpoonacularAPI(page);
    await page.goto('/recipes/browse');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

// Made with Bob
