/**
 * @file worker/src/health/checks/scheduler.check.ts
 * @purpose Health check for scheduler status
 * @functionality
 * - Verifies scheduler is running
 * - Reports number of registered jobs
 * - Returns healthy/unhealthy status based on scheduler state
 * - Critical check (worker's primary purpose is running scheduled jobs)
 * @dependencies
 * - @/scheduler for Scheduler class
 * - @/health for HealthCheck, ComponentHealth types
 */

import type { Scheduler } from '@/scheduler';
import type { HealthCheck, ComponentHealth } from '@/health';

/**
 * Creates a scheduler health check bound to a specific scheduler instance
 */
export function createSchedulerCheck(scheduler: Scheduler): HealthCheck {
  function checkSchedulerHealth(): Promise<ComponentHealth> {
    if (!scheduler.isRunning) {
      return Promise.resolve({
        status: 'unhealthy',
        message: 'Scheduler is not running',
      });
    }

    return Promise.resolve({
      status: 'healthy',
      message: `Scheduler running with ${scheduler.jobCount} job(s): ${scheduler.jobNames.join(', ') || 'none'}`,
    });
  }

  return {
    name: 'scheduler',
    check: checkSchedulerHealth,
    critical: true, // Worker's primary purpose is scheduling
  };
}
