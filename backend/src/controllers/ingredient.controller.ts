/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../utils/cache';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const INGREDIENT_CACHE_TTL = 3600; // 1 hour

interface SimilarIngredientRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  sim_score: number;
}

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
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(cached);
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
    await cacheSet(cacheKey, response, INGREDIENT_CACHE_TTL);

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
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(cached);
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

    await cacheSet(cacheKey, response, INGREDIENT_CACHE_TTL);

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

    const { force } = req.query;

    // Validate required fields
    if (!name || !category || !unit || averagePrice === undefined) {
      throw new AppError('Name, category, unit, and average price are required', 400);
    }

    // Check if ingredient already exists (exact match)
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

    // Check for similar ingredients unless force=true
    if (force !== 'true') {
      const searchName = (name as string).trim().toLowerCase();
      const similar = await prisma.$queryRaw<SimilarIngredientRow[]>`
        SELECT id, name, category, unit,
               similarity(lower(name), ${searchName}) as sim_score
        FROM ingredients
        WHERE similarity(lower(name), ${searchName}) > ${0.3}
        ORDER BY sim_score DESC
        LIMIT ${5}
      `;

      if (similar.length > 0) {
        res.status(409).json({
          success: false,
          code: 'SIMILAR_EXISTS',
          message: 'Similar ingredients already exist. Use force=true to create anyway.',
          data: {
            similar: similar.map((row: SimilarIngredientRow) => ({
              id: row.id,
              name: row.name,
              category: row.category,
              unit: row.unit,
              similarity: parseFloat(Number(row.sim_score).toFixed(3)),
            })),
          },
        });
        return;
      }
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
    await cacheDelPattern('ingredients:*');

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
    await cacheDel(`ingredient:${id}`);
    await cacheDelPattern('ingredients:*');

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
    await cacheDel(`ingredient:${id}`);
    await cacheDelPattern('ingredients:*');

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
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(cached);
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

    await cacheSet(cacheKey, response, INGREDIENT_CACHE_TTL);

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
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(cached);
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

    await cacheSet(cacheKey, response, 300); // 5 min cache

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ingredients/similar
 * @desc    Find similar ingredients using trigram similarity
 * @access  Public
 */
export const getSimilarIngredients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, threshold = '0.3', limit = '10' } = req.query;

    if (!name || (name as string).length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const searchName = (name as string).trim().toLowerCase();
    const simThreshold = Math.max(0.1, Math.min(1, parseFloat(threshold as string)));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit as string)));

    const cacheKey = `ingredient:similar:${searchName}:${simThreshold}:${limitNum}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const similar = await prisma.$queryRaw<SimilarIngredientRow[]>`
      SELECT id, name, category, unit,
             similarity(lower(name), ${searchName}) as sim_score
      FROM ingredients
      WHERE similarity(lower(name), ${searchName}) > ${simThreshold}
        AND lower(name) != ${searchName}
      ORDER BY sim_score DESC
      LIMIT ${limitNum}
    `;

    const response = {
      success: true,
      data: similar.map((row: SimilarIngredientRow) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        unit: row.unit,
        similarity: parseFloat(Number(row.sim_score).toFixed(3)),
      })),
    };

    await cacheSet(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ingredients/merge
 * @desc    Merge a source ingredient into a target (reassign all references)
 * @access  Private (Admin only)
 */
export const mergeIngredients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId) {
      throw new AppError('sourceId and targetId are required', 400);
    }

    if (sourceId === targetId) {
      throw new AppError('Cannot merge an ingredient into itself', 400);
    }

    const [source, target] = await Promise.all([
      prisma.ingredient.findUnique({ where: { id: sourceId } }),
      prisma.ingredient.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) throw new AppError('Source ingredient not found', 404);
    if (!target) throw new AppError('Target ingredient not found', 404);

    const result = await prisma.$transaction(async (tx) => {
      const [recipes, grocery, pantry] = await Promise.all([
        tx.recipeIngredient.updateMany({
          where: { ingredientId: sourceId },
          data: { ingredientId: targetId },
        }),
        tx.groceryListItem.updateMany({
          where: { ingredientId: sourceId },
          data: { ingredientId: targetId },
        }),
        tx.pantryInventory.updateMany({
          where: { ingredientId: sourceId },
          data: { ingredientId: targetId },
        }),
      ]);

      await tx.ingredient.delete({ where: { id: sourceId } });

      return {
        recipesUpdated: recipes.count,
        groceryItemsUpdated: grocery.count,
        pantryItemsUpdated: pantry.count,
      };
    });

    await cacheDelPattern('ingredient*');

    logger.info(`Ingredient merged: ${source.name} (${sourceId}) → ${target.name} (${targetId})`, result);

    res.json({
      success: true,
      message: `Merged "${source.name}" into "${target.name}"`,
      data: {
        source: { id: sourceId, name: source.name },
        target: { id: targetId, name: target.name },
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Made with Bob
