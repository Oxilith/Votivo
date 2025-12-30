/**
 * @file worker/src/index.ts
 * @purpose Entry point for the background worker microservice
 * @functionality
 * - Initializes the scheduler with registered jobs
 * - Handles graceful shutdown on SIGTERM/SIGINT
 * - Logs worker startup and shutdown events
 * @dependencies
 * - @/scheduler for job scheduling
 * - @/jobs for job definitions
 * - @/utils/logger for structured logging
 * - @/prisma/client for database connection
 */

import { Scheduler } from './scheduler';
import { tokenCleanupJob } from './jobs';
import { logger } from './utils';
import { prisma } from './prisma';

const log = logger.child({ component: 'main' });

// Create scheduler instance
const scheduler = new Scheduler();

/**
 * Initialize and start the worker
 */
async function main(): Promise<void> {
  log.info('Worker starting...');

  // Test database connection
  try {
    await prisma.$connect();
    log.info('Database connection established');
  } catch (error) {
    log.error({ error }, 'Failed to connect to database');
    process.exit(1);
  }

  // Register jobs
  scheduler.register(tokenCleanupJob);

  // Start the scheduler
  scheduler.start();

  log.info(
    {
      jobs: scheduler.jobNames,
      jobCount: scheduler.jobCount,
    },
    'Worker started successfully'
  );
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  log.info({ signal }, 'Received shutdown signal');

  // Stop the scheduler
  scheduler.stop();

  // Disconnect from database
  await prisma.$disconnect();
  log.info('Database disconnected');

  log.info('Worker shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error({ error }, 'Uncaught exception');
  shutdown('uncaughtException').catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled rejection');
  shutdown('unhandledRejection').catch(() => process.exit(1));
});

// Start the worker
main().catch((error: unknown) => {
  log.error({ error }, 'Worker failed to start');
  process.exit(1);
});
