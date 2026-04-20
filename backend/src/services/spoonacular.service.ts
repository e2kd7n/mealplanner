/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
}

interface SpoonacularRecipeDetail {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  instructions: string;
  extendedIngredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
  }>;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
    }>;
  }>;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

interface SearchRecipesParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  type?: string;
  maxReadyTime?: number;
  number?: number;
  offset?: number;
}

export class SpoonacularService {
  private apiKey: string;

  constructor() {
    if (!SPOONACULAR_API_KEY) {
      logger.warn('SPOONACULAR_API_KEY not configured. Recipe browse feature will not work.');
      this.apiKey = '';
    } else {
      this.apiKey = SPOONACULAR_API_KEY;
    }
  }

  /**
   * Check if Spoonacular API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for recipes
   */
  async searchRecipes(params: SearchRecipesParams): Promise<{
    results: SpoonacularRecipe[];
    offset: number;
    number: number;
    totalResults: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Spoonacular API key not configured');
    }

    try {
      const response = await axios.get(`${SPOONACULAR_BASE_URL}/recipes/complexSearch`, {
        params: {
          apiKey: this.apiKey,
          query: params.query || '',
          cuisine: params.cuisine,
          diet: params.diet,
          type: params.type,
          maxReadyTime: params.maxReadyTime,
          number: params.number || 12,
          offset: params.offset || 0,
          addRecipeInformation: true,
          fillIngredients: false,
        },
      });

      logger.info(`[SPOONACULAR_SEARCH] Query: ${params.query}, Results: ${response.data.totalResults}`);

      return response.data;
    } catch (error: any) {
      logger.error(`[SPOONACULAR_SEARCH_ERROR] ${error.message}`, {
        params,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 402) {
        throw new Error('Spoonacular API quota exceeded. Please try again later.');
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid Spoonacular API key');
      }

      throw new Error(`Failed to search recipes: ${error.message}`);
    }
  }

  /**
   * Get detailed recipe information
   */
  async getRecipeDetails(recipeId: number): Promise<SpoonacularRecipeDetail> {
    if (!this.isConfigured()) {
      throw new Error('Spoonacular API key not configured');
    }

    try {
      const response = await axios.get(
        `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information`,
        {
          params: {
            apiKey: this.apiKey,
            includeNutrition: true,
          },
        }
      );

      logger.info(`[SPOONACULAR_DETAIL] Recipe ID: ${recipeId}, Title: ${response.data.title}`);

      return response.data;
    } catch (error: any) {
      logger.error(`[SPOONACULAR_DETAIL_ERROR] Recipe ID: ${recipeId}, Error: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 404) {
        throw new Error('Recipe not found');
      }

      if (error.response?.status === 402) {
        throw new Error('Spoonacular API quota exceeded. Please try again later.');
      }

      throw new Error(`Failed to get recipe details: ${error.message}`);
    }
  }

  /**
   * Convert Spoonacular recipe to our recipe format
   */
  convertToOurFormat(spoonacularRecipe: SpoonacularRecipeDetail) {
    // Parse instructions
    let instructions: Array<{ step: number; instruction: string }> = [];
    
    if (spoonacularRecipe.analyzedInstructions && spoonacularRecipe.analyzedInstructions.length > 0) {
      instructions = spoonacularRecipe.analyzedInstructions[0].steps.map((step) => ({
        step: step.number,
        instruction: step.step,
      }));
    } else if (spoonacularRecipe.instructions) {
      // Fallback to plain text instructions
      const steps = spoonacularRecipe.instructions
        .split(/\n+|\d+\.\s*/)
        .filter((s) => s.trim().length > 0);
      instructions = steps.map((instruction, index) => ({
        step: index + 1,
        instruction: instruction.trim(),
      }));
    }

    // Parse ingredients
    const ingredients = spoonacularRecipe.extendedIngredients.map((ing) => ({
      name: ing.name,
      quantity: ing.amount || 1,
      unit: ing.unit || 'unit',
      notes: ing.original,
    }));

    // Determine meal type from dish types
    let mealTypes: string[] = [];
    if (spoonacularRecipe.dishTypes && spoonacularRecipe.dishTypes.length > 0) {
      const dishTypes = spoonacularRecipe.dishTypes.map((dt) => dt.toLowerCase());
      if (dishTypes.some((dt) => dt.includes('breakfast') || dt.includes('brunch'))) {
        mealTypes.push('breakfast');
      }
      if (dishTypes.some((dt) => dt.includes('lunch') || dt.includes('main course') || dt.includes('dinner'))) {
        mealTypes.push('lunch', 'dinner');
      }
      if (dishTypes.some((dt) => dt.includes('dessert'))) {
        mealTypes.push('dessert');
      }
      if (dishTypes.some((dt) => dt.includes('snack') || dt.includes('appetizer'))) {
        mealTypes.push('snack');
      }
    }
    
    // Default to dinner if no meal types identified
    if (mealTypes.length === 0) {
      mealTypes = ['dinner'];
    }

    // Remove duplicates
    mealTypes = [...new Set(mealTypes)];

    // Determine difficulty based on ready time and ingredient count
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (spoonacularRecipe.readyInMinutes <= 30 && ingredients.length <= 8) {
      difficulty = 'easy';
    } else if (spoonacularRecipe.readyInMinutes > 60 || ingredients.length > 15) {
      difficulty = 'hard';
    }

    // Parse nutrition info
    let nutritionInfo = null;
    if (spoonacularRecipe.nutrition?.nutrients) {
      const nutrients = spoonacularRecipe.nutrition.nutrients;
      nutritionInfo = {
        calories: nutrients.find((n) => n.name === 'Calories')?.amount,
        protein: nutrients.find((n) => n.name === 'Protein')?.amount,
        carbs: nutrients.find((n) => n.name === 'Carbohydrates')?.amount,
        fat: nutrients.find((n) => n.name === 'Fat')?.amount,
        fiber: nutrients.find((n) => n.name === 'Fiber')?.amount,
        sugar: nutrients.find((n) => n.name === 'Sugar')?.amount,
      };
    }

    // Strip HTML from summary
    const description = spoonacularRecipe.summary
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    return {
      title: spoonacularRecipe.title,
      description,
      prepTime: Math.round(spoonacularRecipe.readyInMinutes * 0.3), // Estimate 30% prep
      cookTime: Math.round(spoonacularRecipe.readyInMinutes * 0.7), // Estimate 70% cook
      servings: spoonacularRecipe.servings,
      difficulty,
      cuisineType: spoonacularRecipe.cuisines?.[0] || null,
      mealTypes,
      imageUrl: spoonacularRecipe.image,
      ingredients,
      instructions,
      nutritionInfo,
      sourceUrl: spoonacularRecipe.sourceUrl,
      source: 'spoonacular',
      spoonacularId: spoonacularRecipe.id,
    };
  }
}

export const spoonacularService = new SpoonacularService();

// Made with Bob