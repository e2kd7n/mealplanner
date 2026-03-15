import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { getRedisClient } from '../utils/redis';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const INGREDIENT_CACHE_TTL = 3600; // 1 hour

/**
 * @route   GET /api/ingredients
 * @desc    Get all ingredients with optional filtering
 * @access  Public
 */
export const getIngredients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, category, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = `ingredients:${search || 'all'}:${category || 'all'}:${page}:${limit}`;

    // Try to get from cache
    const cached = await getRedisClient().get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    // Build where clause
    const where: any = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.ingredient.count({ where }),
    ]);

    const response = {
      success: true,
      data: ingredients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Cache the result
    await getRedisClient().setex(cacheKey, INGREDIENT_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ingredients/:id
 * @desc    Get ingredient by ID
 * @access  Public
 */
export const getIngredientById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const cacheKey = `ingredient:${id}`;
    const cached = await getRedisClient().get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipeIngredients: true,
            pantryInventory: true,
          },
        },
      },
    });

    if (!ingredient) {
      throw new AppError('Ingredient not found', 404);
    }

    const response = {
      success: true,
      data: ingredient,
    };

    await getRedisClient().setex(cacheKey, INGREDIENT_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ingredients
 * @desc    Create new ingredient
 * @access  Private (Admin only in production)
 */
export const createIngredient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      category,
      unit,
      seasonalMonths,
      averagePrice,
      allergens,
    } = req.body;

    // Validate required fields
    if (!name || !category || !unit || averagePrice === undefined) {
      throw new AppError('Name, category, unit, and average price are required', 400);
    }

    // Check if ingredient already exists
    const existing = await prisma.ingredient.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new AppError('Ingredient with this name already exists', 409);
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category,
        unit,
        seasonalMonths: seasonalMonths || [],
        averagePrice,
        allergens: allergens || [],
      },
    });

    // Invalidate cache
    await getRedisClient().del('ingredients:*');

    logger.info(`Ingredient created: ${ingredient.id}`);

    res.status(201).json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/ingredients/:id
 * @desc    Update ingredient
 * @access  Private (Admin only in production)
 */
export const updateIngredient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const {
      name,
      category,
      unit,
      seasonalMonths,
      averagePrice,
      allergens,
    } = req.body;

    // Check if ingredient exists
    const existing = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Ingredient not found', 404);
    }

    // If name is being changed, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.ingredient.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (duplicate) {
        throw new AppError('Ingredient with this name already exists', 409);
      }
    }

    const updateData: Prisma.IngredientUpdateInput = {
      ...(name && { name }),
      ...(category && { category }),
      ...(unit && { unit }),
      ...(seasonalMonths && { seasonalMonths }),
      ...(averagePrice !== undefined && { averagePrice }),
      ...(allergens && { allergens }),
    };

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await getRedisClient().del(`ingredient:${id}`);
    await getRedisClient().del('ingredients:*');

    logger.info(`Ingredient updated: ${id}`);

    res.json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/ingredients/:id
 * @desc    Delete ingredient
 * @access  Private (Admin only in production)
 */
export const deleteIngredient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    // Check if ingredient exists
    const existing = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipeIngredients: true,
            pantryInventory: true,
            groceryListItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Ingredient not found', 404);
    }

    // Check if ingredient is being used
    const usageCount =
      existing._count.recipeIngredients +
      existing._count.pantryInventory +
      existing._count.groceryListItems;

    if (usageCount > 0) {
      throw new AppError(
        `Cannot delete ingredient. It is used in ${usageCount} recipe(s), pantry item(s), or grocery list(s)`,
        409
      );
    }

    await prisma.ingredient.delete({
      where: { id },
    });

    // Invalidate cache
    await getRedisClient().del(`ingredient:${id}`);
    await getRedisClient().del('ingredients:*');

    logger.info(`Ingredient deleted: ${id}`);

    res.json({
      success: true,
      message: 'Ingredient deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ingredients/categories
 * @desc    Get all ingredient categories
 * @access  Public
 */
export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = 'ingredient:categories';
    const cached = await getRedisClient().get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const categories = await prisma.ingredient.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    const categoryList = categories.map((c) => c.category);

    const response = {
      success: true,
      data: categoryList,
    };

    await getRedisClient().setex(cacheKey, INGREDIENT_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ingredients/search/suggestions
 * @desc    Get ingredient search suggestions
 * @access  Public
 */
export const getSearchSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).length < 2) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const limitNum = parseInt(limit as string);
    const searchTerm = q as string;

    const cacheKey = `ingredient:suggestions:${searchTerm}:${limit}`;
    const cached = await getRedisClient().get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
      },
      take: limitNum,
      orderBy: {
        name: 'asc',
      },
    });

    const response = {
      success: true,
      data: ingredients,
    };

    await getRedisClient().setex(cacheKey, 300, JSON.stringify(response)); // 5 min cache

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Made with Bob
