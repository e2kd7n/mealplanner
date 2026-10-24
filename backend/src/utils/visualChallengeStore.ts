/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import crypto from 'crypto';
import { getRedisClient, isRedisConfigured } from './redis';
import { logger } from './logger';

/**
 * Single-use, short-lived server-side record of a visual-login challenge: which
 * family member it was issued for, and which of the images shown was correct.
 *
 * This exists because `visualLogin` used to re-derive "correct" independently from a
 * static table, meaning a caller never actually needed to fetch a challenge at all —
 * it could guess directly against the full fixed image set with no per-attempt
 * randomization. Binding login to a challenge that (a) must have been issued by
 * `getVisualChallenge` first, (b) expires quickly, and (c) can only be consumed once
 * is what makes a wider decoy pool actually raise attacker cost instead of being
 * cosmetic.
 *
 * Backed by Redis when available (required for correctness across the ClusterHAT
 * deployment, where nginx `least_conn` load-balances across independent backend
 * processes with no session affinity — a challenge issued by one node must be
 * readable by whichever node handles the login POST). Falls back to an in-process
 * Map when Redis isn't configured (local dev, which never provisions Redis) or a
 * Redis call fails transiently — correct on a single process, best-effort otherwise.
 */

export interface VisualChallengeRecord {
  memberId: string;
  correctId: string;
}

const CHALLENGE_TTL_SECONDS = 120;
const KEY_PREFIX = 'visual-challenge:';

const memoryStore = new Map<string, { record: VisualChallengeRecord; expiresAt: number }>();

function memoryPrune(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

export async function createVisualChallenge(memberId: string, correctId: string): Promise<string> {
  const challengeId = crypto.randomBytes(24).toString('hex');
  const record: VisualChallengeRecord = { memberId, correctId };
  const key = KEY_PREFIX + challengeId;

  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(record), 'EX', CHALLENGE_TTL_SECONDS);
        return challengeId;
      } catch (err) {
        logger.warn('Redis SET failed for visual-login challenge, falling back to in-memory store', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  memoryPrune();
  memoryStore.set(key, { record, expiresAt: Date.now() + CHALLENGE_TTL_SECONDS * 1000 });
  return challengeId;
}

/** Fetch and delete in one step — a given challenge can be consumed exactly once. */
export async function consumeVisualChallenge(challengeId: string): Promise<VisualChallengeRecord | null> {
  if (!challengeId || typeof challengeId !== 'string') return null;
  const key = KEY_PREFIX + challengeId;

  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const raw = await redis.call('GETDEL', key) as string | null;
        if (raw) return JSON.parse(raw) as VisualChallengeRecord;
        return null;
      } catch (err) {
        logger.warn('Redis GETDEL failed for visual-login challenge, checking in-memory fallback', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  memoryPrune();
  const entry = memoryStore.get(key);
  if (!entry) return null;
  memoryStore.delete(key);
  return entry.expiresAt > Date.now() ? entry.record : null;
}

/**
 * Per-member failed-guess counter. A visual password is one image out of the
 * challenge set (~3 bits), so per-IP rate limiting alone still lets a patient
 * guesser through in minutes; capping wrong answers per *member* bounds that no
 * matter how many devices or backend nodes the guesses are spread across.
 * Shared via Redis for the same cross-node reason as the challenges above.
 */
export const VISUAL_MAX_FAILURES = 3;
const FAILURE_WINDOW_SECONDS = 15 * 60;
const FAILURE_PREFIX = 'visual-failures:';

const failureMemory = new Map<string, { count: number; expiresAt: number }>();

function failureMemoryGet(memberId: string): number {
  const entry = failureMemory.get(memberId);
  if (!entry) return 0;
  if (entry.expiresAt <= Date.now()) {
    failureMemory.delete(memberId);
    return 0;
  }
  return entry.count;
}

/** Record a wrong answer for this member; returns the failure count in the current window. */
export async function recordVisualFailure(memberId: string): Promise<number> {
  const key = FAILURE_PREFIX + memberId;

  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const count = await redis.incr(key);
        // Fixed window from the first failure — later failures don't extend it.
        if (count === 1) await redis.expire(key, FAILURE_WINDOW_SECONDS);
        return count;
      } catch (err) {
        logger.warn('Redis INCR failed for visual-login failure count, falling back to in-memory store', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const count = failureMemoryGet(memberId) + 1;
  const expiresAt = failureMemory.get(memberId)?.expiresAt ?? Date.now() + FAILURE_WINDOW_SECONDS * 1000;
  failureMemory.set(memberId, { count, expiresAt });
  return count;
}

/** True once a member has hit VISUAL_MAX_FAILURES wrong answers in the current window. */
export async function isVisualLoginLocked(memberId: string): Promise<boolean> {
  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const raw = await redis.get(FAILURE_PREFIX + memberId);
        return Number(raw || 0) >= VISUAL_MAX_FAILURES;
      } catch (err) {
        logger.warn('Redis GET failed for visual-login failure count, checking in-memory fallback', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return failureMemoryGet(memberId) >= VISUAL_MAX_FAILURES;
}

/** Clear a member's failure count after a successful login. */
export async function clearVisualFailures(memberId: string): Promise<void> {
  failureMemory.delete(memberId);
  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(FAILURE_PREFIX + memberId);
      } catch (err) {
        logger.warn('Redis DEL failed for visual-login failure count', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
