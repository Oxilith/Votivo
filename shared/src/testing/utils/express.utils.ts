/**
 * @file shared/src/testing/utils/express.utils.ts
 * @purpose Mock factories for Express request and response objects
 * @functionality
 * - Creates mock Express Request objects with configurable properties
 * - Creates mock Express Response objects with chainable methods
 * - Provides type-safe mocks without importing Express types
 * @dependencies
 * - vitest for mock function creation
 */

import { vi, type Mock } from 'vitest';

/**
 * Mock Express Request interface
 * Includes common properties used in middleware and route handlers
 */
export interface MockRequest {
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string | undefined>;
  cookies: Record<string, string>;
  signedCookies: Record<string, string>;
  ip: string;
  path: string;
  method: string;
  get: Mock<(header: string) => string | undefined>;
  header: Mock<(header: string) => string | undefined>;
}

/**
 * Options for creating a mock request
 */
export interface MockRequestOptions {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string | undefined>;
  cookies?: Record<string, string>;
  signedCookies?: Record<string, string>;
  ip?: string;
  path?: string;
  method?: string;
}

/**
 * Creates a mock Express Request object.
 *
 * @param options - Optional overrides for request properties
 * @returns Mock request object with common properties and methods
 *
 * @example
 * ```typescript
 * const req = createMockRequest({
 *   body: { email: 'test@example.com' },
 *   headers: { 'authorization': 'Bearer token123' },
 * });
 * ```
 */
export function createMockRequest(options: MockRequestOptions = {}): MockRequest {
  const headers = options.headers ?? {};

  const getMock = vi.fn((header: string): string | undefined => {
    const normalizedHeader = header.toLowerCase();
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );
    return normalizedHeaders[normalizedHeader];
  });

  return {
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {},
    headers,
    cookies: options.cookies ?? {},
    signedCookies: options.signedCookies ?? {},
    ip: options.ip ?? '127.0.0.1',
    path: options.path ?? '/',
    method: options.method ?? 'GET',
    get: getMock,
    header: getMock,
  };
}

/**
 * Mock Express Response interface
 * Includes chainable methods for building responses
 */
export interface MockResponse {
  status: Mock<(code: number) => MockResponse>;
  json: Mock<(body: unknown) => MockResponse>;
  send: Mock<(body: unknown) => MockResponse>;
  cookie: Mock<(name: string, value: string, options?: Record<string, unknown>) => MockResponse>;
  clearCookie: Mock<(name: string, options?: Record<string, unknown>) => MockResponse>;
  setHeader: Mock<(name: string, value: string) => MockResponse>;
  redirect: Mock<(url: string) => MockResponse>;
  end: Mock<() => MockResponse>;
  statusCode: number;
  locals: Record<string, unknown>;
}

/**
 * Creates a mock Express Response object with chainable methods.
 *
 * @returns Mock response object that tracks all method calls
 *
 * @example
 * ```typescript
 * const res = createMockResponse();
 * await handler(req, res);
 *
 * expect(res.status).toHaveBeenCalledWith(200);
 * expect(res.json).toHaveBeenCalledWith({ success: true });
 * ```
 */
export function createMockResponse(): MockResponse {
  const res: Partial<MockResponse> = {
    statusCode: 200,
    locals: {},
  };

  // Create chainable methods
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res as MockResponse;
  });

  res.json = vi.fn(() => res as MockResponse);
  res.send = vi.fn(() => res as MockResponse);
  res.cookie = vi.fn(() => res as MockResponse);
  res.clearCookie = vi.fn(() => res as MockResponse);
  res.setHeader = vi.fn(() => res as MockResponse);
  res.redirect = vi.fn(() => res as MockResponse);
  res.end = vi.fn(() => res as MockResponse);

  return res as MockResponse;
}

/**
 * Mock Express NextFunction
 */
export type MockNextFunction = Mock<(error?: unknown) => void>;

/**
 * Creates a mock Express next function.
 *
 * @returns Mock next function that can be used in middleware tests
 *
 * @example
 * ```typescript
 * const next = createMockNext();
 * await middleware(req, res, next);
 *
 * expect(next).toHaveBeenCalled();
 * // Or for error handling:
 * expect(next).toHaveBeenCalledWith(expect.any(Error));
 * ```
 */
export function createMockNext(): MockNextFunction {
  return vi.fn();
}
