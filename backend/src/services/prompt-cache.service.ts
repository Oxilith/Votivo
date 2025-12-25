/**
 * @file services/prompt-cache.service.ts
 * @purpose In-memory cache for prompt configurations with TTL and LRU eviction
 * @functionality
 * - Caches prompt configs with configurable TTL
 * - Supports stale-while-revalidate pattern
 * - Implements LRU eviction when cache exceeds max entries (100) using O(n) array-based tracking
 * - Tracks refresh operations to prevent duplicate requests
 * - Provides cache freshness checking
 * @dependencies
 * - shared/index for PromptConfig type
 * - @/config for TTL configuration
 * @note Cache is per-process. In multi-instance deployments, each instance
 *       maintains its own cache. Updates/deletes may take up to STALE_TTL_MS
 *       (default 1 hour) to propagate across all instances.
 */

import type { PromptConfig } from 'shared/index.js';
import { config } from '@/config/index.js';

interface CacheEntry {
  config: PromptConfig;
  variantId: string | undefined;
  timestamp: number;
}

/** Cache TTL - entries older than this are considered stale (configurable, default 5 minutes) */
const CACHE_TTL_MS = config.promptCacheTtlMs;

/** Maximum age before entry is deleted entirely (configurable, default 1 hour) */
const STALE_TTL_MS = config.promptStaleTtlMs;

/** Maximum number of cache entries before LRU eviction */
const MAX_CACHE_ENTRIES = 100;

export class PromptCacheService {
  private cache = new Map<string, CacheEntry>();
  private refreshInProgress = new Set<string>();
  private accessOrder: string[] = [];
  private hits = 0;
  private misses = 0;

  /**
   * Generates a cache key from prompt key and thinking mode
   * Uses simple string concatenation for performance
   */
  private getCacheKey(key: string, thinkingEnabled: boolean): string {
    return `${key}:${thinkingEnabled ? '1' : '0'}`;
  }

  /**
   * Gets a cached entry if it exists and hasn't expired
   * Updates LRU access order and hit/miss metrics on cache access
   * @returns The cache entry or null if not found/expired
   */
  get(key: string, thinkingEnabled: boolean): CacheEntry | null {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.misses++;
      return null;
    }

    const age = Date.now() - entry.timestamp;

    // If beyond stale TTL, delete and return null
    if (age > STALE_TTL_MS) {
      this.cache.delete(cacheKey);
      this.removeFromAccessOrder(cacheKey);
      this.misses++;
      return null;
    }

    // Update LRU access order - move to end (most recently used)
    this.removeFromAccessOrder(cacheKey);
    this.accessOrder.push(cacheKey);
    this.hits++;

    return entry;
  }

  /**
   * Removes a cache key from the access order tracking.
   *
   * Implementation Note: Uses Array.indexOf() + splice() which is O(n).
   * This is intentional and acceptable because:
   * 1. MAX_CACHE_ENTRIES is capped at 100 - O(n) on 100 elements is ~microseconds
   * 2. This method is only called on cache hits/sets, not in tight loops
   * 3. A Map-based doubly-linked list (O(1) LRU) would add significant complexity
   *    for negligible performance gain at this scale
   *
   * If MAX_CACHE_ENTRIES grows to 1000+, consider switching to a proper LRU
   * implementation using a Map with a doubly-linked list.
   */
  private removeFromAccessOrder(cacheKey: string): void {
    const index = this.accessOrder.indexOf(cacheKey);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Internal method to get entry without updating metrics or LRU order.
   * Used by isFresh() and has() to avoid double-counting accesses.
   * Still performs stale TTL cleanup.
   */
  private getWithoutTracking(key: string, thinkingEnabled: boolean): CacheEntry | null {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;

    // If beyond stale TTL, delete and return null (cleanup still needed)
    if (age > STALE_TTL_MS) {
      this.cache.delete(cacheKey);
      this.removeFromAccessOrder(cacheKey);
      return null;
    }

    return entry;
  }

  /**
   * Checks if a cache entry is fresh (within TTL).
   * Does NOT update LRU order or metrics - use after get() for freshness check.
   */
  isFresh(key: string, thinkingEnabled: boolean): boolean {
    const entry = this.getWithoutTracking(key, thinkingEnabled);
    if (!entry) {
      return false;
    }
    return (Date.now() - entry.timestamp) <= CACHE_TTL_MS;
  }

  /**
   * Checks if a cache entry exists (even if stale).
   * Does NOT update LRU order or metrics.
   */
  has(key: string, thinkingEnabled: boolean): boolean {
    return this.getWithoutTracking(key, thinkingEnabled) !== null;
  }

  /**
   * Sets a cache entry with current timestamp.
   * Evicts least recently used entries if cache exceeds max size.
   *
   * @note Thread Safety: In single-threaded Node.js, this is safe since set() is synchronous.
   * The while loop for LRU eviction completes atomically before any other operation can run.
   * If async operations are added in the future, consider adding a mutex to prevent
   * concurrent eviction races.
   */
  set(
    key: string,
    thinkingEnabled: boolean,
    promptConfig: PromptConfig,
    variantId: string | undefined
  ): void {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);

    // Update access order - remove if exists, then add to end
    this.removeFromAccessOrder(cacheKey);
    this.accessOrder.push(cacheKey);

    // Evict LRU entries if cache is at or over limit
    while (this.cache.size >= MAX_CACHE_ENTRIES && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
        this.refreshInProgress.delete(lruKey);
      }
    }

    this.cache.set(cacheKey, {
      config: promptConfig,
      variantId,
      timestamp: Date.now(),
    });
  }

  /**
   * Marks a cache entry as currently being refreshed
   * @returns true if marked successfully, false if already being refreshed
   */
  markRefreshInProgress(key: string, thinkingEnabled: boolean): boolean {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);
    if (this.refreshInProgress.has(cacheKey)) {
      return false;
    }
    this.refreshInProgress.add(cacheKey);
    return true;
  }

  /**
   * Clears the refresh-in-progress flag for a cache entry
   */
  clearRefreshInProgress(key: string, thinkingEnabled: boolean): void {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);
    this.refreshInProgress.delete(cacheKey);
  }

  /**
   * Clears all cached entries and resets metrics (useful for testing)
   */
  clear(): void {
    this.cache.clear();
    this.refreshInProgress.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Gets cache statistics including hit/miss metrics
   */
  getStats(): {
    size: number;
    refreshesInProgress: number;
    hits: number;
    misses: number;
    hitRatio: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      refreshesInProgress: this.refreshInProgress.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }
}

// Singleton instance
export const promptCacheService = new PromptCacheService();
