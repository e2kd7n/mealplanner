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

    res.json({
      success: true,
      message: 'Meal removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Made with Bob
