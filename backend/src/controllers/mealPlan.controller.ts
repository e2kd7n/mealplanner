import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * @route   GET /api/meal-plans
 * @desc    Get all meal plans for authenticated user
 * @access  Private
 */
export const getMealPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { startDate, endDate, familyMemberId } = req.query;

    // Build where clause
    const where: any = { userId };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate as string);
      }
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        meals: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                prepTime: true,
                cookTime: true,
                servings: true,
              },
            },
            assignedTo: familyMemberId
              ? {
                  where: {
                    id: familyMemberId as string,
                  },
                }
              : true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: mealPlans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/meal-plans/:id
 * @desc    Get meal plan by ID
 * @access  Private
 */
export const getMealPlanById = async (
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

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        meals: {
          include: {
            recipe: true,
            assignedTo: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!mealPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    res.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meal-plans
 * @desc    Create new meal plan
 * @access  Private
 */
export const createMealPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { name, startDate, endDate } = req.body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      throw new AppError('Name, start date, and end date are required', 400);
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      throw new AppError('End date must be after start date', 400);
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        name,
        startDate: start,
        endDate: end,
      },
      include: {
        meals: true,
      },
    });

    logger.info(`Meal plan created: ${mealPlan.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/meal-plans/:id
 * @desc    Update meal plan
 * @access  Private
 */
export const updateMealPlan = async (
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
    const { name, startDate, endDate } = req.body;

    // Check if meal plan exists and belongs to user
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        throw new AppError('End date must be after start date', 400);
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
      include: {
        meals: {
          include: {
            recipe: true,
            assignedTo: true,
          },
        },
      },
    });

    logger.info(`Meal plan updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/meal-plans/:id
 * @desc    Delete meal plan
 * @access  Private
 */
export const deleteMealPlan = async (
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

    // Check if meal plan exists and belongs to user
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    await prisma.mealPlan.delete({
      where: { id },
    });

    logger.info(`Meal plan deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Meal plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meal-plans/:id/meals
 * @desc    Add meal to meal plan
 * @access  Private
 */
export const addMealToPlan = async (
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
    const { recipeId, date, mealType, servings, notes, assignedToIds } = req.body;

    // Validate required fields
    if (!recipeId || !date || !mealType) {
      throw new AppError('Recipe ID, date, and meal type are required', 400);
    }

    // Check if meal plan exists and belongs to user
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!mealPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Validate date is within meal plan range
    const mealDate = new Date(date);
    if (mealDate < mealPlan.startDate || mealDate > mealPlan.endDate) {
      throw new AppError('Meal date must be within meal plan date range', 400);
    }

    // Create meal
    const meal = await prisma.meal.create({
      data: {
        mealPlanId: id,
        recipeId,
        date: mealDate,
        mealType,
        servings: servings || recipe.servings,
        notes,
        assignedTo: assignedToIds
          ? {
              connect: assignedToIds.map((memberId: string) => ({ id: memberId })),
            }
          : undefined,
      },
      include: {
        recipe: true,
        assignedTo: true,
      },
    });

    logger.info(`Meal added to plan ${id}: ${meal.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: meal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/meal-plans/:planId/meals/:mealId
 * @desc    Update meal in meal plan
 * @access  Private
 */
export const updateMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { planId, mealId } = req.params;
    const { date, mealType, servings, notes, assignedToIds } = req.body;

    // Check if meal plan exists and belongs to user
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
    });

    if (!mealPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    // Check if meal exists in this plan
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        mealPlanId: planId,
      },
    });

    if (!existingMeal) {
      throw new AppError('Meal not found', 404);
    }

    // Validate date if provided
    if (date) {
      const mealDate = new Date(date);
      if (mealDate < mealPlan.startDate || mealDate > mealPlan.endDate) {
        throw new AppError('Meal date must be within meal plan date range', 400);
      }
    }

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (mealType) updateData.mealType = mealType;
    if (servings) updateData.servings = servings;
    if (notes !== undefined) updateData.notes = notes;

    // Handle assigned family members
    if (assignedToIds !== undefined) {
      // First, disconnect all existing assignments
      await prisma.meal.update({
        where: { id: mealId },
        data: {
          assignedTo: {
            set: [],
          },
        },
      });

      // Then connect new assignments
      if (assignedToIds.length > 0) {
        updateData.assignedTo = {
          connect: assignedToIds.map((memberId: string) => ({ id: memberId })),
        };
      }
    }

    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: updateData,
      include: {
        recipe: true,
        assignedTo: true,
      },
    });

    logger.info(`Meal updated: ${mealId} in plan ${planId} by user ${userId}`);

    res.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/meal-plans/:planId/meals/:mealId
 * @desc    Remove meal from meal plan
 * @access  Private
 */
export const removeMealFromPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { planId, mealId } = req.params;

    // Check if meal plan exists and belongs to user
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
    });

    if (!mealPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    // Check if meal exists in this plan
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        mealPlanId: planId,
      },
    });

    if (!existingMeal) {
      throw new AppError('Meal not found', 404);
    }

    await prisma.meal.delete({
      where: { id: mealId },
    });

    logger.info(`Meal removed: ${mealId} from plan ${planId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Meal removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Made with Bob
