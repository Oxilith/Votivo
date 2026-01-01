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

    const error = await registerPage.getErrorMessage();
    expect(error).toBeTruthy();
    expect(error?.toLowerCase()).toMatch(/already|exists|registered|duplicate/);
  });

  test('should show error for weak password', async ({ registerPage, testUser }) => {
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: 'weak', // Too short, no uppercase/number
      confirmPassword: 'weak',
      birthYear: testUser.birthYear,
    });

    const error = await registerPage.getErrorMessage();
    expect(error).toBeTruthy();
    // Should indicate password requirements
    expect(error?.toLowerCase()).toMatch(/password|character|uppercase|number|strong/);
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
    expect(error?.toLowerCase()).toMatch(/match|same|confirm/);
  });

  test('should navigate to login form', async ({ registerPage }) => {
    await registerPage.navigate();
    await registerPage.clickSignIn();

    // Should now show login form (name field not visible)
    expect(await registerPage.isRegisterFormVisible()).toBe(false);
  });
});
