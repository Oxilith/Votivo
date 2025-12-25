/**
 * @file prompt-service/src/index.ts
 * @purpose Express server entry point for the prompt management microservice
 * @functionality
 * - Initializes Express application with middleware
 * - Configures CORS, CSP security headers, and logging
 * - Mounts API routes and admin UI static files
 * - Protects admin UI with HttpOnly cookie authentication in production
 * - Provides health check endpoint with database verification
 * - Handles graceful shutdown
 * @dependencies
 * - express for HTTP server
 * - helmet for security headers with CSP
 * - cors for cross-origin requests
 * - cookie-parser for signed HttpOnly session cookies
 * - pino-http for request logging
 * - @/config for configuration
 * - @/routes for API routes
 * - @/middleware/admin-auth.middleware for admin authentication
 * - express-rate-limit for rate limiting static admin routes
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '@/config/index.js';
import { apiRouter } from '@/routes/index.js';
import { prisma } from '@/prisma/client.js';
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize logger
const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// Initialize Express app
const app = express();

// Security middleware with CSP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Compression
app.use(compression());

// Request logging
app.use(
  // @ts-expect-error - pino-http types have ESM interop issues
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: { url?: string }) => req.url === '/health',
    },
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing with signing secret for secure session cookies
const cookieSecret = config.sessionSecret ?? config.adminApiKey ?? 'dev-secret-key';
app.use(cookieParser(cookieSecret));

// Health check endpoint with database connectivity verification
app.get('/health', (_req, res) => {
  prisma.$queryRaw`SELECT 1`
    .then(() => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'prompt-service',
        database: 'connected',
      });
    })
    .catch((error: unknown) => {
      logger.error({ error }, 'Database health check failed');
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'prompt-service',
        database: 'disconnected',
        error: config.nodeEnv === 'production' ? 'Database unavailable' : String(error),
      });
    });
});

// API routes
app.use('/api', apiRouter);

// Serve admin UI static files
const adminPath = path.join(__dirname, 'admin');

// Rate limiter for admin static files
const adminStaticRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes
  message: { error: 'Too many requests to admin UI, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

if (config.nodeEnv === 'production') {
  // Protected admin UI in production with rate limiting
  app.use('/admin', adminStaticRateLimiter, adminAuthMiddleware, express.static(adminPath));

  // SPA fallback for admin routes
  app.get('/admin/*', adminStaticRateLimiter, adminAuthMiddleware, (_req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });
} else {
  // Development mode - serve without auth for easier testing
  app.use('/admin', adminStaticRateLimiter, express.static(adminPath));

  // SPA fallback for admin routes
  app.get('/admin/*', adminStaticRateLimiter, (_req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });
}

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    });
  }
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Prompt service listening on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  if (config.nodeEnv !== 'production') {
    logger.info(`Admin UI available at http://localhost:${config.port}/admin`);
    logger.info(`API available at http://localhost:${config.port}/api`);
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  await prisma.$disconnect();
  logger.info('Database connection closed');

  process.exit(0);
};

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

export { app, logger };
