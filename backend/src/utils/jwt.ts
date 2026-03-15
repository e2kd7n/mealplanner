/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import jwt from 'jsonwebtoken';
import { logger } from './logger';
import { getJwtConfig } from './secrets';

// Load JWT configuration from secrets
const jwtConfig = getJwtConfig();
const JWT_SECRET = jwtConfig.secret;
const JWT_REFRESH_SECRET = jwtConfig.refreshSecret;
const JWT_EXPIRES_IN = jwtConfig.expiresIn;
const JWT_REFRESH_EXPIRES_IN = jwtConfig.refreshExpiresIn;

export interface TokenPayload {
  userId: string;
  id?: string; // Optional alias for userId for convenience
  email: string;
  familyName: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Access token verification failed:', error);
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};

// Made with Bob
