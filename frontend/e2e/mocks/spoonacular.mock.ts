/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Page } from '@playwright/test';

export const mockSpoonacularAPI = async (page: Page) => {
  // Mock search endpoint
  await page.route('**/api/recipes/browse/search*', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('query') || '';
    
    const mockResponse = {
      success: true,
      data: {
        results: [
          {
            id: 1001,
            title: `Mock ${query || 'Recipe'} 1`,
            image: 'https://via.placeholder.com/312x231.png?text=Recipe+1',
            imageType: 'png',
            readyInMinutes: 30,
            servings: 4,
            sourceUrl: 'https://example.com/recipe1',
            cuisines: ['Italian'],
            diets: ['vegetarian'],
            dishTypes: ['dinner'],
          },
          {
            id: 1002,
            title: `Mock ${query || 'Recipe'} 2`,
            image: 'https://via.placeholder.com/312x231.png?text=Recipe+2',
            imageType: 'png',
            readyInMinutes: 45,
            servings: 2,
            sourceUrl: 'https://example.com/recipe2',
            cuisines: ['Mexican'],
            diets: [],
            dishTypes: ['lunch'],
          },
          {
            id: 1003,
            title: `Mock ${query || 'Recipe'} 3`,
            image: 'https://via.placeholder.com/312x231.png?text=Recipe+3',
            imageType: 'png',
            readyInMinutes: 20,
            servings: 6,
            sourceUrl: 'https://example.com/recipe3',
            cuisines: ['American'],
            diets: ['gluten free'],
            dishTypes: ['breakfast'],
          },
        ],
        offset: parseInt(url.searchParams.get('offset') || '0'),
        number: parseInt(url.searchParams.get('number') || '12'),
        totalResults: 3,
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    });
  });

  // Mock recipe details endpoint
  await page.route('**/api/recipes/browse/*', async (route) => {
    const url = route.request().url();
    const recipeId = url.match(/\/browse\/(\d+)/)?.[1];

    if (route.request().method() === 'GET') {
      const mockResponse = {
        success: true,
        data: {
          id: parseInt(recipeId || '1001'),
          title: `Mock Recipe ${recipeId}`,
          image: `https://via.placeholder.com/556x370.png?text=Recipe+${recipeId}`,
          readyInMinutes: 30,
          servings: 4,
          sourceUrl: `https://example.com/recipe${recipeId}`,
          summary: 'This is a mock recipe for testing purposes.',
          cuisines: ['Italian'],
          dishTypes: ['dinner'],
          diets: ['vegetarian'],
          instructions: 'Mock instructions for testing.',
          extendedIngredients: [
            {
              id: 1,
              name: 'tomato',
              amount: 2,
              unit: 'cups',
              original: '2 cups tomato',
            },
            {
              id: 2,
              name: 'pasta',
              amount: 1,
              unit: 'lb',
              original: '1 lb pasta',
            },
          ],
          analyzedInstructions: [
            {
              name: '',
              steps: [
                { number: 1, step: 'Boil water' },
                { number: 2, step: 'Cook pasta' },
                { number: 3, step: 'Add sauce' },
              ],
            },
          ],
          nutrition: {
            nutrients: [
              { name: 'Calories', amount: 350, unit: 'kcal' },
              { name: 'Protein', amount: 12, unit: 'g' },
              { name: 'Carbohydrates', amount: 45, unit: 'g' },
              { name: 'Fat', amount: 8, unit: 'g' },
            ],
          },
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    } else if (route.request().method() === 'POST' && url.includes('/add-to-box')) {
      // Mock add to box endpoint
      const mockResponse = {
        success: true,
        message: 'Recipe added to your recipe box',
        data: {
          id: 'mock-recipe-id',
          title: `Mock Recipe ${recipeId}`,
          userId: 'test-user',
        },
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    }
  });
};

// Made with Bob