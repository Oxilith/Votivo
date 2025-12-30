/**
 * @file services/api/ApiClient.ts
 * @purpose HTTP API client implementation with enterprise features
 * @functionality
 * - Implements IApiClient interface
 * - Provides automatic retry with exponential backoff
 * - Handles request timeouts
 * - Transforms errors into consistent format
 * - Supports request/response interceptors pattern
 * - Automatically includes CSRF token for state-changing requests
 * - Handles 401 errors with automatic token refresh using Promise singleton pattern
 * - Auto-retries original request after successful token refresh
 * @dependencies
 * - @/services (IApiClient, RequestConfig, ApiResponse, ApiError)
 */

import type { IApiClient, RequestConfig, ApiResponse, ApiError } from '@/services';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * CSRF token header name
 */
const CSRF_HEADER = 'x-csrf-token';

/**
 * HTTP methods that require CSRF protection
 */
const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * CSRF token getter function type
 */
type CsrfTokenGetter = () => string | null;

/**
 * Global CSRF token getter, set by AuthService initialization
 */
let csrfTokenGetter: CsrfTokenGetter | null = null;

/**
 * Set the CSRF token getter function
 * Called by AuthService during initialization to avoid circular dependency
 */
export function setCsrfTokenGetter(getter: CsrfTokenGetter): void {
  csrfTokenGetter = getter;
}

/**
 * Get CSRF token from auth store
 *
 * The CSRF token is stored in memory after login/register/refresh.
 * The httpOnly cookie is sent automatically by the browser.
 *
 * @returns CSRF token or null if not authenticated
 */
function getCsrfToken(): string | null {
  return csrfTokenGetter ? csrfTokenGetter() : null;
}

export class ApiClientError extends Error implements ApiError {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Handler for 401 errors - refreshes token and returns new access token
 */
export type UnauthorizedHandler = () => Promise<string | null>;

export class ApiClient implements IApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private refreshPromise: Promise<string | null> | null = null;
  private onUnauthorized: UnauthorizedHandler | null = null;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Set handler for 401 unauthorized errors
   * The handler should refresh the token and return the new access token
   */
  setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.onUnauthorized = handler;
  }

  /**
   * Handle token refresh using Promise singleton pattern
   * Ensures only one refresh request is in flight at a time
   */
  private async handleTokenRefresh(): Promise<string | null> {
    if (!this.onUnauthorized) {
      return null;
    }

    // Reuse existing refresh promise if one is in flight
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create new refresh promise
    this.refreshPromise = (async () => {
      try {
        return await this.onUnauthorized!();
      } finally {
        // Clear the promise when done (success or failure)
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    config?: RequestConfig & { _isRetryAfterRefresh?: boolean }
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${url}`;
    const timeout = config?.timeout ?? DEFAULT_TIMEOUT;
    const maxRetries = config?.retries ?? DEFAULT_RETRIES;
    const retryDelay = config?.retryDelay ?? DEFAULT_RETRY_DELAY;
    const isRetryAfterRefresh = config?._isRetryAfterRefresh ?? false;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...config?.headers,
    };

    // Add CSRF token for state-changing methods
    if (CSRF_METHODS.includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers[CSRF_HEADER] = csrfToken;
      }
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include httpOnly cookies for auth
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(fullUrl, options, timeout);

        // Parse response body
        const data = await this.parseResponse<T>(response);

        if (!response.ok) {
          // Extract error message - handle both { error: string } and { error: { message: string } }
          let errorMessage = `Request failed with status ${response.status}`;
          if (data && typeof data === 'object' && 'error' in data) {
            const errorField = (data as { error: string | { message: string } }).error;
            if (typeof errorField === 'string') {
              errorMessage = errorField;
            } else if (errorField && typeof errorField === 'object' && 'message' in errorField) {
              errorMessage = errorField.message;
            }
          }

          throw new ApiClientError(
            errorMessage,
            this.getErrorCode(response.status),
            response.status,
            data
          );
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle 401 errors with token refresh (unless skipAuthRefresh is set or this is already a retry)
        const skipRefresh = config?.skipAuthRefresh ?? false;
        if (
          error instanceof ApiClientError &&
          error.status === 401 &&
          !isRetryAfterRefresh &&
          !skipRefresh &&
          this.onUnauthorized
        ) {
          const newToken = await this.handleTokenRefresh();
          if (newToken) {
            // Retry with new token
            const newHeaders = {
              ...config?.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return this.request<T>(method, url, body, {
              ...config,
              headers: newHeaders,
              _isRetryAfterRefresh: true,
            });
          }
          // Refresh failed, throw the original 401 error
          throw error;
        }

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry on abort (timeout)
        if (lastError.name === 'AbortError') {
          throw new ApiClientError(
            'Request timeout',
            'TIMEOUT',
            0
          );
        }

        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await sleep(delay);
        }
      }
    }

    // All retries exhausted
    throw lastError ?? new ApiClientError('Request failed', 'UNKNOWN_ERROR', 0);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 429:
        return 'RATE_LIMITED';
      case 500:
        return 'SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T, B = unknown>(url: string, body: B, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, body, config);
  }

  async put<T, B = unknown>(url: string, body: B, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, body, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}

// Default API client instance
// Use empty string for Docker (nginx proxy) or explicit URL for local dev
const API_URL = import.meta.env.VITE_API_URL ?? '';
export const apiClient = new ApiClient(API_URL);
