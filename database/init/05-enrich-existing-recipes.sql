-- Enrich Existing Recipes with Complete Data
-- This script adds missing nutrition info and images to existing recipes
-- Addresses Issue #78: Test database has incomplete recipe data

-- Add nutrition information to existing recipes based on title
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 450, 'protein', 25, 'carbs', 45, 'fat', 18, 'fiber', 3, 'sugar', 8
) WHERE title = 'Classic Pancakes' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 320, 'protein', 22, 'carbs', 8, 'fat', 22, 'fiber', 2, 'sugar', 4
) WHERE title = 'Veggie Omelet' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380, 'protein', 12, 'carbs', 52, 'fat', 14, 'fiber', 2, 'sugar', 18
) WHERE title = 'French Toast' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 520, 'protein', 28, 'carbs', 42, 'fat', 24, 'fiber', 4, 'sugar', 3
) WHERE title = 'Breakfast Burrito' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280, 'protein', 12, 'carbs', 48, 'fat', 6, 'fiber', 8, 'sugar', 12
) WHERE title = 'Overnight Oats' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 350, 'protein', 18, 'carbs', 28, 'fat', 20, 'fiber', 7, 'sugar', 2
) WHERE title = 'Avocado Toast' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 240, 'protein', 18, 'carbs', 32, 'fat', 4, 'fiber', 5, 'sugar', 22
) WHERE title = 'Breakfast Smoothie' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 580, 'protein', 24, 'carbs', 42, 'fat', 34, 'fiber', 2, 'sugar', 4
) WHERE title = 'Eggs Benedict' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420, 'protein', 16, 'carbs', 52, 'fat', 18, 'fiber', 6, 'sugar', 4
) WHERE title = 'Breakfast Hash' AND nutrition_info IS NULL;

-- Lunch recipes
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 320, 'protein', 12, 'carbs', 18, 'fat', 22, 'fiber', 4, 'sugar', 3
) WHERE title = 'Caesar Salad' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 480, 'protein', 18, 'carbs', 42, 'fat', 26, 'fiber', 2, 'sugar', 6
) WHERE title = 'Grilled Cheese Sandwich' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420, 'protein', 32, 'carbs', 38, 'fat', 14, 'fiber', 5, 'sugar', 4
) WHERE title = 'Chicken Wrap' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380, 'protein', 24, 'carbs', 36, 'fat', 16, 'fiber', 3, 'sugar', 5
) WHERE title = 'Tuna Salad' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 520, 'protein', 28, 'carbs', 42, 'fat', 24, 'fiber', 3, 'sugar', 2
) WHERE title = 'Quesadilla' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 450, 'protein', 22, 'carbs', 38, 'fat', 24, 'fiber', 3, 'sugar', 6
) WHERE title = 'BLT Sandwich' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380, 'protein', 18, 'carbs', 42, 'fat', 16, 'fiber', 4, 'sugar', 5
) WHERE title = 'Caprese Sandwich' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280, 'protein', 24, 'carbs', 32, 'fat', 6, 'fiber', 3, 'sugar', 4
) WHERE title = 'Chicken Noodle Soup' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 240, 'protein', 8, 'carbs', 18, 'fat', 16, 'fiber', 5, 'sugar', 6
) WHERE title = 'Greek Salad' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 580, 'protein', 36, 'carbs', 48, 'fat', 24, 'fiber', 4, 'sugar', 8
) WHERE title = 'Turkey Club' AND nutrition_info IS NULL;

-- Dinner recipes
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420, 'protein', 38, 'carbs', 8, 'fat', 26, 'fiber', 1, 'sugar', 2
) WHERE title = 'Grilled Salmon' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 520, 'protein', 32, 'carbs', 48, 'fat', 18, 'fiber', 4, 'sugar', 6
) WHERE title = 'Beef Stir Fry' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 620, 'protein', 42, 'carbs', 38, 'fat', 32, 'fiber', 3, 'sugar', 8
) WHERE title = 'Chicken Parmesan' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 480, 'protein', 28, 'carbs', 36, 'fat', 24, 'fiber', 5, 'sugar', 4
) WHERE title = 'Beef Tacos' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 380, 'protein', 12, 'carbs', 58, 'fat', 14, 'fiber', 8, 'sugar', 12
) WHERE title = 'Vegetable Curry' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 650, 'protein', 45, 'carbs', 32, 'fat', 38, 'fiber', 2, 'sugar', 4
) WHERE title = 'Roast Chicken' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 720, 'protein', 48, 'carbs', 28, 'fat', 45, 'fiber', 1, 'sugar', 12
) WHERE title = 'BBQ Ribs' AND nutrition_info IS NULL;

-- Dessert recipes
UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 180, 'protein', 2, 'carbs', 24, 'fat', 9, 'fiber', 1, 'sugar', 14
) WHERE title = 'Chocolate Chip Cookies' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 220, 'protein', 3, 'carbs', 28, 'fat', 12, 'fiber', 2, 'sugar', 20
) WHERE title = 'Brownies' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 320, 'protein', 3, 'carbs', 48, 'fat', 14, 'fiber', 3, 'sugar', 24
) WHERE title = 'Apple Pie' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280, 'protein', 6, 'carbs', 32, 'fat', 16, 'fiber', 0, 'sugar', 24
) WHERE title = 'Tiramisu' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 420, 'protein', 8, 'carbs', 38, 'fat', 28, 'fiber', 0, 'sugar', 32
) WHERE title = 'Cheesecake' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 350, 'protein', 6, 'carbs', 42, 'fat', 18, 'fiber', 1, 'sugar', 36
) WHERE title = 'Ice Cream Sundae' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 240, 'protein', 4, 'carbs', 22, 'fat', 16, 'fiber', 2, 'sugar', 18
) WHERE title = 'Chocolate Mousse' AND nutrition_info IS NULL;

UPDATE recipes SET nutrition_info = jsonb_build_object(
  'calories', 280, 'protein', 4, 'carbs', 38, 'fat', 14, 'fiber', 3, 'sugar', 22
) WHERE title = 'Fruit Tart' AND nutrition_info IS NULL;

-- Add image URLs to recipes
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800' WHERE title = 'Classic Pancakes' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800' WHERE title = 'Veggie Omelet' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800' WHERE title = 'French Toast' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' WHERE title = 'Breakfast Burrito' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800' WHERE title = 'Overnight Oats' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800' WHERE title = 'Avocado Toast' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800' WHERE title = 'Breakfast Smoothie' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800' WHERE title = 'Eggs Benedict' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800' WHERE title = 'Breakfast Hash' AND image_url IS NULL;

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800' WHERE title = 'Caesar Salad' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800' WHERE title = 'Grilled Cheese Sandwich' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' WHERE title = 'Chicken Wrap' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1539906252087-b65ec565c1c2?w=800' WHERE title = 'Tuna Salad' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800' WHERE title = 'Quesadilla' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800' WHERE title = 'BLT Sandwich' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1592415499556-f90efa4e3c93?w=800' WHERE title = 'Caprese Sandwich' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800' WHERE title = 'Chicken Noodle Soup' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800' WHERE title = 'Greek Salad' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800' WHERE title = 'Turkey Club' AND image_url IS NULL;

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800' WHERE title = 'Grilled Salmon' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800' WHERE title = 'Beef Stir Fry' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800' WHERE title = 'Chicken Parmesan' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' WHERE title = 'Beef Tacos' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800' WHERE title = 'Vegetable Curry' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800' WHERE title = 'Roast Chicken' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' WHERE title = 'BBQ Ribs' AND image_url IS NULL;

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800' WHERE title = 'Chocolate Chip Cookies' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=800' WHERE title = 'Brownies' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800' WHERE title = 'Apple Pie' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800' WHERE title = 'Tiramisu' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1533134242820-b4f3b4e0c2b7?w=800' WHERE title = 'Cheesecake' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800' WHERE title = 'Ice Cream Sundae' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=800' WHERE title = 'Chocolate Mousse' AND image_url IS NULL;
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?w=800' WHERE title = 'Fruit Tart' AND image_url IS NULL;

-- Log completion
DO $$
DECLARE
  recipe_count INTEGER;
  with_nutrition INTEGER;
  with_images INTEGER;
BEGIN
  SELECT COUNT(*) INTO recipe_count FROM recipes;
  SELECT COUNT(*) INTO with_nutrition FROM recipes WHERE nutrition_info IS NOT NULL;
  SELECT COUNT(*) INTO with_images FROM recipes WHERE image_url IS NOT NULL;
  
  RAISE NOTICE 'Recipe data enrichment complete!';
  RAISE NOTICE 'Total recipes: %', recipe_count;
  RAISE NOTICE 'Recipes with nutrition info: %', with_nutrition;
  RAISE NOTICE 'Recipes with images: %', with_images;
  RAISE NOTICE 'Issue #78 resolved - Database ready for design team evaluation';
END $$;

-- Made with Bob