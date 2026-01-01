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
import { BasePage } from '../../pages';

test.describe('User Logout', () => {
  test('should logout successfully', async ({ authenticatedPage }) => {
    const basePage = new BasePage(authenticatedPage);

    // Verify logged in state
    expect(await basePage.isLoggedIn()).toBe(true);

    // Find and click logout
    // Try different possible logout button locations
    const logoutSelectors = [
      '[data-testid="user-menu"]',
      'button:has-text("Sign out")',
      'button:has-text("Logout")',
      '[aria-label="User menu"]',
    ];

    for (const selector of logoutSelectors) {
      try {
        const element = authenticatedPage.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          break;
        }
      } catch {
        continue;
      }
    }

    // Click the actual logout option if a menu opened
    try {
      await authenticatedPage.click('button:has-text("Sign out"), button:has-text("Logout")');
    } catch {
      // May have clicked directly on logout button
    }

    await basePage.waitForNavigation();

    // Should be logged out now
    expect(await basePage.isLoggedIn()).toBe(false);
  });

  test('should redirect to landing page after logout', async ({ authenticatedPage }) => {
    const basePage = new BasePage(authenticatedPage);

    // Find and click logout
    try {
      await authenticatedPage.click('[data-testid="user-menu"]');
      await authenticatedPage.click('button:has-text("Sign out")');
    } catch {
      try {
        await authenticatedPage.click('button:has-text("Logout")');
      } catch {
        await authenticatedPage.click('button:has-text("Sign out")');
      }
    }

    await basePage.waitForNavigation();

    // Should be redirected to landing or home page
    const path = basePage.getCurrentPath();
    expect(path).toBe('/');
  });

  test('should clear CSRF token after logout', async ({ authenticatedPage }) => {
    const basePage = new BasePage(authenticatedPage);

    // Get CSRF token before logout
    const csrfBefore = await basePage.getCsrfToken();
    expect(csrfBefore).toBeTruthy();

    // Logout
    try {
      await authenticatedPage.click('[data-testid="user-menu"]');
      await authenticatedPage.click('button:has-text("Sign out")');
    } catch {
      await authenticatedPage.click('button:has-text("Logout"), button:has-text("Sign out")');
    }

    await basePage.waitForNavigation();

    // CSRF token should be cleared or different
    const csrfAfter = await basePage.getCsrfToken();
    expect(csrfAfter).toBeNull();
  });
});
