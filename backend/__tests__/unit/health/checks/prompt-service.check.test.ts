/**
 * @file backend/__tests__/unit/health/checks/prompt-service.check.test.ts
 * @purpose Unit tests for Prompt Service health check
 * @functionality
 * - Tests healthy response when service is reachable
 * - Tests unhealthy response for non-OK status
 * - Tests unhealthy response for timeout
 * - Tests unhealthy response for network errors
 * @dependencies
 * - vitest for testing framework
 * - createPromptServiceCheck factory under test
 */

// Hoist mock before imports
const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('@/utils/fetch-with-timeout', () => ({
  fetchWithTimeout: mockFetch,
}));

import { createPromptServiceCheck } from '@/health';
import { config } from '@/config';

describe('prompt-service.check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPromptServiceCheck', () => {
    it('should return a health check with correct properties', () => {
      const check = createPromptServiceCheck();

      expect(check.name).toBe('prompt-service');
      expect(check.critical).toBe(false);
      expect(check.runOnce).toBe(false);
      expect(typeof check.check).toBe('function');
    });
  });

  describe('check function', () => {
    it('should return healthy when service responds with OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const check = createPromptServiceCheck();
      const result = await check.check();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Prompt service is reachable');
    });

    it('should return unhealthy for non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const check = createPromptServiceCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Prompt service returned HTTP 503');
    });

    it('should return unhealthy for timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const check = createPromptServiceCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Prompt service health check timed out');
    });

    it('should return unhealthy for network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const check = createPromptServiceCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('ECONNREFUSED');
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('network failure');

      const check = createPromptServiceCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Unknown error connecting to prompt service');
    });

    it('should call health endpoint with timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const check = createPromptServiceCheck();
      await check.check();

      expect(mockFetch).toHaveBeenCalledWith(
        `${config.promptServiceUrl}/health`,
        expect.objectContaining({
          timeoutMs: 5000,
        })
      );
    });
  });
});
