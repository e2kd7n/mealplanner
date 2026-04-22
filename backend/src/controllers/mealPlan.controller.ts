/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { getWebSocketService } from '../services/websocket.service';

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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { startDate, endDate } = req.query;

    // Build where clause
    const where: any = { userId };

    if (startDate || endDate) {
      where.weekStartDate = {};
      if (startDate) {
        where.weekStartDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.weekStartDate.lte = new Date(endDate as string);
      }
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        plannedMeals: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                sourceUrl: true,
                prepTime: true,
                cookTime: true,
                servings: true,
              },
            },
            assignedCook: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        weekStartDate: 'desc',
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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        plannedMeals: {
          include: {
            recipe: true,
            assignedCook: true,
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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { weekStartDate, status } = req.body;

    // Validate required fields
    if (!weekStartDate) {
      throw new AppError('Week start date is required', 400);
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        weekStartDate: new Date(weekStartDate),
        status: status || 'draft',
      },
      include: {
        plannedMeals: true,
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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };
    const { status } = req.body;

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

    const updateData: Prisma.MealPlanUpdateInput = {
      ...(status && { status }),
    };

    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
      include: {
        plannedMeals: {
          include: {
            recipe: true,
            assignedCook: true,
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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };

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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };
    const { recipeId, date, mealType, servings, notes, assignedCookId } = req.body;

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

    // Create planned meal
    const meal = await prisma.plannedMeal.create({
      data: {
        mealPlanId: id,
        recipeId,
        date: new Date(date),
        mealType,
        servings: servings || recipe.servings,
        notes,
        assignedCookId,
      },
      include: {
        recipe: true,
        assignedCook: true,
      },
    });

    logger.info(`Meal added to plan ${id}: ${meal.id} by user ${userId}`);

    // Broadcast to other users in the meal plan
    try {
      const wsService = getWebSocketService();
      wsService.broadcastMealPlanUpdate({
        type: 'meal_added',
        mealPlanId: id,
        data: meal,
        userId,
        timestamp: new Date().toISOString(),
      }, userId);
    } catch (error) {
      // WebSocket not critical, log but don't fail the request
      logger.warn('Failed to broadcast meal plan update:', error);
    }

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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { planId, mealId } = req.params as { planId: string; mealId: string };
    const { date, mealType, servings, notes, assignedCookId } = req.body;

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
    const existingMeal = await prisma.plannedMeal.findFirst({
      where: {
        id: mealId,
        mealPlanId: planId,
      },
    });

    if (!existingMeal) {
      throw new AppError('Meal not found', 404);
    }

    const updateData: Prisma.PlannedMealUpdateInput = {
      ...(date && { date: new Date(date) }),
      ...(mealType && { mealType }),
      ...(servings && { servings }),
      ...(notes !== undefined && { notes }),
      ...(assignedCookId !== undefined && { assignedCookId }),
    };

    const meal = await prisma.plannedMeal.update({
      where: { id: mealId },
      data: updateData,
      include: {
        recipe: true,
        assignedCook: true,
      },
    });

    logger.info(`Meal updated: ${mealId} in plan ${planId} by user ${userId}`);

    // Broadcast to other users in the meal plan
    try {
      const wsService = getWebSocketService();
      wsService.broadcastMealPlanUpdate({
        type: 'meal_updated',
        mealPlanId: planId,
        data: meal,
        userId,
        timestamp: new Date().toISOString(),
      }, userId);
    } catch (error) {
      logger.warn('Failed to broadcast meal plan update:', error);
    }

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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { planId, mealId } = req.params as { planId: string; mealId: string };

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
    const existingMeal = await prisma.plannedMeal.findFirst({
      where: {
        id: mealId,
        mealPlanId: planId,
      },
    });

    if (!existingMeal) {
      throw new AppError('Meal not found', 404);
    }

    await prisma.plannedMeal.delete({
      where: { id: mealId },
    });

    logger.info(`Meal removed: ${mealId} from plan ${planId} by user ${userId}`);

    // Broadcast to other users in the meal plan
    try {
      const wsService = getWebSocketService();
      wsService.broadcastMealPlanUpdate({
        type: 'meal_deleted',
        mealPlanId: planId,
        data: { mealId },
        userId,
        timestamp: new Date().toISOString(),
      }, userId);
    } catch (error) {
      logger.warn('Failed to broadcast meal plan update:', error);
    }

    res.json({
      success: true,
      message: 'Meal removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meal-plans/:planId/meals/:mealId/batch-cook
 * @desc    Batch cook a meal to multiple dates
 * @access  Private
 */
export const batchCookMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { planId, mealId } = req.params as { planId: string; mealId: string };
    const { dates, servingsMultiplier, markAsLeftovers } = req.body;

    // Validate required fields
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      throw new AppError('Dates array is required', 400);
    }

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

    // Check if source meal exists
    const sourceMeal = await prisma.plannedMeal.findFirst({
      where: {
        id: mealId,
        mealPlanId: planId,
      },
      include: {
        recipe: true,
      },
    });

    if (!sourceMeal) {
      throw new AppError('Source meal not found', 404);
    }

    // Calculate new servings
    const multiplier = servingsMultiplier || 1;
    const newServings = Math.round(sourceMeal.servings * multiplier);

    // Create meals for each date
    const createdMeals = await Promise.all(
      dates.map((date: string) =>
        prisma.plannedMeal.create({
          data: {
            mealPlanId: planId,
            recipeId: sourceMeal.recipeId,
            date: new Date(date),
            mealType: sourceMeal.mealType,
            servings: newServings,
            assignedCookId: sourceMeal.assignedCookId,
            notes: sourceMeal.notes,
            isLeftover: markAsLeftovers !== undefined ? markAsLeftovers : true,
          },
          include: {
            recipe: true,
            assignedCook: true,
          },
        })
      )
    );

    logger.info(
      `Batch cooked meal ${mealId} to ${dates.length} dates in plan ${planId} by user ${userId}`
    );

    // Broadcast each created meal to other users in the meal plan
    try {
      const wsService = getWebSocketService();
      for (const meal of createdMeals) {
        wsService.broadcastMealPlanUpdate({
          type: 'meal_added',
          mealPlanId: planId,
          data: meal,
          userId,
          timestamp: new Date().toISOString(),
        }, userId);
      }
    } catch (error) {
      logger.warn('Failed to broadcast meal plan updates:', error);
    }

    res.status(201).json({
      success: true,
      data: createdMeals,
      message: `Successfully batch cooked to ${dates.length} dates`,
    });
  } catch (error) {
    next(error);
  }
};

// Made with Bob
