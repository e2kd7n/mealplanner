/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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
 * Validate password strength based on configurable policy
 */
function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400);
  }
  
  // Check minimum length
  if (password.length < PASSWORD_POLICY.minLength) {
    throw new AppError(
      `Password must be at least ${PASSWORD_POLICY.minLength} characters long`,
      400
    );
  }
  
  // Check maximum length
  if (password.length > PASSWORD_POLICY.maxLength) {
    throw new AppError(
      `Password must not exceed ${PASSWORD_POLICY.maxLength} characters`,
      400
    );
  }
  
  // Count character types
  const counts = countCharacterTypes(password);
  
  // Validate uppercase requirement
  if (PASSWORD_POLICY.requireUppercase && counts.uppercase < PASSWORD_POLICY.minUppercase) {
    throw new AppError(
      `Password must contain at least ${PASSWORD_POLICY.minUppercase} uppercase letter${PASSWORD_POLICY.minUppercase > 1 ? 's' : ''}`,
      400
    );
  }
  
  // Validate lowercase requirement
  if (PASSWORD_POLICY.requireLowercase && counts.lowercase < PASSWORD_POLICY.minLowercase) {
    throw new AppError(
      `Password must contain at least ${PASSWORD_POLICY.minLowercase} lowercase letter${PASSWORD_POLICY.minLowercase > 1 ? 's' : ''}`,
      400
    );
  }
  
  // Validate number requirement
  if (PASSWORD_POLICY.requireNumber && counts.numbers < PASSWORD_POLICY.minNumbers) {
    throw new AppError(
      `Password must contain at least ${PASSWORD_POLICY.minNumbers} number${PASSWORD_POLICY.minNumbers > 1 ? 's' : ''}`,
      400
    );
  }
  
  // Validate special character requirement
  if (PASSWORD_POLICY.requireSpecial && counts.special < PASSWORD_POLICY.minSpecial) {
    throw new AppError(
      `Password must contain at least ${PASSWORD_POLICY.minSpecial} special character${PASSWORD_POLICY.minSpecial > 1 ? 's' : ''} (!@#$%^&*()_+-=[]{}|;:,.<>?)`,
      400
    );
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
 * Register a new user
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, familyName } = req.body as RegisterRequestBody;

    // Validate input
    validateRegistrationInput(email, password, familyName);

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        familyName: familyName.trim(),
      },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      familyName: user.familyName,
    });

    logger.info('User registered successfully', {
      userId: user.id,
      emailDomain: maskEmail(user.email)
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: formatUserResponse(user),
      ...tokens,
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

    // Validate input
    validateEmail(email);
    
    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400);
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      familyName: user.familyName,
    });

    logger.info('User logged in successfully', {
      userId: user.id,
      emailDomain: maskEmail(user.email)
    });

    res.json({
      message: 'Login successful',
      user: formatUserResponse(user),
      ...tokens,
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
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      familyName: user.familyName,
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
