/**
 * @file health/checks/prompt-cache.check.ts
 * @purpose Health check that reports prompt cache statistics
 * @functionality
 * - Reports cache size and hit/miss ratio
 * - Reports number of refreshes in progress
 * - Always returns healthy status (informational only)
 * @dependencies
 * - @/health/types for HealthCheck, ComponentHealth types
 * - @/services/prompt-cache.service for cache statistics
 */

import type { HealthCheck, ComponentHealth } from '@/health';
import { promptCacheService } from '@/services';

function checkPromptCache(): Promise<ComponentHealth> {
  const stats = promptCacheService.getStats();
  const hitRatioPercent = (stats.hitRatio * 100).toFixed(1);

  return Promise.resolve({
    status: 'healthy',
    message: `Cache entries: ${stats.size}, Hit ratio: ${hitRatioPercent}%`,
  });
}

export function createPromptCacheCheck(): HealthCheck {
  return {
    name: 'prompt-cache',
    check: checkPromptCache,
    critical: false, // Informational only
    runOnce: false, // Check on every health request
  };
}
