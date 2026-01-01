/**
 * @file worker/__tests__/unit/health/health-service.test.ts
 * @purpose Unit tests for HealthService
 * @functionality
 * - Tests health check registration
 * - Tests health evaluation with multiple checks
 * - Tests critical vs non-critical status aggregation
 * - Tests timeout handling
 * - Tests healthy/degraded/unhealthy status determination
 * @dependencies
 * - vitest globals
 * - @/health (HealthService, HealthCheck, ComponentHealth)
 */

import { HealthService } from '@/health';
import type { HealthCheck } from '@/health';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  describe('register', () => {
    it('should register a health check', async () => {
      const check: HealthCheck = {
        name: 'test-check',
        check: async () => ({ status: 'healthy' }),
        critical: false,
      };

      service.register(check);

      const result = await service.evaluate();
      expect(result.checks['test-check']).toBeDefined();
    });

    it('should register multiple health checks', async () => {
      const check1: HealthCheck = {
        name: 'check-1',
        check: async () => ({ status: 'healthy' }),
        critical: false,
      };
      const check2: HealthCheck = {
        name: 'check-2',
        check: async () => ({ status: 'healthy' }),
        critical: false,
      };

      service.register(check1);
      service.register(check2);

      const result = await service.evaluate();
      expect(result.checks['check-1']).toBeDefined();
      expect(result.checks['check-2']).toBeDefined();
    });
  });

  describe('evaluate', () => {
    it('should return healthy status when all checks pass', async () => {
      service.register({
        name: 'healthy-check',
        check: async () => ({ status: 'healthy', message: 'All good' }),
        critical: true,
      });

      const result = await service.evaluate();

      expect(result.status).toBe('healthy');
      expect(result.checks['healthy-check'].status).toBe('healthy');
    });

    it('should return unhealthy status when critical check fails', async () => {
      service.register({
        name: 'critical-check',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: true,
      });

      const result = await service.evaluate();

      expect(result.status).toBe('unhealthy');
    });

    it('should return degraded status when non-critical check fails', async () => {
      service.register({
        name: 'non-critical-check',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: false,
      });

      const result = await service.evaluate();

      expect(result.status).toBe('degraded');
    });

    it('should return degraded when check returns degraded status', async () => {
      service.register({
        name: 'degraded-check',
        check: async () => ({ status: 'degraded', message: 'Slow' }),
        critical: false,
      });

      const result = await service.evaluate();

      expect(result.status).toBe('degraded');
    });

    it('should prioritize unhealthy over degraded', async () => {
      service.register({
        name: 'critical-fail',
        check: async () => ({ status: 'unhealthy' }),
        critical: true,
      });
      service.register({
        name: 'degraded',
        check: async () => ({ status: 'degraded' }),
        critical: false,
      });

      const result = await service.evaluate();

      expect(result.status).toBe('unhealthy');
    });

    it('should include timestamp in result', async () => {
      const beforeTime = new Date().toISOString();

      const result = await service.evaluate();

      const afterTime = new Date().toISOString();
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= beforeTime).toBe(true);
      expect(result.timestamp <= afterTime).toBe(true);
    });

    it('should include version in result', async () => {
      const result = await service.evaluate();

      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe('string');
    });

    it('should include uptime in result', async () => {
      const result = await service.evaluate();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track latency for each check', async () => {
      service.register({
        name: 'slow-check',
        check: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { status: 'healthy' };
        },
        critical: false,
      });

      const result = await service.evaluate();

      expect(result.checks['slow-check'].latencyMs).toBeDefined();
      expect(result.checks['slow-check'].latencyMs).toBeGreaterThanOrEqual(10);
    });
  });

  describe('timeout handling', () => {
    it('should return unhealthy for timed out check', async () => {
      service.register({
        name: 'timeout-check',
        check: async () => {
          // Wait longer than timeout (default 5000ms)
          await new Promise((resolve) => setTimeout(resolve, 6000));
          return { status: 'healthy' };
        },
        critical: true,
      });

      const result = await service.evaluate();

      expect(result.checks['timeout-check'].status).toBe('unhealthy');
      expect(result.checks['timeout-check'].message).toContain('timeout');
    }, 10000);

    it('should handle check that throws error', async () => {
      service.register({
        name: 'error-check',
        check: async () => {
          throw new Error('Check failed');
        },
        critical: true,
      });

      const result = await service.evaluate();

      expect(result.checks['error-check'].status).toBe('unhealthy');
      expect(result.checks['error-check'].message).toBe('Check failed');
    });
  });

  describe('mixed checks', () => {
    it('should handle mix of healthy and unhealthy checks', async () => {
      service.register({
        name: 'healthy-1',
        check: async () => ({ status: 'healthy' }),
        critical: true,
      });
      service.register({
        name: 'healthy-2',
        check: async () => ({ status: 'healthy' }),
        critical: false,
      });
      service.register({
        name: 'unhealthy-non-critical',
        check: async () => ({ status: 'unhealthy' }),
        critical: false,
      });

      const result = await service.evaluate();

      expect(result.status).toBe('degraded');
      expect(result.checks['healthy-1'].status).toBe('healthy');
      expect(result.checks['healthy-2'].status).toBe('healthy');
      expect(result.checks['unhealthy-non-critical'].status).toBe('unhealthy');
    });

    it('should return healthy with no registered checks', async () => {
      const result = await service.evaluate();

      expect(result.status).toBe('healthy');
      expect(Object.keys(result.checks)).toHaveLength(0);
    });
  });
});
