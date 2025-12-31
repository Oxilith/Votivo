/**
 * @file controllers/__tests__/resolve.controller.test.ts
 * @purpose Unit tests for Resolve controller endpoints
 * @functionality
 * - Tests resolve returns config successfully
 * - Tests resolve returns 400 for invalid body
 * - Tests resolve returns 404 when prompt not found
 * - Tests recordConversion tracks conversion
 * - Tests recordConversion handles errors silently
 * @dependencies
 * - vitest for testing framework
 * - ResolveController under test
 * - shared/testing for fixtures and mocks
 */

// Hoist mocks before imports
const { mockPromptResolverService, mockABTestService } = vi.hoisted(() => ({
  mockPromptResolverService: {
    resolve: vi.fn(),
  },
  mockABTestService: {
    recordConversion: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  promptResolverService: mockPromptResolverService,
  abTestService: mockABTestService,
}));

import { ResolveController } from '@/controllers';
import { NotFoundError } from '@/errors';
import { createMockRequest, createMockResponse, createMockPromptConfig } from 'shared/testing';
import type { Request, Response } from 'express';

// Valid test UUID
const VARIANT_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('ResolveController', () => {
  let controller: ResolveController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ResolveController();
  });

  describe('resolve', () => {
    it('should return config successfully', async () => {
      const config = createMockPromptConfig();
      const resolveResult = {
        config,
        variantId: VARIANT_ID,
      };
      mockPromptResolverService.resolve.mockResolvedValueOnce(resolveResult);

      const req = createMockRequest({
        body: {
          key: 'IDENTITY_ANALYSIS',
          thinkingEnabled: true,
        },
      });
      const res = createMockResponse();

      await controller.resolve(req as unknown as Request, res as unknown as Response);

      expect(mockPromptResolverService.resolve).toHaveBeenCalledWith('IDENTITY_ANALYSIS', true);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: resolveResult,
      });
    });

    it('should return 400 for invalid body', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await controller.resolve(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
      expect(mockPromptResolverService.resolve).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid key format', async () => {
      const req = createMockRequest({
        body: {
          key: 'invalid-key', // Not UPPER_SNAKE_CASE
          thinkingEnabled: true,
        },
      });
      const res = createMockResponse();

      await controller.resolve(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockPromptResolverService.resolve).not.toHaveBeenCalled();
    });

    it('should return 404 when prompt not found', async () => {
      mockPromptResolverService.resolve.mockRejectedValueOnce(
        new NotFoundError('Prompt', 'IDENTITY_ANALYSIS')
      );

      const req = createMockRequest({
        body: {
          key: 'IDENTITY_ANALYSIS',
          thinkingEnabled: false,
        },
      });
      const res = createMockResponse();

      await controller.resolve(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
        }),
      });
    });

    it('should handle thinkingEnabled: false', async () => {
      const config = createMockPromptConfig();
      mockPromptResolverService.resolve.mockResolvedValueOnce({
        config,
        variantId: null,
      });

      const req = createMockRequest({
        body: {
          key: 'IDENTITY_ANALYSIS',
          thinkingEnabled: false,
        },
      });
      const res = createMockResponse();

      await controller.resolve(req as unknown as Request, res as unknown as Response);

      expect(mockPromptResolverService.resolve).toHaveBeenCalledWith('IDENTITY_ANALYSIS', false);
    });
  });

  describe('recordConversion', () => {
    it('should record conversion successfully', async () => {
      mockABTestService.recordConversion.mockResolvedValueOnce(undefined);

      const req = createMockRequest({
        params: { variantId: VARIANT_ID },
      });
      const res = createMockResponse();

      await controller.recordConversion(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.recordConversion).toHaveBeenCalledWith(VARIANT_ID);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 400 for invalid variantId', async () => {
      const req = createMockRequest({ params: { variantId: 'not-a-uuid' } });
      const res = createMockResponse();

      await controller.recordConversion(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.recordConversion).not.toHaveBeenCalled();
    });

    it('should return 204 even when conversion fails', async () => {
      mockABTestService.recordConversion.mockRejectedValueOnce(new Error('Database error'));

      const req = createMockRequest({
        params: { variantId: VARIANT_ID },
      });
      const res = createMockResponse();

      await controller.recordConversion(req as unknown as Request, res as unknown as Response);

      // Should still return 204 - errors are silently swallowed
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
