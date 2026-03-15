/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * Extract and validate user ID from request
 * Throws AppError if user is not authenticated
 */
function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  return userId;
}

/**
 * Interface for aggregated ingredient data
 */
interface AggregatedIngredient {
  ingredient: {
    id: string;
    name: string;
    category: string;
    averagePrice: any; // Prisma Decimal type
  };
  quantity: any; // Prisma Decimal type
  unit: string;
  category: string;
}

/**
 * Type for meal data used in ingredient aggregation
 */
type MealWithRecipe = {
  servings: number;
  recipe: {
    servings: number;
    ingredients: Array<{
      ingredientId: string;
      quantity: any; // Prisma Decimal type
      unit: string;
      ingredient: {
        id: string;
        name: string;
        category: string;
        averagePrice: any; // Prisma Decimal type
      };
    }>;
  };
};

/**
 * @route   GET /api/grocery-lists
 * @desc    Get all grocery lists for authenticated user
 * @access  Private
 */
export const getGroceryLists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { status } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const groceryLists = await prisma.groceryList.findMany({
      where,
      include: {
        items: {
          include: {
            ingredient: true,
          },
          orderBy: {
            ingredient: {
              category: 'asc',
            },
          },
        },
        mealPlan: {
          select: {
            id: true,
            weekStartDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: groceryLists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/grocery-lists/:id
 * @desc    Get grocery list by ID
 * @access  Private
 */
export const getGroceryListById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { id } = req.params as { id: string };

    const groceryList = await prisma.groceryList.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
          orderBy: {
            ingredient: {
              category: 'asc',
            },
          },
        },
        mealPlan: {
          include: {
            plannedMeals: {
              include: {
                recipe: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!groceryList) {
      throw new AppError('Grocery list not found', 404);
    }

    res.json({
      success: true,
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/grocery-lists
 * @desc    Create new grocery list
 * @access  Private
 */
export const createGroceryList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { name, mealPlanId } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Name is required', 400);
    }

    // If meal plan ID provided, verify it exists and belongs to user
    if (mealPlanId) {
      const mealPlan = await prisma.mealPlan.findUnique({
        where: { id: mealPlanId },
      });

      if (!mealPlan || mealPlan.userId !== userId) {
        throw new AppError('Meal plan not found', 404);
      }
    }

    const groceryList = await prisma.groceryList.create({
      data: {
        userId,
        mealPlanId,
        status: 'draft',
      },
    });

    logger.info(`Grocery list created: ${groceryList.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to generate a unique key for ingredients with different units
 */
function getIngredientKey(
  ingredientId: string,
  unit: string,
  existingMap: Map<string, AggregatedIngredient>
): string {
  const baseKey = ingredientId;
  
  if (!existingMap.has(baseKey)) {
    return baseKey;
  }
  
  const existing = existingMap.get(baseKey)!;
  if (existing.unit === unit) {
    return baseKey;
  }
  
  return `${baseKey}-${unit}`;
}

/**
 * Helper function to aggregate ingredients from multiple meals
 * Handles serving size adjustments and unit consolidation
 */
function aggregateIngredientsFromMeals(
  meals: MealWithRecipe[]
): Map<string, AggregatedIngredient> {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  for (const meal of meals) {
    const servingMultiplier = meal.servings / meal.recipe.servings;

    for (const recipeIngredient of meal.recipe.ingredients) {
      const adjustedQuantity = recipeIngredient.quantity * servingMultiplier;
      const key = getIngredientKey(
        recipeIngredient.ingredientId,
        recipeIngredient.unit,
        ingredientMap
      );

      if (ingredientMap.has(key)) {
        ingredientMap.get(key)!.quantity += adjustedQuantity;
      } else {
        ingredientMap.set(key, {
          ingredient: recipeIngredient.ingredient,
          quantity: adjustedQuantity,
          unit: recipeIngredient.unit,
          category: recipeIngredient.ingredient.category,
        });
      }
    }
  }

  return ingredientMap;
}

/**
 * @route   POST /api/grocery-lists/from-meal-plan/:mealPlanId
 * @desc    Generate grocery list from meal plan
 * @access  Private
 */
export const generateFromMealPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { mealPlanId } = req.params;
    const mealPlanIdStr = String(mealPlanId);

    // Get meal plan with all meals and recipes
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: mealPlanIdStr,
        userId,
      },
      include: {
        plannedMeals: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create grocery list
      const groceryList = await tx.groceryList.create({
        data: {
          userId,
          mealPlanId: mealPlanIdStr,
          status: 'draft',
        },
      });

      // Aggregate ingredients from all meals
      const ingredientMap = aggregateIngredientsFromMeals(mealPlan.plannedMeals);

      // Batch create grocery list items
      await tx.groceryListItem.createMany({
        data: Array.from(ingredientMap.values()).map((item) => ({
          groceryListId: groceryList.id,
          ingredientId: item.ingredient.id,
          quantity: item.quantity,
          unit: item.unit,
          estimatedPrice: item.ingredient.averagePrice.mul(item.quantity),
          isChecked: false,
          storeSection: null,
          notes: null,
        })),
      });

      // Fetch created items with ingredient relations
      const items = await tx.groceryListItem.findMany({
        where: { groceryListId: groceryList.id },
        include: { ingredient: true },
        orderBy: { ingredient: { category: 'asc' } },
      });

      return { groceryList, items };
    });

    logger.info(`Grocery list generated from meal plan ${mealPlanId}: ${result.groceryList.id}`);

    res.status(201).json({
      success: true,
      data: {
        ...result.groceryList,
        items: result.items,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/grocery-lists/:id
 * @desc    Update grocery list
 * @access  Private
 */
export const updateGroceryList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { id } = req.params as { id: string };
    const { status } = req.body;

    // Check if grocery list exists and belongs to user
    const existingList = await prisma.groceryList.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingList) {
      throw new AppError('Grocery list not found', 404);
    }

    const updateData: Prisma.GroceryListUpdateInput = {
      ...(status && { status }),
    };

    const groceryList = await prisma.groceryList.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
        mealPlan: true,
      },
    });

    logger.info(`Grocery list updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/grocery-lists/:id
 * @desc    Delete grocery list
 * @access  Private
 */
export const deleteGroceryList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { id } = req.params as { id: string };

    // Check if grocery list exists and belongs to user
    const existingList = await prisma.groceryList.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingList) {
      throw new AppError('Grocery list not found', 404);
    }

    await prisma.groceryList.delete({
      where: { id },
    });

    logger.info(`Grocery list deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Grocery list deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/grocery-lists/:id/items
 * @desc    Add item to grocery list
 * @access  Private
 */
export const addItemToList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { id } = req.params as { id: string };
    const { ingredientId, quantity, unit, notes } = req.body;

    // Validate required fields
    if (!ingredientId || !quantity || !unit) {
      throw new AppError('Ingredient ID, quantity, and unit are required', 400);
    }

    // Check if grocery list exists and belongs to user
    const groceryList = await prisma.groceryList.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!groceryList) {
      throw new AppError('Grocery list not found', 404);
    }

    // Check if ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new AppError('Ingredient not found', 404);
    }

    const item = await prisma.groceryListItem.create({
      data: {
        groceryListId: id,
        ingredientId,
        quantity,
        unit,
        estimatedPrice: ingredient.averagePrice,
        isChecked: false,
        notes,
      },
      include: {
        ingredient: true,
      },
    });

    logger.info(`Item added to grocery list ${id}: ${item.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/grocery-lists/:listId/items/:itemId
 * @desc    Update grocery list item
 * @access  Private
 */
export const updateListItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { listId, itemId } = req.params as { listId: string; itemId: string };
    const { quantity, unit, checked, notes } = req.body;

    // Verify item exists and belongs to the correct list
    const existingItem = await prisma.groceryListItem.findFirst({
      where: {
        id: itemId,
        groceryListId: listId,
      },
    });

    if (!existingItem) {
      throw new AppError('Grocery list item not found', 404);
    }

    // Verify the list belongs to the user
    const groceryList = await prisma.groceryList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!groceryList || groceryList.userId !== userId) {
      throw new AppError('Grocery list item not found', 404);
    }

    // Build typed update data with conditional fields
    const updateData: Prisma.GroceryListItemUpdateInput = {
      ...(quantity !== undefined && { quantity }),
      ...(unit && { unit }),
      ...(checked !== undefined && { isChecked: checked }),
      ...(notes !== undefined && { notes }),
    };

    const item = await prisma.groceryListItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        ingredient: true,
      },
    });

    logger.info(`Item updated: ${itemId} in list ${listId} by user ${userId}`);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/grocery-lists/:listId/items/:itemId
 * @desc    Remove item from grocery list
 * @access  Private
 */
export const removeItemFromList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { listId, itemId } = req.params as { listId: string; itemId: string };

    // Check if grocery list exists and belongs to user
    const groceryList = await prisma.groceryList.findFirst({
      where: {
        id: listId,
        userId,
      },
    });

    if (!groceryList) {
      throw new AppError('Grocery list not found', 404);
    }

    // Check if item exists in this list
    const existingItem = await prisma.groceryListItem.findFirst({
      where: {
        id: itemId,
        groceryListId: listId,
      },
    });

    if (!existingItem) {
      throw new AppError('Item not found', 404);
    }

    await prisma.groceryListItem.delete({
      where: { id: itemId },
    });

    logger.info(`Item removed: ${itemId} from list ${listId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Item removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Made with Bob
