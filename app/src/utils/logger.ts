/**
 * @file src/utils/logger.ts
 * @purpose Simple app logging utility with environment-aware filtering
 * @functionality
 * - Provides log level filtering (debug, info, warn, error)
 * - Suppresses debug/info logs in production
 * - Maintains consistent logging format
 * - Prepares for future error tracking integration
 * @dependencies
 * - None (pure TypeScript utility)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = import.meta.env.DEV;

const defaultConfig: LoggerConfig = {
  minLevel: isDevelopment ? 'debug' : 'warn',
};

/**
 * Simple logger class with environment-aware filtering
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = defaultConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Log debug-level message (development only)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, context ?? '');
    }
  }

  /**
   * Log info-level message (development only)
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, context ?? '');
    }
  }

  /**
   * Log warning-level message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context ?? '');
    }
  }

  /**
   * Log error-level message with optional error object
   */
  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, { error, ...context });
    }
  }
}

export const logger = new Logger();
