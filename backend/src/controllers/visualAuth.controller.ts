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
import {
  createVisualChallenge,
  consumeVisualChallenge,
  recordVisualFailure,
  isVisualLoginLocked,
  clearVisualFailures,
  VISUAL_MAX_FAILURES,
} from '../utils/visualChallengeStore';
import { getSessionSecret } from '../utils/secrets';

const DEVICE_COOKIE_NAME = 'mealplanner_device';
const DEVICE_TOKEN_DAYS = 14;
// Images actually shown (and required to guess among) per challenge — 1 correct + 7
// decoys. This is the real per-attempt entropy for a blind guesser: a wider backing
// STOCK_IMAGES pool only helps if each challenge draws a fresh random subset of it
// (see getVisualChallenge), since an attacker who can see a challenge response always
// knows exactly which options it offered.
const VISUAL_CHALLENGE_SIZE = 8;

const STOCK_IMAGES = [
  { id: 'stock-burger', title: 'Burger', imageUrl: '/visual-login/burger.svg' },
  { id: 'stock-pizza', title: 'Pizza', imageUrl: '/visual-login/pizza.svg' },
  { id: 'stock-sushi', title: 'Sushi', imageUrl: '/visual-login/sushi.svg' },
  { id: 'stock-salad', title: 'Salad', imageUrl: '/visual-login/salad.svg' },
  { id: 'stock-pasta', title: 'Pasta', imageUrl: '/visual-login/pasta.svg' },
  { id: 'stock-taco', title: 'Taco', imageUrl: '/visual-login/taco.svg' },
  { id: 'stock-cake', title: 'Cake', imageUrl: '/visual-login/cake.svg' },
  { id: 'stock-soup', title: 'Soup', imageUrl: '/visual-login/soup.svg' },
  { id: 'stock-donut', title: 'Donut', imageUrl: '/visual-login/donut.svg' },
  { id: 'stock-icecream', title: 'Ice Cream', imageUrl: '/visual-login/icecream.svg' },
  { id: 'stock-avocado', title: 'Avocado', imageUrl: '/visual-login/avocado.svg' },
  { id: 'stock-pretzel', title: 'Pretzel', imageUrl: '/visual-login/pretzel.svg' },
  { id: 'stock-waffle', title: 'Waffle', imageUrl: '/visual-login/waffle.svg' },
  { id: 'stock-hotdog', title: 'Hot Dog', imageUrl: '/visual-login/hotdog.svg' },
  { id: 'stock-cupcake', title: 'Cupcake', imageUrl: '/visual-login/cupcake.svg' },
  { id: 'stock-coffee', title: 'Coffee', imageUrl: '/visual-login/coffee.svg' },
];

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

/**
 * Pick `count` decoys for a member deterministically, so every challenge for that
 * member shows the same image set (only the order changes). Drawing a fresh random
 * set per request let anyone fetch a handful of challenges and intersect them —
 * the one image present every time is the answer, recovered without a single guess.
 *
 * Ranked by an HMAC keyed with a server secret rather than a plain hash: with a
 * public ranking, an attacker could recompute the set for each of the 8 candidates
 * and see which one reproduces the set they were shown.
 */
function stableDecoys<T extends { id: string }>(pool: T[], memberId: string, correctId: string, count: number): T[] {
  const secret = getSessionSecret();
  return pool
    .map((item) => ({
      item,
      rank: crypto.createHmac('sha256', secret).update(`${memberId}:${correctId}:${item.id}`).digest('hex'),
    }))
    .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0))
    .slice(0, count)
    .map(({ item }) => item);
}

function lockedOutError(): AppError {
  return new AppError(
    'Too many incorrect picks for this person — visual login is paused for 15 minutes. Use email and password instead.',
    429
  );
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
    // Deduplicate by normalized name — keeps the first occurrence per name after
    // alphabetical sort, so stale duplicates from old accounts don't double-up the picker.
    const seen = new Set<string>();
    const unique = members.filter((m) => {
      const key = m.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json({
      users: unique.map((m) => ({ id: m.id, name: m.name })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/visual-challenge/:memberId
 * Creates a single-use, ~2-minute challenge and returns a shuffled array of
 * VISUAL_CHALLENGE_SIZE images for the login picker. One is the family member's
 * visual password; the rest are random decoys drawn fresh each call. Does NOT reveal
 * which is correct — `POST /login/visual` must present the returned challengeId and
 * can only be checked against the specific image set this call produced.
 */
export async function getVisualChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberId = req.params['userId'] as string;

    const member = await withRetry(() =>
      prisma.familyMember.findUnique({
        where: { id: memberId },
        select: { visualPasswordRecipeId: true, visualPasswordImageUrl: true },
      })
    );

    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    if (await isVisualLoginLocked(memberId)) {
      throw lockedOutError();
    }

    // Stock image visual password
    if (member.visualPasswordImageUrl) {
      const correct = STOCK_IMAGES.find((s) => s.imageUrl === member.visualPasswordImageUrl);
      if (!correct) {
        throw new AppError('Visual password image not found', 500);
      }
      const decoys = stableDecoys(
        STOCK_IMAGES.filter((s) => s.imageUrl !== member.visualPasswordImageUrl),
        memberId,
        correct.id,
        VISUAL_CHALLENGE_SIZE - 1
      );
      const images = shuffle([correct, ...decoys]);

      const challengeId = await createVisualChallenge(memberId, correct.id);
      res.json({ challengeId, images: images.map(({ id, title, imageUrl }) => ({ id, title, imageUrl })) });
      return;
    }

    // Recipe-based visual password (legacy)
    if (!member.visualPasswordRecipeId) {
      throw new AppError('Visual password not set for this family member', 400);
    }

    const correctRecipe = await withRetry(() =>
      prisma.recipe.findUnique({
        where: { id: member.visualPasswordRecipeId! },
        select: { id: true, title: true, imageUrl: true },
      })
    );
    if (!correctRecipe) {
      throw new AppError('Visual password recipe not found', 500);
    }

    // Previously "the 7 newest recipes" — identical for every member, so comparing
    // two members' challenges exposed each one's answer as the odd one out. The
    // stable per-member pick still shifts slowly as recipes are added or removed;
    // acceptable for this legacy path, which new setups no longer use.
    const decoyPool = await withRetry(() =>
      prisma.recipe.findMany({
        where: {
          id: { not: member.visualPasswordRecipeId! },
          imageUrl: { not: null },
        },
        select: { id: true, title: true, imageUrl: true },
      })
    );
    const decoys = stableDecoys(decoyPool, memberId, correctRecipe.id, VISUAL_CHALLENGE_SIZE - 1);

    const images = shuffle([correctRecipe, ...decoys]);

    const challengeId = await createVisualChallenge(memberId, correctRecipe.id);
    res.json({ challengeId, images: images.map(({ id, title, imageUrl }) => ({ id, title, imageUrl })) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login/visual
 * Body: { memberId, challengeId, recipeId } where recipeId is the id (recipe ID or
 * stock image ID, e.g. "stock-burger") the caller picked from the challenge's image
 * set. The guess is checked against the single-use challenge record created by
 * `getVisualChallenge` — not re-derived from a static table — so a caller can no
 * longer skip straight to guessing without ever fetching a challenge, and each
 * challenge (and its randomized decoy set) can only be tried once.
 * Issues JWT + 14-day device cookie on success.
 */
export async function visualLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { memberId, challengeId, recipeId: imageId } = req.body as {
      memberId: string;
      challengeId: string;
      recipeId: string;
    };

    if (!memberId || !challengeId || !imageId) {
      throw new AppError('memberId, challengeId and recipeId are required', 400);
    }

    if (await isVisualLoginLocked(memberId)) {
      throw lockedOutError();
    }

    const challenge = await consumeVisualChallenge(challengeId);
    if (!challenge || challenge.memberId !== memberId) {
      logger.warn('Visual login challenge invalid, expired, already used, or for another member', { memberId });
      throw new AppError('Invalid or expired login attempt — please try again', 401);
    }
    if (challenge.correctId !== imageId) {
      const failures = await recordVisualFailure(memberId);
      logger.warn('Visual login wrong answer', { memberId, failures, max: VISUAL_MAX_FAILURES });
      throw new AppError('Invalid or expired login attempt — please try again', 401);
    }
    await clearVisualFailures(memberId);

    const member = await withRetry(() =>
      prisma.familyMember.findUnique({
        where: { id: memberId },
        select: { id: true, name: true, userId: true, visualPasswordRecipeId: true, visualPasswordImageUrl: true },
      })
    );

    if (!member || !(member.visualPasswordImageUrl || member.visualPasswordRecipeId)) {
      throw new AppError('Invalid credentials', 401);
    }

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

    const refreshTokenHash = hashSessionToken(tokens.refreshToken);
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 1);

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

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    const rawToken = generateDeviceToken();
    const tokenHash = hashToken(rawToken);
    const deviceExpiresAt = new Date();
    deviceExpiresAt.setDate(deviceExpiresAt.getDate() + DEVICE_TOKEN_DAYS);

    await withRetry(() =>
      prisma.deviceToken.create({
        data: { userId: user.id, familyMemberId: member.id, tokenHash, expiresAt: deviceExpiresAt },
      })
    );

    setDeviceCookie(res, rawToken);

    logger.info('Visual login successful', { memberId, userId: user.id });

    res.json({
      message: 'Visual login successful',
      user: { id: user.id, email: user.email, name: member.name, role: user.role },
      familyMemberId: member.id,
      memberName: member.name,
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
          familyMember: {
            select: { id: true, name: true },
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

    const memberName = deviceToken.familyMember?.name ?? deviceToken.user.familyName;

    res.json({
      message: 'Device login successful',
      user: {
        id: deviceToken.user.id,
        email: deviceToken.user.email,
        name: memberName,
        role: deviceToken.user.role,
      },
      familyMemberId: deviceToken.familyMember?.id ?? null,
      memberName: deviceToken.familyMember?.name ?? null,
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
          select: { visualPasswordRecipeId: true, visualPasswordImageUrl: true },
        })
      );
      res.json({ hasVisualPassword: !!(member?.visualPasswordRecipeId || member?.visualPasswordImageUrl) });
    } else {
      const members = await withRetry(() =>
        prisma.familyMember.findMany({
          where: { userId },
          select: { id: true, name: true, visualPasswordRecipeId: true, visualPasswordImageUrl: true },
          orderBy: { name: 'asc' },
        })
      );
      res.json({
        members: members.map((m) => ({
          id: m.id,
          name: m.name,
          hasVisualPassword: !!(m.visualPasswordRecipeId || m.visualPasswordImageUrl),
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

/**
 * GET /api/auth/visual-setup/images
 * Returns all recipes that have images, regardless of owner.
 * Used by the setup flow so users can pick from seed recipes and their own.
 * Requires authentication to prevent unauthenticated enumeration.
 */
export async function getVisualSetupImages(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipes = await withRetry(() =>
      prisma.recipe.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, title: true, imageUrl: true },
        orderBy: { createdAt: 'asc' },
      })
    );
    res.json({ images: recipes });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/visual-setup/stock-images
 * Returns the list of bundled stock food images available for visual password setup.
 * No auth required — used during the Setup wizard.
 */
export function getStockImages(_req: Request, res: Response): void {
  res.json({ images: STOCK_IMAGES });
}

/**
 * POST /api/auth/visual-password/setup-stock
 * Body: { familyMemberId, imageUrl }
 * Sets a family member's visual password to a stock image.
 * Requires authentication. The family member must belong to the authenticated user.
 */
export async function setupStockVisualPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { familyMemberId, imageUrl } = req.body as { familyMemberId: string; imageUrl: string };

    if (!familyMemberId || !imageUrl) {
      throw new AppError('familyMemberId and imageUrl are required', 400);
    }

    const stockImage = STOCK_IMAGES.find((s) => s.imageUrl === imageUrl);
    if (!stockImage) {
      throw new AppError('Invalid stock image', 400);
    }

    const member = await withRetry(() =>
      prisma.familyMember.findFirst({
        where: { id: familyMemberId, userId },
      })
    );
    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    await withRetry(() =>
      prisma.familyMember.update({
        where: { id: familyMemberId },
        data: { visualPasswordImageUrl: imageUrl, visualPasswordRecipeId: null },
      })
    );

    logger.info('Stock visual password set', { familyMemberId, userId });
    res.json({ message: 'Visual password set', image: stockImage });
  } catch (err) {
    next(err);
  }
}
