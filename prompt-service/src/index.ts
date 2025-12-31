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
import pinoHttp from 'pino-http';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config';
import { apiRouter } from './routes';
import { prisma } from './prisma';
import { adminAuthMiddleware, tracingMiddleware } from './middleware';
import { logger } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Trust proxy (nginx) for correct client IP detection and rate limiting
// Required when running behind reverse proxy
app.set('trust proxy', 1);

// Security middleware with CSP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Vite module scripts
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
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

// W3C Trace Context (before pino-http for logging integration)
app.use(tracingMiddleware);

// Request logging with trace context
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: { url?: string }) => req.url === '/health',
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
app.use(express.urlencoded({ extended: true }));

// Cookie parsing with signing secret for secure session cookies
// Config validation ensures either SESSION_SECRET or ADMIN_API_KEY is set
// Defensive runtime check as a safety net for the type assertion
if (!config.sessionSecret) {
  throw new Error('FATAL: Cookie signing secret is not configured. This should not happen if config validation passed.');
}
const cookieSecret = config.sessionSecret;
// codeql[js/missing-token-validation]: CSRF protection is applied at the route level via csrfMiddleware.
// All state-changing endpoints (POST/PUT/DELETE) in user-auth.routes.ts use the double-submit cookie
// pattern implemented in middleware/csrf.middleware.ts. Global CSRF is not appropriate as it would
// block legitimate cross-origin requests to public API endpoints like /api/resolve.
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

  // SPA fallback for admin routes (Express 5 requires named wildcard parameter)
  app.get('/admin/*path', adminStaticRateLimiter, adminAuthMiddleware, (_req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });
} else {
  // Development mode - serve without auth for easier testing
  app.use('/admin', adminStaticRateLimiter, express.static(adminPath));

  // SPA fallback for admin routes (Express 5 requires named wildcard parameter)
  app.get('/admin/*path', adminStaticRateLimiter, (_req, res) => {
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
