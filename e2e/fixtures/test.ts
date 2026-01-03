/**
 * @file e2e/fixtures/test.ts
 * @purpose Custom Playwright fixtures with authentication helpers
 * @functionality
 * - Provides pre-configured page object fixtures
 * - Generates unique test users per test
 * - Creates authenticated page fixture for protected routes
 * - Exports extended test and expect from Playwright
 * @dependencies
 * - @playwright/test for base fixtures
 * - @faker-js/faker for test data generation
 * - Page objects from ../pages
 */

import { test as base, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import {
  LoginPage,
  RegisterPage,
  AssessmentPage,
  InsightsPage,
  ProfilePage,
  AdminPage,
  LayoutPage,
  CSRF_COOKIE_NAME,
} from '../pages';
import { DEFAULT_TEST_PASSWORD, E2E_TIMEOUTS } from './mock-data';

/**
 * Error marker for non-retriable registration failures (e.g., duplicate user).
 * Used to detect and skip retry logic for permanent errors.
 */
const NO_RETRY_MARKER = '[NO_RETRY]';

/**
 * Test user interface with all required registration fields
 */
export interface TestUser {
  name: string;
  email: string;
  password: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
}

/**
 * Extended test fixtures interface
 */
interface TestFixtures {
  /** Login page object */
  loginPage: LoginPage;
  /** Register page object */
  registerPage: RegisterPage;
  /** Assessment page object */
  assessmentPage: AssessmentPage;
  /** Insights page object */
  insightsPage: InsightsPage;
  /** Profile page object */
  profilePage: ProfilePage;
  /** Admin page object */
  adminPage: AdminPage;
  /** Layout page object for layout/responsive/theme testing */
  layoutPage: LayoutPage;
  /** Generated test user with unique email */
  testUser: TestUser;
  /** Pre-authenticated page (user already registered and logged in) */
  authenticatedPage: Page;
}

/**
 * Extended Playwright test with custom fixtures.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/test';
 *
 * test('example', async ({ loginPage, testUser }) => {
 *   await loginPage.navigate();
 *   await loginPage.login(testUser.email, testUser.password);
 * });
 * ```
 */
export const test = base.extend<TestFixtures>({
  // Page object fixtures - each test gets fresh instances
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  assessmentPage: async ({ page }, use) => {
    await use(new AssessmentPage(page));
  },

  insightsPage: async ({ page }, use) => {
    await use(new InsightsPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },

  layoutPage: async ({ page }, use) => {
    await use(new LayoutPage(page));
  },

  // Generate unique test user for each test
  // This ensures test isolation - no user conflicts between parallel tests
  testUser: async ({}, use) => {
    const user: TestUser = {
      name: faker.person.fullName(),
      email: `e2e-${faker.string.uuid().slice(0, 8)}@test.votive.local`,
      password: DEFAULT_TEST_PASSWORD,
      birthYear: faker.number.int({ min: 1960, max: 2005 }),
      gender: 'prefer-not-to-say',
    };
    await use(user);
  },

  // Pre-authenticated page fixture
  // Registers a new user and returns a page that's already logged in
  authenticatedPage: async ({ page, testUser }, use) => {
    const registerPage = new RegisterPage(page);

    // Retry registration up to 3 times to handle transient network issues
    let lastError: Error | null = null;
    const baseDelay = 1000; // Exponential backoff starting point

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await registerPage.navigate();

        // Use the register method which handles form fill and API waiting
        await registerPage.register({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          confirmPassword: testUser.password,
          birthYear: testUser.birthYear,
          gender: testUser.gender,
        });

        // Verify login success with BOTH cookie AND UI (robust detection)
        // Check for CSRF cookie (httpOnly - must use Playwright's context.cookies())
        const cookies = await page.context().cookies();
        const hasCsrfCookie = cookies.some((c) => c.name === CSRF_COOKIE_NAME);

        // Check for user avatar in UI
        const isAvatarVisible = await page
          .locator('[data-testid="user-avatar-dropdown"]')
          .isVisible({ timeout: E2E_TIMEOUTS.elementVisible })
          .catch(() => false);

        // Require BOTH conditions for robust login verification
        if (hasCsrfCookie && isAvatarVisible) {
          // Success - fully logged in (cookie set + UI updated)
          if (attempt > 1) {
            console.log(`[authenticatedPage] Registration succeeded on attempt ${attempt}`);
          }
          await use(page);
          // Cleanup: clear cookies to prevent state leakage
          await page.context().clearCookies();
          return;
        }

        // Check for error message using data-testid (i18n-compatible)
        const errorAlert = page.locator('[data-testid="register-error"]');
        const errorVisible = await errorAlert
          .isVisible({ timeout: E2E_TIMEOUTS.elementQuick })
          .catch(() => false);
        if (errorVisible) {
          const errorText = await errorAlert.textContent();
          // Check for duplicate user error - don't retry if user already exists
          // Note: This text check is kept for error classification, but the error is detected via data-testid
          if (errorText?.toLowerCase().includes('already exists') || errorText?.toLowerCase().includes('already registered')) {
            throw new Error(`Registration failed: ${errorText} ${NO_RETRY_MARKER}`);
          }
          lastError = new Error(`Registration failed: ${errorText}`);
        } else {
          // Provide more context on why login check failed
          lastError = new Error(
            `Registration failed - login verification incomplete. Cookie: ${hasCsrfCookie}, Avatar: ${isAvatarVisible}`
          );
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Don't retry if it's a non-retriable error (e.g., duplicate user)
        if (lastError.message.includes(NO_RETRY_MARKER)) {
          throw lastError;
        }
      }

      // Exponential backoff before retry
      if (attempt < 3) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s
        console.log(`[authenticatedPage] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await page.waitForTimeout(delay);
      }
    }

    throw lastError ?? new Error('Registration failed after 3 attempts');
  },
});

/**
 * Re-export expect from Playwright for convenient imports
 */
export { expect } from '@playwright/test';

/**
 * Helper to create a test user without registering
 *
 * @returns Fresh test user data
 */
export function createTestUser(): TestUser {
  return {
    name: faker.person.fullName(),
    email: `e2e-${faker.string.uuid().slice(0, 8)}@test.votive.local`,
    password: DEFAULT_TEST_PASSWORD,
    birthYear: faker.number.int({ min: 1960, max: 2005 }),
    gender: 'prefer-not-to-say',
  };
}
