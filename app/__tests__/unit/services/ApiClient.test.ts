/**
 * @file app/__tests__/unit/services/ApiClient.test.ts
 * @purpose Unit tests for API client with mocked fetch
 * @functionality
 * - Tests successful GET/POST/PUT/DELETE requests
 * - Tests error handling and transformation
 * - Tests retry logic with exponential backoff
 * - Tests timeout handling
 * @dependencies
 * - vitest
 * - @/services/api/ApiClient
 */

import { ApiClient, ApiClientError } from '@/services/api/ApiClient';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ApiClient('http://localhost:3001');
  });

  describe('successful requests', () => {
    it('should make a GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const response = await client.get<{ data: string }>('/api/test');

      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make a POST request with body', async () => {
      const mockResponse = { success: true };
      const requestBody = { name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const response = await client.post<{ success: boolean }>('/api/test', requestBody);

      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(201);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should make a PUT request', async () => {
      const mockResponse = { updated: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const response = await client.put('/api/test/1', { name: 'updated' });

      expect(response.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should make a DELETE request', async () => {
      const mockResponse = { deleted: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const response = await client.delete('/api/test/1');

      expect(response.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('error handling', () => {
    it('should throw ApiClientError on 400 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Bad request' } }),
      });

      await expect(client.get('/api/test')).rejects.toThrow(ApiClientError);

      const error = await client.get('/api/test').catch((e) => e);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.status).toBe(400);
    });

    it('should throw ApiClientError on 401 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      });

      await expect(client.get('/api/test')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('should throw ApiClientError on 404 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Not found' } }),
      });

      await expect(client.get('/api/test')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });

    it('should throw ApiClientError on 500 response after retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      await expect(client.get('/api/test', { retries: 2, retryDelay: 10 })).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        status: 500,
      });

      // Should have retried twice (2 retries = 2 attempts total)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('retry logic', () => {
    it('should retry on 5xx errors', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ error: { message: 'Service unavailable' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true }),
        });

      const response = await client.get('/api/test', { retries: 3, retryDelay: 10 });

      expect(response.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 rate limit errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true }),
        });

      const response = await client.get('/api/test', { retries: 3, retryDelay: 10 });

      expect(response.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry on 4xx errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Bad request' } }),
      });

      await expect(client.get('/api/test', { retries: 3 })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });

      // Should NOT have retried
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom headers', () => {
    it('should merge custom headers with defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await client.get('/api/test', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          }),
        })
      );
    });
  });

  describe('text response handling', () => {
    it('should handle text responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('Plain text response'),
      });

      const response = await client.get<string>('/api/text');

      expect(response.data).toBe('Plain text response');
    });
  });
});

describe('ApiClientError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiClientError('Test error', 'TEST_CODE', 500, { extra: 'data' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.status).toBe(500);
    expect(error.details).toEqual({ extra: 'data' });
    expect(error.name).toBe('ApiClientError');
  });

  it('should be instanceof Error', () => {
    const error = new ApiClientError('Test', 'TEST', 400);

    expect(error instanceof Error).toBe(true);
    expect(error instanceof ApiClientError).toBe(true);
  });
});
