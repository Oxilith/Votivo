/**
 * @file config/index.ts
 * @purpose Centralized environment configuration with validation
 * @functionality
 * - Loads environment variables from .env file
 * - Validates required configuration values
 * - Provides typed configuration object for application use
 * - Throws descriptive errors for missing required values
 * - Configures circuit breaker settings for prompt service resilience
 * @dependencies
 * - dotenv for environment variable loading
 * - zod for schema validation
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  // Server
  port: z.coerce.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // HTTPS
  httpsEnabled: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  httpsKeyPath: z.string().default('../certs/localhost+2-key.pem'),
  httpsCertPath: z.string().default('../certs/localhost+2.pem'),

  // Anthropic API
  anthropicApiKey: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // CORS
  corsOrigin: z.string().default('https://localhost:3000'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(60000),
  rateLimitMaxRequests: z.coerce.number().default(10),

  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Feature Flags
  thinkingEnabled: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Prompt Service
  promptServiceUrl: z.string().url().default('http://localhost:3002'),

  // Circuit Breaker
  circuitBreakerTimeout: z.coerce.number().default(5000),
  circuitBreakerResetTimeout: z.coerce.number().default(30000),
  circuitBreakerErrorThreshold: z.coerce.number().default(50),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    port: process.env['PORT'],
    nodeEnv: process.env['NODE_ENV'],
    httpsEnabled: process.env['HTTPS_ENABLED'],
    httpsKeyPath: process.env['HTTPS_KEY_PATH'],
    httpsCertPath: process.env['HTTPS_CERT_PATH'],
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    corsOrigin: process.env['CORS_ORIGIN'],
    rateLimitWindowMs: process.env['RATE_LIMIT_WINDOW_MS'],
    rateLimitMaxRequests: process.env['RATE_LIMIT_MAX_REQUESTS'],
    logLevel: process.env['LOG_LEVEL'],
    thinkingEnabled: process.env['THINKING_ENABLED'],
    promptServiceUrl: process.env['PROMPT_SERVICE_URL'],
    circuitBreakerTimeout: process.env['CIRCUIT_BREAKER_TIMEOUT'],
    circuitBreakerResetTimeout: process.env['CIRCUIT_BREAKER_RESET_TIMEOUT'],
    circuitBreakerErrorThreshold: process.env['CIRCUIT_BREAKER_ERROR_THRESHOLD'],
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
