/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_USER_ID = 'test-user-00-0000-0000-000000000001';

async function main() {
  console.log('🌱 Seeding database for E2E tests...');

  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (existingUser) {
    console.log('✓ Test user already exists, skipping user creation');
  } else {
    // Create test user (password: TestPass123!)
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    
    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: 'test@example.com',
        passwordHash,
        familyName: 'Test Family',
        role: 'user',
        isBlocked: false,
      },
    });
    console.log('✓ Created test user: test@example.com');
  }

  // Check if recipes already exist
  const recipeCount = await prisma.recipe.count({
    where: { userId: TEST_USER_ID },
  });

  if (recipeCount > 0) {
    console.log(`✓ Found ${recipeCount} existing recipes for test user`);
  } else {
    console.log('✓ No recipes found, they will be created by seed-recipes.ts if needed');
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Made with Bob