/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './errorHandler';
import prisma, { withRetry } from '../utils/prisma';
import { getAccessTokenFromRequest } from '../utils/authCookies';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getAccessTokenFromRequest(req);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyAccessToken(token);

    const user = await withRetry(() => prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        familyName: true,
        role: true,
        isBlocked: true,
      },
    }));

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      familyName: user.familyName,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError('Authentication failed', 401));
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getAccessTokenFromRequest(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);

    const user = await withRetry(() => prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        familyName: true,
        role: true,
        isBlocked: true,
      },
    }));

    if (user && !user.isBlocked) {
      req.user = {
        userId: user.id,
        id: user.id,
        email: user.email,
        familyName: user.familyName,
        role: user.role,
      };
    }

    next();
  } catch (_error) {
    next();
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new AppError('Admin access required', 403);
  }

  next();
}

export default { authenticate, optionalAuthenticate, requireAdmin };

// Made with Bob
