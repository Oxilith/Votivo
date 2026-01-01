// Backend test setup
// No need to import vitest globals when globals: true in vitest.config.ts

// Mock dotenv to suppress promotional tips during tests
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: process.env })),
}));

// Set test environment variables BEFORE any imports that might use config
process.env.NODE_ENV = 'test';
// Use 'silent' to suppress all log output during tests
process.env.LOG_LEVEL = 'silent';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key';
process.env.PROMPT_SERVICE_URL = 'http://localhost:3002';

// Reset mocks and clear caches after each test for proper isolation
// Use vi.importActual to get real modules (not mocks) for cleanup
afterEach(async () => {
  vi.clearAllMocks();
  const { promptCacheService } = await vi.importActual<
    typeof import('@/services/prompt-cache.service')
  >('@/services/prompt-cache.service');
  const { destroyAllCircuitBreakers } = await vi.importActual<
    typeof import('@/services/circuit-breaker.service')
  >('@/services/circuit-breaker.service');
  promptCacheService.clear();
  destroyAllCircuitBreakers();
});

// Restore mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
