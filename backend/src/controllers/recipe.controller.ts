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
    const userId = req.user?.userId || req.user?.id;

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
    const userId = req.user?.userId || req.user?.id;

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
    const userId = req.user?.userId || req.user?.id;

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

/**
 * @route   GET /api/recipes/search
 * @desc    Advanced recipe search with full-text search
 * @access  Public
 */
export async function searchRecipes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      q, // search query
      page = '1',
      limit = '20',
      mealType,
      difficulty,
      kidFriendly,
      cuisineType,
      maxPrepTime,
      maxCookTime,
      minRating,
    } = req.query;

    if (!q) {
      throw new AppError('Search query is required', 400);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause with full-text search
    const where: any = {
      AND: [
        {
          OR: [
            { isPublic: true },
            { userId: req.user?.userId },
          ],
        },
        {
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } },
            { cuisineType: { contains: q as string, mode: 'insensitive' } },
          ],
        },
      ],
    };

    // Apply filters
    if (mealType) {
      where.AND.push({ mealType });
    }
    if (difficulty) {
      where.AND.push({ difficulty });
    }
    if (kidFriendly === 'true') {
      where.AND.push({ kidFriendly: true });
    }
    if (cuisineType) {
      where.AND.push({ cuisineType });
    }
    if (maxPrepTime) {
      where.AND.push({ prepTime: { lte: parseInt(maxPrepTime as string) } });
    }
    if (maxCookTime) {
      where.AND.push({ cookTime: { lte: parseInt(maxCookTime as string) } });
    }

    // Get recipes
    const [recipes] = await Promise.all([
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

    // Calculate average ratings and filter by minRating if specified
    let recipesWithRatings = recipes.map((recipe) => {
      const ratings = recipe.ratings.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        ...recipe,
        averageRating: avgRating,
        ratingCount: ratings.length,
      };
    });

    // Filter by minimum rating if specified
    if (minRating) {
      const minRatingNum = parseFloat(minRating as string);
      recipesWithRatings = recipesWithRatings.filter(
        (r) => r.averageRating >= minRatingNum
      );
    }

    res.json({
      data: {
        recipes: recipesWithRatings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: recipesWithRatings.length,
          totalPages: Math.ceil(recipesWithRatings.length / limitNum),
        },
        query: q,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/recipes/recommendations
 * @desc    Get personalized recipe recommendations
 * @access  Private
 */
export async function getRecommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    // Get user preferences
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Get user's highly rated recipes to understand preferences
    const userRatings = await prisma.recipeRating.findMany({
      where: {
        userId,
        rating: { gte: 4 }, // 4 stars or higher
      },
      include: {
        recipe: true,
      },
      take: 20,
      orderBy: {
        rating: 'desc',
      },
    });

    // Extract preferred meal types and cuisines
    const preferredMealTypes = [...new Set(userRatings.map(r => r.recipe.mealType))];
    const preferredCuisines = [...new Set(userRatings.map(r => r.recipe.cuisineType).filter(Boolean))];

    // Build recommendation query
    const where: any = {
      AND: [
        { isPublic: true },
        { userId: { not: userId } }, // Exclude user's own recipes
      ],
    };

    // Apply user preferences
    if (userPreferences) {
      // Filter by dietary preferences (stored as JSON)
      // This would require tags or dietary info in recipe schema
      // For now, we'll skip this filter

      // Filter by skill level
      if (userPreferences.cookingSkillLevel) {
        const skillLevels = ['easy', 'medium', 'hard'];
        const userSkillIndex = skillLevels.indexOf(userPreferences.cookingSkillLevel);
        if (userSkillIndex >= 0) {
          where.AND.push({
            difficulty: {
              in: skillLevels.slice(0, userSkillIndex + 1),
            },
          });
        }
      }
    }

    // Prefer meal types and cuisines user has rated highly
    if (preferredMealTypes.length > 0 || preferredCuisines.length > 0) {
      where.AND.push({
        OR: [
          ...(preferredMealTypes.length > 0 ? [{ mealType: { in: preferredMealTypes } }] : []),
          ...(preferredCuisines.length > 0 ? [{ cuisineType: { in: preferredCuisines } }] : []),
        ],
      });
    }

    // Get recommended recipes
    const recipes = await prisma.recipe.findMany({
      where,
      take: limitNum * 2, // Get more to filter by rating
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
    });

    // Calculate average ratings and sort by rating
    const recipesWithRatings = recipes
      .map((recipe) => {
        const ratings = recipe.ratings.map((r) => r.rating);
        const avgRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

        return {
          ...recipe,
          averageRating: avgRating,
          ratingCount: ratings.length,
        };
      })
      .filter((r) => r.averageRating >= 3.5) // Only recommend well-rated recipes
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limitNum);

    res.json({
      data: {
        recipes: recipesWithRatings,
        recommendationBasis: {
          preferredMealTypes,
          preferredCuisines,
          userSkillLevel: userPreferences?.cookingSkillLevel,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/recipes/:id/similar
 * @desc    Get similar recipes based on ingredients and attributes
 * @access  Public
 */
export async function getSimilarRecipes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { limit = '5' } = req.query;
    const limitNum = parseInt(limit as string);

    // Get the source recipe
    const sourceRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!sourceRecipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Extract ingredient IDs
    const sourceIngredientIds = sourceRecipe.ingredients.map(ri => ri.ingredientId);

    // Find recipes with similar attributes
    const where: any = {
      AND: [
        { id: { not: id } }, // Exclude the source recipe
        {
          OR: [
            { isPublic: true },
            { userId: req.user?.userId },
          ],
        },
      ],
    };

    // Match meal type and cuisine
    const similarityFilters: any[] = [];
    
    if (sourceRecipe.mealType) {
      similarityFilters.push({ mealType: sourceRecipe.mealType });
    }
    
    if (sourceRecipe.cuisineType) {
      similarityFilters.push({ cuisineType: sourceRecipe.cuisineType });
    }

    if (similarityFilters.length > 0) {
      where.AND.push({ OR: similarityFilters });
    }

    // Get candidate recipes
    const candidates = await prisma.recipe.findMany({
      where,
      take: limitNum * 3, // Get more candidates to score
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
    });

    // Calculate similarity scores
    const recipesWithScores = candidates.map((recipe) => {
      const recipeIngredientIds = recipe.ingredients.map(ri => ri.ingredientId);
      
      // Calculate ingredient overlap (Jaccard similarity)
      const intersection = sourceIngredientIds.filter(id =>
        recipeIngredientIds.includes(id)
      ).length;
      const union = new Set([...sourceIngredientIds, ...recipeIngredientIds]).size;
      const ingredientSimilarity = union > 0 ? intersection / union : 0;

      // Calculate attribute similarity
      let attributeScore = 0;
      if (recipe.mealType === sourceRecipe.mealType) attributeScore += 0.3;
      if (recipe.cuisineType === sourceRecipe.cuisineType) attributeScore += 0.3;
      if (recipe.difficulty === sourceRecipe.difficulty) attributeScore += 0.2;
      if (recipe.kidFriendly === sourceRecipe.kidFriendly) attributeScore += 0.2;

      // Combined similarity score
      const similarityScore = (ingredientSimilarity * 0.6) + (attributeScore * 0.4);

      // Calculate average rating
      const ratings = recipe.ratings.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        ...recipe,
        similarityScore,
        averageRating: avgRating,
        ratingCount: ratings.length,
        sharedIngredients: intersection,
      };
    });

    // Sort by similarity score and take top results
    const similarRecipes = recipesWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limitNum);

    res.json({
      data: {
        sourceRecipe: {
          id: sourceRecipe.id,
          title: sourceRecipe.title,
          mealType: sourceRecipe.mealType,
          cuisineType: sourceRecipe.cuisineType,
        },
        similarRecipes,
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
  searchRecipes,
  getRecommendations,
  getSimilarRecipes,
};

// Made with Bob
