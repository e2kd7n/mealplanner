/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  exportFeedback,
  getFeedbackStats,
} from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { feedbackRateLimiter } from '../middleware/rateLimiter';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();

// Public routes (require authentication)
router.post('/', authenticate, feedbackRateLimiter, submitFeedback);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllFeedback);
router.get('/stats', authenticate, requireAdmin, getFeedbackStats);
router.get('/export', authenticate, requireAdmin, exportFeedback);
router.get('/:id', authenticate, requireAdmin, getFeedbackById);
router.patch('/:id', authenticate, requireAdmin, updateFeedbackStatus);

export default router;

// Made with Bob
