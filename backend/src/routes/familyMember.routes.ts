/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getFamilyMembers,
  getFamilyMemberById,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from '../controllers/familyMember.controller';

const router: Router = Router();

// All family member routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/family-members
 * @desc    Get all family members
 * @access  Private
 */
router.get('/', getFamilyMembers);

/**
 * @route   GET /api/family-members/:id
 * @desc    Get family member by ID
 * @access  Private
 */
router.get('/:id', getFamilyMemberById);

/**
 * @route   POST /api/family-members
 * @desc    Add new family member
 * @access  Private
 */
router.post('/', createFamilyMember);

/**
 * @route   PUT /api/family-members/:id
 * @desc    Update family member
 * @access  Private
 */
router.put('/:id', updateFamilyMember);

/**
 * @route   DELETE /api/family-members/:id
 * @desc    Remove family member
 * @access  Private
 */
router.delete('/:id', deleteFamilyMember);

export default router;

// Made with Bob