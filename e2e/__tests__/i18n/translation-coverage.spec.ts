/**
 * @file e2e/__tests__/i18n/translation-coverage.spec.ts
 * @purpose E2E tests for detecting untranslated i18n keys across all pages
 * @functionality
 * - Tests landing page for untranslated keys in EN and PL
 * - Tests assessment pages for untranslated keys
 * - Tests insights pages for untranslated keys
 * - Tests profile pages for untranslated keys
 * - Tests auth pages for untranslated keys
 * @dependencies
 * - Custom test fixtures from fixtures/test
 * - LayoutPage page object for language switching
 */

import { test, expect } from '../../fixtures';

/**
 * Pattern to detect untranslated i18n keys
 * Matches patterns like: landing.hero.title, assessment.steps.intro, profile.tabs
 * Supports 2+ segments and camelCase (e.g., assessment.Hero.title)
 * Excludes:
 * - URLs (www.domain.com)
 * - Semantic versioning (v1.2.3)
 * - File extensions (.tsx, .ts)
 */
const UNTRANSLATED_KEY_PATTERN = /\b[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+\b/g;

/**
 * Known false positives to exclude from detection
 */
const FALSE_POSITIVES = [
  'www.',
  '.com',
  '.org',
  '.io',
  '.tsx',
  '.ts',
  '.js',
  '.css',
  'i18n.',
  'node.',
  'test.votive.local', // Test email domain used in E2E fixtures
];

/**
 * Check if text contains untranslated i18n keys
 */
function hasUntranslatedKeys(text: string): { found: boolean; keys: string[] } {
  const matches = text.match(UNTRANSLATED_KEY_PATTERN) ?? [];
  const keys = matches.filter((match) => {
    // Skip false positives
    if (FALSE_POSITIVES.some((fp) => match.includes(fp))) return false;
    // Skip if contains numbers (likely version or date)
    if (/\d/.test(match)) return false;
    // Skip very short segments (likely abbreviations)
    const segments = match.split('.');
    if (segments.some((s) => s.length < 2)) return false;
    return true;
  });

  return { found: keys.length > 0, keys };
}

test.describe('Translation Coverage', () => {
  test.describe('Landing Page', () => {
    test('should have no untranslated keys in English', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();
      await layoutPage.switchToEnglish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys in Polish', async ({ layoutPage }) => {
      await layoutPage.navigateToLanding();
      await layoutPage.switchToPolish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });
  });

  test.describe('Assessment Page', () => {
    test('should have no untranslated keys in English', async ({ layoutPage }) => {
      await layoutPage.navigateToAssessment();
      await layoutPage.switchToEnglish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys in Polish', async ({ layoutPage }) => {
      await layoutPage.navigateToAssessment();
      await layoutPage.switchToPolish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });
  });

  test.describe('Insights Page', () => {
    test('should have no untranslated keys in English', async ({ layoutPage }) => {
      await layoutPage.navigateToInsights();
      await layoutPage.switchToEnglish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys in Polish', async ({ layoutPage }) => {
      await layoutPage.navigateToInsights();
      await layoutPage.switchToPolish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });
  });

  test.describe('Auth Pages', () => {
    test('should have no untranslated keys on sign-in page (EN)', async ({ layoutPage }) => {
      await layoutPage.navigateToSignIn();
      await layoutPage.switchToEnglish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys on sign-in page (PL)', async ({ layoutPage }) => {
      await layoutPage.navigateToSignIn();
      await layoutPage.switchToPolish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys on sign-up page (EN)', async ({ layoutPage }) => {
      await layoutPage.navigateToSignUp();
      await layoutPage.switchToEnglish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys on sign-up page (PL)', async ({ layoutPage }) => {
      await layoutPage.navigateToSignUp();
      await layoutPage.switchToPolish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });
  });

  test.describe('Profile Page (Authenticated)', () => {
    test.beforeEach(async ({ registerPage, testUser }) => {
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
    });

    test('should have no untranslated keys in English', async ({ layoutPage }) => {
      await layoutPage.navigateToProfile();
      await layoutPage.switchToEnglish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });

    test('should have no untranslated keys in Polish', async ({ layoutPage }) => {
      await layoutPage.navigateToProfile();
      await layoutPage.switchToPolish();

      const text = await layoutPage.getVisibleText();
      const result = hasUntranslatedKeys(text);

      if (result.found) {
        console.log('Potential untranslated keys found:', result.keys);
      }

      expect(result.found).toBe(false);
    });
  });
});
