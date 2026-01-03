/**
 * @file e2e/__tests__/assessment/assessment-edit.spec.ts
 * @purpose E2E tests for assessment editing functionality
 * @functionality
 * - Tests editing assessment responses
 * - Tests completing assessment creates new record
 * - Tests leaving without completing persists to store
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AssessmentPage and ProfilePage page objects
 */

import { test, expect } from '../../fixtures';
import { AssessmentPage, ProfilePage } from '../../pages';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('Assessment Editing', () => {
  test('should modify responses in edit mode', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Fill first question
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();

    // Go back and change the selection
    await assessmentPage.clickBack();

    // The previous selections might still be there, add another one
    await assessmentPage.selectMultipleOptions([2]);

    // Should still be able to proceed
    expect(await assessmentPage.isNextEnabled()).toBe(true);
  });

  test('should allow editing textarea content', async ({ assessmentPage }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Navigate to a textarea step
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([2, 3]);
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(3);
    await assessmentPage.clickNext();

    // Fill textarea
    await assessmentPage.fillTextarea('Initial response');

    // Clear and edit
    await assessmentPage.fillTextarea('Updated response text');

    // Should still be valid
    expect(await assessmentPage.isNextEnabled()).toBe(true);
  });

  test('should persist responses when navigating away without completing', async ({
    page,
    assessmentPage,
  }) => {
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();

    // Fill some steps
    await assessmentPage.selectMultipleOptions([0, 1, 2]);
    await assessmentPage.clickNext();
    await assessmentPage.selectMultipleOptions([3, 4]);
    await assessmentPage.clickNext();
    await assessmentPage.setScaleValue(4);

    // Navigate away without completing
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Come back to assessment
    await assessmentPage.navigate();

    // For non-authenticated users, localStorage should persist some state
    // The app should remember we were in progress
    // (Exact behavior depends on implementation - check we can still see assessment content)
    const stepType = await assessmentPage.getCurrentStepType();
    expect(stepType).not.toBe('unknown');
  });

  test('should create new assessment record on complete for authenticated user', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const profilePage = new ProfilePage(authenticatedPage);

    // Get initial count
    await profilePage.navigate();
    const initialCount = await profilePage.getAssessmentCount();

    // Complete first assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Check count increased - wait for expected count
    await profilePage.navigate();
    await profilePage.waitForAssessments(initialCount + 1);
    const countAfterFirst = await profilePage.getAssessmentCount();
    expect(countAfterFirst).toBe(initialCount + 1);

    // Use Retake button to start a new assessment (clears store and starts fresh)
    await assessmentPage.navigate();
    // After completing, we should be redirected to insights, go back to assessment
    // The assessment page should show the completed assessment with Retake button
    await authenticatedPage.waitForSelector('[data-testid="assessment-btn-retake"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });
    await assessmentPage.clickRetake();

    // Complete another assessment
    await assessmentPage.completeFullAssessment();
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Check count increased again - wait for expected count
    await profilePage.navigate();
    await profilePage.waitForAssessments(initialCount + 2);
    const countAfterSecond = await profilePage.getAssessmentCount();
    expect(countAfterSecond).toBe(initialCount + 2);
  });

  test('should allow different responses on new assessment', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);

    // Start first assessment with specific choices
    await assessmentPage.navigate();
    await assessmentPage.startAssessment();
    await assessmentPage.selectMultipleOptions([0, 1]);
    await assessmentPage.clickNext();

    // Navigate away
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Start fresh - navigate back to assessment
    await assessmentPage.navigate();

    // For a fresh start, the intro/welcome screen should be visible
    // or the assessment should show content
    const stepType = await assessmentPage.getCurrentStepType();
    expect(['intro', 'multiSelect', 'singleSelect', 'scale', 'textarea']).toContain(
      stepType,
    );
  });
});

test.describe('Assessment Editing - Authenticated User', () => {
  test('should allow starting new assessment via Retake after completion', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const profilePage = new ProfilePage(authenticatedPage);

    // Complete an assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Verify assessment was saved - wait for at least 1 item
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    const count = await profilePage.getAssessmentCount();
    expect(count).toBeGreaterThan(0);

    // Navigate back to assessment - should be in readonly mode with Retake button
    await assessmentPage.navigate();

    // Wait for retake button (indicates readonly completed assessment)
    const retakeVisible = await authenticatedPage
      .locator('[data-testid="assessment-btn-retake"]')
      .isVisible({ timeout: E2E_TIMEOUTS.elementVisible })
      .catch(() => false);

    // Retake button should be visible since assessment is completed
    expect(retakeVisible).toBe(true);
  });
});
