import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * @route   GET /api/pantry
 * @desc    Get all pantry items for authenticated user
 * @access  Private
 */
export const getPantryItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { category } = req.query;

    const where: any = { userId };

    if (category) {
      where.ingredient = {
        category,
      };
    }

    // Note: lowStock filter removed as minQuantity field doesn't exist in schema
    // if (lowStock === 'true') {
    //   where.quantity = { lte: 1 }; // Could use a hardcoded threshold
    // }

    const pantryItems = await prisma.pantryInventory.findMany({
      where,
      include: {
        ingredient: true,
      },
      orderBy: [
        { ingredient: { category: 'asc' } },
        { ingredient: { name: 'asc' } },
      ],
    });

    res.json({
      success: true,
      data: pantryItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/pantry/:id
 * @desc    Get pantry item by ID
 * @access  Private
 */
export const getPantryItemById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };

    const pantryItem = await prisma.pantryInventory.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        ingredient: true,
      },
    });

    if (!pantryItem) {
      throw new AppError('Pantry item not found', 404);
    }

    res.json({
      success: true,
      data: pantryItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/pantry
 * @desc    Add item to pantry
 * @access  Private
 */
export const addPantryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      ingredientId,
      quantity,
      unit,
      location,
      expirationDate,
    } = req.body;

    // Validate required fields
    if (!ingredientId || !quantity || !unit) {
      throw new AppError('Ingredient ID, quantity, and unit are required', 400);
    }

    // Check if ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new AppError('Ingredient not found', 404);
    }

    // Check if item already exists in pantry
    const existing = await prisma.pantryInventory.findFirst({
      where: {
        userId,
        ingredientId,
        unit,
      },
    });

    if (existing) {
      // Update existing item quantity
      const pantryItem = await prisma.pantryInventory.update({
        where: { id: existing.id },
        data: {
          quantity: Number(existing.quantity) + Number(quantity),
          expirationDate: expirationDate ? new Date(expirationDate) : existing.expirationDate,
        },
        include: {
          ingredient: true,
        },
      });

      logger.info(`Pantry item updated: ${pantryItem.id} by user ${userId}`);

      res.json({
        success: true,
        data: pantryItem,
        message: 'Quantity added to existing pantry item',
      });
      return;
    }

    // Create new pantry item
    const pantryItem = await prisma.pantryInventory.create({
      data: {
        userId,
        ingredientId,
        quantity,
        unit,
        location,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
      include: {
        ingredient: true,
      },
    });

    logger.info(`Pantry item added: ${pantryItem.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: pantryItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/pantry/:id
 * @desc    Update pantry item
 * @access  Private
 */
export const updatePantryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };
    const {
      quantity,
      unit,
      location,
      expirationDate,
    } = req.body;

    // Check if pantry item exists and belongs to user
    const existing = await prisma.pantryInventory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Pantry item not found', 404);
    }

    const updateData: Prisma.PantryInventoryUpdateInput = {
      ...(quantity !== undefined && { quantity }),
      ...(unit && { unit }),
      ...(location !== undefined && { location }),
      ...(expirationDate !== undefined && {
        expirationDate: expirationDate ? new Date(expirationDate) : null
      }),
    };

    const pantryItem = await prisma.pantryInventory.update({
      where: { id },
      data: updateData,
      include: {
        ingredient: true,
      },
    });

    logger.info(`Pantry item updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      data: pantryItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/pantry/:id
 * @desc    Remove item from pantry
 * @access  Private
 */
export const deletePantryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };

    // Check if pantry item exists and belongs to user
    const existing = await prisma.pantryInventory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Pantry item not found', 404);
    }

    await prisma.pantryInventory.delete({
      where: { id },
    });

    logger.info(`Pantry item deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Pantry item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/pantry/:id/consume
 * @desc    Consume/reduce quantity of pantry item
 * @access  Private
 */
export const consumePantryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params as { id: string };
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    // Check if pantry item exists and belongs to user
    const existing = await prisma.pantryInventory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Pantry item not found', 404);
    }

    const newQuantity = Number(existing.quantity) - Number(quantity);

    if (newQuantity < 0) {
      throw new AppError('Cannot consume more than available quantity', 400);
    }

    if (newQuantity === 0) {
      // Delete item if quantity reaches zero
      await prisma.pantryInventory.delete({
        where: { id },
      });

      logger.info(`Pantry item consumed and removed: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Pantry item consumed and removed',
      });
      return;
    }

    const pantryItem = await prisma.pantryInventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
      },
      include: {
        ingredient: true,
      },
    });

    logger.info(`Pantry item consumed: ${id} by user ${userId}`);

    res.json({
      success: true,
      data: pantryItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/pantry/low-stock
 * @desc    Get pantry items that are low on stock
 * @access  Private
 */
export const getLowStockItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Note: Low stock detection simplified as minQuantity field doesn't exist
    const pantryItems = await prisma.pantryInventory.findMany({
      where: {
        userId,
        quantity: {
          lte: 1, // Hardcoded threshold since minQuantity doesn't exist in schema
        },
      },
      include: {
        ingredient: true,
      },
      orderBy: [
        { ingredient: { category: 'asc' } },
        { ingredient: { name: 'asc' } },
      ],
    });

    res.json({
      success: true,
      data: pantryItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/pantry/expiring-soon
 * @desc    Get pantry items expiring within specified days
 * @access  Private
 */
export const getExpiringSoonItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { days = '7' } = req.query;
    const daysNum = parseInt(days as string);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysNum);

    const pantryItems = await prisma.pantryInventory.findMany({
      where: {
        userId,
        expirationDate: {
          lte: expirationDate,
          gte: new Date(),
        },
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: pantryItems,
    });
  } catch (error) {
    next(error);
  }
};

// Made with Bob
