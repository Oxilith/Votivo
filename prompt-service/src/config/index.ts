/**
 * @file prompt-service/src/config/index.ts
 * @purpose Centralized environment configuration with validation for prompt service
 * @functionality
 * - Loads environment variables from .env file
 * - Validates required configuration values
 * - Provides typed configuration object for application use
 * - Throws descriptive errors for missing required values
 * - Displays prominent warning when DEV_AUTH_BYPASS is enabled at startup
 * @dependencies
 * - dotenv for environment variable loading
 * - zod for schema validation
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

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
    .transform((val) => val.split(',').map((origin) => origin.trim()))
    .default('http://localhost:3000,http://localhost:3001'),

  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Admin Authentication
  adminApiKey: z.string().optional(),

  // Session secret for signing cookies - must be separate from adminApiKey in production
  sessionSecret: z.string().min(32).optional(),

  // Development auth bypass - requires explicit opt-in for security
  devAuthBypass: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

type Config = z.infer<typeof configSchema> & {
  databaseUrl: string;
};

function loadConfig(): Config {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const isProduction = nodeEnv === 'production';

  // Validate required production environment variables
  if (isProduction) {
    if (!process.env['DATABASE_URL']) {
      throw new Error(
        'DATABASE_URL is required in production. Cannot use default dev.db in production environment.'
      );
    }
    if (!process.env['SESSION_SECRET']) {
      throw new Error(
        'SESSION_SECRET is required in production. Using ADMIN_API_KEY as fallback is a security risk - if the API key leaks, session cookies can be forged.'
      );
    }
  }

  // Warn in development if using ADMIN_API_KEY as SESSION_SECRET fallback
  const sessionSecretRaw = process.env['SESSION_SECRET'];
  const adminApiKeyRaw = process.env['ADMIN_API_KEY'];
  if (!isProduction && !sessionSecretRaw && adminApiKeyRaw) {
    console.warn(
      '[CONFIG WARNING] SESSION_SECRET not set, falling back to ADMIN_API_KEY. Set a separate SESSION_SECRET for better security.'
    );
  }

  // Warn in development if DATABASE_KEY is not set (database will be unencrypted)
  if (!isProduction && !process.env['DATABASE_KEY']) {
    console.warn(
      '[CONFIG WARNING] DATABASE_KEY not set - database will not be encrypted. Set DATABASE_KEY for encryption.'
    );
  }

  const result = configSchema.safeParse({
    port: process.env['PORT'],
    nodeEnv: process.env['NODE_ENV'],
    databaseUrl: process.env['DATABASE_URL'],
    databaseKey: process.env['DATABASE_KEY'],
    corsOrigins: process.env['CORS_ORIGINS'],
    logLevel: process.env['LOG_LEVEL'],
    adminApiKey: process.env['ADMIN_API_KEY'],
    sessionSecret: process.env['SESSION_SECRET'] ?? process.env['ADMIN_API_KEY'],
    devAuthBypass: process.env['DEV_AUTH_BYPASS'],
  });

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  // Apply default database URL for non-production environments
  const databaseUrl = result.data.databaseUrl ?? 'file:./dev.db';

  // Warn if DEV_AUTH_BYPASS is enabled - security-sensitive configuration
  if (result.data.devAuthBypass && result.data.nodeEnv !== 'production') {
    console.warn(
      '\n' +
        '╔════════════════════════════════════════════════════════════════════════════╗\n' +
        '║  WARNING: DEV_AUTH_BYPASS is enabled                                       ║\n' +
        '║  Authentication is bypassed - any API key will be accepted.                ║\n' +
        '║  This should NEVER be used in production environments.                     ║\n' +
        '╚════════════════════════════════════════════════════════════════════════════╝\n'
    );
  }

  return {
    ...result.data,
    databaseUrl,
  };
}

export const config = loadConfig();

export type { Config };
