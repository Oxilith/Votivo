/**
 * @file prompt-service/src/errors/index.ts
 * @purpose Custom error hierarchy for type-safe error handling
 * @functionality
 * - Provides AppError base class with status code and error code
 * - Provides NotFoundError for 404 responses
 * - Provides ValidationError for 400 responses
 * - Provides type guard for error handling in controllers
 * @dependencies
 * - None (pure TypeScript)
 */

/**
 * Base error class for application errors
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to JSON-serializable object
   */
  toJSON(): { error: string; code: string } {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} with id "${identifier}" not found`
        : `${resource} not found`
    );
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
}

/**
 * Error thrown when there's a conflict with existing data
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
