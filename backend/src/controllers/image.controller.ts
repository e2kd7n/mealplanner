/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Proxy external images to avoid CORS issues
 * GET /api/images/proxy?url=<encoded_url>
 */
export const proxyImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      throw new AppError('Image URL is required', 400);
    }

    // Validate URL format
    let imageUrl: URL;
    try {
      imageUrl = new URL(url);
    } catch (err) {
      throw new AppError('Invalid image URL format', 400);
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      throw new AppError('Only HTTP and HTTPS URLs are allowed', 400);
    }

    logger.info(`Proxying image from: ${url}`);

    // Fetch the image from the external source
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MealPlannerBot/1.0)',
      },
    });

    // Get content type from response or default to image/jpeg
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Validate it's an image
    if (!contentType.startsWith('image/')) {
      throw new AppError('URL does not point to an image', 400);
    }

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*', // Allow CORS
    });

    // Send the image data
    res.send(Buffer.from(response.data));
  } catch (err: any) {
    if (err instanceof AppError) {
      next(err);
      return;
    }

    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        next(new AppError('Image fetch timeout', 504));
      } else if (err.response) {
        next(new AppError(`Failed to fetch image: ${err.response.status}`, 502));
      } else {
        next(new AppError('Failed to fetch image from external source', 502));
      }
      return;
    }

    logger.error('Image proxy error:', err);
    next(new AppError('Failed to proxy image', 500));
  }
};

// Made with Bob
