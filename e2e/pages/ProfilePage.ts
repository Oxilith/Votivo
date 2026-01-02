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
  readonly saveProfileButton = 'button:has-text("Save")';

  // Password form selectors
  readonly currentPasswordInput = 'input[autocomplete="current-password"]';
  readonly newPasswordInput = 'input[autocomplete="new-password"]:first-of-type';
  readonly confirmNewPasswordInput = 'input[autocomplete="new-password"]:last-of-type';
  readonly changePasswordButton = 'button:has-text("Change Password")';

  // List selectors (use data-testid prefix match for reliable E2E testing)
  readonly assessmentItem = '[data-testid^="assessment-item-"]';
  readonly analysisItem = '[data-testid^="analysis-item-"]';
  readonly viewButton = 'button:has-text("View"), a:has-text("View")';

  // Loading and empty state selectors
  readonly loadingIndicator = '[data-testid="ink-loader"], .animate-spin';
  readonly emptyAssessmentsMessage = 'text=/no.*assessment|empty/i';
  readonly emptyAnalysesMessage = 'text=/no.*analysis|empty/i';

  // Danger zone selectors
  readonly deleteAccountButton = 'button:has-text("Delete Account")';
  readonly confirmDeleteButton = 'button:has-text("Confirm"), button:has-text("Yes")';
  readonly cancelDeleteButton = 'button:has-text("Cancel"), button:has-text("No")';

  // Status messages
  readonly successMessage = '[class*="success"], [role="status"]';
  readonly errorMessage = '[role="alert"], [class*="error"]';

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
    await this.page.locator(tabSelectors[tab]).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.click(tabSelectors[tab]);
    await this.page.waitForTimeout(300);
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
   * Waits for loading indicator to disappear and either items or empty state to appear
   */
  private async waitForListLoaded(
    itemSelector: string,
    emptyMessageSelector: string,
  ): Promise<void> {
    // Wait for any loading indicator to disappear (if present)
    await this.page
      .locator(this.loadingIndicator)
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {
        // Loading might have already finished, ignore
      });

    // Wait for either items or empty state message
    await Promise.race([
      this.page
        .locator(itemSelector)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 }),
      this.page
        .locator(emptyMessageSelector)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // If neither appears within timeout, we'll just count what's there
    });
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
    const items = await this.page.locator(this.assessmentItem).all();
    if (items[index]) {
      // Click the entire item (it's a clickable li element, no separate View button)
      await items[index].click();
      // Wait for URL to change to /assessment/:id
      await this.page.waitForURL(/\/assessment\/[^/]+$/, { timeout: 10000 });
      await this.waitForNavigation();
    }
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
    const items = await this.page.locator(this.analysisItem).all();
    if (items[index]) {
      // Click the entire item (it's a clickable li element, no separate View button)
      await items[index].click();
      // Wait for URL to change to /insights/:id
      await this.page.waitForURL(/\/insights\/[^/]+$/, { timeout: 10000 });
      await this.waitForNavigation();
    }
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
   * Check if success message is displayed
   *
   * @returns True if success message visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.page.locator(this.successMessage).isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Check if error message is displayed
   *
   * @returns True if error message visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.page.locator(this.errorMessage).isVisible({ timeout: 3000 }).catch(() => false);
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
