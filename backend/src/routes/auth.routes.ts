/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validation/schemas';
import { authRateLimiter, registerRateLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

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
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', logout);

export default router;

// Made with Bob
