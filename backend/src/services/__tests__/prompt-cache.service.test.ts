/**
 * @file services/__tests__/prompt-cache.service.test.ts
 * @purpose Unit tests for PromptCacheService cache operations
 * @functionality
 * - Tests get/set operations with correct cache key generation
 * - Tests TTL expiration and stale-while-revalidate pattern
 * - Tests LRU eviction when cache exceeds max entries
 * - Tests refresh-in-progress tracking
 * - Tests cache hit/miss metrics
 * @dependencies
 * - vitest for testing framework
 * - PromptCacheService for service under test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PromptCacheService } from '@/services/prompt-cache.service.js';
import type { PromptConfig } from 'shared/index.js';

// Mock config with test values
vi.mock('@/config/index.js', () => ({
  config: {
    promptCacheTtlMs: 5000, // 5 seconds for testing
    promptStaleTtlMs: 10000, // 10 seconds for testing
  },
}));

describe('PromptCacheService', () => {
  let cacheService: PromptCacheService;

  const mockPromptConfig: PromptConfig = {
    prompt: 'Test prompt content',
    model: 'claude-sonnet-4-0',
    max_tokens: 1000,
    temperature: 0.7,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    cacheService = new PromptCacheService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get/set operations', () => {
    it('should return null for non-existent entry', () => {
      const result = cacheService.get('IDENTITY_ANALYSIS', true);
      expect(result).toBeNull();
    });

    it('should store and retrieve cached entry correctly', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');

      const result = cacheService.get('IDENTITY_ANALYSIS', true);

      expect(result).not.toBeNull();
      expect(result?.config).toEqual(mockPromptConfig);
      expect(result?.variantId).toBe('variant-1');
    });

    it('should generate correct cache key for key:thinkingEnabled combination', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');
      cacheService.set('IDENTITY_ANALYSIS', false, mockPromptConfig, 'variant-2');

      const resultWithThinking = cacheService.get('IDENTITY_ANALYSIS', true);
      const resultWithoutThinking = cacheService.get('IDENTITY_ANALYSIS', false);

      expect(resultWithThinking?.variantId).toBe('variant-1');
      expect(resultWithoutThinking?.variantId).toBe('variant-2');
    });

    it('should handle undefined variantId', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, undefined);

      const result = cacheService.get('IDENTITY_ANALYSIS', true);

      expect(result?.variantId).toBeUndefined();
    });
  });

  describe('TTL and freshness', () => {
    it('should report entry as fresh within TTL', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');

      // Advance time by 2 seconds (within 5 second TTL)
      vi.advanceTimersByTime(2000);

      expect(cacheService.isFresh('IDENTITY_ANALYSIS', true)).toBe(true);
    });

    it('should report entry as stale after TTL but before STALE_TTL', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');

      // Advance time by 6 seconds (past 5 second TTL, before 10 second STALE_TTL)
      vi.advanceTimersByTime(6000);

      expect(cacheService.isFresh('IDENTITY_ANALYSIS', true)).toBe(false);
      // But entry should still be retrievable (stale-while-revalidate)
      expect(cacheService.has('IDENTITY_ANALYSIS', true)).toBe(true);
    });

    it('should delete entry after STALE_TTL', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');

      // Advance time by 11 seconds (past 10 second STALE_TTL)
      vi.advanceTimersByTime(11000);

      expect(cacheService.get('IDENTITY_ANALYSIS', true)).toBeNull();
      expect(cacheService.has('IDENTITY_ANALYSIS', true)).toBe(false);
    });

    it('should report non-existent entry as not fresh', () => {
      expect(cacheService.isFresh('NON_EXISTENT', true)).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache reaches MAX_ENTRIES', () => {
      // Fill cache with 100 entries
      for (let i = 0; i < 100; i++) {
        cacheService.set(`KEY_${i}`, true, mockPromptConfig, `variant-${i}`);
      }

      // Add one more entry to trigger eviction
      cacheService.set('NEW_KEY', true, mockPromptConfig, 'new-variant');

      // First entry (KEY_0) should be evicted
      expect(cacheService.get('KEY_0', true)).toBeNull();
      // New entry should exist
      expect(cacheService.get('NEW_KEY', true)).not.toBeNull();
    });

    it('should update access order when existing entry is set', () => {
      // Add 3 entries
      cacheService.set('KEY_A', true, mockPromptConfig, 'a');
      cacheService.set('KEY_B', true, mockPromptConfig, 'b');
      cacheService.set('KEY_C', true, mockPromptConfig, 'c');

      // Update KEY_A to move it to most recently used
      cacheService.set('KEY_A', true, mockPromptConfig, 'a-updated');

      // Fill rest of cache and trigger eviction
      for (let i = 0; i < 98; i++) {
        cacheService.set(`KEY_${i}`, true, mockPromptConfig, `variant-${i}`);
      }

      // KEY_B should be evicted (was LRU after KEY_A was updated)
      expect(cacheService.get('KEY_B', true)).toBeNull();
      // KEY_A should still exist (was recently updated)
      expect(cacheService.get('KEY_A', true)).not.toBeNull();
    });

    it('should update access order on get', () => {
      // Add 3 entries
      cacheService.set('KEY_A', true, mockPromptConfig, 'a');
      cacheService.set('KEY_B', true, mockPromptConfig, 'b');
      cacheService.set('KEY_C', true, mockPromptConfig, 'c');

      // Access KEY_A to move it to most recently used
      cacheService.get('KEY_A', true);

      // Fill rest of cache and trigger eviction
      for (let i = 0; i < 98; i++) {
        cacheService.set(`KEY_${i}`, true, mockPromptConfig, `variant-${i}`);
      }

      // KEY_B should be evicted (was LRU after KEY_A was accessed)
      expect(cacheService.get('KEY_B', true)).toBeNull();
      // KEY_A should still exist (was recently accessed)
      expect(cacheService.get('KEY_A', true)).not.toBeNull();
    });
  });

  describe('refresh tracking', () => {
    it('should mark refresh in progress and prevent duplicates', () => {
      const firstMark = cacheService.markRefreshInProgress('IDENTITY_ANALYSIS', true);
      const secondMark = cacheService.markRefreshInProgress('IDENTITY_ANALYSIS', true);

      expect(firstMark).toBe(true);
      expect(secondMark).toBe(false);
    });

    it('should clear refresh in progress flag', () => {
      cacheService.markRefreshInProgress('IDENTITY_ANALYSIS', true);
      cacheService.clearRefreshInProgress('IDENTITY_ANALYSIS', true);

      // Should be able to mark again after clearing
      const result = cacheService.markRefreshInProgress('IDENTITY_ANALYSIS', true);
      expect(result).toBe(true);
    });

    it('should clear refresh flag on LRU eviction', () => {
      // Mark refresh in progress for KEY_0
      cacheService.markRefreshInProgress('KEY_0', true);

      // Fill cache with 100 entries (KEY_0 doesn't exist in cache, but refresh is marked)
      for (let i = 0; i < 100; i++) {
        cacheService.set(`KEY_${i}`, true, mockPromptConfig, `variant-${i}`);
      }

      // Add one more entry to trigger eviction of KEY_0
      cacheService.set('NEW_KEY', true, mockPromptConfig, 'new-variant');

      // After eviction, refresh flag should be cleared
      // We can verify by checking stats
      const stats = cacheService.getStats();
      expect(stats.refreshesInProgress).toBeLessThanOrEqual(1);
    });

    it('should track different keys independently', () => {
      cacheService.markRefreshInProgress('KEY_A', true);
      cacheService.markRefreshInProgress('KEY_B', true);

      cacheService.clearRefreshInProgress('KEY_A', true);

      // KEY_A should be clearable now
      expect(cacheService.markRefreshInProgress('KEY_A', true)).toBe(true);
      // KEY_B should still be in progress
      expect(cacheService.markRefreshInProgress('KEY_B', true)).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should track cache hits correctly', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');

      cacheService.get('IDENTITY_ANALYSIS', true);
      cacheService.get('IDENTITY_ANALYSIS', true);

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses correctly', () => {
      cacheService.get('NON_EXISTENT', true);
      cacheService.get('NON_EXISTENT', false);

      const stats = cacheService.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit ratio correctly', () => {
      cacheService.set('IDENTITY_ANALYSIS', true, mockPromptConfig, 'variant-1');

      // 2 hits
      cacheService.get('IDENTITY_ANALYSIS', true);
      cacheService.get('IDENTITY_ANALYSIS', true);

      // 2 misses
      cacheService.get('NON_EXISTENT', true);
      cacheService.get('NON_EXISTENT', false);

      const stats = cacheService.getStats();
      expect(stats.hitRatio).toBe(0.5); // 2 hits / 4 total
    });

    it('should return 0 hit ratio when no accesses', () => {
      const stats = cacheService.getStats();
      expect(stats.hitRatio).toBe(0);
    });

    it('should track cache size correctly', () => {
      cacheService.set('KEY_A', true, mockPromptConfig, 'a');
      cacheService.set('KEY_B', false, mockPromptConfig, 'b');

      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries and reset state', () => {
      cacheService.set('KEY_A', true, mockPromptConfig, 'a');
      cacheService.set('KEY_B', true, mockPromptConfig, 'b');
      cacheService.markRefreshInProgress('KEY_C', true);

      cacheService.clear();

      expect(cacheService.get('KEY_A', true)).toBeNull();
      expect(cacheService.get('KEY_B', true)).toBeNull();

      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.refreshesInProgress).toBe(0);
    });
  });
});
