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
  readonly errorAlert = '[role="alert"]';

  // Navigation links
  readonly forgotPasswordLink = 'button:has-text("forgot"), a:has-text("forgot")';
  readonly signUpLink = 'button:has-text("Sign up"), a:has-text("Sign up")';

  /**
   * Navigate to the auth page with login form
   */
  async navigate(): Promise<void> {
    await this.goto('/auth');
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
    await this.submit();

    // Wait for either redirect (success) or error message (failure)
    try {
      await Promise.race([
        this.page.waitForURL('**/', { timeout: 10000 }),
        this.page.waitForSelector(this.errorAlert, { timeout: 10000 }),
      ]);
    } catch {
      // May still be processing, continue
    }

    await this.waitForNavigation();
  }

  /**
   * Get the error message displayed after failed login
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
