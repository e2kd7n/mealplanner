import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

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
            category: 'asc',
          },
        },
        mealPlan: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

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
            category: 'asc',
          },
        },
        mealPlan: {
          include: {
            meals: {
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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { name, mealPlanId } = req.body;

    // Validate required fields
    if (!name) {
      throw new AppError('Name is required', 400);
    }

    // If meal plan ID provided, verify it exists and belongs to user
    if (mealPlanId) {
      const mealPlan = await prisma.mealPlan.findFirst({
        where: {
          id: mealPlanId,
          userId,
        },
      });

      if (!mealPlan) {
        throw new AppError('Meal plan not found', 404);
      }
    }

    const groceryList = await prisma.groceryList.create({
      data: {
        userId,
        name,
        mealPlanId,
        status: 'ACTIVE',
      },
      include: {
        items: true,
        mealPlan: true,
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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { mealPlanId } = req.params;

    // Get meal plan with all meals and recipes
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: mealPlanId,
        userId,
      },
      include: {
        meals: {
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

    // Create grocery list
    const groceryList = await prisma.groceryList.create({
      data: {
        userId,
        name: `Grocery List for ${mealPlan.name}`,
        mealPlanId,
        status: 'ACTIVE',
      },
    });

    // Aggregate ingredients from all meals
    const ingredientMap = new Map<string, {
      ingredient: any;
      quantity: number;
      unit: string;
      category: string;
    }>();

    for (const meal of mealPlan.meals) {
      const servingMultiplier = meal.servings / meal.recipe.servings;

      for (const recipeIngredient of meal.recipe.ingredients) {
        const key = recipeIngredient.ingredientId;
        const adjustedQuantity = recipeIngredient.quantity * servingMultiplier;

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          // Only add if same unit, otherwise create separate item
          if (existing.unit === recipeIngredient.unit) {
            existing.quantity += adjustedQuantity;
          } else {
            // Create with unique key for different unit
            const uniqueKey = `${key}-${recipeIngredient.unit}`;
            ingredientMap.set(uniqueKey, {
              ingredient: recipeIngredient.ingredient,
              quantity: adjustedQuantity,
              unit: recipeIngredient.unit,
              category: recipeIngredient.ingredient.category,
            });
          }
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

    // Create grocery list items
    const items = await Promise.all(
      Array.from(ingredientMap.values()).map((item) =>
        prisma.groceryListItem.create({
          data: {
            groceryListId: groceryList.id,
            ingredientId: item.ingredient.id,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            checked: false,
          },
          include: {
            ingredient: true,
          },
        })
      )
    );

    logger.info(`Grocery list generated from meal plan ${mealPlanId}: ${groceryList.id}`);

    res.status(201).json({
      success: true,
      data: {
        ...groceryList,
        items,
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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { name, status } = req.body;

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

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;

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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { ingredientId, quantity, unit, category, notes } = req.body;

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
        category: category || ingredient.category,
        notes,
        checked: false,
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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { listId, itemId } = req.params;
    const { quantity, unit, checked, notes } = req.body;

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

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit) updateData.unit = unit;
    if (checked !== undefined) updateData.checked = checked;
    if (notes !== undefined) updateData.notes = notes;

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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { listId, itemId } = req.params;

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
