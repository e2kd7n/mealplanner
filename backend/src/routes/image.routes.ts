/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Router } from 'express';
import { proxyImage } from '../controllers/image.controller';

const router: Router = Router();

/**
 * @route   GET /api/images/proxy
 * @desc    Proxy external images to avoid CORS issues
 * @access  Public
 * @query   url - The external image URL to proxy
 */
router.get('/proxy', proxyImage);

export default router;

// Made with Bob
