import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth';
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getCategories,
  getSearchSuggestions,
} from '../controllers/ingredient.controller';

const router = Router();

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
 * @desc    Create new ingredient
 * @access  Private (Admin only in production)
 */
router.post('/', optionalAuthenticate, createIngredient);

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
