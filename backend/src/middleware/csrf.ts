/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getSessionSecret } from '../utils/secrets';
import { getAccessTokenFromRequest, hashSessionToken } from '../utils/authCookies';

/**
 * CSRF Protection Middleware
 *
 * Protects against Cross-Site Request Forgery attacks by requiring
 * a valid CSRF token for state-changing operations (POST, PUT, DELETE, PATCH).
 *
 * Security Features:
 * - Signed double-submit cookie pattern (csrf-csrf)
 * - Secure cookie settings in production
 * - SameSite protection
 * - Token bound to the caller's access token, so a token generated for one
 *   session can't be replayed by another
 */

// Configure CSRF protection
const { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError } = doubleCsrf({
  getSecret: () => getSessionSecret(),
  // Binds the CSRF token to the caller's access token (cookie or Authorization
  // header — see getAccessTokenFromRequest). Falls back to a constant for
  // unauthenticated callers; safe because CSRF is never enforced on /auth/*
  // routes (see conditionalCsrfProtection below), and every other protected
  // route requires a valid access token anyway.
  getSessionIdentifier: (req: Request) => hashSessionToken(getAccessTokenFromRequest(req) || 'anonymous'),
  cookieName: 'mealplanner_csrf',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    path: '/',
  },
  // Ignore CSRF for GET, HEAD, OPTIONS (safe methods)
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  // Accept CSRF token from X-CSRF-Token header (frontend sends this)
  getCsrfTokenFromRequest: (req: Request) => {
    return (req.headers['x-csrf-token'] as string) ||
           req.body?._csrf ||
           (req.query?._csrf as string);
  },
});

/**
 * CSRF token endpoint handler
 * Provides CSRF token to clients for subsequent requests
 */
function getCsrfToken(req: Request, res: Response): void {
  res.json({
    csrfToken: generateCsrfToken(req, res),
  });
}

/**
 * CSRF error handler
 * Provides user-friendly error messages for CSRF failures
 */
function csrfErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err === invalidCsrfTokenError || err?.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(403).json({
      code: 'EBADCSRFTOKEN',
      error: 'Invalid CSRF Token',
      message: 'Your session has expired or the request is invalid. Please refresh the page and try again.',
    });
  } else {
    next(err);
  }
}

/**
 * Conditional CSRF protection
 * Skips CSRF for certain endpoints that use alternative protection
 */
function conditionalCsrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip CSRF for health checks and metrics
  if (req.path === '/health' || req.path === '/health/live' || req.path === '/metrics') {
    return next();
  }

  // Skip CSRF validation for the token endpoint itself (it generates tokens)
  // Note: Endpoint is mounted at /api/csrf-token, so check for that path
  if (req.path === '/csrf-token' || req.path === '/api/csrf-token') {
    return next();
  }

  // Skip CSRF for auth endpoints that use rate limiting as primary protection
  // Note: This is a trade-off. For maximum security, enable CSRF on auth too.
  // When mounted at /api/, the path will be /auth/... not /api/auth/...
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  // Apply CSRF protection to all other routes
  doubleCsrfProtection(req, res, next);
}

// Export individual functions (no default export to avoid type inference issues)
export { doubleCsrfProtection, conditionalCsrfProtection, getCsrfToken, csrfErrorHandler };
