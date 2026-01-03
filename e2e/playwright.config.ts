/**
 * @file e2e/playwright.config.ts
 * @purpose Playwright E2E test configuration for Votive application
 * @functionality
 * - Configures test directory and file matching patterns
 * - Sets up browser projects (Chromium only for now)
 * - Configures test timeouts and retry behavior
 * - Enables screenshot and video on failure
 * - Configures HTTPS handling for local development
 * @dependencies
 * - @playwright/test for configuration types
 *
 * @note Run tests with: dotenvx run -f .env.test -- npm run test:e2e
 *       This loads environment variables from .env.test before running tests
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 *
 * Tests run against Docker Compose services (not webServer).
 * Configure E2E_BASE_URL environment variable for custom target.
 */
export default defineConfig({
  // Test directory following project convention
  testDir: './__tests__',
  testMatch: '**/*.spec.ts',

  // Parallel execution - each test generates unique users, so isolation is maintained
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  // Fail fast in CI, allow .only locally
  forbidOnly: !!process.env.CI,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  // Global test settings
  use: {
    // Base URL for navigation - Docker Compose serves on https://localhost
    baseURL: process.env.E2E_BASE_URL ?? 'https://localhost',

    // Capture artifacts on failure
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // Accept self-signed certificates in Docker
    ignoreHTTPSErrors: true,

    // Viewport for consistent testing
    viewport: { width: 1280, height: 720 },

    // Navigation timeout
    navigationTimeout: 30000,

    // Action timeout (15s for CI stability)
    actionTimeout: 15000,
  },

  // Browser projects - Chromium only for fast feedback
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Test timeout - allow time for Docker services
  timeout: 60000,

  // Assertion timeout
  expect: {
    timeout: 10000,
  },

  // Output directory for test artifacts
  outputDir: 'test-results',

  // No webServer - tests run against Docker Compose
  // Start services with: docker compose -f docker-compose.test.yml up -d
});
