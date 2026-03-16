/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet, cacheDelPattern } from '../utils/redis';
import { calculateCleanupScore } from '../utils/cleanupScore';

/**
 * TypeScript interfaces for recipe responses
 */
interface RecipeWithRating {
  averageRating: number | null;
  ratingCount: number;
}

/**
 * Helper function to calculate average rating from ratings array
 */
function calculateAverageRating(ratings: { rating: number }[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
}

/**
 * Helper function to generate cache key for a single recipe
 */
function getRecipeCacheKey(id: string): string {
  return `recipe:${id}`;
}

/**
 * Helper function to generate cache key for recipe list queries
 */
function getRecipeListCacheKey(params: object): string {
  return `recipes:${JSON.stringify(params)}`;
}

/**
 * Helper function to check if user can access a recipe
 */
function canAccessRecipe(
  recipe: { isPublic: boolean; userId: string | null },
  requestUserId?: string
): boolean {
  return recipe.isPublic || recipe.userId === requestUserId;
}

/**
 * Helper function to get user ID from request (handles inconsistent auth structure)
 */
function getUserId(req: Request): string | undefined {
  return req.user?.userId || req.user?.id;
}

/**
 * Helper function to verify recipe ownership
 */
async function verifyRecipeOwnership(
  recipeId: string,
  userId: string
): Promise<void> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  if (recipe.userId !== userId) {
    throw new AppError('Access denied', 403);
  }
}

/**
 * Helper function to invalidate recipe-specific cache
 */
async function invalidateRecipeCache(recipeId: string): Promise<void> {
  await Promise.all([
    cacheDelPattern(`recipe:${recipeId}`),
    cacheDelPattern('recipes:*'),
  ]);
}

/**
 * Helper function to invalidate recipe list cache
 */
async function invalidateRecipeListCache(): Promise<void> {
  await cacheDelPattern('recipes:*');
}

/**
 * Prisma include pattern for recipes with ingredients
 */
const RECIPE_INCLUDE_WITH_INGREDIENTS = {
  ingredients: {
    include: {
      ingredient: true,
    },
  },
} as const;

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
    const userId = getUserId(req);
    const where: any = {
      OR: [
        { isPublic: true },
        { userId },
      ],
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (mealType) {
      where.mealTypes = { has: mealType };
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
    const cacheKey = getRecipeListCacheKey({ where, skip, limitNum });
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
          ...RECIPE_INCLUDE_WITH_INGREDIENTS,
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
    const recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      averageRating: calculateAverageRating(recipe.ratings),
      ratingCount: recipe.ratings.length,
    }));

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
    const cacheKey = getRecipeCacheKey(id);
    const cached = await cacheGet(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }
    
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ...RECIPE_INCLUDE_WITH_INGREDIENTS,
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
    const userId = getUserId(req);
    if (!canAccessRecipe(recipe, userId)) {
      throw new AppError('Access denied', 403);
    }

    // Calculate average rating and build result
    const result: RecipeWithRating & typeof recipe = {
      ...recipe,
      averageRating: calculateAverageRating(recipe.ratings),
      ratingCount: recipe.ratings.length,
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
/**
 * Helper function to find or create an ingredient
 */
async function findOrCreateIngredient(
  ingredientId: string | undefined,
  ingredientName: string,
  unit: string
): Promise<string> {
  // If we have an ID, use it
  if (ingredientId) {
    return ingredientId;
  }

  // Check if ingredient exists by name
  let ingredient = await prisma.ingredient.findFirst({
    where: { name: { equals: ingredientName, mode: 'insensitive' } },
  });

  if (!ingredient) {
    // Create new ingredient
    logger.info(`Creating new ingredient: ${ingredientName}`);
    ingredient = await prisma.ingredient.create({
      data: {
        name: ingredientName,
        category: 'other',
        seasonalMonths: [],
        averagePrice: 0,
        unit: unit || 'unit',
        allergens: [],
      },
    });
  }

  return ingredient.id;
}

export async function createRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);

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
      mealTypes,
      imageUrl,
      instructions,
      nutritionInfo,
      costEstimate,
      isPublic,
      ingredients,
    } = req.body;

    // Validate required fields
    if (!title || !prepTime || !cookTime || !servings || !difficulty || !mealTypes || mealTypes.length === 0) {
      throw new AppError('Missing required fields', 400);
    }

    // Calculate cleanup score
    const cleanupScore = calculateCleanupScore({
      ingredients: ingredients || [],
      instructions,
      cookTime,
      prepTime,
    });

    // Create recipe first
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
        mealTypes,
        imageUrl,
        instructions,
        nutritionInfo,
        costEstimate,
        cleanupScore,
        isPublic: isPublic || false,
      },
    });

    // Handle ingredients - create new ones if needed
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        const ingredientId = await findOrCreateIngredient(
          ing.ingredientId,
          ing.ingredientName,
          ing.unit
        );

        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes || null,
            isOptional: ing.isOptional || false,
          },
        });
      }
    }

    // Fetch complete recipe with ingredients
    const completeRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: RECIPE_INCLUDE_WITH_INGREDIENTS,
    });

    // Invalidate recipe list cache
    await invalidateRecipeListCache();

    logger.info('Recipe created', { recipeId: recipe.id, userId });

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: completeRecipe,
      id: recipe.id,
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
    const userId = getUserId(req);

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if recipe exists and user owns it
    await verifyRecipeOwnership(id, userId);

    const {
      title,
      description,
      prepTime,
      cookTime,
      servings,
      difficulty,
      kidFriendly,
      cuisineType,
      mealTypes,
      imageUrl,
      instructions,
      nutritionInfo,
      costEstimate,
      isPublic,
      ingredients,
    } = req.body;

    // Calculate cleanup score if relevant fields are being updated
    let cleanupScore;
    if (ingredients || instructions || prepTime || cookTime) {
      cleanupScore = calculateCleanupScore({
        ingredients: ingredients || [],
        instructions,
        cookTime,
        prepTime,
      });
    }

    // Update recipe
    await prisma.recipe.update({
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
        mealTypes,
        imageUrl,
        instructions,
        nutritionInfo,
        costEstimate,
        ...(cleanupScore !== undefined && { cleanupScore }),
        isPublic,
      },
      include: RECIPE_INCLUDE_WITH_INGREDIENTS,
    });

    // Update ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      // Delete existing recipe ingredients
      await prisma.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });

      // Add new ingredients
      for (const ing of ingredients) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes || null,
            isOptional: ing.isOptional || false,
          },
        });
      }
    }

    // Fetch updated recipe with ingredients
    const updatedRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: RECIPE_INCLUDE_WITH_INGREDIENTS,
    });

    // Invalidate caches
    await invalidateRecipeCache(id);

    logger.info('Recipe updated', { recipeId: id, userId });

    res.json({
      message: 'Recipe updated successfully',
      recipe: updatedRecipe,
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
    const userId = getUserId(req);

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if recipe exists and user owns it
    await verifyRecipeOwnership(id, userId);

    // Delete recipe (cascade will handle related records)
    await prisma.recipe.delete({
      where: { id },
    });

    // Invalidate caches
    await invalidateRecipeCache(id);

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
    const userId = getUserId(req);

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
    await invalidateRecipeCache(id);

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
    const averageRating = calculateAverageRating(ratings) || 0;

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
      where.AND.push({ mealTypes: { has: mealType } });
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
          ...RECIPE_INCLUDE_WITH_INGREDIENTS,
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
    let recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      averageRating: calculateAverageRating(recipe.ratings) || 0,
      ratingCount: recipe.ratings.length,
    }));

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
    const preferredMealTypes = [...new Set(userRatings.flatMap(r => r.recipe.mealTypes))];
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
          ...(preferredMealTypes.length > 0 ? [{ mealTypes: { hasSome: preferredMealTypes } }] : []),
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
    
    if (sourceRecipe.mealTypes && sourceRecipe.mealTypes.length > 0) {
      similarityFilters.push({ mealTypes: { hasSome: sourceRecipe.mealTypes } });
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
      const mealTypeOverlap = recipe.mealTypes.filter(mt => sourceRecipe.mealTypes.includes(mt)).length;
      if (mealTypeOverlap > 0) attributeScore += 0.3 * (mealTypeOverlap / Math.max(recipe.mealTypes.length, sourceRecipe.mealTypes.length));
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
          mealTypes: sourceRecipe.mealTypes,
          cuisineType: sourceRecipe.cuisineType,
        },
        similarRecipes,
      },
    });
  } catch (error) {
    next(error);
  }
}
/**
 * Import recipe from URL
 * POST /api/recipes/import
 */
export async function importRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      throw new AppError('Recipe URL is required', 400);
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new AppError('Invalid URL format', 400);
    }

    // For now, return a placeholder response
    // Full implementation would involve:
    // 1. Fetching the URL content
    // 2. Parsing the HTML/JSON for recipe data
    // 3. Extracting recipe information (title, ingredients, instructions, etc.)
    // 4. Creating a new recipe in the database
    
    logger.info('Recipe import requested', { userId, url: parsedUrl.hostname });

    res.status(501).json({
      message: 'Recipe import functionality coming soon',
      supportedSites: [
        'allrecipes.com',
        'foodnetwork.com',
        'epicurious.com',
        'bonappetit.com',
      ],
      note: 'This feature requires integration with recipe parsing services',
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
  importRecipe,
};

// Made with Bob
