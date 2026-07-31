/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { randomUUID } from 'crypto';
import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getSessionSecret } from '../utils/secrets';

/**
 * CSRF Protection Middleware
 *
 * Protects against Cross-Site Request Forgery attacks by requiring
 * a valid CSRF token for state-changing operations (POST, PUT, DELETE, PATCH).
 *
 * Uses csrf-csrf's signed double-submit cookie pattern rather than the
 * deprecated/archived `csurf` package. The app has no server-side session
 * store (auth is JWT-in-header, not cookie-based), so csrf-csrf's required
 * `getSessionIdentifier` is satisfied by an anonymous per-browser identifier
 * cookie (`ensureCsrfSessionId` below) rather than a real session id.
 */

const CSRF_SESSION_COOKIE = 'csrf-session-id';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict' as const,
  path: '/',
};

/**
 * Ensures every client has a stable anonymous identifier cookie, used only
 * to bind CSRF tokens to a browser (not real session/auth state). Mutates
 * `req.cookies` directly so a freshly-issued id is visible to the CSRF
 * middleware within the same request, before the Set-Cookie header takes
 * effect on the client's next request.
 */
function ensureCsrfSessionId(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies?.[CSRF_SESSION_COOKIE]) {
    const sessionId = randomUUID();
    res.cookie(CSRF_SESSION_COOKIE, sessionId, cookieOptions);
    req.cookies[CSRF_SESSION_COOKIE] = sessionId;
  }
  next();
}

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => getSessionSecret(),
  getSessionIdentifier: (req: Request) => req.cookies?.[CSRF_SESSION_COOKIE] ?? '',
  cookieName: 'csrf-token',
  cookieOptions,
  // Accept CSRF token from X-CSRF-Token header (frontend sends this)
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
  // Ignore CSRF for GET, HEAD, OPTIONS (safe methods)
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Alias kept for parity with the previous csurf-based export name.
const csrfProtection = doubleCsrfProtection;

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
  if (err.code === 'EBADCSRFTOKEN') {
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
  // The endpoint still needs the middleware to generate tokens, but shouldn't validate them
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
  csrfProtection(req, res, next);
}

// Export individual functions (no default export to avoid type inference issues)
export { ensureCsrfSessionId, csrfProtection, conditionalCsrfProtection, getCsrfToken, csrfErrorHandler };

// Made with Bob
