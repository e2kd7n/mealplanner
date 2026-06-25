/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getCategories,
  getSearchSuggestions,
  getSimilarIngredients,
  mergeIngredients,
} from '../controllers/ingredient.controller';

const router: Router = Router();

/**
 * @route   GET /api/ingredients/categories
 * @desc    Get all ingredient categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/ingredients/search/suggestions
 * @desc    Get ingredient search suggestions
 * @access  Public
 */
router.get('/search/suggestions', getSearchSuggestions);

/**
 * @route   GET /api/ingredients/similar
 * @desc    Find similar ingredients using trigram fuzzy matching
 * @access  Public
 */
router.get('/similar', getSimilarIngredients);

/**
 * @route   GET /api/ingredients
 * @desc    Get all ingredients with optional filtering
 * @access  Public
 */
router.get('/', getIngredients);

/**
 * @route   GET /api/ingredients/:id
 * @desc    Get ingredient by ID
 * @access  Public
 */
router.get('/:id', getIngredientById);

/**
 * @route   POST /api/ingredients
 * @desc    Create new ingredient (checks for similar ingredients unless force=true)
 * @access  Private (Admin only in production)
 */
router.post('/', optionalAuthenticate, createIngredient);

/**
 * @route   POST /api/ingredients/merge
 * @desc    Merge source ingredient into target (reassigns all references)
 * @access  Private (Admin only)
 */
router.post('/merge', authenticate, requireAdmin, mergeIngredients);

/**
 * @route   PUT /api/ingredients/:id
 * @desc    Update ingredient
 * @access  Private (Admin only in production)
 */
router.put('/:id', optionalAuthenticate, updateIngredient);

/**
 * @route   DELETE /api/ingredients/:id
 * @desc    Delete ingredient
 * @access  Private (Admin only in production)
 */
router.delete('/:id', optionalAuthenticate, deleteIngredient);

export default router;

// Made with Bob
