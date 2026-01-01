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

test.describe('Assessment Save', () => {
  test('should save assessment for authenticated user', async ({ authenticatedPage }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const profilePage = new ProfilePage(authenticatedPage);

    // Complete the assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // Should be redirected to insights
    expect(authenticatedPage.url()).toContain('/insights');

    // Check profile for saved assessment
    await profilePage.navigate();
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

    // Check for new assessment in profile
    await profilePage.navigate();
    const newCount = await profilePage.getAssessmentCount();

    // Should have one more assessment
    expect(newCount).toBe(initialCount + 1);
  });
});
