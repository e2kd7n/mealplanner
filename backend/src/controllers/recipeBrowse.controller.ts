/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response } from 'express';
import { spoonacularService } from '../services/spoonacular.service';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * Search recipes from Spoonacular
 * GET /api/recipes/browse/search
 */
export const searchRecipes = async (req: Request, res: Response) => {
  try {
    if (!spoonacularService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Recipe browse feature is not configured. Please contact the administrator.',
      });
    }

    const {
      query,
      cuisine,
      diet,
      type,
      maxReadyTime,
      number = 12,
      offset = 0,
    } = req.query;

    const results = await spoonacularService.searchRecipes({
      query: query as string,
      cuisine: cuisine as string,
      diet: diet as string,
      type: type as string,
      maxReadyTime: maxReadyTime ? parseInt(maxReadyTime as string) : undefined,
      number: parseInt(number as string),
      offset: parseInt(offset as string),
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.error(`Recipe browse search error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search recipes',
    });
  }
};

/**
 * Get recipe details from Spoonacular
 * GET /api/recipes/browse/:id
 */
export const getRecipeDetails = async (req: Request, res: Response) => {
  try {
    if (!spoonacularService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Recipe browse feature is not configured. Please contact the administrator.',
      });
    }

    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const recipeId = parseInt(idParam);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID',
      });
    }

    const recipe = await spoonacularService.getRecipeDetails(recipeId);

    return res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error: any) {
    logger.error(`Recipe browse details error: ${error.message}`);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recipe details',
    });
  }
};

/**
 * Add a Spoonacular recipe to user's recipe box
 * POST /api/recipes/browse/:id/add-to-box
 */
export const addToRecipeBox = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!spoonacularService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Recipe browse feature is not configured. Please contact the administrator.',
      });
    }

    const userId = req.user.id;
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const spoonacularId = parseInt(idParam);

    if (isNaN(spoonacularId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID',
      });
    }

    // Check if recipe already exists in user's box
    const existing = await prisma.recipe.findFirst({
      where: {
        userId,
        source: 'spoonacular' as any,
        externalId: spoonacularId.toString(),
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This recipe is already in your recipe box',
        data: existing,
      });
    }

    // Get recipe details from Spoonacular
    const spoonacularRecipe = await spoonacularService.getRecipeDetails(spoonacularId);

    // Convert to our format
    const recipeData = spoonacularService.convertToOurFormat(spoonacularRecipe);

    logger.info(`Adding Spoonacular recipe to box: ${recipeData.title} for user ${userId}`);

    // Create recipe
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: recipeData.title,
        description: recipeData.description || '',
        source: 'spoonacular' as any,
        sourceUrl: recipeData.sourceUrl || null,
        externalId: spoonacularId.toString(),
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty as any,
        cuisineType: recipeData.cuisineType,
        mealTypes: recipeData.mealTypes as any, // Type assertion for enum array
        imageUrl: recipeData.imageUrl,
        instructions: recipeData.instructions,
        nutritionInfo: recipeData.nutritionInfo || undefined,
        kidFriendly: false,
      },
    });

    // Create ingredients
    for (const ing of recipeData.ingredients) {
      // Find or create ingredient
      let ingredient = await prisma.ingredient.findFirst({
        where: { name: { equals: ing.name, mode: 'insensitive' } },
      });

      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: {
            name: ing.name,
            category: 'other',
            seasonalMonths: [],
            averagePrice: 0,
            unit: ing.unit || 'unit',
            allergens: [],
          },
        });
      }

      // Create recipe ingredient
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || null,
          isOptional: false,
        },
      });
    }

    // Fetch complete recipe with ingredients
    const completeRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    logger.info(`Recipe added to box successfully: ${recipe.title} (${recipe.id})`);

    return res.status(201).json({
      success: true,
      message: 'Recipe added to your recipe box',
      data: completeRecipe,
    });
  } catch (error: any) {
    logger.error(`Add to recipe box error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?.id,
      spoonacularId: req.params.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to add recipe to your box',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Made with Bob