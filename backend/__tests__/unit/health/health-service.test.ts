/**
 * @file health/__tests__/health-service.test.ts
 * @purpose Unit tests for HealthService core functionality
 * @functionality
 * - Tests check registration
 * - Tests runOnce check execution and caching
 * - Tests health evaluation with various check states
 * - Tests timeout handling
 * - Tests status aggregation logic
 * @dependencies
 * - vitest for testing framework
 * - HealthService class under test
 */

import { HealthService } from '@/health';
import type { HealthCheck } from '@/health';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('register', () => {
    it('should register a health check', async () => {
      const check: HealthCheck = {
        name: 'test-check',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: false,
        runOnce: false,
      };

      service.register(check);

      const result = await service.evaluate();
      expect(result.checks['test-check']).toBeDefined();
    });

    it('should register multiple health checks', async () => {
      const check1: HealthCheck = {
        name: 'check-1',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: false,
        runOnce: false,
      };

      const check2: HealthCheck = {
        name: 'check-2',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: true,
        runOnce: false,
      };

      service.register(check1);
      service.register(check2);

      const result = await service.evaluate();
      expect(result.checks['check-1']).toBeDefined();
      expect(result.checks['check-2']).toBeDefined();
    });
  });

  describe('runStartupChecks', () => {
    it('should execute runOnce checks only', async () => {
      const runOnceCheck = vi.fn().mockResolvedValue({ status: 'healthy', message: 'OK' });
      const liveCheck = vi.fn().mockResolvedValue({ status: 'healthy', message: 'OK' });

      service.register({
        name: 'startup-check',
        check: runOnceCheck,
        critical: true,
        runOnce: true,
      });

      service.register({
        name: 'live-check',
        check: liveCheck,
        critical: false,
        runOnce: false,
      });

      await service.runStartupChecks();

      expect(runOnceCheck).toHaveBeenCalledTimes(1);
      expect(liveCheck).not.toHaveBeenCalled();
    });

    it('should cache runOnce check results', async () => {
      const checkFn = vi.fn().mockResolvedValue({ status: 'healthy', message: 'OK' });

      service.register({
        name: 'startup-check',
        check: checkFn,
        critical: true,
        runOnce: true,
      });

      await service.runStartupChecks();
      await service.evaluate();
      await service.evaluate();

      // Check should only be called once during startup, not during evaluations
      expect(checkFn).toHaveBeenCalledTimes(1);
    });

    it('should return success: true when all critical checks pass', async () => {
      service.register({
        name: 'critical-check',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: true,
        runOnce: true,
      });

      const result = await service.runStartupChecks();
      expect(result.success).toBe(true);
    });

    it('should return success: false when any critical check fails', async () => {
      service.register({
        name: 'critical-check',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: true,
        runOnce: true,
      });

      const result = await service.runStartupChecks();
      expect(result.success).toBe(false);
    });

    it('should return success: true when non-critical check fails', async () => {
      service.register({
        name: 'non-critical-check',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: false,
        runOnce: true,
      });

      const result = await service.runStartupChecks();
      expect(result.success).toBe(true);
    });

    it('should include all check results in the response', async () => {
      service.register({
        name: 'check-1',
        check: async () => ({ status: 'healthy', message: 'OK 1' }),
        critical: true,
        runOnce: true,
      });

      service.register({
        name: 'check-2',
        check: async () => ({ status: 'healthy', message: 'OK 2' }),
        critical: false,
        runOnce: true,
      });

      const result = await service.runStartupChecks();
      expect(result.results['check-1']?.message).toBe('OK 1');
      expect(result.results['check-2']?.message).toBe('OK 2');
    });
  });

  describe('evaluate', () => {
    it('should return healthy status when all checks pass', async () => {
      service.register({
        name: 'check-1',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: true,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy status when critical check fails', async () => {
      service.register({
        name: 'critical-check',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: true,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.status).toBe('unhealthy');
    });

    it('should return degraded status when non-critical check fails', async () => {
      service.register({
        name: 'non-critical-check',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.status).toBe('degraded');
    });

    it('should return degraded status for non-healthy non-critical checks', async () => {
      service.register({
        name: 'degraded-check',
        check: async () => ({ status: 'degraded', message: 'Degraded' }),
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.status).toBe('degraded');
    });

    it('should use cached results for runOnce checks', async () => {
      const checkFn = vi.fn().mockResolvedValue({ status: 'healthy', message: 'OK' });

      service.register({
        name: 'startup-check',
        check: checkFn,
        critical: true,
        runOnce: true,
      });

      // Run startup checks first to populate cache
      await service.runStartupChecks();

      // Reset the mock to verify it's not called again
      checkFn.mockClear();

      const result = await service.evaluate();
      expect(checkFn).not.toHaveBeenCalled();
      expect(result.checks['startup-check']?.status).toBe('healthy');
    });

    it('should return unhealthy for runOnce checks not executed at startup', async () => {
      service.register({
        name: 'startup-check',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: true,
        runOnce: true,
      });

      // Don't run startup checks
      const result = await service.evaluate();
      expect(result.checks['startup-check']?.status).toBe('unhealthy');
      expect(result.checks['startup-check']?.message).toBe('Startup check was not executed');
    });

    it('should include version in result', async () => {
      const result = await service.evaluate();
      expect(result.version).toBeDefined();
    });

    it('should include uptime in result', async () => {
      const result = await service.evaluate();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp in result', async () => {
      const result = await service.evaluate();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('should include latency measurements', async () => {
      service.register({
        name: 'test-check',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.checks['test-check']?.latencyMs).toBeDefined();
      expect(typeof result.checks['test-check']?.latencyMs).toBe('number');
    });
  });

  describe('executeWithTimeout', () => {
    it('should return result for successful check', async () => {
      service.register({
        name: 'fast-check',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.checks['fast-check']?.status).toBe('healthy');
    });

    it('should timeout slow checks', async () => {
      service.register({
        name: 'slow-check',
        check: () => new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'healthy', message: 'OK' }), 10000);
        }),
        critical: false,
        runOnce: false,
      });

      const resultPromise = service.evaluate();

      // Advance past the 5000ms default timeout
      await vi.advanceTimersByTimeAsync(6000);

      const result = await resultPromise;
      expect(result.checks['slow-check']?.status).toBe('unhealthy');
      expect(result.checks['slow-check']?.message).toBe('Health check timeout');
    });

    it('should catch exceptions from health checks', async () => {
      service.register({
        name: 'throwing-check',
        check: async () => {
          throw new Error('Check exploded');
        },
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.checks['throwing-check']?.status).toBe('unhealthy');
      expect(result.checks['throwing-check']?.message).toBe('Check exploded');
    });

    it('should handle non-Error exceptions', async () => {
      service.register({
        name: 'weird-throw-check',
        check: async () => {
          throw 'not an error object';
        },
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.checks['weird-throw-check']?.status).toBe('unhealthy');
      expect(result.checks['weird-throw-check']?.message).toBe('Unknown error');
    });
  });

  describe('status aggregation', () => {
    it('should prioritize unhealthy over degraded', async () => {
      service.register({
        name: 'critical-fail',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: true,
        runOnce: false,
      });

      service.register({
        name: 'non-critical-fail',
        check: async () => ({ status: 'unhealthy', message: 'Failed' }),
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.status).toBe('unhealthy');
    });

    it('should return healthy when all checks pass', async () => {
      service.register({
        name: 'check-1',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: true,
        runOnce: false,
      });

      service.register({
        name: 'check-2',
        check: async () => ({ status: 'healthy', message: 'OK' }),
        critical: false,
        runOnce: false,
      });

      const result = await service.evaluate();
      expect(result.status).toBe('healthy');
    });
  });
});
