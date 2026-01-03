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
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

/**
 * CSRF cookie name (matches CSRF_COOKIE in prompt-service/src/utils/csrf.ts)
 */
export const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * CSRF header name (matches CSRF_HEADER in prompt-service/src/utils/csrf.ts)
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
   * Wait for the React app to render by checking for common page indicators.
   * Uses a disjunction of selectors that cover all page types.
   */
  async waitForAppReady(): Promise<void> {
    // Wait for any of these page-level containers (React has rendered)
    await this.page
      .locator(
        '[data-testid="landing-page"], ' +
          '[data-testid="auth-page"], ' +
          '[data-testid="nav-header"]'
      )
      .first()
      .waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.navigation });
  }

  /**
   * Navigate to a path relative to base URL
   *
   * @param path - Path to navigate to (e.g., '/auth', '/assessment')
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.waitForAppReady();
  }

  /**
   * Wait for navigation and DOM to be ready
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
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
    // Look for user avatar dropdown - only check the specific data-testid
    try {
      const avatar = this.page.locator('[data-testid="user-avatar-dropdown"]');
      return await avatar.isVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to be visible with custom timeout
   *
   * @param selector - CSS selector or Playwright locator string
   * @param timeout - Maximum time to wait in milliseconds
   * @returns The located element
   */
  async waitForElement(selector: string, timeout = E2E_TIMEOUTS.navigation): Promise<Locator> {
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
      await this.page.waitForLoadState('domcontentloaded');
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
   * Clear all cookies to simulate logged-out state
   */
  async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }
}
