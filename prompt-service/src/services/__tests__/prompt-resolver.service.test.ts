/**
 * @file prompt-service/src/services/__tests__/prompt-resolver.service.test.ts
 * @purpose Unit tests for PromptResolverService error handling
 * @functionality
 * - Tests NotFoundError and ValidationError types
 * - Verifies error properties and toJSON serialization
 * @dependencies
 * - vitest for testing framework
 * - Error types from @/errors/index
 */

import { describe, it, expect } from 'vitest';
import { NotFoundError, ValidationError, ConflictError, isAppError } from '@/errors/index.js';

describe('Error Types', () => {
  describe('NotFoundError', () => {
    it('should create error with resource and identifier', () => {
      const error = new NotFoundError('Prompt', 'test-id');
      expect(error.message).toBe('Prompt with id "test-id" not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create error with resource only', () => {
      const error = new NotFoundError('Prompt');
      expect(error.message).toBe('Prompt not found');
      expect(error.statusCode).toBe(404);
    });

    it('should serialize to JSON correctly', () => {
      const error = new NotFoundError('Variant', 'v123');
      const json = error.toJSON();
      expect(json).toEqual({
        error: 'Variant with id "v123" not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('ValidationError', () => {
    it('should create error with message', () => {
      const error = new ValidationError('Invalid model name');
      expect(error.message).toBe('Invalid model name');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should serialize to JSON correctly', () => {
      const error = new ValidationError('Field is required');
      const json = error.toJSON();
      expect(json).toEqual({
        error: 'Field is required',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Key already exists');
      expect(error.message).toBe('Key already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError subclasses', () => {
      expect(isAppError(new NotFoundError('Test'))).toBe(true);
      expect(isAppError(new ValidationError('Test'))).toBe(true);
      expect(isAppError(new ConflictError('Test'))).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isAppError(new Error('Test'))).toBe(false);
      expect(isAppError(new TypeError('Test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(42)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('Error stack traces', () => {
    it('should have proper stack trace', () => {
      const error = new NotFoundError('Resource', 'id');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotFoundError');
    });

    it('should have correct name property', () => {
      expect(new NotFoundError('Test').name).toBe('NotFoundError');
      expect(new ValidationError('Test').name).toBe('ValidationError');
      expect(new ConflictError('Test').name).toBe('ConflictError');
    });
  });
});
