import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  getSettings,
  updateSetting,
  getSetupStatus,
  testSpoonacularKey,
} from '../controllers/appSettings.controller';

const router: Router = Router();

// Public — returns { ftueComplete, isAdmin } (isAdmin requires valid JWT, falls back to false)
router.get('/status', (req, res, next) => {
  // Attempt auth but don't fail if no token
  authenticate(req, res, (err) => {
    if (err) {
      // Ignore auth errors — just means user isn't logged in
      (req as any).user = undefined;
    }
    next();
  });
}, getSetupStatus);

// Admin-only settings management
router.get('/', authenticate, requireAdmin, getSettings);
router.put('/:key', authenticate, requireAdmin, updateSetting);
router.post('/test/spoonacular', authenticate, requireAdmin, testSpoonacularKey);

export default router;
