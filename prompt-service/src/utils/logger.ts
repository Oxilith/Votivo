/**
 * @file prompt-service/src/utils/logger.ts
 * @purpose Centralized logging utility for the prompt service
 * @functionality
 * - Creates a structured pino logger instance
 * - Configures pretty printing for development
 * - Provides consistent logging across all modules
 * @dependencies
 * - pino for structured logging
 * - @/config for environment configuration
 */

import pino from 'pino';
import { config } from '@/config';

/**
 * Structured logger instance for the prompt service
 * Uses pino-pretty in development for readable output
 */
export const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export type Logger = typeof logger;
