/**
 * @file worker/src/jobs/index.ts
 * @purpose Job interface definitions and registry for background jobs
 * @functionality
 * - Defines Job and JobResult interfaces for consistent job implementation
 * - Exports all registered jobs from a central location
 * - Provides type-safe job registration for the scheduler
 * @dependencies
 * - Token cleanup job implementation
 */

/**
 * Result of a job execution
 */
export interface JobResult {
  /** Whether the job completed successfully */
  success: boolean;
  /** Human-readable message about the job result */
  message: string;
  /** Optional metrics/counts from the job */
  metrics?: Record<string, number>;
}

/**
 * Job definition interface
 * All background jobs must implement this interface
 */
export interface Job {
  /** Unique identifier for the job */
  name: string;
  /** Cron expression for job schedule (e.g., "0 * * * *" for hourly) */
  schedule: string;
  /** Whether the job is enabled */
  enabled: boolean;
  /** Execute the job and return a result */
  run: () => Promise<JobResult>;
}

// Export all registered jobs
export { tokenCleanupJob } from './token-cleanup.job';
