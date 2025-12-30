/**
 * @file src/utils/index.ts
 * @purpose Centralized export for all utility modules
 * @functionality
 * - Exports structured logger
 * - Exports error sanitization utilities
 * - Exports HTTP fetch utilities
 * - Exports background refresh manager
 * - Exports JSON parsing utilities
 * @dependencies
 * - logger.ts
 * - error-sanitizer.ts
 * - fetch-with-timeout.ts
 * - background-refresh-manager.ts
 * - json-validator.ts
 */

export { logger, type Logger } from './logger';
export {
  createClientError,
  sanitizeErrorText,
  getGenericMessage,
  type InternalErrorLog,
  type ClientError,
} from './error-sanitizer';
export { fetchWithTimeout, type FetchWithTimeoutOptions } from './fetch-with-timeout';
export {
  BackgroundRefreshManager,
  type BackgroundRefreshManagerConfig,
  type BackgroundTask,
  type BackgroundRefreshCallbacks,
} from './background-refresh-manager';
export {
  stripMarkdownCodeBlocks,
  parseJson,
  parseAiJsonResponse,
  type JsonParseSuccess,
  type JsonParseError,
  type JsonParseResult,
} from './json-validator';
