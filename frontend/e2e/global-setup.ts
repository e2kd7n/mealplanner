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
  await verifyBackendAuth(backendURL);
  console.log('Global Setup: Backend verified');
}

export default globalSetup;

// Made with Bob
