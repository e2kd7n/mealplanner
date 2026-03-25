/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

/**
 * Middleware to verify admin role
 * Must be used after authenticate middleware
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isBlocked: true },
    }) as { id: string; role: string; isBlocked: boolean } | null;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      logger.warn(`Unauthorized admin access attempt by user ${userId}`);
      throw new AppError('Admin access required', 403);
    }

    // Add role to request for further use
    req.user = { ...req.user, role: user.role } as any;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to verify superadmin role
 * Must be used after authenticate middleware
 */
export async function requireSuperAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isBlocked: true },
    }) as { id: string; role: string; isBlocked: boolean } | null;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    if (user.role !== 'superadmin') {
      logger.warn(`Unauthorized superadmin access attempt by user ${userId}`);
      throw new AppError('Superadmin access required', 403);
    }

    // Add role to request for further use
    req.user = { ...req.user, role: user.role } as any;
    next();
  } catch (error) {
    next(error);
  }
}

// Made with Bob