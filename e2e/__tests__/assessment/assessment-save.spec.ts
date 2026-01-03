/**
 * @file e2e/__tests__/assessment/assessment-save.spec.ts
 * @purpose E2E tests for assessment saving functionality
 * @functionality
 * - Tests saving assessment for authenticated users
 * - Tests viewing saved assessments in profile
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - AssessmentPage and ProfilePage page objects
 */

import { test, expect } from '../../fixtures';
import { AssessmentPage, ProfilePage } from '../../pages';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('Assessment Save', () => {
  test('should save assessment for authenticated user', async ({ authenticatedPage }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const profilePage = new ProfilePage(authenticatedPage);

    // Complete the assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // Wait for redirect to insights page
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Should be redirected to insights
    expect(authenticatedPage.url()).toContain('/insights');

    // Check profile for saved assessment - wait for at least 1 item
    await profilePage.navigate();
    await profilePage.waitForAssessments(1);
    const assessmentCount = await profilePage.getAssessmentCount();

    // Should have at least one saved assessment
    expect(assessmentCount).toBeGreaterThan(0);
  });

  test('should show saved assessment in assessments list', async ({ authenticatedPage }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const profilePage = new ProfilePage(authenticatedPage);

    // Get initial assessment count
    await profilePage.navigate();
    const initialCount = await profilePage.getAssessmentCount();

    // Complete a new assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // Wait for redirect to insights page
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Check for new assessment in profile - wait for expected count
    await profilePage.navigate();
    await profilePage.waitForAssessments(initialCount + 1);
    const newCount = await profilePage.getAssessmentCount();

    // Should have one more assessment
    expect(newCount).toBe(initialCount + 1);
  });
});
