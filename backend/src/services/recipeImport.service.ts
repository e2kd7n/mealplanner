/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import scrapeRecipe from '@rethora/url-recipe-scraper';
import { logger } from '../utils/logger';
import prismaClient from '../utils/prisma';
import { decode } from 'html-entities';

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
   * Decode HTML entities in text
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return text;
    return decode(text);
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
        instruction: this.decodeHtmlEntities(instruction.trim()),
      }));
    }

    // Handle array of instructions
    if (Array.isArray(instructions)) {
      const allSteps: string[] = [];
      
      for (const inst of instructions) {
        // Handle empty objects or invalid data
        if (!inst || (typeof inst === 'object' && Object.keys(inst).length === 0)) {
          continue;
        }
        
        // Handle nested itemListElement structure (e.g., laurafuentes.com)
        if (inst.itemListElement && Array.isArray(inst.itemListElement)) {
          for (const item of inst.itemListElement) {
            const text = item?.text || item?.name || '';
            if (text.trim()) {
              allSteps.push(this.decodeHtmlEntities(text.trim()));
            }
          }
        } else {
          // Handle direct text/name properties
          const text = inst?.text || inst?.name || (typeof inst === 'string' ? inst : '');
          if (text.trim()) {
            allSteps.push(this.decodeHtmlEntities(text.trim()));
          }
        }
      }
      
      return allSteps.map((instruction, index) => ({
        step: index + 1,
        instruction,
      }));
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
    const hostname = new URL(url).hostname;
    
    try {
      // Validate URL
      const validatedUrl = this.validateUrl(url);

      logger.info(`[RECIPE_IMPORT_START] URL: ${validatedUrl}, Hostname: ${hostname}`);

      // Scrape recipe using @rethora/url-recipe-scraper
      let scrapedRecipe;
      try {
        scrapedRecipe = await scrapeRecipe(validatedUrl);
        
        // Log successful scrape with data structure
        logger.info(`[RECIPE_SCRAPE_SUCCESS] ${hostname}`, {
          url: validatedUrl,
          hostname,
          hasName: !!scrapedRecipe?.name,
          recipeName: scrapedRecipe?.name || 'N/A',
          dataKeys: scrapedRecipe ? Object.keys(scrapedRecipe).sort().join(', ') : 'null',
          hasIngredients: !!scrapedRecipe?.recipeIngredient,
          ingredientCount: Array.isArray(scrapedRecipe?.recipeIngredient) ? scrapedRecipe.recipeIngredient.length : 0,
          hasInstructions: !!scrapedRecipe?.recipeInstructions,
          instructionType: scrapedRecipe?.recipeInstructions ? typeof scrapedRecipe.recipeInstructions : 'undefined',
          instructionStructure: Array.isArray(scrapedRecipe?.recipeInstructions)
            ? `array[${scrapedRecipe.recipeInstructions.length}]`
            : typeof scrapedRecipe?.recipeInstructions,
        });
        
      } catch (scrapeError: any) {
        // Log detailed scraping failure for analysis
        logger.error(`[RECIPE_SCRAPE_FAILED] ${hostname}`, {
          url: validatedUrl,
          hostname,
          errorMessage: scrapeError.message,
          errorType: scrapeError.constructor.name,
          errorStack: scrapeError.stack,
          timestamp: new Date().toISOString(),
        });
        
        // Provide helpful error message based on error type
        if (scrapeError.message.includes('JSON') || scrapeError.message.includes('parse')) {
          throw new Error(
            `Unable to import from ${hostname}. This appears to be a recipe listing or category page rather than an individual recipe. ` +
            `Please navigate to a specific recipe page and try again.`
          );
        }
        
        if (scrapeError.message.includes('timeout') || scrapeError.message.includes('ETIMEDOUT')) {
          throw new Error(
            `Connection timeout while trying to access ${hostname}. The website may be slow or temporarily unavailable. Please try again.`
          );
        }
        
        if (scrapeError.message.includes('404') || scrapeError.message.includes('Not Found')) {
          throw new Error(
            `Recipe not found at ${hostname}. The page may have been moved or deleted.`
          );
        }
        
        // Generic error with more details
        throw new Error(
          `Unable to scrape recipe from ${hostname}. The website may not be supported, may be blocking automated access, or may not have properly formatted recipe data. ` +
          `Technical details: ${scrapeError.message}`
        );
      }

      if (!scrapedRecipe || !scrapedRecipe.name) {
        logger.error(`[RECIPE_NO_DATA] ${hostname}`, {
          url: validatedUrl,
          hostname,
          hasData: !!scrapedRecipe,
          dataKeys: scrapedRecipe ? Object.keys(scrapedRecipe).sort() : [],
          rawData: scrapedRecipe ? JSON.stringify(scrapedRecipe, null, 2).substring(0, 500) : 'null',
          timestamp: new Date().toISOString(),
        });
        throw new Error('No recipe data found at this URL. The page may not contain properly formatted recipe information (schema.org Recipe markup). Please ensure the URL points to a specific recipe page.');
      }

      logger.info(`[RECIPE_PARSE_START] ${hostname}: ${scrapedRecipe.name}`);

      // Parse times
      const prepTime = this.parseTime(scrapedRecipe.prepTime);
      const cookTime = this.parseTime(scrapedRecipe.cookTime);

      // Parse ingredients and filter out nulls
      const rawIngredients = scrapedRecipe.recipeIngredient || [];
      if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
        logger.warn(`[RECIPE_NO_INGREDIENTS] ${hostname}: ${scrapedRecipe.name}`, {
          url: validatedUrl,
          hostname,
          recipeName: scrapedRecipe.name,
          hasIngredientField: !!scrapedRecipe.recipeIngredient,
          ingredientType: typeof scrapedRecipe.recipeIngredient,
        });
      }
      
      const ingredients = rawIngredients
        .map((ing: any) => this.parseIngredient(ing))
        .filter((ing: any) => ing !== null);

      if (ingredients.length === 0) {
        logger.error(`[RECIPE_PARSE_FAILED] ${hostname}: No valid ingredients`, {
          url: validatedUrl,
          hostname,
          recipeName: scrapedRecipe.name,
          rawIngredientCount: rawIngredients.length,
          rawIngredientSample: rawIngredients.slice(0, 3),
          timestamp: new Date().toISOString(),
        });
        throw new Error('Recipe must have at least one ingredient. The website may not have properly formatted recipe data.');
      }

      // Parse instructions
      const instructions = this.parseInstructions(scrapedRecipe.recipeInstructions);
      
      if (instructions.length === 0) {
        logger.warn(`[RECIPE_NO_INSTRUCTIONS] ${hostname}: ${scrapedRecipe.name}`, {
          url: validatedUrl,
          hostname,
          recipeName: scrapedRecipe.name,
          hasInstructionField: !!scrapedRecipe.recipeInstructions,
          instructionType: typeof scrapedRecipe.recipeInstructions,
          instructionStructure: Array.isArray(scrapedRecipe.recipeInstructions)
            ? `array[${scrapedRecipe.recipeInstructions.length}]`
            : typeof scrapedRecipe.recipeInstructions,
          rawInstructionSample: scrapedRecipe.recipeInstructions
            ? JSON.stringify(scrapedRecipe.recipeInstructions).substring(0, 200)
            : 'null',
        });
        // Add a placeholder instruction
        instructions.push({
          step: 1,
          instruction: 'Instructions not available from the source website. Please refer to the original recipe URL for cooking directions.',
        });
      }

      // Determine difficulty and meal type
      const difficulty = this.determineDifficulty(prepTime, cookTime, ingredients.length);
      const mealType = this.determineMealType(
        this.extractString(scrapedRecipe.recipeCategory),
        this.extractString((scrapedRecipe as any).keywords)
      );

      // Build parsed recipe - convert mealType to mealTypes array for schema compatibility
      const parsedRecipe: ParsedRecipe = {
        title: this.decodeHtmlEntities(scrapedRecipe.name),
        description: this.decodeHtmlEntities(scrapedRecipe.description || ''),
        prepTime,
        cookTime,
        servings: this.parseServings(this.extractString(scrapedRecipe.recipeYield)),
        difficulty,
        cuisineType: this.extractString(scrapedRecipe.recipeCuisine),
        mealType, // Keep for backward compatibility
        imageUrl: this.extractImageUrl(scrapedRecipe.image),
        ingredients: ingredients.filter((ing): ing is NonNullable<typeof ing> => ing !== null),
        instructions,
        nutritionInfo: this.parseNutrition(scrapedRecipe.nutrition),
        sourceUrl: validatedUrl,
      };

      logger.info(`[RECIPE_IMPORT_SUCCESS] ${hostname}: ${parsedRecipe.title}`, {
        url: validatedUrl,
        hostname,
        recipeName: parsedRecipe.title,
        ingredientCount: ingredients.length,
        instructionCount: instructions.length,
        prepTime: parsedRecipe.prepTime,
        cookTime: parsedRecipe.cookTime,
        difficulty: parsedRecipe.difficulty,
        mealType: parsedRecipe.mealType,
        timestamp: new Date().toISOString(),
      });

      return parsedRecipe;
    } catch (error: any) {
      logger.error(`[RECIPE_IMPORT_FAILED] ${hostname}`, {
        url,
        hostname,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      // Re-throw with user-friendly message
      if (error.message.includes('Recipe import failed:')) {
        throw error; // Already formatted
      }
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
