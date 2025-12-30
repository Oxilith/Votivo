/**
 * @file health/index.ts
 * @purpose Health module exports
 * @functionality
 * - Exports health types
 * - Exports health service singleton
 * - Exports health check factories
 * @dependencies
 * - ./types
 * - ./health-service
 * - ./checks (barrel)
 */

export type {
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  HealthCheck,
} from './types';

export { HealthService, healthService } from './health-service';
export { createAnthropicCheck, createPromptServiceCheck, createPromptCacheCheck } from './checks';
