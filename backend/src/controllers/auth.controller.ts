/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import prisma, { withRetry } from '../utils/prisma';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { usersRegisteredTotal } from '../utils/prometheus';
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  hashSessionToken,
  getClientIp,
} from '../utils/authCookies';

/**
 * Get the start of the current week (Sunday)
 */
function getWeekStartDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek; // Days since Sunday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - diff);
  return weekStart;
}

/**
 * Create initial meal plan for new user
 */
async function createInitialMealPlan(userId: string): Promise<void> {
  try {
    const weekStartDate = getWeekStartDate();
    
    await prisma.mealPlan.create({
      data: {
        userId,
        weekStartDate,
        status: 'draft',
      },
    });
    
    logger.info('Initial meal plan created for new user', { userId });
  } catch (error) {
    // Log error but don't fail registration if meal plan creation fails
    logger.error('Failed to create initial meal plan for new user', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// TypeScript interfaces for request bodies
interface RegisterRequestBody {
  email: string;
  password: string;
  familyName: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}


// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password policy configuration from environment variables
const PASSWORD_POLICY = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10),
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
  requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  minUppercase: parseInt(process.env.PASSWORD_MIN_UPPERCASE || '1', 10),
  minLowercase: parseInt(process.env.PASSWORD_MIN_LOWERCASE || '1', 10),
  minNumbers: parseInt(process.env.PASSWORD_MIN_NUMBERS || '1', 10),
  minSpecial: parseInt(process.env.PASSWORD_MIN_SPECIAL || '1', 10),
};

/**
 * Validate email format
 */
function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new AppError('Email is required', 400);
  }
  
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Invalid email format', 400);
  }
}

/**
 * Count character types in password
 */
function countCharacterTypes(password: string): {
  uppercase: number;
  lowercase: number;
  numbers: number;
  special: number;
} {
  return {
    uppercase: (password.match(/[A-Z]/g) || []).length,
    lowercase: (password.match(/[a-z]/g) || []).length,
    numbers: (password.match(/[0-9]/g) || []).length,
    special: (password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g) || []).length,
  };
}

/**
 * Pluralize a word based on count
 */
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Validate password strength based on configurable policy
 */
function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400);
  }
  
  // Check length constraints
  if (password.length < PASSWORD_POLICY.minLength || password.length > PASSWORD_POLICY.maxLength) {
    throw new AppError(
      `Password must be between ${PASSWORD_POLICY.minLength} and ${PASSWORD_POLICY.maxLength} characters`,
      400
    );
  }
  
  // Count character types
  const counts = countCharacterTypes(password);
  
  // Define validation rules for character types
  const validationRules = [
    {
      enabled: PASSWORD_POLICY.requireUppercase,
      count: counts.uppercase,
      min: PASSWORD_POLICY.minUppercase,
      type: 'uppercase letter',
    },
    {
      enabled: PASSWORD_POLICY.requireLowercase,
      count: counts.lowercase,
      min: PASSWORD_POLICY.minLowercase,
      type: 'lowercase letter',
    },
    {
      enabled: PASSWORD_POLICY.requireNumber,
      count: counts.numbers,
      min: PASSWORD_POLICY.minNumbers,
      type: 'number',
    },
    {
      enabled: PASSWORD_POLICY.requireSpecial,
      count: counts.special,
      min: PASSWORD_POLICY.minSpecial,
      type: 'special character',
      suffix: ' (!@#$%^&*()_+-=[]{}|;:,.<>?)',
    },
  ];

  // Validate each character type requirement
  for (const rule of validationRules) {
    if (rule.enabled && rule.count < rule.min) {
      throw new AppError(
        `Password must contain at least ${rule.min} ${pluralize(rule.min, rule.type)}${rule.suffix || ''}`,
        400
      );
    }
  }
}

/**
 * Validate registration input
 */
function validateRegistrationInput(email: string, password: string, familyName: string): void {
  validateEmail(email);
  validatePassword(password);
  
  if (!familyName || typeof familyName !== 'string' || !familyName.trim()) {
    throw new AppError('Family name is required', 400);
  }
}

/**
 * Format user response (removes sensitive data)
 */
function formatUserResponse(user: { id: string; email: string; familyName: string; role: string }) {
  return {
    id: user.id,
    email: user.email,
    familyName: user.familyName,
    role: user.role,
  };
}

/**
 * Mask email for logging (only show domain)
 */
function maskEmail(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? `***@${parts[1]}` : '***';
}

/**
 * Ensure user with given email does not exist
 * @throws {AppError} If user already exists
 */
async function ensureUserNotExists(email: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }
}


/**
 * Create auth session for refresh token
 */
async function createAuthSession(
  userId: string,
  refreshToken: string,
  req: Request
): Promise<void> {
  const refreshTokenHash = hashSessionToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours

  await withRetry(() =>
    prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: getClientIp(req) || null,
      },
    })
  );
}

/**
 * Generate authentication response with cookies
 */
async function generateAuthResponseWithCookies(
  user: { id: string; email: string; familyName: string; role: string },
  res: Response,
  req: Request
): Promise<void> {
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    familyName: user.familyName,
    role: user.role,
  });

  // Create session for refresh token
  await createAuthSession(user.id, tokens.refreshToken, req);

  // Set auth cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
}


/**
 * Validate and normalize login credentials
 * @throws {AppError} If validation fails
 */
function validateAndNormalizeLoginInput(email: string, password: string): {
  normalizedEmail: string;
} {
  const normalizedEmail = email.toLowerCase().trim();
  
  validateEmail(normalizedEmail);
  
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400);
  }

  return { normalizedEmail };
}

/**
 * Check whether any users exist — used by the frontend to detect first-run state.
 */
export async function checkStatus(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const count = await prisma.user.count();
    res.json({ hasUsers: count > 0 });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new user
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, familyName } = req.body as RegisterRequestBody;

    // Normalize inputs before validation
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFamilyName = familyName.trim();

    // Validate normalized inputs
    validateRegistrationInput(normalizedEmail, password, normalizedFamilyName);

    await ensureUserNotExists(normalizedEmail);

    const passwordHash = await bcrypt.hash(password, 12);

    // Serializable isolation prevents two simultaneous first-time registrations
    // from both seeing count=0 and both receiving the admin role.
    const user = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const role = (await tx.user.count()) === 0 ? UserRole.admin : UserRole.user;
        return tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            familyName: normalizedFamilyName,
            role,
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    );

    logger.info('User registered successfully', {
      userId: user.id,
      emailDomain: maskEmail(user.email)
    });

    // Create initial meal plan for the new user
    await createInitialMealPlan(user.id);

    // Generate auth response with cookies
    await generateAuthResponseWithCookies(user, res, req);

    usersRegisteredTotal.inc();

    res.status(201).json({
      message: 'User registered successfully',
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequestBody;

    // Validate and normalize input
    const { normalizedEmail } = validateAndNormalizeLoginInput(email, password);

    // Authenticate user
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
    );

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    logger.info('User logged in successfully', {
      userId: user.id,
      emailDomain: maskEmail(user.email)
    });

    // Generate auth response with cookies
    await generateAuthResponseWithCookies(user, res, req);

    res.json({
      message: 'Login successful',
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get refresh token from cookie or body
    const token = getRefreshTokenFromRequest(req);

    if (!token || typeof token !== 'string') {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token JWT (validates signature and expiration)
    verifyRefreshToken(token);

    // Find and verify session
    const tokenHash = hashSessionToken(token);
    const session = await withRetry(() =>
      prisma.authSession.findUnique({
        where: { refreshTokenHash: tokenHash },
        include: { user: true },
      })
    );

    if (!session) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (session.revokedAt) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await withRetry(() =>
        prisma.authSession.delete({
          where: { id: session.id },
        })
      );
      throw new AppError('Refresh token expired', 401);
    }

    if (session.user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    // Generate new tokens
    const newTokens = generateTokenPair({
      userId: session.user.id,
      email: session.user.email,
      familyName: session.user.familyName,
      role: session.user.role,
    });

    // Rotate refresh token - delete old session and create new one
    await withRetry(() =>
      prisma.$transaction([
        prisma.authSession.delete({
          where: { id: session.id },
        }),
        prisma.authSession.create({
          data: {
            userId: session.user.id,
            refreshTokenHash: hashSessionToken(newTokens.refreshToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            userAgent: req.headers['user-agent'] || null,
            ipAddress: getClientIp(req) || null,
          },
        }),
      ])
    );

    // Set new auth cookies
    setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      user: formatUserResponse(session.user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    // Get refresh token from cookie or body
    const token = getRefreshTokenFromRequest(req);

    if (token) {
      const tokenHash = hashSessionToken(token);
      
      // Revoke/delete the session
      await withRetry(() =>
        prisma.authSession.deleteMany({
          where: { refreshTokenHash: tokenHash },
        })
      ).catch((error) => {
        // Log but don't fail logout if session deletion fails
        logger.warn('Failed to delete auth session during logout', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }

    // Clear auth cookies
    clearAuthCookies(res);

    logger.info('User logged out', { userId });

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          familyName: true,
          role: true,
          isBlocked: true,
          createdAt: true,
        },
      })
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isBlocked) {
      throw new AppError('Account is blocked', 403);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        familyName: user.familyName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  checkStatus,
  register,
  login,
  refreshToken,
  logout,
  me,
};

// Made with Bob
