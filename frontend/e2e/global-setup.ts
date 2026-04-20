/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Authenticates once and saves session state for reuse across all tests
 * This eliminates rate limiting issues by reducing auth requests from 33 to 1 per test run
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const storageStatePath = 'e2e/.auth/user.json';

  console.log('🔐 Global Setup: Authenticating and saving session state...');
  console.log('⏳ Waiting 15 seconds to avoid rate limiting from previous test runs...');
  
  // Wait to avoid rate limiting from previous test runs
  await new Promise(resolve => setTimeout(resolve, 15000));

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPass123!');

    // Click login button and wait for navigation
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(2000);

    // Save authenticated state
    await context.storageState({ path: storageStatePath });

    console.log('✅ Global Setup: Session state saved successfully');
  } catch (error) {
    console.error('❌ Global Setup: Authentication failed', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

// Made with Bob