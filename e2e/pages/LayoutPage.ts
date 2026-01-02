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
  readonly landingNavLinks = '.nav-link';

  // Theme and Language selectors
  readonly themeToggle = '[data-testid="theme-toggle"]';
  readonly languageToggle = '[data-testid="language-toggle"]';
  readonly languageBtnEn = '[data-testid="language-btn-en"]';
  readonly languageBtnPl = '[data-testid="language-btn-pl"]';

  // Footer selector (text-based fallback if no data-testid)
  readonly footer = 'footer, [data-testid="footer-section"]';

  // Decorative element selector
  readonly inkBrushDecoration = '[data-testid="ink-brush-decoration"]';

  // Mobile menu selectors
  readonly mobileMenuButton = '[data-testid="mobile-menu-btn"], button[aria-label*="menu" i]';
  readonly mobileMenu = '[data-testid="mobile-menu"]';

  // Page container selectors
  readonly landingPage = '[data-testid="landing-page"], .min-h-screen';
  readonly assessmentPage = '[data-testid="assessment-page"]';
  readonly insightsPage = '[data-testid="insights-page"]';
  readonly profilePage = '[data-testid="profile-page"]';
  readonly authPage = '[data-testid="auth-page"], [data-testid="login-form"], [data-testid="register-form"]';

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
      return await this.page.locator(this.header).isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if footer is visible
   */
  async isFooterVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.footer).first().isVisible({ timeout: 5000 });
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
      // On landing page, check for anchor links (class="nav-link")
      // Must check actual visibility since they're hidden on mobile via CSS
      if (this.isOnLandingPage()) {
        const navLink = this.page.locator(this.landingNavLinks).first();
        return await navLink.isVisible({ timeout: 3000 });
      }
      // On other pages, check for route links
      const assessment = await this.page.locator(this.navLinkAssessment).isVisible({ timeout: 3000 });
      const insights = await this.page.locator(this.navLinkInsights).isVisible({ timeout: 3000 });
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
      return await this.page.locator(this.themeToggle).isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if language toggle is visible
   */
  async isLanguageToggleVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.languageToggle).isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if InkBrushDecoration is visible (only on desktop/large screens)
   */
  async isInkBrushDecorationVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.inkBrushDecoration).isVisible({ timeout: 3000 });
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
    await this.page.locator(this.themeToggle).click();
    // Wait for class change
    await this.page.waitForTimeout(300);
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
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to Polish
   */
  async switchToPolish(): Promise<void> {
    await this.page.locator(this.languageBtnPl).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if mobile menu button is visible (indicates mobile viewport)
   */
  async isMobileMenuVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.mobileMenuButton).isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu(): Promise<void> {
    await this.page.locator(this.mobileMenuButton).click();
    await this.page.waitForTimeout(300);
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
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Get scroll position
   */
  async getScrollPosition(): Promise<number> {
    return await this.page.evaluate(() => window.scrollY);
  }

  /**
   * Check if header is sticky (stays visible when scrolled)
   */
  async isHeaderSticky(): Promise<boolean> {
    // Scroll down
    await this.page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await this.page.waitForTimeout(300);

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
   * Check if text matches untranslated key pattern (e.g., "landing.hero.title")
   */
  hasUntranslatedKeys(text: string): boolean {
    // Pattern matches: word.word.word (typical i18n key format)
    const keyPattern = /\b[a-z]+\.[a-z]+\.[a-z]+\b/gi;
    const matches = text.match(keyPattern);

    // Filter out false positives like URLs, file extensions, version numbers
    if (!matches) return false;

    return matches.some((match) => {
      // Skip common false positives
      if (match.includes('www.') || match.includes('.com') || match.includes('.org')) return false;
      if (/\d/.test(match)) return false; // Skip if contains numbers
      return true;
    });
  }
}
