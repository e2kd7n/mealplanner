/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma, { withRetry } from '../utils/prisma';
import { generateTokenPair } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  setAuthCookies,
  clearAuthCookies,
  hashSessionToken,
  getClientIp,
} from '../utils/authCookies';

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
    secure: process.env.COOKIE_SECURE === 'true',
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
 * Returns all family members as {id, name} for the visual login picker.
 * No auth required — this is a local-network-only convenience endpoint.
 */
export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await withRetry(() =>
      prisma.familyMember.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    );
    res.json({
      users: members.map((m) => ({ id: m.id, name: m.name })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/visual-challenge/:memberId
 * Returns a shuffled array of VISUAL_CHALLENGE_SIZE recipe images for the
 * login challenge. One is the family member's visual password; the rest are random decoys.
 * Does NOT reveal which is correct.
 */
export async function getVisualChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberId = req.params['userId'] as string;

    const member = await withRetry(() =>
      prisma.familyMember.findUnique({
        where: { id: memberId },
        select: { visualPasswordRecipeId: true },
      })
    );

    if (!member) {
      throw new AppError('Family member not found', 404);
    }
    if (!member.visualPasswordRecipeId) {
      throw new AppError('Visual password not set for this family member', 400);
    }

    // Get the correct recipe
    const correctRecipe = await withRetry(() =>
      prisma.recipe.findUnique({
        where: { id: member.visualPasswordRecipeId! },
        select: { id: true, title: true, imageUrl: true },
      })
    );
    if (!correctRecipe) {
      throw new AppError('Visual password recipe not found', 500);
    }

    // Get random decoy recipes (with images, excluding the correct one)
    const decoys = await withRetry(() =>
      prisma.recipe.findMany({
        where: {
          id: { not: member.visualPasswordRecipeId! },
          imageUrl: { not: null },
        },
        select: { id: true, title: true, imageUrl: true },
        take: VISUAL_CHALLENGE_SIZE - 1,
        orderBy: { createdAt: 'desc' },
      })
    );

    const images = [correctRecipe, ...decoys].slice(0, VISUAL_CHALLENGE_SIZE);
    shuffle(images);

    res.json({ images });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login/visual
 * Body: { memberId, recipeId }
 * Validates the family member's visual password and issues JWT + 14-day device cookie on success.
 */
export async function visualLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { memberId, recipeId } = req.body as { memberId: string; recipeId: string };

    if (!memberId || !recipeId) {
      throw new AppError('memberId and recipeId are required', 400);
    }

    const member = await withRetry(() =>
      prisma.familyMember.findUnique({
        where: { id: memberId },
        select: { id: true, name: true, userId: true, visualPasswordRecipeId: true },
      })
    );

    if (!member) {
      throw new AppError('Invalid credentials', 401);
    }
    if (!member.visualPasswordRecipeId) {
      throw new AppError('Visual password not configured', 400);
    }
    if (member.visualPasswordRecipeId !== recipeId) {
      logger.warn('Visual password mismatch', { memberId });
      throw new AppError('Invalid credentials', 401);
    }

    // Issue JWT for the parent user account
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: member.userId },
        select: { id: true, email: true, familyName: true, role: true, isBlocked: true },
      })
    );

    if (!user || user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      familyName: user.familyName,
      role: user.role,
    });

    // Create auth session for refresh token
    const refreshTokenHash = hashSessionToken(tokens.refreshToken);
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 1); // 24 hours

    await withRetry(() =>
      prisma.authSession.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          expiresAt: sessionExpiresAt,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: getClientIp(req) || null,
        },
      })
    );

    // Set auth cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Issue 14-day device token
    const rawToken = generateDeviceToken();
    const tokenHash = hashToken(rawToken);
    const deviceExpiresAt = new Date();
    deviceExpiresAt.setDate(deviceExpiresAt.getDate() + DEVICE_TOKEN_DAYS);

    await withRetry(() =>
      prisma.deviceToken.create({
        data: { userId: user.id, tokenHash, expiresAt: deviceExpiresAt },
      })
    );

    setDeviceCookie(res, rawToken);

    logger.info('Visual login successful', { memberId, userId: user.id });

    res.json({
      message: 'Visual login successful',
      user: { id: user.id, email: user.email, name: member.name, role: user.role },
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
    const deviceToken = await withRetry(() =>
      prisma.deviceToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            select: { id: true, email: true, familyName: true, role: true, isBlocked: true },
          },
        },
      })
    );

    if (!deviceToken || deviceToken.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (deviceToken) {
        await withRetry(() =>
          prisma.deviceToken.delete({ where: { tokenHash } })
        );
      }
      res.clearCookie(DEVICE_COOKIE_NAME);
      throw new AppError('Device token expired or invalid', 401);
    }

    if (deviceToken.user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    const tokens = generateTokenPair({
      userId: deviceToken.user.id,
      email: deviceToken.user.email,
      familyName: deviceToken.user.familyName,
      role: deviceToken.user.role,
    });

    // Create auth session for refresh token
    const refreshTokenHash = hashSessionToken(tokens.refreshToken);
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 1); // 24 hours

    await withRetry(() =>
      prisma.authSession.create({
        data: {
          userId: deviceToken.user.id,
          refreshTokenHash,
          expiresAt: sessionExpiresAt,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: getClientIp(req) || null,
        },
      })
    );

    // Set auth cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Rotate the device token for security (rolling window)
    const newRawToken = generateDeviceToken();
    const newTokenHash = hashToken(newRawToken);
    const deviceExpiresAt = new Date();
    deviceExpiresAt.setDate(deviceExpiresAt.getDate() + DEVICE_TOKEN_DAYS);

    await withRetry(() =>
      prisma.deviceToken.update({
        where: { tokenHash },
        data: { tokenHash: newTokenHash, expiresAt: deviceExpiresAt },
      })
    );

    setDeviceCookie(res, newRawToken);

    res.json({
      message: 'Device login successful',
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
 * Body: { familyMemberId, recipeId }
 * Sets or updates a family member's visual password recipe.
 * The family member must belong to the authenticated user.
 */
export async function setupVisualPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { familyMemberId, recipeId } = req.body as { familyMemberId: string; recipeId: string };

    if (!familyMemberId || !recipeId) {
      throw new AppError('familyMemberId and recipeId are required', 400);
    }

    const member = await withRetry(() =>
      prisma.familyMember.findFirst({
        where: { id: familyMemberId, userId },
      })
    );
    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    const recipe = await withRetry(() =>
      prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, title: true, imageUrl: true },
      })
    );
    if (!recipe || !recipe.imageUrl) {
      throw new AppError('Recipe not found or has no image', 400);
    }

    await withRetry(() =>
      prisma.familyMember.update({
        where: { id: familyMemberId },
        data: { visualPasswordRecipeId: recipeId },
      })
    );

    logger.info('Visual password updated', { familyMemberId, userId });
    res.json({ message: 'Visual password set', recipe: { id: recipe.id, title: recipe.title, imageUrl: recipe.imageUrl } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/visual-password/status
 * Returns visual password status for the authenticated user's family members.
 * Pass ?familyMemberId=<id> to check a specific member; omit for all members.
 */
export async function getVisualPasswordStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { familyMemberId } = req.query as { familyMemberId?: string };

    if (familyMemberId) {
      const member = await withRetry(() =>
        prisma.familyMember.findFirst({
          where: { id: familyMemberId, userId },
          select: { visualPasswordRecipeId: true },
        })
      );
      res.json({ hasVisualPassword: !!member?.visualPasswordRecipeId });
    } else {
      const members = await withRetry(() =>
        prisma.familyMember.findMany({
          where: { userId },
          select: { id: true, name: true, visualPasswordRecipeId: true },
          orderBy: { name: 'asc' },
        })
      );
      res.json({
        members: members.map((m) => ({
          id: m.id,
          name: m.name,
          hasVisualPassword: !!m.visualPasswordRecipeId,
        })),
      });
    }
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
      await withRetry(() =>
        prisma.deviceToken.deleteMany({ where: { tokenHash } })
      ).catch(() => {});
    }
    res.clearCookie(DEVICE_COOKIE_NAME);
    
    // Also clear auth cookies
    clearAuthCookies(res);
    
    res.json({ message: 'Device logged out' });
  } catch (err) {
    next(err);
  }
}

// Made with Bob
