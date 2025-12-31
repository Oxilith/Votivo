/**
 * @file controllers/__tests__/health.controller.test.ts
 * @purpose Unit tests for health controller endpoints
 * @functionality
 * - Tests liveness returns 200 with version and uptime
 * - Tests readiness returns 200 for healthy status
 * - Tests readiness returns 200 for degraded status
 * - Tests readiness returns 503 for unhealthy status
 * @dependencies
 * - vitest for testing framework
 * - liveness and readiness controllers under test
 * - Mock healthService
 * - shared/testing for Express mocks
 */

// Hoist mock before imports
const { mockEvaluate } = vi.hoisted(() => ({
  mockEvaluate: vi.fn(),
}));

vi.mock('@/health', () => ({
  healthService: {
    evaluate: mockEvaluate,
  },
}));

import { liveness, readiness } from '@/controllers';
import { createMockRequest, createMockResponse } from 'shared/testing';
import type { Request, Response } from 'express';

describe('health.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('liveness', () => {
    it('should return 200 with status healthy', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      liveness(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
        })
      );
    });

    it('should include version in response', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      liveness(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          version: expect.any(String),
        })
      );
    });

    it('should include uptime in response', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      liveness(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: expect.any(Number),
        })
      );
    });

    it('should include timestamp in response', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      liveness(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('readiness', () => {
    it('should return 200 for healthy status', async () => {
      mockEvaluate.mockResolvedValueOnce({
        status: 'healthy',
        version: '1.0.0',
        uptime: 100,
        timestamp: new Date().toISOString(),
        checks: {},
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await readiness(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
        })
      );
    });

    it('should return 200 for degraded status', async () => {
      mockEvaluate.mockResolvedValueOnce({
        status: 'degraded',
        version: '1.0.0',
        uptime: 100,
        timestamp: new Date().toISOString(),
        checks: {
          'non-critical': {
            status: 'unhealthy',
            message: 'Service unavailable',
            latencyMs: 10,
          },
        },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await readiness(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
        })
      );
    });

    it('should return 503 for unhealthy status', async () => {
      mockEvaluate.mockResolvedValueOnce({
        status: 'unhealthy',
        version: '1.0.0',
        uptime: 100,
        timestamp: new Date().toISOString(),
        checks: {
          'critical-check': {
            status: 'unhealthy',
            message: 'Database connection failed',
            latencyMs: 5000,
          },
        },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await readiness(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
        })
      );
    });

    it('should include all check results in response', async () => {
      const checksResult = {
        anthropic: {
          status: 'healthy' as const,
          message: 'API reachable',
          latencyMs: 50,
        },
        'prompt-service': {
          status: 'healthy' as const,
          message: 'Service available',
          latencyMs: 10,
        },
      };

      mockEvaluate.mockResolvedValueOnce({
        status: 'healthy',
        version: '1.0.0',
        uptime: 100,
        timestamp: new Date().toISOString(),
        checks: checksResult,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await readiness(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          checks: checksResult,
        })
      );
    });
  });
});
