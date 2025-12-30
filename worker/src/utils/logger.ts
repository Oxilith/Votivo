/**
 * @file worker/src/utils/logger.ts
 * @purpose Centralized logging configuration for worker service
 * @functionality
 * - Provides structured JSON logging in production
 * - Provides pretty-printed logs in development
 * - Configurable log level via environment
 * @dependencies
 * - pino for structured logging
 * - @/config for log level configuration
 */

import pino from 'pino';
import { config } from '@/config';

const isDev = config.nodeEnv === 'development';

export const logger = pino({
  level: config.logLevel,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'worker',
  },
});
