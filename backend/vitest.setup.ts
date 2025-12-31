// Backend test setup
// No need to import vitest globals when globals: true in vitest.config.ts

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key';

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Restore mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
