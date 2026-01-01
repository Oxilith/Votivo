/**
 * @file e2e/__tests__/auth/login.spec.ts
 * @purpose E2E tests for user login functionality
 * @functionality
 * - Tests login form display
 * - Tests validation errors for empty fields
 * - Tests error display for invalid credentials
 * - Tests successful login flow
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - LoginPage page object
 */

import { test, expect, createTestUser } from '../../fixtures';
import { LoginPage, RegisterPage } from '../../pages';

test.describe('User Login', () => {
  test('should display login form on auth page', async ({ loginPage }) => {
    await loginPage.navigate();

    expect(await loginPage.isLoginFormVisible()).toBe(true);
  });

  test('should show validation error for empty email', async ({ loginPage }) => {
    await loginPage.navigate();

    // Submit with empty fields
    await loginPage.fillPassword('somepassword');
    await loginPage.submit();

    // Should show validation error
    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('nonexistent@test.votive.local', 'WrongPass123!');

    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
    expect(error?.toLowerCase()).toMatch(/invalid|incorrect|wrong|failed/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // First register a new user
    const testUser = createTestUser();
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      birthYear: testUser.birthYear,
      gender: testUser.gender,
    });

    // Should be logged in after registration
    expect(page.url()).not.toContain('/auth');

    // Clear cookies to simulate logout
    await page.context().clearCookies();

    // Login again with the same credentials
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);

    // Should be redirected away from auth page
    expect(page.url()).not.toContain('/auth');
  });

  test('should navigate to forgot password page', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.clickForgotPassword();

    // Should show password reset form or navigate to reset page
    const hasResetContent = await loginPage.hasText('reset') || await loginPage.hasText('Reset');
    expect(hasResetContent).toBe(true);
  });

  test('should navigate to register form', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.clickSignUp();

    // Should now show register form (name field visible)
    const registerPage = new RegisterPage(loginPage.page);
    expect(await registerPage.isRegisterFormVisible()).toBe(true);
  });
});
