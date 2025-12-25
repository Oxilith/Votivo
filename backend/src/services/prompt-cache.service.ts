/**
 * @file services/prompt-cache.service.ts
 * @purpose In-memory cache for prompt configurations with TTL management
 * @functionality
 * - Caches prompt configs with configurable TTL
 * - Supports stale-while-revalidate pattern
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

export class PromptCacheService {
  private cache = new Map<string, CacheEntry>();
  private refreshInProgress = new Set<string>();

  /**
   * Generates a cache key from prompt key and thinking mode
   * Uses JSON serialization to prevent collisions if key contains special characters
   */
  private getCacheKey(key: string, thinkingEnabled: boolean): string {
    return JSON.stringify({ key, thinkingEnabled });
  }

  /**
   * Gets a cached entry if it exists and hasn't expired
   * @returns The cache entry or null if not found/expired
   */
  get(key: string, thinkingEnabled: boolean): CacheEntry | null {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;

    // If beyond stale TTL, delete and return null
    if (age > STALE_TTL_MS) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry;
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
   */
  set(
    key: string,
    thinkingEnabled: boolean,
    config: PromptConfig,
    variantId: string | undefined
  ): void {
    const cacheKey = this.getCacheKey(key, thinkingEnabled);
    this.cache.set(cacheKey, {
      config,
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
  }

  /**
   * Gets cache statistics
   */
  getStats(): { size: number; refreshesInProgress: number } {
    return {
      size: this.cache.size,
      refreshesInProgress: this.refreshInProgress.size,
    };
  }
}

// Singleton instance
export const promptCacheService = new PromptCacheService();
