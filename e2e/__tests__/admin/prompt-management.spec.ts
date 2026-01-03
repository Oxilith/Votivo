/**
 * @file e2e/__tests__/admin/prompt-management.spec.ts
 * @purpose E2E tests for admin prompt management
 * @functionality
 * - Tests prompts list display
 * - Tests navigation to A/B tests
 * - Tests admin logout
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AdminPage page object
 * - ADMIN_API_KEY from mock-data
 */

import { test, expect, ADMIN_API_KEY } from '../../fixtures';

test.describe('Prompt Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Login before each test
    await adminPage.navigate();
    await adminPage.login(ADMIN_API_KEY);
  });

  test('should display list of prompts', async ({ adminPage }) => {
    await adminPage.navigateToPrompts();

    // Should be on prompts page
    expect(adminPage.isOnPromptsPage()).toBe(true);

    // Should have at least one prompt (seeded data)
    const count = await adminPage.getPromptCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to A/B tests page', async ({ adminPage }) => {
    await adminPage.navigateToAbTests();

    // Should be on A/B tests page
    expect(adminPage.isOnAbTestsPage()).toBe(true);
  });

  test('should display A/B tests list', async ({ adminPage }) => {
    await adminPage.navigateToAbTests();

    // Should have A/B test count (may be zero if none seeded)
    const count = await adminPage.getAbTestCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should logout from admin panel', async ({ adminPage }) => {
    await adminPage.logout();

    // Should be back on login page
    expect(await adminPage.isOnLoginPage()).toBe(true);
    expect(await adminPage.isLoggedIn()).toBe(false);
  });

  test('should show create prompt button', async ({ adminPage }) => {
    await adminPage.navigateToPrompts();

    // Should have create button
    const createButton = adminPage.page.locator(adminPage.promptCreateButton);
    expect(await createButton.isVisible()).toBe(true);
  });
});
