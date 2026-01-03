/**
 * @file e2e/pages/LoginPage.ts
 * @purpose Page object for user login functionality
 * @functionality
 * - Provides login form interaction methods
 * - Handles form field input and submission
 * - Captures and returns error messages
 * - Provides navigation to forgot password and register
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

/**
 * Page object for the login form.
 *
 * Selectors are based on LoginForm.tsx component structure:
 * - Email input with type="email" and autocomplete="email"
 * - Password input with type="password" and autocomplete="current-password"
 * - Submit button with type="submit"
 * - Error alert with role="alert"
 */
export class LoginPage extends BasePage {
  // Form field selectors
  readonly emailInput = 'input[type="email"]';
  readonly passwordInput = 'input[type="password"]';
  readonly submitButton = 'button[type="submit"]';

  // Error display
  readonly errorAlert = '[data-testid="login-error"]';
  // Inline validation errors (from FormInput)
  readonly validationError = '[role="alert"]';

  // Navigation links
  readonly forgotPasswordLink = '[data-testid="login-btn-forgot-password"]';
  readonly signUpLink = '[data-testid="login-btn-register"]';

  /**
   * Navigate to the sign-in page with login form
   */
  async navigate(): Promise<void> {
    await this.goto('/sign-in');
    await this.page.waitForSelector(this.emailInput);
  }

  /**
   * Fill the email input field
   *
   * @param email - Email address to enter
   */
  async fillEmail(email: string): Promise<void> {
    await this.page.fill(this.emailInput, email);
  }

  /**
   * Fill the password input field
   *
   * @param password - Password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.page.fill(this.passwordInput, password);
  }

  /**
   * Click the submit button
   */
  async submit(): Promise<void> {
    await this.page.click(this.submitButton);
  }

  /**
   * Complete the full login flow
   *
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);

    // Wait for API response after submit
    try {
      await Promise.all([
        this.page.waitForResponse(
          (resp) => resp.url().includes('/api/user-auth/login') && resp.status() !== 0,
          { timeout: E2E_TIMEOUTS.apiResponse }
        ),
        this.submit(),
      ]);
    } catch (error) {
      // Only log non-timeout errors - timeouts are expected if response was already received
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Login API response wait failed:', error.message);
      }
    }

    // Wait for either redirect (success) or error message (failure)
    try {
      await Promise.race([
        this.page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: E2E_TIMEOUTS.navigation }),
        this.page.waitForSelector(this.errorAlert, { timeout: E2E_TIMEOUTS.navigation }),
      ]);
    } catch (error) {
      // Timeout expected when neither redirect nor error appeared within timeout
      // Only log non-timeout errors for debugging
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Login completion wait failed:', error.message);
      }
    }

    await this.waitForNavigation();
  }

  /**
   * Get the error message displayed after failed login
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
   * Check if the login form is visible
   *
   * @returns True if the login form is displayed
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.page.locator(this.emailInput).isVisible();
  }

  /**
   * Click the forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.page.click(this.forgotPasswordLink);
    await this.waitForNavigation();
  }

  /**
   * Click the sign up link to switch to register form
   */
  async clickSignUp(): Promise<void> {
    await this.page.click(this.signUpLink);
    await this.waitForNavigation();
  }

  /**
   * Check if submit button is disabled (during loading)
   *
   * @returns True if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.page.locator(this.submitButton).isDisabled();
  }
}
