import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getGroceryLists,
  getGroceryListById,
  createGroceryList,
  generateFromMealPlan,
  updateGroceryList,
  deleteGroceryList,
  addItemToList,
  updateListItem,
  removeItemFromList,
} from '../controllers/groceryList.controller';

const router = Router();

// All grocery list routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/grocery-lists
 * @desc    Get all grocery lists for user
 * @access  Private
 */
router.get('/', getGroceryLists);

/**
 * @route   GET /api/grocery-lists/:id
 * @desc    Get grocery list by ID
 * @access  Private
 */
router.get('/:id', getGroceryListById);

/**
 * @route   POST /api/grocery-lists
 * @desc    Create new grocery list
 * @access  Private
 */
router.post('/', createGroceryList);

/**
 * @route   POST /api/grocery-lists/from-meal-plan/:mealPlanId
 * @desc    Generate grocery list from meal plan
 * @access  Private
 */
router.post('/from-meal-plan/:mealPlanId', generateFromMealPlan);

/**
 * @route   PUT /api/grocery-lists/:id
 * @desc    Update grocery list
 * @access  Private
 */
router.put('/:id', updateGroceryList);

/**
 * @route   DELETE /api/grocery-lists/:id
 * @desc    Delete grocery list
 * @access  Private
 */
router.delete('/:id', deleteGroceryList);

/**
 * @route   POST /api/grocery-lists/:id/items
 * @desc    Add item to grocery list
 * @access  Private
 */
router.post('/:id/items', addItemToList);

/**
 * @route   PUT /api/grocery-lists/:listId/items/:itemId
 * @desc    Update grocery list item
 * @access  Private
 */
router.put('/:listId/items/:itemId', updateListItem);

/**
 * @route   DELETE /api/grocery-lists/:listId/items/:itemId
 * @desc    Remove item from grocery list
 * @access  Private
 */
router.delete('/:listId/items/:itemId', removeItemFromList);

export default router;

// Made with Bob
