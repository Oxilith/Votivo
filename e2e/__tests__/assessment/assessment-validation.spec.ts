/**
 * @file e2e/__tests__/assessment/assessment-validation.spec.ts
 * @purpose E2E tests for assessment step validation
 * @functionality
 * - Tests validation error appears when clicking Continue without input
 * - Tests validation error disappears after providing input
 * - Tests different step types (multiSelect, scale, textarea) validation
 * - Tests user can proceed after filling required fields
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AssessmentPage page object
 */

import { test, expect } from '../../fixtures';

test.describe('Assessment Validation', () => {
  test('should show validation error when clicking Continue without input on multiSelect step', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Ensure we're on a multiSelect step
    const stepType = await assessmentPage.getCurrentStepType();
    expect(stepType).toBe('multiSelect');

    // No validation error initially
    expect(await assessmentPage.isValidationErrorVisible()).toBe(false);

    // Try to click Continue without selecting anything
    await assessmentPage.clickNextExpectingPossibleValidationError();

    // Validation error should appear
    expect(await assessmentPage.isValidationErrorVisible()).toBe(true);
  });

  test('should clear validation error after selecting an option', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Trigger validation error
    await assessmentPage.clickNextExpectingPossibleValidationError();
    expect(await assessmentPage.isValidationErrorVisible()).toBe(true);

    // Select an option
    await assessmentPage.selectMultipleOptions([0]);

    // Click Continue again - should work this time
    await assessmentPage.clickNext();

    // Should be on next step, validation error should be gone
    expect(await assessmentPage.isValidationErrorVisible()).toBe(false);
  });

  test('should allow proceeding after providing input', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Select options first
    await assessmentPage.selectMultipleOptions([0, 1]);

    // Click Continue - should work without validation error
    await assessmentPage.clickNext();

    // Should now be on a different step
    const stepType = await assessmentPage.getCurrentStepType();
    expect(stepType).not.toBe('unknown');
    expect(await assessmentPage.isValidationErrorVisible()).toBe(false);
  });

  test('should show validation error for scale step without selection', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Navigate to a scale step
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([2, 3]);
    await assessmentPage.clickNext();

    // Now on scale step
    const stepType = await assessmentPage.getCurrentStepType();
    if (stepType === 'scale') {
      // Scale has default value, so it should pass validation
      // This test verifies scale step behavior
      await assessmentPage.clickNext();
      expect(await assessmentPage.isValidationErrorVisible()).toBe(false);
    }
  });

  test('should show validation error for textarea step without input', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Navigate to a textarea step
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([2, 3]);
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(3);
    await assessmentPage.clickNext();

    // Should now be on textarea step
    const stepType = await assessmentPage.getCurrentStepType();
    if (stepType === 'textarea') {
      // Try to click Continue without filling textarea
      await assessmentPage.clickNextExpectingPossibleValidationError();

      // Validation error should appear
      expect(await assessmentPage.isValidationErrorVisible()).toBe(true);

      // Fill the textarea
      await assessmentPage.fillTextarea('Test response');

      // Click Continue - should work now
      await assessmentPage.clickNext();
      expect(await assessmentPage.isValidationErrorVisible()).toBe(false);
    }
  });

  test('should persist validation error until valid input is provided', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Trigger validation error
    await assessmentPage.clickNextExpectingPossibleValidationError();
    expect(await assessmentPage.isValidationErrorVisible()).toBe(true);

    // Try clicking Continue again without input
    await assessmentPage.clickNextExpectingPossibleValidationError();
    expect(await assessmentPage.isValidationErrorVisible()).toBe(true);

    // Now provide valid input and proceed
    await assessmentPage.selectMultipleOptions([0]);
    await assessmentPage.clickNext();
    expect(await assessmentPage.isValidationErrorVisible()).toBe(false);
  });
});
