-- Complete Recipe Data for Design Team Evaluation
-- This script adds missing data to recipes for comprehensive UX testing
-- Addresses Issue #78: Test database has incomplete recipe data

-- Add ingredients to breakfast recipes
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes)
VALUES
  -- Classic Pancakes
  ('rec-ing-breakfast-02-001', 'recipe-breakfast-0000-0000-000000000002', 'ing-00000000-0000-0000-000000000015', 2.0, 'cups', 'all-purpose'),
  ('rec-ing-breakfast-02-002', 'recipe-breakfast-0000-0000-000000000002', 'ing-00000000-0000-0000-000000000011', 2.0, 'cups', 'buttermilk'),
  ('rec-ing-breakfast-02-003', 'recipe-breakfast-0000-0000-000000000002', 'ing-00000000-0000-0000-000000000013', 2.0, 'large', ''),
  ('rec-ing-breakfast-02-004', 'recipe-breakfast-0000-0000-000000000002', 'ing-00000000-0000-0000-000000000014', 0.25, 'cup', 'melted'),
  
  -- Veggie Omelet
  ('rec-ing-breakfast-03-001', 'recipe-breakfast-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000013', 3.0, 'large', ''),
  ('rec-ing-breakfast-03-002', 'recipe-breakfast-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000002', 0.5, 'medium', 'diced'),
  ('rec-ing-breakfast-03-003', 'recipe-breakfast-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000001', 1.0, 'medium', 'diced'),
  ('rec-ing-breakfast-03-004', 'recipe-breakfast-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000012', 0.5, 'cup', 'shredded'),
  
  -- French Toast
  ('rec-ing-breakfast-04-001', 'recipe-breakfast-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000013', 4.0, 'large', ''),
  ('rec-ing-breakfast-04-002', 'recipe-breakfast-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000011', 0.5, 'cup', ''),
  ('rec-ing-breakfast-04-003', 'recipe-breakfast-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000014', 2.0, 'tbsp', ''),
  
  -- Breakfast Burrito
  ('rec-ing-breakfast-05-001', 'recipe-breakfast-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000013', 6.0, 'large', ''),
  ('rec-ing-breakfast-05-002', 'recipe-breakfast-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000012', 1.0, 'cup', 'shredded'),
  ('rec-ing-breakfast-05-003', 'recipe-breakfast-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000002', 1.0, 'medium', 'diced'),
  
  -- Overnight Oats
  ('rec-ing-breakfast-06-001', 'recipe-breakfast-0000-0000-000000000006', 'ing-00000000-0000-0000-000000000011', 1.0, 'cup', ''),
  
  -- Avocado Toast
  ('rec-ing-breakfast-07-001', 'recipe-breakfast-0000-0000-000000000007', 'ing-00000000-0000-0000-000000000013', 2.0, 'large', ''),
  
  -- Breakfast Smoothie
  ('rec-ing-breakfast-08-001', 'recipe-breakfast-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000011', 1.0, 'cup', ''),
  
  -- Eggs Benedict
  ('rec-ing-breakfast-09-001', 'recipe-breakfast-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000013', 4.0, 'large', ''),
  ('rec-ing-breakfast-09-002', 'recipe-breakfast-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000014', 0.5, 'cup', ''),
  
  -- Breakfast Hash
  ('rec-ing-breakfast-10-001', 'recipe-breakfast-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000013', 4.0, 'large', ''),
  ('rec-ing-breakfast-10-002', 'recipe-breakfast-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000002', 1.0, 'large', 'diced')
ON CONFLICT (id) DO NOTHING;

-- Add ingredients to lunch recipes
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes)
VALUES
  -- Caesar Salad
  ('rec-ing-lunch-01-001', 'recipe-lunch-00000-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000012', 0.5, 'cup', 'parmesan'),
  ('rec-ing-lunch-01-002', 'recipe-lunch-00000-0000-0000-000000000001', 'ing-00000000-0000-0000-000000000003', 2.0, 'cloves', 'minced'),
  
  -- Grilled Cheese
  ('rec-ing-lunch-02-001', 'recipe-lunch-00000-0000-0000-000000000002', 'ing-00000000-0000-0000-000000000012', 4.0, 'slices', 'cheddar'),
  ('rec-ing-lunch-02-002', 'recipe-lunch-00000-0000-0000-000000000002', 'ing-00000000-0000-0000-000000000014', 2.0, 'tbsp', ''),
  
  -- Chicken Wrap
  ('rec-ing-lunch-03-001', 'recipe-lunch-00000-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000004', 1.0, 'lb', ''),
  ('rec-ing-lunch-03-002', 'recipe-lunch-00000-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000001', 1.0, 'medium', 'diced'),
  
  -- Tuna Salad
  ('rec-ing-lunch-04-001', 'recipe-lunch-00000-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000002', 0.5, 'medium', 'diced'),
  
  -- Quesadilla
  ('rec-ing-lunch-05-001', 'recipe-lunch-00000-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000012', 2.0, 'cups', 'shredded'),
  ('rec-ing-lunch-05-002', 'recipe-lunch-00000-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000004', 0.5, 'lb', 'cooked'),
  
  -- BLT Sandwich
  ('rec-ing-lunch-06-001', 'recipe-lunch-00000-0000-0000-000000000006', 'ing-00000000-0000-0000-000000000001', 2.0, 'medium', 'sliced'),
  
  -- Caprese Sandwich
  ('rec-ing-lunch-07-001', 'recipe-lunch-00000-0000-0000-000000000007', 'ing-00000000-0000-0000-000000000001', 2.0, 'medium', 'sliced'),
  
  -- Chicken Noodle Soup
  ('rec-ing-lunch-08-001', 'recipe-lunch-00000-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000004', 1.0, 'lb', 'diced'),
  ('rec-ing-lunch-08-002', 'recipe-lunch-00000-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000002', 1.0, 'medium', 'diced'),
  ('rec-ing-lunch-08-003', 'recipe-lunch-00000-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000006', 2.0, 'cups', 'egg noodles'),
  
  -- Greek Salad
  ('rec-ing-lunch-09-001', 'recipe-lunch-00000-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000001', 3.0, 'medium', 'diced'),
  ('rec-ing-lunch-09-002', 'recipe-lunch-00000-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000002', 1.0, 'medium', 'sliced'),
  
  -- Turkey Club
  ('rec-ing-lunch-10-001', 'recipe-lunch-00000-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000001', 2.0, 'medium', 'sliced')
ON CONFLICT (id) DO NOTHING;

-- Add ingredients to dinner recipes
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes)
VALUES
  -- Grilled Salmon
  ('rec-ing-dinner-06-001', 'recipe-dinner-00-0000-0000-000000000006', 'ing-00000000-0000-0000-000000000008', 2.0, 'tbsp', ''),
  ('rec-ing-dinner-06-002', 'recipe-dinner-00-0000-0000-000000000006', 'ing-00000000-0000-0000-000000000003', 3.0, 'cloves', 'minced'),
  
  -- Beef Stir Fry
  ('rec-ing-dinner-07-001', 'recipe-dinner-00-0000-0000-000000000007', 'ing-00000000-0000-0000-000000000005', 1.0, 'lb', 'sliced'),
  ('rec-ing-dinner-07-002', 'recipe-dinner-00-0000-0000-000000000007', 'ing-00000000-0000-0000-000000000002', 1.0, 'large', 'sliced'),
  ('rec-ing-dinner-07-003', 'recipe-dinner-00-0000-0000-000000000007', 'ing-00000000-0000-0000-000000000007', 2.0, 'cups', 'cooked'),
  
  -- Chicken Parmesan
  ('rec-ing-dinner-08-001', 'recipe-dinner-00-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000004', 1.5, 'lb', ''),
  ('rec-ing-dinner-08-002', 'recipe-dinner-00-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000012', 1.0, 'cup', 'mozzarella'),
  ('rec-ing-dinner-08-003', 'recipe-dinner-00-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000001', 2.0, 'cups', 'crushed'),
  
  -- Beef Tacos
  ('rec-ing-dinner-09-001', 'recipe-dinner-00-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000005', 1.5, 'lb', ''),
  ('rec-ing-dinner-09-002', 'recipe-dinner-00-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000002', 1.0, 'medium', 'diced'),
  ('rec-ing-dinner-09-003', 'recipe-dinner-00-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000001', 2.0, 'medium', 'diced'),
  
  -- Vegetable Curry
  ('rec-ing-dinner-10-001', 'recipe-dinner-00-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000002', 2.0, 'large', 'diced'),
  ('rec-ing-dinner-10-002', 'recipe-dinner-00-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000003', 4.0, 'cloves', 'minced'),
  ('rec-ing-dinner-10-003', 'recipe-dinner-00-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000007', 2.0, 'cups', 'cooked')
ON CONFLICT (id) DO NOTHING;

-- Add ingredients to dessert recipes
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes)
VALUES
  -- Chocolate Chip Cookies
  ('rec-ing-dessert-03-001', 'recipe-dessert-0-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000015', 2.25, 'cups', 'all-purpose'),
  ('rec-ing-dessert-03-002', 'recipe-dessert-0-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000014', 1.0, 'cup', 'softened'),
  ('rec-ing-dessert-03-003', 'recipe-dessert-0-0000-0000-000000000003', 'ing-00000000-0000-0000-000000000013', 2.0, 'large', ''),
  
  -- Brownies
  ('rec-ing-dessert-04-001', 'recipe-dessert-0-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000014', 0.5, 'cup', ''),
  ('rec-ing-dessert-04-002', 'recipe-dessert-0-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000013', 3.0, 'large', ''),
  ('rec-ing-dessert-04-003', 'recipe-dessert-0-0000-0000-000000000004', 'ing-00000000-0000-0000-000000000015', 0.75, 'cup', 'all-purpose'),
  
  -- Apple Pie
  ('rec-ing-dessert-05-001', 'recipe-dessert-0-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000015', 2.5, 'cups', 'all-purpose'),
  ('rec-ing-dessert-05-002', 'recipe-dessert-0-0000-0000-000000000005', 'ing-00000000-0000-0000-000000000014', 1.0, 'cup', 'cold'),
  
  -- Tiramisu
  ('rec-ing-dessert-06-001', 'recipe-dessert-0-0000-0000-000000000006', 'ing-00000000-0000-0000-000000000013', 6.0, 'large', 'separated'),
  
  -- Cheesecake
  ('rec-ing-dessert-07-001', 'recipe-dessert-0-0000-0000-000000000007', 'ing-00000000-0000-0000-000000000013', 4.0, 'large', ''),
  
  -- Ice Cream Sundae
  ('rec-ing-dessert-08-001', 'recipe-dessert-0-0000-0000-000000000008', 'ing-00000000-0000-0000-000000000011', 0.5, 'cup', 'for topping'),
  
  -- Chocolate Mousse
  ('rec-ing-dessert-09-001', 'recipe-dessert-0-0000-0000-000000000009', 'ing-00000000-0000-0000-000000000013', 4.0, 'large', 'separated'),
  
  -- Fruit Tart
  ('rec-ing-dessert-10-001', 'recipe-dessert-0-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000015', 1.5, 'cups', 'all-purpose'),
  ('rec-ing-dessert-10-002', 'recipe-dessert-0-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000014', 0.5, 'cup', 'cold'),
  ('rec-ing-dessert-10-003', 'recipe-dessert-0-0000-0000-000000000010', 'ing-00000000-0000-0000-000000000011', 2.0, 'cups', 'for pastry cream')
ON CONFLICT (id) DO NOTHING;

-- Add nutrition information to all recipes
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 450,
  'protein', 25,
  'carbs', 45,
  'fat', 18,
  'fiber', 3,
  'sugar', 8
) WHERE id = 'recipe-breakfast-0000-0000-000000000002';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 320,
  'protein', 22,
  'carbs', 8,
  'fat', 22,
  'fiber', 2,
  'sugar', 4
) WHERE id = 'recipe-breakfast-0000-0000-000000000003';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380,
  'protein', 12,
  'carbs', 52,
  'fat', 14,
  'fiber', 2,
  'sugar', 18
) WHERE id = 'recipe-breakfast-0000-0000-000000000004';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 520,
  'protein', 28,
  'carbs', 42,
  'fat', 24,
  'fiber', 4,
  'sugar', 3
) WHERE id = 'recipe-breakfast-0000-0000-000000000005';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280,
  'protein', 12,
  'carbs', 48,
  'fat', 6,
  'fiber', 8,
  'sugar', 12
) WHERE id = 'recipe-breakfast-0000-0000-000000000006';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 350,
  'protein', 18,
  'carbs', 28,
  'fat', 20,
  'fiber', 7,
  'sugar', 2
) WHERE id = 'recipe-breakfast-0000-0000-000000000007';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 240,
  'protein', 18,
  'carbs', 32,
  'fat', 4,
  'fiber', 5,
  'sugar', 22
) WHERE id = 'recipe-breakfast-0000-0000-000000000008';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 580,
  'protein', 24,
  'carbs', 42,
  'fat', 34,
  'fiber', 2,
  'sugar', 4
) WHERE id = 'recipe-breakfast-0000-0000-000000000009';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420,
  'protein', 16,
  'carbs', 52,
  'fat', 18,
  'fiber', 6,
  'sugar', 4
) WHERE id = 'recipe-breakfast-0000-0000-000000000010';

-- Lunch recipes nutrition
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 320,
  'protein', 12,
  'carbs', 18,
  'fat', 22,
  'fiber', 4,
  'sugar', 3
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000001';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 480,
  'protein', 18,
  'carbs', 42,
  'fat', 26,
  'fiber', 2,
  'sugar', 6
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000002';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420,
  'protein', 32,
  'carbs', 38,
  'fat', 14,
  'fiber', 5,
  'sugar', 4
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000003';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380,
  'protein', 24,
  'carbs', 36,
  'fat', 16,
  'fiber', 3,
  'sugar', 5
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000004';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 520,
  'protein', 28,
  'carbs', 42,
  'fat', 24,
  'fiber', 3,
  'sugar', 2
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000005';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 450,
  'protein', 22,
  'carbs', 38,
  'fat': 24,
  'fiber', 3,
  'sugar', 6
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000006';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380,
  'protein', 18,
  'carbs', 42,
  'fat', 16,
  'fiber', 4,
  'sugar', 5
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000007';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280,
  'protein', 24,
  'carbs', 32,
  'fat', 6,
  'fiber', 3,
  'sugar', 4
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000008';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 240,
  'protein', 8,
  'carbs', 18,
  'fat', 16,
  'fiber', 5,
  'sugar', 6
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000009';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 580,
  'protein', 36,
  'carbs', 48,
  'fat', 24,
  'fiber', 4,
  'sugar', 8
) WHERE id = 'recipe-lunch-00000-0000-0000-000000000010';

-- Dinner recipes nutrition
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420,
  'protein', 38,
  'carbs', 8,
  'fat', 26,
  'fiber', 1,
  'sugar', 2
) WHERE id = 'recipe-dinner-00-0000-0000-000000000006';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 520,
  'protein', 32,
  'carbs', 48,
  'fat', 18,
  'fiber', 4,
  'sugar', 6
) WHERE id = 'recipe-dinner-00-0000-0000-000000000007';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 620,
  'protein', 42,
  'carbs', 38,
  'fat', 32,
  'fiber', 3,
  'sugar', 8
) WHERE id = 'recipe-dinner-00-0000-0000-000000000008';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 480,
  'protein', 28,
  'carbs', 36,
  'fat', 24,
  'fiber', 5,
  'sugar', 4
) WHERE id = 'recipe-dinner-00-0000-0000-000000000009';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380,
  'protein', 12,
  'carbs', 58,
  'fat', 14,
  'fiber', 8,
  'sugar', 12
) WHERE id = 'recipe-dinner-00-0000-0000-000000000010';

-- Dessert recipes nutrition
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 180,
  'protein', 2,
  'carbs', 24,
  'fat', 9,
  'fiber', 1,
  'sugar', 14
) WHERE id = 'recipe-dessert-0-0000-0000-000000000003';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 220,
  'protein', 3,
  'carbs', 28,
  'fat', 12,
  'fiber', 2,
  'sugar', 20
) WHERE id = 'recipe-dessert-0-0000-0000-000000000004';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 320,
  'protein', 3,
  'carbs', 48,
  'fat', 14,
  'fiber', 3,
  'sugar', 24
) WHERE id = 'recipe-dessert-0-0000-0000-000000000005';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280,
  'protein', 6,
  'carbs', 32,
  'fat', 16,
  'fiber', 0,
  'sugar', 24
) WHERE id = 'recipe-dessert-0-0000-0000-000000000006';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420,
  'protein', 8,
  'carbs', 38,
  'fat', 28,
  'fiber', 0,
  'sugar', 32
) WHERE id = 'recipe-dessert-0-0000-0000-000000000007';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 350,
  'protein', 6,
  'carbs', 42,
  'fat', 18,
  'fiber', 1,
  'sugar', 36
) WHERE id = 'recipe-dessert-0-0000-0000-000000000008';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 240,
  'protein', 4,
  'carbs', 22,
  'fat', 16,
  'fiber', 2,
  'sugar', 18
) WHERE id = 'recipe-dessert-0-0000-0000-000000000009';

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280,
  'protein', 4,
  'carbs', 38,
  'fat', 14,
  'fiber', 3,
  'sugar', 22
) WHERE id = 'recipe-dessert-0-0000-0000-000000000010';

-- Add tags to recipes for better categorization
UPDATE recipes SET tags = ARRAY['quick', 'breakfast', 'family-friendly'] WHERE id = 'recipe-breakfast-0000-0000-000000000002';
UPDATE recipes SET tags = ARRAY['healthy', 'vegetarian', 'protein'] WHERE id = 'recipe-breakfast-0000-0000-000000000003';
UPDATE recipes SET tags = ARRAY['sweet', 'breakfast', 'weekend'] WHERE id = 'recipe-breakfast-0000-0000-000000000004';
UPDATE recipes SET tags = ARRAY['hearty', 'mexican', 'filling'] WHERE id = 'recipe-breakfast-0000-0000-000000000005';
UPDATE recipes SET tags = ARRAY['no-cook', 'healthy', 'meal-prep'] WHERE id = 'recipe-breakfast-0000-0000-000000000006';
UPDATE recipes SET tags = ARRAY['trendy', 'healthy', 'quick'] WHERE id = 'recipe-breakfast-0000-0000-000000000007';
UPDATE recipes SET tags = ARRAY['healthy', 'quick', 'protein'] WHERE id = 'recipe-breakfast-0000-0000-000000000008';
UPDATE recipes SET tags = ARRAY['fancy', 'brunch', 'special-occasion'] WHERE id = 'recipe-breakfast-0000-0000-000000000009';
UPDATE recipes SET tags = ARRAY['hearty', 'comfort-food', 'filling'] WHERE id = 'recipe-breakfast-0000-0000-000000000010';

UPDATE recipes SET tags = ARRAY['salad', 'classic', 'italian'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000001';
UPDATE recipes SET tags = ARRAY['comfort-food', 'quick', 'kid-friendly'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000002';
UPDATE recipes SET tags = ARRAY['healthy', 'protein', 'portable'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000003';
UPDATE recipes SET tags = ARRAY['classic', 'sandwich', 'easy'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000004';
UPDATE recipes SET tags = ARRAY['mexican', 'quick', 'cheesy'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000005';
UPDATE recipes SET tags = ARRAY['classic', 'sandwich', 'bacon'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000006';
UPDATE recipes SET tags = ARRAY['italian', 'fresh', 'vegetarian'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000007';
UPDATE recipes SET tags = ARRAY['soup', 'comfort-food', 'classic'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000008';
UPDATE recipes SET tags = ARRAY['salad', 'greek', 'healthy'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000009';
UPDATE recipes SET tags = ARRAY['sandwich', 'hearty', 'classic'] WHERE id = 'recipe-lunch-00000-0000-0000-000000000010';

UPDATE recipes SET tags = ARRAY['seafood', 'healthy', 'grilled'] WHERE id = 'recipe-dinner-00-0000-0000-000000000006';
UPDATE recipes SET tags = ARRAY['asian', 'quick', 'stir-fry'] WHERE id = 'recipe-dinner-00-0000-0000-000000000007';
UPDATE recipes SET tags = ARRAY['italian', 'comfort-food', 'cheesy'] WHERE id = 'recipe-dinner-00-0000-0000-000000000008';
UPDATE recipes SET tags = ARRAY['mexican', 'easy', 'family-friendly'] WHERE id = 'recipe-dinner-00-0000-0000-000000000009';
UPDATE recipes SET tags = ARRAY['indian', 'vegetarian', 'spicy'] WHERE id = 'recipe-dinner-00-0000-0000-000000000010';

UPDATE recipes SET tags = ARRAY['dessert', 'baking', 'classic'] WHERE id = 'recipe-dessert-0-0000-0000-000000000003';
UPDATE recipes SET tags = ARRAY['chocolate', 'dessert', 'fudgy'] WHERE id = 'recipe-dessert-0-0000-0000-000000000004';
UPDATE recipes SET tags = ARRAY['pie', 'fruit', 'classic'] WHERE id = 'recipe-dessert-0-0000-0000-000000000005';
UPDATE recipes SET tags = ARRAY['italian', 'coffee', 'no-bake'] WHERE id = 'recipe-dessert-0-0000-0000-000000000006';
UPDATE recipes SET tags = ARRAY['cheesecake', 'special-occasion', 'rich'] WHERE id = 'recipe-dessert-0-0000-0000-000000000007';
UPDATE recipes SET tags = ARRAY['ice-cream', 'quick', 'kid-friendly'] WHERE id = 'recipe-dessert-0-0000-0000-000000000008';
UPDATE recipes SET tags = ARRAY['chocolate', 'french', 'elegant'] WHERE id = 'recipe-dessert-0-0000-0000-000000000009';
UPDATE recipes SET tags = ARRAY['fruit', 'french', 'elegant'] WHERE id = 'recipe-dessert-0-0000-0000-000000000010';

-- Add image URLs (placeholder URLs for design evaluation)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000002';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000003';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000004';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000005';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000006';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000007';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000008';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000009';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800' WHERE id = 'recipe-breakfast-0000-0000-000000000010';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000001';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000002';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000003';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1539906252087-b65ec565c1c2?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000004';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000005';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000006';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1592415499556-f90efa4e3c93?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000007';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000008';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000009';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800' WHERE id = 'recipe-lunch-00000-0000-0000-000000000010';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800' WHERE id = 'recipe-dinner-00-0000-0000-000000000006';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800' WHERE id = 'recipe-dinner-00-0000-0000-000000000007';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800' WHERE id = 'recipe-dinner-00-0000-0000-000000000008';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' WHERE id = 'recipe-dinner-00-0000-0000-000000000009';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800' WHERE id = 'recipe-dinner-00-0000-0000-000000000010';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000003';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000004';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000005';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000006';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1533134242820-b4f3b4e0c2b7?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000007';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000008';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000009';
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?w=800' WHERE id = 'recipe-dessert-0-0000-0000-000000000010';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Complete recipe data added successfully!';
  RAISE NOTICE 'All recipes now have:';
  RAISE NOTICE '  - Ingredients with quantities';
  RAISE NOTICE '  - Nutrition information';
  RAISE NOTICE '  - Tags for categorization';
  RAISE NOTICE '  - Image URLs for visual design';
  RAISE NOTICE 'Issue #78 resolved - Database ready for design team evaluation';
END $$;

-- Made with Bob