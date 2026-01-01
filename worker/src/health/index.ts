/**
 * @file worker/src/health/index.ts
 * @purpose Health module exports for worker microservice
 * @functionality
 * - Exports health types
 * - Exports health service singleton
 * - Exports health check factories
 * - Exports health server functions
 * @dependencies
 * - ./types
 * - ./health-service
 * - ./health-server
 * - ./checks (barrel)
 */

export type {
  HealthStatus,
  ComponentHealth,
  HealthCheckResult,
  HealthCheck,
} from './types';

export { HealthService, healthService } from './health-service';
export { startHealthServer, stopHealthServer } from './health-server';
export { createDatabaseCheck, createSchedulerCheck } from './checks';
