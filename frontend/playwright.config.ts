/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { defineConfig, devices } from '@playwright/test';

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
    // Auth tests — run without saved session state (test the login flow itself)
    {
      name: 'auth-tests',
      testMatch: /.*auth.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Authenticated tests — each test authenticates via API in its fixture/beforeEach
    {
      name: 'authenticated-tests',
      testMatch: /.*\/(recipes|meal-plan|grocery|pantry|accessibility)\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
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
