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
  
  /* Global setup to authenticate once and save session state */
  globalSetup: './e2e/global-setup.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Run tests sequentially to avoid rate limiting on auth endpoints */
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
    baseURL: process.env.BASE_URL || 'http://localhost:5174',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - runs first to create auth state
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    
    // Auth tests - run without saved session state
    {
      name: 'auth-tests',
      testMatch: /.*auth.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // No storageState - tests login flow from scratch
      },
      dependencies: ['setup'],
    },
    
    // Authenticated tests - use saved session state
    {
      name: 'authenticated-tests',
      testMatch: /.*\/(recipes|meal-plan|grocery|pantry)\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /* Use saved authentication state */
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Firefox and WebKit temporarily disabled to focus on Chromium stability
    // Re-enable after implementing:
    // 1. Session reuse pattern (reduces auth load)
    // 2. API authentication (bypasses UI)
    // 3. Browser-specific wait strategies
    // See E2E_TESTING_IMPROVEMENT_ROADMAP.md for details
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});

// Made with Bob