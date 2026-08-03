/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test, expect } from '../../fixtures/auth.fixture';

// Regression coverage for #303 (error banner shown instead of empty state
// when the user has no grocery list yet) and #312 (empty-state CTA did a
// full page reload instead of an SPA transition).
test.describe('Grocery List — empty state', () => {
  test('shows the empty state, not an error banner, when no list exists', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/grocery-lists*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await authenticatedPage.goto('/grocery-list');

    await expect(authenticatedPage.getByText('Your grocery list is empty')).toBeVisible();
    await expect(authenticatedPage.getByText(/failed to load grocery lists/i)).not.toBeVisible();
  });

  test('empty-state CTA navigates via SPA routing, not a full page reload', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/grocery-lists*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await authenticatedPage.goto('/grocery-list');
    await expect(authenticatedPage.getByText('Your grocery list is empty')).toBeVisible();

    // window.location.href tears down and recreates the document, which wipes
    // the JS heap; react-router's pushState-based navigation does not. Stamp a
    // marker on window and confirm it survives the click — a full reload would
    // wipe it, an SPA transition preserves it.
    await authenticatedPage.evaluate(() => {
      (window as unknown as { __navMarker: string }).__navMarker = 'still-here';
    });

    await authenticatedPage.getByRole('button', { name: 'Go to Meal Planner' }).click();
    await expect(authenticatedPage).toHaveURL(/\/meal-planner$/);

    const markerSurvived = await authenticatedPage.evaluate(
      () => (window as unknown as { __navMarker?: string }).__navMarker === 'still-here'
    );
    expect(markerSurvived).toBe(true);
  });
});

// Made with Bob
