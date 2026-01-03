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
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

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
  // Login form selectors (using data-testid for reliability)
  readonly apiKeyInput = '[data-testid="admin-input-apikey"]';
  readonly loginButton = '[data-testid="admin-btn-login"]';
  readonly loginError = '[data-testid="admin-login-error"]';

  // Loading state selector (shown during auth verification)
  readonly loadingIndicator = '[data-testid="admin-loading"]';

  // Navigation selectors (using data-testid for reliability)
  readonly promptsNav = '[data-testid="admin-nav-prompts"]';
  readonly abTestsNav = '[data-testid="admin-nav-abtests"]';
  readonly logoutButton = '[data-testid="admin-btn-logout"]';

  // Prompt list selectors (using data-testid for reliability)
  readonly promptRowPattern = '[data-testid^="prompt-row-"]';

  // A/B test list selectors (using data-testid for reliability)
  readonly abTestRowPattern = '[data-testid^="abtest-row-"]';

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

  /**
   * Navigate to the admin login page
   * Note: Admin panel is served by prompt-service on port 3002
   */
  async navigate(): Promise<void> {
    await this.page.goto(`${ADMIN_BASE_URL}/admin`);
    await this.waitForAdminReady();
  }

  /**
   * Wait for admin panel to be ready (either login form or logged-in UI)
   * Overrides base waitForAppReady since admin panel has different structure
   */
  async waitForAdminReady(): Promise<void> {
    // Wait for either login form OR logout button (logged-in state)
    await this.page
      .locator(`${this.apiKeyInput}, ${this.logoutButton}`)
      .first()
      .waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.navigation });
  }

  /**
   * Reload the admin page
   * Overrides base reload since admin panel has different structure
   */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.waitForAdminReady();
  }

  /**
   * Login to admin panel with API key
   *
   * @param apiKey - Admin API key
   */
  async login(apiKey: string): Promise<void> {
    await this.page.fill(this.apiKeyInput, apiKey);
    await this.page.click(this.loginButton);

    let loginVerified = false;

    // Wait for either redirect (success) or error (failure)
    try {
      await Promise.race([
        this.page.waitForURL('**/prompts**', { timeout: E2E_TIMEOUTS.navigation }),
        this.page.waitForSelector(this.loginError, { timeout: E2E_TIMEOUTS.navigation }),
      ]);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Admin login redirect/error wait failed:', error.message);
      }
    }

    // If redirected, wait for loading state to complete
    if (this.page.url().includes('prompts')) {
      // Wait for the "Verifying authentication..." loading to disappear
      try {
        await this.page.locator(this.loadingIndicator).waitFor({ state: 'hidden', timeout: E2E_TIMEOUTS.loadingState });
        loginVerified = true;
      } catch (error) {
        // Loading may have already completed
        if (error instanceof Error && !error.message.includes('Timeout')) {
          console.debug('Admin loading indicator wait failed:', error.message);
        }
      }

      // Wait for logout button to appear (indicates Layout is rendered)
      try {
        await this.page.locator(this.logoutButton).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.loadingState });
        loginVerified = true;
      } catch (error) {
        if (!loginVerified && error instanceof Error) {
          console.debug('Admin logout button wait failed:', error.message);
        }
      }
    }

    await this.waitForNavigation();
  }

  /**
   * Check if admin is logged in
   *
   * @returns True if logout button is visible (indicating logged in state)
   */
  async isLoggedIn(): Promise<boolean> {
    // Simple check - if logout button is visible, user is logged in
    return await this.page
      .locator(this.logoutButton)
      .isVisible({ timeout: E2E_TIMEOUTS.elementVisible })
      .catch(() => false);
  }

  /**
   * Get login error message
   *
   * @returns Error message or null
   */
  async getLoginError(): Promise<string | null> {
    try {
      // Wait for error to appear (API response time)
      await this.page.waitForLoadState('networkidle');
      const error = this.page.locator(this.loginError).first();
      if (await error.isVisible({ timeout: E2E_TIMEOUTS.elementMedium })) {
        return await error.textContent();
      }
    } catch (error) {
      // Timeout expected when no error displayed
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Admin login error check failed:', error.message);
      }
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
    await this.page.waitForLoadState('networkidle');
    // Use data-testid pattern for reliable selection
    return await this.page.locator(this.promptRowPattern).count();
  }

  /**
   * Get the count of A/B tests in the list
   *
   * @returns Number of A/B test items
   */
  async getAbTestCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    // Use data-testid pattern for reliable selection
    return await this.page.locator(this.abTestRowPattern).count();
  }

  /**
   * Click create new prompt button
   */
  async clickCreatePrompt(): Promise<void> {
    await this.page.click(this.promptCreateButton);
    await this.waitForNavigation();
  }

  /**
   * Click create new A/B test button
   */
  async clickCreateAbTest(): Promise<void> {
    await this.page.click(this.abTestCreateButton);
    await this.waitForNavigation();
  }

  /**
   * Logout from admin panel
   */
  async logout(): Promise<void> {
    await this.page.click(this.logoutButton);
    // Wait for redirect to login page
    try {
      await this.page.waitForURL('**/login**', { timeout: E2E_TIMEOUTS.navigation });
    } catch (error) {
      // May already be on login page or different URL pattern
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Admin logout redirect wait failed:', error.message);
      }
    }
    // Wait for login form to appear
    try {
      await this.page.locator(this.apiKeyInput).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.navigation });
    } catch (error) {
      // Login form may take time to render
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Admin login form wait failed:', error.message);
      }
    }
    await this.waitForNavigation();
  }

  /**
   * Check if on admin login page
   *
   * @returns True if API key input is visible
   */
  async isOnLoginPage(): Promise<boolean> {
    // Wait for any loading to complete first
    try {
      await this.page.locator(this.loadingIndicator).waitFor({ state: 'hidden', timeout: E2E_TIMEOUTS.elementVisible });
    } catch (error) {
      // Loading may not be present
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Admin loading check on login page failed:', error.message);
      }
    }
    try {
      return await this.page.locator(this.apiKeyInput).isVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Admin login page check failed:', error.message);
      }
      return false;
    }
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
    try {
      await Promise.race([
        this.page.waitForURL('**/prompts', { timeout: E2E_TIMEOUTS.navigation }),
        this.page.locator(this.promptCreateError).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.navigation }),
      ]);
    } catch (error) {
      // May still be processing
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Prompt form submission wait failed:', error.message);
      }
    }
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
      if (await error.isVisible({ timeout: E2E_TIMEOUTS.elementQuick })) {
        return await error.textContent();
      }
    } catch (error) {
      // Timeout expected when no error displayed
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Prompt create error check failed:', error.message);
      }
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
    await this.page.waitForLoadState('networkidle');
    // Use data-testid pattern for reliable selection
    const promptRows = this.page.locator(this.promptRowPattern);
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
    try {
      await Promise.race([
        this.page.waitForURL('**/ab-tests/**', { timeout: E2E_TIMEOUTS.navigation }),
        this.page.locator(this.abTestCreateError).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.navigation }),
      ]);
    } catch (error) {
      // May still be processing
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('A/B test form submission wait failed:', error.message);
      }
    }
    await this.waitForNavigation();
  }

  /**
   * Get A/B test create error message
   */
  async getAbTestCreateError(): Promise<string | null> {
    try {
      const error = this.page.locator(this.abTestCreateError);
      if (await error.isVisible({ timeout: E2E_TIMEOUTS.elementQuick })) {
        return await error.textContent();
      }
    } catch (error) {
      // Timeout expected when no error displayed
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('A/B test create error check failed:', error.message);
      }
    }
    return null;
  }

  /**
   * Click toggle on a specific A/B test by ID
   */
  async clickToggleAbTest(testId: string): Promise<void> {
    await this.page.click(`[data-testid="abtest-btn-toggle-${testId}"]`);
    // Wait for toggle to complete
    await this.page.waitForLoadState('networkidle');
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
    await this.page.waitForLoadState('networkidle');
    // Use data-testid pattern for reliable selection
    const testRows = this.page.locator(this.abTestRowPattern);
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
    try {
      await this.page.locator(this.promptListLoading).waitFor({ state: 'hidden', timeout: E2E_TIMEOUTS.loadingState });
    } catch (error) {
      // May not have loading state
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Prompt list loading wait failed:', error.message);
      }
    }
    // Wait for either table or empty state
    try {
      await Promise.race([
        this.page.locator(this.promptListTable).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.loadingState }),
        this.page.locator(this.promptListEmpty).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.loadingState }),
      ]);
    } catch (error) {
      // May still be loading
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Prompt list content wait failed:', error.message);
      }
    }
  }

  /**
   * Wait for A/B test list to load
   */
  async waitForAbTestList(): Promise<void> {
    // Wait for loading to disappear
    try {
      await this.page.locator(this.abTestListLoading).waitFor({ state: 'hidden', timeout: E2E_TIMEOUTS.loadingState });
    } catch (error) {
      // May not have loading state
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('A/B test list loading wait failed:', error.message);
      }
    }
    // Wait for either table or empty state
    try {
      await Promise.race([
        this.page.locator(this.abTestListTable).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.loadingState }),
        this.page.locator(this.abTestListEmpty).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.loadingState }),
      ]);
    } catch (error) {
      // May still be loading
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('A/B test list content wait failed:', error.message);
      }
    }
  }
}
