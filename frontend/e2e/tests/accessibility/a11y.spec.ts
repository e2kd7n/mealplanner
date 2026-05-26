import { test, expect } from '../../fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

// Violations to skip across all pages — known third-party component issues
// that are tracked separately and outside our control.
const GLOBAL_SKIPPED_RULES = [
  'color-contrast', // MUI theme contrast checked via Lighthouse CI instead
];

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
  test('login page has no WCAG violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
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
    await authenticatedPage.waitForLoadState('networkidle');
    await checkA11y(authenticatedPage, 'recipes list');
  });

  test('create recipe form has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');
    await authenticatedPage.waitForLoadState('networkidle');
    await checkA11y(authenticatedPage, 'create recipe form');
  });

  test('meal plan page has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/meal-plan');
    await authenticatedPage.waitForLoadState('networkidle');
    await checkA11y(authenticatedPage, 'meal plan page');
  });

  test('grocery list page has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/grocery-lists');
    await authenticatedPage.waitForLoadState('networkidle');
    await checkA11y(authenticatedPage, 'grocery list page');
  });

  test('pantry page has no WCAG violations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/pantry');
    await authenticatedPage.waitForLoadState('networkidle');
    await checkA11y(authenticatedPage, 'pantry page');
  });
});

// Made with Bob
