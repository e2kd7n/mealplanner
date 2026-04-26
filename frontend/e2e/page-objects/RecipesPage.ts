/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Recipes Page
 * Encapsulates all interactions with the recipes listing page
 */
export class RecipesPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly sortSelect: Locator;
  readonly createButton: Locator;
  readonly importButton: Locator;
  readonly recipeCards: Locator;
  readonly pagination: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search recipes/i);
    this.filterButton = page.getByRole('button', { name: /filter/i });
    // Issue #138: Fixed sort dropdown selector to work with MUI Select component
    // Use a more robust selector that finds the Select by its label
    this.sortSelect = page.locator('label:has-text("Sort By")').locator('..').locator('[role="combobox"]');
    this.createButton = page.getByRole('button', { name: /create recipe/i });
    this.importButton = page.getByRole('button', { name: /import recipe/i });
    this.recipeCards = page.locator('[data-testid="recipe-card"]').or(page.locator('.MuiCard-root'));
    this.pagination = page.locator('[role="navigation"]').last();
    this.nextPageButton = page.getByRole('button', { name: /next/i });
    this.prevPageButton = page.getByRole('button', { name: /previous/i });
  }

  async goto() {
    await this.page.goto('/recipes');
    await this.page.waitForLoadState('networkidle');
  }

  async searchRecipes(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(option: string) {
    await this.sortSelect.click();
    await this.page.getByRole('option', { name: new RegExp(option, 'i') }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickRecipe(title: string) {
    await this.page.getByText(title).first().click();
  }

  async clickRecipeByIndex(index: number) {
    await this.recipeCards.nth(index).click();
  }

  async getRecipeCount() {
    await this.recipeCards.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.recipeCards.count();
  }

  async clickCreateRecipe() {
    await this.createButton.click();
  }

  async clickImportRecipe() {
    await this.importButton.click();
  }

  async goToNextPage() {
    await this.nextPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPreviousPage() {
    await this.prevPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openFilters() {
    await this.filterButton.click();
  }

  async filterByDifficulty(difficulty: string) {
    await this.openFilters();
    await this.page.getByLabel(new RegExp(difficulty, 'i')).check();
    await this.page.getByRole('button', { name: /apply/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByMealType(mealType: string) {
    await this.openFilters();
    await this.page.getByLabel(new RegExp(mealType, 'i')).check();
    await this.page.getByRole('button', { name: /apply/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clearFilters() {
    await this.openFilters();
    await this.page.getByRole('button', { name: /clear/i }).click();
    await this.page.waitForLoadState('networkidle');
  }
}

// Made with Bob