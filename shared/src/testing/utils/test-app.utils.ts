/**
 * @file shared/src/testing/utils/test-app.utils.ts
 * @purpose Factory utilities for creating Express apps in integration tests
 * @functionality
 * - Creates minimal Express apps with configurable middleware
 * - Provides supertest request builder factory
 * - Supports both authenticated and unauthenticated requests
 * @dependencies
 * - express for app creation
 * - supertest for HTTP testing
 */

import express, { type Express, type RequestHandler, type ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import type { Test } from 'supertest';
import request from 'supertest';

export interface TestAppOptions {
  /** Middleware to apply before routes */
  middleware?: RequestHandler[];
  /** Routes to mount */
  routes?: { path: string; router: express.Router }[];
  /** Whether to parse JSON bodies (default: true) */
  parseJson?: boolean;
  /** Whether to parse cookies (default: true) */
  parseCookies?: boolean;
  /** Cookie signing secret (default: 'test-secret-at-least-32-characters-long') */
  cookieSecret?: string;
  /** Custom error handler */
  errorHandler?: ErrorRequestHandler;
}

/**
 * Creates a minimal Express app for integration testing.
 * Does NOT include rate limiting, helmet, or production middleware.
 */
export function createTestApp(options: TestAppOptions = {}): Express {
  const {
    middleware = [],
    routes = [],
    parseJson = true,
    parseCookies = true,
    cookieSecret = 'test-secret-at-least-32-characters-long',
    errorHandler,
  } = options;

  const app = express();

  // Trust proxy for IP detection
  app.set('trust proxy', 1);

  // Basic parsing
  if (parseJson) {
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
  }

  if (parseCookies) {
    app.use(cookieParser(cookieSecret));
  }

  // Apply custom middleware
  middleware.forEach((mw) => app.use(mw));

  // Mount routes
  routes.forEach(({ path, router }) => app.use(path, router));

  // Default error handler
  const defaultErrorHandler: ErrorRequestHandler = (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const statusCode = 'statusCode' in err && typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;
    res.status(statusCode).json({
      error: err.message,
      code: 'code' in err ? err.code : undefined,
    });
  };

  app.use(errorHandler ?? defaultErrorHandler);

  return app;
}

/**
 * Creates a supertest request instance for an Express app.
 */
export function createTestRequest(app: Express) {
  return request(app);
}

/**
 * Creates a supertest agent that maintains cookies between requests.
 */
export function createTestAgent(app: Express) {
  return request.agent(app);
}

/**
 * Authenticated request builder for protected endpoints.
 */
export interface AuthenticatedRequestBuilder {
  get: (url: string) => Test;
  post: (url: string) => Test;
  put: (url: string) => Test;
  delete: (url: string) => Test;
  patch: (url: string) => Test;
}

/**
 * Creates an authenticated request builder that automatically
 * adds Authorization header and CSRF token to requests.
 */
export function createAuthenticatedRequest(
  app: Express,
  accessToken: string,
  csrfToken?: string
): AuthenticatedRequestBuilder {
  const agent = request(app);

  const withAuth = (req: Test): Test => {
    req.set('Authorization', `Bearer ${accessToken}`);
    if (csrfToken) {
      req.set('x-csrf-token', csrfToken);
      req.set('Cookie', `csrf-token=${csrfToken}`);
    }
    return req;
  };

  return {
    get: (url: string): Test => withAuth(agent.get(url)),
    post: (url: string): Test => withAuth(agent.post(url)),
    put: (url: string): Test => withAuth(agent.put(url)),
    delete: (url: string): Test => withAuth(agent.delete(url)),
    patch: (url: string): Test => withAuth(agent.patch(url)),
  };
}
