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
  getLogFileStats,
  triggerLogPruning,
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

/**
 * GET /api/logs/file-stats
 * Get log file and database statistics (admin only)
 */
router.get(
  '/file-stats',
  authenticate,
  requireAdmin,
  getLogFileStats
);

/**
 * POST /api/logs/prune
 * Manually trigger log pruning (admin only)
 */
router.post(
  '/prune',
  authenticate,
  requireAdmin,
  triggerLogPruning
);

export default router;

// Made with Bob