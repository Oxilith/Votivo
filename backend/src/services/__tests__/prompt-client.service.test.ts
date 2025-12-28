/**
 * @file services/__tests__/prompt-client.service.test.ts
 * @purpose Unit tests for PromptClientService HTTP client operations
 * @functionality
 * - Tests successful resolve operations with cache integration
 * - Tests error handling and PromptServiceUnavailableError
 * - Tests circuit breaker integration and state transitions
 * - Tests stale-while-revalidate pattern with background refresh
 * - Tests conversion recording with circuit breaker protection
 * @dependencies
 * - vitest for testing framework
 * - PromptClientService for service under test
 * - Mock fetch for HTTP simulation
 * - Mock BackgroundRefreshManager for isolation
 */

/* eslint-disable @typescript-eslint/unbound-method -- vitest mocks are safe to use unbound */

import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import { PromptClientService, PromptServiceUnavailableError } from '@/services/prompt-client.service.js';
import { promptCacheService } from '@/services/prompt-cache.service.js';
import type { PromptConfig } from 'shared/index.js';

// Cast to mocked type for type safety
const mockCacheService = vi.mocked(promptCacheService);

// Track scheduled refresh tasks for testing
const mockScheduledTasks: Array<{ key: string; thinkingEnabled: boolean }> = [];

// Mock BackgroundRefreshManager to isolate tests from async background operations
vi.mock('@/utils/background-refresh-manager.js', () => ({
  BackgroundRefreshManager: class MockBackgroundRefreshManager {
    schedule = vi.fn((task: { id: { key: string; thinkingEnabled: boolean } }) => {
      // Track scheduled tasks for test assertions
      mockScheduledTasks.push(task.id);
      // Call markInProgress like the real implementation does
      promptCacheService.markRefreshInProgress(task.id.key, task.id.thinkingEnabled);
    });
    getActiveCount = vi.fn().mockReturnValue(0);
    getQueueLength = vi.fn().mockReturnValue(0);
  },
}));

// Mock dependencies
vi.mock('@/config/index.js', () => ({
  config: {
    promptServiceUrl: 'http://localhost:3002',
    circuitBreakerTimeout: 5000,
    circuitBreakerErrorThreshold: 50,
    circuitBreakerResetTimeout: 30000,
    promptCacheTtlMs: 5000,
    promptStaleTtlMs: 60000,
  },
}));

vi.mock('@/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock prompt cache service - defined at module level with proper hoisting
vi.mock('@/services/prompt-cache.service.js', () => ({
  promptCacheService: {
    get: vi.fn(),
    set: vi.fn(),
    isFresh: vi.fn(),
    has: vi.fn(),
    markRefreshInProgress: vi.fn(),
    clearRefreshInProgress: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(),
  },
}));

// Mock circuit breaker service
vi.mock('@/services/circuit-breaker.service.js', () => ({
  createCircuitBreaker: vi.fn((_name: string, fn: (...args: unknown[]) => unknown) => {
    const breaker = {
      fire: vi.fn((...args: unknown[]) => fn(...args)),
      opened: false,
      halfOpen: false,
      on: vi.fn(),
    };
    return breaker;
  }),
}));

// Store original fetch
const originalFetch = globalThis.fetch;

describe('PromptClientService', () => {
  let service: PromptClientService;
  let mockFetch: Mock;

  const mockPromptConfig: PromptConfig = {
    prompt: 'Test prompt content',
    model: 'claude-sonnet-4-0',
    max_tokens: 1000,
    temperature: 0.7,
  };

  const mockResolveResponse = {
    config: mockPromptConfig,
    variantId: 'variant-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Clear mock scheduled tasks array
    mockScheduledTasks.length = 0;

    // Mock fetch
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Create new service instance for each test
    service = new PromptClientService('http://test:3002');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  describe('resolve - success path', () => {
    it('should return cached entry when fresh cache exists', async () => {
      const cachedEntry = {
        config: mockPromptConfig,
        variantId: 'cached-variant',
        timestamp: Date.now(),
      };

      mockCacheService.get.mockReturnValue(cachedEntry);
      mockCacheService.isFresh.mockReturnValue(true);

      const result = await service.resolve('IDENTITY_ANALYSIS', true);

      expect(result.config).toEqual(mockPromptConfig);
      expect(result.variantId).toBe('cached-variant');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch from service when cache is empty', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResolveResponse),
      });

      const result = await service.resolve('IDENTITY_ANALYSIS', true);

      expect(result.config).toEqual(mockPromptConfig);
      expect(result.variantId).toBe('variant-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test:3002/api/resolve',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'IDENTITY_ANALYSIS', thinkingEnabled: true }),
        })
      );
    });

    it('should cache successful response', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResolveResponse),
      });

      await service.resolve('IDENTITY_ANALYSIS', true);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'IDENTITY_ANALYSIS',
        true,
        mockPromptConfig,
        'variant-123'
      );
    });

    it('should include variantId in response when present', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ config: mockPromptConfig, variantId: 'test-variant' }),
      });

      const result = await service.resolve('IDENTITY_ANALYSIS', true);

      expect(result.variantId).toBe('test-variant');
    });

    it('should not include variantId when not in response', async () => {
      const cachedEntry = {
        config: mockPromptConfig,
        variantId: undefined,
        timestamp: Date.now(),
      };

      mockCacheService.get.mockReturnValue(cachedEntry);
      mockCacheService.isFresh.mockReturnValue(true);

      const result = await service.resolve('IDENTITY_ANALYSIS', true);

      expect(result.variantId).toBeUndefined();
    });
  });

  describe('resolve - error handling', () => {
    it('should throw PromptServiceUnavailableError when circuit is open', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      // Create a new service with mocked open circuit
      const { createCircuitBreaker } = await import('@/services/circuit-breaker.service.js');
      (createCircuitBreaker as Mock).mockImplementationOnce(() => ({
        fire: vi.fn(),
        opened: true,
        halfOpen: false,
        on: vi.fn(),
      }));

      const serviceWithOpenCircuit = new PromptClientService('http://test:3002');

      await expect(serviceWithOpenCircuit.resolve('IDENTITY_ANALYSIS', true))
        .rejects.toThrow(PromptServiceUnavailableError);
    });

    it('should throw PromptServiceUnavailableError when no cache and service fails', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(service.resolve('IDENTITY_ANALYSIS', true))
        .rejects.toThrow(PromptServiceUnavailableError);
    });

    it('should use generic error message for client-facing errors', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Detailed internal error with sensitive info'),
      });

      await expect(service.resolve('IDENTITY_ANALYSIS', true))
        .rejects.toThrow('HTTP 503: Service temporarily unavailable');
    });

    it('should handle request timeout with AbortError', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockCacheService.isFresh.mockReturnValue(false);

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      await expect(service.resolve('IDENTITY_ANALYSIS', true))
        .rejects.toThrow('Prompt service request timed out');
    });
  });

  describe('stale-while-revalidate', () => {
    it('should return stale cache and schedule background refresh on error', async () => {
      const staleEntry = {
        config: mockPromptConfig,
        variantId: 'stale-variant',
        timestamp: Date.now() - 10000, // 10 seconds old
      };

      mockCacheService.get.mockReturnValue(staleEntry);
      mockCacheService.isFresh.mockReturnValue(false);
      mockCacheService.markRefreshInProgress.mockReturnValue(true);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service unavailable'),
      });

      const result = await service.resolve('IDENTITY_ANALYSIS', true);

      // Should return stale data
      expect(result.config).toEqual(mockPromptConfig);
      expect(result.variantId).toBe('stale-variant');

      // Should have scheduled a background refresh via BackgroundRefreshManager
      expect(mockScheduledTasks).toHaveLength(1);
      expect(mockScheduledTasks[0]).toEqual({ key: 'IDENTITY_ANALYSIS', thinkingEnabled: true });
    });

    it('should delegate to refresh manager for scheduling (deduplication handled by manager)', async () => {
      const staleEntry = {
        config: mockPromptConfig,
        variantId: 'stale-variant',
        timestamp: Date.now() - 10000,
      };

      mockCacheService.get.mockReturnValue(staleEntry);
      mockCacheService.isFresh.mockReturnValue(false);
      mockCacheService.markRefreshInProgress.mockReturnValue(false); // Already in progress

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service unavailable'),
      });

      await service.resolve('IDENTITY_ANALYSIS', true);

      // Service delegates to BackgroundRefreshManager which handles deduplication
      // The manager calls markInProgress internally via callbacks
      expect(mockScheduledTasks).toHaveLength(1);
      expect(mockScheduledTasks[0]).toEqual({ key: 'IDENTITY_ANALYSIS', thinkingEnabled: true });
    });
  });

  describe('circuit breaker integration', () => {
    it('should report correct circuit state when closed', () => {
      const state = service.getCircuitState();
      expect(state).toBe('closed');
    });
  });

  describe('recordConversion', () => {
    it('should record conversion successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      // Should not throw
      await expect(service.recordConversion('variant-123')).resolves.not.toThrow();
    });

    it('should not throw when conversion recording fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Should not throw even on failure
      await expect(service.recordConversion('variant-123')).resolves.not.toThrow();
    });

    it('should not throw when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw even on network error
      await expect(service.recordConversion('variant-123')).resolves.not.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test:3002/health',
        expect.objectContaining({
          signal: expect.any(AbortSignal) as AbortSignal,
        })
      );
    });

    it('should return false when health check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('PromptServiceUnavailableError', () => {
    it('should have correct name and default message', () => {
      const error = new PromptServiceUnavailableError();

      expect(error.name).toBe('PromptServiceUnavailableError');
      expect(error.message).toBe('Prompt service is unavailable');
    });

    it('should accept custom message', () => {
      const error = new PromptServiceUnavailableError('Custom error message');

      expect(error.message).toBe('Custom error message');
    });
  });
});
