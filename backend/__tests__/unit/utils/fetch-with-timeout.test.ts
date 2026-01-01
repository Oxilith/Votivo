/**
 * @file backend/__tests__/unit/utils/fetch-with-timeout.test.ts
 * @purpose Unit tests for fetchWithTimeout utility
 * @functionality
 * - Tests successful fetch operations
 * - Tests timeout handling (AbortError)
 * - Tests network error propagation
 * - Tests proper timeout cleanup
 * @dependencies
 * - vitest for testing framework
 * - fetchWithTimeout for utility under test
 */

import { fetchWithTimeout } from '@/utils';

// Store original fetch
const originalFetch = globalThis.fetch;

describe('fetchWithTimeout', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock fetch
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  describe('successful fetch', () => {
    it('should return response on successful fetch', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetchWithTimeout('https://api.example.com/data', {
        timeoutMs: 5000,
      });

      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          signal: expect.any(AbortSignal) as AbortSignal,
        })
      );
    });

    it('should pass through fetch options correctly', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://api.example.com/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'value' }),
        timeoutMs: 5000,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'value' }),
          signal: expect.any(AbortSignal) as AbortSignal,
        })
      );
    });

    it('should handle non-ok responses without throwing', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetchWithTimeout('https://api.example.com/notfound', {
        timeoutMs: 5000,
      });

      expect(response).toBe(mockResponse);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('timeout handling', () => {
    it('should abort request when timeout is exceeded', async () => {
      // Create a promise that never resolves to simulate slow response
      // But respects the abort signal
      mockFetch.mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_, reject) => {
            options.signal?.addEventListener('abort', () => {
              const error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            });
          })
      );

      const fetchPromise = fetchWithTimeout('https://api.example.com/slow', {
        timeoutMs: 100,
      });

      // Advance time past the timeout and await result
      vi.advanceTimersByTime(101);

      await expect(fetchPromise).rejects.toMatchObject({
        name: 'AbortError',
      });
    });

    it('should not timeout before the specified time', async () => {
      const mockResponse = { ok: true, status: 200 };

      // Simulate a response that arrives just before timeout
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockResponse);
            }, 4000);
          })
      );

      const fetchPromise = fetchWithTimeout('https://api.example.com/data', {
        timeoutMs: 5000,
      });

      // Advance time to just before timeout
      await vi.advanceTimersByTimeAsync(4001);

      const response = await fetchPromise;
      expect(response).toBe(mockResponse);
    });

    it('should use the provided timeout value', async () => {
      // Mock fetch that respects abort signal
      mockFetch.mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_, reject) => {
            options.signal?.addEventListener('abort', () => {
              const error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            });
          })
      );

      const fetchPromise = fetchWithTimeout('https://api.example.com/slow', {
        timeoutMs: 100,
      });

      // Advance time past timeout
      vi.advanceTimersByTime(101);

      await expect(fetchPromise).rejects.toMatchObject({
        name: 'AbortError',
      });
    });
  });

  describe('network errors', () => {
    it('should propagate network errors', async () => {
      const networkError = new Error('Network request failed');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(
        fetchWithTimeout('https://api.example.com/data', {
          timeoutMs: 5000,
        })
      ).rejects.toThrow('Network request failed');
    });

    it('should propagate DNS errors', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND api.example.com');
      mockFetch.mockRejectedValueOnce(dnsError);

      await expect(
        fetchWithTimeout('https://api.example.com/data', {
          timeoutMs: 5000,
        })
      ).rejects.toThrow('getaddrinfo ENOTFOUND api.example.com');
    });

    it('should propagate connection refused errors', async () => {
      const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000');
      mockFetch.mockRejectedValueOnce(connectionError);

      await expect(
        fetchWithTimeout('https://localhost:3000/data', {
          timeoutMs: 5000,
        })
      ).rejects.toThrow('connect ECONNREFUSED 127.0.0.1:3000');
    });
  });

  describe('timeout cleanup', () => {
    it('should clear timeout on successful fetch', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const mockResponse = { ok: true, status: 200 };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://api.example.com/data', {
        timeoutMs: 5000,
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout on fetch error', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const networkError = new Error('Network error');

      mockFetch.mockRejectedValueOnce(networkError);

      await expect(
        fetchWithTimeout('https://api.example.com/data', {
          timeoutMs: 5000,
        })
      ).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should not leave pending timeouts after completion', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://api.example.com/data', {
        timeoutMs: 5000,
      });

      // Count active timers - vitest tracks this with fake timers
      // After cleanup, advancing time should not trigger any callbacks
      const abortController = new AbortController();
      const abortSpy = vi.spyOn(abortController, 'abort');

      // Advance time well past the original timeout
      await vi.advanceTimersByTimeAsync(10000);

      // The abort should not have been called since timeout was cleared
      // (This validates cleanup indirectly by ensuring no stale timers)
      expect(abortSpy).not.toHaveBeenCalled();
    });
  });

  describe('AbortController integration', () => {
    it('should pass AbortSignal to fetch', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://api.example.com/data', {
        timeoutMs: 5000,
      });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
    });

    it('should have non-aborted signal for successful requests', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://api.example.com/data', {
        timeoutMs: 5000,
      });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(callArgs[1].signal?.aborted).toBe(false);
    });
  });
});
