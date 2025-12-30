/**
 * @file prompt-service/src/controllers/prompt.controller.ts
 * @purpose Express controller for prompt management API endpoints
 * @functionality
 * - Handles prompt CRUD operations
 * - Validates request bodies using Zod schemas
 * - Returns appropriate HTTP status codes
 * - Provides version history and restore functionality
 * @dependencies
 * - express for request/response handling
 * - @/services/prompt.service for business logic
 * - @/validators/prompt.validator for input validation
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { promptService } from '@/services';
import {
  createPromptSchema,
  updatePromptSchema,
  promptIdParamSchema,
  promptKeyParamSchema,
  versionIdParamSchema,
} from '@/validators';
import { isAppError } from '@/errors';

export class PromptController {
  /**
   * GET /api/prompts - List all prompts
   */
  async getAll(_req: Request, res: Response): Promise<void> {
    const prompts = await promptService.getAll();
    res.json(prompts);
  }

  /**
   * GET /api/prompts/:id - Get prompt by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const params = promptIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const prompt = await promptService.getById(params.data.id);
    if (!prompt) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'Prompt not found' });
      return;
    }

    res.json(prompt);
  }

  /**
   * GET /api/prompts/key/:key - Get prompt by key
   */
  async getByKey(req: Request, res: Response): Promise<void> {
    const params = promptKeyParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const prompt = await promptService.getByKey(params.data.key);
    if (!prompt) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'Prompt not found' });
      return;
    }

    res.json(prompt);
  }

  /**
   * POST /api/prompts - Create new prompt
   */
  async create(req: Request, res: Response): Promise<void> {
    const body = createPromptSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const prompt = await promptService.create(body.data);
      res.status(StatusCodes.CREATED).json(prompt);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(StatusCodes.CONFLICT).json({ error: 'Prompt with this key already exists' });
        return;
      }
      throw error;
    }
  }

  /**
   * PUT /api/prompts/:id - Update prompt
   */
  async update(req: Request, res: Response): Promise<void> {
    const params = promptIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const body = updatePromptSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const prompt = await promptService.update(params.data.id, body.data);
      res.json(prompt);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * DELETE /api/prompts/:id - Soft delete prompt
   */
  async delete(req: Request, res: Response): Promise<void> {
    const params = promptIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      await promptService.delete(params.data.id);
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
   * GET /api/prompts/:id/versions - Get version history
   */
  async getVersions(req: Request, res: Response): Promise<void> {
    const params = promptIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    const versions = await promptService.getVersions(params.data.id);
    res.json(versions);
  }

  /**
   * POST /api/prompts/:id/versions/:versionId/restore - Restore to version
   */
  async restoreVersion(req: Request, res: Response): Promise<void> {
    const params = versionIdParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      const body = req.body as { changedBy?: string } | undefined;
      const prompt = await promptService.restoreVersion(
        params.data.id,
        params.data.versionId,
        body?.changedBy
      );
      res.json(prompt);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }
}

export const promptController = new PromptController();
