/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { getDatabaseUrl } from './secrets';

// Set DATABASE_URL from secrets before Prisma initializes
if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = getDatabaseUrl();
    logger.info('DATABASE_URL constructed from secrets');
  } catch (error) {
    logger.error('Failed to construct DATABASE_URL from secrets:', error);
    throw error;
  }
}

// Singleton pattern for Prisma Client with performance optimizations
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Log database connection
prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
});

export default prisma;

// Made with Bob
