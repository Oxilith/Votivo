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
 */

export type {
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  HealthCheck,
} from './types.js';

export { HealthService, healthService } from './health-service.js';
export { createAnthropicCheck } from './checks/anthropic.check.js';
export { createPromptServiceCheck } from './checks/prompt-service.check.js';
