/**
 * @file index.ts
 * @purpose Express server entry point
 * @functionality
 * - Starts HTTP server on configured port
 * - Handles graceful shutdown
 * - Logs server startup information
 * @dependencies
 * - @/app for Express application
 * - @/config for server configuration
 * - @/utils/logger for logging
 */

import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      env: config.nodeEnv,
      corsOrigin: config.corsOrigin,
    },
    `Server started on port ${config.port}`
  );
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing server');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => { shutdown('SIGTERM'); });
process.on('SIGINT', () => { shutdown('SIGINT'); });
