/**
 * @file controllers/claude.controller.ts
 * @purpose Controller for Claude API proxy endpoints
 * @functionality
 * - Handles analyze request processing
 * - Validates request body using Zod schema
 * - Passes optional user profile for demographic context
 * - Calls Claude service and formats response
 * - Handles errors appropriately
 * @dependencies
 * - express (Request, Response, NextFunction)
 * - @/services/claude.service
 * - @/validators/claude.validator
 * - @/middleware/error.middleware
 * - http-status-codes
 */

import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { analyzeRequestSchema } from '@/validators';
import { analyzeAssessment } from '@/services';
import { createAppError } from '@/middleware';
import { logger } from '@/utils';
import type { AnalyzeResponse } from '@/types';

export async function analyze(
  req: Request,
  res: Response<AnalyzeResponse>,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const validationResult = analyzeRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');

      next(
        createAppError(
          `Validation failed: ${errorMessages}`,
          StatusCodes.BAD_REQUEST,
          'VALIDATION_ERROR'
        )
      );
      return;
    }

    const { responses, language, userProfile } = validationResult.data;

    logger.info({ language, hasUserProfile: !!userProfile }, 'Processing analysis request');

    const { analysis, rawResponse } = await analyzeAssessment(responses, language, userProfile);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        analysis,
        rawResponse,
      },
    });
  } catch (error) {
    next(error);
  }
}
