/**
 * @file middleware/error.middleware.ts
 * @purpose Global error handling middleware for Express
 * @functionality
 * - Catches and processes all unhandled errors
 * - Formats error responses consistently
 * - Logs errors with appropriate severity
 * - Hides internal error details in production
 * - Returns 503 for PromptServiceUnavailableError with retry hint
 * @dependencies
 * - express (Request, Response, NextFunction)
 * - http-status-codes for status constants
 * - @/utils/logger for error logging
 * - @/services/prompt-client.service for PromptServiceUnavailableError
 */

import type { Request, Response, NextFunction } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { logger } from '@/utils';
import { config } from '@/config';
import { PromptServiceUnavailableError } from '@/services';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle PromptServiceUnavailableError with 503 and retry hint
  if (err instanceof PromptServiceUnavailableError) {
    logger.warn({
      err: { message: err.message },
      req: { method: req.method, url: req.url, ip: req.ip },
    }, 'Prompt service unavailable');

    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again later.',
      },
      retryAfter: 30,
    });
    return;
  }

  const statusCode = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const isOperational = err.isOperational ?? false;

  // Log error
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      code: err.code,
    },
    req: {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
    statusCode,
    isOperational,
  });

  // Send response
  const response = {
    success: false,
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message:
        config.nodeEnv === 'production' && !isOperational
          ? getReasonPhrase(statusCode)
          : err.message,
    },
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

export function createAppError(
  message: string,
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  code: string = 'INTERNAL_ERROR'
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}
