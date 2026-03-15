/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPantryItems,
  getPantryItemById,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  consumePantryItem,
  getLowStockItems,
  getExpiringSoonItems,
} from '../controllers/pantry.controller';

const router: Router = Router();

// All pantry routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/pantry/low-stock
 * @desc    Get pantry items that are low on stock
 * @access  Private
 */
router.get('/low-stock', getLowStockItems);

/**
 * @route   GET /api/pantry/expiring-soon
 * @desc    Get pantry items expiring within specified days
 * @access  Private
 */
router.get('/expiring-soon', getExpiringSoonItems);

/**
 * @route   GET /api/pantry
 * @desc    Get all pantry items for user
 * @access  Private
 */
router.get('/', getPantryItems);

/**
 * @route   GET /api/pantry/:id
 * @desc    Get pantry item by ID
 * @access  Private
 */
router.get('/:id', getPantryItemById);

/**
 * @route   POST /api/pantry
 * @desc    Add item to pantry
 * @access  Private
 */
router.post('/', addPantryItem);

/**
 * @route   POST /api/pantry/:id/consume
 * @desc    Consume/reduce quantity of pantry item
 * @access  Private
 */
router.post('/:id/consume', consumePantryItem);

/**
 * @route   PUT /api/pantry/:id
 * @desc    Update pantry item
 * @access  Private
 */
router.put('/:id', updatePantryItem);

/**
 * @route   DELETE /api/pantry/:id
 * @desc    Remove item from pantry
 * @access  Private
 */
router.delete('/:id', deletePantryItem);

export default router;

// Made with Bob
