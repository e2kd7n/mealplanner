import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  blockUser,
  unblockUser,
  deleteUser,
  resetUserPassword,
  getSystemStats,
} from '../controllers/admin.controller';

const router: Router = Router();

// All admin routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/users
 * @desc    List all users with pagination and filtering
 * @access  Admin, SuperAdmin
 */
router.get('/users', requireAdmin, getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get detailed information about a specific user
 * @access  Admin, SuperAdmin
 */
router.get('/users/:id', requireAdmin, getUserById);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update user role (SuperAdmin only)
 * @access  SuperAdmin
 */
router.patch('/users/:id/role', requireSuperAdmin, updateUserRole);

/**
 * @route   POST /api/admin/users/:id/block
 * @desc    Block a user account
 * @access  Admin, SuperAdmin
 */
router.post('/users/:id/block', requireAdmin, blockUser);

/**
 * @route   POST /api/admin/users/:id/unblock
 * @desc    Unblock a user account
 * @access  Admin, SuperAdmin
 */
router.post('/users/:id/unblock', requireAdmin, unblockUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user account (SuperAdmin only)
 * @access  SuperAdmin
 */
router.delete('/users/:id', requireSuperAdmin, deleteUser);

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Reset user password (generates temporary password)
 * @access  Admin, SuperAdmin
 */
router.post('/users/:id/reset-password', requireAdmin, resetUserPassword);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Admin, SuperAdmin
 */
router.get('/stats', requireAdmin, getSystemStats);

export default router;

// Made with Bob
