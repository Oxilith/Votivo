/**
 * @file prompt-service/src/config/index.ts
 * @purpose Centralized environment configuration with validation for prompt service
 * @functionality
 * - Loads environment variables from .env file
 * - Validates required configuration values
 * - Provides typed configuration object for application use
 * - Throws descriptive errors for missing required values
 * - Validates JWT secrets are present and different in production
 * - Configures SMTP email settings for password reset and verification emails
 * - Configures account lockout settings for progressive login lockout
 * @dependencies
 * - dotenv for environment variable loading
 * - zod for schema validation
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { bootstrapLogger } from '@/utils/bootstrap-logger';

dotenvConfig();

const configSchema = z.object({
  // Server
  port: z.coerce.number().default(3002),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  databaseUrl: z.string().optional(),
  // libsql requires 32+ character encryption key
  databaseKey: z
    .string()
    .min(32, 'DATABASE_KEY must be at least 32 characters for libsql encryption')
    .optional(),

  // CORS
  corsOrigins: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((val) => val.split(',').map((origin) => origin.trim())),

  // Logging
  logLevel: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Admin Authentication
  adminApiKey: z.string().optional(),

  // Session secret for signing cookies - must be separate from adminApiKey in production
  sessionSecret: z.string().min(32).optional(),

  // JWT Authentication - Required in all environments to prevent accidental use of fallback secrets
  jwtAccessSecret: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters. Generate with: openssl rand -hex 32'),
  jwtRefreshSecret: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters. Generate with: openssl rand -hex 32'),
  jwtAccessExpiry: z.string().default('15m'),
  jwtRefreshExpiry: z.string().default('7d'),

  // Password Hashing
  bcryptSaltRounds: z.coerce.number().min(4).max(31).default(10),

  // SMTP Email Configuration
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().default(587),
  smtpSecure: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().optional(),

  // Application URLs (for email links)
  appUrl: z.url().optional(),
  apiUrl: z.url().optional(),

  // Rate Limiting Configuration
  rateLimit: z.object({
    windowMs: z.coerce.number().default(60_000), // 1 minute
    login: z.coerce.number().default(5), // 5 req/min - brute force protection
    register: z.coerce.number().default(5), // 5 req/min - account spam prevention
    passwordReset: z.coerce.number().default(3), // 3 req/min - email abuse prevention
    forgotPassword: z.coerce.number().default(3), // 3 req/min - email abuse prevention
    tokenRefresh: z.coerce.number().default(20), // 20 req/min - normal auth flow
    userData: z.coerce.number().default(30), // 30 req/min - assessment/analysis
    profile: z.coerce.number().default(15), // 15 req/min - profile operations
  }),

  // Account Lockout Configuration (progressive lockout after failed login attempts)
  lockout: z.object({
    maxAttempts: z.coerce.number().default(15), // Lock after 15 failures
    initialDurationMins: z.coerce.number().default(15), // First lockout: 15 minutes
    maxDurationMins: z.coerce.number().default(1440), // Max lockout: 24 hours
  }),
});

type Config = z.infer<typeof configSchema> & {
  databaseUrl: string;
};

function loadConfig(): Config {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  // Validate required production environment variables
  if (isProduction) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is required in production. Cannot use default dev.db in production environment.'
      );
    }
    if (!process.env.SESSION_SECRET) {
      throw new Error(
        'SESSION_SECRET is required in production. Using ADMIN_API_KEY as fallback is a security risk - if the API key leaks, session cookies can be forged.'
      );
    }
  }

  // JWT secrets must be different for security (checked in all environments)
  // Note: JWT secrets are now required by Zod schema - no fallbacks allowed
  // Only check if both are defined (Zod will catch missing secrets)
  if (
    process.env.JWT_ACCESS_SECRET &&
    process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different for security.'
    );
  }

  // Warn in development if using ADMIN_API_KEY as SESSION_SECRET fallback
  const sessionSecretRaw = process.env.SESSION_SECRET;
  const adminApiKeyRaw = process.env.ADMIN_API_KEY;
  if (!isProduction && !sessionSecretRaw && adminApiKeyRaw) {
    bootstrapLogger.warn(
      'SESSION_SECRET not set, falling back to ADMIN_API_KEY. Set a separate SESSION_SECRET for better security.'
    );
  }

  // Require at least one cookie signing secret in development mode
  if (!isProduction && !sessionSecretRaw && !adminApiKeyRaw) {
    throw new Error(
      'Cookie signing secret is required. Set either SESSION_SECRET (recommended, min 32 characters) or ADMIN_API_KEY in your environment.\n' +
        'Example: SESSION_SECRET=your-secure-random-string-at-least-32-chars'
    );
  }

  // Warn in development if DATABASE_KEY is not set (database will be unencrypted)
  if (!isProduction && !process.env.DATABASE_KEY) {
    bootstrapLogger.warn(
      'DATABASE_KEY not set - database will not be encrypted. Set DATABASE_KEY for encryption.'
    );
  }

  const result = configSchema.safeParse({
    port: process.env.PROMPT_SERVICE_PORT,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    databaseKey: process.env.DATABASE_KEY,
    corsOrigins: process.env.CORS_ORIGINS,
    logLevel: process.env.LOG_LEVEL,
    adminApiKey: process.env.ADMIN_API_KEY,
    sessionSecret: process.env.SESSION_SECRET ?? process.env.ADMIN_API_KEY,
    // JWT Authentication
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY,
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY,
    // Password Hashing
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
    // SMTP Email Configuration
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpSecure: process.env.SMTP_SECURE,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpFrom: process.env.SMTP_FROM,
    // Application URLs
    appUrl: process.env.APP_URL,
    apiUrl: process.env.API_URL,
    // Rate Limiting
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      login: process.env.RATE_LIMIT_LOGIN,
      register: process.env.RATE_LIMIT_REGISTER,
      passwordReset: process.env.RATE_LIMIT_PASSWORD_RESET,
      forgotPassword: process.env.RATE_LIMIT_FORGOT_PASSWORD,
      tokenRefresh: process.env.RATE_LIMIT_TOKEN_REFRESH,
      userData: process.env.RATE_LIMIT_USER_DATA,
      profile: process.env.RATE_LIMIT_PROFILE,
    },
    // Account Lockout
    lockout: {
      maxAttempts: process.env.LOCKOUT_MAX_ATTEMPTS,
      initialDurationMins: process.env.LOCKOUT_INITIAL_DURATION_MINS,
      maxDurationMins: process.env.LOCKOUT_MAX_DURATION_MINS,
    },
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  // Apply default database URL for non-production environments
  // Points to database created by prisma migrate in the prisma directory
  const databaseUrl = result.data.databaseUrl ?? 'file:./prisma/dev.db';

  return {
    ...result.data,
    databaseUrl,
  };
}

export const config = loadConfig();

export type { Config };
