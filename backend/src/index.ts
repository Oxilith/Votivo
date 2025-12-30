/**
 * @file index.ts
 * @purpose Express server entry point
 * @functionality
 * - Runs startup health checks before starting server
 * - Starts HTTP or HTTPS server on configured port
 * - Handles graceful shutdown with circuit breaker cleanup
 * - Logs server startup information
 * @dependencies
 * - @/app for Express application
 * - @/config for server configuration
 * - @/utils/logger for logging
 * - @/health for health service
 * - @/services/circuit-breaker.service for destroyAllCircuitBreakers
 * - https for HTTPS server
 * - fs for reading certificates
 * - path for resolving certificate paths
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import app from './app';
import { config } from './config';
import { logger } from './utils';
import { healthService } from './health';
import { destroyAllCircuitBreakers } from './services';

async function startServer(): Promise<void> {
  // Run startup health checks
  logger.info('Running startup health checks...');
  const { success, results } = await healthService.runStartupChecks();

  // Log health check results
  for (const [name, result] of Object.entries(results)) {
    if (result.status === 'healthy') {
      logger.info(
        { check: name, latencyMs: result.latencyMs },
        `Health check passed: ${result.message}`
      );
    } else {
      logger.error(
        { check: name, latencyMs: result.latencyMs },
        `Health check failed: ${result.message}`
      );
    }
  }

  if (!success) {
    logger.error('Critical health checks failed, server will not start');
    process.exit(1);
  }

  logger.info('All startup health checks passed');

  // Create HTTP or HTTPS server based on config
  let server;
  const protocol = config.httpsEnabled ? 'https' : 'http';

  if (config.httpsEnabled) {
    const keyPath = path.resolve(process.cwd(), config.httpsKeyPath);
    const certPath = path.resolve(process.cwd(), config.httpsCertPath);

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      logger.warn(
        { keyPath, certPath },
        'HTTPS certificates not found, falling back to HTTP. Run mkcert to generate certificates.'
      );
      server = app.listen(config.port, () => {
        logger.info(
          {
            port: config.port,
            env: config.nodeEnv,
            corsOrigin: config.corsOrigin,
            protocol: 'http',
          },
          `Server started on http://localhost:${config.port}`
        );
      });
    } else {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      server = https.createServer(httpsOptions, app).listen(config.port, () => {
        logger.info(
          {
            port: config.port,
            env: config.nodeEnv,
            corsOrigin: config.corsOrigin,
            protocol: 'https',
          },
          `Server started on https://localhost:${config.port}`
        );
      });
    }
  } else {
    server = app.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.nodeEnv,
          corsOrigin: config.corsOrigin,
          protocol,
        },
        `Server started on ${protocol}://localhost:${config.port}`
      );
    });
  }

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, closing server');

    // Clean up circuit breakers to prevent event listener memory leaks
    destroyAllCircuitBreakers();
    logger.info('Circuit breakers destroyed');

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

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

startServer().catch((error: unknown) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
