/**
 * @file controllers/claude.controller.ts
 * @purpose Controller for Claude API proxy endpoints
 * @functionality
 * - Handles analyze request processing
 * - Validates request body using Zod schema
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
import { analyzeRequestSchema } from '../validators/claude.validator.js';
import { analyzeAssessment } from '../services/claude.service.js';
import { createAppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';
import type { AnalyzeResponse } from '../types/claude.types.js';

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

      throw createAppError(
        `Validation failed: ${errorMessages}`,
        StatusCodes.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    const { responses, language } = validationResult.data;

    logger.info({ language }, 'Processing analysis request');

    const { analysis, rawResponse } = await analyzeAssessment(responses, language);

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
