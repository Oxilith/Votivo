/**
 * @file services/interfaces/IApiClient.ts
 * @purpose Interface definition for HTTP API client abstraction
 * @functionality
 * - Defines contract for HTTP operations (GET, POST, PUT, DELETE)
 * - Provides typed request/response handling
 * - Enables dependency injection for testing
 * - Supports request configuration options
 * @dependencies
 * - None (pure TypeScript interface)
 */

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
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

export interface IApiClient {
  /**
   * Performs a GET request
   */
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Performs a POST request
   */
  post<T, B = unknown>(url: string, body: B, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Performs a PUT request
   */
  put<T, B = unknown>(url: string, body: B, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Performs a DELETE request
   */
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}
