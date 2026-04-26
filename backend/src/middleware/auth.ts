/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('No authorization header provided', 401);
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization header format', 401);
    }

    const token = parts[1];

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request with both userId and id for compatibility
    req.user = {
      ...payload,
      id: payload.userId, // Add id as an alias for userId
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const payload = verifyAccessToken(token);
        // Attach user to request with both userId and id for compatibility
        req.user = {
          ...payload,
          id: payload.userId, // Add id as an alias for userId
        };
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new AppError('Admin access required', 403);
  }

  next();
}

export default { authenticate, optionalAuthenticate, requireAdmin };

// Made with Bob
