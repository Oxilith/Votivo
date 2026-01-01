/**
 * @file e2e/pages/RegisterPage.ts
 * @purpose Page object for user registration functionality
 * @functionality
 * - Provides registration form interaction methods
 * - Handles all profile fields (name, email, password, birthYear, gender)
 * - Validates form submission and error states
 * - Supports navigation to login form
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';

/**
 * Registration data interface matching the form fields
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthYear: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
}

/**
 * Page object for the registration form.
 *
 * Selectors are based on RegisterForm.tsx component structure:
 * - Name input with autocomplete="name"
 * - Email input with type="email"
 * - Password inputs with autocomplete="new-password"
 * - Birth year input with type="number"
 * - Gender select dropdown
 */
export class RegisterPage extends BasePage {
  // Form field selectors
  readonly nameInput = 'input[autocomplete="name"]';
  readonly emailInput = 'input[type="email"]';
  readonly passwordInput = 'input[autocomplete="new-password"]:first-of-type';
  readonly confirmPasswordInput = 'input[autocomplete="new-password"]:nth-of-type(2)';
  readonly birthYearInput = 'input[type="number"]';
  readonly genderSelect = 'select#gender, select[name="gender"]';
  readonly submitButton = 'button[type="submit"]';

  // Error display
  readonly errorAlert = '[role="alert"]';

  // Navigation
  readonly signInLink = 'button:has-text("Sign in"), a:has-text("Sign in")';

  /**
   * Navigate to the auth page and switch to register form
   */
  async navigate(): Promise<void> {
    await this.goto('/auth');

    // Check if we need to switch from login to register
    const nameInput = this.page.locator(this.nameInput);
    if (!(await nameInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Click switch to register
      await this.page.click(this.signInLink);
      await this.page.waitForSelector(this.nameInput);
    }
  }

  /**
   * Fill all registration form fields
   *
   * @param data - Registration data object
   */
  async fillForm(data: RegistrationData): Promise<void> {
    await this.page.fill(this.nameInput, data.name);
    await this.page.fill(this.emailInput, data.email);

    // Handle password fields - may need to locate differently
    const passwordInputs = await this.page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill(data.password);
      await passwordInputs[1].fill(data.confirmPassword);
    } else {
      // Fallback to original selectors
      await this.page.fill(this.passwordInput, data.password);
      await this.page.fill(this.confirmPasswordInput, data.confirmPassword);
    }

    await this.page.fill(this.birthYearInput, String(data.birthYear));

    if (data.gender) {
      const genderSelect = this.page.locator(this.genderSelect);
      if (await genderSelect.isVisible()) {
        await genderSelect.selectOption(data.gender);
      }
    }
  }

  /**
   * Submit the registration form
   */
  async submit(): Promise<void> {
    await this.page.click(this.submitButton);
  }

  /**
   * Complete the full registration flow
   *
   * @param data - Registration data object
   */
  async register(data: RegistrationData): Promise<void> {
    await this.fillForm(data);
    await this.submit();

    // Wait for either redirect (success) or error message (failure)
    try {
      await Promise.race([
        this.page.waitForURL('**/', { timeout: 10000 }),
        this.page.waitForSelector(this.errorAlert, { timeout: 10000 }),
      ]);
    } catch {
      // May still be processing
    }

    await this.waitForNavigation();
  }

  /**
   * Get the error message displayed after failed registration
   *
   * @returns Error message text or null if no error displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const alert = this.page.locator(this.errorAlert);
      if (await alert.isVisible({ timeout: 3000 })) {
        return await alert.textContent();
      }
    } catch {
      // No error displayed
    }
    return null;
  }

  /**
   * Check if the registration form is visible
   *
   * @returns True if the registration form is displayed
   */
  async isRegisterFormVisible(): Promise<boolean> {
    return await this.page.locator(this.nameInput).isVisible();
  }

  /**
   * Click the sign in link to switch to login form
   */
  async clickSignIn(): Promise<void> {
    await this.page.click(this.signInLink);
    await this.waitForNavigation();
  }
}
