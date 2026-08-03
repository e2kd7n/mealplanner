import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Logout Flow', () => {
  test('should logout successfully', async ({ authenticatedPage }) => {
    // Open the profile/account menu (aria-label from Layout.tsx)
    await authenticatedPage.getByLabel('Profile & Family Settings').click();

    // Click logout
    await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();

    // Logout (Layout.tsx) navigates to the classic form, not the visual
    // family-member-picker at /login.
    await expect(authenticatedPage).toHaveURL('/login/classic');
  });

  test('should not access protected routes after logout', async ({ authenticatedPage }) => {
    await authenticatedPage.getByLabel('Profile & Family Settings').click();
    await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();

    // Logout dispatches an async API call that clears the auth cookies —
    // wait for it to actually complete before navigating, otherwise this
    // races ahead and /dashboard loads with the still-valid session cookie.
    await expect(authenticatedPage).toHaveURL('/login/classic');

    // Try to access a protected route
    await authenticatedPage.goto('/dashboard');

    // PrivateRoute should redirect back to login when session is cleared
    await expect(authenticatedPage).toHaveURL(/\/login/);
  });

  test('should clear session on logout', async ({ authenticatedPage }) => {
    await authenticatedPage.getByLabel('Profile & Family Settings').click();
    await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
    await expect(authenticatedPage).toHaveURL('/login/classic');

    // Attempting a protected route confirms the session cookie was cleared
    await authenticatedPage.goto('/recipes');
    await expect(authenticatedPage).toHaveURL(/\/login/);
  });
});

// Made with Bob
