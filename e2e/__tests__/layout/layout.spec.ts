/**
 * @file e2e/__tests__/layout/layout.spec.ts
 * @purpose E2E tests for page layout structure across different pages
 * @functionality
 * - Tests common layout elements on each page type (header, footer, theme toggle, language toggle, decoration)
 * - Validates page-specific containers exist
 * - Uses consolidated validation approach (one test per page)
 * - Auth pages have no footer
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - LayoutPage page object with validateCommonLayout method
 */

import { test, expect } from '../../fixtures';

test.describe('Layout Structure', () => {
  test.describe('Common Layout Elements', () => {
    test('Landing page has all common layout elements', async ({ layoutPage }) => {
      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToLanding();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: true, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.footer).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });

    test('Assessment page has all common layout elements', async ({ layoutPage }) => {
      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToAssessment();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: true, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.footer).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });

    test('Insights page has all common layout elements', async ({
      registerPage,
      testUser,
      layoutPage,
    }) => {
      // Need to be authenticated to access insights
      await registerPage.navigate();
      await registerPage.register({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        birthYear: testUser.birthYear,
        gender: testUser.gender,
      });

      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToInsights();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: true, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.footer).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });

    test('Profile page has all common layout elements', async ({ registerPage, testUser, layoutPage }) => {
      // Need to be authenticated to access profile
      await registerPage.navigate();
      await registerPage.register({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        birthYear: testUser.birthYear,
        gender: testUser.gender,
      });

      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToProfile();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: true, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.footer).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });

    test('Sign-in page has common layout without footer', async ({ layoutPage }) => {
      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToSignIn();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: false, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });

    test('Sign-up page has common layout without footer', async ({ layoutPage }) => {
      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToSignUp();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: false, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });

    test('Forgot-password page has common layout without footer', async ({ layoutPage }) => {
      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToForgotPassword();

      const layout = await layoutPage.validateCommonLayout({ hasFooter: false, hasDecoration: true });

      expect(layout.header).toBe(true);
      expect(layout.themeToggle).toBe(true);
      expect(layout.languageToggle).toBe(true);
      expect(layout.inkBrushDecoration).toBe(true);
    });
  });

  test.describe('Page-Specific Containers', () => {
    test('Insights page container exists', async ({
      registerPage,
      testUser,
      layoutPage,
    }) => {
      // Need to be authenticated to access insights
      await registerPage.navigate();
      await registerPage.register({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        birthYear: testUser.birthYear,
        gender: testUser.gender,
      });

      await layoutPage.navigateToInsights();

      const insightsPage = layoutPage.page.locator(layoutPage.insightsPage);
      await expect(insightsPage).toBeVisible();
    });

    test('Profile page container exists', async ({ registerPage, testUser, layoutPage }) => {
      await registerPage.navigate();
      await registerPage.register({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        birthYear: testUser.birthYear,
        gender: testUser.gender,
      });

      await layoutPage.navigateToProfile();

      const profilePage = layoutPage.page.locator(layoutPage.profilePage);
      await expect(profilePage).toBeVisible();
    });

    test('Auth page container exists', async ({ layoutPage }) => {
      await layoutPage.navigateToSignIn();

      // Use .first() to avoid strict mode violation when multiple elements match
      const authPage = layoutPage.page.locator(layoutPage.authPage).first();
      await expect(authPage).toBeVisible();
    });
  });

  test.describe('Sticky Header', () => {
    test('Header stays visible when scrolling', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      expect(await layoutPage.isHeaderSticky()).toBe(true);
    });
  });
});
