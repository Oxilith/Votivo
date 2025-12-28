/**
 * @file utils/fetch-with-timeout.ts
 * @purpose Centralized fetch utility with timeout handling via AbortController
 * @functionality
 * - Wraps fetch with automatic timeout using AbortController
 * - Ensures proper cleanup of timeouts in all cases
 * - Returns the Response object for flexible handling by callers
 * - Preserves AbortError for callers to detect timeout scenarios
 * @dependencies
 * - None (uses native fetch and AbortController)
 */

/**
 * Options for fetchWithTimeout
 */
export interface FetchWithTimeoutOptions extends Omit<RequestInit, 'signal'> {
  /**
   * Timeout in milliseconds before aborting the request
   */
  timeoutMs: number;
}

/**
 * Executes a fetch request with automatic timeout handling.
 *
 * Uses AbortController to abort the request if it exceeds the specified timeout.
 * The timeout is automatically cleaned up regardless of success or failure.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options including timeoutMs
 * @returns The Response object from the fetch
 * @throws Error with name 'AbortError' if the request times out
 * @throws Error for network failures or other fetch errors
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout('https://api.example.com/data', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ key: 'value' }),
 *     timeoutMs: 5000,
 *   });
 *
 *   if (!response.ok) {
 *     throw new Error(`HTTP ${response.status}`);
 *   }
 *
 *   const data = await response.json();
 * } catch (error) {
 *   if (error instanceof Error && error.name === 'AbortError') {
 *     console.log('Request timed out');
 *   }
 *   throw error;
 * }
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions
): Promise<Response> {
  const { timeoutMs, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
