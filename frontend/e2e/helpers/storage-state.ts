/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shared Playwright storageState file.
 *
 * Written once by global-setup.ts (a single login) and reused by any
 * Playwright project/spec that needs an already-authenticated session —
 * see the `authenticated-tests` project in playwright.config.ts — instead
 * of every test logging in independently. That per-test login volume is
 * what was tripping the backend's authRateLimiter mid-suite (issue #299).
 *
 * Gitignored (frontend/.gitignore) — contains live session cookies and
 * must never be committed.
 */
export const STORAGE_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');

// Made with Bob
