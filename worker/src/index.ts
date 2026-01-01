/**
 * @file worker/src/index.ts
 * @purpose Entry point for the background worker microservice
 * @functionality
 * - Initializes the scheduler with registered jobs
 * - Starts health check HTTP server for Docker monitoring
 * - Handles graceful shutdown on SIGTERM/SIGINT
 * - Logs worker startup and shutdown events
 * @dependencies
 * - @/scheduler for job scheduling
 * - @/jobs for job definitions
 * - @/utils/logger for structured logging
 * - @/prisma/client for database connection
 * - @/health for health checks and HTTP server
 * - @/config for configuration
 */

import { Scheduler } from './scheduler';
import { tokenCleanupJob } from './jobs';
import { logger } from './utils';
import { prisma } from './prisma/client';
import {
  healthService,
  startHealthServer,
  stopHealthServer,
  createDatabaseCheck,
  createSchedulerCheck,
} from './health';
import { config } from './config';

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

  // Register health checks
  healthService.register(createDatabaseCheck());
  healthService.register(createSchedulerCheck(scheduler));

  // Start health server
  startHealthServer(config.healthPort);

  log.info(
    {
      jobs: scheduler.jobNames,
      jobCount: scheduler.jobCount,
      healthPort: config.healthPort,
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

  // Stop health server
  await stopHealthServer();

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
