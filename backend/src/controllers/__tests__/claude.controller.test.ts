/**
 * @file controllers/__tests__/claude.controller.test.ts
 * @purpose Unit tests for Claude controller endpoint
 * @functionality
 * - Tests valid request returns 200 with analysis result
 * - Tests invalid request returns 400 validation error
 * - Tests missing userProfile still works
 * - Tests service error propagates to error handler
 * @dependencies
 * - vitest for testing framework
 * - analyze controller under test
 * - Mock analyzeAssessment service
 * - shared/testing for fixtures and mocks
 */

// Hoist mock before imports
const { mockAnalyzeAssessment } = vi.hoisted(() => ({
  mockAnalyzeAssessment: vi.fn(),
}));

vi.mock('@/services', () => ({
  analyzeAssessment: mockAnalyzeAssessment,
}));

vi.mock('@/utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { analyze } from '@/controllers';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createCompleteAssessment,
  createMockAnalysisResult,
} from 'shared/testing';
import type { Request, Response, NextFunction } from 'express';

describe('claude.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('should return 200 with analysis result for valid request', async () => {
      const mockAnalysis = createMockAnalysisResult();
      mockAnalyzeAssessment.mockResolvedValueOnce({
        analysis: mockAnalysis,
        rawResponse: 'raw response text',
      });

      const responses = createCompleteAssessment();
      const req = createMockRequest({
        body: {
          responses,
          language: 'english',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          analysis: mockAnalysis,
          rawResponse: 'raw response text',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid request body', async () => {
      const req = createMockRequest({
        body: {
          responses: {}, // Missing required fields
          language: 'english',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(mockAnalyzeAssessment).not.toHaveBeenCalled();
    });

    it('should work without userProfile', async () => {
      const mockAnalysis = createMockAnalysisResult();
      mockAnalyzeAssessment.mockResolvedValueOnce({
        analysis: mockAnalysis,
        rawResponse: 'raw response',
      });

      const responses = createCompleteAssessment();
      const req = createMockRequest({
        body: {
          responses,
          language: 'english',
          // No userProfile provided
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockAnalyzeAssessment).toHaveBeenCalledWith(
        responses,
        'english',
        undefined
      );
    });

    it('should include userProfile in service call when provided', async () => {
      const mockAnalysis = createMockAnalysisResult();
      mockAnalyzeAssessment.mockResolvedValueOnce({
        analysis: mockAnalysis,
        rawResponse: 'raw response',
      });

      const responses = createCompleteAssessment();
      const userProfile = {
        name: 'Test User',
        age: 30,
        gender: 'male' as const,
      };
      const req = createMockRequest({
        body: {
          responses,
          language: 'polish',
          userProfile,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(mockAnalyzeAssessment).toHaveBeenCalledWith(
        responses,
        'polish',
        userProfile
      );
    });

    it('should propagate service errors to next()', async () => {
      const serviceError = new Error('Anthropic API error');
      mockAnalyzeAssessment.mockRejectedValueOnce(serviceError);

      const responses = createCompleteAssessment();
      const req = createMockRequest({
        body: {
          responses,
          language: 'english',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(next).toHaveBeenCalledWith(serviceError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid language', async () => {
      const responses = createCompleteAssessment();
      const req = createMockRequest({
        body: {
          responses,
          language: 'french', // Invalid language
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should use default language when not specified', async () => {
      const mockAnalysis = createMockAnalysisResult();
      mockAnalyzeAssessment.mockResolvedValueOnce({
        analysis: mockAnalysis,
        rawResponse: 'raw response',
      });

      const responses = createCompleteAssessment();
      const req = createMockRequest({
        body: {
          responses,
          // No language specified - should default to 'english'
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await analyze(
        req as unknown as Request,
        res as unknown as Response,
        next as NextFunction
      );

      expect(mockAnalyzeAssessment).toHaveBeenCalledWith(
        responses,
        'english',
        undefined
      );
    });
  });
});
