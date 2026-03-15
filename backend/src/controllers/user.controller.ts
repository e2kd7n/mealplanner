/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Extract and validate user ID from request
 */
function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  return userId;
}

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        familyName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const { familyName } = req.body;

    // Validate input
    if (!familyName || typeof familyName !== 'string' || !familyName.trim()) {
      throw new AppError('Family name is required', 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        familyName: familyName.trim(),
      },
      select: {
        id: true,
        email: true,
        familyName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated', { userId });

    res.json({
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/users/preferences
 * @desc    Get user preferences
 * @access  Private
 */
export async function getPreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        avoidedIngredients: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          weeklyBudget: null,
          preferredCuisines: [],
          cookingSkillLevel: 'beginner',
          maxPrepTimeWeeknight: 45,
          maxPrepTimeWeekend: 90,
          dietaryPreferences: {},
          notificationSettings: {
            mealReminders: true,
            groceryReminders: true,
            expirationAlerts: true,
          },
        },
        include: {
          avoidedIngredients: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });
    }

    res.json({
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
export async function updatePreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const {
      weeklyBudget,
      preferredCuisines,
      cookingSkillLevel,
      maxPrepTimeWeeknight,
      maxPrepTimeWeekend,
      dietaryPreferences,
      notificationSettings,
      avoidedIngredientIds,
    } = req.body;

    // Validate skill level if provided
    if (cookingSkillLevel && !['beginner', 'intermediate', 'advanced'].includes(cookingSkillLevel)) {
      throw new AppError('Invalid cooking skill level', 400);
    }

    // Build update data
    const updateData: any = {};
    if (weeklyBudget !== undefined) updateData.weeklyBudget = weeklyBudget;
    if (preferredCuisines !== undefined) updateData.preferredCuisines = preferredCuisines;
    if (cookingSkillLevel !== undefined) updateData.cookingSkillLevel = cookingSkillLevel;
    if (maxPrepTimeWeeknight !== undefined) updateData.maxPrepTimeWeeknight = maxPrepTimeWeeknight;
    if (maxPrepTimeWeekend !== undefined) updateData.maxPrepTimeWeekend = maxPrepTimeWeekend;
    if (dietaryPreferences !== undefined) updateData.dietaryPreferences = dietaryPreferences;
    if (notificationSettings !== undefined) updateData.notificationSettings = notificationSettings;

    // Handle avoided ingredients separately
    if (avoidedIngredientIds !== undefined) {
      updateData.avoidedIngredients = {
        set: avoidedIngredientIds.map((id: string) => ({ id })),
      };
    }

    // Check if preferences exist
    const existingPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    let preferences;
    if (existingPreferences) {
      // Update existing preferences
      preferences = await prisma.userPreferences.update({
        where: { userId },
        data: updateData,
        include: {
          avoidedIngredients: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });
    } else {
      // Create new preferences with defaults
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          weeklyBudget: weeklyBudget || null,
          preferredCuisines: preferredCuisines || [],
          cookingSkillLevel: cookingSkillLevel || 'beginner',
          maxPrepTimeWeeknight: maxPrepTimeWeeknight || 45,
          maxPrepTimeWeekend: maxPrepTimeWeekend || 90,
          dietaryPreferences: dietaryPreferences || {},
          notificationSettings: notificationSettings || {
            mealReminders: true,
            groceryReminders: true,
            expirationAlerts: true,
          },
          ...(avoidedIngredientIds && {
            avoidedIngredients: {
              connect: avoidedIngredientIds.map((id: string) => ({ id })),
            },
          }),
        },
        include: {
          avoidedIngredients: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });
    }

    logger.info('User preferences updated', { userId });

    res.json({
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
};

// Made with Bob