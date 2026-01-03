/**
 * @file e2e/pages/ProfilePage.ts
 * @purpose Page object for user profile management
 * @functionality
 * - Provides profile editing methods
 * - Handles password change functionality
 * - Lists saved assessments and analyses
 * - Supports account deletion (danger zone)
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

/**
 * Profile tab types
 */
export type ProfileTab = 'profile' | 'password' | 'assessments' | 'analyses' | 'danger';

/**
 * Page object for the user profile page.
 *
 * The profile page has multiple tabs:
 * - Profile: Edit name, birth year, gender
 * - Password: Change password
 * - Assessments: View saved assessments
 * - Analyses: View saved analyses
 * - Danger: Delete account
 */
export class ProfilePage extends BasePage {
  // Tab selectors - use data-testid for language-independent testing
  readonly profileTab = '[data-testid="profile-tab-profile"]';
  readonly passwordTab = '[data-testid="profile-tab-password"]';
  readonly assessmentsTab = '[data-testid="profile-tab-assessments"]';
  readonly analysesTab = '[data-testid="profile-tab-analyses"]';
  readonly dangerTab = '[data-testid="profile-tab-danger"]';

  // Profile form selectors
  readonly nameInput = 'input[autocomplete="name"]';
  readonly birthYearInput = 'input[type="number"]';
  readonly genderSelect = 'select#gender, select[name="gender"]';
  readonly saveProfileButton = '[data-testid="profile-btn-save"]';

  // Password form selectors
  readonly currentPasswordInput = 'input[autocomplete="current-password"]';
  readonly newPasswordInput = 'input[autocomplete="new-password"]:first-of-type';
  readonly confirmNewPasswordInput = 'input[autocomplete="new-password"]:last-of-type';
  readonly changePasswordButton = '[data-testid="profile-btn-change-password"]';

  // List selectors (use data-testid prefix match for reliable E2E testing)
  readonly assessmentItem = '[data-testid^="assessment-item-"]';
  readonly analysisItem = '[data-testid^="analysis-item-"]';

  // Loading and empty state selectors
  readonly loadingIndicator = '[data-testid="ink-loader"]';
  readonly emptyAssessmentsMessage = '[data-testid="assessments-empty-state"]';
  readonly emptyAnalysesMessage = '[data-testid="analyses-empty-state"]';

  // Danger zone selectors (using data-testid for reliability)
  readonly deleteAccountButton = '[data-testid="profile-btn-delete-account"]';
  readonly confirmDeleteButton = '[data-testid="profile-btn-confirm-delete"]';
  readonly cancelDeleteButton = '[data-testid="profile-btn-cancel-delete"]';

  // Status messages (profile and password tabs)
  readonly profileSuccessMessage = '[data-testid="profile-success"]';
  readonly profileErrorMessage = '[data-testid="profile-error"]';
  readonly passwordSuccessMessage = '[data-testid="password-success"]';
  readonly passwordErrorMessage = '[data-testid="password-error"]';

  /**
   * Navigate to the profile page
   */
  async navigate(): Promise<void> {
    await this.goto('/profile');
  }

  /**
   * Click a specific tab
   *
   * @param tab - Tab to click
   */
  async clickTab(tab: ProfileTab): Promise<void> {
    const tabSelectors: Record<ProfileTab, string> = {
      profile: this.profileTab,
      password: this.passwordTab,
      assessments: this.assessmentsTab,
      analyses: this.analysesTab,
      danger: this.dangerTab,
    };

    // Wait for tab to be visible before clicking (profile page may take time to render)
    await this.page.locator(tabSelectors[tab]).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.navigation });
    await this.page.click(tabSelectors[tab]);
    // Wait for tab panel to be visible
    await this.page.locator(`[data-testid="profile-tabpanel-${tab}"]`).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.elementVisible });
  }

  /**
   * Update profile information
   *
   * @param updates - Fields to update
   */
  async updateProfile(updates: { name?: string; birthYear?: number }): Promise<void> {
    await this.clickTab('profile');

    if (updates.name) {
      await this.page.fill(this.nameInput, updates.name);
    }

    if (updates.birthYear) {
      await this.page.fill(this.birthYearInput, String(updates.birthYear));
    }

    await this.page.click(this.saveProfileButton);
    await this.waitForNavigation();
  }

  /**
   * Change user password
   *
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.clickTab('password');

    await this.page.fill(this.currentPasswordInput, currentPassword);

    // Handle multiple password inputs
    const passwordInputs = await this.page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 3) {
      await passwordInputs[1].fill(newPassword);
      await passwordInputs[2].fill(newPassword);
    }

    await this.page.click(this.changePasswordButton);
    await this.waitForNavigation();
  }

  /**
   * Wait for the list to finish loading
   * Uses Playwright's toPass() for reliable auto-retrying assertions
   * Waits for loading indicator to disappear and either items or empty state to appear
   */
  private async waitForListLoaded(
    itemSelector: string,
    emptyMessageSelector: string,
  ): Promise<void> {
    const { expect } = await import('@playwright/test');
    const loader = this.page.locator(this.loadingIndicator);
    const items = this.page.locator(itemSelector).first();
    const emptyMessage = this.page.locator(emptyMessageSelector).first();

    // Wait for content to settle: loader gone AND (items OR empty message visible)
    await expect(async () => {
      const loaderVisible = await loader.isVisible();
      const hasItems = await items.isVisible();
      const hasEmptyMessage = await emptyMessage.isVisible();

      expect(loaderVisible).toBe(false);
      expect(hasItems || hasEmptyMessage).toBe(true);
    }).toPass({ timeout: E2E_TIMEOUTS.apiResponse });
  }

  /**
   * Wait for at least a minimum number of assessment items to appear
   * Uses Playwright's toPass() for reliable auto-retrying
   *
   * @param minCount - Minimum number of items to wait for (default: 1)
   * @param timeout - Maximum time to wait in ms (default: 15000)
   */
  async waitForAssessments(minCount = 1, timeout = E2E_TIMEOUTS.apiResponse): Promise<void> {
    const { expect } = await import('@playwright/test');
    await this.clickTab('assessments');

    // Wait for loader to hide and items to appear
    const loader = this.page.locator(this.loadingIndicator);
    const items = this.page.locator(this.assessmentItem);

    await expect(async () => {
      const loaderVisible = await loader.isVisible();
      const count = await items.count();

      expect(loaderVisible).toBe(false);
      expect(count).toBeGreaterThanOrEqual(minCount);
    }).toPass({ timeout });
  }

  /**
   * Get the count of saved assessments
   *
   * @returns Number of assessment items
   */
  async getAssessmentCount(): Promise<number> {
    await this.clickTab('assessments');
    await this.waitForListLoaded(this.assessmentItem, this.emptyAssessmentsMessage);
    return await this.page.locator(this.assessmentItem).count();
  }

  /**
   * Get the count of saved analyses
   *
   * @returns Number of analysis items
   */
  async getAnalysisCount(): Promise<number> {
    await this.clickTab('analyses');
    await this.waitForListLoaded(this.analysisItem, this.emptyAnalysesMessage);
    return await this.page.locator(this.analysisItem).count();
  }

  /**
   * View a specific assessment by index
   *
   * @param index - Assessment index (0-based)
   */
  async viewAssessment(index: number): Promise<void> {
    await this.clickTab('assessments');
    // Wait for list to load
    await this.waitForListLoaded(this.assessmentItem, this.emptyAssessmentsMessage);

    // Get all assessment items
    const items = await this.page.locator(this.assessmentItem).all();
    if (items.length === 0) {
      throw new Error('No assessment items found in the list');
    }
    if (!items[index]) {
      throw new Error(`Assessment item at index ${index} not found (${items.length} items available)`);
    }

    // Click the entire item (it's a clickable li element, no separate View button)
    await items[index].click();
    // Wait for URL to change to /assessment/:id
    await this.page.waitForURL(/\/assessment\/[^/]+$/, { timeout: E2E_TIMEOUTS.navigation });
    await this.waitForNavigation();
  }

  /**
   * View a specific analysis by index
   *
   * @param index - Analysis index (0-based)
   */
  async viewAnalysis(index: number): Promise<void> {
    await this.clickTab('analyses');
    // Wait for list to load
    await this.waitForListLoaded(this.analysisItem, this.emptyAnalysesMessage);

    // Get all analysis items
    const items = await this.page.locator(this.analysisItem).all();
    if (items.length === 0) {
      throw new Error('No analysis items found in the list');
    }
    if (!items[index]) {
      throw new Error(`Analysis item at index ${index} not found (${items.length} items available)`);
    }

    // Click the entire item (it's a clickable li element, no separate View button)
    await items[index].click();
    // Wait for URL to change to /insights/:id
    await this.page.waitForURL(/\/insights\/[^/]+$/, { timeout: E2E_TIMEOUTS.navigation });
    await this.waitForNavigation();
  }

  /**
   * Delete the user account (danger zone)
   *
   * @param confirm - Whether to confirm deletion
   */
  async deleteAccount(confirm = true): Promise<void> {
    await this.clickTab('danger');
    await this.page.click(this.deleteAccountButton);

    if (confirm) {
      await this.page.click(this.confirmDeleteButton);
    } else {
      await this.page.click(this.cancelDeleteButton);
    }

    await this.waitForNavigation();
  }

  /**
   * Check if profile success message is displayed
   *
   * @returns True if profile success message visible
   */
  async hasProfileSuccessMessage(): Promise<boolean> {
    try {
      return await this.page.locator(this.profileSuccessMessage).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Profile success message check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Check if profile error message is displayed
   *
   * @returns True if profile error message visible
   */
  async hasProfileErrorMessage(): Promise<boolean> {
    try {
      return await this.page.locator(this.profileErrorMessage).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Profile error message check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Check if password success message is displayed
   *
   * @returns True if password success message visible
   */
  async hasPasswordSuccessMessage(): Promise<boolean> {
    try {
      return await this.page.locator(this.passwordSuccessMessage).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Password success message check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Check if password error message is displayed
   *
   * @returns True if password error message visible
   */
  async hasPasswordErrorMessage(): Promise<boolean> {
    try {
      return await this.page.locator(this.passwordErrorMessage).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Password error message check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Get the current profile name value
   *
   * @returns Current name value
   */
  async getProfileName(): Promise<string> {
    await this.clickTab('profile');
    return await this.page.inputValue(this.nameInput);
  }
}
