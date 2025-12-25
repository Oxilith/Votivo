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
 * - @/services/circuit-breaker.service for circuit breaker wrapper
 * - @/services/prompt-cache.service for in-memory caching
 * - shared/prompt.types for PromptConfig type
 */

import type CircuitBreaker from 'opossum';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { createClientError } from '@/utils/error-sanitizer.js';
import { createCircuitBreaker } from '@/services/circuit-breaker.service.js';
import { promptCacheService } from '@/services/prompt-cache.service.js';
import type { PromptConfig } from 'shared/index.js';

const REQUEST_TIMEOUT_MS = 5000;
const MAX_BACKGROUND_RETRY_ATTEMPTS = 5;
const MAX_CONCURRENT_REFRESHES = 3;
const MAX_REFRESH_DURATION_MS = 60000;
const MAX_RETRY_DELAY_MS = 10000;
const MAX_PENDING_REFRESH_QUEUE_SIZE = 100;

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

interface RefreshTask {
  key: string;
  thinkingEnabled: boolean;
}

export class PromptClientService {
  private readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker<[string, boolean], ResolvePromptResponse>;
  private readonly conversionCircuitBreaker: CircuitBreaker<[string], undefined>;
  private readonly healthCircuitBreaker: CircuitBreaker<[], boolean>;
  private activeRefreshCount = 0;
  private readonly pendingRefreshQueue: RefreshTask[] = [];

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/api/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, thinkingEnabled }),
        signal: controller.signal,
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
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Schedules a background refresh for a cached prompt
   * Limits concurrent refreshes to prevent memory leaks from spawning too many retries
   */
  private scheduleBackgroundRefresh(key: string, thinkingEnabled: boolean): void {
    // Prevent duplicate refresh operations
    if (!promptCacheService.markRefreshInProgress(key, thinkingEnabled)) {
      return;
    }

    // Check if we can start immediately or need to queue
    if (this.activeRefreshCount < MAX_CONCURRENT_REFRESHES) {
      void this.executeRefresh(key, thinkingEnabled);
    } else {
      // Queue for later processing, with size limit to prevent memory issues
      if (this.pendingRefreshQueue.length >= MAX_PENDING_REFRESH_QUEUE_SIZE) {
        logger.warn(
          { key, thinkingEnabled, queueLength: this.pendingRefreshQueue.length },
          'Background refresh queue full - dropping oldest task'
        );
        this.pendingRefreshQueue.shift(); // Remove oldest
      }
      this.pendingRefreshQueue.push({ key, thinkingEnabled });
      logger.debug(
        { key, thinkingEnabled, queueLength: this.pendingRefreshQueue.length },
        'Background refresh queued - max concurrent refreshes reached'
      );
    }
  }

  /**
   * Executes a background refresh with retry logic and overall timeout
   */
  private async executeRefresh(key: string, thinkingEnabled: boolean): Promise<void> {
    // Defensive check: ensure we're within limits even if called unexpectedly
    // This guards against edge cases in async execution
    if (this.activeRefreshCount >= MAX_CONCURRENT_REFRESHES) {
      this.pendingRefreshQueue.push({ key, thinkingEnabled });
      logger.debug(
        { key, thinkingEnabled },
        'Background refresh re-queued - defensive limit check triggered'
      );
      return;
    }

    this.activeRefreshCount++;
    const startTime = Date.now();

    try {
      await this.retryRefresh(key, thinkingEnabled, 0, startTime);
    } finally {
      this.completeRefresh(key, thinkingEnabled);
    }
  }

  /**
   * Recursive retry logic with exponential backoff and overall timeout
   */
  private async retryRefresh(
    key: string,
    thinkingEnabled: boolean,
    attempt: number,
    startTime: number
  ): Promise<void> {
    // Check overall timeout first
    if (Date.now() - startTime > MAX_REFRESH_DURATION_MS) {
      logger.warn(
        { key, thinkingEnabled, durationMs: Date.now() - startTime },
        'Background refresh cancelled - overall timeout exceeded'
      );
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s (capped at 10s for faster recovery)
    const delay = Math.min(1000 * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
    await new Promise((r) => setTimeout(r, delay));

    // If circuit is still open, stop retrying
    if (this.circuitBreaker.opened) {
      logger.debug({ key, thinkingEnabled }, 'Background refresh cancelled - circuit still open');
      return;
    }

    try {
      const result = await this.resolveInternal(key, thinkingEnabled);
      promptCacheService.set(key, thinkingEnabled, result.config, result.variantId);
      logger.info({ key, thinkingEnabled }, 'Background cache refresh successful');
    } catch {
      if (attempt < MAX_BACKGROUND_RETRY_ATTEMPTS) {
        await this.retryRefresh(key, thinkingEnabled, attempt + 1, startTime);
      } else {
        logger.warn(
          { key, thinkingEnabled, attempts: attempt + 1 },
          'Background refresh failed after max attempts'
        );
      }
    }
  }

  /**
   * Completes a refresh operation and processes the next queued task
   */
  private completeRefresh(key: string, thinkingEnabled: boolean): void {
    this.activeRefreshCount--;
    promptCacheService.clearRefreshInProgress(key, thinkingEnabled);

    // Process next queued task if any
    this.processQueue();
  }

  /**
   * Processes the next task in the refresh queue
   * Uses setImmediate for recursive calls to prevent stack overflow under high load
   */
  private processQueue(): void {
    if (this.pendingRefreshQueue.length === 0) {
      return;
    }

    if (this.activeRefreshCount < MAX_CONCURRENT_REFRESHES) {
      const nextTask = this.pendingRefreshQueue.shift();
      if (nextTask) {
        // Re-check if refresh is still needed (might have been completed by another path)
        if (promptCacheService.markRefreshInProgress(nextTask.key, nextTask.thinkingEnabled)) {
          void this.executeRefresh(nextTask.key, nextTask.thinkingEnabled);
        } else {
          // Task no longer needed, process next using setImmediate to prevent stack overflow
          setImmediate(() => { this.processQueue(); });
        }
      }
    }
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/api/resolve/${variantId}/conversion`, {
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      logger.debug({ variantId }, 'A/B test conversion recorded');
      return undefined;
    } finally {
      clearTimeout(timeoutId);
    }
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      return response.ok;
    } finally {
      clearTimeout(timeoutId);
    }
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
