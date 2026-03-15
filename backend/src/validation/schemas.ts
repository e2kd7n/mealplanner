/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { z } from 'zod';

// Common schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  familyName: z.string().min(1, 'Family name is required').trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Recipe schemas
export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  prepTime: z.number().int().min(0, 'Prep time must be positive'),
  cookTime: z.number().int().min(0, 'Cook time must be positive'),
  servings: z.number().int().min(1, 'Servings must be at least 1'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    message: 'Difficulty must be easy, medium, or hard',
  }),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert'], {
    message: 'Invalid meal type',
  }),
  cuisineType: z.string().optional(),
  kidFriendly: z.boolean().default(false),
  ingredients: z.array(z.object({
    ingredientId: z.string().uuid('Invalid ingredient ID'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
  })).min(1, 'At least one ingredient is required'),
  instructions: z.any(), // JSON field, validated by Prisma
  nutritionInfo: z.any().optional(), // JSON field
  costEstimate: z.number().positive().optional(),
  isPublic: z.boolean().default(false),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export const recipeQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 12)),
  search: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  maxPrepTime: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  kidFriendly: z.string().optional().transform((val) => val === 'true'),
});

export const rateRecipeSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  wouldMakeAgain: z.boolean(),
  comment: z.string().optional(),
});

// Meal Plan schemas
export const createMealPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid date format'),
});

export const updateMealPlanSchema = createMealPlanSchema.partial();

export const addRecipeToMealPlanSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  date: z.string().datetime('Invalid date format'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number().int().min(1, 'Servings must be at least 1').optional(),
});

// Grocery List schemas
export const createGroceryListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  mealPlanId: z.string().uuid('Invalid meal plan ID').optional(),
});

export const updateGroceryListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
});

export const addGroceryItemSchema = z.object({
  ingredientId: z.string().uuid('Invalid ingredient ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
});

export const updateGroceryItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  purchased: z.boolean().optional(),
  notes: z.string().optional(),
});

// Pantry schemas
export const addPantryItemSchema = z.object({
  ingredientId: z.string().uuid('Invalid ingredient ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  location: z.string().min(1, 'Location is required').trim(),
  expirationDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().optional(),
});

export const updatePantryItemSchema = addPantryItemSchema.partial();

// User schemas
export const updateProfileSchema = z.object({
  familyName: z.string().min(1, 'Family name is required').max(100, 'Name too long').trim(),
});

export const updatePreferencesSchema = z.object({
  dietaryRestrictions: z.array(z.enum(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'])).optional(),
  cookingSkillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  avoidedIngredients: z.array(z.string()).optional(),
});

// Family Member schemas
export const createFamilyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  ageGroup: z.enum(['infant', 'toddler', 'child', 'teen', 'adult'], {
    message: 'Invalid age group',
  }),
  dietaryRestrictions: z.array(z.enum(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'])).optional(),
  cookingSkillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  avoidedIngredients: z.array(z.string()).optional(),
});

export const updateFamilyMemberSchema = createFamilyMemberSchema.partial();

// Ingredient schemas
export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').trim(),
  category: z.string().optional(),
  defaultUnit: z.string().optional(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

// Made with Bob
