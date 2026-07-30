/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from './logger';
import { getDatabaseUrl } from './secrets';

// Set DATABASE_URL from secrets before Prisma initializes
if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = getDatabaseUrl();
    logger.info('DATABASE_URL constructed from secrets');
  } catch (error: unknown) {
    logger.error('Failed to construct DATABASE_URL from secrets:', error);
    throw error;
  }
}

// Singleton pattern for Prisma Client with performance optimizations
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Driver-adapter Prisma configuration: the client talks to Postgres through
// the `pg` driver instead of Prisma's own native query-engine binary, which
// has no published build for the ClusterHAT Zero W's 32-bit ARMv6 (#281).
// Pool sizing is now controlled by pg.Pool options (max/idleTimeoutMillis),
// not the old `?connection_limit=&pool_timeout=` DATABASE_URL query params.
function makePrisma(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  return new PrismaClient({
    adapter,
    log: (process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['query', 'error', 'warn']) as Array<'query' | 'info' | 'warn' | 'error'>,
  });
}

if (process.env.NODE_ENV === 'production') {
  prisma = makePrisma();
} else {
  if (!global.__prisma) {
    global.__prisma = makePrisma();
  }
  prisma = global.__prisma;
}

/**
 * Retry database operations with exponential backoff
 * Handles transient connection errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (connection issues)
      const isRetryable =
        error?.code === 'P1001' || // Can't reach database server
        error?.code === 'P1002' || // Database server timeout
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P1017' || // Server has closed the connection
        error?.message?.includes('Server has closed the connection') ||
        error?.message?.includes('Connection terminated unexpectedly');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      logger.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`, {
        error: error.message,
        code: error.code,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try to reconnect
      try {
        await prisma.$connect();
      } catch (_reconnectError) {
        logger.debug('Reconnection attempt failed, will retry operation');
      }
    }
  }
  
  throw lastError;
}

// Log database connection
prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error: unknown) => {
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
