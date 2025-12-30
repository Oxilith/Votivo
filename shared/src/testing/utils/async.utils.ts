/**
 * @file shared/src/testing/utils/async.utils.ts
 * @purpose Async utilities for testing asynchronous code
 * @functionality
 * - Provides flushPromises to wait for pending promise resolution
 * - Provides advanceTimersAndFlush to combine timer advancement with promise flushing
 * - Provides runAllTimersAndFlush to run all pending timers with promise flushing
 * @dependencies
 * - vitest for fake timer control
 */

import { vi } from 'vitest';

/**
 * Waits for all pending promises to resolve.
 * Useful when testing code that uses Promise.resolve() or other microtasks.
 *
 * Note: Uses Node.js `setImmediate` - intended for server-side test environments only.
 *
 * @example
 * ```typescript
 * await flushPromises();
 * expect(mockFn).toHaveBeenCalled();
 * ```
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Advances fake timers and flushes pending promises.
 * Useful when testing code that combines setTimeout with promises.
 *
 * @param ms - Number of milliseconds to advance timers
 *
 * @example
 * ```typescript
 * vi.useFakeTimers();
 * triggerDelayedAction();
 * await advanceTimersAndFlush(1000);
 * expect(result).toBeDefined();
 * ```
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await flushPromises();
}

/**
 * Runs all pending timers and flushes promises.
 * Useful when you don't know the exact delay but want all timers to complete.
 *
 * @example
 * ```typescript
 * vi.useFakeTimers();
 * startBackgroundTask();
 * await runAllTimersAndFlush();
 * expect(task).toBeComplete();
 * ```
 */
export async function runAllTimersAndFlush(): Promise<void> {
  vi.runAllTimers();
  await flushPromises();
}
