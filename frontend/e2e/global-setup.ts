/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createAuthenticatedApiContext } from './helpers/api-auth';
import { STORAGE_STATE_PATH } from './helpers/storage-state';

async function globalSetup(config: FullConfig) {
  const activeProjects = config.projects.filter((p) => !p.grep || !p.grepInvert);
  const onlyFtue = activeProjects.length === 1 && activeProjects[0].name === 'ftue-audit';
  if (onlyFtue || process.env.SKIP_GLOBAL_SETUP === '1') {
    console.log('Global Setup: Skipped (FTUE audit handles its own auth)');
    return;
  }

  const { baseURL } = config.projects[0].use;
  const backendURL = baseURL?.replace(':5173', ':3000') || 'http://localhost:3000';

  // Only projects that declare `storageState` (see playwright.config.ts —
  // `authenticated-tests`) actually consume the shared session file. A lone
  // `--project=auth-tests` run (which exercises the login UI itself) doesn't
  // need one, so skip writing it in that case.
  const needsStorageState = activeProjects.some((p) => p.use?.storageState);

  console.log('Global Setup: Authenticating once and verifying backend is reachable...');

  const maxRetries = process.env.CI ? 3 : 1;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let apiContext: Awaited<ReturnType<typeof createAuthenticatedApiContext>> | undefined;
    try {
      apiContext = await createAuthenticatedApiContext(backendURL);

      if (needsStorageState) {
        fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
        await apiContext.storageState({ path: STORAGE_STATE_PATH });
        console.log(`Global Setup: Authenticated session saved to ${STORAGE_STATE_PATH}`);
      } else {
        console.log('Global Setup: Backend verified (no project in this run needs a shared session)');
      }

      await apiContext.dispose();
      return;
    } catch (error) {
      await apiContext?.dispose();
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
