/**
 * @file e2e/pages/AdminPage.ts
 * @purpose Page object for admin panel functionality
 * @functionality
 * - Provides admin login methods with API key
 * - Handles prompt CRUD operations (create, read, update, delete)
 * - Handles A/B test CRUD operations
 * - Manages A/B test variants and weights
 * - Supports admin logout
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';

/**
 * Admin panel base URL - served by prompt-service
 */
const ADMIN_BASE_URL = process.env.PROMPT_SERVICE_URL ?? 'http://localhost:3002';

/**
 * Page object for the admin panel.
 *
 * The admin panel is accessed at http://localhost:3002/admin (prompt-service)
 * and requires API key authentication.
 * After login, admin can:
 * - View and manage prompts
 * - View and manage A/B tests
 * - Logout
 */
export class AdminPage extends BasePage {
  // Login form selectors
  readonly apiKeyInput = 'input#apiKey, input[type="password"], input[name="apiKey"]';
  readonly loginButton = 'button[type="submit"]';
  // Error messages are rendered as <p> with inline styles, not CSS classes
  // Match common error text patterns
  readonly loginError = 'p:has-text("Invalid"), p:has-text("failed"), p:has-text("error"), p:has-text("required")';

  // Loading state selector (shown during auth verification)
  readonly loadingIndicator = 'p:has-text("Verifying authentication")';

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

  // Form selectors (using data-testid for reliability)
  readonly promptKeyInput = '[data-testid="prompt-input-key"]';
  readonly promptNameInput = '[data-testid="prompt-input-name"]';
  readonly promptDescriptionInput = '[data-testid="prompt-input-description"]';
  readonly promptModelSelect = '[data-testid="prompt-select-model"]';
  readonly promptContentTextarea = '[data-testid="prompt-input-content"]';
  readonly promptSubmitButton = '[data-testid="prompt-btn-submit"]';
  readonly promptCancelButton = '[data-testid="prompt-btn-cancel"]';
  readonly promptBackButton = '[data-testid="prompt-btn-back"]';
  readonly promptCreateError = '[data-testid="prompt-create-error"]';

  // A/B test form selectors
  readonly abTestSelectPrompt = '[data-testid="abtest-select-prompt"]';
  readonly abTestNameInput = '[data-testid="abtest-input-name"]';
  readonly abTestDescriptionInput = '[data-testid="abtest-input-description"]';
  readonly abTestSubmitButton = '[data-testid="abtest-btn-submit"]';
  readonly abTestCancelButton = '[data-testid="abtest-btn-cancel"]';
  readonly abTestBackButton = '[data-testid="abtest-btn-back"]';
  readonly abTestCreateError = '[data-testid="abtest-create-error"]';

  // List page selectors (using data-testid)
  readonly promptListPage = '[data-testid="prompt-list-page"]';
  readonly promptListTable = '[data-testid="prompt-list-table"]';
  readonly promptListEmpty = '[data-testid="prompt-list-empty"]';
  readonly promptListLoading = '[data-testid="prompt-list-loading"]';
  readonly promptListError = '[data-testid="prompt-list-error"]';
  readonly promptCreateButton = '[data-testid="prompt-btn-create"]';

  readonly abTestListPage = '[data-testid="abtest-list-page"]';
  readonly abTestListTable = '[data-testid="abtest-list-table"]';
  readonly abTestListEmpty = '[data-testid="abtest-list-empty"]';
  readonly abTestListLoading = '[data-testid="abtest-list-loading"]';
  readonly abTestListError = '[data-testid="abtest-list-error"]';
  readonly abTestCreateButton = '[data-testid="abtest-btn-create"]';

  // Legacy saveButton for backwards compatibility
  readonly saveButton = 'button:has-text("Save")';

  /**
   * Navigate to the admin login page
   * Note: Admin panel is served by prompt-service on port 3002
   */
  async navigate(): Promise<void> {
    await this.page.goto(`${ADMIN_BASE_URL}/admin`);
    await this.page.waitForLoadState('networkidle');
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
        this.page.waitForURL('**/prompts**', { timeout: 10000 }),
        this.page.waitForSelector(this.loginError, { timeout: 10000 }),
      ]);
    } catch {
      // May still be processing
    }

    // If redirected, wait for loading state to complete
    if (this.page.url().includes('prompts')) {
      // Wait for the "Verifying authentication..." loading to disappear
      await this.page.locator(this.loadingIndicator).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
        // Loading may have already completed
      });
      // Wait for logout button to appear (indicates Layout is rendered)
      await this.page.locator(this.logoutButton).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        // May still be loading
      });
    }

    await this.waitForNavigation();
  }

  /**
   * Check if admin is logged in
   *
   * @returns True if logout button is visible (indicating logged in state)
   */
  async isLoggedIn(): Promise<boolean> {
    // First wait for any loading state to complete
    await this.page.locator(this.loadingIndicator).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Loading may not be present or already completed
    });
    // Check if logout button is visible (longer timeout to account for navigation)
    return await this.page.locator(this.logoutButton).isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Get login error message
   *
   * @returns Error message or null
   */
  async getLoginError(): Promise<string | null> {
    try {
      // Wait for error to appear (API response time)
      await this.page.waitForTimeout(500);
      const error = this.page.locator(this.loginError).first();
      if (await error.isVisible({ timeout: 3000 })) {
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
    // Wait for redirect to login page
    await this.page.waitForURL('**/login**', { timeout: 10000 }).catch(() => {
      // May already be on login page or different URL pattern
    });
    // Wait for login form to appear
    await this.page.locator(this.apiKeyInput).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      // Login form may take time to render
    });
    await this.waitForNavigation();
  }

  /**
   * Check if on admin login page
   *
   * @returns True if API key input is visible
   */
  async isOnLoginPage(): Promise<boolean> {
    // Wait for any loading to complete first
    await this.page.locator(this.loadingIndicator).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // Loading may not be present
    });
    return await this.page.locator(this.apiKeyInput).isVisible({ timeout: 5000 }).catch(() => false);
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

  /**
   * Check if on prompt create page
   */
  isOnPromptCreatePage(): boolean {
    return this.getCurrentPath().includes('prompts/new');
  }

  /**
   * Check if on A/B test create page
   */
  isOnAbTestCreatePage(): boolean {
    return this.getCurrentPath().includes('ab-tests/new');
  }

  /**
   * Navigate to create prompt page
   */
  async navigateToCreatePrompt(): Promise<void> {
    await this.page.click(this.promptCreateButton);
    await this.waitForNavigation();
  }

  /**
   * Navigate to create A/B test page
   */
  async navigateToCreateAbTest(): Promise<void> {
    await this.page.click(this.abTestCreateButton);
    await this.waitForNavigation();
  }

  /**
   * Fill prompt form with given data
   */
  async fillPromptForm(data: {
    key: string;
    name: string;
    description?: string;
    content: string;
    model?: string;
  }): Promise<void> {
    await this.page.fill(this.promptKeyInput, data.key);
    await this.page.fill(this.promptNameInput, data.name);
    if (data.description) {
      await this.page.fill(this.promptDescriptionInput, data.description);
    }
    await this.page.fill(this.promptContentTextarea, data.content);
    if (data.model) {
      await this.page.selectOption(this.promptModelSelect, data.model);
    }
  }

  /**
   * Submit prompt form
   */
  async submitPromptForm(): Promise<void> {
    await this.page.click(this.promptSubmitButton);
    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL('**/prompts', { timeout: 10000 }),
      this.page.locator(this.promptCreateError).waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // May still be processing
    });
    await this.waitForNavigation();
  }

  /**
   * Create a new prompt
   */
  async createPrompt(data: {
    key: string;
    name: string;
    description?: string;
    content: string;
    model?: string;
  }): Promise<void> {
    await this.navigateToCreatePrompt();
    await this.fillPromptForm(data);
    await this.submitPromptForm();
  }

  /**
   * Get prompt create error message
   */
  async getPromptCreateError(): Promise<string | null> {
    try {
      const error = this.page.locator(this.promptCreateError);
      if (await error.isVisible({ timeout: 2000 })) {
        return await error.textContent();
      }
    } catch {
      // No error
    }
    return null;
  }

  /**
   * Click edit on a specific prompt by ID
   */
  async clickEditPrompt(promptId: string): Promise<void> {
    await this.page.click(`[data-testid="prompt-btn-edit-${promptId}"]`);
    await this.waitForNavigation();
  }

  /**
   * Get prompt row by ID
   */
  getPromptRow(promptId: string) {
    return this.page.locator(`[data-testid="prompt-row-${promptId}"]`);
  }

  /**
   * Check if prompt exists in list by key
   */
  async promptExistsInList(key: string): Promise<boolean> {
    await this.page.waitForTimeout(500);
    const promptRows = this.page.locator(`${this.promptListTable} tbody tr`);
    const count = await promptRows.count();
    for (let i = 0; i < count; i++) {
      const row = promptRows.nth(i);
      const text = await row.textContent();
      if (text?.includes(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Fill A/B test form with given data
   */
  async fillAbTestForm(data: {
    promptId: string;
    name: string;
    description?: string;
  }): Promise<void> {
    await this.page.selectOption(this.abTestSelectPrompt, data.promptId);
    await this.page.fill(this.abTestNameInput, data.name);
    if (data.description) {
      await this.page.fill(this.abTestDescriptionInput, data.description);
    }
  }

  /**
   * Submit A/B test form
   */
  async submitAbTestForm(): Promise<void> {
    await this.page.click(this.abTestSubmitButton);
    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL('**/ab-tests/**', { timeout: 10000 }),
      this.page.locator(this.abTestCreateError).waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // May still be processing
    });
    await this.waitForNavigation();
  }

  /**
   * Get A/B test create error message
   */
  async getAbTestCreateError(): Promise<string | null> {
    try {
      const error = this.page.locator(this.abTestCreateError);
      if (await error.isVisible({ timeout: 2000 })) {
        return await error.textContent();
      }
    } catch {
      // No error
    }
    return null;
  }

  /**
   * Click toggle on a specific A/B test by ID
   */
  async clickToggleAbTest(testId: string): Promise<void> {
    await this.page.click(`[data-testid="abtest-btn-toggle-${testId}"]`);
    await this.page.waitForTimeout(1000); // Wait for toggle to complete
  }

  /**
   * Click edit on a specific A/B test by ID
   */
  async clickEditAbTest(testId: string): Promise<void> {
    await this.page.click(`[data-testid="abtest-btn-edit-${testId}"]`);
    await this.waitForNavigation();
  }

  /**
   * Get A/B test row by ID
   */
  getAbTestRow(testId: string) {
    return this.page.locator(`[data-testid="abtest-row-${testId}"]`);
  }

  /**
   * Check if A/B test exists in list by name
   */
  async abTestExistsInList(name: string): Promise<boolean> {
    await this.page.waitForTimeout(500);
    const testRows = this.page.locator(`${this.abTestListTable} tbody tr`);
    const count = await testRows.count();
    for (let i = 0; i < count; i++) {
      const row = testRows.nth(i);
      const text = await row.textContent();
      if (text?.includes(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Wait for prompt list to load
   */
  async waitForPromptList(): Promise<void> {
    // Wait for loading to disappear
    await this.page.locator(this.promptListLoading).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // May not have loading state
    });
    // Wait for either table or empty state
    await Promise.race([
      this.page.locator(this.promptListTable).waitFor({ state: 'visible', timeout: 10000 }),
      this.page.locator(this.promptListEmpty).waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // May still be loading
    });
  }

  /**
   * Wait for A/B test list to load
   */
  async waitForAbTestList(): Promise<void> {
    // Wait for loading to disappear
    await this.page.locator(this.abTestListLoading).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // May not have loading state
    });
    // Wait for either table or empty state
    await Promise.race([
      this.page.locator(this.abTestListTable).waitFor({ state: 'visible', timeout: 10000 }),
      this.page.locator(this.abTestListEmpty).waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // May still be loading
    });
  }
}
