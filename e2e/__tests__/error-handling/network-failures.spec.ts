/**
 * @file e2e/__tests__/error-handling/network-failures.spec.ts
 * @purpose E2E tests for network failure handling across the application
 * @functionality
 * - Tests error display when login API fails with 500
 * - Tests error display when login API times out
 * - Tests error display when registration API is unreachable
 * - Tests error display when analysis API fails
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - Page objects: LoginPage, RegisterPage, AssessmentPage
 * - Playwright route interception for mocking network failures
 */

import { test, expect } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';
import { LoginPage, RegisterPage, AssessmentPage } from '../../pages';

test.describe('Network Failure Handling', () => {
  test.describe('Auth Endpoints', () => {
    test('should show error when login API fails with 500', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Intercept login API and return 500 error
      await page.route('**/api/user-auth/login', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await loginPage.navigate();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('TestPass123');
      await loginPage.submit();

      // Wait for error message to appear
      await page.waitForSelector('[data-testid="login-error"], [role="alert"]', {
        state: 'visible',
        timeout: E2E_TIMEOUTS.elementVisible,
      });

      const error = await loginPage.getErrorMessage();
      expect(error).toBeTruthy();
    });

    test('should show error when login API times out', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Intercept and abort with timeout
      await page.route('**/api/user-auth/login', (route) => route.abort('timedout'));

      await loginPage.navigate();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('TestPass123');
      await loginPage.submit();

      // Wait for error message to appear
      await page.waitForSelector('[data-testid="login-error"], [role="alert"]', {
        state: 'visible',
        timeout: E2E_TIMEOUTS.elementVisible,
      });

      const error = await loginPage.getErrorMessage();
      expect(error).toBeTruthy();
    });

    test('should show error when registration API is unreachable', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Intercept and abort (network failure)
      await page.route('**/api/user-auth/register', (route) => route.abort('failed'));

      await registerPage.navigate();
      await registerPage.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        birthYear: 1990,
        gender: 'prefer-not-to-say',
      });

      // Wait for error message to appear
      await page.waitForSelector('[data-testid="register-error"], [role="alert"]', {
        state: 'visible',
        timeout: E2E_TIMEOUTS.elementVisible,
      });

      const error = await registerPage.getErrorMessage();
      expect(error).toBeTruthy();
    });

    test('should show error when registration API returns 500', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Intercept and return 500 error
      await page.route('**/api/user-auth/register', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await registerPage.navigate();
      await registerPage.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        birthYear: 1990,
        gender: 'prefer-not-to-say',
      });

      // Wait for error message to appear
      await page.waitForSelector('[data-testid="register-error"], [role="alert"]', {
        state: 'visible',
        timeout: E2E_TIMEOUTS.elementVisible,
      });

      const error = await registerPage.getErrorMessage();
      expect(error).toBeTruthy();
    });
  });

  test.describe('AI Analysis Endpoint', () => {
    test('should show error when analysis API fails with 500', async ({ authenticatedPage }) => {
      const assessmentPage = new AssessmentPage(authenticatedPage);

      // Complete an assessment first - this navigates to insights "Ready to Analyze" state
      await assessmentPage.navigate();
      await assessmentPage.completeFullAssessment();

      // Set up route interception BEFORE clicking analyze
      await authenticatedPage.route('**/api/v1/claude/analyze', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Analysis service unavailable' }),
        });
      });

      // Click the "Analyze My Responses" button to trigger analysis
      await authenticatedPage.click('[data-testid="insights-btn-analyze"]');

      // Should show error state or error message
      const errorIndicator = authenticatedPage.locator(
        '[data-testid="insights-error"], [data-testid="error-message"], [role="alert"]'
      );
      await expect(errorIndicator.first()).toBeVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    });

    test('should show error when analysis API times out', async ({ authenticatedPage }) => {
      const assessmentPage = new AssessmentPage(authenticatedPage);

      // Complete an assessment first - this navigates to insights "Ready to Analyze" state
      await assessmentPage.navigate();
      await assessmentPage.completeFullAssessment();

      // Set up route interception BEFORE clicking analyze
      await authenticatedPage.route('**/api/v1/claude/analyze', (route) => route.abort('timedout'));

      // Click the "Analyze My Responses" button to trigger analysis
      await authenticatedPage.click('[data-testid="insights-btn-analyze"]');

      // Should show error state
      const errorIndicator = authenticatedPage.locator(
        '[data-testid="insights-error"], [data-testid="error-message"], [role="alert"]'
      );
      await expect(errorIndicator.first()).toBeVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    });
  });
});
