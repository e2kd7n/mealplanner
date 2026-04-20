/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Create rate limiter with Redis store
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

// Stricter rate limiter for authentication endpoints
// Protects against brute force attacks
// In development/test, use more lenient limits for E2E testing
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TESTING === 'true';
export const authRateLimiter = rateLimit({
  windowMs: isTestEnv ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in test, 15 minutes in production
  max: isTestEnv ? 50 : 5, // 50 attempts in test, 5 in production
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Too many authentication attempts from this IP. Please try again after ${isTestEnv ? '1 minute' : '15 minutes'}.`,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Moderate rate limiter for registration
// Prevents spam account creation
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many accounts created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many registration attempts from this IP. Please try again after 1 hour.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

export default rateLimiter;

// Made with Bob
