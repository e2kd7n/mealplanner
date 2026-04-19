/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { proxyImage, uploadImage, deleteImage } from '../controllers/image.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Temporary upload directory
    cb(null, path.join(process.cwd(), '..', 'data', 'uploads'));
  },
  filename: (_req, file, cb) => {
    // Use original filename with timestamp prefix
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${timestamp}-${basename}${ext}`);
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
 * @access  Public
 * @query   url - The external image URL to proxy
 */
router.get('/proxy', proxyImage);

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

// Made with Bob
