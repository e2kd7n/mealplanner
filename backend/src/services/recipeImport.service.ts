/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import scrapeRecipe from '@rethora/url-recipe-scraper';
import { logger } from '../utils/logger';
import prismaClient from '../utils/prisma';

interface ParsedRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisineType: string | null;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  imageUrl: string | null;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
  }>;
  nutritionInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  } | null;
  sourceUrl: string;
}

export class RecipeImportService {
  /**
   * Validate and normalize URL
   */
  private validateUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are supported.');
      }
      return urlObj.href;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Parse time string (e.g., "PT30M", "30 minutes") to minutes
   */
  private parseTime(timeStr: string | undefined): number {
    if (!timeStr) return 0;

    // Handle ISO 8601 duration format (PT30M, PT1H30M)
    const isoMatch = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (isoMatch) {
      const hours = parseInt(isoMatch[1] || '0');
      const minutes = parseInt(isoMatch[2] || '0');
      return hours * 60 + minutes;
    }

    // Handle plain number or "30 minutes" format
    const numMatch = timeStr.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 0;
  }

  /**
   * Parse servings/yield string
   */
  private parseServings(yieldStr: string | null | undefined): number {
    if (!yieldStr) return 4; // default

    const match = yieldStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 4;
  }

  /**
   * Determine difficulty based on prep/cook time and ingredient count
   */
  private determineDifficulty(
    prepTime: number,
    cookTime: number,
    ingredientCount: number
  ): 'easy' | 'medium' | 'hard' {
    const totalTime = prepTime + cookTime;

    if (totalTime <= 30 && ingredientCount <= 8) return 'easy';
    if (totalTime <= 60 && ingredientCount <= 15) return 'medium';
    return 'hard';
  }

  /**
   * Determine meal type from category or keywords
   */
  private determineMealType(
    category?: string | null,
    keywords?: string | null
  ): 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' {
    const text = `${category || ''} ${keywords || ''}`.toLowerCase();

    if (text.includes('breakfast')) return 'breakfast';
    if (text.includes('lunch')) return 'lunch';
    if (text.includes('dessert') || text.includes('sweet')) return 'dessert';
    if (text.includes('snack') || text.includes('appetizer')) return 'snack';

    return 'dinner'; // default
  }

  /**
   * Parse ingredient string into structured format
   */
  private parseIngredient(ingredientStr: string | undefined): {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  } | null {
    if (!ingredientStr) return null;

    // Simple parsing - extract quantity, unit, and name
    const match = ingredientStr.match(/^([\d./]+)?\s*([a-zA-Z]+)?\s*(.+)$/);

    if (match) {
      const [, qty, unit, name] = match;
      return {
        quantity: qty ? parseFloat(qty) : 1,
        unit: unit || 'unit',
        name: name.trim(),
      };
    }

    // Fallback: treat entire string as ingredient name
    return {
      quantity: 1,
      unit: 'unit',
      name: ingredientStr.trim(),
    };
  }

  /**
   * Parse instructions into structured steps
   */
  private parseInstructions(instructions: any): Array<{ step: number; instruction: string }> {
    if (!instructions) return [];

    // Handle string instructions
    if (typeof instructions === 'string') {
      const steps = instructions
        .split(/\n+|\d+\.\s*/)
        .filter((s) => s.trim().length > 0);

      return steps.map((instruction, index) => ({
        step: index + 1,
        instruction: instruction.trim(),
      }));
    }

    // Handle array of instructions
    if (Array.isArray(instructions)) {
      return instructions
        .map((inst, index) => {
          const text = inst?.text || inst?.name || String(inst);
          return {
            step: index + 1,
            instruction: text.trim(),
          };
        })
        .filter((inst) => inst.instruction.length > 0);
    }

    return [];
  }

  /**
   * Parse nutrition information
   */
  private parseNutrition(nutrition: any): ParsedRecipe['nutritionInfo'] {
    if (!nutrition) return null;

    const parseNutrientValue = (value: any): number | undefined => {
      if (!value) return undefined;
      const str = String(value);
      const match = str.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : undefined;
    };

    return {
      calories: parseNutrientValue(nutrition.calories),
      protein: parseNutrientValue(nutrition.proteinContent || nutrition.protein),
      carbs: parseNutrientValue(nutrition.carbohydrateContent || nutrition.carbs),
      fat: parseNutrientValue(nutrition.fatContent || nutrition.fat),
      fiber: parseNutrientValue(nutrition.fiberContent || nutrition.fiber),
      sugar: parseNutrientValue(nutrition.sugarContent || nutrition.sugar),
    };
  }

  /**
   * Extract string from array or return string
   */
  private extractString(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.find((v) => typeof v === 'string') || null;
    return String(value);
  }

  /**
   * Extract image URL from image object or string
   */
  private extractImageUrl(image: any): string | null {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (image.url) return image.url;
    if (Array.isArray(image) && image[0]) {
      return typeof image[0] === 'string' ? image[0] : image[0].url || null;
    }
    return null;
  }

  /**
   * Import recipe from URL
   */
  async importFromUrl(url: string): Promise<ParsedRecipe> {
    try {
      // Validate URL
      const validatedUrl = this.validateUrl(url);

      logger.info(`Importing recipe from URL: ${validatedUrl}`);

      // Scrape recipe using @rethora/url-recipe-scraper
      const scrapedRecipe = await scrapeRecipe(validatedUrl);

      if (!scrapedRecipe || !scrapedRecipe.name) {
        throw new Error('Failed to extract recipe data from URL');
      }

      // Parse times
      const prepTime = this.parseTime(scrapedRecipe.prepTime);
      const cookTime = this.parseTime(scrapedRecipe.cookTime);

      // Parse ingredients and filter out nulls
      const ingredients = (scrapedRecipe.recipeIngredient || [])
        .map((ing: any) => this.parseIngredient(ing))
        .filter((ing: any) => ing !== null);

      // Parse instructions
      const instructions = this.parseInstructions(scrapedRecipe.recipeInstructions);

      // Determine difficulty and meal type
      const difficulty = this.determineDifficulty(prepTime, cookTime, ingredients.length);
      const mealType = this.determineMealType(
        this.extractString(scrapedRecipe.recipeCategory),
        this.extractString((scrapedRecipe as any).keywords)
      );

      // Build parsed recipe
      const parsedRecipe: ParsedRecipe = {
        title: scrapedRecipe.name,
        description: scrapedRecipe.description || '',
        prepTime,
        cookTime,
        servings: this.parseServings(this.extractString(scrapedRecipe.recipeYield)),
        difficulty,
        cuisineType: this.extractString(scrapedRecipe.recipeCuisine),
        mealType,
        imageUrl: this.extractImageUrl(scrapedRecipe.image),
        ingredients: ingredients.filter((ing): ing is NonNullable<typeof ing> => ing !== null),
        instructions,
        nutritionInfo: this.parseNutrition(scrapedRecipe.nutrition),
        sourceUrl: validatedUrl,
      };

      logger.info(`Successfully imported recipe: ${parsedRecipe.title}`);

      return parsedRecipe;
    } catch (error: any) {
      logger.error(`Failed to import recipe from URL: ${error.message}`);
      throw new Error(`Recipe import failed: ${error.message}`);
    }
  }

  /**
   * Check if URL has already been imported by this user
   */
  async checkDuplicate(userId: string, url: string): Promise<boolean> {
    const validatedUrl = this.validateUrl(url);

    const existing = await prismaClient.recipe.findFirst({
      where: {
        userId,
        sourceUrl: validatedUrl,
      },
    });

    return !!existing;
  }
}

export const recipeImportService = new RecipeImportService();

// Made with Bob
