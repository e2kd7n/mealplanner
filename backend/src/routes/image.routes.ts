/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import { proxyImage, uploadImage, deleteImage } from '../controllers/image.controller';
import { authenticate } from '../middleware/auth';
import { UPLOADS_DIR } from '../utils/imageStorage';

const router: Router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Temporary upload directory; the controller validates and moves the file
    fs.mkdir(UPLOADS_DIR, { recursive: true }, (err) => cb(err, UPLOADS_DIR));
  },
  filename: (_req, _file, cb) => {
    // Never reuse the client's filename — it's untrusted input
    cb(null, `upload-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

/**
 * @route   GET /api/images/proxy
 * @desc    Proxy external images to avoid CORS issues
 * @access  Private
 * @query   url - The external image URL to proxy
 */
router.get('/proxy', authenticate, proxyImage);

/**
 * @route   POST /api/images/upload
 * @desc    Upload an image file
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('image'), uploadImage);

/**
 * @route   DELETE /api/images/:filename
 * @desc    Delete an uploaded image
 * @access  Private
 */
router.delete('/:filename', authenticate, deleteImage);

export default router;
