/**
 * @file e2e/__tests__/layout/theme-language.spec.ts
 * @purpose E2E tests for theme toggle and language switcher functionality
 * @functionality
 * - Tests dark/light theme toggle
 * - Tests theme persistence across navigation
 * - Tests language switcher (EN/PL)
 * - Tests language persistence across navigation
 * - Tests sticky navigation behavior
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - LayoutPage page object
 */

import { test, expect } from '../../fixtures';

test.describe('Theme Toggle', () => {
  test('should toggle between light and dark themes', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Get initial theme
    const initialTheme = await layoutPage.getCurrentTheme();
    expect(initialTheme).toBeTruthy();

    // Toggle theme
    await layoutPage.toggleTheme();

    // Verify theme changed
    const newTheme = await layoutPage.getCurrentTheme();
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should apply dark class to html element when dark theme active', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Ensure we're in light mode first
    const currentTheme = await layoutPage.getCurrentTheme();
    if (currentTheme === 'dark') {
      await layoutPage.toggleTheme();
    }

    // Verify light mode
    expect(await layoutPage.getCurrentTheme()).toBe('light');

    // Toggle to dark
    await layoutPage.toggleTheme();

    // Verify dark mode
    expect(await layoutPage.getCurrentTheme()).toBe('dark');

    const htmlClass = await layoutPage.page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
  });

  test('should persist theme across page navigation', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Set to dark theme
    const currentThemeNav = await layoutPage.getCurrentTheme();
    if (currentThemeNav === 'light') {
      await layoutPage.toggleTheme();
    }

    expect(await layoutPage.getCurrentTheme()).toBe('dark');

    // Navigate to another page
    await layoutPage.navigateToAssessment();

    // Theme should persist
    expect(await layoutPage.getCurrentTheme()).toBe('dark');
  });

  test('should persist theme after page reload', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Set to dark theme
    const currentThemeReload = await layoutPage.getCurrentTheme();
    if (currentThemeReload === 'light') {
      await layoutPage.toggleTheme();
    }

    expect(await layoutPage.getCurrentTheme()).toBe('dark');

    // Reload page
    await layoutPage.reload();

    // Theme should persist (stored in localStorage)
    expect(await layoutPage.getCurrentTheme()).toBe('dark');
  });

  test('should display theme toggle on multiple pages', async ({ layoutPage }) => {
    // Check landing page
    await layoutPage.navigateToLanding();
    expect(await layoutPage.isThemeToggleVisible()).toBe(true);

    // Check assessment page
    await layoutPage.navigateToAssessment();
    expect(await layoutPage.isThemeToggleVisible()).toBe(true);

    // Check insights page
    await layoutPage.navigateToInsights();
    expect(await layoutPage.isThemeToggleVisible()).toBe(true);
  });
});

test.describe('Language Switcher', () => {
  test('should switch from English to Polish', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Ensure English first
    const initialLang = await layoutPage.getCurrentLanguage();
    if (initialLang !== 'en') {
      await layoutPage.switchToEnglish();
    }

    expect(await layoutPage.getCurrentLanguage()).toBe('en');

    // Switch to Polish
    await layoutPage.switchToPolish();

    // Verify language changed
    expect(await layoutPage.getCurrentLanguage()).toBe('pl');
  });

  test('should switch from Polish to English', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Set to Polish first
    await layoutPage.switchToPolish();
    expect(await layoutPage.getCurrentLanguage()).toBe('pl');

    // Switch to English
    await layoutPage.switchToEnglish();

    // Verify language changed
    expect(await layoutPage.getCurrentLanguage()).toBe('en');
  });

  test('should update page content when language changes', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Get English content
    await layoutPage.switchToEnglish();
    const englishText = await layoutPage.getVisibleText();

    // Switch to Polish
    await layoutPage.switchToPolish();
    const polishText = await layoutPage.getVisibleText();

    // Content should be different (translations applied)
    expect(polishText).not.toBe(englishText);
  });

  test('should persist language across page navigation', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Set to Polish
    await layoutPage.switchToPolish();
    expect(await layoutPage.getCurrentLanguage()).toBe('pl');

    // Navigate to another page
    await layoutPage.navigateToAssessment();

    // Language should persist
    expect(await layoutPage.getCurrentLanguage()).toBe('pl');
  });

  test('should persist language after page reload', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Set to Polish
    await layoutPage.switchToPolish();
    expect(await layoutPage.getCurrentLanguage()).toBe('pl');

    // Reload page
    await layoutPage.reload();

    // Language should persist (stored in localStorage)
    expect(await layoutPage.getCurrentLanguage()).toBe('pl');
  });

  test('should display language toggle on header', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();
    expect(await layoutPage.isLanguageToggleVisible()).toBe(true);
  });
});

test.describe('Sticky Navigation', () => {
  test('should keep header visible when scrolling down on landing page', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Verify header is sticky
    expect(await layoutPage.isHeaderSticky()).toBe(true);
  });

  test('should keep header visible when scrolling down on assessment page', async ({ layoutPage }) => {
    await layoutPage.navigateToAssessment();

    // Verify header is sticky
    expect(await layoutPage.isHeaderSticky()).toBe(true);
  });

  test('should return to top when clicking logo or home link', async ({ layoutPage }) => {
    await layoutPage.navigateToLanding();

    // Scroll down using helper method (avoids TypeScript window/document issues)
    await layoutPage.scrollToBottom();

    const scrolledPosition = await layoutPage.getScrollPosition();
    expect(scrolledPosition).toBeGreaterThan(0);

    // Click logo/home link to scroll to top (if such functionality exists)
    // This test documents expected behavior - adjust selector as needed
    const logoOrHomeLink = layoutPage.page.locator('a[href="/"], [data-testid="logo-link"]').first();
    if (await logoOrHomeLink.isVisible()) {
      await logoOrHomeLink.click();
      await layoutPage.waitForScrollComplete();

      // Should be at or near top
      const topPosition = await layoutPage.getScrollPosition();
      expect(topPosition).toBeLessThan(100);
    }
  });
});
