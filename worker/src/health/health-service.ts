/**
 * @file worker/src/health/health-service.ts
 * @purpose Core health check service for worker microservice
 * @functionality
 * - Registers health check functions with critical/non-critical classification
 * - Evaluates all registered checks with configurable timeout
 * - Aggregates results into overall health status
 * - Tracks latency for each health check
 * @dependencies
 * - @/health/types (HealthCheck, HealthCheckResult, HealthStatus, ComponentHealth)
 */

import type {
  HealthCheck,
  HealthCheckResult,
  HealthStatus,
  ComponentHealth,
} from './types';

const DEFAULT_TIMEOUT_MS = 5000;
const VERSION = process.env.npm_package_version ?? '1.0.0';

export class HealthService {
  private checks: HealthCheck[] = [];
  private readonly startTime = Date.now();

  register(check: HealthCheck): void {
    this.checks.push(check);
  }

  async evaluate(): Promise<HealthCheckResult> {
    const checkResults: {
      name: string;
      critical: boolean;
      result: ComponentHealth;
    }[] = [];

    // Process all checks
    for (const check of this.checks) {
      const result = await this.executeWithTimeout(check.check, DEFAULT_TIMEOUT_MS);
      checkResults.push({
        name: check.name,
        critical: check.critical,
        result,
      });
    }

    const checks: Record<string, ComponentHealth> = {};
    let hasCriticalFailure = false;
    let hasDegradation = false;

    for (const { name, critical, result } of checkResults) {
      checks[name] = result;

      if (result.status === 'unhealthy' && critical) {
        hasCriticalFailure = true;
      } else if (result.status !== 'healthy') {
        hasDegradation = true;
      }
    }

    const status: HealthStatus = hasCriticalFailure
      ? 'unhealthy'
      : hasDegradation
        ? 'degraded'
        : 'healthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: VERSION,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  private async executeWithTimeout(
    fn: () => Promise<ComponentHealth>,
    timeoutMs: number
  ): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Health check timeout'));
          }, timeoutMs);
        }),
      ]);
      return { ...result, latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
export const healthService = new HealthService();
