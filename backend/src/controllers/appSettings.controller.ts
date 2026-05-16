/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response } from 'express';
import axios from 'axios';
import { appSettingsService } from '../services/appSettings.service';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

const ALLOWED_KEYS = new Set([
  'spoonacular_api_key',
  'edamam_app_id',
  'edamam_app_key',
  'ftue_completed',
]);

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await appSettingsService.getAll();
    return res.json({ success: true, data: settings });
  } catch (error: any) {
    logger.error('Failed to get settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings' });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;

    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ success: false, message: `Unknown setting: ${key}` });
    }

    if (value !== null && value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ success: false, message: 'Value must be a string or null' });
    }

    await appSettingsService.set(key, value || null, req.user?.userId as string | undefined);
    logger.info(`Setting updated: ${key} by user ${req.user?.userId}`);
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to update setting:', error);
    return res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
};

export const getSetupStatus = async (req: Request, res: Response) => {
  try {
    const ftueCompleted = await appSettingsService.get('ftue_completed');
    const userId = (req as any).user?.userId;
    let isAdmin = false;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    }

    return res.json({ ftueComplete: ftueCompleted === 'true', isAdmin });
  } catch (error: any) {
    logger.error('Failed to get setup status:', error);
    return res.status(500).json({ success: false, message: 'Failed to get setup status' });
  }
};

export const testSpoonacularKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, message: 'API key is required' });
    }

    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: { apiKey: key, query: 'pasta', number: 1 },
      timeout: 8000,
    });

    if (response.status === 200) {
      return res.json({ success: true, message: 'API key is valid' });
    }
    return res.status(400).json({ success: false, message: 'Unexpected response from Spoonacular' });
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return res.status(400).json({ success: false, message: 'Invalid API key' });
    }
    if (status === 402) {
      return res.status(400).json({ success: false, message: 'API quota exceeded — key is valid but out of credits' });
    }
    logger.error('Spoonacular key test failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not reach Spoonacular to verify key' });
  }
};
