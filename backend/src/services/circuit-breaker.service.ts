/**
 * @file services/circuit-breaker.service.ts
 * @purpose Generic circuit breaker wrapper using opossum library
 * @functionality
 * - Wraps async functions with circuit breaker protection
 * - Configurable failure threshold, timeout, and recovery settings
 * - Emits events for monitoring and logging
 * - Prevents cascading failures in distributed systems
 * @dependencies
 * - opossum for circuit breaker implementation
 * - @/utils/logger for logging circuit state changes
 */

import CircuitBreaker from 'opossum';
import { logger } from '@/utils';

// Registry to track circuit breakers for cleanup during shutdown
const circuitBreakerRegistry = new Map<string, CircuitBreaker>();

export interface CircuitBreakerConfig {
  /** Request timeout in milliseconds (default: 5000) */
  timeout: number;
  /** Percentage of failures to open circuit (default: 50) */
  errorThresholdPercentage: number;
  /** Time in ms before trying again after circuit opens (default: 30000) */
  resetTimeout: number;
  /** Minimum requests before calculating error percentage (default: 5) */
  volumeThreshold: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

/**
 * Creates a circuit breaker wrapper around an async function
 * @param name - Identifier for the circuit breaker (used in logs)
 * @param fn - The async function to wrap
 * @param config - Optional configuration overrides
 * @returns CircuitBreaker instance
 */
export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  config: Partial<CircuitBreakerConfig> = {}
): CircuitBreaker<TArgs, TResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const breaker = new CircuitBreaker(fn, {
    timeout: mergedConfig.timeout,
    errorThresholdPercentage: mergedConfig.errorThresholdPercentage,
    resetTimeout: mergedConfig.resetTimeout,
    volumeThreshold: mergedConfig.volumeThreshold,
    name,
  });

  // Log circuit state changes
  breaker.on('open', () => {
    logger.warn({ circuit: name }, 'Circuit breaker OPEN - failing fast');
  });

  breaker.on('halfOpen', () => {
    logger.info({ circuit: name }, 'Circuit breaker HALF-OPEN - testing connection');
  });

  breaker.on('close', () => {
    logger.info({ circuit: name }, 'Circuit breaker CLOSED - service recovered');
  });

  breaker.on('timeout', () => {
    logger.warn({ circuit: name }, 'Circuit breaker request timeout');
  });

  breaker.on('reject', () => {
    logger.debug({ circuit: name }, 'Circuit breaker rejected request (circuit open)');
  });

  // Register circuit breaker for cleanup
  circuitBreakerRegistry.set(name, breaker);

  return breaker;
}

/**
 * Type guard to check if circuit breaker is open
 */
export function isCircuitOpen<TArgs extends unknown[], TResult>(
  breaker: CircuitBreaker<TArgs, TResult>
): boolean {
  return breaker.opened;
}

/**
 * Destroys a specific circuit breaker and removes event listeners
 * @param name - The name of the circuit breaker to destroy
 */
export function destroyCircuitBreaker(name: string): void {
  const breaker = circuitBreakerRegistry.get(name);
  if (breaker) {
    breaker.removeAllListeners();
    circuitBreakerRegistry.delete(name);
    logger.debug({ circuit: name }, 'Circuit breaker destroyed');
  }
}

/**
 * Destroys all circuit breakers and removes event listeners
 * Call during graceful shutdown to prevent memory leaks
 */
export function destroyAllCircuitBreakers(): void {
  for (const [name, breaker] of circuitBreakerRegistry) {
    breaker.removeAllListeners();
    logger.debug({ circuit: name }, 'Circuit breaker destroyed');
  }
  circuitBreakerRegistry.clear();
}
