/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import jwt from 'jsonwebtoken';
import { logger } from './logger';
import { getJwtConfig, getSecretVersioned } from './secrets';

/**
 * JWT Utility - Enhanced Security Edition
 * 
 * Features:
 * - Lazy loading of JWT secrets with caching
 * - Secret rotation support with graceful fallback
 * - Secure token generation and verification
 * - Cache TTL to allow secret updates without restart
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

interface JwtConfigCache {
  config: ReturnType<typeof getJwtConfig>;
  timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Cache TTL for JWT configuration (5 minutes)
 * This allows secret rotation without application restart
 */
const JWT_CONFIG_CACHE_TTL = 5 * 60 * 1000;

/**
 * Cached JWT configuration
 */
let cachedJwtConfig: JwtConfigCache | null = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get JWT configuration with caching and TTL
 * This allows secrets to be rotated without restarting the application
 */
function getJwtConfigCached(): ReturnType<typeof getJwtConfig> {
  const now = Date.now();
  
  if (!cachedJwtConfig || (now - cachedJwtConfig.timestamp) > JWT_CONFIG_CACHE_TTL) {
    cachedJwtConfig = {
      config: getJwtConfig(),
      timestamp: now,
    };
    logger.debug('JWT configuration refreshed from secrets');
  }
  
  return cachedJwtConfig.config;
}

/**
 * Clear JWT configuration cache
 * Useful for testing or forcing immediate secret refresh
 */
export function clearJwtConfigCache(): void {
  cachedJwtConfig = null;
  logger.info('JWT configuration cache cleared');
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate access token
 * Uses cached configuration with TTL for secret rotation support
 */
export function generateAccessToken(payload: TokenPayload): string {
  const config = getJwtConfigCached();
  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn as any,
  });
}

/**
 * Generate refresh token
 * Uses cached configuration with TTL for secret rotation support
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const config = getJwtConfigCached();
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn as any,
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

// ============================================================================
// TOKEN VERIFICATION WITH ROTATION SUPPORT
// ============================================================================

/**
 * Verify access token with rotation support
 * 
 * This function supports zero-downtime secret rotation by:
 * 1. First trying to verify with the current secret
 * 2. If that fails and a previous secret exists, trying with that
 * 3. This allows tokens signed with the old secret to remain valid during rotation
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    // Try with current secret first
    const config = getJwtConfigCached();
    return jwt.verify(token, config.secret) as TokenPayload;
  } catch (currentError: any) {
    // Don't log expired tokens as errors - they're expected
    const isExpired = currentError?.name === 'TokenExpiredError';
    
    // If current secret fails, try with versioned secrets (rotation support)
    try {
      const versionedSecret = getSecretVersioned('jwt_secret');
      
      if (versionedSecret.previous) {
        try {
          const payload = jwt.verify(token, versionedSecret.previous) as TokenPayload;
          logger.info('Access token verified with previous secret (rotation in progress)');
          return payload;
        } catch (previousError: any) {
          // Both current and previous failed
          if (!isExpired && previousError?.name !== 'TokenExpiredError') {
            logger.error('Access token verification failed with both current and previous secrets');
          }
          throw currentError; // Throw original error to preserve error type
        }
      }
    } catch (versionError) {
      // Versioned secret loading failed, fall through to original error
      logger.debug('Could not load versioned secrets for rotation support');
    }
    
    // No previous secret or it also failed
    // Only log non-expired token errors
    if (!isExpired) {
      logger.error('Access token verification failed:', currentError);
    }
    throw currentError; // Throw original error to preserve error type
  }
}

/**
 * Verify refresh token with rotation support
 * 
 * This function supports zero-downtime secret rotation by:
 * 1. First trying to verify with the current secret
 * 2. If that fails and a previous secret exists, trying with that
 * 3. This allows tokens signed with the old secret to remain valid during rotation
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    // Try with current secret first
    const config = getJwtConfigCached();
    return jwt.verify(token, config.refreshSecret) as TokenPayload;
  } catch (currentError: any) {
    // Don't log expired tokens as errors - they're expected
    const isExpired = currentError?.name === 'TokenExpiredError';
    
    // If current secret fails, try with versioned secrets (rotation support)
    try {
      const versionedSecret = getSecretVersioned('jwt_refresh_secret');
      
      if (versionedSecret.previous) {
        try {
          const payload = jwt.verify(token, versionedSecret.previous) as TokenPayload;
          logger.info('Refresh token verified with previous secret (rotation in progress)');
          return payload;
        } catch (previousError: any) {
          // Both current and previous failed
          if (!isExpired && previousError?.name !== 'TokenExpiredError') {
            logger.error('Refresh token verification failed with both current and previous secrets');
          }
          throw currentError; // Throw original error to preserve error type
        }
      }
    } catch (versionError) {
      // Versioned secret loading failed, fall through to original error
      logger.debug('Could not load versioned secrets for rotation support');
    }
    
    // No previous secret or it also failed
    // Only log non-expired token errors
    if (!isExpired) {
      logger.error('Refresh token verification failed:', currentError);
    }
    throw currentError; // Throw original error to preserve error type
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decode token without verification (for debugging)
 * WARNING: This does not verify the token signature!
 * Only use for debugging or extracting claims from trusted tokens
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

/**
 * Get token expiration time
 * Returns null if token is invalid or has no expiration
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    logger.error('Failed to decode token for expiration:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * Returns true if expired, false if valid, null if cannot determine
 */
export function isTokenExpired(token: string): boolean | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }
  return expiration < new Date();
}

/**
 * Get time until token expiration in milliseconds
 * Returns null if token is invalid or has no expiration
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }
  return expiration.getTime() - Date.now();
}

// Export default object with all functions
export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  getTimeUntilExpiration,
  clearJwtConfigCache,
};

// Made with Bob
