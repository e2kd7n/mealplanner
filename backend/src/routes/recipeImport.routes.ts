/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../middleware/auth';
import { importFromUrl, saveImportedRecipe } from '../controllers/recipeImport.controller';

const router: RouterType = Router();

/**
 * @route   POST /api/recipes/import/url
 * @desc    Import recipe from URL (returns parsed data for review)
 * @access  Private
 */
router.post('/url', authenticate, importFromUrl);

/**
 * @route   POST /api/recipes/import/url/save
 * @desc    Save imported recipe after user review
 * @access  Private
 */
router.post('/url/save', authenticate, saveImportedRecipe);

export default router;

// Made with Bob
