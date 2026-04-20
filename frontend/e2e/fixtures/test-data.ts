/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Test data generators for E2E tests
 * Generates unique test data to avoid conflicts between tests
 */

export const generateTestUser = () => ({
  email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'TestPass123!',
  familyName: `Test Family ${Date.now()}`,
});

export const generateTestRecipe = () => ({
  title: `Test Recipe ${Date.now()}`,
  description: 'A delicious test recipe created by automated tests',
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'medium' as const,
  kidFriendly: true,
  cuisineType: 'American',
  mealTypes: ['dinner'],
  ingredients: [
    { name: 'Test Ingredient 1', quantity: 2, unit: 'cups', notes: '' },
    { name: 'Test Ingredient 2', quantity: 1, unit: 'tbsp', notes: 'optional' },
    { name: 'Test Ingredient 3', quantity: 3, unit: 'pieces', notes: '' },
  ],
  instructions: [
    'Step 1: Prepare all ingredients',
    'Step 2: Mix ingredients together',
    'Step 3: Cook for 30 minutes',
    'Step 4: Serve hot and enjoy',
  ],
});

export const generateTestMealPlan = () => ({
  name: `Test Meal Plan ${Date.now()}`,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
});

export const generateTestGroceryItem = () => ({
  name: `Test Item ${Date.now()}`,
  quantity: 1,
  unit: 'piece',
  category: 'Other',
});

// Made with Bob