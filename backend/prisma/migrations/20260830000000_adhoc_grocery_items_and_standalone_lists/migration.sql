-- Issue #357: ad-hoc/custom grocery item entry + standalone (non-meal-plan) grocery lists.
-- See docs/design/proposals/357-adhoc-grocery-item-entry/DATA_MODEL.md for the full design.

-- New category for ad-hoc/non-food grocery items (paper towels, batteries, etc).
ALTER TYPE "IngredientCategory" ADD VALUE 'household';

-- Grocery lists no longer require a source meal plan (standalone lists).
ALTER TABLE "grocery_lists" ALTER COLUMN "meal_plan_id" DROP NOT NULL;
ALTER TABLE "grocery_lists" ADD COLUMN "name" TEXT;

-- Backstop against duplicate item rows for the same ingredient+unit on one list.
-- generateFromMealPlan already dedupes at this exact granularity within itself
-- (see getIngredientKey in groceryList.controller.ts), so this should never
-- actually reject that path — it's a safety net, not a behavior change there.
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_grocery_list_id_ingredient_id_unit_key"
  UNIQUE ("grocery_list_id", "ingredient_id", "unit");
