/**
 * @file worker/src/health/health-server.ts
 * @purpose Minimal HTTP server for health endpoint
 * @functionality
 * - Creates lightweight HTTP server for /health endpoint
 * - Returns JSON health check result
 * - Supports graceful shutdown
 * - Logs server startup and shutdown events
 * @dependencies
 * - node:http for HTTP server
 * - @/health/health-service for health evaluation
 * - @/utils/logger for structured logging
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { healthService } from './health-service';
import { logger } from '@/utils';

const log = logger.child({ component: 'health-server' });

let server: Server | null = null;

/**
 * Start the health check HTTP server
 */
export function startHealthServer(port: number): void {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Only handle /health endpoint
    if (req.url === '/health' && req.method === 'GET') {
      void (async () => {
        try {
          const result = await healthService.evaluate();
          const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          log.error({ error }, 'Health check evaluation failed');
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'unhealthy', error: 'Health check failed' }));
        }
      })();
    } else {
      // Return 404 for all other endpoints
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(port, () => {
    log.info({ port }, 'Health server started');
  });

  server.on('error', (error) => {
    log.error({ error }, 'Health server error');
  });
}

/**
 * Stop the health check HTTP server
 */
export async function stopHealthServer(): Promise<void> {
  if (server) {
    return new Promise((resolve) => {
      server?.close(() => {
        log.info('Health server stopped');
        server = null;
        resolve();
      });
    });
  }
}
