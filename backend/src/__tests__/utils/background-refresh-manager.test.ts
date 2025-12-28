/**
 * @file __tests__/utils/background-refresh-manager.test.ts
 * @purpose Unit tests for BackgroundRefreshManager utility
 * @functionality
 * - Tests queue operations (add, process, size limits)
 * - Tests concurrency limiting (max concurrent tasks)
 * - Tests retry logic (exponential backoff, max attempts)
 * - Tests timeout handling (overall operation timeout)
 * - Tests duplicate prevention via markInProgress callback
 * - Tests edge cases (empty queue, rapid additions, shouldHalt)
 * @dependencies
 * - vitest for testing framework
 * - BackgroundRefreshManager for utility under test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  BackgroundRefreshManager,
  type BackgroundRefreshCallbacks,
  type BackgroundRefreshManagerConfig,
  type BackgroundTask,
} from '@/utils/background-refresh-manager.js';

describe('BackgroundRefreshManager', () => {
  let mockCallbacks: BackgroundRefreshCallbacks<string>;
  let inProgressSet: Set<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    inProgressSet = new Set<string>();

    mockCallbacks = {
      execute: vi.fn().mockResolvedValue(undefined),
      markInProgress: vi.fn((task: BackgroundTask<string>) => {
        if (inProgressSet.has(task.id)) {
          return false;
        }
        inProgressSet.add(task.id);
        return true;
      }),
      clearInProgress: vi.fn((task: BackgroundTask<string>) => {
        inProgressSet.delete(task.id);
      }),
      shouldHalt: vi.fn().mockReturnValue(false),
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
      onTimeout: vi.fn(),
      onDropped: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor and defaults', () => {
    it('should create manager with default configuration', () => {
      const manager = new BackgroundRefreshManager(mockCallbacks);

      expect(manager.getActiveCount()).toBe(0);
      expect(manager.getQueueLength()).toBe(0);
    });

    it('should accept custom configuration', () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 5,
        maxRetryAttempts: 3,
        maxRetryDelayMs: 5000,
        baseRetryDelayMs: 500,
        maxRefreshDurationMs: 30000,
        maxQueueSize: 50,
      };

      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      // Manager should be created without error
      expect(manager.getActiveCount()).toBe(0);
    });
  });

  describe('queue operations', () => {
    it('should add task to queue when at max concurrency', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      // First task will run immediately
      manager.schedule({ id: 'task-1' });

      // Second task should be queued
      manager.schedule({ id: 'task-2' });

      expect(manager.getActiveCount()).toBe(1);
      expect(manager.getQueueLength()).toBe(1);
    });

    it('should process queue after task completes', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      vi.mocked(mockCallbacks.execute)
        .mockImplementationOnce(() => firstPromise)
        .mockResolvedValueOnce(undefined);

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-2' });

      expect(manager.getActiveCount()).toBe(1);
      expect(manager.getQueueLength()).toBe(1);

      // Complete first task
      resolveFirst!();
      await vi.runAllTimersAsync();

      // Queue should be processed
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(2);
    });

    it('should drop oldest task when queue exceeds maxQueueSize', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
        maxQueueSize: 2,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      // Block the active slot
      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Fill up to limit
      manager.schedule({ id: 'task-1' }); // Active
      manager.schedule({ id: 'task-2' }); // Queued
      manager.schedule({ id: 'task-3' }); // Queued

      expect(manager.getQueueLength()).toBe(2);

      // Adding one more should drop the oldest
      manager.schedule({ id: 'task-4' });

      expect(manager.getQueueLength()).toBe(2);
      expect(mockCallbacks.onDropped).toHaveBeenCalledWith({ id: 'task-2' });
    });

    it('should call onDropped callback when task is dropped', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
        maxQueueSize: 1,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {})
      );

      manager.schedule({ id: 'task-1' }); // Active
      manager.schedule({ id: 'task-2' }); // Queued
      manager.schedule({ id: 'task-3' }); // Drops task-2

      expect(mockCallbacks.onDropped).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onDropped).toHaveBeenCalledWith({ id: 'task-2' });
    });
  });

  describe('concurrency limiting', () => {
    it('should not exceed maxConcurrent limit', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 3,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {})
      );

      // Schedule 5 tasks
      for (let i = 1; i <= 5; i++) {
        manager.schedule({ id: `task-${i}` });
      }

      expect(manager.getActiveCount()).toBe(3);
      expect(manager.getQueueLength()).toBe(2);
    });

    it('should start queued task when slot becomes available', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 2,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      const resolvers: (() => void)[] = [];

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvers.push(resolve);
          })
      );

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-2' });
      manager.schedule({ id: 'task-3' });

      expect(manager.getActiveCount()).toBe(2);
      expect(manager.getQueueLength()).toBe(1);

      // Complete first task
      resolvers[0]();
      await vi.runAllTimersAsync();

      // Task 3 should now be active
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent completions correctly', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 3,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      const resolvers: (() => void)[] = [];

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvers.push(resolve);
          })
      );

      // Fill all slots plus queue
      for (let i = 1; i <= 5; i++) {
        manager.schedule({ id: `task-${i}` });
      }

      expect(manager.getActiveCount()).toBe(3);
      expect(manager.getQueueLength()).toBe(2);

      // Complete two tasks simultaneously
      resolvers[0]();
      resolvers[1]();
      await vi.runAllTimersAsync();

      // Both queued tasks should have started
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(5);
    });
  });

  describe('retry logic', () => {
    it('should retry on failure with exponential backoff', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRetryAttempts: 3,
        baseRetryDelayMs: 1000,
        maxRetryDelayMs: 10000,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute)
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce(undefined);

      manager.schedule({ id: 'task-1' });

      // First attempt - immediate
      await vi.advanceTimersByTimeAsync(0);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(1);

      // Wait for first retry (1000ms * 2^0 = 1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(2);

      // Wait for second retry (1000ms * 2^1 = 2000ms)
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(3);

      // Should have succeeded on third attempt
      expect(mockCallbacks.onSuccess).toHaveBeenCalledWith({ id: 'task-1' });
      expect(mockCallbacks.onFailure).not.toHaveBeenCalled();
    });

    it('should cap delay at maxRetryDelayMs', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRetryAttempts: 5,
        baseRetryDelayMs: 1000,
        maxRetryDelayMs: 3000, // Cap at 3 seconds
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValue(new Error('Always fails'));

      manager.schedule({ id: 'task-1' });

      // First attempt - immediate
      await vi.advanceTimersByTimeAsync(0);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(1);

      // Retry 1: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(2);

      // Retry 2: 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(3);

      // Retry 3: 3000ms (capped, would be 4000ms otherwise)
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(4);

      // Retry 4: 3000ms (still capped)
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(5);

      // Retry 5: 3000ms (still capped)
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(6);
    });

    it('should call onFailure after exhausting max retry attempts', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRetryAttempts: 2,
        baseRetryDelayMs: 100,
        maxRetryDelayMs: 200,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValue(new Error('Always fails'));

      manager.schedule({ id: 'task-1' });

      // Run all retries
      await vi.runAllTimersAsync();

      // Attempt + 2 retries = 3 total calls
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(3);
      expect(mockCallbacks.onFailure).toHaveBeenCalledWith({ id: 'task-1' }, 3);
      expect(mockCallbacks.onSuccess).not.toHaveBeenCalled();
    });

    it('should call onSuccess when task succeeds', async () => {
      const manager = new BackgroundRefreshManager(mockCallbacks);

      manager.schedule({ id: 'task-1' });
      await vi.runAllTimersAsync();

      expect(mockCallbacks.onSuccess).toHaveBeenCalledWith({ id: 'task-1' });
    });
  });

  describe('timeout handling', () => {
    it('should timeout and call onTimeout when maxRefreshDurationMs exceeded', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRefreshDurationMs: 5000,
        maxRetryAttempts: 10, // High so timeout triggers before retries exhaust
        baseRetryDelayMs: 2000,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValue(new Error('Always fails'));

      manager.schedule({ id: 'task-1' });

      // Run until timeout triggers
      await vi.advanceTimersByTimeAsync(6000);

      expect(mockCallbacks.onTimeout).toHaveBeenCalledWith(
        { id: 'task-1' },
        expect.any(Number)
      );
      expect(mockCallbacks.onFailure).not.toHaveBeenCalled();
    });

    it('should include elapsed duration in onTimeout callback', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRefreshDurationMs: 3000,
        maxRetryAttempts: 5,
        baseRetryDelayMs: 1000,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValue(new Error('Always fails'));

      manager.schedule({ id: 'task-1' });

      await vi.runAllTimersAsync();

      // First attempt is immediate
      // After first failure, wait 1000ms for retry 1
      // After retry 1 fails, wait 2000ms for retry 2
      // At this point ~3000ms elapsed, timeout should trigger
      expect(mockCallbacks.onTimeout).toHaveBeenCalled();

      const [, durationMs] = vi.mocked(mockCallbacks.onTimeout).mock.calls[0];
      expect(durationMs).toBeGreaterThan(3000);
    });

    it('should not timeout if task completes in time', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRefreshDurationMs: 10000,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      manager.schedule({ id: 'task-1' });
      await vi.runAllTimersAsync();

      expect(mockCallbacks.onTimeout).not.toHaveBeenCalled();
      expect(mockCallbacks.onSuccess).toHaveBeenCalledWith({ id: 'task-1' });
    });
  });

  describe('duplicate prevention', () => {
    it('should prevent duplicate tasks via markInProgress', () => {
      const manager = new BackgroundRefreshManager(mockCallbacks);

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {})
      );

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-1' }); // Duplicate

      expect(mockCallbacks.markInProgress).toHaveBeenCalledTimes(2);
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(1);
    });

    it('should allow task after previous one clears', async () => {
      const manager = new BackgroundRefreshManager(mockCallbacks);

      manager.schedule({ id: 'task-1' });
      await vi.runAllTimersAsync();

      // clearInProgress should have been called
      expect(mockCallbacks.clearInProgress).toHaveBeenCalledWith({ id: 'task-1' });

      // Now task-1 can be scheduled again
      manager.schedule({ id: 'task-1' });

      expect(mockCallbacks.execute).toHaveBeenCalledTimes(2);
    });

    it('should clear in-progress marker even on failure', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRetryAttempts: 0, // No retries
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValueOnce(new Error('Failed'));

      manager.schedule({ id: 'task-1' });
      await vi.runAllTimersAsync();

      expect(mockCallbacks.clearInProgress).toHaveBeenCalledWith({ id: 'task-1' });
    });
  });

  describe('shouldHalt callback', () => {
    it('should stop processing when shouldHalt returns true', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRetryAttempts: 3,
        baseRetryDelayMs: 100,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute)
        .mockRejectedValueOnce(new Error('First attempt failed'));

      // After first failure, shouldHalt returns true (e.g., circuit breaker opened)
      vi.mocked(mockCallbacks.shouldHalt).mockReturnValueOnce(false).mockReturnValue(true);

      manager.schedule({ id: 'task-1' });

      await vi.runAllTimersAsync();

      // Only initial attempt should have been made
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onFailure).not.toHaveBeenCalled();
      expect(mockCallbacks.onSuccess).not.toHaveBeenCalled();
    });

    it('should check shouldHalt before each attempt', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxRetryAttempts: 5,
        baseRetryDelayMs: 100,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValue(new Error('Always fails'));

      manager.schedule({ id: 'task-1' });

      await vi.runAllTimersAsync();

      // shouldHalt is checked before each attempt (including retries)
      expect(mockCallbacks.shouldHalt).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty queue gracefully', async () => {
      const manager = new BackgroundRefreshManager(mockCallbacks);

      // Process queue with nothing in it
      expect(manager.getQueueLength()).toBe(0);
      expect(manager.getActiveCount()).toBe(0);

      // Should not throw or cause issues
      await vi.runAllTimersAsync();
    });

    it('should handle rapid task additions', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 2,
        maxQueueSize: 5,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {})
      );

      // Rapidly add many tasks
      for (let i = 1; i <= 20; i++) {
        manager.schedule({ id: `task-${i}` });
      }

      expect(manager.getActiveCount()).toBe(2);
      expect(manager.getQueueLength()).toBe(5); // Capped at maxQueueSize

      // Tasks 3-15 should have been dropped (first 2 are active, next 5 remain in queue)
      const droppedCount = vi.mocked(mockCallbacks.onDropped).mock.calls.length;
      expect(droppedCount).toBe(13); // 20 - 2 active - 5 queued = 13 dropped
    });

    it('should handle task with complex id type', async () => {
      interface ComplexId {
        key: string;
        thinkingEnabled: boolean;
      }

      const complexInProgress = new Set<string>();
      const complexCallbacks: BackgroundRefreshCallbacks<ComplexId> = {
        execute: vi.fn().mockResolvedValue(undefined),
        markInProgress: vi.fn((task: BackgroundTask<ComplexId>) => {
          const key = `${task.id.key}-${task.id.thinkingEnabled}`;
          if (complexInProgress.has(key)) {
            return false;
          }
          complexInProgress.add(key);
          return true;
        }),
        clearInProgress: vi.fn((task: BackgroundTask<ComplexId>) => {
          const key = `${task.id.key}-${task.id.thinkingEnabled}`;
          complexInProgress.delete(key);
        }),
        onSuccess: vi.fn(),
      };

      const manager = new BackgroundRefreshManager(complexCallbacks);

      manager.schedule({ id: { key: 'PROMPT_1', thinkingEnabled: true } });
      manager.schedule({ id: { key: 'PROMPT_1', thinkingEnabled: false } }); // Different id

      await vi.runAllTimersAsync();

      // Both should execute since they're different
      expect(complexCallbacks.execute).toHaveBeenCalledTimes(2);
    });

    it('should process queue when task in queue becomes no longer needed', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      vi.mocked(mockCallbacks.execute).mockImplementation(() => firstPromise);

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-2' });

      expect(manager.getQueueLength()).toBe(1);

      // Simulate task-2 already completed by another path
      // When it's dequeued, markInProgress will return false
      vi.mocked(mockCallbacks.markInProgress).mockImplementation(
        (task: BackgroundTask<string>) => {
          if (task.id === 'task-2') {
            return false; // Already completed
          }
          return true;
        }
      );

      // Add task-3 to queue
      manager.schedule({ id: 'task-3' });

      // Complete first task - should skip task-2 and process task-3
      resolveFirst!();
      await vi.runAllTimersAsync();

      // task-2 should have been skipped
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(2); // task-1 and task-3
    });

    it('should maintain correct active count after errors', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 2,
        maxRetryAttempts: 0,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockRejectedValue(new Error('Always fails'));

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-2' });

      await vi.runAllTimersAsync();

      // Both tasks failed but active count should be back to 0
      expect(manager.getActiveCount()).toBe(0);
      expect(mockCallbacks.onFailure).toHaveBeenCalledTimes(2);
    });

    it('should use setImmediate for queue processing to prevent stack overflow', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
        maxQueueSize: 50,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      // Mock setImmediate to track calls
      const originalSetImmediate = globalThis.setImmediate;
      const setImmediateSpy = vi.fn(originalSetImmediate);
      globalThis.setImmediate = setImmediateSpy as typeof setImmediate;

      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      vi.mocked(mockCallbacks.execute).mockImplementation(() => firstPromise);

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-2' });

      // Simulate task-2 no longer needed
      vi.mocked(mockCallbacks.markInProgress).mockImplementation(
        (task: BackgroundTask<string>) => task.id === 'task-1'
      );

      manager.schedule({ id: 'task-3' }); // Will also be skipped

      resolveFirst!();
      await vi.runAllTimersAsync();

      // setImmediate should have been called for recursive processing
      expect(setImmediateSpy).toHaveBeenCalled();

      globalThis.setImmediate = originalSetImmediate;
    });
  });

  describe('state getters', () => {
    it('getActiveCount should return current active tasks', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 3,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {})
      );

      expect(manager.getActiveCount()).toBe(0);

      manager.schedule({ id: 'task-1' });
      expect(manager.getActiveCount()).toBe(1);

      manager.schedule({ id: 'task-2' });
      expect(manager.getActiveCount()).toBe(2);

      manager.schedule({ id: 'task-3' });
      expect(manager.getActiveCount()).toBe(3);

      manager.schedule({ id: 'task-4' }); // Queued
      expect(manager.getActiveCount()).toBe(3);
    });

    it('getQueueLength should return pending queue size', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      vi.mocked(mockCallbacks.execute).mockImplementation(
        () => new Promise(() => {})
      );

      expect(manager.getQueueLength()).toBe(0);

      manager.schedule({ id: 'task-1' }); // Active
      expect(manager.getQueueLength()).toBe(0);

      manager.schedule({ id: 'task-2' }); // Queued
      expect(manager.getQueueLength()).toBe(1);

      manager.schedule({ id: 'task-3' }); // Queued
      expect(manager.getQueueLength()).toBe(2);
    });
  });

  describe('callback error handling', () => {
    it('should continue processing when onSuccess callback throws', async () => {
      const config: BackgroundRefreshManagerConfig = {
        maxConcurrent: 1,
      };
      const manager = new BackgroundRefreshManager(mockCallbacks, config);

      let callCount = 0;
      vi.mocked(mockCallbacks.onSuccess).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('onSuccess failed');
        }
      });

      manager.schedule({ id: 'task-1' });
      manager.schedule({ id: 'task-2' });

      await vi.runAllTimersAsync();

      // Both tasks should have been executed despite callback error
      expect(mockCallbacks.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle optional callbacks being undefined', async () => {
      const minimalCallbacks: BackgroundRefreshCallbacks<string> = {
        execute: vi.fn().mockResolvedValue(undefined),
        markInProgress: vi.fn().mockReturnValue(true),
        clearInProgress: vi.fn(),
        // No optional callbacks
      };

      const manager = new BackgroundRefreshManager(minimalCallbacks);

      manager.schedule({ id: 'task-1' });
      await vi.runAllTimersAsync();

      // Should complete without errors
      expect(minimalCallbacks.execute).toHaveBeenCalledTimes(1);
    });
  });
});
