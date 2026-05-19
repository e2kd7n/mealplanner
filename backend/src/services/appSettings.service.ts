/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: string | null;
  expiresAt: number;
}

const KNOWN_SETTINGS: Array<{
  key: string;
  value: string | null;
  isSecret: boolean;
  description: string;
}> = [
  {
    key: 'spoonacular_api_key',
    value: null,
    isSecret: true,
    description: 'Spoonacular API key for recipe browsing and nutrition data',
  },
  {
    key: 'edamam_app_id',
    value: null,
    isSecret: false,
    description: 'Edamam Application ID for nutrition analysis (not yet active)',
  },
  {
    key: 'edamam_app_key',
    value: null,
    isSecret: true,
    description: 'Edamam Application Key for nutrition analysis (not yet active)',
  },
  {
    key: 'ftue_completed',
    value: 'false',
    isSecret: false,
    description: 'Whether the first-time setup wizard has been completed',
  },
];

const ENV_FALLBACKS: Record<string, string | undefined> = {
  spoonacular_api_key: process.env.SPOONACULAR_API_KEY,
  edamam_app_id: process.env.EDAMAM_APP_ID,
  edamam_app_key: process.env.EDAMAM_APP_KEY,
};

class AppSettingsService {
  private cache = new Map<string, CacheEntry>();

  async initialize(): Promise<void> {
    try {
      for (const setting of KNOWN_SETTINGS) {
        const envValue = ENV_FALLBACKS[setting.key] || null;
        await prisma.appSetting.upsert({
          where: { key: setting.key },
          create: {
            key: setting.key,
            value: envValue ?? setting.value,
            isSecret: setting.isSecret,
            description: setting.description,
          },
          update: {},
        });
        // If an env var is now present but the DB row still has null, write it in.
        // This handles the case where the env var was added after the row was first created.
        // Does not overwrite values that were set through the admin UI.
        if (envValue) {
          await prisma.appSetting.updateMany({
            where: { key: setting.key, value: null },
            data: { value: envValue },
          });
        }
      }
      logger.info('App settings initialized');
    } catch (error) {
      logger.error('Failed to initialize app settings:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    try {
      const setting = await prisma.appSetting.findUnique({ where: { key } });
      const value = setting?.value ?? ENV_FALLBACKS[key] ?? null;
      this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (error) {
      logger.error(`Failed to get setting ${key}:`, error);
      return ENV_FALLBACKS[key] ?? null;
    }
  }

  async set(key: string, value: string | null, updatedBy?: string): Promise<void> {
    const known = KNOWN_SETTINGS.find((s) => s.key === key);
    await prisma.appSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        isSecret: known?.isSecret ?? false,
        description: known?.description ?? null,
        updatedBy: updatedBy ?? null,
      },
      update: { value, updatedBy: updatedBy ?? null },
    });
    this.cache.delete(key);
  }

  async getAll(): Promise<
    Array<{
      key: string;
      value: string | null;
      isSecret: boolean;
      description: string | null;
      updatedAt: Date;
      isConfigured: boolean;
    }>
  > {
    const settings = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
    return settings.map((s) => {
      const effectiveValue = s.value ?? ENV_FALLBACKS[s.key] ?? null;
      return {
        key: s.key,
        value: s.isSecret && effectiveValue ? '••••••••' : effectiveValue,
        isSecret: s.isSecret,
        description: s.description,
        updatedAt: s.updatedAt,
        isConfigured: !!effectiveValue,
      };
    });
  }

  async isConfigured(key: string): Promise<boolean> {
    const value = await this.get(key);
    return !!value;
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const appSettingsService = new AppSettingsService();
