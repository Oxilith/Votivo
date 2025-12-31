// Backend test setup
// No need to import vitest globals when globals: true in vitest.config.ts

// Mock dotenv to suppress promotional tips during tests
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: process.env })),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
// Use 'silent' to suppress all log output during tests
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key';
process.env.PROMPT_SERVICE_URL = 'http://localhost:3002';

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Restore mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
