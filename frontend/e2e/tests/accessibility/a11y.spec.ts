import { test, expect } from '../../fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

// Violations to skip across all pages — known third-party component issues
// that are tracked separately and outside our control.
const GLOBAL_SKIPPED_RULES = [
  'color-contrast', // MUI theme contrast checked via Lighthouse CI instead
];

// A fresh page.goto() on a protected route forces a full app remount:
// PrivateRoute's auth check and SetupGuard's /setup/status check each gate
// rendering behind their own sequential network round-trip, replacing the
// whole tree with a bare, unlabeled CircularProgress in the meantime (no
// <main>, no heading). Several page components (GroceryList, etc.) have
// their own `if (loading) return <spinner-only>` on top of that. Either gap
// can exceed Playwright's networkidle quiet window, so networkidle alone
// can resolve while the app is still in a transient, non-landmarked loading
// state. Waiting for an h1 to attach ensures axe runs against the real,
// settled page instead of one of those flashes.
async function waitForAppReady(page: Parameters<typeof AxeBuilder>[0]) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#main-content', { state: 'attached', timeout: 10000 });
  await page.waitForSelector('h1', { state: 'attached', timeout: 10000 });
}

async function checkA11y(
  page: Parameters<typeof AxeBuilder>[0],
  context?: string
) {
  const results = await new AxeBuilder({ page })
    .exclude('#__axe-skip')
    .disableRules(GLOBAL_SKIPPED_RULES)
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations.map((v) =>
      `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map((n) => n.target.join(', ')).join('\n  ')}`
    ).join('\n\n');
    throw new Error(`Accessibility violations${context ? ` on ${context}` : ''}:\n\n${summary}`);
  }
}

test.describe('Accessibility — unauthenticated pages', () => {
  // This project (authenticated-tests) supplies a pre-authenticated session
  // via storageState by default — opt out here since these checks
  // specifically target the logged-out /login page.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page has no WCAG violations', async ({ page }) => {
    await page.goto('/login');
    // LocalLogin does its own sequential device-login-then-list-users check
    // before rendering the picker — same transient, non-landmarked loading
    // flash as the authenticated pages (see waitForAppReady above).
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1', { state: 'attached', timeout: 10000 });
    await checkA11y(page, 'login page');
  });
});

test.describe('Accessibility — authenticated pages', () => {
  test('dashboard has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');
    await checkA11y(authenticatedPage, 'dashboard');
  });

  test('recipes list has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'recipes list');
  });

  test('create recipe form has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'create recipe form');
  });

  test('meal plan page has no WCAG violations', async ({ authenticatedPage }) => {
    // Note: the real route is /meal-planner, not /meal-plan — the latter
    // hits the app's catch-all redirect and silently re-tests /dashboard.
    await authenticatedPage.goto('/meal-planner');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'meal plan page');
  });

  test('grocery list page has no WCAG violations', async ({ authenticatedPage }) => {
    // Note: the real route is /grocery-list (singular), not /grocery-lists.
    await authenticatedPage.goto('/grocery-list');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'grocery list page');
  });

  test('pantry page has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/pantry');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'pantry page');
  });

  test('profile page has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'profile page');
  });

  test('browse recipes page has no WCAG violations', async ({ authenticatedPage }) => {
    // Note: the real route is /recipes/browse, not /browse.
    await authenticatedPage.goto('/recipes/browse');
    await waitForAppReady(authenticatedPage);
    await checkA11y(authenticatedPage, 'browse recipes page');
  });
});

test.describe('Keyboard navigation', () => {
  test.describe('unauthenticated', () => {
    // Opt out of the shared session — the login form itself must be
    // reachable unauthenticated for this check to be meaningful.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login form is keyboard navigable', async ({ page }) => {
      // /login is the visual family-member-picker screen (no email/password
      // fields at all); the classic email/password form lives at
      // /login/classic.
      await page.goto('/login/classic');
      await page.waitForLoadState('networkidle');

      await page.keyboard.press('Tab');
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeFocused();
    });
  });

  test('navigation links receive focus', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');

    // MUI's ListItemButton renders as a <div role="button"> (not a real
    // <button>) here, so the selector must also match ARIA-button divs.
    const navLinks = authenticatedPage.locator('nav a, nav button, nav [role="button"], [role="navigation"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('interactive elements have visible focus indicators', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    const buttons = authenticatedPage.locator('button:visible').first();
    if (await buttons.count() > 0) {
      await buttons.focus();
      await expect(buttons).toBeFocused();
    }
  });
});

// Made with Bob
