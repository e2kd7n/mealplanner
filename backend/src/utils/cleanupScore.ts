/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Calculate cleanup score for a recipe (0-10 scale)
 * Lower score = easier cleanup, Higher score = more cleanup required
 * 
 * Factors considered:
 * - Number of ingredients (more ingredients = more prep bowls/cutting boards)
 * - Number of instruction steps (more steps = more utensils/pans)
 * - Cooking methods (baking < stovetop < frying < multiple methods)
 * - Prep complexity (chopping, mixing, marinating, etc.)
 */

interface RecipeData {
  ingredients: Array<{ quantity: number; unit: string; notes?: string }>;
  instructions: any; // Can be array of strings or objects
  cookTime: number;
  prepTime: number;
}

export function calculateCleanupScore(recipe: RecipeData): number {
  let score = 0;

  // Factor 1: Number of ingredients (0-3 points)
  // More ingredients = more prep containers, cutting boards, measuring tools
  const ingredientCount = recipe.ingredients.length;
  if (ingredientCount <= 5) {
    score += 0.5;
  } else if (ingredientCount <= 10) {
    score += 1.5;
  } else if (ingredientCount <= 15) {
    score += 2.5;
  } else {
    score += 3;
  }

  // Factor 2: Number of instruction steps (0-3 points)
  // More steps = more utensils, bowls, pans
  let stepCount = 0;
  if (Array.isArray(recipe.instructions)) {
    stepCount = recipe.instructions.length;
  } else if (typeof recipe.instructions === 'object' && recipe.instructions.steps) {
    stepCount = recipe.instructions.steps.length;
  }

  if (stepCount <= 3) {
    score += 0.5;
  } else if (stepCount <= 6) {
    score += 1.5;
  } else if (stepCount <= 10) {
    score += 2.5;
  } else {
    score += 3;
  }

  // Factor 3: Cooking method complexity (0-2 points)
  // Analyze instructions for cooking methods
  const instructionText = JSON.stringify(recipe.instructions).toLowerCase();
  
  let methodScore = 0;
  
  // High cleanup methods
  if (instructionText.includes('fry') || instructionText.includes('deep fry')) {
    methodScore += 1; // Oil splatter, multiple pans
  }
  if (instructionText.includes('sauté') || instructionText.includes('stir fry')) {
    methodScore += 0.5;
  }
  if (instructionText.includes('blend') || instructionText.includes('food processor')) {
    methodScore += 0.5; // Blender parts to clean
  }
  if (instructionText.includes('marinate')) {
    methodScore += 0.5; // Extra containers
  }
  
  // Multiple cooking methods
  const methods = ['bake', 'boil', 'grill', 'roast', 'simmer', 'steam'];
  const methodsUsed = methods.filter(method => instructionText.includes(method)).length;
  if (methodsUsed > 1) {
    methodScore += 0.5; // Multiple pans/dishes
  }

  score += Math.min(methodScore, 2);

  // Factor 4: Prep complexity (0-2 points)
  let prepScore = 0;
  
  // Check for complex prep work
  if (instructionText.includes('chop') || instructionText.includes('dice') || instructionText.includes('mince')) {
    prepScore += 0.5; // Cutting board cleanup
  }
  if (instructionText.includes('whisk') || instructionText.includes('beat') || instructionText.includes('mix')) {
    prepScore += 0.5; // Mixing bowls
  }
  if (instructionText.includes('knead') || instructionText.includes('roll out')) {
    prepScore += 0.5; // Dough work = messy
  }
  if (instructionText.includes('strain') || instructionText.includes('drain')) {
    prepScore += 0.5; // Colander/strainer
  }

  score += Math.min(prepScore, 2);

  // Round to nearest 0.5 and cap at 10
  score = Math.round(score * 2) / 2;
  return Math.min(score, 10);
}

/**
 * Get cleanup difficulty label
 */
export function getCleanupLabel(score: number): string {
  if (score <= 2) return 'Minimal';
  if (score <= 4) return 'Easy';
  if (score <= 6) return 'Moderate';
  if (score <= 8) return 'Significant';
  return 'Extensive';
}

/**
 * Get cleanup tips based on score
 */
export function getCleanupTips(score: number): string[] {
  const tips: string[] = [];

  if (score <= 3) {
    tips.push('Quick cleanup - perfect for busy weeknights');
    tips.push('Minimal dishes required');
  } else if (score <= 6) {
    tips.push('Moderate cleanup - plan 10-15 minutes');
    tips.push('Consider prep work ahead of time');
  } else {
    tips.push('Significant cleanup - best for weekends');
    tips.push('Mise en place recommended');
    tips.push('Consider using dishwasher-safe items');
  }

  return tips;
}

// Made with Bob
