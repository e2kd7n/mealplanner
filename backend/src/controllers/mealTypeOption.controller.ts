/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * @route   GET /api/meal-type-options
 * @desc    List household-wide meal type categories (issue #327)
 * @access  Public
 */
export const getMealTypeOptions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const options = await prisma.mealTypeOption.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meal-type-options
 * @desc    Create a new meal type category
 * @access  Private
 */
export const createMealTypeOption = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, sortOrder } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Name is required', 400);
    }
    const trimmedName = name.trim();

    const existing = await prisma.mealTypeOption.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });
    if (existing) {
      throw new AppError('A meal type category with this name already exists', 409);
    }

    const option = await prisma.mealTypeOption.create({
      data: {
        name: trimmedName,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    logger.info('Meal type option created', { id: option.id, name: option.name });

    res.status(201).json({
      success: true,
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/meal-type-options/:id
 * @desc    Rename/reorder a meal type category. Renaming cascades into
 *          every recipe currently tagged with the old name so recipes
 *          never end up referencing a category that no longer exists
 *          under that name.
 * @access  Private
 */
export const updateMealTypeOption = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name, sortOrder } = req.body;

    const existing = await prisma.mealTypeOption.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Meal type category not found', 404);
    }

    let trimmedName: string | undefined;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        throw new AppError('Name cannot be empty', 400);
      }
      trimmedName = name.trim();

      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await prisma.mealTypeOption.findFirst({
          where: { name: { equals: trimmedName, mode: 'insensitive' }, id: { not: id } },
        });
        if (duplicate) {
          throw new AppError('A meal type category with this name already exists', 409);
        }
      }
    }

    const renaming = trimmedName !== undefined && trimmedName !== existing.name;

    const option = await prisma.$transaction(async (tx) => {
      if (renaming) {
        // Recipe.mealTypes is a plain text[], not a relation to this table
        // (see schema comment on MealTypeOption), so a rename has to be
        // pushed into every recipe's array directly.
        await tx.$executeRaw`
          UPDATE recipes
          SET meal_types = array_replace(meal_types, ${existing.name}, ${trimmedName})
          WHERE ${existing.name} = ANY(meal_types)
        `;
      }

      return tx.mealTypeOption.update({
        where: { id },
        data: {
          ...(trimmedName !== undefined && { name: trimmedName }),
          ...(typeof sortOrder === 'number' && { sortOrder }),
        },
      });
    });

    logger.info('Meal type option updated', { id: option.id, name: option.name, renamed: renaming });

    res.json({
      success: true,
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/meal-type-options/:id
 * @desc    Delete a meal type category. Blocked while any recipe still
 *          uses it, mirroring the ingredient-deletion convention
 *          elsewhere in this API.
 * @access  Private
 */
export const deleteMealTypeOption = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.mealTypeOption.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Meal type category not found', 404);
    }

    const usageCount = await prisma.recipe.count({
      where: { mealTypes: { has: existing.name } },
    });

    if (usageCount > 0) {
      throw new AppError(
        `Cannot delete "${existing.name}". It is used by ${usageCount} recipe(s). Reassign them first.`,
        409
      );
    }

    await prisma.mealTypeOption.delete({ where: { id } });

    logger.info('Meal type option deleted', { id, name: existing.name });

    res.json({
      success: true,
      message: 'Meal type category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
