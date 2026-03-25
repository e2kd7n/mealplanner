/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMealPlans,
  getMealPlanById,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  addMealToPlan,
  updateMeal,
  removeMealFromPlan,
} from '../controllers/mealPlan.controller';
import { generateFromMealPlan } from '../controllers/groceryList.controller';

const router: Router = Router();

// All meal plan routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/meal-plans
 * @desc    Get all meal plans for user
 * @access  Private
 */
router.get('/', getMealPlans);

/**
 * @route   GET /api/meal-plans/:id
 * @desc    Get meal plan by ID
 * @access  Private
 */
router.get('/:id', getMealPlanById);

/**
 * @route   POST /api/meal-plans
 * @desc    Create new meal plan
 * @access  Private
 */
router.post('/', createMealPlan);

/**
 * @route   PUT /api/meal-plans/:id
 * @desc    Update meal plan
 * @access  Private
 */
router.put('/:id', updateMealPlan);

/**
 * @route   DELETE /api/meal-plans/:id
 * @desc    Delete meal plan
 * @access  Private
 */
router.delete('/:id', deleteMealPlan);

/**
 * @route   POST /api/meal-plans/:id/meals
 * @desc    Add meal to meal plan
 * @access  Private
 */
router.post('/:id/meals', addMealToPlan);

/**
 * @route   PUT /api/meal-plans/:planId/meals/:mealId
 * @desc    Update meal in meal plan
 * @access  Private
 */
router.put('/:planId/meals/:mealId', updateMeal);

/**
 * @route   DELETE /api/meal-plans/:planId/meals/:mealId
 * @desc    Remove meal from meal plan
 * @access  Private
 */
router.delete('/:planId/meals/:mealId', removeMealFromPlan);

/**
 * @route   POST /api/meal-plans/:id/generate-grocery-list
 * @desc    Generate grocery list from meal plan
 * @access  Private
 */
router.post('/:id/generate-grocery-list', generateFromMealPlan);

export default router;

// Made with Bob
