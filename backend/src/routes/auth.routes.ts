/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Router } from 'express';
import { checkStatus, register, login, refreshToken, logout, me } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validation/schemas';
import { authRateLimiter, registerRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * @route   GET /api/auth/status
 * @desc    Check whether any users exist (first-run detection)
 * @access  Public
 */
router.get('/status', checkStatus);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerRateLimiter, validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimiter, validate(loginSchema), login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token (cookie or body)
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, me);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;

// Made with Bob
