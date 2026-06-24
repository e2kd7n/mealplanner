/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.get('/users', listUsers);
router.get('/visual-challenge/:userId', getVisualChallenge);
router.post('/login/visual', visualLogin);
router.post('/login/device', deviceLogin);
router.post('/logout/device', deviceLogout);
router.get('/visual-setup/stock-images', getStockImages);

// ── Authenticated endpoints ───────────────────────────────────────────────
router.get('/visual-password/status', authenticate, getVisualPasswordStatus);
router.post('/visual-password/setup', authenticate, setupVisualPassword);
router.post('/visual-password/setup-stock', authenticate, setupStockVisualPassword);
router.get('/visual-setup/images', authenticate, getVisualSetupImages);

export default router;

// Made with Bob
