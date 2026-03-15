-- CreateIndex
CREATE INDEX "grocery_lists_user_id_idx" ON "grocery_lists"("user_id");

-- CreateIndex
CREATE INDEX "grocery_lists_meal_plan_id_idx" ON "grocery_lists"("meal_plan_id");

-- CreateIndex
CREATE INDEX "grocery_lists_status_idx" ON "grocery_lists"("status");

-- CreateIndex
CREATE INDEX "meal_plans_user_id_idx" ON "meal_plans"("user_id");

-- CreateIndex
CREATE INDEX "meal_plans_week_start_date_idx" ON "meal_plans"("week_start_date");

-- CreateIndex
CREATE INDEX "meal_plans_status_idx" ON "meal_plans"("status");

-- CreateIndex
CREATE INDEX "pantry_inventory_user_id_idx" ON "pantry_inventory"("user_id");

-- CreateIndex
CREATE INDEX "pantry_inventory_ingredient_id_idx" ON "pantry_inventory"("ingredient_id");

-- CreateIndex
CREATE INDEX "pantry_inventory_expiration_date_idx" ON "pantry_inventory"("expiration_date");

-- CreateIndex
CREATE INDEX "planned_meals_meal_plan_id_idx" ON "planned_meals"("meal_plan_id");

-- CreateIndex
CREATE INDEX "planned_meals_recipe_id_idx" ON "planned_meals"("recipe_id");

-- CreateIndex
CREATE INDEX "planned_meals_date_idx" ON "planned_meals"("date");

-- CreateIndex
CREATE INDEX "recipe_ratings_recipe_id_idx" ON "recipe_ratings"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ratings_user_id_idx" ON "recipe_ratings"("user_id");

-- CreateIndex
CREATE INDEX "recipe_ratings_rating_idx" ON "recipe_ratings"("rating");

-- CreateIndex
CREATE INDEX "recipes_user_id_idx" ON "recipes"("user_id");

-- CreateIndex
CREATE INDEX "recipes_meal_type_idx" ON "recipes"("meal_type");

-- CreateIndex
CREATE INDEX "recipes_difficulty_idx" ON "recipes"("difficulty");

-- CreateIndex
CREATE INDEX "recipes_cuisine_type_idx" ON "recipes"("cuisine_type");

-- CreateIndex
CREATE INDEX "recipes_kid_friendly_idx" ON "recipes"("kid_friendly");

-- CreateIndex
CREATE INDEX "recipes_is_public_idx" ON "recipes"("is_public");

-- CreateIndex
CREATE INDEX "recipes_created_at_idx" ON "recipes"("created_at");

-- CreateIndex
CREATE INDEX "recipes_title_idx" ON "recipes"("title");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
