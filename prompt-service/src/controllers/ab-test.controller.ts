/**
 * @file prompt-service/src/controllers/ab-test.controller.ts
 * @purpose Express controller for A/B test management API endpoints
 * @functionality
 * - Handles A/B test CRUD operations
 * - Manages test activation and deactivation
 * - Handles variant management within tests
 * - Validates request bodies using Zod schemas
 * @dependencies
 * - express for request/response handling
 * - @/services/ab-test.service for business logic
 * - @/validators/ab-test.validator for input validation
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { abTestService } from '@/services';
import {
  createABTestSchema,
  updateABTestSchema,
  createABVariantSchema,
  updateABVariantSchema,
  abTestIdParamSchema,
  variantIdParamSchema,
} from '@/validators';
import { isAppError } from '@/errors';

export class ABTestController {
  /**
   * GET /api/ab-tests - List all A/B tests
   */
  async getAll(_req: Request, res: Response): Promise<void> {
    const tests = await abTestService.getAll();
    res.json(tests);
  }

  /**
   * GET /api/ab-tests/:id - Get A/B test by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const params = abTestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const test = await abTestService.getById(params.data.id);
    if (!test) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'A/B test not found' });
      return;
    }

    res.json(test);
  }

  /**
   * POST /api/ab-tests - Create new A/B test
   */
  async create(req: Request, res: Response): Promise<void> {
    const body = createABTestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    const test = await abTestService.create(body.data);
    res.status(StatusCodes.CREATED).json(test);
  }

  /**
   * PUT /api/ab-tests/:id - Update A/B test
   */
  async update(req: Request, res: Response): Promise<void> {
    const params = abTestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const body = updateABTestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const test = await abTestService.update(params.data.id, body.data);
      res.json(test);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * DELETE /api/ab-tests/:id - Delete A/B test
   */
  async delete(req: Request, res: Response): Promise<void> {
    const params = abTestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      await abTestService.delete(params.data.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/ab-tests/:id/activate - Activate A/B test
   */
  async activate(req: Request, res: Response): Promise<void> {
    const params = abTestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      const test = await abTestService.activate(params.data.id);
      res.json(test);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/ab-tests/:id/deactivate - Deactivate A/B test
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    const params = abTestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      const test = await abTestService.deactivate(params.data.id);
      res.json(test);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/ab-tests/:id/variants - Add variant to test
   */
  async addVariant(req: Request, res: Response): Promise<void> {
    const params = abTestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const body = createABVariantSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    const variant = await abTestService.addVariant(params.data.id, body.data);
    res.status(StatusCodes.CREATED).json(variant);
  }

  /**
   * PUT /api/ab-tests/:id/variants/:variantId - Update variant
   */
  async updateVariant(req: Request, res: Response): Promise<void> {
    const params = variantIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const body = updateABVariantSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const variant = await abTestService.updateVariant(params.data.variantId, body.data);
      res.json(variant);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * DELETE /api/ab-tests/:id/variants/:variantId - Remove variant
   */
  async removeVariant(req: Request, res: Response): Promise<void> {
    const params = variantIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      await abTestService.removeVariant(params.data.variantId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }
}

export const abTestController = new ABTestController();
