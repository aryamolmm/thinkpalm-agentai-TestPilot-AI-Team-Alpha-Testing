# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tp_TC_001.spec.ts >> Jira Login Tests >> TC_07: Login with SQL injection in username
- Location: tests\tp_TC_001.spec.ts:50:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('.error-message')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.error-message')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Jira Login Tests', () => {
  4  |   const validUsername = 'valid_user';
  5  |   const validPassword = 'valid_password';
  6  |   const dashboardUrl = '/dashboard';
  7  | 
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await page.goto(process.env.TEST_URL || '/login');
  10 |   });
  11 | 
  12 |   test('TC_01: Successful login with valid credentials', async ({ page }) => {
  13 |     await page.fill('.username', validUsername);
  14 |     await page.fill('#password', validPassword);
  15 |     await page.press('#password', 'Enter');
  16 |     await expect(page).toHaveURL(dashboardUrl);
  17 |   });
  18 | 
  19 |   test('TC_02: Login with invalid username', async ({ page }) => {
  20 |     await page.fill('.username', process.env.TEST_USER || 'invalid_user');
  21 |     await page.fill('#password', validPassword);
  22 |     await page.press('#password', 'Enter');
  23 |     await expect(page.locator('.error-message')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('TC_03: Login with invalid password', async ({ page }) => {
  27 |     await page.fill('.username', validUsername);
  28 |     await page.fill('#password', process.env.TEST_PASS || 'invalid_password');
  29 |     await page.press('#password', 'Enter');
  30 |     await expect(page.locator('.error-message')).toBeVisible();
  31 |   });
  32 | 
  33 |   test('TC_04: Login with empty username', async ({ page }) => {
  34 |     await page.fill('#password', validPassword);
  35 |     await page.press('#password', 'Enter');
  36 |     await expect(page.locator('.error-message')).toHaveText('Username is required');
  37 |   });
  38 | 
  39 |   test('TC_05: Login with empty password', async ({ page }) => {
  40 |     await page.fill('.username', validUsername);
  41 |     await page.press('#password', 'Enter');
  42 |     await expect(page.locator('.error-message')).toHaveText('Password is required');
  43 |   });
  44 | 
  45 |   test('TC_06: Login with empty username and password', async ({ page }) => {
  46 |     await page.press('#password', 'Enter');
  47 |     await expect(page.locator('.error-message')).toHaveText('Username and password are required');
  48 |   });
  49 | 
  50 |   test('TC_07: Login with SQL injection in username', async ({ page }) => {
  51 |     await page.fill('.username', process.env.TEST_USER || "admin' OR '1'='1");
  52 |     await page.fill('#password', validPassword);
  53 |     await page.press('#password', 'Enter');
> 54 |     await expect(page.locator('.error-message')).toBeVisible();
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  55 |   });
  56 | 
  57 |   test('TC_08: Login with XSS in password', async ({ page }) => {
  58 |     await page.fill('.username', validUsername);
  59 |     await page.fill('#password', process.env.TEST_PASS || '<script>alert("XSS")</script>');
  60 |     await page.press('#password', 'Enter');
  61 |     await expect(page.locator('.error-message')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('TC_09: Login with maximum length credentials', async ({ page }) => {
  65 |     const maxLengthString = 'a'.repeat(255);
  66 |     await page.fill('.username', maxLengthString);
  67 |     await page.fill('#password', maxLengthString);
  68 |     await page.press('#password', 'Enter');
  69 |     await expect(page).toHaveURL(dashboardUrl);
  70 |   });
  71 | 
  72 |   test('TC_10: Login after multiple failed attempts', async ({ page }) => {
  73 |     // Simulate failed attempts
  74 |     for (let i = 0; i < 3; i++) {
  75 |       await page.fill('.username', process.env.TEST_USER || 'wrong_user');
  76 |       await page.fill('#password', process.env.TEST_PASS || 'wrong_pass');
  77 |       await page.press('#password', 'Enter');
  78 |       await expect(page.locator('.error-message')).toBeVisible();
  79 |       await page.reload();
  80 |     }
  81 | 
  82 |     // Successful attempt
  83 |     await page.fill('.username', validUsername);
  84 |     await page.fill('#password', validPassword);
  85 |     await page.press('#password', 'Enter');
  86 |     await expect(page).toHaveURL(dashboardUrl);
  87 |   });
  88 | });
```