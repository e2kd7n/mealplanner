/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import {
  storeClientLogs,
  getClientLogs,
  getLogStats,
  deleteOldLogs,
} from '../controllers/logs.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { clientLogsRateLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

/**
 * POST /api/logs/client
 * Store client-side logs (batched)
 * Public endpoint with rate limiting
 */
router.post(
  '/client',
  clientLogsRateLimiter, // Stricter rate limit for logging
  storeClientLogs
);

/**
 * GET /api/logs/client
 * Get client logs (admin only)
 */
router.get(
  '/client',
  authenticate,
  requireAdmin,
  getClientLogs
);

/**
 * GET /api/logs/stats
 * Get log statistics (admin only)
 */
router.get(
  '/stats',
  authenticate,
  requireAdmin,
  getLogStats
);

/**
 * DELETE /api/logs/old
 * Delete old logs (admin only)
 */
router.delete(
  '/old',
  authenticate,
  requireAdmin,
  deleteOldLogs
);

export default router;

// Made with Bob