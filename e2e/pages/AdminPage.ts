/**
 * @file e2e/pages/AdminPage.ts
 * @purpose Page object for admin panel functionality
 * @functionality
 * - Provides admin login methods with API key
 * - Handles prompt management navigation
 * - Lists prompts and A/B tests
 * - Supports admin logout
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';

/**
 * Page object for the admin panel.
 *
 * The admin panel is accessed at /admin and requires API key authentication.
 * After login, admin can:
 * - View and manage prompts
 * - View and manage A/B tests
 * - Logout
 */
export class AdminPage extends BasePage {
  // Login form selectors
  readonly apiKeyInput = 'input#apiKey, input[type="password"], input[name="apiKey"]';
  readonly loginButton = 'button[type="submit"]';
  readonly loginError = '[class*="error"], [role="alert"], p:has-text("Invalid")';

  // Navigation selectors
  readonly promptsNav = 'a:has-text("Prompts"), button:has-text("Prompts")';
  readonly abTestsNav = 'a:has-text("A/B Tests"), button:has-text("A/B Tests")';
  readonly logoutButton = 'button:has-text("Logout"), button:has-text("Sign out")';

  // Prompt list selectors
  readonly promptItem = 'tr, [class*="prompt-item"], li';
  readonly createPromptButton = 'button:has-text("Create"), a:has-text("Create")';
  readonly editPromptButton = 'button:has-text("Edit"), a:has-text("Edit")';
  readonly deletePromptButton = 'button:has-text("Delete")';

  // A/B test list selectors
  readonly abTestItem = 'tr, [class*="ab-test-item"], li';
  readonly createAbTestButton = 'button:has-text("Create"), a:has-text("Create")';

  // Form selectors
  readonly promptKeyInput = 'input[name="key"], input#key';
  readonly promptNameInput = 'input[name="name"], input#name';
  readonly promptContentTextarea = 'textarea[name="content"], textarea#content';
  readonly saveButton = 'button:has-text("Save")';

  /**
   * Navigate to the admin login page
   */
  async navigate(): Promise<void> {
    await this.goto('/admin');
  }

  /**
   * Login to admin panel with API key
   *
   * @param apiKey - Admin API key
   */
  async login(apiKey: string): Promise<void> {
    await this.page.fill(this.apiKeyInput, apiKey);
    await this.page.click(this.loginButton);

    // Wait for either redirect (success) or error (failure)
    try {
      await Promise.race([
        this.page.waitForURL('**/admin/**', { timeout: 5000 }),
        this.page.waitForSelector(this.loginError, { timeout: 5000 }),
      ]);
    } catch {
      // May still be processing
    }

    await this.waitForNavigation();
  }

  /**
   * Check if admin is logged in
   *
   * @returns True if logout button is visible (indicating logged in state)
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.page.locator(this.logoutButton).isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get login error message
   *
   * @returns Error message or null
   */
  async getLoginError(): Promise<string | null> {
    try {
      const error = this.page.locator(this.loginError);
      if (await error.isVisible({ timeout: 2000 })) {
        return await error.textContent();
      }
    } catch {
      // No error
    }
    return null;
  }

  /**
   * Navigate to prompts list
   */
  async navigateToPrompts(): Promise<void> {
    await this.page.click(this.promptsNav);
    await this.waitForNavigation();
  }

  /**
   * Navigate to A/B tests list
   */
  async navigateToAbTests(): Promise<void> {
    await this.page.click(this.abTestsNav);
    await this.waitForNavigation();
  }

  /**
   * Get the count of prompts in the list
   *
   * @returns Number of prompt items
   */
  async getPromptCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    const count = await this.page.locator(this.promptItem).count();
    // Subtract 1 if there's a header row
    return Math.max(0, count - 1);
  }

  /**
   * Get the count of A/B tests in the list
   *
   * @returns Number of A/B test items
   */
  async getAbTestCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    const count = await this.page.locator(this.abTestItem).count();
    // Subtract 1 if there's a header row
    return Math.max(0, count - 1);
  }

  /**
   * Click create new prompt button
   */
  async clickCreatePrompt(): Promise<void> {
    await this.page.click(this.createPromptButton);
    await this.waitForNavigation();
  }

  /**
   * Click create new A/B test button
   */
  async clickCreateAbTest(): Promise<void> {
    await this.page.click(this.createAbTestButton);
    await this.waitForNavigation();
  }

  /**
   * Logout from admin panel
   */
  async logout(): Promise<void> {
    await this.page.click(this.logoutButton);
    await this.waitForNavigation();
  }

  /**
   * Check if on admin login page
   *
   * @returns True if API key input is visible
   */
  async isOnLoginPage(): Promise<boolean> {
    return await this.page.locator(this.apiKeyInput).isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if prompts list is displayed
   *
   * @returns True if prompts navigation is active or prompt items visible
   */
  isOnPromptsPage(): boolean {
    return this.getCurrentPath().includes('prompts');
  }

  /**
   * Check if A/B tests list is displayed
   *
   * @returns True if A/B tests page is active
   */
  isOnAbTestsPage(): boolean {
    return this.getCurrentPath().includes('ab-tests');
  }
}
