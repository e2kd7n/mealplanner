/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { generateTokenPair } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const DEVICE_COOKIE_NAME = 'mealplanner_device';
const DEVICE_TOKEN_DAYS = 14;
const VISUAL_CHALLENGE_SIZE = 4; // 1 correct + 3 decoys

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function setDeviceCookie(res: Response, token: string): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + DEVICE_TOKEN_DAYS);
  res.cookie(DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // lax (not strict) so it works on first load from a new tab
    expires,
    path: '/',
  });
}

/** Shuffle array in-place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * GET /api/auth/users
 * Returns all non-blocked users as {id, familyName} for the username picker.
 * No auth required — this is a local-network-only convenience endpoint.
 */
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { isBlocked: false },
      select: { id: true, familyName: true, visualPasswordRecipeId: true },
      orderBy: { familyName: 'asc' },
    });
    res.json({
      users: users.map((u) => ({
        id: u.id,
        familyName: u.familyName,
        hasVisualPassword: !!u.visualPasswordRecipeId,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/visual-challenge/:userId
 * Returns a shuffled array of VISUAL_CHALLENGE_SIZE recipe images for the
 * login challenge. One is the user's visual password; the rest are random decoys.
 * Does NOT reveal which is correct.
 */
export async function getVisualChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { visualPasswordRecipeId: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      throw new AppError('User not found', 404);
    }
    if (!user.visualPasswordRecipeId) {
      throw new AppError('Visual password not set for this user', 400);
    }

    // Get the correct recipe
    const correctRecipe = await prisma.recipe.findUnique({
      where: { id: user.visualPasswordRecipeId },
      select: { id: true, title: true, imageUrl: true },
    });
    if (!correctRecipe) {
      throw new AppError('Visual password recipe not found', 500);
    }

    // Get random decoy recipes (with images, excluding the correct one)
    const decoys = await prisma.recipe.findMany({
      where: {
        id: { not: user.visualPasswordRecipeId },
        imageUrl: { not: null },
      },
      select: { id: true, title: true, imageUrl: true },
      take: VISUAL_CHALLENGE_SIZE - 1,
      orderBy: { createdAt: 'desc' }, // deterministic enough; real shuffle below
    });

    // If not enough recipes with images, pad with placeholder
    const images = [correctRecipe, ...decoys].slice(0, VISUAL_CHALLENGE_SIZE);
    shuffle(images);

    res.json({ images });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login/visual
 * Body: { userId, recipeId }
 * Validates visual password and issues JWT + 14-day device cookie on success.
 */
export async function visualLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, recipeId } = req.body as { userId: string; recipeId: string };

    if (!userId || !recipeId) {
      throw new AppError('userId and recipeId are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, familyName: true, role: true, isBlocked: true, visualPasswordRecipeId: true },
    });

    if (!user || user.isBlocked) {
      throw new AppError('Invalid credentials', 401);
    }
    if (!user.visualPasswordRecipeId) {
      throw new AppError('Visual password not configured', 400);
    }
    if (user.visualPasswordRecipeId !== recipeId) {
      logger.warn('Visual password mismatch', { userId });
      throw new AppError('Invalid credentials', 401);
    }

    // Issue JWT tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
      familyName: user.familyName,
      role: user.role,
    });

    // Issue 14-day device token
    const rawToken = generateDeviceToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEVICE_TOKEN_DAYS);

    await prisma.deviceToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    setDeviceCookie(res, rawToken);

    logger.info('Visual login successful', { userId: user.id });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.familyName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login/device
 * Validates the 14-day device cookie and issues fresh JWT tokens.
 * Called automatically on app init when cookie is present.
 */
export async function deviceLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.[DEVICE_COOKIE_NAME];
    if (!rawToken) {
      throw new AppError('No device token', 401);
    }

    const tokenHash = hashToken(rawToken);
    const deviceToken = await prisma.deviceToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, familyName: true, role: true, isBlocked: true },
        },
      },
    });

    if (!deviceToken || deviceToken.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (deviceToken) {
        await prisma.deviceToken.delete({ where: { tokenHash } });
      }
      res.clearCookie(DEVICE_COOKIE_NAME);
      throw new AppError('Device token expired or invalid', 401);
    }

    if (deviceToken.user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    const { accessToken, refreshToken } = generateTokenPair({
      userId: deviceToken.user.id,
      email: deviceToken.user.email,
      familyName: deviceToken.user.familyName,
      role: deviceToken.user.role,
    });

    // Rotate the device token for security (rolling window)
    const newRawToken = generateDeviceToken();
    const newTokenHash = hashToken(newRawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEVICE_TOKEN_DAYS);

    await prisma.deviceToken.update({
      where: { tokenHash },
      data: { tokenHash: newTokenHash, expiresAt },
    });

    setDeviceCookie(res, newRawToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: deviceToken.user.id,
        email: deviceToken.user.email,
        name: deviceToken.user.familyName,
        role: deviceToken.user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/visual-password/setup
 * Body: { recipeId }
 * Sets or updates the authenticated user's visual password recipe.
 */
export async function setupVisualPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { recipeId } = req.body as { recipeId: string };

    if (!recipeId) {
      throw new AppError('recipeId is required', 400);
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, title: true, imageUrl: true },
    });
    if (!recipe || !recipe.imageUrl) {
      throw new AppError('Recipe not found or has no image', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { visualPasswordRecipeId: recipeId },
    });

    logger.info('Visual password updated', { userId });
    res.json({ message: 'Visual password set', recipe: { id: recipe.id, title: recipe.title, imageUrl: recipe.imageUrl } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/visual-password/status
 * Returns whether the authenticated user has set a visual password.
 */
export async function getVisualPasswordStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { visualPasswordRecipeId: true },
    });
    res.json({ hasVisualPassword: !!user?.visualPasswordRecipeId });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout/device
 * Clears the device token cookie and removes it from the database.
 */
export async function deviceLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.[DEVICE_COOKIE_NAME];
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await prisma.deviceToken.deleteMany({ where: { tokenHash } }).catch(() => {});
    }
    res.clearCookie(DEVICE_COOKIE_NAME);
    res.json({ message: 'Device logged out' });
  } catch (err) {
    next(err);
  }
}

// Made with Bob
