/**
 * @file health/health-service.ts
 * @purpose Core health check service for managing and evaluating health checks
 * @functionality
 * - Registers health check functions with critical/non-critical classification
 * - Supports runOnce checks that execute at startup and cache results
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
const VERSION = process.env['npm_package_version'] ?? '1.0.0';

export class HealthService {
  private checks: HealthCheck[] = [];
  private cachedResults: Map<string, ComponentHealth> = new Map();
  private readonly startTime = Date.now();

  register(check: HealthCheck): void {
    this.checks.push(check);
  }

  /**
   * Run all startup (runOnce) checks and cache their results.
   * Returns true if all critical checks pass.
   */
  async runStartupChecks(): Promise<{
    success: boolean;
    results: Record<string, ComponentHealth>;
  }> {
    const startupChecks = this.checks.filter((c) => c.runOnce);
    const results: Record<string, ComponentHealth> = {};
    let allCriticalPassed = true;

    for (const check of startupChecks) {
      const result = await this.executeWithTimeout(check.check, DEFAULT_TIMEOUT_MS);
      this.cachedResults.set(check.name, result);
      results[check.name] = result;

      if (result.status === 'unhealthy' && check.critical) {
        allCriticalPassed = false;
      }
    }

    return { success: allCriticalPassed, results };
  }

  async evaluate(): Promise<HealthCheckResult> {
    const checkResults: Array<{
      name: string;
      critical: boolean;
      result: ComponentHealth;
    }> = [];

    // Process all checks
    for (const check of this.checks) {
      let result: ComponentHealth;

      if (check.runOnce) {
        // Use cached result for runOnce checks
        const cached = this.cachedResults.get(check.name);
        result = cached ?? {
          status: 'unhealthy',
          message: 'Startup check was not executed',
        };
      } else {
        // Run live check
        result = await this.executeWithTimeout(check.check, DEFAULT_TIMEOUT_MS);
      }

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
