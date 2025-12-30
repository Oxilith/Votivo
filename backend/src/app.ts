/**
 * @file app.ts
 * @purpose Express application configuration and middleware setup
 * @functionality
 * - Configures Express application with security middleware
 * - Sets up request logging with Pino
 * - Registers health checks for dependency monitoring (Anthropic, Prompt Service, Cache)
 * - Mounts API routes
 * - Configures error handling
 * @dependencies
 * - express
 * - helmet for security headers
 * - compression for response compression
 * - pino-http for request logging
 * - @/middleware for custom middleware
 * - @/routes for API routes
 * - @/health for health check registration (anthropic, prompt-service, prompt-cache)
 */

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import {
  corsMiddleware,
  rateLimiter,
  errorHandler,
  notFoundHandler,
  tracingMiddleware,
} from '@/middleware';
import routes from '@/routes';
import { logger } from '@/utils';
import {
  healthService,
  createAnthropicCheck,
  createPromptServiceCheck,
  createPromptCacheCheck,
} from '@/health';

// Register health checks
healthService.register(createAnthropicCheck());
healthService.register(createPromptServiceCheck());
healthService.register(createPromptCacheCheck());

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(corsMiddleware);

// Compression
app.use(compression());

// W3C Trace Context (before pino-http for logging integration)
app.use(tracingMiddleware);

// Request logging with trace context
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: { url?: string }) => req.url === '/health' || req.url === '/health/ready',
    },
    // Include trace context in all log entries
    customProps: (req: express.Request) => ({
      traceId: req.traceContext?.traceId,
      spanId: req.traceContext?.spanId,
    }),
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
