/**
 * Copyright (c) 2026 e2kd7n
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

// Enhanced Prisma configuration with connection pooling and retry logic
// Connection pool settings are configured via DATABASE_URL query parameters:
// - connection_limit: Maximum number of connections in the pool (default: num_cpus * 2 + 1)
// - pool_timeout: Seconds to wait for a connection from the pool (default: 10)
// Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30
const prismaConfig = {
  log: (process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['query', 'error', 'warn']) as Array<'query' | 'info' | 'warn' | 'error'>,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient(prismaConfig);
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
      } catch (reconnectError) {
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
