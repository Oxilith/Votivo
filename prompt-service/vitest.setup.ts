/**
 * @file vitest.setup.ts
 * @purpose Set required environment variables before test execution
 * @functionality
 * - Mocks dotenv to suppress promotional tips during tests
 * - Sets SESSION_SECRET to prevent config validation errors
 * - Sets JWT secrets for authentication tests
 * - Sets NODE_ENV to test mode
 * - Sets LOG_LEVEL to silent to suppress all log output during tests
 * - Sets DATABASE_KEY to suppress encryption warning in tests
 * @dependencies
 * - Vitest setup mechanism
 */

// Mock dotenv to suppress promotional tips during tests
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: process.env })),
}));

// Suppress console.warn for DATABASE_KEY warning during tests
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Set required env vars before any module imports
// This runs before test files load, preventing config validation errors
process.env['SESSION_SECRET'] = 'test-session-secret-at-least-32-chars-long';
process.env['NODE_ENV'] = 'test';
// Use 'silent' to suppress all log output during tests
process.env['LOG_LEVEL'] = 'silent';
process.env['JWT_ACCESS_SECRET'] = 'test-jwt-access-secret-at-least-32-chars';
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-32-chars-min';
// Note: DATABASE_KEY is intentionally NOT set - test DB is unencrypted
// The console.warn mock above suppresses the DATABASE_KEY warning
// Suppress Prisma debug/error output during tests
process.env['DEBUG'] = '';
// Point to the actual database created by prisma migrate
process.env['DATABASE_URL'] = 'file:./prisma/dev.db';
// Disable rate limiting for integration tests (set very high limits)
process.env['RATE_LIMIT_LOGIN'] = '10000';
process.env['RATE_LIMIT_REGISTER'] = '10000';
process.env['RATE_LIMIT_PASSWORD_RESET'] = '10000';
process.env['RATE_LIMIT_FORGOT_PASSWORD'] = '10000';
process.env['RATE_LIMIT_TOKEN_REFRESH'] = '10000';
process.env['RATE_LIMIT_USER_DATA'] = '10000';
process.env['RATE_LIMIT_PROFILE'] = '10000';
