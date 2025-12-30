/**
 * @file worker/src/scheduler/index.ts
 * @purpose Generic job scheduler wrapper using node-cron
 * @functionality
 * - Registers jobs with cron schedules
 * - Manages job lifecycle (start, stop)
 * - Provides structured logging for job execution with W3C trace context
 * - Handles graceful shutdown
 * @dependencies
 * - node-cron for cron scheduling
 * - shared/index for W3C tracing utilities
 * - @/jobs for Job interface
 * - @/utils/logger for structured logging
 */

import cron from 'node-cron';
import { generateTraceId, generateSpanId } from 'shared';
import type { Job } from '@/jobs';
import { logger } from '@/utils';

/**
 * Scheduler class for managing background jobs
 */
export class Scheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private log = logger.child({ component: 'scheduler' });

  /**
   * Register a job with the scheduler
   * Jobs that are disabled will not be scheduled
   *
   * @param job - Job definition to register
   */
  register(job: Job): void {
    if (!job.enabled) {
      this.log.info({ job: job.name }, 'Job is disabled, skipping registration');
      return;
    }

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      this.log.error(
        { job: job.name, schedule: job.schedule },
        'Invalid cron expression, skipping registration'
      );
      return;
    }

    const task = cron.schedule(
      job.schedule,
      () => {
        void (async () => {
          // Each job execution gets its own trace context
          const traceId = generateTraceId();
          const spanId = generateSpanId();
          const startTime = Date.now();

          this.log.info({ job: job.name, traceId, spanId }, 'Job started');

          try {
            const result = await job.run();
            const duration = Date.now() - startTime;

            if (result.success) {
              this.log.info(
                {
                  job: job.name,
                  traceId,
                  spanId,
                  duration,
                  ...result.metrics,
                },
                result.message
              );
            } else {
              this.log.error(
                {
                  job: job.name,
                  traceId,
                  spanId,
                  duration,
                  ...result.metrics,
                },
                result.message
              );
            }
          } catch (error) {
            const duration = Date.now() - startTime;
            this.log.error(
              {
                job: job.name,
                traceId,
                spanId,
                duration,
                error: error instanceof Error ? error.message : 'Unknown error',
              },
              'Job failed with unhandled error'
            );
          }
        })();
      },
      {
        scheduled: false, // Don't start immediately, wait for start() call
      }
    );

    this.tasks.set(job.name, task);
    this.log.info({ job: job.name, schedule: job.schedule }, 'Job registered');
  }

  /**
   * Start all registered jobs
   */
  start(): void {
    this.tasks.forEach((task, name) => {
      task.start();
      this.log.info({ job: name }, 'Job started');
    });
    this.log.info({ jobCount: this.tasks.size }, 'Scheduler started');
  }

  /**
   * Stop all registered jobs
   */
  stop(): void {
    this.tasks.forEach((task, name) => {
      task.stop();
      this.log.info({ job: name }, 'Job stopped');
    });
    this.log.info('Scheduler stopped');
  }

  /**
   * Get the number of registered jobs
   */
  get jobCount(): number {
    return this.tasks.size;
  }

  /**
   * Get list of registered job names
   */
  get jobNames(): string[] {
    return Array.from(this.tasks.keys());
  }
}
