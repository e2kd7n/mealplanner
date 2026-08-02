-- Issue #327: make Recipe.mealTypes a user-editable set of categories
-- instead of a fixed enum.
--
-- Recipe.meal_types moves from MealType[] (enum array) to TEXT[] so it's
-- no longer constrained to the fixed enum, while keeping the same
-- array-based storage (existing `{ has: mealType }` style filters keep
-- working unchanged). PlannedMeal.meal_type is untouched — it still uses
-- the MealType enum, since that's the weekly planner's day/slot
-- structure, a different concept from a recipe's category tags.
--
-- Hand-written rather than `prisma migrate dev`-generated: the auto-diff
-- also wanted to drop every FK constraint in the database (pre-existing
-- drift between the schema's `relationMode = "prisma"` and FK constraints
-- that earlier migrations actually created at the DB level). That's an
-- unrelated, unreviewed, and risky change — out of scope here.

-- CreateTable
CREATE TABLE "meal_type_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_type_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meal_type_options_name_key" ON "meal_type_options"("name");

-- Seed the options table with the values the fixed enum used to offer, so
-- existing recipes' values stay valid and the settings UI starts populated.
INSERT INTO "meal_type_options" ("id", "name", "sort_order", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 'breakfast', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'lunch', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'dinner', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'snack', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'dessert', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: MealType[] -> TEXT[], preserving existing data via direct cast.
ALTER TABLE "recipes"
    ALTER COLUMN "meal_types" TYPE TEXT[] USING ("meal_types"::text[]);
