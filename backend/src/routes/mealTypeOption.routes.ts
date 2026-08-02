/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import {
  getMealTypeOptions,
  createMealTypeOption,
  updateMealTypeOption,
  deleteMealTypeOption,
} from '../controllers/mealTypeOption.controller';

const router: Router = Router();

/**
 * @route   GET /api/meal-type-options
 * @desc    List meal type categories
 * @access  Public/Private
 */
router.get('/', optionalAuthenticate, getMealTypeOptions);

/**
 * @route   POST /api/meal-type-options
 * @desc    Create a meal type category
 * @access  Private
 */
router.post('/', authenticate, createMealTypeOption);

/**
 * @route   PUT /api/meal-type-options/:id
 * @desc    Rename/reorder a meal type category
 * @access  Private
 */
router.put('/:id', authenticate, updateMealTypeOption);

/**
 * @route   DELETE /api/meal-type-options/:id
 * @desc    Delete a meal type category
 * @access  Private
 */
router.delete('/:id', authenticate, deleteMealTypeOption);

export default router;
