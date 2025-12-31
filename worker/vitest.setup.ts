/**
 * @file vitest.setup.ts
 * @purpose Set required environment variables before test execution
 * @functionality
 * - Mocks dotenv to suppress promotional tips during tests
 * - Sets NODE_ENV to test mode
 * - Sets LOG_LEVEL to silent to suppress all log output during tests
 * - Suppresses console.warn for DATABASE_KEY warning
 * - Clears mocks after each test
 * @dependencies
 * - Vitest setup mechanism
 */

// Mock dotenv to suppress promotional tips during tests
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: process.env })),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
// Use 'silent' to suppress all log output during tests
process.env.LOG_LEVEL = 'silent';
// Point to the shared database with prompt-service
// Note: DATABASE_KEY is intentionally not set - test DB is unencrypted
process.env.DATABASE_URL = 'file:../prompt-service/prisma/dev.db';

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Restore mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
