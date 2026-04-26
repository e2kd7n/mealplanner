/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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

interface RefreshTokenRequestBody {
  refreshToken: string;
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
    special: (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length,
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
function formatUserResponse(user: { id: string; email: string; familyName: string }) {
  return {
    id: user.id,
    email: user.email,
    familyName: user.familyName,
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
 * Find user by email and verify password
 * @throws {AppError} If user not found or password invalid
 */
async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  return user;
}

/**
 * Generate authentication response with tokens
 */
function generateAuthResponse(user: { id: string; email: string; familyName: string; role: string }) {
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    familyName: user.familyName,
    role: user.role,
  });

  return {
    user: formatUserResponse(user),
    ...tokens,
  };
}

/**
 * Find user by ID and ensure they exist
 * @throws {AppError} If user not found
 */
async function findUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
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

    // Check if user already exists
    await ensureUserNotExists(normalizedEmail);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        familyName: normalizedFamilyName,
      },
    });

    logger.info('User registered successfully', {
      userId: user.id,
      emailDomain: maskEmail(user.email)
    });

    // Create initial meal plan for the new user
    await createInitialMealPlan(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      ...generateAuthResponse(user),
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
    const user = await authenticateUser(normalizedEmail, password);

    logger.info('User logged in successfully', {
      userId: user.id,
      emailDomain: maskEmail(user.email)
    });

    res.json({
      message: 'Login successful',
      ...generateAuthResponse(user),
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
    const { refreshToken: token } = req.body as RefreshTokenRequestBody;

    if (!token || typeof token !== 'string') {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(token);

    // Verify user still exists
    const user = await findUserById(payload.userId);

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      familyName: user.familyName,
      role: user.role,
    });

    res.json({
      message: 'Token refreshed successfully',
      ...tokens,
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
    // In a more complex implementation, you would:
    // 1. Blacklist the token in Redis
    // 2. Clear any session data
    // For now, we'll just return success
    // The client should delete the tokens

    logger.info('User logged out', { userId: req.user?.userId });

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  refreshToken,
  logout,
};

// Made with Bob
