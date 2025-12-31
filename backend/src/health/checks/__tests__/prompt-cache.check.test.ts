/**
 * @file health/checks/__tests__/prompt-cache.check.test.ts
 * @purpose Unit tests for Prompt Cache health check
 * @functionality
 * - Tests healthy response with cache statistics
 * - Tests correct formatting of hit ratio percentage
 * @dependencies
 * - vitest for testing framework
 * - createPromptCacheCheck factory under test
 */

// Hoist mock before imports
const { mockGetStats } = vi.hoisted(() => ({
  mockGetStats: vi.fn(),
}));

vi.mock('@/services/prompt-cache.service', () => ({
  promptCacheService: {
    getStats: mockGetStats,
  },
}));

import { createPromptCacheCheck } from '@/health';

describe('prompt-cache.check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPromptCacheCheck', () => {
    it('should return a health check with correct properties', () => {
      const check = createPromptCacheCheck();

      expect(check.name).toBe('prompt-cache');
      expect(check.critical).toBe(false);
      expect(check.runOnce).toBe(false);
      expect(typeof check.check).toBe('function');
    });
  });

  describe('check function', () => {
    it('should return healthy with cache stats', async () => {
      mockGetStats.mockReturnValue({
        size: 5,
        hitRatio: 0.75,
        hits: 15,
        misses: 5,
        refreshesInProgress: 0,
      });

      const check = createPromptCacheCheck();
      const result = await check.check();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Cache entries: 5, Hit ratio: 75.0%');
    });

    it('should format hit ratio correctly', async () => {
      mockGetStats.mockReturnValue({
        size: 10,
        hitRatio: 0.333,
        hits: 10,
        misses: 20,
        refreshesInProgress: 0,
      });

      const check = createPromptCacheCheck();
      const result = await check.check();

      expect(result.message).toContain('Hit ratio: 33.3%');
    });

    it('should handle zero hit ratio', async () => {
      mockGetStats.mockReturnValue({
        size: 0,
        hitRatio: 0,
        hits: 0,
        misses: 0,
        refreshesInProgress: 0,
      });

      const check = createPromptCacheCheck();
      const result = await check.check();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Cache entries: 0, Hit ratio: 0.0%');
    });

    it('should handle 100% hit ratio', async () => {
      mockGetStats.mockReturnValue({
        size: 3,
        hitRatio: 1.0,
        hits: 100,
        misses: 0,
        refreshesInProgress: 0,
      });

      const check = createPromptCacheCheck();
      const result = await check.check();

      expect(result.message).toContain('Hit ratio: 100.0%');
    });
  });
});
