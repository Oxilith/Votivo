/**
 * @file app.ts
 * @purpose Express application configuration and middleware setup
 * @functionality
 * - Configures Express application with security middleware
 * - Sets up request logging with Pino
 * - Mounts API routes
 * - Configures error handling
 * @dependencies
 * - express
 * - helmet for security headers
 * - compression for response compression
 * - pino-http for request logging
 * - @/middleware for custom middleware
 * - @/routes for API routes
 */

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { corsMiddleware, rateLimiter, errorHandler, notFoundHandler } from './middleware/index.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(corsMiddleware);

// Compression
app.use(compression());

// Request logging
app.use(
  // @ts-expect-error - pino-http types have ESM interop issues
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: { url?: string }) => req.url === '/health' || req.url === '/api/v1/health',
    },
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiting
app.use(rateLimiter);

// API routes
app.use(routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
