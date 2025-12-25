/**
 * @file services/prompt-client.service.ts
 * @purpose HTTP client for communicating with the prompt-service microservice
 * @functionality
 * - Resolves prompt configurations with circuit breaker protection
 * - Caches successful resolutions with TTL
 * - Fails fast when circuit is open (no fallback to hardcoded prompts)
 * - Schedules background cache refresh when service recovers
 * - Records A/B test conversions for analytics
 * @dependencies
 * - @/config for prompt service URL configuration
 * - @/utils/logger for logging
 * - @/services/circuit-breaker.service for circuit breaker wrapper
 * - @/services/prompt-cache.service for in-memory caching
 * - shared/prompt.types for PromptConfig type
 */

import type CircuitBreaker from 'opossum';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { createCircuitBreaker } from '@/services/circuit-breaker.service.js';
import { promptCacheService } from '@/services/prompt-cache.service.js';
import type { PromptConfig } from 'shared/index.js';

const REQUEST_TIMEOUT_MS = 5000;
const MAX_BACKGROUND_RETRY_ATTEMPTS = 5;

export interface ResolvePromptResponse {
  config: PromptConfig;
  abTestId?: string;
  variantId?: string;
}

/**
 * Error thrown when prompt service is unavailable
 * This should be caught by error middleware and return 503
 */
export class PromptServiceUnavailableError extends Error {
  constructor(message = 'Prompt service is unavailable') {
    super(message);
    this.name = 'PromptServiceUnavailableError';
  }
}

export class PromptClientService {
  private readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker<[string, boolean], ResolvePromptResponse>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? config.promptServiceUrl;

    // Create circuit breaker for resolve calls
    this.circuitBreaker = createCircuitBreaker<[string, boolean], ResolvePromptResponse>(
      'prompt-service',
      this.resolveInternal.bind(this),
      {
        timeout: config.circuitBreakerTimeout,
        errorThresholdPercentage: config.circuitBreakerErrorThreshold,
        resetTimeout: config.circuitBreakerResetTimeout,
      }
    );

    // When circuit closes (service recovers), refresh cached prompts
    this.circuitBreaker.on('close', () => {
      this.refreshAllCachedPrompts();
    });
  }

  /**
   * Resolves a prompt configuration from the prompt-service
   * Uses cache for fresh entries, circuit breaker for protection
   * @param key - The prompt key (e.g., 'IDENTITY_ANALYSIS')
   * @param thinkingEnabled - Whether extended thinking is enabled
   * @returns The prompt configuration with optional A/B test metadata
   * @throws PromptServiceUnavailableError when service is unavailable
   */
  async resolve(key: string, thinkingEnabled: boolean): Promise<ResolvePromptResponse> {
    // Check cache first - if fresh, return immediately
    const cached = promptCacheService.get(key, thinkingEnabled);
    if (cached && promptCacheService.isFresh(key, thinkingEnabled)) {
      logger.debug({ key, thinkingEnabled }, 'Prompt resolved from cache');
      return {
        config: cached.config,
        ...(cached.variantId !== undefined && { variantId: cached.variantId }),
      };
    }

    // If circuit is open, fail fast - no fallback to hardcoded prompts
    if (this.circuitBreaker.opened) {
      logger.warn({ key, thinkingEnabled }, 'Circuit breaker open - failing fast');
      throw new PromptServiceUnavailableError('Circuit breaker is open - prompt service unavailable');
    }

    try {
      const result = await this.circuitBreaker.fire(key, thinkingEnabled);

      // Cache successful result
      promptCacheService.set(key, thinkingEnabled, result.config, result.variantId);

      return result;
    } catch (error) {
      // Schedule background refresh if we have stale cached data
      if (cached) {
        this.scheduleBackgroundRefresh(key, thinkingEnabled);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve prompt';
      logger.error({ key, thinkingEnabled, error: errorMessage }, 'Prompt resolution failed');

      throw new PromptServiceUnavailableError(errorMessage);
    }
  }

  /**
   * Internal method that makes the actual HTTP call
   * This is wrapped by the circuit breaker
   */
  private async resolveInternal(key: string, thinkingEnabled: boolean): Promise<ResolvePromptResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/api/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, thinkingEnabled }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json() as ResolvePromptResponse;

      logger.debug(
        { key, thinkingEnabled, abTestId: data.abTestId, variantId: data.variantId },
        'Prompt resolved from prompt-service'
      );

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Prompt service request timed out');
      }

      throw error;
    }
  }

  /**
   * Schedules a background refresh for a cached prompt
   * Uses exponential backoff for retries
   */
  private scheduleBackgroundRefresh(key: string, thinkingEnabled: boolean): void {
    // Prevent duplicate refresh operations
    if (!promptCacheService.markRefreshInProgress(key, thinkingEnabled)) {
      return;
    }

    const retry = async (attempt: number): Promise<void> => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 30s)
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((r) => setTimeout(r, delay));

      // If circuit is still open, stop retrying
      if (this.circuitBreaker.opened) {
        promptCacheService.clearRefreshInProgress(key, thinkingEnabled);
        logger.debug({ key, thinkingEnabled }, 'Background refresh cancelled - circuit still open');
        return;
      }

      try {
        const result = await this.resolveInternal(key, thinkingEnabled);
        promptCacheService.set(key, thinkingEnabled, result.config, result.variantId);
        promptCacheService.clearRefreshInProgress(key, thinkingEnabled);
        logger.info({ key, thinkingEnabled }, 'Background cache refresh successful');
      } catch {
        if (attempt < MAX_BACKGROUND_RETRY_ATTEMPTS) {
          void retry(attempt + 1);
        } else {
          promptCacheService.clearRefreshInProgress(key, thinkingEnabled);
          logger.warn(
            { key, thinkingEnabled, attempts: attempt + 1 },
            'Background refresh failed after max attempts'
          );
        }
      }
    };

    // Start retry loop
    void retry(0);
  }

  /**
   * Refreshes all commonly used prompt configurations
   * Called when circuit breaker closes (service recovers)
   */
  private refreshAllCachedPrompts(): void {
    logger.info('Service recovered - refreshing prompt cache');

    const promptsToRefresh = [
      { key: 'IDENTITY_ANALYSIS', thinkingEnabled: true },
      { key: 'IDENTITY_ANALYSIS', thinkingEnabled: false },
    ];

    for (const { key, thinkingEnabled } of promptsToRefresh) {
      this.scheduleBackgroundRefresh(key, thinkingEnabled);
    }
  }

  /**
   * Records a conversion for A/B testing analytics
   * @param variantId - The variant ID to record the conversion for
   */
  async recordConversion(variantId: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}/api/resolve/${variantId}/conversion`, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn(
          { variantId, status: response.status },
          'Failed to record A/B test conversion'
        );
      } else {
        logger.debug({ variantId }, 'A/B test conversion recorded');
      }
    } catch (error) {
      // Don't fail the main operation if conversion recording fails
      logger.warn(
        { variantId, error: error instanceof Error ? error.message : 'Unknown error' },
        'Error recording A/B test conversion'
      );
    }
  }

  /**
   * Checks if the prompt service is healthy
   * @returns true if the service is reachable and healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current state of the circuit breaker
   */
  getCircuitState(): 'closed' | 'open' | 'half-open' {
    if (this.circuitBreaker.opened) {
      return 'open';
    }
    if (this.circuitBreaker.halfOpen) {
      return 'half-open';
    }
    return 'closed';
  }
}

// Singleton instance
export const promptClientService = new PromptClientService();
