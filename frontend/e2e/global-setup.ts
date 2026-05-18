/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { FullConfig } from '@playwright/test';
import { createAuthStorageState } from './helpers/api-auth';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const backendURL = baseURL?.replace(':5173', ':3000') || 'http://localhost:3000';

  console.log('Global Setup: Verifying backend authentication...');

  const storageState = await createAuthStorageState(backendURL);

  const storageStatePath = 'e2e/.auth/user.json';
  const authDir = path.dirname(storageStatePath);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  fs.writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2));

  console.log('Global Setup: Backend authentication verified');
}

export default globalSetup;

// Made with Bob
