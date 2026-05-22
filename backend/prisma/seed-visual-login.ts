/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Seeds 8 visually distinct recipes with images so that every family member
 * has a non-empty image pool when setting up their visual login password.
 * Images are downloaded from Wikimedia Commons (CC-licensed) and stored in
 * data/images/ so they're served locally by Nginx.
 *
 * Run: npm run prisma:seed:visual-login
 * Idempotent: skips recipes and images that already exist.
 */

import { PrismaClient, Difficulty, MealType, RecipeSource } from '@prisma/client';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to the shared data/images directory (two levels up from backend/prisma/)
const IMAGES_DIR = path.join(__dirname, '../../data/images');

const SEED_RECIPES: Array<{
  slug: string;
  title: string;
  description: string;
  cuisineType: string;
  difficulty: Difficulty;
  mealTypes: MealType[];
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string;
}> = [
  {
    slug: 'seed-pizza',
    title: 'Margherita Pizza',
    description: 'Classic Neapolitan pizza with tomato, mozzarella, and fresh basil',
    cuisineType: 'Italian',
    difficulty: 'medium',
    mealTypes: ['dinner'],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Pizza_Margherita_%28%29.JPG/400px-Pizza_Margherita_%28%29.JPG',
  },
  {
    slug: 'seed-sushi',
    title: 'Dragon Roll Sushi',
    description: 'Colourful sushi rolls topped with avocado and tobiko',
    cuisineType: 'Japanese',
    difficulty: 'hard',
    mealTypes: ['dinner'],
    prepTime: 45,
    cookTime: 30,
    servings: 4,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/02/DragonRoll.JPG',
  },
  {
    slug: 'seed-tacos',
    title: 'Street Tacos',
    description: 'Authentic Mexican street tacos with seasoned meat and fresh toppings',
    cuisineType: 'Mexican',
    difficulty: 'easy',
    mealTypes: ['lunch', 'dinner'],
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Tacos_de_maciza_con_chicharron.jpg/400px-Tacos_de_maciza_con_chicharron.jpg',
  },
  {
    slug: 'seed-brownie',
    title: 'Chocolate Brownies',
    description: 'Rich, fudgy chocolate brownies with a crackly top',
    cuisineType: 'American',
    difficulty: 'easy',
    mealTypes: ['dessert'],
    prepTime: 15,
    cookTime: 30,
    servings: 16,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Chocolatebrownie.JPG/400px-Chocolatebrownie.JPG',
  },
  {
    slug: 'seed-pancakes',
    title: 'Silver Dollar Pancakes',
    description: 'Fluffy golden pancakes perfect for a weekend breakfast',
    cuisineType: 'American',
    difficulty: 'easy',
    mealTypes: ['breakfast'],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Silver_dollar_pancakes.JPG/400px-Silver_dollar_pancakes.JPG',
  },
  {
    slug: 'seed-salad',
    title: 'Greek Salad',
    description: 'Fresh cucumber, tomato, olives, and feta with olive oil dressing',
    cuisineType: 'Greek',
    difficulty: 'easy',
    mealTypes: ['lunch'],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Glistrida_Greek_salad.JPG/400px-Glistrida_Greek_salad.JPG',
  },
  {
    slug: 'seed-curry',
    title: 'Indian Vegetable Curry',
    description: 'Fragrant, golden curry with seasonal vegetables and aromatic spices',
    cuisineType: 'Indian',
    difficulty: 'medium',
    mealTypes: ['dinner'],
    prepTime: 15,
    cookTime: 30,
    servings: 6,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Curry_-_Indian_cuisine.jpg',
  },
  {
    slug: 'seed-burger',
    title: 'Classic Burger',
    description: 'Juicy beef patty with all the toppings on a toasted bun',
    cuisineType: 'American',
    difficulty: 'medium',
    mealTypes: ['lunch', 'dinner'],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Bicky_burger.JPG/400px-Bicky_burger.JPG',
  },
];

async function downloadImage(url: string, destPath: string): Promise<void> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: {
      // Wikimedia requires a User-Agent identifying the application
      'User-Agent': 'MealPlannerApp/1.0 (https://github.com/e2kd7n/mealplanner; seed script)',
    },
    timeout: 30000,
  });
  fs.writeFileSync(destPath, response.data);
}

async function main() {
  console.log('🌱 Seeding visual login images and recipes...');

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const recipe of SEED_RECIPES) {
    // Check if this seed recipe already exists
    const existing = await prisma.recipe.findFirst({
      where: { title: recipe.title, source: 'custom' as RecipeSource },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ↷ Skipping (already exists): ${recipe.title}`);
      skipped++;
      continue;
    }

    // Download image to data/images/seed-{slug}.jpg
    const ext = recipe.imageUrl.endsWith('.jpg') || recipe.imageUrl.endsWith('.JPG') ? '.jpg' : '.jpg';
    const filename = `${recipe.slug}${ext}`;
    const localPath = path.join(IMAGES_DIR, filename);
    const localUrl = `/images/${filename}`;

    if (!fs.existsSync(localPath)) {
      try {
        process.stdout.write(`  ↓ Downloading image for ${recipe.title}... `);
        await downloadImage(recipe.imageUrl, localPath);
        console.log('done');
      } catch (err: any) {
        console.log(`FAILED (${err.message}) — recipe will be created without image`);
      }
    } else {
      console.log(`  ✓ Image already downloaded: ${filename}`);
    }

    const imageStored = fs.existsSync(localPath);

    await prisma.recipe.create({
      data: {
        title: recipe.title,
        description: recipe.description,
        source: 'custom' as RecipeSource,
        cuisineType: recipe.cuisineType,
        difficulty: recipe.difficulty,
        mealTypes: recipe.mealTypes as MealType[],
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        kidFriendly: true,
        imageUrl: imageStored ? localUrl : null,
        instructions: [{ step: 1, instruction: 'See recipe details.' }],
        // userId null = system/seed recipe, visible to all users
      },
    });

    console.log(`  ✅ Created: ${recipe.title}${imageStored ? '' : ' (no image)'}`);
    created++;
  }

  console.log(`\n✅ Visual login seed complete — ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
