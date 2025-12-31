/**
 * @file prompt-service/src/utils/bootstrap-logger.ts
 * @purpose Minimal logger for use during config loading before main logger is available
 * @functionality
 * - Provides warn and error methods that respect LOG_LEVEL environment variable
 * - Used only in config/index.ts to avoid circular dependency with main logger
 * - Outputs structured JSON like pino for consistency
 * @dependencies
 * - None (must not import from @/config)
 */

type LogLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LOG_LEVELS: Record<LogLevel, number> = {
  silent: Infinity,
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL as LogLevel | undefined;
  return level && level in LOG_LEVELS ? level : 'info';
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, msg: string): string {
  return JSON.stringify({
    level: LOG_LEVELS[level],
    time: Date.now(),
    msg,
    service: 'prompt-service',
  });
}

/**
 * Bootstrap logger for use during config initialization.
 * Does not depend on config module to avoid circular imports.
 */
export const bootstrapLogger = {
  warn(msg: string): void {
    if (shouldLog('warn')) {
      process.stderr.write(formatMessage('warn', msg) + '\n');
    }
  },
  error(msg: string): void {
    if (shouldLog('error')) {
      process.stderr.write(formatMessage('error', msg) + '\n');
    }
  },
};
