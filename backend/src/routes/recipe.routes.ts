/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  rateRecipe,
  getRecipeRatings,
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

/**
 * @route   POST /api/recipes/:id/rate
 * @desc    Add or update rating for a recipe
 * @access  Private
 */
router.post('/:id/rate', authenticate, rateRecipe);

/**
 * @route   GET /api/recipes/:id/ratings
 * @desc    Get all ratings for a recipe
 * @access  Public
 */
router.get('/:id/ratings', getRecipeRatings);

export default router;

// Made with Bob
