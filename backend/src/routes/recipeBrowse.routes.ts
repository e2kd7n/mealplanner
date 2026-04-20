/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  searchRecipes,
  getRecipeDetails,
  addToRecipeBox,
} from '../controllers/recipeBrowse.controller';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// Search recipes from Spoonacular
router.get('/search', searchRecipes);

// Get recipe details from Spoonacular
router.get('/:id', getRecipeDetails);

// Add Spoonacular recipe to user's recipe box
router.post('/:id/add-to-box', addToRecipeBox);

export default router;

// Made with Bob