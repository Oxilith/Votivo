/**
 * @file utils/logger.ts
 * @purpose Structured logging with Pino for consistent application logging
 * @functionality
 * - Configures Pino logger with appropriate log levels
 * - Provides request correlation via request ID
 * - Formats output for development (pretty) vs production (JSON)
 * - Exports typed logger instance for use throughout application
 * @dependencies
 * - pino for structured logging
 * - pino-pretty for development formatting (dev only)
 */

import pino from 'pino';
import { config } from '@/config';

const isProduction = config.nodeEnv === 'production';

const baseOptions: pino.LoggerOptions = {
  level: config.logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'votive-api',
    env: config.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger = isProduction
  ? pino(baseOptions)
  : pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });

export type Logger = typeof logger;
