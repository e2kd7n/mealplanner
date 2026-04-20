/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

/**
 * Custom fixtures for authentication
 * Uses saved session state from global setup for authenticated tests
 * Login page helper available for auth-specific tests
 */

type AuthFixtures = {
  authenticatedPage: any;
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  authenticatedPage: async ({ page }, use) => {
    // Session state is loaded automatically from playwright.config.ts
    // No need to login - just navigate to the app
    await page.goto('/dashboard');
    
    // Provide authenticated page to test
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Made with Bob