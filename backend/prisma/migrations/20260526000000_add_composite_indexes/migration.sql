-- CreateIndex: composite index for checking if a user has rated a recipe
CREATE INDEX "recipe_ratings_recipe_id_user_id_idx" ON "recipe_ratings"("recipe_id", "user_id");

-- CreateIndex: composite index for expiring-soon pantry queries filtered by user
CREATE INDEX "pantry_inventory_user_id_expiration_date_idx" ON "pantry_inventory"("user_id", "expiration_date");

-- CreateIndex: composite index for date-range queries within a meal plan
CREATE INDEX "planned_meals_meal_plan_id_date_idx" ON "planned_meals"("meal_plan_id", "date");
