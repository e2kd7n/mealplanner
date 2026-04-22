/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
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
  const { url } = req.query;
  
  try {
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

    // Fetch the image from the external source with retry logic
    let lastError: any;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 8000, // 8 second timeout (reduced from 10s)
          maxContentLength: 10 * 1024 * 1024, // 10MB max
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MealPlannerBot/1.0)',
            'Accept': 'image/*',
          },
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        });

        // Handle non-2xx responses
        if (response.status >= 400) {
          throw new AppError(`Image source returned ${response.status}`, response.status);
        }

        // Get content type from response or default to image/jpeg
        const contentType = response.headers['content-type'];
        const contentTypeStr = typeof contentType === 'string' ? contentType : 'image/jpeg';

        // Validate it's an image
        if (!contentTypeStr.startsWith('image/')) {
          throw new AppError('URL does not point to an image', 400);
        }

        // Set appropriate headers with longer cache for successful images
        res.set({
          'Content-Type': contentTypeStr,
          'Cache-Control': 'public, max-age=604800', // Cache for 7 days (increased from 24h)
          'Access-Control-Allow-Origin': '*', // Allow CORS
          'X-Image-Proxy': 'success',
        });

        // Send the image data
        res.send(Buffer.from(response.data));
        return;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries && (!axios.isAxiosError(err) || err.code === 'ECONNABORTED')) {
          // Retry on timeout or network errors, but not on 4xx/5xx responses
          logger.info(`Retry attempt ${attempt + 1} for image: ${url}`);
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))); // Exponential backoff
          continue;
        }
        break;
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  } catch (err: any) {
    if (err instanceof AppError) {
      next(err);
      return;
    }

    if (axios.isAxiosError(err)) {
      const requestUrl = typeof url === 'string' ? url : 'unknown';
      
      if (err.code === 'ECONNABORTED') {
        logger.warn(`Image fetch timeout after retries: ${requestUrl}`);
        next(new AppError('Image fetch timeout', 504));
      } else if (err.response) {
        // Don't log 404s as errors - they're expected for expired/invalid URLs
        const status = err.response.status;
        if (status !== 404) {
          logger.warn(`Failed to fetch image from ${requestUrl}: ${status}`);
        }
        // Return appropriate status code
        next(new AppError(`Failed to fetch image: ${err.response.statusText || status}`, status >= 500 ? 502 : status));
      } else {
        logger.warn(`Failed to fetch image from ${requestUrl}: ${err.message}`);
        next(new AppError('Failed to fetch image from external source', 502));
      }
      return;
    }

    logger.error('Image proxy error:', err);
    next(new AppError('Failed to proxy image', 500));
  }
};

/**
 * Upload image file
 * POST /api/images/upload
 */
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    const file = req.file;
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      // Delete the uploaded file
      await fs.unlink(file.path);
      throw new AppError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      await fs.unlink(file.path);
      throw new AppError('File too large. Maximum size is 5MB', 400);
    }

    // Generate a unique filename
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const newFilename = `recipe-${timestamp}-${randomStr}${ext}`;
    
    // Move file to images directory
    const imagesDir = path.join(process.cwd(), '..', 'data', 'images');
    const newPath = path.join(imagesDir, newFilename);
    
    // Ensure images directory exists
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Move the file
    await fs.rename(file.path, newPath);

    // Return the image URL
    const imageUrl = `/images/${newFilename}`;
    
    logger.info(`Image uploaded successfully: ${newFilename}`);

    res.status(201).json({
      success: true,
      data: {
        imageUrl,
        filename: newFilename,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (err: any) {
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        logger.error('Failed to clean up uploaded file:', unlinkErr);
      }
    }

    if (err instanceof AppError) {
      next(err);
      return;
    }

    logger.error('Image upload error:', err);
    next(new AppError('Failed to upload image', 500));
  }
};

/**
 * Delete uploaded image
 * DELETE /api/images/:filename
 */
export const deleteImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename } = req.params;

    // Validate filename (prevent directory traversal)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      throw new AppError('Invalid filename', 400);
    }

    const imagesDir = path.join(process.cwd(), '..', 'data', 'images');
    const filenameStr = Array.isArray(filename) ? filename[0] : filename;
    const filePath = path.join(imagesDir, filenameStr);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('Image not found', 404);
    }

    // Delete the file
    await fs.unlink(filePath);

    logger.info(`Image deleted successfully: ${filenameStr}`);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      next(err);
      return;
    }

    logger.error('Image deletion error:', err);
    next(new AppError('Failed to delete image', 500));
  }
};

// Made with Bob
