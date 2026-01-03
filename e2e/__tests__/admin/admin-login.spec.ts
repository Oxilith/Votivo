/**
 * @file e2e/__tests__/admin/admin-login.spec.ts
 * @purpose E2E tests for admin authentication
 * @functionality
 * - Tests admin login form display
 * - Tests invalid API key error
 * - Tests successful admin login
 * - Tests redirect after login
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AdminPage page object
 * - ADMIN_API_KEY from mock-data
 */

import { test, expect, ADMIN_API_KEY } from '../../fixtures';

test.describe('Admin Login', () => {
  test('should display admin login form', async ({ adminPage }) => {
    await adminPage.navigate();

    expect(await adminPage.isOnLoginPage()).toBe(true);
  });

  test('should show error for invalid API key', async ({ adminPage }) => {
    await adminPage.navigate();
    await adminPage.login('invalid-api-key-12345');

    const error = await adminPage.getLoginError();
    expect(error).toBeTruthy();
    // API returns "Invalid API key" for failed admin login
    expect(error).toBe('Invalid API key');
  });

  test('should login with valid API key', async ({ adminPage }) => {
    await adminPage.navigate();
    await adminPage.login(ADMIN_API_KEY);

    expect(await adminPage.isLoggedIn()).toBe(true);
  });

  test('should redirect to prompts after login', async ({ adminPage }) => {
    await adminPage.navigate();
    await adminPage.login(ADMIN_API_KEY);

    // Should be on prompts page or admin dashboard
    const url = adminPage.getCurrentUrl();
    expect(url).toMatch(/admin.*prompts|admin\/$/);
  });

  test('should persist admin session across page reload', async ({ adminPage }) => {
    await adminPage.navigate();
    await adminPage.login(ADMIN_API_KEY);

    // Reload the page
    await adminPage.reload();

    // Should still be logged in
    expect(await adminPage.isLoggedIn()).toBe(true);
  });
});
