/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

/**
 * Get all users with pagination
 * GET /api/admin/users
 */
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { familyName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && ['user', 'admin', 'superadmin'].includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          familyName: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              recipes: true,
              mealPlans: true,
              familyMembers: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    logger.info(`Admin ${req.user?.userId} listed users`, { page, limit, total });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user details by ID
 * GET /api/admin/users/:id
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        familyName: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        familyMembers: {
          select: {
            id: true,
            name: true,
            ageGroup: true,
          },
        },
        _count: {
          select: {
            recipes: true,
            mealPlans: true,
            groceryLists: true,
            pantryInventory: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    logger.info(`Admin ${req.user?.userId} viewed user ${id}`);

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset user password (admin-initiated)
 * POST /api/admin/users/:id/reset-password
 */
export async function resetUserPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent non-superadmins from resetting admin passwords
    const adminUser = req.user as any;
    if (user.role === 'admin' || user.role === 'superadmin') {
      if (adminUser.role !== 'superadmin') {
        throw new AppError('Only superadmins can reset admin passwords', 403);
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    logger.warn(`Admin ${req.user?.userId} reset password for user ${id} (${user.email})`);

    res.json({
      message: 'Password reset successfully',
      userId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Block/suspend user account
 * PUT /api/admin/users/:id/block
 */
export async function blockUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isBlocked: true },
    }) as { id: string; email: string; role: string; isBlocked: boolean } | null;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isBlocked) {
      throw new AppError('User is already blocked', 400);
    }

    // Prevent non-superadmins from blocking admins
    const adminUser = req.user as any;
    if (user.role === 'admin' || user.role === 'superadmin') {
      if (adminUser.role !== 'superadmin') {
        throw new AppError('Only superadmins can block admin accounts', 403);
      }
    }

    // Prevent blocking self
    if (id === req.user?.userId) {
      throw new AppError('Cannot block your own account', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });

    logger.warn(`Admin ${req.user?.userId} blocked user ${id} (${user.email})`);

    res.json({
      message: 'User blocked successfully',
      userId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unblock user account
 * PUT /api/admin/users/:id/unblock
 */
export async function unblockUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, isBlocked: true },
    }) as { id: string; email: string; isBlocked: boolean } | null;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isBlocked) {
      throw new AppError('User is not blocked', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    });

    logger.info(`Admin ${req.user?.userId} unblocked user ${id} (${user.email})`);

    res.json({
      message: 'User unblocked successfully',
      userId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user account
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    }) as { id: string; email: string; role: string } | null;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent non-superadmins from deleting admins
    const adminUser = req.user as any;
    if (user.role === 'admin' || user.role === 'superadmin') {
      if (adminUser.role !== 'superadmin') {
        throw new AppError('Only superadmins can delete admin accounts', 403);
      }
    }

    // Prevent deleting self
    if (id === req.user?.userId) {
      throw new AppError('Cannot delete your own account', 400);
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    logger.warn(`Admin ${req.user?.userId} deleted user ${id} (${user.email})`);

    res.json({
      message: 'User deleted successfully',
      userId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system statistics
 * GET /api/admin/stats
 */
export async function getSystemStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalUsers,
      totalRecipes,
      totalMealPlans,
      blockedUsers,
      adminUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.mealPlan.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { role: { in: ['admin', 'superadmin'] } } }),
    ]);

    logger.info(`Admin ${req.user?.userId} viewed system stats`);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          blocked: blockedUsers,
          admins: adminUsers,
        },
        recipes: {
          total: totalRecipes,
        },
        mealPlans: {
          total: totalMealPlans,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllUsers,
  getUserById,
  resetUserPassword,
  blockUser,
  unblockUser,
  deleteUser,
  getSystemStats,
};

// Made with Bob