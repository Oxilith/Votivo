/**
 * @file services/prompt-cache.service.ts
 * @purpose In-memory cache for prompt configurations with TTL and LRU eviction
 * @functionality
 * - Caches prompt configs with configurable TTL
 * - Supports stale-while-revalidate pattern
 * - Implements LRU eviction when cache exceeds max entries (100)
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
   * Removes a cache key from the access order tracking
   */
  private removeFromAccessOrder(cacheKey: string): void {
    const index = this.accessOrder.indexOf(cacheKey);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Checks if a cache entry is fresh (within TTL)
   */
  isFresh(key: string, thinkingEnabled: boolean): boolean {
    const entry = this.get(key, thinkingEnabled);
    if (!entry) {
      return false;
    }
    return (Date.now() - entry.timestamp) <= CACHE_TTL_MS;
  }

  /**
   * Checks if a cache entry exists (even if stale)
   */
  has(key: string, thinkingEnabled: boolean): boolean {
    return this.get(key, thinkingEnabled) !== null;
  }

  /**
   * Sets a cache entry with current timestamp
   * Evicts least recently used entries if cache exceeds max size
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
   * Clears all cached entries (useful for testing)
   */
  clear(): void {
    this.cache.clear();
    this.refreshInProgress.clear();
    this.accessOrder = [];
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
