/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { chromium, FullConfig } from '@playwright/test';
import { createAuthStorageState } from './helpers/api-auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global setup for E2E tests
 * Uses API authentication to create session state for reuse across all tests
 * This eliminates rate limiting issues and speeds up test execution
 *
 * Issue #137: API authentication bypasses UI login
 * Issue #136: Session reuse pattern implemented
 * Issue #139: Configurable authentication delay
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const storageStatePath = 'e2e/.auth/user.json';
  
  // Issue #139: Configurable authentication delay (default 10s, can be overridden)
  const authDelayMs = parseInt(process.env.AUTH_DELAY_MS || '10000', 10);

  console.log('🔐 Global Setup: Authenticating via API...');
  console.log(`⏳ Waiting ${authDelayMs / 1000} seconds to avoid rate limiting from previous test runs...`);
  
  // Wait to avoid rate limiting from previous test runs
  await new Promise(resolve => setTimeout(resolve, authDelayMs));

  try {
    // Issue #137: Use API authentication instead of UI login
    console.log('🔑 Authenticating via API (bypassing UI login)...');
    const backendURL = baseURL?.replace(':5173', ':3000') || 'http://localhost:3000';
    
    const storageState = await createAuthStorageState(
      backendURL,
      'test@example.com',
      'TestPass123!'
    );

    // Ensure .auth directory exists
    const authDir = path.dirname(storageStatePath);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save storage state to file
    fs.writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2));

    console.log('✅ Global Setup: API authentication successful');
    console.log('✅ Session state saved to', storageStatePath);
    
    // Verify the session by loading a page with the auth state
    console.log('🔍 Verifying session state...');
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: storageStatePath });
    const page = await context.newPage();
    
    try {
      await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
      console.log('✅ Session verification successful - dashboard loaded');
    } catch (verifyError) {
      console.warn('⚠️  Session verification failed, but continuing:', verifyError);
    } finally {
      await browser.close();
    }
    
  } catch (error) {
    console.error('❌ Global Setup: API authentication failed', error);
    
    // Fallback to UI login if API auth fails
    console.log('⚠️  Falling back to UI login...');
    await fallbackUILogin(config, storageStatePath);
  }
}

/**
 * Fallback to UI login if API authentication fails
 * This ensures tests can still run even if the API auth has issues
 */
async function fallbackUILogin(config: FullConfig, storageStatePath: string) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📍 Navigating to login page...');
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

    console.log('📝 Filling in credentials...');
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPass123!');

    console.log('🔑 Clicking login button...');
    const loginButton = page.getByRole('button', { name: /^sign in$/i });
    await loginButton.click();
    
    console.log('⏳ Waiting for dashboard redirect...');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Wait for any async operations to complete
    await page.waitForTimeout(2000);

    // Save authenticated state
    await context.storageState({ path: storageStatePath });

    console.log('✅ Fallback UI login successful');
  } catch (error) {
    console.error('❌ Fallback UI login failed', error);
    
    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: 'e2e/.auth/login-failure.png', fullPage: true });
      console.log('📸 Screenshot saved to e2e/.auth/login-failure.png');
    } catch (screenshotError) {
      console.error('Failed to take screenshot:', screenshotError);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

// Made with Bob