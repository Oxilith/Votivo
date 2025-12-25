/**
 * @file utils/error-sanitizer.ts
 * @purpose Centralized error handling utility for secure error processing
 * @functionality
 * - Provides generic client-facing error messages based on HTTP status
 * - Creates structured internal logs for debugging
 * - Prevents information disclosure by mapping errors to safe messages
 * - Sanitizes error content to prevent log injection
 * @dependencies
 * - None (pure utility)
 */

/**
 * Generic error messages mapped by HTTP status code
 * These are safe to expose to clients
 */
const GENERIC_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'Authentication required',
  403: 'Access denied',
  404: 'Resource not found',
  408: 'Request timeout',
  429: 'Too many requests',
  500: 'Internal error',
  502: 'Service temporarily unavailable',
  503: 'Service temporarily unavailable',
  504: 'Request timeout',
};

/**
 * Internal log structure for debugging
 */
export interface InternalErrorLog {
  originalError: string;
  statusCode: number;
  operation: string;
}

/**
 * Client error result containing safe message and internal log data
 */
export interface ClientError {
  clientMessage: string;
  internalLog: InternalErrorLog;
}

/**
 * Sanitizes raw error text to prevent log injection attacks
 * @param errorText - Raw error text from external service
 * @param maxLength - Maximum length to truncate to (default 500)
 * @returns Sanitized error text safe for logging
 */
export function sanitizeErrorText(errorText: string, maxLength = 500): string {
  return errorText
    .slice(0, maxLength)
    .replace(/[\r\n]/g, ' ')
    // eslint-disable-next-line no-control-regex -- Intentionally removing control characters for security
    .replace(/[\x00-\x1f]/g, '');
}

/**
 * Gets a generic client-safe error message for an HTTP status code
 * @param statusCode - HTTP status code
 * @returns Generic error message safe for client exposure
 */
export function getGenericMessage(statusCode: number): string {
  // Use specific message if available, otherwise use generic based on status range
  if (GENERIC_MESSAGES[statusCode]) {
    return GENERIC_MESSAGES[statusCode];
  }

  if (statusCode >= 500) {
    return 'Service error';
  }

  if (statusCode >= 400) {
    return 'Request error';
  }

  return 'Unexpected error';
}

/**
 * Creates a client-safe error with structured internal logging data
 * @param statusCode - HTTP status code from the error response
 * @param internalError - Raw error text (will be sanitized for logging)
 * @param operation - Description of the operation that failed
 * @returns ClientError with safe client message and internal log data
 */
export function createClientError(
  statusCode: number,
  internalError: string,
  operation: string
): ClientError {
  const sanitizedError = sanitizeErrorText(internalError);
  const clientMessage = `HTTP ${statusCode}: ${getGenericMessage(statusCode)}`;

  return {
    clientMessage,
    internalLog: {
      originalError: sanitizedError,
      statusCode,
      operation,
    },
  };
}
