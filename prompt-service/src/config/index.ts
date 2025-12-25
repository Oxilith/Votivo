/**
 * @file prompt-service/src/config/index.ts
 * @purpose Centralized environment configuration with validation for prompt service
 * @functionality
 * - Loads environment variables from .env file
 * - Validates required configuration values
 * - Provides typed configuration object for application use
 * - Throws descriptive errors for missing required values
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
  databaseUrl: z.string().default('file:./dev.db'),

  // CORS
  corsOrigins: z
    .string()
    .transform((val) => val.split(',').map((origin) => origin.trim()))
    .default('http://localhost:3000,http://localhost:3001'),

  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Admin Authentication
  adminApiKey: z.string().optional(),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    port: process.env['PORT'],
    nodeEnv: process.env['NODE_ENV'],
    databaseUrl: process.env['DATABASE_URL'],
    corsOrigins: process.env['CORS_ORIGINS'],
    logLevel: process.env['LOG_LEVEL'],
    adminApiKey: process.env['ADMIN_API_KEY'],
  });

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

export const config = loadConfig();

export type { Config };
