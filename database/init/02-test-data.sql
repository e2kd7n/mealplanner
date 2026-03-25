-- Test User and Family Data
-- This script creates a dedicated test user for development and testing
-- IMPORTANT: Never modify or add test data to the production "e2kd7n" user

-- Delete existing test data if it exists (in reverse order of dependencies)
-- First, find the user IDs by email
DO $$
DECLARE
  test_user_id TEXT;
  test_admin_id TEXT;
BEGIN
  SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com';
  SELECT id INTO test_admin_id FROM users WHERE email = 'testadmin@example.com';
  
  IF test_user_id IS NOT NULL OR test_admin_id IS NOT NULL THEN
    DELETE FROM user_preferences WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM pantry_inventory WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM grocery_list_items WHERE grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id IN (test_user_id, test_admin_id));
    DELETE FROM grocery_lists WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM planned_meals WHERE meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id IN (test_user_id, test_admin_id));
    DELETE FROM meal_plans WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM recipe_ratings WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id IN (test_user_id, test_admin_id));
    DELETE FROM recipes WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM family_members WHERE user_id IN (test_user_id, test_admin_id);
    DELETE FROM users WHERE id IN (test_user_id, test_admin_id);
  END IF;
END $$;

-- Create test user (password: TestPass123!)
-- Password hash for "TestPass123!" using bcrypt
INSERT INTO users (id, email, password_hash, family_name, role, is_blocked, created_at, updated_at)
VALUES (
  'test-user-00-0000-0000-000000000001',
  'test@example.com',
  '$2b$10$Nn81.qmzZbcN04N7PjLZU.CXTkUSuOHMMlP1sZMTFAvRpqDGVXNeK',
  'Test Family',
  'user',
  false,
  NOW(),
  NOW()
);

-- Create test admin user (password: AdminPass123!)
INSERT INTO users (id, email, password_hash, family_name, role, is_blocked, created_at, updated_at)
VALUES (
  'test-admin-0-0000-0000-000000000002',
  'testadmin@example.com',
  '$2b$10$osEnHDBuK3OkIQtZJgCL/.lHUo26a6IWnfnzGh07dV4KGwygUx2dG',
  'Test Admin Family',
  'admin',
  false,
  NOW(),
  NOW()
);

-- Create user preferences for test user
INSERT INTO user_preferences (id, user_id, weekly_budget, preferred_cuisines, cooking_skill_level, max_prep_time_weeknight, max_prep_time_weekend, dietary_preferences, notification_settings)
VALUES (
  'test-pref-0-0000-0000-000000000001',
  'test-user-00-0000-0000-000000000001',
  100.00,
  ARRAY['Italian', 'Mexican']::text[],
  'intermediate',
  45,
  90,
  '{"vegetarian": true, "vegan": false, "glutenFree": false}'::jsonb,
  '{"email": true, "push": false}'::jsonb
);

-- Create family members for test user
INSERT INTO family_members (id, user_id, name, age_group, can_cook, dietary_restrictions, created_at)
VALUES
  (
    'test-member-0000-0000-000000000001',
    'test-user-00-0000-0000-000000000001',
    'Test Child',
    'child',
    false,
    '{"allergies": ["peanuts"], "favoriteFoods": ["pizza", "pasta"], "dislikedFoods": ["broccoli"]}'::jsonb,
    NOW()
  ),
  (
    'test-member-0000-0000-000000000002',
    'test-user-00-0000-0000-000000000001',
    'Test Teen',
    'teen',
    true,
    '{"allergies": [], "favoriteFoods": ["burgers", "tacos"], "dislikedFoods": ["mushrooms"]}'::jsonb,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample ingredients (if not already present)
INSERT INTO ingredients (id, name, category, seasonal_months, average_price, unit, allergens, created_at)
VALUES
  ('ing-00000000-0000-0000-000000000001', 'Tomato', 'produce', ARRAY[5,6,7,8,9], 2.50, 'lb', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000002', 'Onion', 'produce', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 1.50, 'lb', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000003', 'Garlic', 'produce', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 3.00, 'lb', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000004', 'Chicken Breast', 'protein', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 5.99, 'lb', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000005', 'Ground Beef', 'protein', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 4.99, 'lb', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000006', 'Pasta', 'grains', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 1.99, 'lb', ARRAY['gluten']::text[], NOW()),
  ('ing-00000000-0000-0000-000000000007', 'Rice', 'grains', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 2.50, 'lb', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000008', 'Olive Oil', 'pantry', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 8.99, 'bottle', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000009', 'Salt', 'spices', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 1.50, 'container', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000010', 'Black Pepper', 'spices', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 3.50, 'container', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000011', 'Milk', 'dairy', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 3.99, 'gallon', ARRAY['dairy']::text[], NOW()),
  ('ing-00000000-0000-0000-000000000012', 'Cheese', 'dairy', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 5.99, 'lb', ARRAY['dairy']::text[], NOW()),
  ('ing-00000000-0000-0000-000000000013', 'Eggs', 'protein', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 3.50, 'dozen', ARRAY[]::text[], NOW()),
  ('ing-00000000-0000-0000-000000000014', 'Butter', 'dairy', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 4.50, 'lb', ARRAY['dairy']::text[], NOW()),
  ('ing-00000000-0000-0000-000000000015', 'Flour', 'grains', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], 3.99, 'lb', ARRAY['gluten']::text[], NOW())
ON CONFLICT (name) DO NOTHING;

-- Create sample recipe for test user
INSERT INTO recipes (id, user_id, title, description, source, prep_time, cook_time, servings, difficulty, kid_friendly, cuisine_type, meal_type, instructions, is_public, created_at, updated_at)
VALUES (
  'test-recipe-0000-0000-000000000001',
  'test-user-00-0000-0000-000000000001',
  'Test Spaghetti Bolognese',
  'A classic Italian pasta dish perfect for testing',
  'custom',
  15,
  30,
  4,
  'easy',
  true,
  'Italian',
  'dinner',
  '[
    {"step": 1, "instruction": "Boil water for pasta"},
    {"step": 2, "instruction": "Brown ground beef in a pan"},
    {"step": 3, "instruction": "Add tomato sauce and simmer"},
    {"step": 4, "instruction": "Cook pasta according to package directions"},
    {"step": 5, "instruction": "Combine pasta with sauce and serve"}
  ]'::jsonb,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add ingredients to test recipe
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes)
VALUES
  ('test-rec-ing-0000-0000-000000000001', 'test-recipe-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000005', 1.0, 'lb', 'lean'),
  ('test-rec-ing-0000-0000-000000000002', 'test-recipe-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000006', 1.0, 'lb', 'spaghetti'),
  ('test-rec-ing-0000-0000-000000000003', 'test-recipe-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000001', 2.0, 'cups', 'diced'),
  ('test-rec-ing-0000-0000-000000000004', 'test-recipe-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000002', 1.0, 'medium', 'diced'),
  ('test-rec-ing-0000-0000-000000000005', 'test-recipe-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000003', 3.0, 'cloves', 'minced')
ON CONFLICT (id) DO NOTHING;

-- Create sample meal plan for test user
INSERT INTO meal_plans (id, user_id, week_start_date, status, created_at, updated_at)
VALUES (
  'test-plan-00-0000-0000-000000000001',
  'test-user-00-0000-0000-000000000001',
  CURRENT_DATE,
  'active',
  NOW(),
  NOW()
);

-- Add planned meal
INSERT INTO planned_meals (id, meal_plan_id, recipe_id, date, meal_type, servings, notes)
VALUES (
  'test-planned-0000-0000-000000000001',
  'test-plan-00-0000-0000-000000000001',
  'test-recipe-0000-0000-000000000001',
  CURRENT_DATE,
  'dinner',
  4,
  'Test dinner for the family'
);

-- Create sample grocery list for test user
INSERT INTO grocery_lists (id, meal_plan_id, user_id, status, created_at, updated_at)
VALUES (
  'test-list-00-0000-0000-000000000001',
  'test-plan-00-0000-0000-000000000001',
  'test-user-00-0000-0000-000000000001',
  'draft',
  NOW(),
  NOW()
);

-- Add items to grocery list
INSERT INTO grocery_list_items (id, grocery_list_id, ingredient_id, quantity, unit, estimated_price, is_checked, store_section, notes)
VALUES
  ('test-item-00-0000-0000-000000000001', 'test-list-00-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000005', 1.0, 'lb', 4.99, false, 'Meat', 'For spaghetti'),
  ('test-item-00-0000-0000-000000000002', 'test-list-00-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000006', 1.0, 'lb', 1.99, false, 'Pasta', 'Spaghetti pasta'),
  ('test-item-00-0000-0000-000000000003', 'test-list-00-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000001', 2.0, 'lb', 5.00, false, 'Produce', 'Fresh tomatoes');

-- Add pantry items for test user
INSERT INTO pantry_inventory (id, user_id, ingredient_id, quantity, unit, expiration_date, location, updated_at)
VALUES
  ('test-pantry-0000-0000-000000000001', 'test-user-00-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000008', 1.0, 'bottle', CURRENT_DATE + INTERVAL '365 days', 'pantry', NOW()),
  ('test-pantry-0000-0000-000000000002', 'test-user-00-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000009', 1.0, 'container', CURRENT_DATE + INTERVAL '730 days', 'pantry', NOW()),
  ('test-pantry-0000-0000-000000000003', 'test-user-00-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000007', 5.0, 'lb', CURRENT_DATE + INTERVAL '180 days', 'pantry', NOW());

-- Add recipe rating from test user
INSERT INTO recipe_ratings (id, recipe_id, user_id, family_member_id, rating, notes, would_make_again, created_at)
VALUES (
  'test-rating-0000-0000-000000000001',
  'test-recipe-0000-0000-000000000001',
  'test-user-00-0000-0000-000000000001',
  'test-member-0000-0000-000000000001',
  5,
  'Great test recipe! The kids loved it.',
  true,
  NOW()
);

-- Summary comment
COMMENT ON TABLE users IS 'Users table - Production user "e2kd7n" should never have test data. Use test@example.com for all development and testing.';

-- Log test data creation
DO $$
BEGIN
  RAISE NOTICE 'Test data created successfully!';
  RAISE NOTICE 'Test User: test@example.com / Password: TestPass123!';
  RAISE NOTICE 'Test Admin: testadmin@example.com / Password: AdminPass123!';
  RAISE NOTICE 'IMPORTANT: Never add test data to production user e2kd7n';
END $$;

-- Made with Bob
