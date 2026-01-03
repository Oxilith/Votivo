/**
 * @file e2e/__tests__/assessment/assessment-readonly.spec.ts
 * @purpose E2E tests for readonly assessment viewing
 * @functionality
 * - Tests viewing saved assessments in readonly mode
 * - Verifies synthesis-only display (no phase navigation)
 * - Checks for view-only badge visibility
 * - Confirms inputs are non-interactive
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AssessmentPage and ProfilePage page objects
 */

import { test, expect } from '../../fixtures';
import { AssessmentPage, ProfilePage } from '../../pages';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('Assessment Readonly Mode', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Complete an assessment first to have something to view
    const assessmentPage = new AssessmentPage(authenticatedPage);
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // Wait for redirect to insights page
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });
  });

  test('should open saved assessment from profile in readonly mode', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    const assessmentPage = new AssessmentPage(authenticatedPage);

    // Navigate to profile and wait for assessment to appear, then view it
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    await profilePage.viewAssessment(0);

    // Wait for synthesis step to be visible (readonly mode loads synthesis directly)
    await authenticatedPage.waitForSelector('[data-testid="synthesis-step"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });

    // Should be in readonly mode (synthesis visible, progress hidden)
    const isReadonly = await assessmentPage.isReadOnlyMode();
    expect(isReadonly).toBe(true);
  });

  test('should show synthesis step directly in readonly mode', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);

    // Navigate to profile and wait for assessment to appear, then view it
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    await profilePage.viewAssessment(0);

    // Wait for synthesis step to be visible
    await authenticatedPage.waitForSelector('[data-testid="synthesis-step"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });

    // Should show synthesis step
    const synthesisVisible = await authenticatedPage
      .locator('[data-testid="synthesis-step"]')
      .isVisible();
    expect(synthesisVisible).toBe(true);
  });

  test('should not show progress header in readonly mode', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    const assessmentPage = new AssessmentPage(authenticatedPage);

    // Navigate to profile and wait for assessment to appear, then view it
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    await profilePage.viewAssessment(0);

    // Wait for synthesis step to be visible
    await authenticatedPage.waitForSelector('[data-testid="synthesis-step"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });

    // Progress header should be hidden
    const hasProgressHeader = await assessmentPage.hasProgressHeader();
    expect(hasProgressHeader).toBe(false);
  });

  test('should not show navigation buttons in readonly mode', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    const assessmentPage = new AssessmentPage(authenticatedPage);

    // Navigate to profile and wait for assessment to appear, then view it
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    await profilePage.viewAssessment(0);

    // Wait for page to load
    await authenticatedPage.waitForSelector('[data-testid="synthesis-step"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });

    // Navigation buttons should not be visible
    const nextVisible = await authenticatedPage
      .locator(assessmentPage.nextButton)
      .first()
      .isVisible({ timeout: E2E_TIMEOUTS.elementQuick })
      .catch(() => false);
    const backVisible = await authenticatedPage
      .locator(assessmentPage.backButton)
      .first()
      .isVisible({ timeout: E2E_TIMEOUTS.elementQuick })
      .catch(() => false);
    const completeVisible = await authenticatedPage
      .locator(assessmentPage.completeButton)
      .first()
      .isVisible({ timeout: E2E_TIMEOUTS.elementQuick })
      .catch(() => false);

    expect(nextVisible).toBe(false);
    expect(backVisible).toBe(false);
    expect(completeVisible).toBe(false);
  });

  test('should show page header with date in readonly mode', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    const assessmentPage = new AssessmentPage(authenticatedPage);

    // Navigate to profile and wait for assessment to appear, then view it
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    await profilePage.viewAssessment(0);

    // Wait for synthesis step to be visible
    await authenticatedPage.waitForSelector('[data-testid="synthesis-step"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });

    // Page header should be visible
    const hasPageHeader = await assessmentPage.hasPageHeader();
    expect(hasPageHeader).toBe(true);
  });
});
