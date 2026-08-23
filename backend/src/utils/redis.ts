/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import Redis from 'ioredis';
import { logger } from './logger';
import { getSecretCached } from './secrets';

/**
 * Redis is provisioned on the Pi production compose (REDIS_HOST/REDIS_PORT env vars,
 * secrets/redis_password.txt) but is intentionally absent from dev — local-run.sh and
 * podman-compose.yml only run Postgres in a container. Callers that need cross-process
 * shared state (e.g. visualAuth's login-challenge store, which must be readable from
 * whichever ClusterHAT Zero W node handles the follow-up request) should go through
 * `getRedisClient()` and fall back to a single-process alternative when it returns null.
 */

let client: Redis | null = null;
let attempted = false;

export function getRedisClient(): Redis | null {
  if (attempted) return client;
  attempted = true;

  if (!process.env.REDIS_HOST) {
    logger.debug('REDIS_HOST not set — Redis-backed features will use their in-memory fallback');
    return null;
  }

  let password: string | undefined;
  try {
    password = getSecretCached('redis_password', 'REDIS_PASSWORD', false, '');
  } catch {
    password = undefined;
  }

  client = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: password || undefined,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    lazyConnect: false,
  });

  client.on('error', (err) => {
    logger.warn('Redis client error — Redis-backed features will fall back where possible', {
      error: err.message,
    });
  });

  return client;
}

export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_HOST;
}
