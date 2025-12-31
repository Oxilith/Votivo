/**
 * @file controllers/__tests__/prompt.controller.test.ts
 * @purpose Unit tests for Prompt controller endpoints
 * @functionality
 * - Tests getAll returns all prompts
 * - Tests getById returns prompt or 404
 * - Tests getByKey returns prompt or 404
 * - Tests create returns 201 or handles errors
 * - Tests update returns updated prompt or errors
 * - Tests delete returns 204 or errors
 * - Tests getVersions returns version list
 * - Tests restoreVersion restores successfully
 * @dependencies
 * - vitest for testing framework
 * - PromptController under test
 * - shared/testing for fixtures and mocks
 */

// Hoist mocks before imports
const { mockPromptService } = vi.hoisted(() => ({
  mockPromptService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getVersions: vi.fn(),
    restoreVersion: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  promptService: mockPromptService,
}));

import { PromptController } from '@/controllers';
import { NotFoundError, ValidationError } from '@/errors';
import {
  createMockRequest,
  createMockResponse,
  createMockPrompt,
  createMockPromptVersion,
} from 'shared/testing';
import type { Request, Response } from 'express';

// Valid test UUIDs
const PROMPT_ID = '550e8400-e29b-41d4-a716-446655440001';
const VERSION_ID = '550e8400-e29b-41d4-a716-446655440002';

describe('PromptController', () => {
  let controller: PromptController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new PromptController();
  });

  describe('getAll', () => {
    it('should return all prompts', async () => {
      const prompts = [createMockPrompt(), createMockPrompt()];
      mockPromptService.getAll.mockResolvedValueOnce(prompts);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getAll(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(prompts);
    });
  });

  describe('getById', () => {
    it('should return prompt when found', async () => {
      const prompt = createMockPrompt({ id: PROMPT_ID });
      mockPromptService.getById.mockResolvedValueOnce(prompt);

      const req = createMockRequest({ params: { id: PROMPT_ID } });
      const res = createMockResponse();

      await controller.getById(req as unknown as Request, res as unknown as Response);

      expect(mockPromptService.getById).toHaveBeenCalledWith(PROMPT_ID);
      expect(res.json).toHaveBeenCalledWith(prompt);
    });

    it('should return 404 when prompt not found', async () => {
      mockPromptService.getById.mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: PROMPT_ID } });
      const res = createMockResponse();

      await controller.getById(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Prompt not found' });
    });

    it('should return 400 for invalid id param', async () => {
      const req = createMockRequest({ params: { id: 'not-a-uuid' } });
      const res = createMockResponse();

      await controller.getById(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getByKey', () => {
    it('should return prompt when found by key', async () => {
      const prompt = createMockPrompt({ key: 'IDENTITY_ANALYSIS' });
      mockPromptService.getByKey.mockResolvedValueOnce(prompt);

      const req = createMockRequest({ params: { key: 'IDENTITY_ANALYSIS' } });
      const res = createMockResponse();

      await controller.getByKey(req as unknown as Request, res as unknown as Response);

      expect(mockPromptService.getByKey).toHaveBeenCalledWith('IDENTITY_ANALYSIS');
      expect(res.json).toHaveBeenCalledWith(prompt);
    });

    it('should return 400 for missing key param', async () => {
      const req = createMockRequest({ params: {} });
      const res = createMockResponse();

      await controller.getByKey(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockPromptService.getByKey).not.toHaveBeenCalled();
    });

    it('should return 404 when key not found', async () => {
      mockPromptService.getByKey.mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { key: 'NONEXISTENT_KEY' } });
      const res = createMockResponse();

      await controller.getByKey(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    const validCreateBody = {
      key: 'NEW_PROMPT',
      name: 'New Prompt',
      content: 'Prompt content here',
      model: 'claude-sonnet-4-20250514',
      variants: {
        withThinking: { temperature: 1.0, maxTokens: 16000, budgetTokens: 10000 },
        withoutThinking: { temperature: 0.7, maxTokens: 4096 },
      },
    };

    it('should create prompt and return 201', async () => {
      const prompt = createMockPrompt();
      mockPromptService.create.mockResolvedValueOnce(prompt);

      const req = createMockRequest({ body: validCreateBody });
      const res = createMockResponse();

      await controller.create(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(prompt);
    });

    it('should return 400 for invalid body', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await controller.create(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockPromptService.create).not.toHaveBeenCalled();
    });

    it('should return 409 for duplicate key', async () => {
      mockPromptService.create.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`key`)')
      );

      const req = createMockRequest({ body: validCreateBody });
      const res = createMockResponse();

      await controller.create(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Prompt with this key already exists',
      });
    });

    it('should handle AppError from service', async () => {
      mockPromptService.create.mockRejectedValueOnce(new ValidationError('Invalid input'));

      const req = createMockRequest({ body: validCreateBody });
      const res = createMockResponse();

      await controller.create(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('update', () => {
    it('should update prompt successfully', async () => {
      const updatedPrompt = createMockPrompt({ name: 'Updated Name' });
      mockPromptService.update.mockResolvedValueOnce(updatedPrompt);

      const req = createMockRequest({
        params: { id: PROMPT_ID },
        body: { name: 'Updated Name' },
      });
      const res = createMockResponse();

      await controller.update(req as unknown as Request, res as unknown as Response);

      expect(mockPromptService.update).toHaveBeenCalledWith(PROMPT_ID, { name: 'Updated Name' });
      expect(res.json).toHaveBeenCalledWith(updatedPrompt);
    });

    it('should return 404 when prompt not found', async () => {
      mockPromptService.update.mockRejectedValueOnce(new NotFoundError('Prompt', PROMPT_ID));

      const req = createMockRequest({
        params: { id: PROMPT_ID },
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await controller.update(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete prompt and return 204', async () => {
      mockPromptService.delete.mockResolvedValueOnce(undefined);

      const req = createMockRequest({ params: { id: PROMPT_ID } });
      const res = createMockResponse();

      await controller.delete(req as unknown as Request, res as unknown as Response);

      expect(mockPromptService.delete).toHaveBeenCalledWith(PROMPT_ID);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 when prompt not found', async () => {
      mockPromptService.delete.mockRejectedValueOnce(new NotFoundError('Prompt', PROMPT_ID));

      const req = createMockRequest({ params: { id: PROMPT_ID } });
      const res = createMockResponse();

      await controller.delete(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getVersions', () => {
    it('should return version list', async () => {
      const versions = [
        createMockPromptVersion({ version: 1 }),
        createMockPromptVersion({ version: 2 }),
      ];
      mockPromptService.getVersions.mockResolvedValueOnce(versions);

      const req = createMockRequest({ params: { id: PROMPT_ID } });
      const res = createMockResponse();

      await controller.getVersions(req as unknown as Request, res as unknown as Response);

      expect(mockPromptService.getVersions).toHaveBeenCalledWith(PROMPT_ID);
      expect(res.json).toHaveBeenCalledWith(versions);
    });
  });

  describe('restoreVersion', () => {
    it('should restore version successfully', async () => {
      const restoredPrompt = createMockPrompt();
      mockPromptService.restoreVersion.mockResolvedValueOnce(restoredPrompt);

      const req = createMockRequest({
        params: { id: PROMPT_ID, versionId: VERSION_ID },
        body: { changedBy: 'admin' },
      });
      const res = createMockResponse();

      await controller.restoreVersion(req as unknown as Request, res as unknown as Response);

      expect(mockPromptService.restoreVersion).toHaveBeenCalledWith(
        PROMPT_ID,
        VERSION_ID,
        'admin'
      );
      expect(res.json).toHaveBeenCalledWith(restoredPrompt);
    });

    it('should return 400 for invalid params', async () => {
      const req = createMockRequest({
        params: { id: 'not-a-uuid', versionId: 'also-invalid' },
      });
      const res = createMockResponse();

      await controller.restoreVersion(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockPromptService.restoreVersion).not.toHaveBeenCalled();
    });

    it('should return 404 when version not found', async () => {
      mockPromptService.restoreVersion.mockRejectedValueOnce(
        new NotFoundError('PromptVersion', VERSION_ID)
      );

      const req = createMockRequest({
        params: { id: PROMPT_ID, versionId: VERSION_ID },
      });
      const res = createMockResponse();

      await controller.restoreVersion(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
