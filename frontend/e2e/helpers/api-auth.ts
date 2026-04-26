/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { request } from '@playwright/test';

/**
 * API Authentication Helper
 * Generates JWT tokens programmatically by calling the backend API directly
 * This bypasses the UI login flow for faster and more reliable test authentication
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Authenticate via API and return tokens
 * @param baseURL - The base URL of the backend API
 * @param email - User email
 * @param password - User password
 * @returns Authentication tokens and user info
 */
export async function authenticateViaAPI(
  baseURL: string,
  email: string = 'test@example.com',
  password: string = 'TestPass123!'
): Promise<AuthTokens> {
  const apiContext = await request.newContext({
    baseURL,
  });

  try {
    const response = await apiContext.post('/api/auth/login', {
      data: {
        email,
        password,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`API authentication failed: ${response.status()} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } finally {
    await apiContext.dispose();
  }
}

/**
 * Create storage state with API authentication tokens
 * This can be used to set up authenticated sessions without UI login
 * @param baseURL - The base URL of the backend API
 * @param email - User email
 * @param password - User password
 * @returns Storage state object compatible with Playwright
 */
export async function createAuthStorageState(
  baseURL: string,
  email?: string,
  password?: string
) {
  const tokens = await authenticateViaAPI(baseURL, email, password);
  
  // Create storage state with tokens
  // The frontend stores tokens in localStorage
  return {
    cookies: [],
    origins: [
      {
        origin: baseURL.replace(':3000', ':5173'), // Frontend URL
        localStorage: [
          {
            name: 'accessToken',
            value: tokens.accessToken,
          },
          {
            name: 'refreshToken',
            value: tokens.refreshToken,
          },
          {
            name: 'user',
            value: JSON.stringify(tokens.user),
          },
        ],
      },
    ],
  };
}

// Made with Bob