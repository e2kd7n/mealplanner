-- AlterTable: Convert meal_type to meal_types array
-- Step 1: Add new column as array
ALTER TABLE "recipes" ADD COLUMN "meal_types" "MealType"[];

-- Step 2: Migrate existing data (convert single value to array)
UPDATE "recipes" SET "meal_types" = ARRAY["meal_type"::text]::"MealType"[] WHERE "meal_type" IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE "recipes" DROP COLUMN "meal_type";

-- Step 4: Make new column required (NOT NULL)
ALTER TABLE "recipes" ALTER COLUMN "meal_types" SET NOT NULL;

-- Made with Bob
