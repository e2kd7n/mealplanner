import { APIRequestContext } from '@playwright/test';

export interface TestRecipe {
  id: string;
  title: string;
}

const BASE_RECIPE = {
  title: 'E2E Test Recipe',
  description: 'Created by automated E2E tests — safe to delete',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'easy',
  mealTypes: ['dinner'],
  // Array form (not a plain string) — CreateRecipe's edit-mode loader only
  // recognizes `Array.isArray(recipe.instructions)`, otherwise it treats the
  // recipe as having no instructions at all, which blocks the edit wizard's
  // own step validation.
  instructions: [{ step: 1, instruction: 'Test step' }],
  // At least one ingredient — the edit wizard's Ingredients step requires
  // one to advance, and a recipe created with none can't otherwise reach
  // its own Instructions/Review steps in edit mode.
  ingredients: [{ ingredientName: 'Test Ingredient', quantity: 1, unit: 'unit' }],
};

/**
 * Fetch a CSRF token from the backend.
 * The backend uses a signed double-submit cookie pattern: GET /api/csrf-token
 * sets a csrf cookie in the request context and returns the matching token
 * value. Pass that value as X-CSRF-Token on subsequent state-changing requests.
 */
async function fetchCsrfToken(api: APIRequestContext): Promise<string> {
  const resp = await api.get('/api/csrf-token');
  if (!resp.ok()) throw new Error(`Failed to fetch CSRF token: ${resp.status()}`);
  const { csrfToken } = await resp.json();
  return csrfToken;
}

export async function createTestRecipe(
  api: APIRequestContext,
  overrides: Record<string, unknown> = {}
): Promise<TestRecipe> {
  const csrfToken = await fetchCsrfToken(api);
  const response = await api.post('/api/recipes', {
    data: { ...BASE_RECIPE, ...overrides },
    headers: { 'X-CSRF-Token': csrfToken },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create test recipe: ${response.status()} ${await response.text()}`);
  }
  const data = await response.json();
  return { id: data.id, title: data.title };
}

export async function deleteTestRecipe(api: APIRequestContext, id: string): Promise<void> {
  const csrfToken = await fetchCsrfToken(api);
  await api.delete(`/api/recipes/${id}`, {
    headers: { 'X-CSRF-Token': csrfToken },
  });
  // Ignore 404 — recipe may have already been deleted by the test itself
}
