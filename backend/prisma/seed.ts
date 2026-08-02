/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { seedRecipes } from '../seed-recipes';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
    await seedRecipes(prisma);
  }

  // The visual login picker (/login) lists FamilyMember rows, not User rows
  // directly — without at least one, it finds zero entries and redirects
  // straight to /welcome (fresh-install flow), never actually showing the
  // picker screen e2e tests expect to interact with.
  const familyMemberCount = await prisma.familyMember.count({
    where: { userId: TEST_USER_ID },
  });

  if (familyMemberCount > 0) {
    console.log(`✓ Found ${familyMemberCount} existing family members for test user`);
  } else {
    await prisma.familyMember.create({
      data: {
        userId: TEST_USER_ID,
        name: 'Test User',
        ageGroup: 'adult',
        canCook: true,
        dietaryRestrictions: [],
      },
    });
    console.log('✓ Created family member: Test User');
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