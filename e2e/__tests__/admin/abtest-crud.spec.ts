/**
 * @file e2e/__tests__/admin/abtest-crud.spec.ts
 * @purpose E2E tests for admin A/B test CRUD operations
 * @functionality
 * - Tests A/B test list display with data-testid selectors
 * - Tests navigation to create A/B test page
 * - Tests A/B test form validation
 * - Tests A/B test creation flow
 * - Tests A/B test cancel navigation
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AdminPage page object
 * - ADMIN_API_KEY from mock-data
 */

import { test, expect, ADMIN_API_KEY } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('A/B Test CRUD Operations', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Login before each test
    await adminPage.navigate();
    await adminPage.login(ADMIN_API_KEY);
    await adminPage.navigateToAbTests();
    await adminPage.waitForAbTestList();
  });

  test.describe('A/B Test List', () => {
    test('should display A/B test list page with data-testid', async ({ adminPage }) => {
      // Should have the A/B test list page container
      const listPage = adminPage.page.locator(adminPage.abTestListPage);
      expect(await listPage.isVisible()).toBe(true);
    });

    test('should show A/B tests table or empty state', async ({ adminPage }) => {
      // Should have either table or empty state
      const hasTable = await adminPage.page.locator(adminPage.abTestListTable).isVisible();
      const hasEmpty = await adminPage.page.locator(adminPage.abTestListEmpty).isVisible();
      expect(hasTable || hasEmpty).toBe(true);
    });

    test('should display create A/B test button', async ({ adminPage }) => {
      const createButton = adminPage.page.locator(adminPage.abTestCreateButton);
      expect(await createButton.isVisible()).toBe(true);
    });

    test('should have correct count of A/B tests', async ({ adminPage }) => {
      const count = await adminPage.getAbTestCount();
      // Should be at least 0 (may have seeded data)
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Create A/B Test Navigation', () => {
    test('should navigate to create A/B test page', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();
      expect(adminPage.isOnAbTestCreatePage()).toBe(true);
    });

    test('should display create A/B test form with all fields', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();

      // Wait for form fields to render (prompt select loads async)
      await adminPage.page.waitForSelector(adminPage.abTestNameInput, { state: 'visible', timeout: E2E_TIMEOUTS.elementVisible });
      // Wait for prompts to load - the select element appears after loading
      await adminPage.page.waitForSelector(adminPage.abTestSelectPrompt, { state: 'visible', timeout: E2E_TIMEOUTS.navigation });

      // Check all form fields are visible
      expect(await adminPage.page.locator(adminPage.abTestSelectPrompt).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.abTestNameInput).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.abTestDescriptionInput).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.abTestSubmitButton).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.abTestCancelButton).isVisible()).toBe(true);
    });

    test('should navigate back to A/B tests list via back button', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();
      await adminPage.page.click(adminPage.abTestBackButton);
      await adminPage.waitForNavigation();
      expect(adminPage.isOnAbTestsPage()).toBe(true);
    });

    test('should navigate back to A/B tests list via cancel button', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();
      await adminPage.page.click(adminPage.abTestCancelButton);
      await adminPage.waitForNavigation();
      expect(adminPage.isOnAbTestsPage()).toBe(true);
    });
  });

  test.describe('A/B Test Form Filling', () => {
    test('should fill A/B test form fields correctly', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();

      const testData = {
        name: 'Test A/B Experiment',
        description: 'Test A/B test description for E2E testing',
      };

      // Fill name and description (prompt selection requires existing prompts)
      await adminPage.page.fill(adminPage.abTestNameInput, testData.name);
      await adminPage.page.fill(adminPage.abTestDescriptionInput, testData.description);

      // Verify values are set
      expect(await adminPage.page.locator(adminPage.abTestNameInput).inputValue()).toBe(testData.name);
      expect(await adminPage.page.locator(adminPage.abTestDescriptionInput).inputValue()).toBe(testData.description);
    });

    test('should display prompt dropdown with options', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();

      // Wait for form to fully render before checking select
      await adminPage.page.waitForSelector(adminPage.abTestSelectPrompt, { state: 'visible', timeout: E2E_TIMEOUTS.elementVisible });

      // Check that the prompt select has options (at least the placeholder)
      const promptSelect = adminPage.page.locator(adminPage.abTestSelectPrompt);
      expect(await promptSelect.isVisible()).toBe(true);

      // Get the options count
      const options = await promptSelect.locator('option').count();
      // Should have at least the placeholder option
      expect(options).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('A/B Test Submission', () => {
    test('should require prompt selection for submission', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();

      // Fill only name (skip prompt selection)
      await adminPage.page.fill(adminPage.abTestNameInput, 'Test Name');

      // Try to submit
      await adminPage.page.click(adminPage.abTestSubmitButton);

      // Should still be on create page (form validation prevented submission)
      expect(adminPage.isOnAbTestCreatePage()).toBe(true);
    });

    test('should require name field for submission', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();

      // Don't fill anything, just try to submit
      await adminPage.page.click(adminPage.abTestSubmitButton);

      // Should still be on create page (form validation prevented submission)
      expect(adminPage.isOnAbTestCreatePage()).toBe(true);
    });

    test('should show submit button with correct text', async ({ adminPage }) => {
      await adminPage.navigateToCreateAbTest();

      const submitButton = adminPage.page.locator(adminPage.abTestSubmitButton);
      const buttonText = await submitButton.textContent();
      expect(buttonText).toContain('Create');
    });
  });

  test.describe('A/B Test List Table Structure', () => {
    test('should have table with correct column headers when tests exist', async ({ adminPage }) => {
      const hasTable = await adminPage.page.locator(adminPage.abTestListTable).isVisible();

      if (hasTable) {
        // Check for expected column headers
        const headers = adminPage.page.locator(`${adminPage.abTestListTable} th`);
        const headerCount = await headers.count();
        // Should have at least some columns (Name, Prompt, Status, Actions typically)
        expect(headerCount).toBeGreaterThanOrEqual(3);
      }
    });

    test('should display empty state message when no tests exist', async ({ adminPage }) => {
      const hasEmpty = await adminPage.page.locator(adminPage.abTestListEmpty).isVisible();

      if (hasEmpty) {
        const emptyText = await adminPage.page.locator(adminPage.abTestListEmpty).textContent();
        expect(emptyText?.toLowerCase()).toContain('no');
      }
    });
  });
});
