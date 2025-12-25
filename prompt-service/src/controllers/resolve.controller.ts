/**
 * @file prompt-service/src/controllers/resolve.controller.ts
 * @purpose Express controller for prompt resolution API (internal use by backend)
 * @functionality
 * - Resolves prompt configurations by key
 * - Handles A/B test variant selection
 * - Records conversions for A/B testing analytics
 * @dependencies
 * - express for request/response handling
 * - @/services/prompt-resolver.service for resolution logic
 * - @/services/ab-test.service for conversion tracking
 * - @/validators/resolve.validator for input validation
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { promptResolverService } from '@/services/prompt-resolver.service.js';
import { abTestService } from '@/services/ab-test.service.js';
import { resolvePromptSchema, variantIdParamSchema } from '@/validators/resolve.validator.js';

export class ResolveController {
  /**
   * POST /api/resolve - Resolve prompt configuration
   * This is the main endpoint called by the backend to get prompt configs
   */
  async resolve(req: Request, res: Response): Promise<void> {
    const body = resolvePromptSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const result = await promptResolverService.resolve(body.data.key, body.data.thinkingEnabled);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/resolve/:variantId/conversion - Record conversion for A/B testing
   */
  async recordConversion(req: Request, res: Response): Promise<void> {
    const params = variantIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      await abTestService.recordConversion(params.data.variantId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      // Don't fail on conversion tracking errors - just log and return success
      console.error('Failed to record conversion:', error);
      res.status(StatusCodes.NO_CONTENT).send();
    }
  }
}

export const resolveController = new ResolveController();
