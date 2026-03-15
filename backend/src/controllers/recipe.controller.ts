/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet, cacheDelPattern } from '../utils/redis';

/**
 * Get all recipes with filtering and pagination
 */
export async function getRecipes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      mealType,
      difficulty,
      kidFriendly,
      cuisineType,
      maxPrepTime,
      maxCookTime,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      OR: [
        { isPublic: true },
        { userId: req.user?.userId },
      ],
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (mealType) {
      where.mealType = mealType;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (kidFriendly === 'true') {
      where.kidFriendly = true;
    }

    if (cuisineType) {
      where.cuisineType = cuisineType;
    }

    if (maxPrepTime) {
      where.prepTime = { lte: parseInt(maxPrepTime as string) };
    }

    if (maxCookTime) {
      where.cookTime = { lte: parseInt(maxCookTime as string) };
    }

    // Try to get from cache
    const cacheKey = `recipes:${JSON.stringify({ where, skip, limitNum })}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }

    // Get recipes from database
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
          ratings: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    // Calculate average ratings
    const recipesWithRatings = recipes.map((recipe) => {
      const ratings = recipe.ratings.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

      return {
        ...recipe,
        averageRating: avgRating,
        ratingCount: ratings.length,
      };
    });

    const result = {
      recipes: recipesWithRatings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get recipe by ID
 */
export async function getRecipeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    // Try cache first
    const cacheKey = `recipe:${id}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }
    
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        ratings: true,
        user: {
          select: {
            familyName: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Check if user has access
    if (!recipe.isPublic && recipe.userId !== req.user?.id) {
      throw new AppError('Access denied', 403);
    }

    // Calculate average rating
    const ratings = recipe.ratings.map((r: any) => r.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : null;

    const result = {
      ...recipe,
      averageRating: avgRating,
      ratingCount: ratings.length,
    };

    // Cache for 10 minutes
    await cacheSet(cacheKey, result, 600);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Create new recipe
 */
export async function createRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      title,
      description,
      prepTime,
      cookTime,
      servings,
      difficulty,
      kidFriendly,
      cuisineType,
      mealType,
      imageUrl,
      instructions,
      nutritionInfo,
      costEstimate,
      isPublic,
      ingredients,
    } = req.body;

    // Validate required fields
    if (!title || !prepTime || !cookTime || !servings || !difficulty || !mealType) {
      throw new AppError('Missing required fields', 400);
    }

    // Create recipe with ingredients
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title,
        description,
        source: 'custom',
        prepTime,
        cookTime,
        servings,
        difficulty,
        kidFriendly: kidFriendly || false,
        cuisineType,
        mealType,
        imageUrl,
        instructions,
        nutritionInfo,
        costEstimate,
        isPublic: isPublic || false,
        ingredients: {
          create: ingredients?.map((ing: any) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
            isOptional: ing.isOptional || false,
          })) || [],
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Invalidate recipe list cache
    await cacheDelPattern('recipes:*');

    logger.info('Recipe created', { recipeId: recipe.id, userId });

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update recipe
 */
export async function updateRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;

    // Check if recipe exists and user owns it
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      throw new AppError('Recipe not found', 404);
    }

    if (existingRecipe.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const {
      title,
      description,
      prepTime,
      cookTime,
      servings,
      difficulty,
      kidFriendly,
      cuisineType,
      mealType,
      imageUrl,
      instructions,
      nutritionInfo,
      costEstimate,
      isPublic,
    } = req.body;

    // Update recipe
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title,
        description,
        prepTime,
        cookTime,
        servings,
        difficulty,
        kidFriendly,
        cuisineType,
        mealType,
        imageUrl,
        instructions,
        nutritionInfo,
        costEstimate,
        isPublic,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Invalidate caches
    await cacheDelPattern('recipes:*');
    await cacheDelPattern(`recipe:${id}`);

    logger.info('Recipe updated', { recipeId: id, userId });

    res.json({
      message: 'Recipe updated successfully',
      recipe,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete recipe
 */
export async function deleteRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;

    // Check if recipe exists and user owns it
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      throw new AppError('Recipe not found', 404);
    }

    if (existingRecipe.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Delete recipe (cascade will handle related records)
    await prisma.recipe.delete({
      where: { id },
    });

    // Invalidate caches
    await cacheDelPattern('recipes:*');
    await cacheDelPattern(`recipe:${id}`);

    logger.info('Recipe deleted', { recipeId: id, userId });

    res.json({
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/recipes/:id/rate
 * @desc    Add or update rating for a recipe
 * @access  Private
 */
export async function rateRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { rating, notes, wouldMakeAgain, familyMemberId } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    if (typeof wouldMakeAgain !== 'boolean') {
      throw new AppError('wouldMakeAgain must be a boolean', 400);
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Check if user already rated this recipe
    const existingRating = await prisma.recipeRating.findFirst({
      where: {
        recipeId: id,
        userId,
        familyMemberId: familyMemberId || null,
      },
    });

    let recipeRating;

    if (existingRating) {
      // Update existing rating
      recipeRating = await prisma.recipeRating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          notes,
          wouldMakeAgain,
        },
        include: {
          familyMember: true,
        },
      });
    } else {
      // Create new rating
      recipeRating = await prisma.recipeRating.create({
        data: {
          recipeId: id,
          userId,
          familyMemberId: familyMemberId || null,
          rating,
          notes,
          wouldMakeAgain,
        },
        include: {
          familyMember: true,
        },
      });
    }

    // Invalidate recipe cache
    await cacheDelPattern(`recipe:${id}`);
    await cacheDelPattern('recipes:*');

    logger.info('Recipe rated', { recipeId: id, userId, rating });

    res.status(existingRating ? 200 : 201).json({
      message: existingRating ? 'Rating updated successfully' : 'Rating added successfully',
      data: recipeRating,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/recipes/:id/ratings
 * @desc    Get all ratings for a recipe
 * @access  Public
 */
export async function getRecipeRatings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Get all ratings for the recipe
    const ratings = await prisma.recipeRating.findMany({
      where: { recipeId: id },
      include: {
        user: {
          select: {
            id: true,
            familyName: true,
          },
        },
        familyMember: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Calculate would make again percentage
    const wouldMakeAgainCount = ratings.filter(r => r.wouldMakeAgain).length;
    const wouldMakeAgainPercentage = ratings.length > 0
      ? (wouldMakeAgainCount / ratings.length) * 100
      : 0;

    res.json({
      data: {
        ratings,
        summary: {
          totalRatings: ratings.length,
          averageRating: Math.round(averageRating * 10) / 10,
          wouldMakeAgainPercentage: Math.round(wouldMakeAgainPercentage),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  rateRecipe,
  getRecipeRatings,
};

// Made with Bob
