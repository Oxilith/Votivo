/**
 * @file health/index.ts
 * @purpose Health module exports
 * @functionality
 * - Exports health types
 * - Exports health service singleton
 * - Exports health check factories
 * @dependencies
 * - @/health/types
 * - @/health/health-service
 * - @/health/checks/anthropic.check
 * - @/health/checks/prompt-service.check
 * - @/health/checks/prompt-cache.check
 */

export type {
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  HealthCheck,
} from './types';

export { HealthService, healthService } from './health-service';
export { createAnthropicCheck } from './checks/anthropic.check';
export { createPromptServiceCheck } from './checks/prompt-service.check';
export { createPromptCacheCheck } from './checks/prompt-cache.check';
