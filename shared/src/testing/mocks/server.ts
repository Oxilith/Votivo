/**
 * @file shared/src/testing/mocks/server.ts
 * @purpose MSW server setup with lifecycle hooks for Node.js testing
 * @functionality
 * - Creates and exports MSW server instance
 * - Provides setupMswServer helper for test lifecycle management
 * - Handles unhandled requests with configurable behavior
 * @dependencies
 * - msw/node for Node.js server implementation
 * - vitest for test lifecycle hooks
 * - ./handlers for default request handlers
 */

import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { handlers } from './handlers';

/**
 * MSW server instance configured with default handlers.
 * Can be customized per-test using server.use().
 *
 * @example
 * ```typescript
 * import { server } from 'shared/testing';
 * import { createRateLimitHandler } from 'shared/testing';
 *
 * // Override default handler for a specific test
 * server.use(createRateLimitHandler(30));
 * ```
 */
export const server = setupServer(...handlers);

/**
 * Options for MSW server setup
 */
export interface SetupMswServerOptions {
  /**
   * How to handle requests that don't match any handler.
   * - 'warn': Log a warning (default in development)
   * - 'error': Throw an error (recommended for tests)
   * - 'bypass': Let the request through to the actual network
   */
  onUnhandledRequest?: 'warn' | 'error' | 'bypass';
}

/**
 * Sets up MSW server lifecycle for a test file.
 * Call this in your test file's top-level describe block or at file scope.
 *
 * @param options - Optional server configuration
 *
 * @example
 * ```typescript
 * import { setupMswServer } from 'shared/testing';
 *
 * describe('MyService', () => {
 *   setupMswServer();
 *
 *   it('should fetch data', async () => {
 *     // MSW is active, handlers are registered
 *   });
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With custom unhandled request behavior
 * setupMswServer({ onUnhandledRequest: 'bypass' });
 * ```
 */
export function setupMswServer(options: SetupMswServerOptions = {}): void {
  const { onUnhandledRequest = 'error' } = options;

  beforeAll(() => {
    server.listen({ onUnhandledRequest });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
}

/**
 * Adds handlers to the server for the current test only.
 * These handlers will be reset after the test completes.
 *
 * @param newHandlers - Handler(s) to add
 *
 * @example
 * ```typescript
 * import { useHandlers, createRateLimitHandler } from 'shared/testing';
 *
 * it('handles rate limits', async () => {
 *   useHandlers(createRateLimitHandler(60));
 *   // This test will see rate limit responses
 * });
 *
 * it('works normally', async () => {
 *   // This test sees normal responses (handlers were reset)
 * });
 * ```
 */
export function useHandlers(...newHandlers: Parameters<typeof server.use>): void {
  server.use(...newHandlers);
}

/**
 * Resets handlers to the initial default set.
 * Useful when you've added test-specific handlers and want to restore defaults.
 */
export function resetHandlers(): void {
  server.resetHandlers();
}

/**
 * Gets the current handlers registered with the server.
 * Useful for debugging handler registration issues.
 *
 * @returns Array of currently registered handlers
 */
export function getRegisteredHandlers(): readonly unknown[] {
  return server.listHandlers();
}
