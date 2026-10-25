/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { IMAGES_DIR, detectImageType, readFileHead, moveFile } from '../utils/imageStorage';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { sanitizeUrl } from '../utils/sanitize';
import { safeFetch, SafeFetchError } from '../utils/safeFetch';
import prisma from '../utils/prisma';

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
    } catch (_err) {
      throw new AppError('Invalid image URL format', 400);
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      throw new AppError('Only HTTP and HTTPS URLs are allowed', 400);
    }

    // Block private/internal IPs (SSRF protection). This is a syntactic pre-filter only —
    // safeFetch below re-resolves and re-validates the IP address on every hop, including
    // redirects, immediately before connecting. That's what actually closes DNS-rebinding
    // and redirect-based SSRF; this check just rejects the obvious cases early.
    if (!sanitizeUrl(url)) {
      throw new AppError('URL points to a disallowed host', 400);
    }

    logger.info(`Proxying image from: ${url}`);

    // Fetch the image from the external source with retry logic
    let lastError: any;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await safeFetch(url, {
          timeoutMs: 8000, // 8 second timeout
          maxBytes: 10 * 1024 * 1024, // 10MB max
          headers: { Accept: 'image/*' },
        });

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
        res.send(response.buffer);
        return;
      } catch (err: any) {
        lastError = err;
        // Never retry our own validation failures (e.g. non-image content-type,
        // disallowed host) — only retry genuinely transient network errors.
        if (err instanceof AppError) break;
        const transient = err instanceof SafeFetchError && /timeout|ECONNRESET|ENOTFOUND/.test(err.message);
        if (attempt < maxRetries && transient) {
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

    if (err instanceof SafeFetchError) {
      const requestUrl = typeof url === 'string' ? url : 'unknown';
      const httpMatch = err.message.match(/^HTTP (\d+)$/);

      if (err.message.includes('timeout')) {
        logger.warn(`Image fetch timeout after retries: ${requestUrl}`);
        next(new AppError('Image fetch timeout', 504));
      } else if (httpMatch) {
        const status = Number(httpMatch[1]);
        // Don't log 404s as errors - they're expected for expired/invalid URLs
        if (status !== 404) {
          logger.warn(`Failed to fetch image from ${requestUrl}: ${status}`);
        }
        next(new AppError(`Failed to fetch image: HTTP ${status}`, status >= 500 ? 502 : status));
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

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new AppError('File too large. Maximum size is 5MB', 400);
    }

    // Validate by content, not by the client's Content-Type or filename —
    // both are attacker-controlled (see detectImageType). The extension comes
    // from what the bytes actually are, so nothing but these four image types
    // can ever be written into the directory nginx serves.
    const detected = detectImageType(await readFileHead(file.path));
    if (!detected) {
      throw new AppError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed', 400);
    }

    const newFilename = `recipe-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${detected.ext}`;
    const newPath = path.join(IMAGES_DIR, newFilename);

    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await moveFile(file.path, newPath);

    // Return the image URL
    const imageUrl = `/images/${newFilename}`;
    
    logger.info(`Image uploaded successfully: ${newFilename}`);

    res.status(201).json({
      success: true,
      data: {
        imageUrl,
        filename: newFilename,
        size: file.size,
        mimeType: detected.mime,
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
    const filenameStr = Array.isArray(filename) ? filename[0] : filename;

    // Plain filenames only — no separators (either slash), no dot-dot, no NUL.
    if (!filenameStr || !/^[A-Za-z0-9._-]+$/.test(filenameStr) || filenameStr.includes('..')) {
      throw new AppError('Invalid filename', 400);
    }

    const filePath = path.join(IMAGES_DIR, filenameStr);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('Image not found', 404);
    }

    // Enforce ownership: only the recipe owner (or an admin) may delete an image.
    // If no recipe references the file it is orphaned (recipe was deleted after
    // upload) — allow any authenticated user to delete it so orphans don't
    // accumulate indefinitely.
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    if (!isAdmin) {
      const anyRecipe = await prisma.recipe.findFirst({
        where: { imageUrl: `/images/${filenameStr}` },
        select: { id: true, userId: true },
      });
      if (anyRecipe && anyRecipe.userId !== userId) {
        throw new AppError('Forbidden', 403);
      }
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
