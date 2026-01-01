/**
 * @file prompt-service/src/testing/integration-setup.ts
 * @purpose Integration test infrastructure for prompt-service with database lifecycle management
 * @functionality
 * - Creates Express app for integration testing (without rate limiting)
 * - Provides database setup and cleanup hooks with availability checking
 * - Provides requireDatabase() hook that fails tests with migration instructions
 * - Creates authenticated request builders with JWT tokens
 * - Manages test user creation and cleanup
 * - Extracts CSRF tokens from response cookies
 * - Provides shared test fixtures (validAssessmentResponses)
 * - Gracefully skips tests when database unavailable (via setup())
 * - Exports AUTH_ENDPOINTS, AUTH_HEADERS, and bearerToken() for test constants
 * - Provides 404 handler for unknown routes
 * - Uses type-safe error handling with isAppError type guard
 * @dependencies
 * - express for app creation
 * - cookie-parser for signed cookies
 * - @/routes for API routes
 * - @/middleware for tracing
 * - @/errors for isAppError type guard
 * - shared/testing for database utilities
 */
 
import express, { type Express, type ErrorRequestHandler, type RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import type { Test } from 'supertest';
import request from 'supertest';
import type { AssessmentResponses } from '@votive/shared';
import { apiRouter } from '@/routes';
import { tracingMiddleware } from '@/middleware';
import { isAppError } from '@/errors';
import {
  cleanupTestDb,
  setTestPrisma,
  checkDatabaseAvailable,
} from '@votive/shared/testing';
import { prisma } from '@/prisma';

/** Response type for register endpoint */
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
}

/** Response type for login endpoint */
interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
}

/** Test environment configuration */
export const TEST_CONFIG = {
  cookieSecret: 'test-secret-at-least-32-characters-long',
  jwtAccessSecret: 'test-jwt-access-secret-at-least-32-chars',
  jwtRefreshSecret: 'test-jwt-refresh-secret-at-least-32-chars',
} as const;

/**
 * API endpoint paths for user authentication.
 * Centralizes endpoint URLs to avoid magic strings in tests.
 */
export const AUTH_ENDPOINTS = {
  register: '/api/user-auth/register',
  login: '/api/user-auth/login',
  logout: '/api/user-auth/logout',
  logoutAll: '/api/user-auth/logout-all',
  refresh: '/api/user-auth/refresh',
  refreshWithUser: '/api/user-auth/refresh-with-user',
  passwordReset: '/api/user-auth/password-reset',
  passwordResetConfirm: '/api/user-auth/password-reset/confirm',
  verifyEmail: '/api/user-auth/verify-email',
  resendVerification: '/api/user-auth/resend-verification',
  me: '/api/user-auth/me',
  profile: '/api/user-auth/profile',
  password: '/api/user-auth/password',
  account: '/api/user-auth/account',
  assessment: '/api/user-auth/assessment',
  analysis: '/api/user-auth/analysis',
  analyses: '/api/user-auth/analyses',
} as const;

/**
 * HTTP header names used in authentication.
 * Centralizes header names to avoid magic strings in tests.
 */
export const AUTH_HEADERS = {
  authorization: 'Authorization',
  csrfToken: 'x-csrf-token',
  csrfCookie: 'csrf-token',
} as const;

/**
 * Creates the Authorization header value with Bearer prefix.
 * @param token - The JWT access token
 * @returns The formatted Authorization header value
 */
export function bearerToken(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Creates a minimal Express app for integration testing.
 * Does NOT include rate limiting, helmet, or compression.
 */
export function createIntegrationTestApp(): Express {
  const app = express();

  // Trust proxy for IP detection
  app.set('trust proxy', 1);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Cookie parsing with test secret
  app.use(cookieParser(TEST_CONFIG.cookieSecret));

  // Tracing middleware
  app.use(tracingMiddleware);

  // Mount API routes (without rate limiting for tests)
  app.use('/api', apiRouter);

  // 404 handler - must be after all routes, before error handler
  const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  };

  app.use(notFoundHandler);

  // Error handler with type-safe error detection
  const errorHandler: ErrorRequestHandler = (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    // Use type guard for AppError instances
    if (isAppError(err)) {
      res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    // Fallback for generic errors
    const genericErr = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      error: genericErr.message,
    });
  };

  app.use(errorHandler);

  return app;
}

/**
 * Creates a supertest agent that maintains cookies between requests.
 * Use this for flows that require session continuity (login, CSRF tokens).
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

// Module-level state for database availability
let _databaseAvailable = false;

/**
 * Integration test lifecycle hooks.
 * Use these in your test file's beforeAll/beforeEach/afterAll.
 */
export const integrationTestHooks = {
  /**
   * Call in beforeAll to check database and register Prisma instance.
   * Returns whether the database is available.
   */
  async setup(): Promise<boolean> {
    _databaseAvailable = await checkDatabaseAvailable(prisma);
    if (_databaseAvailable) {
      setTestPrisma(prisma);
    }
    return _databaseAvailable;
  },

  /**
   * Call in beforeAll to require database availability.
   * Throws an error with migration instructions if database is not available.
   * Use this when tests MUST have database access and should not silently skip.
   *
   * @throws Error with migration instructions if database unavailable
   *
   * @example
   * ```typescript
   * beforeAll(async () => {
   *   await integrationTestHooks.requireDatabase();
   * });
   * ```
   */
  async requireDatabase(): Promise<void> {
    const available = await this.setup();
    if (!available) {
      throw new Error(
        'Integration tests require a database with migrations applied.\n' +
        'Run: npm run db:migrate -w prompt-service\n' +
        'Then re-run the tests.'
      );
    }
  },

  /**
   * Call in beforeEach to clean up database for test isolation.
   */
  async cleanup(): Promise<void> {
    if (_databaseAvailable) {
      await cleanupTestDb();
    }
  },

  /**
   * Call in afterAll to disconnect from database.
   * Uses try-finally to ensure disconnect runs even if cleanup fails.
   */
  async teardown(): Promise<void> {
    try {
      if (_databaseAvailable) {
        await cleanupTestDb();
      }
    } finally {
      await prisma.$disconnect();
    }
  },

  /**
   * Returns whether the database is available for testing.
   */
  isDatabaseAvailable(): boolean {
    return _databaseAvailable;
  },
};

/**
 * Registers a user and returns access token and CSRF token.
 * Useful for setting up authenticated test scenarios.
 */
export async function registerTestUser(
  app: Express,
  userData: {
    email: string;
    password: string;
    name: string;
    birthYear?: number;
    gender?: string;
  }
) {
  const response = await request(app)
    .post('/api/user-auth/register')
    .send({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      birthYear: userData.birthYear ?? 1990,
      gender: userData.gender ?? 'prefer-not-to-say',
    });

  if (response.status !== 201) {
    throw new Error(
      `Failed to register test user (${userData.email}): ` +
      `Status ${response.status} - ${JSON.stringify(response.body)}`
    );
  }

  // Extract CSRF token from response cookies
  const csrfToken = extractCsrfToken(response.headers['set-cookie']);
  const body = response.body as RegisterResponse;

  return {
    user: body.user,
    accessToken: body.accessToken,
    csrfToken,
  };
}

/**
 * Logs in a user and returns access token and CSRF token.
 */
export async function loginTestUser(
  app: Express,
  credentials: { email: string; password: string }
) {
  const response = await request(app)
    .post('/api/user-auth/login')
    .send(credentials);

  if (response.status !== 200) {
    throw new Error(
      `Failed to login test user (${credentials.email}): ` +
      `Status ${response.status} - ${JSON.stringify(response.body)}`
    );
  }

  // Extract CSRF token from response cookies
  const csrfToken = extractCsrfToken(response.headers['set-cookie']);
  const body = response.body as LoginResponse;

  return {
    user: body.user,
    accessToken: body.accessToken,
    csrfToken,
  };
}

/**
 * Extracts CSRF token from Set-Cookie header(s).
 * Logs debug info if token is not found to aid test troubleshooting.
 * Exported for use in tests that need to extract tokens manually.
 */
export function extractCsrfToken(
  setCookieHeader: string | string[] | undefined
): string | undefined {
  if (!setCookieHeader) {
    console.debug('[extractCsrfToken] No Set-Cookie header present');
    return undefined;
  }

  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const cookie of cookies) {
    if (cookie.startsWith('csrf-token=')) {
      // Use regex to handle tokens containing '=' (common in base64)
      const tokenPart = cookie.split(';')[0];
      // RegExp.prototype.exec is preferred by ESLint over String.prototype.match
      const csrfRegex = /csrf-token=(.+)/;
      const match = csrfRegex.exec(tokenPart);
      return match?.[1];
    }
  }

  console.debug('[extractCsrfToken] csrf-token not found in cookies:', cookies);
  return undefined;
}

/**
 * Valid assessment responses for testing.
 * Uses exact enum values from shared/validation.ts.
 * Shared between backend and prompt-service integration tests.
 */
export const validAssessmentResponses: AssessmentResponses = {
  peak_energy_times: ['mid_morning', 'afternoon'],
  low_energy_times: ['evening'],
  energy_consistency: 4,
  energy_drains: 'Back-to-back meetings',
  energy_restores: 'Nature walks and reading',
  mood_triggers_negative: ['overwhelm', 'conflict'],
  motivation_reliability: 3,
  willpower_pattern: 'start_stop',
  identity_statements: 'I am a creative problem solver',
  others_describe: 'Thoughtful and reliable',
  automatic_behaviors: 'Checking phone first thing',
  keystone_behaviors: 'Morning exercise routine',
  core_values: ['growth', 'authenticity', 'connection'],
  natural_strengths: 'Pattern recognition',
  resistance_patterns: 'Perfectionism leading to procrastination',
  identity_clarity: 4,
};

export { prisma };
