/**
 * @file services/interfaces/IApiClient.ts
 * @purpose Interface definition for HTTP API client abstraction
 * @functionality
 * - Defines contract for HTTP operations (GET, POST, PUT, DELETE)
 * - Provides typed request/response handling
 * - Enables dependency injection for testing
 * - Supports request configuration options
 * - Supports 401 unauthorized handling with token refresh
 * @dependencies
 * - None (pure TypeScript interface)
 */

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  /** Skip automatic token refresh on 401 errors (use for auth endpoints) */
  skipAuthRefresh?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: unknown;
}

/**
 * Handler for 401 errors - refreshes token and returns new access token
 */
export type UnauthorizedHandler = () => Promise<string | null>;

export interface IApiClient {
  /**
   * Performs a GET request
   */
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Performs a POST request
   */
  post<T>(url: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Performs a PUT request
   */
  put<T>(url: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Performs a DELETE request
   */
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Set handler for 401 unauthorized errors
   * The handler should refresh the token and return the new access token
   */
  setUnauthorizedHandler?(handler: UnauthorizedHandler): void;
}
