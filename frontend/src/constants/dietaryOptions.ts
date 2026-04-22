/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Dietary preferences and restrictions
 */
export const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher',
] as const;

/**
 * Common food allergens (FDA-recognized major allergens)
 * These require special handling and warnings
 */
export const COMMON_ALLERGENS = [
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soybeans',
  'Sesame',
] as const;

/**
 * Combined list of all dietary options
 */
export const ALL_DIETARY_OPTIONS = [
  ...DIETARY_PREFERENCES,
  ...COMMON_ALLERGENS,
] as const;

/**
 * Check if a dietary restriction is an allergen
 */
export function isAllergen(restriction: string): boolean {
  return COMMON_ALLERGENS.includes(restriction as any);
}

/**
 * Get display label for dietary option with allergen indicator
 */
export function getDietaryLabel(option: string): string {
  if (isAllergen(option)) {
    return `⚠️ ${option} Allergy`;
  }
  return option;
}

// Made with Bob
