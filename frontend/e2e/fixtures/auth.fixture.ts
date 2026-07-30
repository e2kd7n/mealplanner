/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, request as playwrightRequest, APIRequestContext, Page } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { authenticatePage, createAuthenticatedApiContext } from '../helpers/api-auth';

type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
  apiContext: APIRequestContext;
};

const AUTH_COOKIE_NAME = 'mealplanner_access';

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Standalone authenticated API request context pointed at the backend.
  // Use this in beforeEach/afterEach to create/delete test data via API
  // without going through the UI.
  //
  // Reuses the browser context's session cookies (set once via storageState
  // for projects that declare it — see playwright.config.ts) instead of
  // logging in again per test. Falls back to a fresh login when no session
  // is present (e.g. projects/specs that don't have storageState configured).
  apiContext: async ({ baseURL, context }, use) => {
    const backendURL = (baseURL || 'http://localhost:5173').replace(':5173', ':3000');
    const cookies = await context.cookies();
    const hasSession = cookies.some((c) => c.name === AUTH_COOKIE_NAME);

    const apiRequestContext = hasSession
      ? await playwrightRequest.newContext({ baseURL: backendURL, storageState: { cookies, origins: [] } })
      : await createAuthenticatedApiContext(backendURL);

    await use(apiRequestContext);
    await apiRequestContext.dispose();
  },

  authenticatedPage: async ({ page, baseURL }, use) => {
    const backendURL = (baseURL || 'http://localhost:5173').replace(':5173', ':3000');
    // page.request shares the browser context cookie store, so the httpOnly
    // auth cookies set by the login response are sent on every subsequent request.
    //
    // If the context already carries a session (from storageState — see
    // playwright.config.ts), there's nothing to log in for. Only fall back
    // to a real API login when no session cookie is present.
    const cookies = await page.context().cookies();
    const hasSession = cookies.some((c) => c.name === AUTH_COOKIE_NAME);
    if (!hasSession) {
      await authenticatePage(page, backendURL);
    }
    await page.goto('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Made with Bob
