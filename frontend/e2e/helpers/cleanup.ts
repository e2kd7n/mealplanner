import { Page } from '@playwright/test';

/**
 * Cleanup helper for E2E tests
 * Provides utilities to clean up test data after tests run
 */

export class TestCleanup {
  /**
   * Delete all recipes created during tests via API
   */
  static async deleteTestRecipes(page: Page): Promise<void> {
    try {
      // Get all recipes
      const response = await page.request.get('/api/recipes?limit=100');
      if (!response.ok()) return;

      const data = await response.json();
      const recipes = data.recipes || [];

      // Delete test recipes
      for (const recipe of recipes) {
        if (
          recipe.title?.includes('E2E Test') ||
          recipe.title?.includes('Test Recipe') ||
          recipe.title?.includes('Updated Recipe')
        ) {
          await page.request.delete(`/api/recipes/${recipe.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup test recipes:', error);
    }
  }

  /**
   * Delete all meal plans created during tests via API
   */
  static async deleteTestMealPlans(page: Page): Promise<void> {
    try {
      const response = await page.request.get('/api/meal-plans');
      if (!response.ok()) return;

      const mealPlans = await response.json();

      for (const plan of mealPlans) {
        if (plan.name?.includes('Test')) {
          await page.request.delete(`/api/meal-plans/${plan.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup test meal plans:', error);
    }
  }

  /**
   * Delete all grocery lists created during tests via API
   */
  static async deleteTestGroceryLists(page: Page): Promise<void> {
    try {
      const response = await page.request.get('/api/grocery-lists');
      if (!response.ok()) return;

      const lists = await response.json();

      for (const list of lists) {
        await page.request.delete(`/api/grocery-lists/${list.id}`);
      }
    } catch (error) {
      console.error('Failed to cleanup test grocery lists:', error);
    }
  }

  /**
   * Clean up all test data
   */
  static async cleanupAllTestData(page: Page): Promise<void> {
    await this.deleteTestGroceryLists(page);
    await this.deleteTestMealPlans(page);
    await this.deleteTestRecipes(page);
  }

  /**
   * Clear browser storage
   */
  static async clearBrowserStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  }
}

// Made with Bob
