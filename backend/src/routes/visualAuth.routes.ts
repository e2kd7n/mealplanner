/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  listUsers,
  getVisualChallenge,
  visualLogin,
  deviceLogin,
  setupVisualPassword,
  setupStockVisualPassword,
  getVisualPasswordStatus,
  deviceLogout,
  getVisualSetupImages,
  getStockImages,
} from '../controllers/visualAuth.controller';

const router: Router = Router();

// ── Public endpoints (no auth required — local network convenience) ────────
// authRateLimiter (5 attempts/15 min in production) applies to all of these:
// the visual-password challenge/response is a low-entropy factor (1-of-4, or
// 1-of-8 for stock images) that's otherwise trivially brute-forceable without
// throttling — see the security audit that added this.
router.get('/users', authRateLimiter, listUsers);
router.get('/visual-challenge/:userId', authRateLimiter, getVisualChallenge);
router.post('/login/visual', authRateLimiter, visualLogin);
router.post('/login/device', authRateLimiter, deviceLogin);
router.post('/logout/device', deviceLogout);
router.get('/visual-setup/stock-images', authRateLimiter, getStockImages);

// ── Authenticated endpoints ───────────────────────────────────────────────
router.get('/visual-password/status', authenticate, getVisualPasswordStatus);
router.post('/visual-password/setup', authenticate, setupVisualPassword);
router.post('/visual-password/setup-stock', authenticate, setupStockVisualPassword);
router.get('/visual-setup/images', authenticate, getVisualSetupImages);

export default router;

// Made with Bob
