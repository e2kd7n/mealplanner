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
  console.log('⏳ Waiting 20 seconds to avoid rate limiting from previous test runs...');
  
  // Wait to avoid rate limiting from previous test runs
  await new Promise(resolve => setTimeout(resolve, 20000));

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  // Capture page errors
  page.on('pageerror', error => console.error('BROWSER ERROR:', error));
  
  // Track network requests
  const requests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      requests.push(`${request.method()} ${url}`);
      console.log('API REQUEST:', request.method(), url);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      console.log('API RESPONSE:', response.status(), url);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log('ERROR RESPONSE BODY:', body);
        } catch (e) {
          console.log('Could not read error response body');
        }
      }
    }
  });

  try {
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Fill in credentials
    console.log('📝 Filling in credentials...');
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPass123!');
    
    console.log('✓ Credentials filled');

    // Find and click the correct login button (not the test login button)
    console.log('🔑 Clicking login button...');
    const loginButton = page.getByRole('button', { name: /^sign in$/i });
    await loginButton.click();
    
    console.log('✓ Login button clicked');
    console.log('📡 API requests made:', requests.length);
    
    // Wait for navigation with increased timeout
    console.log('⏳ Waiting for dashboard redirect...');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(2000);

    // Save authenticated state
    await context.storageState({ path: storageStatePath });

    console.log('✅ Global Setup: Session state saved successfully');
  } catch (error) {
    console.error('❌ Global Setup: Authentication failed', error);
    console.error('Current URL:', page.url());
    
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