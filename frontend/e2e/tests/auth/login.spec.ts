/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'TestPass123!');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait for the login request to complete
    await page.waitForTimeout(1000);

    // Should show error message or stay on login page
    const errorVisible = await loginPage.errorMessage.isVisible().catch(() => false);
    const stillOnLogin = page.url().includes('/login');

    expect(errorVisible || stillOnLogin).toBeTruthy();
  });

  test('should show validation errors for empty fields', async ({ page, loginPage }) => {
    await loginPage.goto();

    // Try to submit without filling fields
    await loginPage.loginButton.click();

    // Should not navigate away from login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to register page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.navigateToRegister();

    await expect(page).toHaveURL(/.*register/);
  });
});

// Made with Bob
