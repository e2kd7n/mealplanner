import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Logout Flow', () => {
  test('should logout successfully', async ({ authenticatedPage }) => {
    // Click user menu button
    await authenticatedPage.getByRole('button', { name: /test user/i }).click();
    
    // Click logout button
    await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
    
    // Should redirect to login page
    await expect(authenticatedPage).toHaveURL('/login');
    
    // Should show login form
    await expect(authenticatedPage.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should not access protected routes after logout', async ({ authenticatedPage }) => {
    // Logout
    await authenticatedPage.getByRole('button', { name: /test user/i }).click();
    await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
    
    // Try to access dashboard
    await authenticatedPage.goto('/dashboard');
    
    // Should redirect to login
    await expect(authenticatedPage).toHaveURL('/login');
  });

  test('should clear session data on logout', async ({ authenticatedPage }) => {
    // Logout
    await authenticatedPage.getByRole('button', { name: /test user/i }).click();
    await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
    
    // Check that auth token is cleared
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

// Made with Bob
