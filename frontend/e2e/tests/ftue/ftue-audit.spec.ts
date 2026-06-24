import { test, expect, Page } from '@playwright/test';

// ── Config ──────────────────────────────────────────────────────────────────
// Run against the Pi:
//   BASE_URL=http://192.168.4.110 FTUE_EMAIL=you@example.com FTUE_PASSWORD=... npx playwright test e2e/tests/ftue/
// Run against local dev (defaults):
//   npx playwright test e2e/tests/ftue/

const EMAIL = process.env.FTUE_EMAIL || 'test@example.com';
const PASSWORD = process.env.FTUE_PASSWORD || 'TestPass123!';
const CONFIGURED_BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

function screenshotPath(name: string) {
  return `test-results/ftue-screenshots/${name}.png`;
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: screenshotPath(name), fullPage: true });
}

function getBackendURL(): string {
  const base = CONFIGURED_BASE_URL;
  if (base.includes(':5173')) return base.replace(':5173', ':3000');
  // Pi: backend is behind the same nginx on the same origin
  return base;
}

async function loginViaAPI(page: Page): Promise<boolean> {
  const backendURL = getBackendURL();
  try {
    const resp = await page.request.post(`${backendURL}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    return resp.ok();
  } catch {
    return false;
  }
}

// ── 1. Visual Login Screen (LocalLogin) ─────────────────────────────────────

test.describe('Visual Login Screen (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('screenshots the login screen', async ({ page }) => {
    await screenshot(page, '01-login-screen');
  });

  test('#235 — branding should be consistent, not "Family Kitchen" vs "Family Meal Planner"', async ({ page }) => {
    const heading = page.locator('h4, h3, h2').first();
    const text = await heading.textContent();
    // Document what the heading actually says
    console.log(`Login heading text: "${text}"`);
    // The welcome page says "Family Meal Planner" — flag if login says something different
    if (text && !text.includes('Meal Planner')) {
      console.warn(`ISSUE #235: Login heading says "${text}" instead of "Family Meal Planner"`);
    }
    await screenshot(page, '01a-login-heading');
  });

  test('#242 — "Classic sign-in" link should have adequate contrast', async ({ page }) => {
    const classicLink = page.getByText(/classic sign-in/i);
    if (await classicLink.isVisible()) {
      const color = await classicLink.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return { color: style.color, background: style.backgroundColor };
      });
      console.log(`Classic sign-in link — color: ${color.color}, bg: ${color.background}`);
      // Grey text on white background is the known issue
      await classicLink.scrollIntoViewIfNeeded();
      await screenshot(page, '01b-classic-signin-link');
    }
  });

  test('user cards are displayed for family members', async ({ page }) => {
    const userCards = page.getByRole('button').filter({ hasText: /\w+/ });
    const count = await userCards.count();
    console.log(`Found ${count} user cards on login screen`);
    expect(count).toBeGreaterThan(0);
    await screenshot(page, '01c-user-cards');
  });

  test('stepper is visible and shows correct steps', async ({ page }) => {
    const stepper = page.locator('.MuiStepper-root');
    if (await stepper.isVisible()) {
      const stepLabels = await stepper.locator('.MuiStepLabel-label').allTextContents();
      console.log(`Login stepper labels: ${JSON.stringify(stepLabels)}`);
      await screenshot(page, '01d-login-stepper');
    }
  });
});

// ── 2. Welcome Screen (fresh install guard) ─────────────────────────────────

test.describe('Welcome Screen (/welcome)', () => {
  test('redirects to /login when users already exist', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForLoadState('networkidle');
    // On an existing install, should redirect to /login
    const url = page.url();
    if (url.includes('/login')) {
      console.log('Correctly redirected to /login (users exist)');
    } else if (url.includes('/welcome')) {
      // Fresh install — screenshot the welcome page
      await screenshot(page, '02-welcome-fresh-install');

      // #232 — Test disabled submit button with no explanation
      const passwordInput = page.getByLabel(/^password$/i);
      const submitBtn = page.getByRole('button', { name: /create admin account/i });

      if (await passwordInput.isVisible()) {
        await page.getByLabel(/family name/i).fill('Tracy Test');
        await page.getByLabel(/email/i).fill('tracy@test.com');
        await passwordInput.fill('weak');
        await page.getByLabel(/confirm password/i).fill('weak');

        // Button should be disabled — but is there ANY visible explanation?
        const isDisabled = await submitBtn.isDisabled();
        const strengthBar = page.locator('.MuiLinearProgress-root');
        const strengthVisible = await strengthBar.isVisible();
        // Look for any "too weak" messaging near the button
        const tooWeakMsg = page.getByText(/too weak|not strong enough|stronger password/i);
        const hasTooWeakMsg = await tooWeakMsg.isVisible().catch(() => false);

        console.log(`ISSUE #232 check — button disabled: ${isDisabled}, strength bar visible: ${strengthVisible}, has explanation: ${hasTooWeakMsg}`);
        if (isDisabled && !hasTooWeakMsg) {
          console.warn('ISSUE #232 CONFIRMED: Submit button is disabled with no visible explanation');
        }
        await screenshot(page, '02a-welcome-weak-password');

        // #245 — Password strength scoring is opaque
        await passwordInput.fill('Abcdefgh'); // mixed case, 8 chars = 50%
        const strengthLabel = page.getByText(/weak|medium|strong/i);
        if (await strengthLabel.isVisible()) {
          const label = await strengthLabel.textContent();
          const btnDisabledNow = await submitBtn.isDisabled();
          console.log(`ISSUE #245 check — "Abcdefgh" shows: "${label}", button disabled: ${btnDisabledNow}`);
        }
        await screenshot(page, '02b-welcome-medium-password');
      }
    }
  });
});

// ── 3. Classic Login (/login/classic) ───────────────────────────────────────

test.describe('Classic Login (/login/classic)', () => {
  test('screenshots classic login page', async ({ page }) => {
    await page.goto('/login/classic');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '03-classic-login');
  });
});

// ── 4. Setup Wizard (/setup) — requires auth ───────────────────────────────

test.describe('Setup Wizard (/setup)', () => {
  test('screenshots setup wizard if accessible', async ({ page }) => {
    // Authenticate first
    if (!await loginViaAPI(page)) {
      console.log('Cannot authenticate — skipping');
      test.skip();
      return;
    }

    await page.goto('/setup');
    await page.waitForLoadState('networkidle');
    const url = page.url();

    if (url.includes('/setup')) {
      await screenshot(page, '04-setup-wizard-step0');

      // #240 — No Back button
      const getStartedBtn = page.getByRole('button', { name: /get started/i });
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
        await page.waitForTimeout(500);
        await screenshot(page, '04a-setup-step1-family');

        const backBtn = page.getByRole('button', { name: /back/i });
        const hasBackBtn = await backBtn.isVisible().catch(() => false);
        console.log(`ISSUE #240 check — Back button visible on Step 1: ${hasBackBtn}`);
        if (!hasBackBtn) {
          console.warn('ISSUE #240 CONFIRMED: No Back button on Setup wizard Step 1');
        }

        // #241 — Stepper label overflow check
        const stepper = page.locator('.MuiStepper-root');
        if (await stepper.isVisible()) {
          const stepperBox = await stepper.boundingBox();
          const containerBox = await page.locator('.MuiContainer-root').first().boundingBox();
          if (stepperBox && containerBox && stepperBox.width > containerBox.width) {
            console.warn('ISSUE #241 CONFIRMED: Stepper overflows container');
          }
          const labels = await stepper.locator('.MuiStepLabel-label').allTextContents();
          console.log(`Setup stepper labels: ${JSON.stringify(labels)}`);
        }
      }
    } else {
      console.log(`Setup wizard redirected to ${url} (FTUE already completed)`);
      await screenshot(page, '04-setup-redirected');
    }
  });
});

// ── 5. Dashboard — onboarding, empty states, nudges ────────────────────────

test.describe('Dashboard (/dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('screenshots dashboard and checks for onboarding wizard', async ({ page }) => {
    await screenshot(page, '05-dashboard');

    // Check if OnboardingWizard dialog appeared
    const dialog = page.locator('.MuiDialog-root');
    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (dialogVisible) {
      await screenshot(page, '05a-onboarding-wizard');

      // #236 — Document redundant welcome screen
      const wizardWelcome = dialog.getByText(/welcome to meal planner/i);
      if (await wizardWelcome.isVisible().catch(() => false)) {
        console.log('ISSUE #236: OnboardingWizard shows its own "Welcome" screen (redundant with Setup wizard Welcome)');
      }

      // Walk through all steps and screenshot
      const nextBtn = dialog.getByRole('button', { name: /next/i });
      for (let step = 1; step <= 3; step++) {
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(500);
          await screenshot(page, `05b-onboarding-step${step}`);
        }
      }

      // #237 — Skip and check what gets persisted
      const skipBtn = dialog.getByRole('button', { name: /skip/i });
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(500);
      } else {
        // Close via X button
        const closeBtn = dialog.getByLabel(/skip onboarding/i);
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('#244 — empty meal slot buttons should have adequate touch targets', async ({ page }) => {
    // Close onboarding wizard if present
    const dialog = page.locator('.MuiDialog-root');
    if (await dialog.isVisible().catch(() => false)) {
      const closeBtn = dialog.getByLabel(/skip onboarding/i);
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    const notPlannedBtns = page.getByRole('button', { name: /not planned/i });
    const count = await notPlannedBtns.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const btn = notPlannedBtns.nth(i);
        const box = await btn.boundingBox();
        if (box) {
          const tooSmall = box.height < 44 || box.width < 44;
          if (tooSmall) {
            console.warn(`ISSUE #244 CONFIRMED: "Not planned" button ${i} is ${Math.round(box.width)}x${Math.round(box.height)}px (minimum 44x44)`);
          }
        }
      }
      await screenshot(page, '05c-empty-meal-slots');
    } else {
      console.log('No empty meal slots visible (meals are planned)');
    }
  });

  test('#238 — profile nudge should appear after skipping onboarding', async ({ page }) => {
    // Clear relevant localStorage to simulate fresh state
    await page.evaluate(() => {
      localStorage.removeItem('profileNudgeDismissed');
    });

    // Check if onboarding was skipped (onboardingCompleted=true but no onboardingData)
    const state = await page.evaluate(() => ({
      completed: localStorage.getItem('onboardingCompleted'),
      data: localStorage.getItem('onboardingData'),
    }));
    console.log(`Onboarding state — completed: ${state.completed}, has data: ${!!state.data}`);

    if (state.completed && !state.data) {
      // Reload to trigger nudge logic
      await page.reload();
      await page.waitForLoadState('networkidle');
      const nudge = page.getByText(/complete your profile/i);
      const nudgeVisible = await nudge.isVisible().catch(() => false);
      console.log(`ISSUE #238 check — profile nudge visible after skip: ${nudgeVisible}`);
      if (!nudgeVisible) {
        console.warn('ISSUE #238 CONFIRMED: Profile nudge does not appear when onboarding was skipped');
      }
    }
  });

  test('quick action cards are visible and clickable', async ({ page }) => {
    // Close onboarding wizard if present
    const dialog = page.locator('.MuiDialog-root');
    if (await dialog.isVisible().catch(() => false)) {
      const closeBtn = dialog.getByLabel(/skip onboarding/i);
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    const actionCards = page.getByRole('button', {
      name: /browse recipes|plan this week|view list|check pantry/i,
    });
    const count = await actionCards.count();
    console.log(`Quick action cards visible: ${count}`);
    expect(count).toBe(4);
    await screenshot(page, '05d-quick-actions');
  });
});

// ── 6. Member Welcome Tour (/member-welcome) ───────────────────────────────

test.describe('Member Welcome Tour (/member-welcome)', () => {
  test.beforeEach(async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }
  });

  test('screenshots all tour slides and checks UX', async ({ page }) => {
    // Clear the FTUE flag so the tour is accessible
    await page.goto('/member-welcome');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/member-welcome')) {
      console.log(`Member welcome redirected to ${page.url()}`);
      test.skip();
      return;
    }

    // Slide 0
    await screenshot(page, '06-member-welcome-slide0');
    const heading0 = await page.locator('h4').first().textContent();
    console.log(`Slide 0 heading: "${heading0}"`);

    // #246 — Check for swipe support
    const hasTouchHandler = await page.evaluate(() => {
      const root = document.querySelector('[class*="MuiBox-root"]');
      if (!root) return false;
      const events = (root as HTMLElement).ontouchstart;
      return events !== undefined;
    });
    console.log(`ISSUE #246 check — touch handler on root: ${hasTouchHandler}`);
    if (!hasTouchHandler) {
      console.warn('ISSUE #246 CONFIRMED: No swipe/touch gesture support on member welcome tour');
    }

    // Navigate through all slides
    const nextBtn = page.getByRole('button', { name: /next|let's go/i });
    for (let slide = 1; slide <= 3; slide++) {
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(400);
        await screenshot(page, `06a-member-welcome-slide${slide}`);
      }
    }

    // Check skip button visibility
    const skipBtn = page.getByRole('button', { name: /skip/i });
    // Skip is only visible on non-final slides, go back to check
    await page.goto('/member-welcome');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/member-welcome')) {
      const skipVisible = await skipBtn.isVisible().catch(() => false);
      console.log(`Skip button visible on slide 0: ${skipVisible}`);
    }
  });

  test('#239 — member FTUE flag should be per-member, not global', async ({ page }) => {
    await page.goto('/member-welcome');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/member-welcome')) {
      test.skip();
      return;
    }

    // Check the localStorage key
    const key = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.includes('ftue'));
      return keys;
    });
    console.log(`FTUE-related localStorage keys: ${JSON.stringify(key)}`);

    // Complete the tour
    const nextBtn = page.getByRole('button', { name: /next/i });
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }
    const letsGoBtn = page.getByRole('button', { name: /let's go/i });
    if (await letsGoBtn.isVisible().catch(() => false)) {
      await letsGoBtn.click();
      await page.waitForTimeout(300);
    }

    // Check the key that was set — is it per-member or global?
    const postKey = await page.evaluate(() => {
      return {
        globalKey: localStorage.getItem('mealplanner_member_ftue_done'),
        allKeys: Object.keys(localStorage).filter((k) => k.includes('ftue')),
      };
    });
    console.log(`After tour — global key: ${postKey.globalKey}, all ftue keys: ${JSON.stringify(postKey.allKeys)}`);
    if (postKey.globalKey && !postKey.allKeys.some((k: string) => k.includes('_done_'))) {
      console.warn('ISSUE #239 CONFIRMED: FTUE done flag is a single global key, not per-member');
    }
  });
});

// ── 7. Recipes empty state ─────────────────────────────────────────────────

test.describe('Recipe Discovery Empty State', () => {
  test('#247 — empty state should explain missing Spoonacular key', async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }

    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '07-recipes-page');

    // Check if we're seeing the empty state
    const emptyState = page.getByText(/welcome to your recipe collection/i);
    if (await emptyState.isVisible().catch(() => false)) {
      await screenshot(page, '07a-recipes-empty-state');

      // Check for "no recipes available" without explanation
      const noRecipesMsg = page.getByText(/no .* recipes available/i);
      const noRecipesMsgVisible = await noRecipesMsg.isVisible().catch(() => false);
      const apiKeyExplanation = page.getByText(/spoonacular|api key|connect/i);
      const hasExplanation = await apiKeyExplanation.isVisible().catch(() => false);

      if (noRecipesMsgVisible && !hasExplanation) {
        console.warn('ISSUE #247 CONFIRMED: "No recipes available" shown with no explanation about missing API key');
      }
    } else {
      console.log('Recipes page has content (not empty state)');
    }
  });
});

// ── 8. Mobile viewport validation ──────────────────────────────────────────

test.describe('Mobile viewport checks', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test('login screen renders correctly on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '08-mobile-login');

    // Check if user cards stack properly
    const cards = page.locator('.MuiCard-root');
    const count = await cards.count();
    if (count > 1) {
      const first = await cards.first().boundingBox();
      const second = await cards.nth(1).boundingBox();
      if (first && second) {
        const overlaps = first.x + first.width > second.x && first.y === second.y;
        if (overlaps) {
          console.warn('Mobile: User cards overlap horizontally');
        }
      }
    }
  });

  test('#241 — setup stepper should not overflow on mobile', async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }

    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/setup')) {
      const stepper = page.locator('.MuiStepper-root');
      if (await stepper.isVisible()) {
        const stepperBox = await stepper.boundingBox();
        if (stepperBox && stepperBox.width > 375) {
          console.warn(`ISSUE #241 CONFIRMED: Stepper width (${Math.round(stepperBox.width)}px) exceeds mobile viewport (375px)`);
        }
        await screenshot(page, '08a-mobile-setup-stepper');
      }
    }
  });

  test('dashboard renders correctly on mobile', async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Close onboarding if present
    const dialog = page.locator('.MuiDialog-root');
    if (await dialog.isVisible().catch(() => false)) {
      const closeBtn = dialog.getByLabel(/skip onboarding/i);
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await screenshot(page, '08b-mobile-dashboard');

    // Check meal slot button sizes on mobile
    const notPlannedBtns = page.getByRole('button', { name: /not planned/i });
    const btnCount = await notPlannedBtns.count();
    for (let i = 0; i < btnCount; i++) {
      const box = await notPlannedBtns.nth(i).boundingBox();
      if (box && (box.height < 44 || box.width < 44)) {
        console.warn(`ISSUE #244 CONFIRMED (mobile): "Not planned" button ${i} is ${Math.round(box.width)}x${Math.round(box.height)}px`);
      }
    }
  });

  test('member welcome tour renders correctly on mobile', async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }

    await page.goto('/member-welcome');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/member-welcome')) {
      await screenshot(page, '08c-mobile-member-welcome');

      // Check navigation button sizes
      const nextBtn = page.getByRole('button', { name: /next/i });
      if (await nextBtn.isVisible()) {
        const box = await nextBtn.boundingBox();
        if (box && box.height < 44) {
          console.warn(`Mobile: Next button height (${Math.round(box.height)}px) below 44px touch target`);
        }
      }
    }
  });
});

// ── 9. Visual login flow for Tracy ─────────────────────────────────────────

test.describe('Visual login flow — Tracy', () => {
  test('Tracy can be selected on the login screen', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const tracyCard = page.getByText('Tracy');
    const tracyVisible = await tracyCard.isVisible().catch(() => false);
    console.log(`Tracy visible on login screen: ${tracyVisible}`);

    if (tracyVisible) {
      await screenshot(page, '09-login-tracy-visible');
      await tracyCard.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '09a-login-tracy-selected');

      // Check what happens — visual challenge or setup mode?
      const setupMode = page.getByText(/first-time setup/i);
      const visualChallenge = page.getByText(/tap the image you chose/i);
      const errorAlert = page.getByRole('alert');

      if (await setupMode.isVisible().catch(() => false)) {
        console.log('Tracy enters setup mode (no visual password set)');
        await screenshot(page, '09b-tracy-setup-mode');

        // #234 — If we sign in and no recipe images exist, we hit the dead end
        console.log('ISSUE #234: If no recipe images exist after sign-in, Tracy will be bounced to dashboard');
      } else if (await visualChallenge.isVisible().catch(() => false)) {
        console.log('Tracy has a visual password — challenge displayed');
        await screenshot(page, '09b-tracy-visual-challenge');

        // Check that challenge images are actually loaded
        const images = page.locator('.MuiCardMedia-root');
        const imgCount = await images.count();
        console.log(`Visual challenge images: ${imgCount}`);
        for (let i = 0; i < imgCount; i++) {
          const naturalWidth = await images.nth(i).evaluate(
            (el) => (el as HTMLImageElement).naturalWidth
          );
          if (naturalWidth === 0) {
            console.warn(`Visual challenge image ${i} failed to load`);
          }
        }
      } else if (await errorAlert.isVisible().catch(() => false)) {
        const errorText = await errorAlert.textContent();
        console.warn(`Error after selecting Tracy: "${errorText}"`);
        await screenshot(page, '09b-tracy-error');
      }
    } else {
      console.log('Tracy not found on login screen');
    }
  });
});

// ── 10. Additional checks — things not in the original 15 ──────────────────

test.describe('Additional FTUE checks', () => {
  test('page title is set correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    // Should match the branding
    expect(title).toBeTruthy();
  });

  test('favicon loads', async ({ page }) => {
    await page.goto('/login');
    const faviconResp = await page.request.get('/favicon.svg');
    console.log(`Favicon status: ${faviconResp.status()}`);
    expect(faviconResp.ok()).toBeTruthy();
  });

  test('no console errors on login page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.warn(`Console errors on login page:\n${errors.join('\n')}`);
    }
    console.log(`Console errors found: ${errors.length}`);
  });

  test('no console errors on dashboard', async ({ page }) => {
    if (!await loginViaAPI(page)) {
      test.skip();
      return;
    }

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Close onboarding if present
    const dialog = page.locator('.MuiDialog-root');
    if (await dialog.isVisible().catch(() => false)) {
      const closeBtn = dialog.getByLabel(/skip onboarding/i);
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    if (errors.length > 0) {
      console.warn(`Console errors on dashboard:\n${errors.join('\n')}`);
    }
    console.log(`Console errors found: ${errors.length}`);
  });

  test('loading states do not flash — login screen loads in under 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    // Wait for actual user cards (not skeleton loaders)
    try {
      await page.locator('.MuiCard-root .MuiCardActionArea-root').first().waitFor({
        state: 'visible',
        timeout: 10000,
      });
    } catch {
      console.warn('User cards did not appear within 10s');
    }
    const elapsed = Date.now() - start;
    console.log(`Login screen loaded in ${elapsed}ms`);
    if (elapsed > 3000) {
      console.warn(`Slow load: login screen took ${elapsed}ms (target: <3000ms)`);
    }
  });
});
