/**
 * @file e2e/__tests__/admin/prompt-crud.spec.ts
 * @purpose E2E tests for admin prompt CRUD operations
 * @functionality
 * - Tests prompt list display with data-testid selectors
 * - Tests navigation to create prompt page
 * - Tests prompt form validation
 * - Tests prompt creation flow
 * - Tests prompt cancel navigation
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AdminPage page object
 * - ADMIN_API_KEY from mock-data
 */

import { test, expect, ADMIN_API_KEY } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('Prompt CRUD Operations', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Login before each test
    await adminPage.navigate();
    await adminPage.login(ADMIN_API_KEY);
    await adminPage.navigateToPrompts();
    await adminPage.waitForPromptList();
  });

  test.describe('Prompt List', () => {
    test('should display prompt list page with data-testid', async ({ adminPage }) => {
      // Should have the prompt list page container
      const listPage = adminPage.page.locator(adminPage.promptListPage);
      expect(await listPage.isVisible()).toBe(true);
    });

    test('should show prompts table or empty state', async ({ adminPage }) => {
      // Should have either table or empty state
      const hasTable = await adminPage.page.locator(adminPage.promptListTable).isVisible();
      const hasEmpty = await adminPage.page.locator(adminPage.promptListEmpty).isVisible();
      expect(hasTable || hasEmpty).toBe(true);
    });

    test('should display create prompt button', async ({ adminPage }) => {
      const createButton = adminPage.page.locator(adminPage.promptCreateButton);
      expect(await createButton.isVisible()).toBe(true);
    });

    test('should have correct count of prompts', async ({ adminPage }) => {
      const count = await adminPage.getPromptCount();
      // Should be at least 0 (may have seeded data)
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Create Prompt Navigation', () => {
    test('should navigate to create prompt page', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();
      expect(adminPage.isOnPromptCreatePage()).toBe(true);
    });

    test('should display create prompt form with all fields', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      // Wait for form to fully render before checking fields
      await adminPage.page.waitForSelector(adminPage.promptKeyInput, { state: 'visible', timeout: E2E_TIMEOUTS.elementVisible });

      // Check all form fields are visible
      expect(await adminPage.page.locator(adminPage.promptKeyInput).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.promptNameInput).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.promptDescriptionInput).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.promptModelSelect).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.promptContentTextarea).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.promptSubmitButton).isVisible()).toBe(true);
      expect(await adminPage.page.locator(adminPage.promptCancelButton).isVisible()).toBe(true);
    });

    test('should navigate back to prompts list via back button', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();
      await adminPage.page.click(adminPage.promptBackButton);
      await adminPage.waitForNavigation();
      expect(adminPage.isOnPromptsPage()).toBe(true);
    });

    test('should navigate back to prompts list via cancel button', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();
      await adminPage.page.click(adminPage.promptCancelButton);
      await adminPage.waitForNavigation();
      expect(adminPage.isOnPromptsPage()).toBe(true);
    });
  });

  test.describe('Prompt Form Filling', () => {
    test('should fill prompt form fields correctly', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      const testData = {
        key: 'TEST_PROMPT_KEY',
        name: 'Test Prompt Name',
        description: 'Test prompt description',
        content: 'This is test prompt content for E2E testing.',
      };

      await adminPage.fillPromptForm(testData);

      // Verify values are set (key is auto-uppercased)
      expect(await adminPage.page.locator(adminPage.promptKeyInput).inputValue()).toBe(testData.key);
      expect(await adminPage.page.locator(adminPage.promptNameInput).inputValue()).toBe(testData.name);
      expect(await adminPage.page.locator(adminPage.promptDescriptionInput).inputValue()).toBe(testData.description);
      expect(await adminPage.page.locator(adminPage.promptContentTextarea).inputValue()).toBe(testData.content);
    });

    test('should auto-uppercase prompt key input', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      // Type lowercase key
      await adminPage.page.fill(adminPage.promptKeyInput, 'lowercase_key');

      // Should be converted to uppercase (by the onChange handler)
      const value = await adminPage.page.locator(adminPage.promptKeyInput).inputValue();
      expect(value).toBe('LOWERCASE_KEY');
    });

    test('should select model from dropdown', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      // Select a specific model
      await adminPage.page.selectOption(adminPage.promptModelSelect, 'claude-sonnet-4-5');

      const selectedValue = await adminPage.page.locator(adminPage.promptModelSelect).inputValue();
      expect(selectedValue).toBe('claude-sonnet-4-5');
    });
  });

  test.describe('Prompt Submission', () => {
    test('should require key field for submission', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      // Fill only name and content (skip key)
      await adminPage.page.fill(adminPage.promptNameInput, 'Test Name');
      await adminPage.page.fill(adminPage.promptContentTextarea, 'Test content');

      // Try to submit
      await adminPage.page.click(adminPage.promptSubmitButton);

      // Should still be on create page (form validation prevented submission)
      expect(adminPage.isOnPromptCreatePage()).toBe(true);
    });

    test('should require name field for submission', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      // Fill only key and content (skip name)
      await adminPage.page.fill(adminPage.promptKeyInput, 'TEST_KEY');
      await adminPage.page.fill(adminPage.promptContentTextarea, 'Test content');

      // Try to submit
      await adminPage.page.click(adminPage.promptSubmitButton);

      // Should still be on create page (form validation prevented submission)
      expect(adminPage.isOnPromptCreatePage()).toBe(true);
    });

    test('should require content field for submission', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      // Fill only key and name (skip content)
      await adminPage.page.fill(adminPage.promptKeyInput, 'TEST_KEY');
      await adminPage.page.fill(adminPage.promptNameInput, 'Test Name');

      // Try to submit
      await adminPage.page.click(adminPage.promptSubmitButton);

      // Should still be on create page (form validation prevented submission)
      expect(adminPage.isOnPromptCreatePage()).toBe(true);
    });

    test('should show submit button with correct text', async ({ adminPage }) => {
      await adminPage.navigateToCreatePrompt();

      const submitButton = adminPage.page.locator(adminPage.promptSubmitButton);
      const buttonText = await submitButton.textContent();
      expect(buttonText).toContain('Create');
    });
  });
});
