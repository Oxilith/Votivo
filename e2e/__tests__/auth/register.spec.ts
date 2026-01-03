/**
 * @file e2e/__tests__/auth/register.spec.ts
 * @purpose E2E tests for user registration functionality
 * @functionality
 * - Tests successful user registration
 * - Tests duplicate email error
 * - Tests password validation errors
 * - Tests password mismatch error
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - RegisterPage page object
 */

import { test, expect, createTestUser } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('User Registration', () => {
  test('should register new user successfully', async ({ registerPage, testUser }) => {
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      birthYear: testUser.birthYear,
      gender: testUser.gender,
    });

    // Should be redirected after successful registration
    expect(registerPage.page.url()).not.toContain('/auth');
  });

  test('should show error for duplicate email', async ({ registerPage, testUser }) => {
    // Register first user
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      birthYear: testUser.birthYear,
    });

    // Ensure first registration is fully complete (redirected away from sign-up)
    await registerPage.page.waitForURL(
      url => !url.pathname.includes('/sign-up'),
      { timeout: E2E_TIMEOUTS.navigation }
    );

    // Clear cookies to log out
    await registerPage.clearCookies();

    // Try to register with same email
    const secondUser = createTestUser();
    await registerPage.navigate();
    await registerPage.register({
      name: secondUser.name,
      email: testUser.email, // Same email as first user
      password: secondUser.password,
      confirmPassword: secondUser.password,
      birthYear: secondUser.birthYear,
    });

    // Wait for error message to appear
    await registerPage.page.waitForSelector(
      '[data-testid="register-error"], [role="alert"]',
      { state: 'visible', timeout: E2E_TIMEOUTS.elementVisible }
    );

    const error = await registerPage.getErrorMessage();
    expect(error).toBeTruthy();
    // API returns "Email already exists" for duplicate registration
    expect(error).toBe('Email already exists');
  });

  test('should show error for weak password', async ({ registerPage, testUser }) => {
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: 'weakpassword', // 12 chars but no uppercase/number (fails complexity)
      confirmPassword: 'weakpassword',
      birthYear: testUser.birthYear,
    });

    const error = await registerPage.getErrorMessage();
    expect(error).toBeTruthy();
    // Frontend validation message for weak password (missing uppercase and number)
    expect(error).toBe('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  });

  test('should show error for password mismatch', async ({ registerPage, testUser }) => {
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: 'DifferentPass456!', // Different from password
      birthYear: testUser.birthYear,
    });

    const error = await registerPage.getErrorMessage();
    expect(error).toBeTruthy();
    // Frontend validation message for password mismatch
    expect(error).toBe('Passwords do not match');
  });

  test('should navigate to login form', async ({ registerPage }) => {
    await registerPage.navigate();
    await registerPage.clickSignIn();

    // Should now show login form (name field not visible)
    expect(await registerPage.isRegisterFormVisible()).toBe(false);
  });
});
