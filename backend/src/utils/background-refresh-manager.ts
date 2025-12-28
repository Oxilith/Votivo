/**
 * @file utils/background-refresh-manager.ts
 * @purpose Reusable background task manager with queue management and retry logic
 * @functionality
 * - Manages a queue of background tasks with concurrency limits
 * - Provides exponential backoff retry with configurable attempts/delays
 * - Enforces overall timeout for long-running operations
 * - Prevents duplicate tasks via deduplication callbacks
 * - Processes queue automatically when slots become available
 * @dependencies
 * - None (pure utility)
 */

/**
 * Configuration options for BackgroundRefreshManager
 */
export interface BackgroundRefreshManagerConfig {
  /**
   * Maximum number of tasks that can run concurrently
   * @default 3
   */
  maxConcurrent?: number;

  /**
   * Maximum number of retry attempts per task
   * @default 5
   */
  maxRetryAttempts?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 10000
   */
  maxRetryDelayMs?: number;

  /**
   * Base delay for exponential backoff in milliseconds
   * Actual delay is: min(baseRetryDelayMs * 2^attempt, maxRetryDelayMs)
   * @default 1000
   */
  baseRetryDelayMs?: number;

  /**
   * Maximum duration for the entire retry cycle in milliseconds
   * If exceeded, the task is abandoned
   * @default 60000
   */
  maxRefreshDurationMs?: number;

  /**
   * Maximum number of tasks that can be queued
   * When exceeded, oldest tasks are dropped
   * @default 100
   */
  maxQueueSize?: number;
}

/**
 * Task definition for the background refresh manager
 * @template T The task identifier type
 */
export interface BackgroundTask<T> {
  /**
   * Unique identifier for the task (used for deduplication)
   */
  id: T;
}

/**
 * Callbacks provided by the consumer to integrate with the refresh manager
 * @template T The task identifier type
 */
export interface BackgroundRefreshCallbacks<T> {
  /**
   * Called when a task should be executed
   * @param task The task to execute
   * @returns Promise that resolves on success, rejects on failure
   */
  execute: (task: BackgroundTask<T>) => Promise<void>;

  /**
   * Called to mark a task as in-progress (for deduplication)
   * @param task The task to mark
   * @returns true if the task was successfully marked (not already in progress), false otherwise
   */
  markInProgress: (task: BackgroundTask<T>) => boolean;

  /**
   * Called to clear the in-progress marker for a task
   * @param task The task to clear
   */
  clearInProgress: (task: BackgroundTask<T>) => void;

  /**
   * Called to check if the manager should stop processing (e.g., circuit breaker is open)
   * @returns true if processing should be halted
   */
  shouldHalt?: () => boolean;

  /**
   * Called when a task completes successfully
   * @param task The completed task
   */
  onSuccess?: (task: BackgroundTask<T>) => void;

  /**
   * Called when a task fails after all retry attempts
   * @param task The failed task
   * @param attempts Number of attempts made
   */
  onFailure?: (task: BackgroundTask<T>, attempts: number) => void;

  /**
   * Called when a task times out (exceeds maxRefreshDurationMs)
   * @param task The timed out task
   * @param durationMs Actual duration before timeout
   */
  onTimeout?: (task: BackgroundTask<T>, durationMs: number) => void;

  /**
   * Called when a task is dropped from the queue due to size limits
   * @param task The dropped task
   */
  onDropped?: (task: BackgroundTask<T>) => void;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<BackgroundRefreshManagerConfig> = {
  maxConcurrent: 3,
  maxRetryAttempts: 5,
  maxRetryDelayMs: 10000,
  baseRetryDelayMs: 1000,
  maxRefreshDurationMs: 60000,
  maxQueueSize: 100,
};

/**
 * Manages background refresh tasks with queue management, concurrency limits,
 * and exponential backoff retry logic.
 *
 * @template T The task identifier type
 *
 * @example
 * ```typescript
 * interface CacheKey { key: string; thinkingEnabled: boolean }
 *
 * const manager = new BackgroundRefreshManager<CacheKey>({
 *   execute: async (task) => {
 *     await refreshCache(task.id.key, task.id.thinkingEnabled);
 *   },
 *   markInProgress: (task) => cacheService.markRefreshInProgress(task.id.key, task.id.thinkingEnabled),
 *   clearInProgress: (task) => cacheService.clearRefreshInProgress(task.id.key, task.id.thinkingEnabled),
 *   shouldHalt: () => circuitBreaker.opened,
 * });
 *
 * // Schedule a background refresh
 * manager.schedule({ id: { key: 'PROMPT_KEY', thinkingEnabled: true } });
 * ```
 */
export class BackgroundRefreshManager<T> {
  private readonly config: Required<BackgroundRefreshManagerConfig>;
  private readonly callbacks: BackgroundRefreshCallbacks<T>;
  private activeCount = 0;
  private readonly pendingQueue: BackgroundTask<T>[] = [];

  constructor(
    callbacks: BackgroundRefreshCallbacks<T>,
    config?: BackgroundRefreshManagerConfig
  ) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Schedules a task for background execution
   * The task will be executed immediately if slots are available,
   * or queued for later processing
   *
   * @param task The task to schedule
   */
  schedule(task: BackgroundTask<T>): void {
    // Prevent duplicate tasks via the markInProgress callback
    if (!this.callbacks.markInProgress(task)) {
      return;
    }

    // Check if we can start immediately or need to queue
    if (this.activeCount < this.config.maxConcurrent) {
      void this.executeTask(task);
    } else {
      this.enqueue(task);
    }
  }

  /**
   * Gets the current number of actively running tasks
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Gets the current number of tasks waiting in the queue
   */
  getQueueLength(): number {
    return this.pendingQueue.length;
  }

  /**
   * Adds a task to the pending queue, dropping oldest if at capacity
   */
  private enqueue(task: BackgroundTask<T>): void {
    if (this.pendingQueue.length >= this.config.maxQueueSize) {
      const dropped = this.pendingQueue.shift();
      if (dropped) {
        this.callbacks.onDropped?.(dropped);
      }
    }
    this.pendingQueue.push(task);
  }

  /**
   * Executes a task with retry logic
   */
  private async executeTask(task: BackgroundTask<T>): Promise<void> {
    // Defensive check: ensure we're within limits even if called unexpectedly
    if (this.activeCount >= this.config.maxConcurrent) {
      this.enqueue(task);
      return;
    }

    this.activeCount++;
    const startTime = Date.now();

    try {
      await this.retryTask(task, 0, startTime);
    } finally {
      this.completeTask(task);
    }
  }

  /**
   * Recursive retry logic with exponential backoff and overall timeout
   */
  private async retryTask(
    task: BackgroundTask<T>,
    attempt: number,
    startTime: number
  ): Promise<void> {
    // Check overall timeout first
    const elapsed = Date.now() - startTime;
    if (elapsed > this.config.maxRefreshDurationMs) {
      this.callbacks.onTimeout?.(task, elapsed);
      return;
    }

    // Apply exponential backoff delay (skip on first attempt)
    if (attempt > 0) {
      const delay = this.calculateBackoffDelay(attempt);
      await this.sleep(delay);
    }

    // Check if we should halt (e.g., circuit breaker is open)
    if (this.callbacks.shouldHalt?.()) {
      return;
    }

    try {
      await this.callbacks.execute(task);
      this.callbacks.onSuccess?.(task);
    } catch {
      if (attempt < this.config.maxRetryAttempts) {
        await this.retryTask(task, attempt + 1, startTime);
      } else {
        this.callbacks.onFailure?.(task, attempt + 1);
      }
    }
  }

  /**
   * Calculates exponential backoff delay for a given attempt
   * @param attempt The current attempt number (1-based for delay calculation)
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: base * 2^(attempt-1), capped at max
    const exponentialDelay = this.config.baseRetryDelayMs * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, this.config.maxRetryDelayMs);
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Completes a task and processes the next queued task
   */
  private completeTask(task: BackgroundTask<T>): void {
    this.activeCount--;
    this.callbacks.clearInProgress(task);
    this.processQueue();
  }

  /**
   * Processes the next task in the queue if slots are available
   * Uses setImmediate for recursive calls to prevent stack overflow
   */
  private processQueue(): void {
    if (this.pendingQueue.length === 0) {
      return;
    }

    if (this.activeCount < this.config.maxConcurrent) {
      const nextTask = this.pendingQueue.shift();
      if (nextTask) {
        // Re-check if task is still needed (might have been completed by another path)
        if (this.callbacks.markInProgress(nextTask)) {
          void this.executeTask(nextTask);
        } else {
          // Task no longer needed, process next using setImmediate to prevent stack overflow
          setImmediate(() => {
            this.processQueue();
          });
        }
      }
    }
  }
}
