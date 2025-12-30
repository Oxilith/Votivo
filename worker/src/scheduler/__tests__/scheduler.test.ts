/**
 * @file src/scheduler/__tests__/scheduler.test.ts
 * @purpose Unit tests for the Scheduler class
 * @functionality
 * - Tests job registration with enabled/disabled flags
 * - Tests cron expression validation
 * - Tests job execution lifecycle and logging
 * - Tests start/stop scheduler lifecycle
 * - Tests error handling for job failures
 * @dependencies
 * - vitest for testing framework
 * - Scheduler class under test
 * - Mocked node-cron and logger
 */

import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import type { Job, JobResult } from '@/jobs';

// Mock logger with hoisting
const mockLoggerChild = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

const mockLogger = vi.hoisted(() => ({
  child: vi.fn(() => mockLoggerChild),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/utils', () => ({
  logger: mockLogger,
}));

// Mock node-cron with hoisting
type CronCallback = () => void;
const cronCallbacks: CronCallback[] = [];
const mockTask = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('node-cron', () => ({
  default: {
    validate: vi.fn((expression: string) => {
      // Basic validation - check if it looks like a cron expression
      const parts = expression.split(' ');
      return parts.length === 5 && parts.every((p) => /^[\d*,/-]+$/.test(p));
    }),
    schedule: vi.fn((_schedule: string, callback: CronCallback) => {
      cronCallbacks.push(callback);
      return mockTask;
    }),
  },
}));

import { Scheduler } from '@/scheduler';
import cron from 'node-cron';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  const createMockJob = (overrides: Partial<Job> = {}): Job => ({
    name: 'test-job',
    schedule: '0 * * * *',
    enabled: true,
    run: vi.fn().mockResolvedValue({
      success: true,
      message: 'Job completed',
      metrics: { processed: 10 },
    } as JobResult),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cronCallbacks.length = 0;
    scheduler = new Scheduler();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register()', () => {
    it('should register an enabled job and log registration', () => {
      const job = createMockJob();

      scheduler.register(job);

      expect(cron.validate).toHaveBeenCalledWith('0 * * * *');
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *',
        expect.any(Function),
        { scheduled: false }
      );
      expect(scheduler.jobCount).toBe(1);
      expect(scheduler.jobNames).toEqual(['test-job']);
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        { job: 'test-job', schedule: '0 * * * *' },
        'Job registered'
      );
    });

    it('should skip disabled jobs and log skip message', () => {
      const job = createMockJob({ enabled: false });

      scheduler.register(job);

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(scheduler.jobCount).toBe(0);
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        { job: 'test-job' },
        'Job is disabled, skipping registration'
      );
    });

    it('should skip jobs with invalid cron expressions and log error', () => {
      (cron.validate as Mock).mockReturnValueOnce(false);
      const job = createMockJob({ schedule: 'invalid-cron' });

      scheduler.register(job);

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(scheduler.jobCount).toBe(0);
      expect(mockLoggerChild.error).toHaveBeenCalledWith(
        { job: 'test-job', schedule: 'invalid-cron' },
        'Invalid cron expression, skipping registration'
      );
    });

    it('should register multiple jobs', () => {
      const job1 = createMockJob({ name: 'job-1' });
      const job2 = createMockJob({ name: 'job-2', schedule: '*/5 * * * *' });

      scheduler.register(job1);
      scheduler.register(job2);

      expect(scheduler.jobCount).toBe(2);
      expect(scheduler.jobNames).toContain('job-1');
      expect(scheduler.jobNames).toContain('job-2');
    });
  });

  describe('start()', () => {
    it('should start all registered tasks and log startup', () => {
      const job = createMockJob();
      scheduler.register(job);

      scheduler.start();

      expect(mockTask.start).toHaveBeenCalled();
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        { job: 'test-job' },
        'Job started'
      );
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        { jobCount: 1 },
        'Scheduler started'
      );
    });

    it('should start multiple tasks', () => {
      scheduler.register(createMockJob({ name: 'job-1' }));
      scheduler.register(createMockJob({ name: 'job-2' }));

      scheduler.start();

      expect(mockTask.start).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop()', () => {
    it('should stop all registered tasks and log shutdown', () => {
      const job = createMockJob();
      scheduler.register(job);

      scheduler.stop();

      expect(mockTask.stop).toHaveBeenCalled();
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        { job: 'test-job' },
        'Job stopped'
      );
      expect(mockLoggerChild.info).toHaveBeenCalledWith('Scheduler stopped');
    });
  });

  describe('jobCount getter', () => {
    it('should return 0 when no jobs are registered', () => {
      expect(scheduler.jobCount).toBe(0);
    });

    it('should return correct count after registering jobs', () => {
      scheduler.register(createMockJob({ name: 'job-1' }));
      scheduler.register(createMockJob({ name: 'job-2' }));
      scheduler.register(createMockJob({ name: 'job-3' }));

      expect(scheduler.jobCount).toBe(3);
    });
  });

  describe('jobNames getter', () => {
    it('should return empty array when no jobs are registered', () => {
      expect(scheduler.jobNames).toEqual([]);
    });

    it('should return array of registered job names', () => {
      scheduler.register(createMockJob({ name: 'cleanup-job' }));
      scheduler.register(createMockJob({ name: 'sync-job' }));

      expect(scheduler.jobNames).toEqual(['cleanup-job', 'sync-job']);
    });
  });

  describe('job execution', () => {
    // Helper to flush microtask queue for async IIFE in cron callbacks
    const flushMicrotasks = async (): Promise<void> => {
      await Promise.resolve();
      await Promise.resolve();
    };

    it('should log success with metrics when job succeeds', async () => {
      const job = createMockJob({
        run: vi.fn().mockResolvedValue({
          success: true,
          message: 'Cleanup completed',
          metrics: { deleted: 5 },
        }),
      });
      scheduler.register(job);

      // Execute the cron callback (sync) and flush async operations
      cronCallbacks[0]?.();
      await flushMicrotasks();

      expect(job.run).toHaveBeenCalled();
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        expect.objectContaining({
          job: 'test-job',
          traceId: expect.any(String) as unknown,
          spanId: expect.any(String) as unknown,
        }),
        'Job started'
      );
      expect(mockLoggerChild.info).toHaveBeenCalledWith(
        expect.objectContaining({
          job: 'test-job',
          traceId: expect.any(String) as unknown,
          spanId: expect.any(String) as unknown,
          duration: expect.any(Number) as unknown,
          deleted: 5,
        }),
        'Cleanup completed'
      );
    });

    it('should log error when job returns success=false', async () => {
      const job = createMockJob({
        run: vi.fn().mockResolvedValue({
          success: false,
          message: 'Cleanup failed: connection error',
          metrics: { deleted: 0 },
        }),
      });
      scheduler.register(job);

      cronCallbacks[0]?.();
      await flushMicrotasks();

      expect(mockLoggerChild.error).toHaveBeenCalledWith(
        expect.objectContaining({
          job: 'test-job',
          traceId: expect.any(String) as unknown,
          spanId: expect.any(String) as unknown,
          duration: expect.any(Number) as unknown,
          deleted: 0,
        }),
        'Cleanup failed: connection error'
      );
    });

    it('should catch and log unhandled errors from job.run()', async () => {
      const testError = new Error('Database connection failed');
      const job = createMockJob({
        run: vi.fn().mockRejectedValue(testError),
      });
      scheduler.register(job);

      cronCallbacks[0]?.();
      await flushMicrotasks();

      expect(mockLoggerChild.error).toHaveBeenCalledWith(
        expect.objectContaining({
          job: 'test-job',
          traceId: expect.any(String) as unknown,
          spanId: expect.any(String) as unknown,
          duration: expect.any(Number) as unknown,
          error: 'Database connection failed',
        }),
        'Job failed with unhandled error'
      );
    });

    it('should handle non-Error thrown objects', async () => {
      const job = createMockJob({
        run: vi.fn().mockRejectedValue('string error'),
      });
      scheduler.register(job);

      cronCallbacks[0]?.();
      await flushMicrotasks();

      expect(mockLoggerChild.error).toHaveBeenCalledWith(
        expect.objectContaining({
          job: 'test-job',
          error: 'Unknown error',
        }),
        'Job failed with unhandled error'
      );
    });
  });
});
