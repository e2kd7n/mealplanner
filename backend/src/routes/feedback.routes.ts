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
import { feedbackRateLimiter } from '../middleware/rateLimiter';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();

// Public routes (require authentication)
router.post('/', authenticate, feedbackRateLimiter, submitFeedback);

// Admin routes
router.get('/', authenticate, getAllFeedback);
router.get('/stats', authenticate, getFeedbackStats);
router.get('/export', authenticate, exportFeedback);
router.get('/:id', authenticate, getFeedbackById);
router.patch('/:id', authenticate, updateFeedbackStatus);

export default router;

// Made with Bob
