/**
 * @file e2e/pages/LayoutPage.ts
 * @purpose Page object for layout and navigation E2E tests
 * @functionality
 * - Provides selectors for common layout elements (header, footer, nav)
 * - Handles theme toggle interactions
 * - Handles language switcher interactions
 * - Provides viewport resize utilities for responsive testing
 * - Verifies layout structure across different pages
 * @dependencies
 * - @playwright/test (Page type)
 * - BasePage for common functionality
 */

import { BasePage } from './BasePage';
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

/**
 * Viewport presets for responsive testing
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

/**
 * Page object for testing layout, navigation, theme, and language
 */
export class LayoutPage extends BasePage {
  // Header/Navigation selectors
  readonly header = '[data-testid="nav-header"]';
  readonly navLinkAssessment = '[data-testid="nav-link-assessment"]';
  readonly navLinkInsights = '[data-testid="nav-link-insights"]';
  readonly navBtnSignIn = '[data-testid="nav-btn-signin"]';
  readonly userAvatarDropdown = '[data-testid="user-avatar-dropdown"]';

  // Landing page navigation (anchor links to sections)
  readonly landingNavLinks = '[data-testid="landing-nav-links"]';
  readonly landingNavLinkPhilosophy = '[data-testid="nav-link-philosophy"]';
  readonly landingNavLinkJourney = '[data-testid="nav-link-journey"]';
  readonly landingNavLinkInsights = '[data-testid="nav-link-insights"]';

  // Theme and Language selectors
  readonly themeToggle = '[data-testid="theme-toggle"]';
  readonly languageToggle = '[data-testid="language-toggle"]';
  readonly languageBtnEn = '[data-testid="language-btn-en"]';
  readonly languageBtnPl = '[data-testid="language-btn-pl"]';

  // Footer selector
  readonly footer = '[data-testid="footer-section"]';

  // Decorative element selector
  readonly inkBrushDecoration = '[data-testid="ink-brush-decoration"]';

  // Mobile menu selectors
  readonly mobileMenuButton = '[data-testid="mobile-menu-btn"]';
  readonly mobileMenu = '[data-testid="mobile-menu"]';

  // Page container selectors
  readonly landingPage = '[data-testid="landing-page"]';
  readonly assessmentPage = '[data-testid="assessment-page"]';
  readonly insightsPage = '[data-testid="insights-page"]';
  readonly profilePage = '[data-testid="profile-page"]';
  readonly authPage = '[data-testid="auth-page"]';

  /**
   * Set viewport to a specific size
   */
  async setViewport(preset: keyof typeof VIEWPORTS): Promise<void> {
    const { width, height } = VIEWPORTS[preset];
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Check if header is visible
   */
  async isHeaderVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.header).isVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    } catch {
      return false;
    }
  }

  /**
   * Check if footer is visible
   */
  async isFooterVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.footer).first().isVisible({ timeout: E2E_TIMEOUTS.elementVisible });
    } catch {
      return false;
    }
  }

  /**
   * Check if navigation links are visible
   * For landing page: checks for anchor links (Philosophy, Journey, Insights) - actual visibility, not just in DOM
   * For other pages: checks for route links (Assessment, Insights)
   */
  async areNavLinksVisible(): Promise<boolean> {
    try {
      // On landing page, check for the nav links container
      // Must check actual visibility since they're hidden on mobile via CSS
      if (this.isOnLandingPage()) {
        return await this.page.locator(this.landingNavLinks).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
      }
      // On other pages, check for route links
      const assessment = await this.page.locator(this.navLinkAssessment).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
      const insights = await this.page.locator(this.navLinkInsights).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
      return assessment && insights;
    } catch {
      return false;
    }
  }

  /**
   * Check if theme toggle is visible
   */
  async isThemeToggleVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.themeToggle).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch {
      return false;
    }
  }

  /**
   * Check if language toggle is visible
   */
  async isLanguageToggleVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.languageToggle).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch {
      return false;
    }
  }

  /**
   * Check if InkBrushDecoration is visible (only on desktop/large screens)
   */
  async isInkBrushDecorationVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.inkBrushDecoration).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch {
      return false;
    }
  }

  /**
   * Validate common layout elements on a page
   * @param options.hasFooter - Whether footer should be present (false for auth pages)
   * @param options.hasDecoration - Whether InkBrushDecoration should be visible (desktop only)
   */
  async validateCommonLayout(options: { hasFooter?: boolean; hasDecoration?: boolean } = {}): Promise<{
    header: boolean;
    footer: boolean;
    themeToggle: boolean;
    languageToggle: boolean;
    inkBrushDecoration: boolean;
  }> {
    const { hasFooter = true, hasDecoration = true } = options;

    const header = await this.isHeaderVisible();
    const themeToggle = await this.isThemeToggleVisible();
    const languageToggle = await this.isLanguageToggleVisible();

    let footer = false;
    if (hasFooter) {
      await this.scrollToBottom();
      footer = await this.isFooterVisible();
    }

    let inkBrushDecoration = false;
    if (hasDecoration) {
      inkBrushDecoration = await this.isInkBrushDecorationVisible();
    }

    return { header, footer, themeToggle, languageToggle, inkBrushDecoration };
  }

  /**
   * Get current theme from HTML class
   */
  async getCurrentTheme(): Promise<'light' | 'dark' | null> {
    const htmlClass = await this.page.locator('html').getAttribute('class');
    if (htmlClass?.includes('dark')) return 'dark';
    if (htmlClass?.includes('light') || !htmlClass?.includes('dark')) return 'light';
    return null;
  }

  /**
   * Toggle theme and wait for change
   */
  async toggleTheme(): Promise<void> {
    const currentClass = await this.page.locator('html').getAttribute('class');
    await this.page.locator(this.themeToggle).click();
    // Wait for theme class to change
    await this.page.locator('html').waitFor({
      state: 'attached',
    });
    // Wait for the class attribute to actually change
    await this.page.waitForFunction(
      (oldClass) => document.documentElement.getAttribute('class') !== oldClass,
      currentClass,
      { timeout: E2E_TIMEOUTS.elementQuick }
    );
  }

  /**
   * Get current language from HTML lang attribute
   */
  async getCurrentLanguage(): Promise<string> {
    return (await this.page.locator('html').getAttribute('lang')) ?? 'en';
  }

  /**
   * Switch to English
   */
  async switchToEnglish(): Promise<void> {
    await this.page.locator(this.languageBtnEn).click();
    // Wait for language attribute to change
    await this.page.locator('html[lang="en"]').waitFor({ state: 'attached', timeout: E2E_TIMEOUTS.elementQuick });
  }

  /**
   * Switch to Polish
   */
  async switchToPolish(): Promise<void> {
    await this.page.locator(this.languageBtnPl).click();
    // Wait for language attribute to change
    await this.page.locator('html[lang="pl"]').waitFor({ state: 'attached', timeout: E2E_TIMEOUTS.elementQuick });
  }

  /**
   * Check if mobile menu button is visible (indicates mobile viewport)
   */
  async isMobileMenuVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.mobileMenuButton).isVisible({ timeout: E2E_TIMEOUTS.elementMedium });
    } catch {
      return false;
    }
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu(): Promise<void> {
    await this.page.locator(this.mobileMenuButton).click();
    // Wait for mobile menu to become visible
    await this.page.locator(this.mobileMenu).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.elementQuick });
  }

  /**
   * Navigate to landing page
   */
  async navigateToLanding(): Promise<void> {
    await this.goto('/');
  }

  /**
   * Navigate to assessment page
   */
  async navigateToAssessment(): Promise<void> {
    await this.goto('/assessment');
  }

  /**
   * Navigate to insights page
   */
  async navigateToInsights(): Promise<void> {
    await this.goto('/insights');
  }

  /**
   * Navigate to profile page
   */
  async navigateToProfile(): Promise<void> {
    await this.goto('/profile');
  }

  /**
   * Navigate to sign-in page
   */
  async navigateToSignIn(): Promise<void> {
    await this.goto('/sign-in');
  }

  /**
   * Navigate to sign-up page
   */
  async navigateToSignUp(): Promise<void> {
    await this.goto('/sign-up');
  }

  /**
   * Navigate to forgot-password page
   */
  async navigateToForgotPassword(): Promise<void> {
    await this.goto('/forgot-password');
  }

  /**
   * Check if current page is landing page
   */
  isOnLandingPage(): boolean {
    return this.getCurrentPath() === '/';
  }

  /**
   * Check if current page is assessment page
   */
  isOnAssessmentPage(): boolean {
    return this.getCurrentPath().startsWith('/assessment');
  }

  /**
   * Check if current page is insights page
   */
  isOnInsightsPage(): boolean {
    return this.getCurrentPath().startsWith('/insights');
  }

  /**
   * Check if current page is profile page
   */
  isOnProfilePage(): boolean {
    return this.getCurrentPath().startsWith('/profile');
  }

  /**
   * Check if current page is an auth page (sign-in, sign-up, forgot-password)
   */
  isOnAuthPage(): boolean {
    const path = this.getCurrentPath();
    return path.startsWith('/sign-in') || path.startsWith('/sign-up') || path.startsWith('/forgot-password');
  }

  /**
   * Scroll to bottom of page
   * Handles case where page content is shorter than viewport (no scroll needed)
   */
  async scrollToBottom(): Promise<void> {
    // Wait for layout to stabilize before checking scrollability
    await this.waitForViewportTransition();

    // Check if page is scrollable
    const maxScroll = await this.page.evaluate(() => {
      return document.body.scrollHeight - window.innerHeight;
    });

    if (maxScroll <= 0) {
      // Page content fits in viewport, no scroll needed
      return;
    }

    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for scroll to complete with medium timeout for complex layouts
    await this.page.waitForFunction(
      () => {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        return scrollY >= maxScroll - 10; // Allow small tolerance
      },
      undefined,
      { timeout: E2E_TIMEOUTS.elementMedium }
    );
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    // Wait for scroll to complete
    await this.page.waitForFunction(
      () => window.scrollY === 0,
      undefined,
      { timeout: E2E_TIMEOUTS.elementQuick }
    );
  }

  /**
   * Get scroll position
   */
  async getScrollPosition(): Promise<number> {
    return await this.page.evaluate(() => window.scrollY);
  }

  /**
   * Check if header is sticky (stays visible when scrolled)
   * Handles case where page content is shorter than scroll target
   */
  async isHeaderSticky(): Promise<boolean> {
    // Check if page is scrollable
    const maxScroll = await this.page.evaluate(() => {
      return document.body.scrollHeight - window.innerHeight;
    });

    if (maxScroll <= 0) {
      // Page is not scrollable, assume header is sticky since we can't test
      // (header would be visible regardless)
      return await this.isHeaderVisible();
    }

    // Scroll to lesser of 500px or max scroll
    const scrollTarget = Math.min(500, maxScroll);
    await this.page.evaluate((target) => {
      window.scrollTo(0, target);
    }, scrollTarget);

    // Wait for scroll to complete with medium timeout
    await this.page.waitForFunction(
      (target: number) => window.scrollY >= target - 10,
      scrollTarget,
      { timeout: E2E_TIMEOUTS.elementMedium }
    );

    // Check if header is still visible
    const isVisible = await this.isHeaderVisible();

    // Scroll back to top
    await this.scrollToTop();

    return isVisible;
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check for any visible text on page (for i18n testing)
   */
  async getVisibleText(): Promise<string> {
    return await this.page.locator('body').innerText();
  }

  /**
   * Wait for viewport transition to complete (CSS media queries to apply)
   * Waits for layout to stabilize after viewport resize
   */
  async waitForViewportTransition(): Promise<void> {
    // Wait for two animation frames to ensure resize has been processed
    await this.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  }

  /**
   * Wait for smooth scroll animation to complete
   * Waits until scroll position stabilizes for 3 consecutive frames
   */
  async waitForScrollComplete(): Promise<void> {
    const MAX_SCROLL_CHECK_ITERATIONS = 120; // ~2s safety cap at 60fps

    await this.page.waitForFunction(
      (maxIterations: number) => {
        return new Promise<boolean>(resolve => {
          let lastScrollY = window.scrollY;
          let stableCount = 0;
          let iterations = 0;
          const check = () => {
            if (iterations++ > maxIterations) {
              resolve(true);
              return;
            }
            if (window.scrollY === lastScrollY) {
              stableCount++;
              if (stableCount >= 3) {
                resolve(true);
                return;
              }
            } else {
              stableCount = 0;
              lastScrollY = window.scrollY;
            }
            requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        });
      },
      MAX_SCROLL_CHECK_ITERATIONS,
      { timeout: E2E_TIMEOUTS.elementMedium }
    );
  }

}
