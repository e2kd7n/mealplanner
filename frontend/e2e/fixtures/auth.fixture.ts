/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { authenticateViaAPI, injectAuthTokens } from '../helpers/api-auth';

type AuthFixtures = {
  authenticatedPage: any;
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page, baseURL }, use) => {
    const backendURL = (baseURL || 'http://localhost:5173').replace(':5173', ':3000');
    const tokens = await authenticateViaAPI(backendURL);

    // Navigate to origin first so storage APIs target the correct origin,
    // then inject accessToken into localStorage and refreshToken into
    // sessionStorage (api.ts reads refreshToken from sessionStorage — not
    // localStorage — so it cannot be seeded via Playwright's storageState).
    await page.goto('/');
    await injectAuthTokens(page, tokens);
    await page.goto('/dashboard');

    await use(page);
  },
});

export { expect } from '@playwright/test';

// Made with Bob
