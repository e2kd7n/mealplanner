import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createRecipeSchema,
  createMealPlanSchema,
  addGroceryItemSchema,
  addPantryItemSchema,
  importRecipeUrlSchema,
  rateRecipeSchema,
  idParamSchema,
  paginationSchema,
  recipeQuerySchema,
  createFamilyMemberSchema,
  updatePreferencesSchema,
} from '../../validation/schemas';

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'Test@Example.com',
        password: 'securepass123',
        familyName: 'Smith',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.familyName).toBe('Smith');
      }
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'securepass123',
        familyName: 'Smith',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        familyName: 'Smith',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty family name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123',
        familyName: '',
      });
      expect(result.success).toBe(false);
    });

    it('trims family name whitespace', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123',
        familyName: '  Smith  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.familyName).toBe('Smith');
      }
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'Test@Example.com',
        password: 'any-password',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Recipe Schemas', () => {
  const validRecipe = {
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'medium' as const,
    mealTypes: ['dinner' as const],
    ingredients: [
      { ingredientName: 'Spaghetti', quantity: 400, unit: 'g' },
    ],
    instructions: [{ step: 1, instruction: 'Boil water' }],
  };

  describe('createRecipeSchema', () => {
    it('accepts valid recipe', () => {
      const result = createRecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects title over 200 chars', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('rejects negative prep time', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, prepTime: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects zero servings', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, servings: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid difficulty', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, difficulty: 'expert' });
      expect(result.success).toBe(false);
    });

    it('rejects empty meal types array', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, mealTypes: [] });
      expect(result.success).toBe(false);
    });

    it('rejects empty ingredients array', () => {
      const result = createRecipeSchema.safeParse({ ...validRecipe, ingredients: [] });
      expect(result.success).toBe(false);
    });

    it('defaults kidFriendly to false', () => {
      const result = createRecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kidFriendly).toBe(false);
      }
    });

    it('accepts optional fields', () => {
      const result = createRecipeSchema.safeParse({
        ...validRecipe,
        cuisineType: 'Italian',
        kidFriendly: true,
        costEstimate: 12.50,
        isPublic: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('rateRecipeSchema', () => {
    it('accepts valid rating', () => {
      const result = rateRecipeSchema.safeParse({ rating: 4, wouldMakeAgain: true });
      expect(result.success).toBe(true);
    });

    it('rejects rating below 1', () => {
      const result = rateRecipeSchema.safeParse({ rating: 0, wouldMakeAgain: true });
      expect(result.success).toBe(false);
    });

    it('rejects rating above 5', () => {
      const result = rateRecipeSchema.safeParse({ rating: 6, wouldMakeAgain: true });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer rating', () => {
      const result = rateRecipeSchema.safeParse({ rating: 3.5, wouldMakeAgain: true });
      expect(result.success).toBe(false);
    });
  });

  describe('recipeQuerySchema', () => {
    it('provides defaults for empty query', () => {
      const result = recipeQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(12);
      }
    });

    it('transforms string page/limit to numbers', () => {
      const result = recipeQuerySchema.safeParse({ page: '3', limit: '20' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(20);
      }
    });

    it('transforms kidFriendly string to boolean', () => {
      const result = recipeQuerySchema.safeParse({ kidFriendly: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kidFriendly).toBe(true);
      }
    });
  });
});

describe('Meal Plan Schemas', () => {
  describe('createMealPlanSchema', () => {
    it('accepts valid meal plan', () => {
      const result = createMealPlanSchema.safeParse({
        name: 'Week 1',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-07T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = createMealPlanSchema.safeParse({
        name: 'Week 1',
        startDate: '2026-06-01',
        endDate: '2026-06-07',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = createMealPlanSchema.safeParse({
        name: '',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-07T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Grocery List Schemas', () => {
  describe('addGroceryItemSchema', () => {
    it('accepts valid grocery item', () => {
      const result = addGroceryItemSchema.safeParse({
        ingredientId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
        unit: 'lbs',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID ingredient ID', () => {
      const result = addGroceryItemSchema.safeParse({
        ingredientId: 'not-a-uuid',
        quantity: 2,
        unit: 'lbs',
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero quantity', () => {
      const result = addGroceryItemSchema.safeParse({
        ingredientId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
        unit: 'lbs',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Pantry Schemas', () => {
  describe('addPantryItemSchema', () => {
    it('accepts valid pantry item', () => {
      const result = addPantryItemSchema.safeParse({
        ingredientId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 5,
        unit: 'kg',
        location: 'Fridge',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing location', () => {
      const result = addPantryItemSchema.safeParse({
        ingredientId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 5,
        unit: 'kg',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional expiration date', () => {
      const result = addPantryItemSchema.safeParse({
        ingredientId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 5,
        unit: 'kg',
        location: 'Pantry',
        expirationDate: '2026-12-31T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Import Schemas', () => {
  describe('importRecipeUrlSchema', () => {
    it('accepts valid URL', () => {
      const result = importRecipeUrlSchema.safeParse({ url: 'https://example.com/recipe' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = importRecipeUrlSchema.safeParse({ url: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Common Schemas', () => {
  describe('idParamSchema', () => {
    it('accepts valid UUID', () => {
      const result = idParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID', () => {
      const result = idParamSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('provides defaults for empty input', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });
  });
});

describe('Family Member Schemas', () => {
  describe('createFamilyMemberSchema', () => {
    it('accepts valid family member', () => {
      const result = createFamilyMemberSchema.safeParse({
        name: 'Alice',
        ageGroup: 'child',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid age group', () => {
      const result = createFamilyMemberSchema.safeParse({
        name: 'Alice',
        ageGroup: 'baby',
      });
      expect(result.success).toBe(false);
    });

    it('accepts dietary restrictions', () => {
      const result = createFamilyMemberSchema.safeParse({
        name: 'Alice',
        ageGroup: 'adult',
        dietaryRestrictions: ['vegetarian', 'gluten-free'],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Preferences Schema', () => {
  describe('updatePreferencesSchema', () => {
    it('accepts valid preferences', () => {
      const result = updatePreferencesSchema.safeParse({
        weeklyBudget: 150,
        cookingSkillLevel: 'intermediate',
        maxPrepTimeWeeknight: 30,
      });
      expect(result.success).toBe(true);
    });

    it('accepts null weekly budget', () => {
      const result = updatePreferencesSchema.safeParse({
        weeklyBudget: null,
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty object (all optional)', () => {
      const result = updatePreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
