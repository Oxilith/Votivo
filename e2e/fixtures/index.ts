/**
 * @file e2e/fixtures/index.ts
 * @purpose Barrel export for test fixtures
 * @functionality
 * - Exports test and expect from custom fixtures
 * - Exports mock data constants
 * - Exports helper functions
 * @dependencies
 * - ./test for custom fixtures
 * - ./mock-data for constants
 */

// Custom test fixtures
export { test, expect, createTestUser, type TestUser } from './test';

// Mock data constants
export {
  ADMIN_API_KEY,
  DEFAULT_TEST_PASSWORD,
  MOCK_ASSESSMENT_RESPONSES,
  E2E_ROUTES,
  E2E_API_ENDPOINTS,
  E2E_TIMEOUTS,
} from './mock-data';
