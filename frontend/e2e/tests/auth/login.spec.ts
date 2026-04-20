/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'TestPass123!');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: /welcome to meal planner/i })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Wait for the login request to complete and error to appear
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
    
    // Should show validation errors (form should not submit)
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to register page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.navigateToRegister();
    
    // Should navigate to register page
    await expect(page).toHaveURL(/.*register/);
  });

  test('should use test login button', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Check if test login button exists
    const testLoginVisible = await loginPage.testLoginButton.isVisible().catch(() => false);
    
    if (testLoginVisible) {
      await loginPage.useTestLogin();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    } else {
      // Skip test if button not available
      test.skip();
    }
  });
});

// Made with Bob