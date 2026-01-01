/**
 * @file worker/src/config/index.ts
 * @purpose Centralized environment configuration with validation for worker service
 * @functionality
 * - Loads environment variables from .env file
 * - Validates required configuration values
 * - Provides typed configuration object for application use
 * - Configures job-specific settings (enabled/schedule)
 * - Configures health server port (default: 3003)
 * @dependencies
 * - dotenv for environment variable loading
 * - zod for schema validation
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { bootstrapLogger } from '@/utils/bootstrap-logger';

dotenvConfig();

const configSchema = z.object({
  // Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database (shared with prompt-service)
  databaseUrl: z.string().optional(),
  databaseKey: z
    .string()
    .min(32, 'DATABASE_KEY must be at least 32 characters for libsql encryption')
    .optional(),

  // Logging
  logLevel: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Health check server port
  healthPort: z.coerce.number().int().positive().default(3003),

  // Job Configuration
  jobs: z.object({
    tokenCleanup: z.object({
      enabled: z
        .string()
        .default('true')
        .transform((val) => val !== 'false'),
      schedule: z.string().default('0 * * * *'), // Every hour by default
    }),
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
  }

  // Warn in development if DATABASE_KEY is not set (database will be unencrypted)
  if (!isProduction && !process.env.DATABASE_KEY) {
    bootstrapLogger.warn(
      'DATABASE_KEY not set - database will not be encrypted. Set DATABASE_KEY for encryption.'
    );
  }

  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    databaseKey: process.env.DATABASE_KEY,
    logLevel: process.env.LOG_LEVEL,
    healthPort: process.env.WORKER_HEALTH_PORT,
    jobs: {
      tokenCleanup: {
        enabled: process.env.JOB_TOKEN_CLEANUP_ENABLED,
        schedule: process.env.JOB_TOKEN_CLEANUP_SCHEDULE,
      },
    },
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  // Apply default database URL for non-production environments
  // Worker shares database with prompt-service - use the same file in development
  const databaseUrl = result.data.databaseUrl ?? 'file:../prompt-service/prisma/dev.db';

  return {
    ...result.data,
    databaseUrl,
  };
}

export const config = loadConfig();

export type { Config };
