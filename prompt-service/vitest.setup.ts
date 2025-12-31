/**
 * @file vitest.setup.ts
 * @purpose Set required environment variables before test execution
 * @functionality
 * - Mocks dotenv to suppress promotional tips during tests
 * - Sets SESSION_SECRET to prevent config validation errors
 * - Sets JWT secrets for authentication tests
 * - Sets NODE_ENV to test mode
 * - Sets LOG_LEVEL to error to reduce test output noise
 * @dependencies
 * - Vitest setup mechanism
 */

// Mock dotenv to suppress promotional tips during tests
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: process.env })),
}));

// Set required env vars before any module imports
// This runs before test files load, preventing config validation errors
process.env['SESSION_SECRET'] = 'test-session-secret-at-least-32-chars-long';
process.env['DATABASE_KEY'] = 'test-database-key-at-least-32-characters';
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';
process.env['JWT_ACCESS_SECRET'] = 'test-jwt-access-secret-at-least-32-chars';
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-32-chars-min';
