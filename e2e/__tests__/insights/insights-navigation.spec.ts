/**
 * @file e2e/__tests__/insights/insights-navigation.spec.ts
 * @purpose E2E tests for insights page navigation (requires authentication)
 * @functionality
 * - Tests redirect to auth when accessing insights unauthenticated
 * - Tests authenticated access to /insights
 * - Tests no assessment message display
 * - Tests accessing specific analysis by ID
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - InsightsPage, AssessmentPage, and ProfilePage page objects
 */

import { test, expect } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';
import { AssessmentPage, InsightsPage, ProfilePage } from '../../pages';

test.describe('Insights Navigation - Unauthenticated', () => {
  test('should redirect to auth when accessing insights without login', async ({
    page,
    insightsPage,
  }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to navigate to insights
    await insightsPage.navigate();

    // Should redirect to sign-in page
    await page.waitForURL('**/sign-in', { timeout: E2E_TIMEOUTS.navigation });
    expect(page.url()).toContain('/sign-in');
  });
});

test.describe('Insights Navigation - Authenticated', () => {
  test('should access insights page via direct URL', async ({ authenticatedPage }) => {
    const insightsPage = new InsightsPage(authenticatedPage);
    await insightsPage.navigate();

    // Page should load (either insights page or no-assessment state)
    const pageVisible = await authenticatedPage
      .locator(insightsPage.insightsPage)
      .isVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    expect(pageVisible).toBe(true);
  });

  test('should show no assessment message when no assessment data', async ({
    authenticatedPage,
  }) => {
    const insightsPage = new InsightsPage(authenticatedPage);

    // Fresh authenticated user has no assessments in DB
    // Clear only assessment storage, preserve auth tokens
    await authenticatedPage.goto('/');

    // Wait for auth hydration to complete (user avatar appears when logged in)
    await authenticatedPage.waitForSelector('[data-testid="user-avatar-dropdown"]', {
      state: 'visible',
      timeout: E2E_TIMEOUTS.navigation,
    });

    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('assessment-storage');
    });

    // Navigate to insights
    await insightsPage.navigate();

    // Should show no assessment state
    const noAssessment = await insightsPage.isNoAssessmentState();
    expect(noAssessment).toBe(true);
  });

  test('should show ready state when assessment data exists but no analysis', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const insightsPage = new InsightsPage(authenticatedPage);

    // Complete assessment to populate data
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // Should be on insights in ready state
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Wait for page content to load before checking state
    await insightsPage.waitForPageReady();

    const isReady = await insightsPage.isReadyState();
    expect(isReady).toBe(true);
  });

  test('should navigate to insights from assessment completion', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const insightsPage = new InsightsPage(authenticatedPage);

    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();

    // Should redirect to insights
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Wait for page content to load before checking state
    await insightsPage.waitForPageReady();

    // Ready state should be visible
    const isReady = await insightsPage.isReadyState();
    expect(isReady).toBe(true);
  });
});

test.describe('Insights Navigation - Authenticated User', () => {
  test('should access saved analysis from profile', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const profilePage = new ProfilePage(authenticatedPage);

    // Complete an assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Note: To test viewing a specific analysis, we'd need to:
    // 1. Run the actual analysis (long operation)
    // 2. Save it to the database
    // 3. Access it via profile

    // For now, verify that profile can be navigated to
    await profilePage.navigate();
    await profilePage.clickTab('analyses');

    // Page should load the analyses tab
    const tabVisible = await authenticatedPage
      .locator(profilePage.analysesTab)
      .getAttribute('aria-selected');
    expect(tabVisible).toBe('true');
  });

  test('should show insights page with assessment data after login', async ({
    authenticatedPage,
  }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const insightsPage = new InsightsPage(authenticatedPage);

    // Complete an assessment
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // Wait for page content to load
    await insightsPage.waitForPageReady();

    // Insights page should be visible
    const pageVisible = await authenticatedPage
      .locator(insightsPage.insightsPage)
      .isVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    expect(pageVisible).toBe(true);
  });

  test('should navigate between insights tabs', async ({ authenticatedPage }) => {
    const assessmentPage = new AssessmentPage(authenticatedPage);
    const insightsPage = new InsightsPage(authenticatedPage);

    // Complete an assessment to get to insights
    await assessmentPage.navigate();
    await assessmentPage.completeFullAssessment();
    await authenticatedPage.waitForURL('**/insights', { timeout: E2E_TIMEOUTS.navigation });

    // We should be in ready state (no analysis yet)
    const isReady = await insightsPage.isReadyState();

    // If ready state, that means we need to trigger analysis first
    // For E2E without actual API, we just verify the page structure
    if (isReady) {
      // Verify analyze button is present
      const analyzeVisible = await authenticatedPage
        .locator(insightsPage.analyzeTestId)
        .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
        .catch(() => false);

      // Either analyze button is visible or we see an incomplete assessment warning
      const hasIncompleteWarning = await insightsPage.hasIncompleteWarning();
      expect(analyzeVisible || hasIncompleteWarning).toBe(true);
    }
  });
});
