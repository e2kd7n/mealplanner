import { Request, Response, NextFunction } from 'express';
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { category, lowStock } = req.query;

    const where: any = { userId };

    if (category) {
      where.ingredient = {
        category,
      };
    }

    if (lowStock === 'true') {
      where.quantity = {
        lte: prisma.pantryItem.fields.minQuantity,
      };
    }

    const pantryItems = await prisma.pantryItem.findMany({
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const pantryItem = await prisma.pantryItem.findFirst({
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      ingredientId,
      quantity,
      unit,
      location,
      expirationDate,
      minQuantity,
      notes,
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
    const existing = await prisma.pantryItem.findFirst({
      where: {
        userId,
        ingredientId,
        unit,
      },
    });

    if (existing) {
      // Update existing item quantity
      const pantryItem = await prisma.pantryItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          expirationDate: expirationDate ? new Date(expirationDate) : existing.expirationDate,
          notes: notes || existing.notes,
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
    const pantryItem = await prisma.pantryItem.create({
      data: {
        userId,
        ingredientId,
        quantity,
        unit,
        location,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        minQuantity: minQuantity || 0,
        notes,
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const {
      quantity,
      unit,
      location,
      expirationDate,
      minQuantity,
      notes,
    } = req.body;

    // Check if pantry item exists and belongs to user
    const existing = await prisma.pantryItem.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Pantry item not found', 404);
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit) updateData.unit = unit;
    if (location !== undefined) updateData.location = location;
    if (expirationDate !== undefined) {
      updateData.expirationDate = expirationDate ? new Date(expirationDate) : null;
    }
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (notes !== undefined) updateData.notes = notes;

    const pantryItem = await prisma.pantryItem.update({
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if pantry item exists and belongs to user
    const existing = await prisma.pantryItem.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Pantry item not found', 404);
    }

    await prisma.pantryItem.delete({
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    // Check if pantry item exists and belongs to user
    const existing = await prisma.pantryItem.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Pantry item not found', 404);
    }

    const newQuantity = existing.quantity - quantity;

    if (newQuantity < 0) {
      throw new AppError('Cannot consume more than available quantity', 400);
    }

    if (newQuantity === 0) {
      // Delete item if quantity reaches zero
      await prisma.pantryItem.delete({
        where: { id },
      });

      logger.info(`Pantry item consumed and removed: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Pantry item consumed and removed',
      });
      return;
    }

    const pantryItem = await prisma.pantryItem.update({
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const pantryItems = await prisma.pantryItem.findMany({
      where: {
        userId,
        quantity: {
          lte: prisma.pantryItem.fields.minQuantity,
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
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { days = '7' } = req.query;
    const daysNum = parseInt(days as string);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysNum);

    const pantryItems = await prisma.pantryItem.findMany({
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
