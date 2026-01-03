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
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

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
  readonly errorAlert = '[data-testid="register-error"]';
  // Inline validation errors (from FormInput)
  readonly validationError = '[role="alert"]';

  // Navigation
  readonly signInLink = '[data-testid="register-btn-login"]';

  /**
   * Navigate to the sign-up page with register form
   */
  async navigate(): Promise<void> {
    await this.goto('/sign-up');
    await this.page.waitForSelector(this.nameInput);
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
   * Handles both client-side validation errors (instant) and server-side
   * errors (requires API call). Client-side validation errors appear
   * immediately without an API call, so we check for those first.
   *
   * @param data - Registration data object
   */
  async register(data: RegistrationData): Promise<void> {
    await this.fillForm(data);
    await this.submit();

    // First check for immediate client-side validation errors (appear instantly)
    // These don't trigger API calls, so we shouldn't wait for network response
    const immediateError = await this.page
      .locator(this.errorAlert)
      .isVisible({ timeout: E2E_TIMEOUTS.clientValidation })
      .catch(() => false);

    if (immediateError) {
      // Client-side validation failed - error already visible, no API call made
      return;
    }

    // No immediate error - wait for API response and subsequent result
    try {
      await Promise.race([
        this.page.waitForURL((url) => !url.pathname.includes('/sign-up'), { timeout: E2E_TIMEOUTS.navigation }),
        this.page.waitForSelector(this.errorAlert, { timeout: E2E_TIMEOUTS.navigation }),
      ]);
    } catch (error) {
      // Log non-timeout errors for debugging
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Registration completion wait failed:', error.message);
      }
    }
  }

  /**
   * Get the error message displayed after failed registration
   * Checks both main error alert and inline validation errors
   *
   * @returns Error message text or null if no error displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      // First check main error alert (API errors)
      const alert = this.page.locator(this.errorAlert);
      if (await alert.isVisible({ timeout: E2E_TIMEOUTS.elementQuick })) {
        return await alert.textContent();
      }
    } catch {
      // Main alert not visible, check inline validation errors
    }

    try {
      // Check inline validation errors (form field errors from FormInput)
      const validationErrors = this.page.locator(this.validationError);
      const count = await validationErrors.count();
      if (count > 0) {
        const firstError = validationErrors.first();
        if (await firstError.isVisible({ timeout: E2E_TIMEOUTS.elementQuick })) {
          return await firstError.textContent();
        }
      }
    } catch {
      // No validation errors either
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
