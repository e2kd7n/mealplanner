import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', (_req, res) => {
  res.json({ message: 'User profile endpoint - to be implemented' });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', (_req, res) => {
  res.json({ message: 'Update profile endpoint - to be implemented' });
});

export default router;

// Made with Bob
