/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * CSRF Protection Middleware
 * 
 * Protects against Cross-Site Request Forgery attacks by requiring
 * a valid CSRF token for state-changing operations (POST, PUT, DELETE, PATCH).
 * 
 * Security Features:
 * - Double-submit cookie pattern
 * - Secure cookie settings in production
 * - SameSite protection
 * - Token validation on all state-changing requests
 */

// Configure CSRF protection
const csrfProtection: any = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  // Ignore CSRF for GET, HEAD, OPTIONS (safe methods)
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  // Accept CSRF token from X-CSRF-Token header (frontend sends this)
  value: (req: Request) => {
    return req.headers['x-csrf-token'] as string ||
           req.body?._csrf ||
           req.query?._csrf as string;
  },
});

/**
 * CSRF token endpoint handler
 * Provides CSRF token to clients for subsequent requests
 */
function getCsrfToken(req: Request, res: Response): void {
  res.json({
    csrfToken: req.csrfToken(),
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
export { csrfProtection, conditionalCsrfProtection, getCsrfToken, csrfErrorHandler };

// Made with Bob