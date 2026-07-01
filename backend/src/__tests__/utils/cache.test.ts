import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeCache,
  getCacheClient,
  shutdownCache,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
} from '../../utils/cache';

describe('Cache utility', () => {
  beforeEach(() => {
    initializeCache();
  });

  afterEach(() => {
    shutdownCache();
  });

  describe('initializeCache', () => {
    it('returns a cache instance', () => {
      const cache = initializeCache();
      expect(cache).toBeDefined();
    });

    it('returns the same instance on repeated calls', () => {
      const cache1 = initializeCache();
      const cache2 = initializeCache();
      expect(cache1).toBe(cache2);
    });
  });

  describe('getCacheClient', () => {
    it('returns initialized cache', () => {
      const client = getCacheClient();
      expect(client).toBeDefined();
    });

    it('throws if cache not initialized', () => {
      shutdownCache();
      expect(() => getCacheClient()).toThrow('Cache not initialized');
    });
  });

  describe('cacheGet / cacheSet', () => {
    it('stores and retrieves a value', async () => {
      await cacheSet('test-key', { data: 'hello' });
      const result = await cacheGet<{ data: string }>('test-key');
      expect(result).toEqual({ data: 'hello' });
    });

    it('returns null for missing key', async () => {
      const result = await cacheGet('nonexistent');
      expect(result).toBeNull();
    });

    it('stores values with custom TTL', async () => {
      await cacheSet('short-ttl', 'value', 1);
      const result = await cacheGet('short-ttl');
      expect(result).toBe('value');
    });

    it('stores various data types', async () => {
      await cacheSet('string', 'hello');
      await cacheSet('number', 42);
      await cacheSet('array', [1, 2, 3]);

      expect(await cacheGet('string')).toBe('hello');
      expect(await cacheGet('number')).toBe(42);
      expect(await cacheGet('array')).toEqual([1, 2, 3]);
    });
  });

  describe('cacheDel', () => {
    it('deletes an existing key', async () => {
      await cacheSet('to-delete', 'value');
      await cacheDel('to-delete');
      const result = await cacheGet('to-delete');
      expect(result).toBeNull();
    });

    it('does not throw when deleting nonexistent key', async () => {
      await expect(cacheDel('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('cacheDelPattern', () => {
    it('deletes keys matching a pattern', async () => {
      await cacheSet('recipe:1', 'data1');
      await cacheSet('recipe:2', 'data2');
      await cacheSet('user:1', 'data3');

      await cacheDelPattern('recipe:*');

      expect(await cacheGet('recipe:1')).toBeNull();
      expect(await cacheGet('recipe:2')).toBeNull();
      expect(await cacheGet('user:1')).toBe('data3');
    });

    it('handles no matching keys gracefully', async () => {
      await cacheSet('foo', 'bar');
      await expect(cacheDelPattern('nonexistent:*')).resolves.toBeUndefined();
      expect(await cacheGet('foo')).toBe('bar');
    });
  });

  describe('shutdownCache', () => {
    it('clears all data and closes cache', () => {
      shutdownCache();
      expect(() => getCacheClient()).toThrow();
    });

    it('is idempotent', () => {
      shutdownCache();
      expect(() => shutdownCache()).not.toThrow();
    });
  });
});
