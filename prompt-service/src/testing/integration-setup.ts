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
 * @dependencies
 * - express for app creation
 * - cookie-parser for signed cookies
 * - @/routes for API routes
 * - @/middleware for tracing
 * - shared/testing for database utilities
 *
 * ESLint disabled rules are due to PrismaLibSql adapter not preserving full PrismaClient types.
 * See: https://github.com/prisma/prisma/issues/21365
 */
 
import express, { type Express, type ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import type { Test } from 'supertest';
import request from 'supertest';
import { apiRouter } from '@/routes';
import { tracingMiddleware } from '@/middleware';
import {
  cleanupTestDb,
  setTestPrisma,
  checkDatabaseAvailable,
  type PrismaLikeClient,
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

  // Error handler
  const errorHandler: ErrorRequestHandler = (
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
    _databaseAvailable = await checkDatabaseAvailable(prisma as PrismaLikeClient);
    if (_databaseAvailable) {
      setTestPrisma(prisma as PrismaLikeClient);
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
      return cookie.split(';')[0].split('=')[1];
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
export const validAssessmentResponses = {
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
