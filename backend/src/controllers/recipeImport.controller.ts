/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response } from 'express';
import { recipeImportService } from '../services/recipeImport.service';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * Import recipe from URL
 * POST /api/recipes/import/url
 */
export const importFromUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    
    const userId = req.user.id;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid URL is required',
      });
    }

    // Check if URL has already been imported
    const isDuplicate = await recipeImportService.checkDuplicate(userId, url);
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'This recipe has already been imported from this URL',
      });
    }

    // Import recipe from URL
    const parsedRecipe = await recipeImportService.importFromUrl(url);

    // Return parsed recipe for review (don't save yet)
    return res.status(200).json({
      success: true,
      message: 'Recipe imported successfully',
      data: parsedRecipe,
    });
  } catch (error: any) {
    logger.error(`Recipe import error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to import recipe',
    });
  }
};

/**
 * Save imported recipe after user review
 * POST /api/recipes/import/url/save
 */
export const saveImportedRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    
    const userId = req.user.id;
    
    // Data is already validated by middleware
    const {
      title,
      description,
      prepTime,
      cookTime,
      servings,
      difficulty,
      cuisineType,
      mealType,
      mealTypes,
      imageUrl,
      ingredients,
      instructions,
      nutritionInfo,
      sourceUrl,
    } = req.body;

    logger.info(`Saving imported recipe: ${title} for user ${userId}`);

    // Handle both mealType (singular) and mealTypes (plural) for backward compatibility
    let finalMealTypes = mealTypes || (mealType ? [mealType] : ['dinner']);
    
    // Ensure finalMealTypes is always an array and not empty
    if (!Array.isArray(finalMealTypes)) {
      finalMealTypes = [finalMealTypes];
    }
    if (finalMealTypes.length === 0) {
      finalMealTypes = ['dinner'];
    }
    
    logger.info(`Final meal types: ${JSON.stringify(finalMealTypes)}`);

    // Create recipe
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title,
        description: description || '',
        source: 'imported',
        sourceUrl: sourceUrl || null,
        prepTime,
        cookTime,
        servings,
        difficulty,
        cuisineType: cuisineType || null,
        mealTypes: finalMealTypes,
        imageUrl: imageUrl || null,
        instructions,
        nutritionInfo: nutritionInfo || null,
        kidFriendly: false,
        isPublic: false,
      },
    });

    logger.info(`Recipe created with ID: ${recipe.id}`);

    // Create ingredients
    for (const ing of ingredients) {
      // Find or create ingredient
      let ingredient = await prisma.ingredient.findFirst({
        where: { name: { equals: ing.name, mode: 'insensitive' } },
      });

      if (!ingredient) {
        logger.info(`Creating new ingredient: ${ing.name}`);
        // Create new ingredient with default values
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

    logger.info(`Recipe imported and saved successfully: ${recipe.title} (${recipe.id})`);

    return res.status(201).json({
      success: true,
      message: 'Recipe saved successfully',
      data: completeRecipe,
    });
  } catch (error: any) {
    logger.error(`Save imported recipe error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?.id,
      body: req.body,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to save recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Made with Bob
