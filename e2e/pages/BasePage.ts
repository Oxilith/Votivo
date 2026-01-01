/**
 * @file e2e/pages/BasePage.ts
 * @purpose Base page object with common navigation and CSRF handling
 * @functionality
 * - Provides common page interaction methods
 * - Handles CSRF token extraction from cookies
 * - Manages navigation helpers
 * - Provides wait utilities for elements and network
 * - Includes screenshot capture for debugging
 * @dependencies
 * - @playwright/test (Page, Locator types)
 */

import type { Page, Locator } from '@playwright/test';

/**
 * CSRF cookie name as defined in prompt-service/src/utils/csrf.ts
 */
export const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * CSRF header name for state-changing requests
 */
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Base page object providing common functionality for all page objects.
 *
 * All page objects should extend this class to inherit:
 * - Navigation utilities
 * - CSRF token handling
 * - Element waiting and interaction helpers
 * - Screenshot capture for debugging
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to base URL
   *
   * @param path - Path to navigate to (e.g., '/auth', '/assessment')
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for navigation and network to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get CSRF token from cookies
   *
   * Used after login/register to capture the token for verification.
   * Note: The browser automatically sends the httpOnly cookie,
   * so tests don't need to manually include the token in requests.
   *
   * @returns The CSRF token value or null if not found
   */
  async getCsrfToken(): Promise<string | null> {
    const cookies = await this.page.context().cookies();
    const csrfCookie = cookies.find((c) => c.name === CSRF_COOKIE_NAME);
    return csrfCookie?.value ?? null;
  }

  /**
   * Check if user is logged in by looking for auth indicators in the UI
   *
   * @returns True if user appears to be authenticated
   */
  async isLoggedIn(): Promise<boolean> {
    // Look for user menu or avatar in header that indicates logged-in state
    const userIndicators = [
      '[data-testid="user-menu"]',
      '[data-testid="user-avatar"]',
      'button:has-text("Sign out")',
      'button:has-text("Logout")',
    ];

    for (const selector of userIndicators) {
      try {
        const isVisible = await this.page.locator(selector).isVisible({ timeout: 2000 });
        if (isVisible) {
          return true;
        }
      } catch {
        // Continue checking other indicators
      }
    }

    return false;
  }

  /**
   * Wait for element to be visible with custom timeout
   *
   * @param selector - CSS selector or Playwright locator string
   * @param timeout - Maximum time to wait in milliseconds
   * @returns The located element
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /**
   * Click element and optionally wait for a specific response
   *
   * @param selector - Element selector to click
   * @param options - Optional wait options
   */
  async clickAndWait(selector: string, options?: { url?: string | RegExp }): Promise<void> {
    if (options?.url) {
      await Promise.all([this.page.waitForResponse(options.url), this.page.click(selector)]);
    } else {
      await this.page.click(selector);
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Get current page URL path
   *
   * @returns The pathname portion of the current URL
   */
  getCurrentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  /**
   * Get current full URL
   *
   * @returns The complete current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Capture screenshot for debugging
   *
   * @param name - Name for the screenshot file (without extension)
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for a specific text to appear on the page
   *
   * @param text - Text to wait for
   * @param timeout - Maximum wait time in milliseconds
   */
  async waitForText(text: string, timeout = 10000): Promise<void> {
    await this.page.getByText(text).waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if specific text is visible on the page
   *
   * @param text - Text to check for
   * @returns True if text is visible
   */
  async hasText(text: string): Promise<boolean> {
    try {
      return await this.page.getByText(text).isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Clear all cookies to simulate logged-out state
   */
  async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }
}
