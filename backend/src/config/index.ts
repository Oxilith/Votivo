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
    .default('true')
    .transform((val) => val === 'true'),
  httpsKeyPath: z.string().default('../certs/localhost+2-key.pem'),
  httpsCertPath: z.string().default('../certs/localhost+2.pem'),

  // Anthropic API
  anthropicApiKey: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // CORS
  corsOrigin: z.string().default('https://localhost:3000'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(60000),
  rateLimitMaxRequests: z.coerce.number().default(60),

  // Claude API Rate Limiting (stricter for expensive API calls)
  claudeRateLimitWindowMs: z.coerce.number().default(60000),
  claudeRateLimitMaxRequests: z.coerce.number().default(5),

  // Logging
  logLevel: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Feature Flags
  thinkingEnabled: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  // E2E Testing - Mock Claude API (returns fixture data instead of real API calls)
  mockClaudeApi: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Prompt Service
  promptServiceUrl: z.url().default('http://localhost:3002'),

  // Circuit Breaker
  // Note: timeout should be 2x request timeout (5000ms) to account for network jitter
  circuitBreakerTimeout: z.coerce.number().default(10000),
  circuitBreakerResetTimeout: z.coerce.number().default(30000),
  circuitBreakerErrorThreshold: z.coerce.number().default(50),

  // Prompt Cache TTL
  promptCacheTtlMs: z.coerce.number().default(5 * 60 * 1000), // 5 minutes
  promptStaleTtlMs: z.coerce.number().default(60 * 60 * 1000), // 1 hour
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    port: process.env.BACKEND_PORT,
    nodeEnv: process.env.NODE_ENV,
    httpsEnabled: process.env.BACKEND_HTTPS_ENABLED,
    httpsKeyPath: process.env.HTTPS_KEY_PATH,
    httpsCertPath: process.env.HTTPS_CERT_PATH,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    corsOrigin: process.env.CORS_ORIGIN,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    claudeRateLimitWindowMs: process.env.CLAUDE_RATE_LIMIT_WINDOW_MS,
    claudeRateLimitMaxRequests: process.env.CLAUDE_RATE_LIMIT_MAX_REQUESTS,
    logLevel: process.env.LOG_LEVEL,
    thinkingEnabled: process.env.THINKING_ENABLED,
    mockClaudeApi: process.env.MOCK_CLAUDE_API,
    promptServiceUrl: process.env.PROMPT_SERVICE_URL,
    circuitBreakerTimeout: process.env.CIRCUIT_BREAKER_TIMEOUT,
    circuitBreakerResetTimeout: process.env.CIRCUIT_BREAKER_RESET_TIMEOUT,
    circuitBreakerErrorThreshold: process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD,
    promptCacheTtlMs: process.env.PROMPT_CACHE_TTL_MS,
    promptStaleTtlMs: process.env.PROMPT_STALE_TTL_MS,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

export const config = loadConfig();

export type { Config };
