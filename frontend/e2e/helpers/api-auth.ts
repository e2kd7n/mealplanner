/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { request, APIRequestContext, Page } from '@playwright/test';

/**
 * API Authentication Helper
 * Authenticates against the backend API using httpOnly cookies.
 * The app uses cookie-based auth (mealplanner_access / mealplanner_refresh),
 * not localStorage tokens.
 */

export interface AuthUser {
  id: string;
  email: string;
  familyName: string;
  role: string;
}

export const DEFAULT_TEST_EMAIL = 'test@example.com';
export const DEFAULT_TEST_PASSWORD = 'TestPass123!';

/**
 * Authenticate a Playwright page via the login API.
 * Uses page.request which shares the browser context's cookie store, so
 * cookies set by the response are automatically sent on subsequent page
 * requests (including the bootstrapAuth call on /api/auth/me).
 *
 * Prefer reusing the shared storageState (see storage-state.ts) over calling
 * this per test — it exists as a fallback for specs/projects that
 * intentionally don't have a storageState configured (e.g. the login flow
 * itself is under test).
 */
export async function authenticatePage(
  page: Page,
  backendURL: string,
  email = DEFAULT_TEST_EMAIL,
  password = DEFAULT_TEST_PASSWORD
): Promise<AuthUser> {
  const response = await page.request.post(`${backendURL}/api/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed: ${response.status()} - ${body}`);
  }

  const data = await response.json();
  return data.user as AuthUser;
}

/**
 * Create a standalone, already-authenticated API request context.
 *
 * Used by global-setup.ts to perform the suite's one shared login (whose
 * resulting session is then persisted to STORAGE_STATE_PATH), and as a
 * fallback by fixtures/specs that need a logged-in APIRequestContext but
 * have no storageState available.
 */
export async function createAuthenticatedApiContext(
  backendURL: string,
  email = DEFAULT_TEST_EMAIL,
  password = DEFAULT_TEST_PASSWORD
): Promise<APIRequestContext> {
  const apiContext = await request.newContext({ baseURL: backendURL });
  const response = await apiContext.post('/api/auth/login', {
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    await apiContext.dispose();
    throw new Error(`Login failed: ${response.status()} - ${body}`);
  }

  return apiContext;
}

// Made with Bob
