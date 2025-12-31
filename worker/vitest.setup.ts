/**
 * @file vitest.setup.ts
 * @purpose Set required environment variables before test execution
 * @functionality
 * - Mocks dotenv to suppress promotional tips during tests
 * - Sets NODE_ENV to test mode
 * - Sets LOG_LEVEL to error to reduce test output noise
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
process.env.LOG_LEVEL = 'error';

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Restore mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
