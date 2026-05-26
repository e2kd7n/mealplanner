/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { request, Page } from '@playwright/test';

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

/**
 * Authenticate a Playwright page via the login API.
 * Uses page.request which shares the browser context's cookie store, so
 * cookies set by the response are automatically sent on subsequent page
 * requests (including the bootstrapAuth call on /api/auth/me).
 */
export async function authenticatePage(
  page: Page,
  backendURL: string,
  email = 'test@example.com',
  password = 'TestPass123!'
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
 * Verify the backend is reachable and auth works.
 * Used in global-setup where no page context is available.
 */
export async function verifyBackendAuth(
  backendURL: string,
  email = 'test@example.com',
  password = 'TestPass123!'
): Promise<void> {
  const apiContext = await request.newContext({ baseURL: backendURL });
  try {
    const response = await apiContext.post('/api/auth/login', {
      data: { email, password },
    });
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Backend auth check failed: ${response.status()} - ${body}`);
    }
  } finally {
    await apiContext.dispose();
  }
}

// Made with Bob
