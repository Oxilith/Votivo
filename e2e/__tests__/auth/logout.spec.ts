/**
 * @file e2e/__tests__/auth/logout.spec.ts
 * @purpose E2E tests for user logout functionality
 * @functionality
 * - Tests successful logout
 * - Tests redirect after logout
 * - Verifies logout clears auth state
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - BasePage for common utilities
 */

import { test, expect } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';
import { BasePage, CSRF_COOKIE_NAME } from '../../pages';

test.describe('User Logout', () => {
  test('should logout successfully', async ({ authenticatedPage }) => {
    const basePage = new BasePage(authenticatedPage);

    // Verify logged in state
    expect(await basePage.isLoggedIn()).toBe(true);

    // Click avatar dropdown to open menu
    await authenticatedPage.click('[data-testid="user-avatar-dropdown"]');

    // Click sign out button
    await authenticatedPage.click('[data-testid="sign-out-button"]');

    // Wait for redirect to landing page
    await authenticatedPage.waitForURL('**/');

    // Wait for avatar to disappear (React state update)
    await authenticatedPage
      .locator('[data-testid="user-avatar-dropdown"]')
      .waitFor({ state: 'hidden', timeout: E2E_TIMEOUTS.elementVisible });

    // Should be logged out now
    expect(await basePage.isLoggedIn()).toBe(false);
  });

  test('should redirect to landing page after logout', async ({ authenticatedPage }) => {
    const basePage = new BasePage(authenticatedPage);

    // Click avatar dropdown to open menu
    await authenticatedPage.click('[data-testid="user-avatar-dropdown"]');

    // Click sign out button
    await authenticatedPage.click('[data-testid="sign-out-button"]');

    // Wait for redirect
    await authenticatedPage.waitForURL('**/');

    // Should be redirected to landing or home page
    const path = basePage.getCurrentPath();
    expect(path).toBe('/');
  });

  test('should clear CSRF token after logout', async ({ authenticatedPage }) => {
    const basePage = new BasePage(authenticatedPage);

    // Get CSRF token before logout
    const csrfBefore = await basePage.getCsrfToken();
    expect(csrfBefore).toBeTruthy();

    // Click avatar dropdown to open menu
    await authenticatedPage.click('[data-testid="user-avatar-dropdown"]');

    // Click sign out button
    await authenticatedPage.click('[data-testid="sign-out-button"]');

    // Wait for redirect and page to fully load
    await authenticatedPage.waitForURL('**/');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Wait for CSRF cookie to be cleared using Playwright context
    // (cookie is httpOnly so document.cookie can't see it)
    await expect
      .poll(
        async () => {
          const cookies = await authenticatedPage.context().cookies();
          return cookies.find((c) => c.name === CSRF_COOKIE_NAME);
        },
        { timeout: E2E_TIMEOUTS.elementMedium }
      )
      .toBeUndefined();

    // CSRF token should be cleared after logout
    const csrfAfter = await basePage.getCsrfToken();
    expect(csrfAfter).toBeNull();
  });
});
