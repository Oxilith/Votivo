/**
 * @file worker/src/health/types.ts
 * @purpose Type definitions for the worker health check system
 * @functionality
 * - Defines HealthStatus union type for check outcomes
 * - Defines ComponentHealth interface for individual check results
 * - Defines HealthCheckResult interface for aggregated health response
 * - Defines HealthCheck interface for registerable health checks
 * @dependencies
 * - None (pure TypeScript types)
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  checks: Record<string, ComponentHealth>;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<ComponentHealth>;
  critical: boolean;
}
