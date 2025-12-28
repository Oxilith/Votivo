/**
 * @file services/prompt-client.service.ts
 * @purpose HTTP client for communicating with the prompt-service microservice
 * @functionality
 * - Resolves prompt configurations with circuit breaker protection
 * - Caches successful resolutions with TTL and stale-while-revalidate
 * - Fails fast when circuit is open (no fallback to hardcoded prompts)
 * - Schedules background cache refresh with overall timeout (60s)
 * - Records A/B test conversions with circuit breaker protection
 * - Health checks with circuit breaker protection
 * - Sanitizes error messages to prevent information disclosure
 * @dependencies
 * - @/config for prompt service URL configuration
 * - @/utils/logger for logging
 * - @/utils/error-sanitizer for secure error handling
 * - @/utils/background-refresh-manager for background task management
 * - @/services/circuit-breaker.service for circuit breaker wrapper
 * - @/services/prompt-cache.service for in-memory caching
 * - shared/prompt.types for PromptConfig type
 */

import type CircuitBreaker from 'opossum';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { createClientError } from '@/utils/error-sanitizer.js';
import { fetchWithTimeout } from '@/utils/fetch-with-timeout.js';
import { createCircuitBreaker } from '@/services/circuit-breaker.service.js';
import { promptCacheService } from '@/services/prompt-cache.service.js';
import {
  BackgroundRefreshManager,
  type BackgroundTask,
} from '@/utils/background-refresh-manager.js';
import type { PromptConfig } from 'shared/index.js';

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Task identifier for background refresh operations
 * Used by BackgroundRefreshManager for deduplication and processing
 */
interface PromptRefreshTaskId {
  key: string;
  thinkingEnabled: boolean;
}

/**
 * Prompts to refresh when circuit breaker closes (service recovers)
 * Add new prompt keys here as they are added to the system
 */
const PROMPTS_TO_CACHE_ON_RECOVERY = [
  { key: 'IDENTITY_ANALYSIS', thinkingEnabled: true },
  { key: 'IDENTITY_ANALYSIS', thinkingEnabled: false },
] as const;

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
  private readonly conversionCircuitBreaker: CircuitBreaker<[string], undefined>;
  private readonly healthCircuitBreaker: CircuitBreaker<[], boolean>;
  private readonly refreshManager: BackgroundRefreshManager<PromptRefreshTaskId>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? config.promptServiceUrl;

    // Create circuit breaker for resolve calls
    this.circuitBreaker = createCircuitBreaker<[string, boolean], ResolvePromptResponse>(
      'prompt-service-resolve',
      this.resolveInternal.bind(this),
      {
        timeout: config.circuitBreakerTimeout,
        errorThresholdPercentage: config.circuitBreakerErrorThreshold,
        resetTimeout: config.circuitBreakerResetTimeout,
      }
    );

    // Create circuit breaker for conversion calls (more lenient for non-critical path)
    this.conversionCircuitBreaker = createCircuitBreaker<[string], undefined>(
      'prompt-service-conversion',
      this.recordConversionInternal.bind(this),
      {
        timeout: config.circuitBreakerTimeout,
        errorThresholdPercentage: 75,
        resetTimeout: config.circuitBreakerResetTimeout,
      }
    );

    // Create circuit breaker for health checks
    this.healthCircuitBreaker = createCircuitBreaker<[], boolean>(
      'prompt-service-health',
      this.healthCheckInternal.bind(this),
      {
        timeout: config.circuitBreakerTimeout,
        errorThresholdPercentage: config.circuitBreakerErrorThreshold,
        resetTimeout: config.circuitBreakerResetTimeout,
      }
    );

    // Initialize background refresh manager with callbacks
    this.refreshManager = new BackgroundRefreshManager<PromptRefreshTaskId>(
      {
        execute: async (task: BackgroundTask<PromptRefreshTaskId>) => {
          const result = await this.resolveInternal(task.id.key, task.id.thinkingEnabled);
          promptCacheService.set(task.id.key, task.id.thinkingEnabled, result.config, result.variantId);
        },
        markInProgress: (task: BackgroundTask<PromptRefreshTaskId>) =>
          promptCacheService.markRefreshInProgress(task.id.key, task.id.thinkingEnabled),
        clearInProgress: (task: BackgroundTask<PromptRefreshTaskId>) =>
          promptCacheService.clearRefreshInProgress(task.id.key, task.id.thinkingEnabled),
        shouldHalt: () => this.circuitBreaker.opened,
        onSuccess: (task: BackgroundTask<PromptRefreshTaskId>) => {
          logger.info(
            { key: task.id.key, thinkingEnabled: task.id.thinkingEnabled },
            'Background cache refresh successful'
          );
        },
        onFailure: (task: BackgroundTask<PromptRefreshTaskId>, attempts: number) => {
          logger.warn(
            { key: task.id.key, thinkingEnabled: task.id.thinkingEnabled, attempts },
            'Background refresh failed after max attempts'
          );
        },
        onTimeout: (task: BackgroundTask<PromptRefreshTaskId>, durationMs: number) => {
          logger.warn(
            { key: task.id.key, thinkingEnabled: task.id.thinkingEnabled, durationMs },
            'Background refresh cancelled - overall timeout exceeded'
          );
        },
        onDropped: (task: BackgroundTask<PromptRefreshTaskId>) => {
          logger.warn(
            { key: task.id.key, thinkingEnabled: task.id.thinkingEnabled },
            'Background refresh queue full - dropping oldest task'
          );
        },
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve prompt';
      logger.error({ key, thinkingEnabled, error: errorMessage }, 'Prompt resolution failed');

      // Return stale cached data if available instead of throwing
      if (cached) {
        this.scheduleBackgroundRefresh(key, thinkingEnabled);
        logger.warn({ key, thinkingEnabled }, 'Returning stale cached prompt');
        return {
          config: cached.config,
          ...(cached.variantId !== undefined && { variantId: cached.variantId }),
        };
      }

      // Only throw if no cached data available
      throw new PromptServiceUnavailableError(errorMessage);
    }
  }

  /**
   * Internal method that makes the actual HTTP call
   * This is wrapped by the circuit breaker
   */
  private async resolveInternal(key: string, thinkingEnabled: boolean): Promise<ResolvePromptResponse> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/api/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, thinkingEnabled }),
        timeoutMs: REQUEST_TIMEOUT_MS,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        // Use centralized error handling to prevent information disclosure
        const { clientMessage, internalLog } = createClientError(
          response.status,
          errorText,
          'prompt-resolve'
        );
        logger.error({ ...internalLog, key, thinkingEnabled }, 'Prompt resolution HTTP error');
        throw new Error(clientMessage);
      }

      const data = await response.json() as ResolvePromptResponse;

      logger.debug(
        { key, thinkingEnabled, abTestId: data.abTestId, variantId: data.variantId },
        'Prompt resolved from prompt-service'
      );

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Prompt service request timed out');
      }

      throw error;
    }
  }

  /**
   * Schedules a background refresh for a cached prompt
   * Delegates to BackgroundRefreshManager for queue management and retry logic
   */
  private scheduleBackgroundRefresh(key: string, thinkingEnabled: boolean): void {
    this.refreshManager.schedule({ id: { key, thinkingEnabled } });
  }

  /**
   * Refreshes all commonly used prompt configurations
   * Called when circuit breaker closes (service recovers)
   */
  private refreshAllCachedPrompts(): void {
    logger.info('Service recovered - refreshing prompt cache');

    for (const { key, thinkingEnabled } of PROMPTS_TO_CACHE_ON_RECOVERY) {
      this.scheduleBackgroundRefresh(key, thinkingEnabled);
    }
  }

  /**
   * Internal method that makes the actual HTTP call for conversion recording
   * This is wrapped by the circuit breaker
   */
  private async recordConversionInternal(variantId: string): Promise<undefined> {
    const response = await fetchWithTimeout(`${this.baseUrl}/api/resolve/${variantId}/conversion`, {
      method: 'POST',
      timeoutMs: REQUEST_TIMEOUT_MS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    logger.debug({ variantId }, 'A/B test conversion recorded');
    return undefined;
  }

  /**
   * Records a conversion for A/B testing analytics
   * Uses circuit breaker protection to prevent cascading failures
   * @param variantId - The variant ID to record the conversion for
   */
  async recordConversion(variantId: string): Promise<void> {
    try {
      await this.conversionCircuitBreaker.fire(variantId);
    } catch (error) {
      // Don't fail the main operation if conversion recording fails
      logger.warn(
        { variantId, error: error instanceof Error ? error.message : 'Unknown error' },
        'Error recording A/B test conversion'
      );
    }
  }

  /**
   * Internal method that makes the actual HTTP call for health check
   * This is wrapped by the circuit breaker
   */
  private async healthCheckInternal(): Promise<boolean> {
    const response = await fetchWithTimeout(`${this.baseUrl}/health`, {
      timeoutMs: REQUEST_TIMEOUT_MS,
    });

    return response.ok;
  }

  /**
   * Checks if the prompt service is healthy
   * Uses circuit breaker protection to prevent cascading failures
   * @returns true if the service is reachable and healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.healthCircuitBreaker.fire();
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
