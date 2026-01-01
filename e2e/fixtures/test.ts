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
} from '../pages';
import { DEFAULT_TEST_PASSWORD } from './mock-data';

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

  // Generate unique test user for each test
  // This ensures test isolation - no user conflicts between parallel tests
  testUser: async (_, use) => {
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
    await registerPage.navigate();
    await registerPage.register({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      birthYear: testUser.birthYear,
      gender: testUser.gender,
    });

    // Wait for successful registration/login redirect
    await page.waitForLoadState('networkidle');

    // Verify we're logged in (not on auth page)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      throw new Error('Registration failed - still on auth page');
    }

    await use(page);
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
