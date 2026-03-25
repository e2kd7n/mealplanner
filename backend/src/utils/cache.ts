/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import NodeCache from 'node-cache';
import { logger } from './logger';

// Create a single cache instance with default TTL of 10 minutes
let cacheInstance: NodeCache | null = null;

export function initializeCache(): NodeCache {
  if (cacheInstance) {
    return cacheInstance;
  }

  cacheInstance = new NodeCache({
    stdTTL: 600, // 10 minutes default TTL
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false, // Don't clone objects for better performance
    deleteOnExpire: true,
  });

  cacheInstance.on('expired', (key) => {
    logger.debug(`Cache key expired: ${key}`);
  });

  logger.info('In-memory cache initialized successfully');
  return cacheInstance;
}

export function getCacheClient(): NodeCache {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return cacheInstance;
}

export function shutdownCache(): void {
  if (cacheInstance) {
    cacheInstance.flushAll();
    cacheInstance.close();
    cacheInstance = null;
    logger.info('Cache shut down successfully');
  }
}

// Cache helper functions
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getCacheClient();
    const data = client.get<T>(key);
    return data !== undefined ? data : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = 600
): Promise<void> {
  try {
    const client = getCacheClient();
    client.set(key, value, ttlSeconds);
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getCacheClient();
    client.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const client = getCacheClient();
    const keys = client.keys();
    
    // Convert Redis-style pattern to regex
    // * becomes .* and ? becomes .
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    
    const matchingKeys = keys.filter(key => regex.test(key));
    
    if (matchingKeys.length > 0) {
      client.del(matchingKeys);
      logger.debug(`Deleted ${matchingKeys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
  }
}

export default {
  initializeCache,
  getCacheClient,
  shutdownCache,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
};

// Made with Bob