import { PrismaClient, Difficulty, MealType } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_ID = 'df262615-e86b-4b04-94eb-8369d0ad242d'; // The test user we created

const recipes = [
  // Breakfast recipes
  { title: 'Classic Pancakes', description: 'Fluffy buttermilk pancakes perfect for weekend mornings', prepTime: 10, cookTime: 15, servings: 4, difficulty: 'easy' as Difficulty, kidFriendly: true, cuisineType: 'American', mealTypes: ['breakfast' as MealType] },
  { title: 'Veggie Omelet', description: 'Healthy vegetable-packed omelet', prepTime: 5, cookTime: 10, servings: 2, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['breakfast'] },
  { title: 'French Toast', description: 'Cinnamon-spiced French toast', prepTime: 5, cookTime: 10, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'French', mealTypes: ['breakfast'] },
  { title: 'Breakfast Burrito', description: 'Hearty breakfast burrito with eggs and cheese', prepTime: 10, cookTime: 15, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'Mexican', mealTypes: ['breakfast'] },
  { title: 'Overnight Oats', description: 'No-cook overnight oats with fruit', prepTime: 5, cookTime: 0, servings: 2, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['breakfast'] },
  { title: 'Avocado Toast', description: 'Simple avocado toast with eggs', prepTime: 5, cookTime: 5, servings: 2, difficulty: 'easy', kidFriendly: false, cuisineType: 'American', mealTypes: ['breakfast'] },
  { title: 'Breakfast Smoothie', description: 'Protein-packed fruit smoothie', prepTime: 5, cookTime: 0, servings: 2, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['breakfast'] },
  { title: 'Eggs Benedict', description: 'Classic eggs benedict with hollandaise', prepTime: 15, cookTime: 20, servings: 4, difficulty: 'hard', kidFriendly: false, cuisineType: 'American', mealTypes: ['breakfast'] },
  { title: 'Breakfast Hash', description: 'Crispy potato and vegetable hash', prepTime: 10, cookTime: 20, servings: 4, difficulty: 'medium', kidFriendly: true, cuisineType: 'American', mealTypes: ['breakfast'] },
  { title: 'Waffles', description: 'Crispy Belgian waffles', prepTime: 10, cookTime: 15, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'Belgian', mealTypes: ['breakfast'] },
  
  // Lunch recipes
  { title: 'Caesar Salad', description: 'Classic Caesar salad with homemade dressing', prepTime: 15, cookTime: 0, servings: 4, difficulty: 'easy', kidFriendly: false, cuisineType: 'Italian', mealTypes: ['lunch'] },
  { title: 'Grilled Cheese Sandwich', description: 'Perfect grilled cheese', prepTime: 5, cookTime: 10, servings: 2, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['lunch'] },
  { title: 'Chicken Wrap', description: 'Grilled chicken wrap with vegetables', prepTime: 10, cookTime: 15, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['lunch'] },
  { title: 'Tuna Salad', description: 'Classic tuna salad sandwich', prepTime: 10, cookTime: 0, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['lunch'] },
  { title: 'Quesadilla', description: 'Cheese and chicken quesadilla', prepTime: 10, cookTime: 10, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'Mexican', mealTypes: ['lunch'] },
  { title: 'BLT Sandwich', description: 'Classic bacon, lettuce, and tomato sandwich', prepTime: 10, cookTime: 10, servings: 2, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['lunch'] },
  { title: 'Caprese Sandwich', description: 'Fresh mozzarella, tomato, and basil sandwich', prepTime: 10, cookTime: 0, servings: 2, difficulty: 'easy', kidFriendly: false, cuisineType: 'Italian', mealTypes: ['lunch'] },
  { title: 'Chicken Noodle Soup', description: 'Homemade chicken noodle soup', prepTime: 15, cookTime: 30, servings: 6, difficulty: 'medium', kidFriendly: true, cuisineType: 'American', mealTypes: ['lunch'] },
  { title: 'Greek Salad', description: 'Fresh Greek salad with feta', prepTime: 15, cookTime: 0, servings: 4, difficulty: 'easy', kidFriendly: false, cuisineType: 'Greek', mealTypes: ['lunch'] },
  { title: 'Turkey Club', description: 'Triple-decker turkey club sandwich', prepTime: 15, cookTime: 0, servings: 2, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['lunch'] },
  
  // Dinner recipes
  { title: 'Spaghetti Carbonara', description: 'Classic Italian pasta with eggs and bacon', prepTime: 10, cookTime: 20, servings: 4, difficulty: 'medium', kidFriendly: true, cuisineType: 'Italian', mealTypes: ['dinner'] },
  { title: 'Grilled Salmon', description: 'Herb-crusted grilled salmon with lemon', prepTime: 10, cookTime: 15, servings: 4, difficulty: 'medium', kidFriendly: false, cuisineType: 'American', mealTypes: ['dinner'] },
  { title: 'Beef Stir Fry', description: 'Quick beef and vegetable stir fry', prepTime: 15, cookTime: 15, servings: 4, difficulty: 'medium', kidFriendly: true, cuisineType: 'Asian', mealTypes: ['dinner'] },
  { title: 'Chicken Parmesan', description: 'Breaded chicken with marinara and mozzarella', prepTime: 20, cookTime: 30, servings: 4, difficulty: 'medium', kidFriendly: true, cuisineType: 'Italian', mealTypes: ['dinner'] },
  { title: 'Beef Tacos', description: 'Seasoned ground beef tacos', prepTime: 10, cookTime: 15, servings: 6, difficulty: 'easy', kidFriendly: true, cuisineType: 'Mexican', mealTypes: ['dinner'] },
  { title: 'Vegetable Curry', description: 'Creamy coconut vegetable curry', prepTime: 15, cookTime: 25, servings: 6, difficulty: 'medium', kidFriendly: false, cuisineType: 'Indian', mealTypes: ['dinner'] },
  { title: 'Roast Chicken', description: 'Herb-roasted whole chicken', prepTime: 15, cookTime: 90, servings: 6, difficulty: 'medium', kidFriendly: true, cuisineType: 'American', mealTypes: ['dinner'] },
  { title: 'Lasagna', description: 'Classic Italian meat lasagna', prepTime: 30, cookTime: 60, servings: 8, difficulty: 'hard', kidFriendly: true, cuisineType: 'Italian', mealTypes: ['dinner'] },
  { title: 'Pad Thai', description: 'Thai stir-fried noodles', prepTime: 20, cookTime: 15, servings: 4, difficulty: 'medium', kidFriendly: false, cuisineType: 'Thai', mealTypes: ['dinner'] },
  { title: 'BBQ Ribs', description: 'Slow-cooked BBQ pork ribs', prepTime: 15, cookTime: 180, servings: 4, difficulty: 'medium', kidFriendly: true, cuisineType: 'American', mealTypes: ['dinner'] },
  
  // Dessert recipes
  { title: 'Chocolate Chip Cookies', description: 'Classic chewy chocolate chip cookies', prepTime: 15, cookTime: 12, servings: 24, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
  { title: 'Brownies', description: 'Fudgy chocolate brownies', prepTime: 15, cookTime: 30, servings: 16, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
  { title: 'Apple Pie', description: 'Classic homemade apple pie', prepTime: 30, cookTime: 50, servings: 8, difficulty: 'hard', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
  { title: 'Tiramisu', description: 'Italian coffee-flavored dessert', prepTime: 30, cookTime: 0, servings: 8, difficulty: 'medium', kidFriendly: false, cuisineType: 'Italian', mealTypes: ['dessert'] },
  { title: 'Cheesecake', description: 'New York style cheesecake', prepTime: 20, cookTime: 60, servings: 12, difficulty: 'hard', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
  { title: 'Ice Cream Sundae', description: 'Build-your-own ice cream sundae', prepTime: 5, cookTime: 0, servings: 4, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
  { title: 'Chocolate Mousse', description: 'Light and airy chocolate mousse', prepTime: 20, cookTime: 0, servings: 6, difficulty: 'medium', kidFriendly: false, cuisineType: 'French', mealTypes: ['dessert'] },
  { title: 'Fruit Tart', description: 'Fresh fruit tart with pastry cream', prepTime: 30, cookTime: 25, servings: 8, difficulty: 'hard', kidFriendly: true, cuisineType: 'French', mealTypes: ['dessert'] },
  { title: 'Chocolate Cake', description: 'Rich chocolate layer cake', prepTime: 20, cookTime: 35, servings: 12, difficulty: 'medium', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
  { title: 'Lemon Bars', description: 'Tangy lemon bars with shortbread crust', prepTime: 15, cookTime: 45, servings: 16, difficulty: 'easy', kidFriendly: true, cuisineType: 'American', mealTypes: ['dessert'] },
];

async function main() {
  console.log('Seeding database with 40 test recipes...');
  
  for (const recipe of recipes) {
    await prisma.recipe.create({
      data: {
        userId: TEST_USER_ID,
        title: recipe.title,
        description: recipe.description,
        source: 'custom',
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty as Difficulty,
        kidFriendly: recipe.kidFriendly,
        cuisineType: recipe.cuisineType,
        mealTypes: recipe.mealTypes as MealType[],
        instructions: [{ step: 1, instruction: 'Follow standard cooking instructions' }],
      },
    });
    console.log(`✓ Created: ${recipe.title}`);
  }
  
  const count = await prisma.recipe.count();
  console.log(`\n✅ Successfully created ${count} recipes!`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Made with Bob
