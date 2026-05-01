# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/logout.spec.ts >> Logout Flow >> should not access protected routes after logout
- Location: e2e/tests/auth/logout.spec.ts:18:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /test user/i })

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e5]:
    - heading "Meal Planner" [level=1] [ref=e6]
    - heading "Sign In" [level=2] [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Email Address
          - generic [ref=e11]: "*"
        - generic [ref=e12]:
          - textbox "Email Address" [active] [ref=e13]
          - group:
            - generic: Email Address *
      - generic [ref=e14]:
        - generic:
          - text: Password
          - generic: "*"
        - generic [ref=e15]:
          - textbox "Password" [ref=e16]
          - group:
            - generic: Password *
      - button "Sign In" [ref=e17] [cursor=pointer]
      - button "Quick Test Login (Smith Family)" [ref=e18] [cursor=pointer]
      - link "Don't have an account? Sign Up" [ref=e20] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/auth.fixture';
  2  | 
  3  | test.describe('Logout Flow', () => {
  4  |   test('should logout successfully', async ({ authenticatedPage }) => {
  5  |     // Click user menu button
  6  |     await authenticatedPage.getByRole('button', { name: /test user/i }).click();
  7  |     
  8  |     // Click logout button
  9  |     await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
  10 |     
  11 |     // Should redirect to login page
  12 |     await expect(authenticatedPage).toHaveURL('/login');
  13 |     
  14 |     // Should show login form
  15 |     await expect(authenticatedPage.getByRole('heading', { name: /sign in/i })).toBeVisible();
  16 |   });
  17 | 
  18 |   test('should not access protected routes after logout', async ({ authenticatedPage }) => {
  19 |     // Logout
> 20 |     await authenticatedPage.getByRole('button', { name: /test user/i }).click();
     |                                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  21 |     await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
  22 |     
  23 |     // Try to access dashboard
  24 |     await authenticatedPage.goto('/dashboard');
  25 |     
  26 |     // Should redirect to login
  27 |     await expect(authenticatedPage).toHaveURL('/login');
  28 |   });
  29 | 
  30 |   test('should clear session data on logout', async ({ authenticatedPage }) => {
  31 |     // Logout
  32 |     await authenticatedPage.getByRole('button', { name: /test user/i }).click();
  33 |     await authenticatedPage.getByRole('menuitem', { name: /logout/i }).click();
  34 |     
  35 |     // Check that auth token is cleared
  36 |     const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));
  37 |     expect(token).toBeNull();
  38 |   });
  39 | });
  40 | 
  41 | // Made with Bob
  42 | 
```