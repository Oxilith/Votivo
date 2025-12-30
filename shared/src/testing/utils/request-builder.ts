/**
 * @file shared/src/testing/utils/request-builder.ts
 * @purpose Fluent request builder for API test scenarios
 * @functionality
 * - Provides fluent API for building mock HTTP requests
 * - Supports common HTTP methods (GET, POST, PUT, DELETE)
 * - Handles headers, cookies, body, params, and query strings
 * - Includes convenience methods for auth tokens and CSRF
 * @dependencies
 * - ./express.utils for createMockRequest and types
 */

import { createMockRequest, type MockRequest, type MockRequestOptions } from './express.utils';

/**
 * Fluent builder for constructing mock Express requests.
 * Use this to create complex request objects in a readable, chainable way.
 *
 * @example
 * ```typescript
 * const req = RequestBuilder.create()
 *   .post('/api/users')
 *   .body({ email: 'test@example.com' })
 *   .bearerToken('jwt-token-here')
 *   .csrfToken('csrf-token')
 *   .build();
 *
 * await handler(req, res, next);
 * ```
 */
export class RequestBuilder {
  private options: MockRequestOptions = {};

  /**
   * Creates a new RequestBuilder instance.
   * Prefer using the static `create()` method or `requestBuilder()` function.
   */
  private constructor() {}

  /**
   * Creates a new RequestBuilder instance.
   *
   * @returns A new RequestBuilder
   *
   * @example
   * ```typescript
   * const builder = RequestBuilder.create();
   * ```
   */
  static create(): RequestBuilder {
    return new RequestBuilder();
  }

  /**
   * Sets the HTTP method.
   *
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @returns this builder for chaining
   */
  method(method: string): this {
    this.options.method = method;
    return this;
  }

  /**
   * Configures the request as a GET request.
   *
   * @param path - Optional path to set
   * @returns this builder for chaining
   */
  get(path?: string): this {
    this.options.method = 'GET';
    if (path) this.options.path = path;
    return this;
  }

  /**
   * Configures the request as a POST request.
   *
   * @param path - Optional path to set
   * @returns this builder for chaining
   */
  post(path?: string): this {
    this.options.method = 'POST';
    if (path) this.options.path = path;
    return this;
  }

  /**
   * Configures the request as a PUT request.
   *
   * @param path - Optional path to set
   * @returns this builder for chaining
   */
  put(path?: string): this {
    this.options.method = 'PUT';
    if (path) this.options.path = path;
    return this;
  }

  /**
   * Configures the request as a PATCH request.
   *
   * @param path - Optional path to set
   * @returns this builder for chaining
   */
  patch(path?: string): this {
    this.options.method = 'PATCH';
    if (path) this.options.path = path;
    return this;
  }

  /**
   * Configures the request as a DELETE request.
   *
   * @param path - Optional path to set
   * @returns this builder for chaining
   */
  delete(path?: string): this {
    this.options.method = 'DELETE';
    if (path) this.options.path = path;
    return this;
  }

  /**
   * Sets the request path.
   *
   * @param path - The request path
   * @returns this builder for chaining
   */
  path(path: string): this {
    this.options.path = path;
    return this;
  }

  /**
   * Sets the request body.
   *
   * @param body - The request body object
   * @returns this builder for chaining
   */
  body(body: Record<string, unknown>): this {
    this.options.body = body;
    return this;
  }

  /**
   * Sets URL path parameters.
   *
   * @param params - Object of path parameters
   * @returns this builder for chaining
   *
   * @example
   * ```typescript
   * builder.params({ id: '123', userId: '456' });
   * ```
   */
  params(params: Record<string, string>): this {
    this.options.params = params;
    return this;
  }

  /**
   * Sets query string parameters.
   *
   * @param query - Object of query parameters
   * @returns this builder for chaining
   *
   * @example
   * ```typescript
   * builder.query({ page: '1', limit: '10' });
   * ```
   */
  query(query: Record<string, string>): this {
    this.options.query = query;
    return this;
  }

  /**
   * Sets a single header.
   *
   * @param name - Header name
   * @param value - Header value
   * @returns this builder for chaining
   */
  header(name: string, value: string): this {
    this.options.headers = { ...this.options.headers, [name]: value };
    return this;
  }

  /**
   * Sets multiple headers at once.
   *
   * @param headers - Object of header key-value pairs
   * @returns this builder for chaining
   */
  headers(headers: Record<string, string>): this {
    this.options.headers = { ...this.options.headers, ...headers };
    return this;
  }

  /**
   * Sets the Authorization header with a Bearer token.
   *
   * @param token - The JWT or bearer token
   * @returns this builder for chaining
   *
   * @example
   * ```typescript
   * builder.bearerToken('eyJhbGciOiJIUzI1NiIs...');
   * // Sets: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   * ```
   */
  bearerToken(token: string): this {
    return this.header('authorization', `Bearer ${token}`);
  }

  /**
   * Sets a cookie value.
   *
   * @param name - Cookie name
   * @param value - Cookie value
   * @returns this builder for chaining
   */
  cookie(name: string, value: string): this {
    this.options.cookies = { ...this.options.cookies, [name]: value };
    return this;
  }

  /**
   * Sets multiple cookies at once.
   *
   * @param cookies - Object of cookie key-value pairs
   * @returns this builder for chaining
   */
  cookies(cookies: Record<string, string>): this {
    this.options.cookies = { ...this.options.cookies, ...cookies };
    return this;
  }

  /**
   * Sets the CSRF token header (x-csrf-token).
   *
   * @param token - The CSRF token
   * @returns this builder for chaining
   */
  csrfToken(token: string): this {
    return this.header('x-csrf-token', token);
  }

  /**
   * Sets the Content-Type header.
   *
   * @param contentType - The content type (e.g., 'application/json')
   * @returns this builder for chaining
   */
  contentType(contentType: string): this {
    return this.header('content-type', contentType);
  }

  /**
   * Sets the client IP address.
   *
   * @param ip - The IP address
   * @returns this builder for chaining
   */
  ip(ip: string): this {
    this.options.ip = ip;
    return this;
  }

  /**
   * Builds and returns the mock request object.
   *
   * @returns The constructed MockRequest
   */
  build(): MockRequest {
    return createMockRequest(this.options);
  }
}

/**
 * Convenience function to create a new RequestBuilder.
 *
 * @returns A new RequestBuilder instance
 *
 * @example
 * ```typescript
 * import { requestBuilder } from 'shared/testing';
 *
 * const req = requestBuilder()
 *   .post('/api/auth/login')
 *   .body({ email: 'test@example.com', password: 'password123' })
 *   .build();
 * ```
 */
export function requestBuilder(): RequestBuilder {
  return RequestBuilder.create();
}
