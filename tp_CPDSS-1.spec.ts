import { test, expect } from '@playwright/test';

test('CPDSS-1-TC-01: Verify successful login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://your-jira-instance.com/login');

    // Fill in valid credentials
    await page.fill('#username', 'validUsername');
    await page.fill('#password', 'validPassword');

    // Click the login button
    await page.click('#login-button');

    // Wait for navigation to the dashboard or any post-login page
    await page.waitForNavigation();

    // Assert that the user is redirected to the dashboard or any post-login page
    expect(page.url()).toContain('/dashboard');

    // Additional implicit assertion: Check if the user avatar or any post-login element is visible
    await expect(page.locator('.user-avatar')).toBeVisible();
});