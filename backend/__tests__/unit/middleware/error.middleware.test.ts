/**
 * @file middleware/__tests__/error.middleware.test.ts
 * @purpose Unit tests for error handling middleware
 * @functionality
 * - Tests PromptServiceUnavailableError returns 503 with retry hint
 * - Tests AppError with custom statusCode
 * - Tests generic Error returns 500
 * - Tests production mode hides error details
 * - Tests development mode shows error message
 * - Tests notFoundHandler returns 404 with path
 * - Tests createAppError factory function
 * @dependencies
 * - vitest for testing framework
 * - errorHandler, notFoundHandler, createAppError under test
 * - shared/testing for Express mocks
 */

// Hoist mocks before imports
const { mockLoggerWarn, mockLoggerError, mockNodeEnv, MockPromptServiceUnavailableError } = vi.hoisted(() => {
  // Create error class in hoisted block
  class MockPromptServiceUnavailableError extends Error {
    constructor(message = 'Prompt service is unavailable') {
      super(message);
      this.name = 'PromptServiceUnavailableError';
    }
  }

  return {
    mockLoggerWarn: vi.fn(),
    mockLoggerError: vi.fn(),
    mockNodeEnv: { value: 'test' },
    MockPromptServiceUnavailableError,
  };
});

vi.mock('@/utils', () => ({
  logger: {
    warn: mockLoggerWarn,
    error: mockLoggerError,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/config', () => ({
  config: {
    get nodeEnv() {
      return mockNodeEnv.value;
    },
  },
}));

vi.mock('@/services', () => ({
  PromptServiceUnavailableError: MockPromptServiceUnavailableError,
}));

import {
  errorHandler,
  notFoundHandler,
  createAppError,
  type AppError,
} from '@/middleware';
import { PromptServiceUnavailableError } from '@/services';
import { createMockRequest, createMockResponse, createMockNext } from 'shared/testing';
import type { Request, Response, NextFunction } from 'express';

describe('error.middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNodeEnv.value = 'test';
  });

  describe('errorHandler', () => {
    it('should return 503 for PromptServiceUnavailableError', () => {
      const error = new PromptServiceUnavailableError();
      const req = createMockRequest({ method: 'POST', path: '/api/v1/claude/analyze' });
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable. Please try again later.',
        },
        retryAfter: 30,
      });
      expect(mockLoggerWarn).toHaveBeenCalled();
    });

    it('should use custom statusCode from AppError', () => {
      const error: AppError = new Error('Bad request');
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      error.isOperational = true;

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Bad request',
        },
      });
    });

    it('should return 500 for generic Error', () => {
      const error = new Error('Something went wrong');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      });
    });

    it('should hide error details in production mode', () => {
      mockNodeEnv.value = 'production';

      const error = new Error('Sensitive database error');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error',
        },
      });
    });

    it('should show error message in production for operational errors', () => {
      mockNodeEnv.value = 'production';

      const error: AppError = new Error('User input validation failed');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.isOperational = true;

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User input validation failed',
        },
      });
    });

    it('should show error message in development mode', () => {
      mockNodeEnv.value = 'development';

      const error = new Error('Detailed debug error');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Detailed debug error',
        },
      });
    });

    it('should log error details', () => {
      const error = new Error('Test error');
      const req = createMockRequest({ method: 'GET', path: '/test' });
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(
        error,
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'Test error',
          }),
          statusCode: 500,
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with path in message', () => {
      const req = createMockRequest({ method: 'GET', path: '/unknown/route' });
      const res = createMockResponse();

      notFoundHandler(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /unknown/route not found',
        },
      });
    });

    it('should handle POST method', () => {
      const req = createMockRequest({ method: 'POST', path: '/api/missing' });
      const res = createMockResponse();

      notFoundHandler(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /api/missing not found',
        },
      });
    });
  });

  describe('createAppError', () => {
    it('should create error with defaults', () => {
      const error = createAppError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom statusCode', () => {
      const error = createAppError('Bad request', 400);

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should create error with custom code', () => {
      const error = createAppError('Validation failed', 400, 'VALIDATION_ERROR');

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });
});
