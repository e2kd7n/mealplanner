/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * Encapsulates all interactions with the login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly testLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.loginButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
    this.registerLink = page.getByRole('link', { name: /don't have an account\? sign up/i });
    this.testLoginButton = page.getByRole('button', { name: /quick test login/i });
  }

  async goto() {
    await this.page.goto('/login');
    // Wait for the login form to be visible instead of networkidle (more reliable across browsers)
    await this.loginButton.waitFor({ state: 'visible', timeout: 10000 });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async useTestLogin() {
    await this.testLoginButton.click();
  }

  async expectError(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await this.page.waitForSelector(`text=${message}`);
  }

  async navigateToRegister() {
    await this.registerLink.click();
  }
}

// Made with Bob