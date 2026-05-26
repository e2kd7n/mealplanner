/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, request as playwrightRequest, APIRequestContext, Page } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { authenticatePage } from '../helpers/api-auth';

type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
  apiContext: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Standalone authenticated API request context pointed at the backend.
  // Use this in beforeEach/afterEach to create/delete test data via API
  // without going through the UI.
  apiContext: async ({ baseURL }, use) => {
    const backendURL = (baseURL || 'http://localhost:5173').replace(':5173', ':3000');
    const context = await playwrightRequest.newContext({ baseURL: backendURL });
    const resp = await context.post('/api/auth/login', {
      data: { email: 'test@example.com', password: 'TestPass123!' },
    });
    if (!resp.ok()) {
      await context.dispose();
      throw new Error(`apiContext login failed: ${resp.status()} ${await resp.text()}`);
    }
    await use(context);
    await context.dispose();
  },

  authenticatedPage: async ({ page, baseURL }, use) => {
    const backendURL = (baseURL || 'http://localhost:5173').replace(':5173', ':3000');
    // page.request shares the browser context cookie store, so the httpOnly
    // auth cookies set by the login response are sent on every subsequent request.
    await authenticatePage(page, backendURL);
    await page.goto('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Made with Bob
