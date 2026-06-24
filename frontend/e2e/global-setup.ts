/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { FullConfig } from '@playwright/test';
import { verifyBackendAuth } from './helpers/api-auth';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const backendURL = baseURL?.replace(':5173', ':3000') || 'http://localhost:3000';

  console.log('Global Setup: Verifying backend is reachable...');

  const maxRetries = process.env.CI ? 3 : 1;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await verifyBackendAuth(backendURL);
      console.log('Global Setup: Backend verified');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Global Setup: Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`Global Setup: Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export default globalSetup;
