/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './e2e/helpers/storage-state';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* Global setup to verify backend is reachable before running tests */
  globalSetup: './e2e/global-setup.ts',

  /* Run tests sequentially to avoid auth rate limiting */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Sequential execution to avoid triggering auth rate limits */
  workers: 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth tests — the login UI flow itself is under test here, so this
    // project intentionally runs without a saved session state (real
    // per-test login through the form). Low volume (a handful of tests),
    // so it doesn't meaningfully contribute to authRateLimiter pressure.
    {
      name: 'auth-tests',
      testMatch: /.*\/auth\/login\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Authenticated tests — session is authenticated ONCE in global-setup.ts
    // and reused via storageState, instead of every test logging in
    // independently (that per-test login volume is what tripped the
    // authRateLimiter mid-suite — see issue #299). This also covers
    // auth/logout.spec.ts: those tests need to START already authenticated
    // (logging out is what's under test, not logging in), but their
    // per-test API login is no longer necessary once storageState covers it.
    // Specs/blocks that need to start unauthenticated despite living under
    // this project (e.g. the "Unauthenticated" describe in
    // browse-recipes.spec.ts, or the unauthenticated-page checks in
    // a11y.spec.ts) opt out locally with
    // `test.use({ storageState: { cookies: [], origins: [] } })`.
    {
      name: 'authenticated-tests',
      testMatch: [
        /.*\/(recipes|meal-plan|grocery|pantry|accessibility)\/.*\.spec\.ts/,
        /.*\/auth\/logout\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_PATH,
      },
    },

    // FTUE design audit — screenshots every onboarding screen, validates known issues
    // Run: BASE_URL=http://192.168.4.110 FTUE_EMAIL=... FTUE_PASSWORD=... npx playwright test --project=ftue-audit
    // Skips globalSetup since FTUE tests handle their own auth and test pre-auth flows.
    {
      name: 'ftue-audit',
      testMatch: /.*\/ftue\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'on',
        trace: 'on',
      },
    },
  ],
});

// Made with Bob
