/**
 * @file controllers/__tests__/ab-test.controller.test.ts
 * @purpose Unit tests for A/B Test controller endpoints
 * @functionality
 * - Tests getAll returns all A/B tests
 * - Tests getById returns test or 404
 * - Tests create returns 201
 * - Tests update returns updated test or errors
 * - Tests delete returns 204 or errors
 * - Tests activate/deactivate endpoints
 * - Tests variant management endpoints
 * @dependencies
 * - vitest for testing framework
 * - ABTestController under test
 * - shared/testing for fixtures and mocks
 */

// Hoist mocks before imports
const { mockABTestService } = vi.hoisted(() => ({
  mockABTestService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    addVariant: vi.fn(),
    updateVariant: vi.fn(),
    removeVariant: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  abTestService: mockABTestService,
}));

import { ABTestController } from '@/controllers';
import { NotFoundError } from '@/errors';
import {
  createMockRequest,
  createMockResponse,
  createMockABTest,
  createMockABVariant,
} from 'shared/testing';
import type { Request, Response } from 'express';

// Valid test UUIDs
const TEST_ID = '550e8400-e29b-41d4-a716-446655440001';
const PROMPT_ID = '550e8400-e29b-41d4-a716-446655440002';
const VARIANT_ID = '550e8400-e29b-41d4-a716-446655440003';

describe('ABTestController', () => {
  let controller: ABTestController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ABTestController();
  });

  describe('getAll', () => {
    it('should return all A/B tests', async () => {
      const tests = [createMockABTest(), createMockABTest()];
      mockABTestService.getAll.mockResolvedValueOnce(tests);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getAll(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(tests);
    });
  });

  describe('getById', () => {
    it('should return test when found', async () => {
      const test = createMockABTest({ id: TEST_ID });
      mockABTestService.getById.mockResolvedValueOnce(test);

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.getById(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.getById).toHaveBeenCalledWith(TEST_ID);
      expect(res.json).toHaveBeenCalledWith(test);
    });

    it('should return 404 when test not found', async () => {
      mockABTestService.getById.mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.getById(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'A/B test not found' });
    });
  });

  describe('create', () => {
    const validCreateBody = {
      promptId: PROMPT_ID,
      name: 'New Test',
    };

    it('should create test and return 201', async () => {
      const test = createMockABTest();
      mockABTestService.create.mockResolvedValueOnce(test);

      const req = createMockRequest({ body: validCreateBody });
      const res = createMockResponse();

      await controller.create(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(test);
    });

    it('should return 400 for invalid body', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await controller.create(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update test successfully', async () => {
      const updatedTest = createMockABTest({ name: 'Updated Name' });
      mockABTestService.update.mockResolvedValueOnce(updatedTest);

      const req = createMockRequest({
        params: { id: TEST_ID },
        body: { name: 'Updated Name' },
      });
      const res = createMockResponse();

      await controller.update(req as unknown as Request, res as unknown as Response);

      // Zod schema transforms missing startDate/endDate to null
      expect(mockABTestService.update).toHaveBeenCalledWith(TEST_ID, {
        name: 'Updated Name',
        startDate: null,
        endDate: null,
      });
      expect(res.json).toHaveBeenCalledWith(updatedTest);
    });

    it('should return 404 when test not found', async () => {
      mockABTestService.update.mockRejectedValueOnce(new NotFoundError('ABTest', TEST_ID));

      const req = createMockRequest({
        params: { id: TEST_ID },
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await controller.update(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete test and return 204', async () => {
      mockABTestService.delete.mockResolvedValueOnce(undefined);

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.delete(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.delete).toHaveBeenCalledWith(TEST_ID);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should return 400 for invalid id param', async () => {
      const req = createMockRequest({ params: { id: 'not-a-uuid' } });
      const res = createMockResponse();

      await controller.delete(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.delete).not.toHaveBeenCalled();
    });

    it('should return 404 when test not found', async () => {
      mockABTestService.delete.mockRejectedValueOnce(new NotFoundError('ABTest', TEST_ID));

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.delete(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('activate', () => {
    it('should activate test successfully', async () => {
      const activatedTest = createMockABTest({ isActive: true });
      mockABTestService.activate.mockResolvedValueOnce(activatedTest);

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.activate(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.activate).toHaveBeenCalledWith(TEST_ID);
      expect(res.json).toHaveBeenCalledWith(activatedTest);
    });

    it('should return 400 for invalid id param', async () => {
      const req = createMockRequest({ params: { id: 'not-a-uuid' } });
      const res = createMockResponse();

      await controller.activate(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.activate).not.toHaveBeenCalled();
    });

    it('should return 404 when test not found', async () => {
      mockABTestService.activate.mockRejectedValueOnce(new NotFoundError('ABTest', TEST_ID));

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.activate(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deactivate', () => {
    it('should deactivate test successfully', async () => {
      const deactivatedTest = createMockABTest({ isActive: false });
      mockABTestService.deactivate.mockResolvedValueOnce(deactivatedTest);

      const req = createMockRequest({ params: { id: TEST_ID } });
      const res = createMockResponse();

      await controller.deactivate(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.deactivate).toHaveBeenCalledWith(TEST_ID);
      expect(res.json).toHaveBeenCalledWith(deactivatedTest);
    });

    it('should return 400 for invalid id param', async () => {
      const req = createMockRequest({ params: { id: 'not-a-uuid' } });
      const res = createMockResponse();

      await controller.deactivate(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.deactivate).not.toHaveBeenCalled();
    });
  });

  describe('addVariant', () => {
    const validVariantBody = {
      name: 'Variant A',
      content: 'Variant content',
      model: 'claude-sonnet-4-20250514',
      weight: 0.5,
    };

    it('should add variant and return 201', async () => {
      const variant = createMockABVariant();
      mockABTestService.addVariant.mockResolvedValueOnce(variant);

      const req = createMockRequest({
        params: { id: TEST_ID },
        body: validVariantBody,
      });
      const res = createMockResponse();

      await controller.addVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(variant);
    });

    it('should return 400 for invalid id param', async () => {
      const req = createMockRequest({
        params: { id: 'not-a-uuid' },
        body: validVariantBody,
      });
      const res = createMockResponse();

      await controller.addVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.addVariant).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid body', async () => {
      const req = createMockRequest({
        params: { id: TEST_ID },
        body: {},
      });
      const res = createMockResponse();

      await controller.addVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateVariant', () => {
    it('should update variant successfully', async () => {
      const updatedVariant = createMockABVariant({ name: 'Updated Variant' });
      mockABTestService.updateVariant.mockResolvedValueOnce(updatedVariant);

      const req = createMockRequest({
        params: { id: TEST_ID, variantId: VARIANT_ID },
        body: { name: 'Updated Variant' },
      });
      const res = createMockResponse();

      await controller.updateVariant(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.updateVariant).toHaveBeenCalledWith(VARIANT_ID, {
        name: 'Updated Variant',
      });
      expect(res.json).toHaveBeenCalledWith(updatedVariant);
    });

    it('should return 400 for invalid params', async () => {
      const req = createMockRequest({
        params: { id: 'not-a-uuid', variantId: 'also-invalid' },
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await controller.updateVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.updateVariant).not.toHaveBeenCalled();
    });

    it('should return 404 when variant not found', async () => {
      mockABTestService.updateVariant.mockRejectedValueOnce(
        new NotFoundError('ABVariant', VARIANT_ID)
      );

      const req = createMockRequest({
        params: { id: TEST_ID, variantId: VARIANT_ID },
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await controller.updateVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('removeVariant', () => {
    it('should remove variant and return 204', async () => {
      mockABTestService.removeVariant.mockResolvedValueOnce(undefined);

      const req = createMockRequest({
        params: { id: TEST_ID, variantId: VARIANT_ID },
      });
      const res = createMockResponse();

      await controller.removeVariant(req as unknown as Request, res as unknown as Response);

      expect(mockABTestService.removeVariant).toHaveBeenCalledWith(VARIANT_ID);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should return 400 for invalid params', async () => {
      const req = createMockRequest({
        params: { id: 'not-a-uuid', variantId: 'also-invalid' },
      });
      const res = createMockResponse();

      await controller.removeVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockABTestService.removeVariant).not.toHaveBeenCalled();
    });

    it('should return 404 when variant not found', async () => {
      mockABTestService.removeVariant.mockRejectedValueOnce(
        new NotFoundError('ABVariant', VARIANT_ID)
      );

      const req = createMockRequest({
        params: { id: TEST_ID, variantId: VARIANT_ID },
      });
      const res = createMockResponse();

      await controller.removeVariant(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
