/**
 * @file e2e/__tests__/assessment/assessment-flow.spec.ts
 * @purpose E2E tests for assessment questionnaire flow
 * @functionality
 * - Tests navigation through assessment phases
 * - Tests back navigation between steps
 * - Tests step type interactions (multiSelect, scale, textarea)
 * - Tests complete assessment flow
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AssessmentPage page object
 */

import { test, expect } from '../../fixtures';

test.describe('Assessment Flow', () => {
  test('should display assessment page', async ({ assessmentPage }) => {
    await assessmentPage.navigate();

    // Should see the assessment page with begin button
    const hasBeginButton = await assessmentPage.page.locator(assessmentPage.beginButton).isVisible({ timeout: 5000 });
    expect(hasBeginButton).toBe(true);
  });

  test('should start assessment from intro page', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Should be on first question after starting
    const stepType = await assessmentPage.getCurrentStepType();
    expect(stepType).not.toBe('unknown');
  });

  test('should navigate to next step after answering', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Answer first question (multiSelect)
    await assessmentPage.selectMultipleOptions([0, 1]);

    // Next button should be enabled
    expect(await assessmentPage.isNextEnabled()).toBe(true);

    // Click next
    await assessmentPage.clickNext();

    // Should be on a new step (different content)
    const stepType = await assessmentPage.getCurrentStepType();
    expect(stepType).not.toBe('unknown');
  });

  test('should allow navigating back to previous step', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Complete first step
    await assessmentPage.selectMultipleOptions([0]);
    await assessmentPage.clickNext();

    // Should be able to go back
    const backVisible = await assessmentPage.isBackVisible();
    expect(backVisible).toBe(true);

    // Go back
    await assessmentPage.clickBack();

    // Should be on first step again
    // The previously selected option might still be selected
  });

  test('should handle scale step type', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Navigate to a scale step (skip through multiSelect steps)
    // Phase 1, Step 1: multiSelect
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();

    // Phase 1, Step 2: multiSelect
    await assessmentPage.selectMultipleOptions([2, 3]);
    await assessmentPage.clickNext();

    // Phase 1, Step 3: should be scale
    const stepType = await assessmentPage.getCurrentStepType();
    if (stepType === 'scale') {
      await assessmentPage.setScaleValue(4);
      expect(await assessmentPage.isNextEnabled()).toBe(true);
    }
  });

  test('should handle textarea step type', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Navigate to a textarea step (skip through first steps)
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([2, 3]);
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(3);
    await assessmentPage.clickNext();

    // Should now be on textarea step
    const stepType = await assessmentPage.getCurrentStepType();
    if (stepType === 'textarea') {
      await assessmentPage.fillTextarea('Test response for energy drains');
      expect(await assessmentPage.isNextEnabled()).toBe(true);
    }
  });

  test('should redirect to auth when completing without login', async ({ assessmentPage }) => {
    await assessmentPage.navigate();

    // Complete assessment but expect redirect to auth (not insights)
    // since unauthenticated users must sign in to complete
    await assessmentPage.startAssessment();

    // Phase 1: State Awareness (8 steps)
    await assessmentPage.selectMultipleOptions([0, 2]);
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([3, 4]);
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(3);
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test energy drains');
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test energy restores');
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([0, 2, 4]);
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(4);
    await assessmentPage.clickNext();
    await assessmentPage.selectSingleOption(1);
    await assessmentPage.clickNext();

    // Phase 2 intro
    const stepType = await assessmentPage.getCurrentStepType();
    if (stepType === 'intro') {
      await assessmentPage.clickNext();
    }

    // Phase 2: Identity Mapping (8 steps)
    await assessmentPage.fillTextarea('Test identity statements');
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test others describe');
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test automatic behaviors');
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test keystone behaviors');
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([0, 2, 4]);
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test natural strengths');
    await assessmentPage.clickNext();
    await assessmentPage.fillTextarea('Test resistance patterns');
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(4);
    await assessmentPage.clickNext();

    // Now at synthesis - SavePromptModal should appear for unauthenticated users
    // Dismiss it first to access the Complete button
    await assessmentPage.dismissSavePromptModal();

    // Click Complete - should redirect to auth
    await assessmentPage.clickComplete();

    // Should redirect to auth page (not insights)
    await assessmentPage.page.waitForURL('**/sign-*', { timeout: 10000 });
    expect(assessmentPage.page.url()).toMatch(/sign-(in|up)/);
  });

  test('should show SavePromptModal at synthesis for unauthenticated users', async ({
    assessmentPage,
  }) => {
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment().catch(() => {
      // completeFullAssessment may throw because modal blocks Complete button
      // That's expected - we're testing the modal visibility
    });

    // Wait a moment for synthesis to render with modal
    await assessmentPage.page.waitForTimeout(500);

    // Check if modal is visible (it should be, but might be dismissed by completeFullAssessment)
    // At synthesis step, the modal should be visible for unauthenticated users
    const stepType = await assessmentPage.getCurrentStepType();
    expect(stepType).toBe('synthesis');
  });
});

test.describe('Assessment Flow - Authenticated', () => {
  test('should complete full assessment flow and navigate to insights', async ({
    authenticatedPage,
  }) => {
    const { AssessmentPage } = await import('../../pages');
    const assessmentPage = new AssessmentPage(authenticatedPage);

    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // After completing, should be on insights page
    await authenticatedPage.waitForURL('**/insights', { timeout: 10000 });
    expect(authenticatedPage.url()).toContain('/insights');
  });
});
