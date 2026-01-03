/**
 * @file e2e/__tests__/layout/responsive.spec.ts
 * @purpose E2E tests for responsive layout behavior across breakpoints
 * @functionality
 * - Tests mobile viewport (375px) behavior
 * - Tests tablet viewport (768px) behavior
 * - Tests desktop viewport (1280px) behavior
 * - Tests navigation adaptation across breakpoints
 * - Tests hamburger menu on mobile
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - LayoutPage page object with VIEWPORTS
 */

import { test, expect } from '../../fixtures';
import { VIEWPORTS } from '../../pages';

test.describe('Responsive Layout', () => {
  test.describe('Mobile Viewport (375px)', () => {
    test.beforeEach(async ({ layoutPage }) => {
      await layoutPage.setViewport('mobile');
    });

    test('should display header on mobile', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      expect(await layoutPage.isHeaderVisible()).toBe(true);
    });

    test('should show mobile menu button on landing page', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      // On mobile, navigation links should be hidden in favor of hamburger menu
      // or the nav should be collapsed
      const isMobileMenuVisible = await layoutPage.isMobileMenuVisible();
      const areNavLinksVisible = await layoutPage.areNavLinksVisible();

      // Either mobile menu is visible OR nav links are hidden (mobile-friendly)
      expect(isMobileMenuVisible || !areNavLinksVisible).toBe(true);
    });

    test('should maintain header on mobile assessment page', async ({ layoutPage }) => {
      await layoutPage.navigateToAssessment();

      expect(await layoutPage.isHeaderVisible()).toBe(true);
    });

    test('should have appropriate viewport width', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      const viewportSize = layoutPage.page.viewportSize();
      expect(viewportSize?.width).toBe(VIEWPORTS.mobile.width);
    });
  });

  test.describe('Tablet Viewport (768px)', () => {
    test.beforeEach(async ({ layoutPage }) => {
      await layoutPage.setViewport('tablet');
    });

    test('should display header on tablet', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      expect(await layoutPage.isHeaderVisible()).toBe(true);
    });

    test('should display footer on tablet', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();
      await layoutPage.scrollToBottom();

      expect(await layoutPage.isFooterVisible()).toBe(true);
    });

    test('should have appropriate viewport width', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      const viewportSize = layoutPage.page.viewportSize();
      expect(viewportSize?.width).toBe(VIEWPORTS.tablet.width);
    });

    test('should display theme and language toggles on tablet', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      expect(await layoutPage.isThemeToggleVisible()).toBe(true);
      expect(await layoutPage.isLanguageToggleVisible()).toBe(true);
    });
  });

  test.describe('Desktop Viewport (1280px)', () => {
    test.beforeEach(async ({ layoutPage }) => {
      await layoutPage.setViewport('desktop');
    });

    test('should display full navigation on desktop', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      expect(await layoutPage.isHeaderVisible()).toBe(true);
      expect(await layoutPage.areNavLinksVisible()).toBe(true);
    });

    test('should NOT show mobile menu button on desktop', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      // Mobile menu should be hidden on desktop
      const isMobileMenuVisible = await layoutPage.isMobileMenuVisible();
      expect(isMobileMenuVisible).toBe(false);
    });

    test('should display footer on desktop', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();
      await layoutPage.scrollToBottom();

      expect(await layoutPage.isFooterVisible()).toBe(true);
    });

    test('should have appropriate viewport width', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      const viewportSize = layoutPage.page.viewportSize();
      expect(viewportSize?.width).toBe(VIEWPORTS.desktop.width);
    });

    test('should display all layout controls on desktop', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();

      expect(await layoutPage.isThemeToggleVisible()).toBe(true);
      expect(await layoutPage.isLanguageToggleVisible()).toBe(true);
    });
  });

  test.describe('Viewport Transitions', () => {
    test('should adapt from desktop to mobile', async ({ layoutPage }) => {
      // Start at desktop
      await layoutPage.setViewport('desktop');
      await layoutPage.navigateToLanding();

      // Verify desktop layout
      expect(await layoutPage.areNavLinksVisible()).toBe(true);

      // Switch to mobile
      await layoutPage.setViewport('mobile');
      await layoutPage.waitForViewportTransition();

      // Verify mobile adaptation
      const isMobileMenuVisible = await layoutPage.isMobileMenuVisible();
      const areNavLinksVisible = await layoutPage.areNavLinksVisible();

      // Either mobile menu appeared OR nav links hidden
      expect(isMobileMenuVisible || !areNavLinksVisible).toBe(true);
    });

    test('should adapt from mobile to desktop', async ({ layoutPage }) => {
      // Start at mobile
      await layoutPage.setViewport('mobile');
      await layoutPage.navigateToLanding();

      // Switch to desktop
      await layoutPage.setViewport('desktop');
      await layoutPage.waitForViewportTransition();

      // Verify desktop layout
      expect(await layoutPage.areNavLinksVisible()).toBe(true);
      expect(await layoutPage.isMobileMenuVisible()).toBe(false);
    });
  });
});
