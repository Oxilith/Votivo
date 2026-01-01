/**
 * @file backend/__tests__/unit/services/circuit-breaker.service.test.ts
 * @purpose Unit tests for circuit breaker service wrapper
 * @functionality
 * - Tests circuit breaker creation with default and custom configs
 * - Tests isCircuitOpen state checking
 * - Tests cleanup functions (destroyCircuitBreaker, destroyAllCircuitBreakers)
 * - Tests circuit state transitions (closed, open, half-open)
 * @dependencies
 * - vitest
 * - @/services/circuit-breaker.service
 */

import {
  createCircuitBreaker,
  isCircuitOpen,
  destroyCircuitBreaker,
  destroyAllCircuitBreakers,
} from '@/services/circuit-breaker.service';

// Mock the logger
vi.mock('@/utils', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('circuit-breaker.service', () => {
  afterEach(() => {
    // Clean up all circuit breakers after each test
    destroyAllCircuitBreakers();
    vi.clearAllMocks();
  });

  describe('createCircuitBreaker', () => {
    it('should create a circuit breaker with default config', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-default', mockFn);

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('test-default');
    });

    it('should create a circuit breaker with custom config', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-custom', mockFn, {
        timeout: 10000,
        errorThresholdPercentage: 75,
        resetTimeout: 60000,
        volumeThreshold: 10,
      });

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('test-custom');
    });

    it('should execute wrapped function successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const breaker = createCircuitBreaker('test-exec', mockFn);

      const result = await breaker.fire();

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should pass arguments to wrapped function', async () => {
      const mockFn = vi.fn().mockImplementation((a: number, b: string) => Promise.resolve(`${a}-${b}`));
      const breaker = createCircuitBreaker('test-args', mockFn);

      const result = await breaker.fire(42, 'hello');

      expect(result).toBe('42-hello');
      expect(mockFn).toHaveBeenCalledWith(42, 'hello');
    });

    it('should propagate errors from wrapped function', async () => {
      const error = new Error('Test error');
      const mockFn = vi.fn().mockRejectedValue(error);
      const breaker = createCircuitBreaker('test-error', mockFn, {
        volumeThreshold: 1, // Low threshold to trigger faster
      });

      await expect(breaker.fire()).rejects.toThrow('Test error');
    });
  });

  describe('isCircuitOpen', () => {
    it('should return false for closed circuit', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-closed', mockFn);

      expect(isCircuitOpen(breaker)).toBe(false);
    });

    it('should return true when circuit is opened manually', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-open', mockFn);

      // Force the circuit to open
      breaker.open();

      expect(isCircuitOpen(breaker)).toBe(true);
    });
  });

  describe('destroyCircuitBreaker', () => {
    it('should remove specific circuit breaker', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      createCircuitBreaker('test-destroy-1', mockFn);
      createCircuitBreaker('test-destroy-2', mockFn);

      destroyCircuitBreaker('test-destroy-1');

      // Can still create a new one with the same name (proves it was removed)
      const newBreaker = createCircuitBreaker('test-destroy-1', mockFn);
      expect(newBreaker).toBeDefined();
    });

    it('should handle non-existent circuit breaker gracefully', () => {
      // Should not throw
      expect(() => {
        destroyCircuitBreaker('non-existent');
      }).not.toThrow();
    });
  });

  describe('destroyAllCircuitBreakers', () => {
    it('should remove all circuit breakers', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      createCircuitBreaker('test-all-1', mockFn);
      createCircuitBreaker('test-all-2', mockFn);
      createCircuitBreaker('test-all-3', mockFn);

      destroyAllCircuitBreakers();

      // Can create new ones with same names (proves they were removed)
      const newBreaker1 = createCircuitBreaker('test-all-1', mockFn);
      const newBreaker2 = createCircuitBreaker('test-all-2', mockFn);
      expect(newBreaker1).toBeDefined();
      expect(newBreaker2).toBeDefined();
    });

    it('should handle empty registry gracefully', () => {
      // Ensure registry is empty first
      destroyAllCircuitBreakers();

      // Should not throw
      expect(() => {
        destroyAllCircuitBreakers();
      }).not.toThrow();
    });
  });

  describe('circuit state transitions', () => {
    it('should start in closed state', () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-state-init', mockFn);

      expect(breaker.closed).toBe(true);
      expect(breaker.opened).toBe(false);
      expect(breaker.halfOpen).toBe(false);
    });

    it('should transition to half-open after reset timeout', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-half-open', mockFn, {
        resetTimeout: 50, // Very short timeout for testing
      });

      // Force open
      breaker.open();
      expect(breaker.opened).toBe(true);

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      // After reset timeout, circuit should be half-open
      expect(breaker.halfOpen).toBe(true);
    });

    it('should close circuit after successful request in half-open state', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker('test-close-after-success', mockFn, {
        resetTimeout: 50,
      });

      // Force open
      breaker.open();

      // Wait for half-open
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(breaker.halfOpen).toBe(true);

      // Make successful request
      await breaker.fire();

      // Circuit should close
      expect(breaker.closed).toBe(true);
    });

    it('should open circuit after reaching error threshold', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('failure'));
      const breaker = createCircuitBreaker('test-threshold', mockFn, {
        errorThresholdPercentage: 50,
        volumeThreshold: 2, // Need at least 2 requests before circuit can open
      });

      // First failure - circuit still closed (not enough volume)
      await expect(breaker.fire()).rejects.toThrow('failure');
      expect(breaker.closed).toBe(true);

      // Second failure - should trip circuit (100% failure rate > 50% threshold)
      await expect(breaker.fire()).rejects.toThrow('failure');
      expect(breaker.opened).toBe(true);
    });
  });
});
