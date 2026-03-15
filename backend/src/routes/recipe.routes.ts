import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipe.controller';

const router: Router = Router();

/**
 * @route   GET /api/recipes
 * @desc    Get all recipes
 * @access  Public/Private
 */
router.get('/', optionalAuthenticate, getRecipes);

/**
 * @route   GET /api/recipes/:id
 * @desc    Get recipe by ID
 * @access  Public/Private
 */
router.get('/:id', optionalAuthenticate, getRecipeById);

/**
 * @route   POST /api/recipes
 * @desc    Create new recipe
 * @access  Private
 */
router.post('/', authenticate, createRecipe);

/**
 * @route   PUT /api/recipes/:id
 * @desc    Update recipe
 * @access  Private
 */
router.put('/:id', authenticate, updateRecipe);

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Delete recipe
 * @access  Private
 */
router.delete('/:id', authenticate, deleteRecipe);

export default router;

// Made with Bob
