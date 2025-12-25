/**
 * @file prompt-service/src/services/__tests__/prompt-resolver.service.test.ts
 * @purpose Unit tests for PromptResolverService and custom error types
 * @functionality
 * - Tests NotFoundError, ValidationError, and ConflictError types
 * - Verifies error properties and toJSON serialization
 * - Tests isAppError type guard function
 * - Tests PromptResolverService.resolve() method
 * - Tests prompt resolution with and without A/B tests
 * - Tests thinking mode variant selection
 * - Tests validateClaudeModel validation
 * @dependencies
 * - vitest for testing framework
 * - Error types from @/errors/index
 * - PromptResolverService from @/services/prompt-resolver.service
 * - promptService from @/services/prompt.service (mocked)
 * - abTestService from @/services/ab-test.service (mocked)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotFoundError, ValidationError, ConflictError, isAppError } from '@/errors/index.js';
import { PromptResolverService } from '@/services/prompt-resolver.service.js';
import { promptService } from '@/services/prompt.service.js';
import { abTestService, type ABTestWithVariants } from '@/services/ab-test.service.js';
import type { Prompt, PromptVariant, ABVariant, ABVariantConfig } from '@prisma/client';

describe('Error Types', () => {
  describe('NotFoundError', () => {
    it('should create error with resource and identifier', () => {
      const error = new NotFoundError('Prompt', 'test-id');
      expect(error.message).toBe('Prompt with id "test-id" not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create error with resource only', () => {
      const error = new NotFoundError('Prompt');
      expect(error.message).toBe('Prompt not found');
      expect(error.statusCode).toBe(404);
    });

    it('should serialize to JSON correctly', () => {
      const error = new NotFoundError('Variant', 'v123');
      const json = error.toJSON();
      expect(json).toEqual({
        error: 'Variant with id "v123" not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('ValidationError', () => {
    it('should create error with message', () => {
      const error = new ValidationError('Invalid model name');
      expect(error.message).toBe('Invalid model name');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should serialize to JSON correctly', () => {
      const error = new ValidationError('Field is required');
      const json = error.toJSON();
      expect(json).toEqual({
        error: 'Field is required',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Key already exists');
      expect(error.message).toBe('Key already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError subclasses', () => {
      expect(isAppError(new NotFoundError('Test'))).toBe(true);
      expect(isAppError(new ValidationError('Test'))).toBe(true);
      expect(isAppError(new ConflictError('Test'))).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isAppError(new Error('Test'))).toBe(false);
      expect(isAppError(new TypeError('Test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(42)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('Error stack traces', () => {
    it('should have proper stack trace', () => {
      const error = new NotFoundError('Resource', 'id');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotFoundError');
    });

    it('should have correct name property', () => {
      expect(new NotFoundError('Test').name).toBe('NotFoundError');
      expect(new ValidationError('Test').name).toBe('ValidationError');
      expect(new ConflictError('Test').name).toBe('ConflictError');
    });
  });
});

// Helper types for mock data
type PromptWithVariants = Prompt & { variants: PromptVariant[] };
type ABVariantWithConfigs = ABVariant & { configs: ABVariantConfig[] };

/**
 * Creates a mock prompt with variants for testing
 */
function createMockPrompt(
  overrides: Partial<PromptWithVariants> = {}
): PromptWithVariants {
  return {
    id: 'prompt-1',
    key: 'TEST_PROMPT',
    name: 'Test Prompt',
    description: null,
    content: 'Test prompt content',
    model: 'claude-sonnet-4-0',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    variants: [
      createMockVariant('withThinking'),
      createMockVariant('withoutThinking'),
    ],
    ...overrides,
  };
}

/**
 * Creates a mock prompt variant for testing
 */
function createMockVariant(
  variantType: 'withThinking' | 'withoutThinking',
  overrides: Partial<PromptVariant> = {}
): PromptVariant {
  const isThinking = variantType === 'withThinking';
  return {
    id: `variant-${variantType}`,
    promptId: 'prompt-1',
    variantType,
    temperature: isThinking ? 1 : 0.6,
    maxTokens: isThinking ? 16000 : 8000,
    thinkingType: isThinking ? 'enabled' : 'disabled',
    budgetTokens: isThinking ? 8000 : null,
    isDefault: isThinking,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Creates a mock A/B test with variants for testing
 */
function createMockABTest(
  variants: ABVariantWithConfigs[]
): ABTestWithVariants {
  return {
    id: 'ab-test-1',
    promptId: 'prompt-1',
    name: 'Test AB Test',
    description: null,
    isActive: true,
    startDate: null,
    endDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    variants,
  };
}

/**
 * Creates a mock A/B variant with configs for testing
 */
function createMockABVariant(
  overrides: Partial<ABVariantWithConfigs> = {}
): ABVariantWithConfigs {
  return {
    id: 'ab-variant-1',
    abTestId: 'ab-test-1',
    name: 'Variant A',
    content: 'AB test content',
    model: 'claude-sonnet-4-0',
    weight: 1,
    impressions: 0,
    conversions: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    configs: [
      createMockABVariantConfig('withThinking'),
      createMockABVariantConfig('withoutThinking'),
    ],
    ...overrides,
  };
}

/**
 * Creates a mock A/B variant config for testing
 */
function createMockABVariantConfig(
  variantType: 'withThinking' | 'withoutThinking',
  overrides: Partial<ABVariantConfig> = {}
): ABVariantConfig {
  const isThinking = variantType === 'withThinking';
  return {
    id: `ab-config-${variantType}`,
    abVariantId: 'ab-variant-1',
    variantType,
    temperature: isThinking ? 1 : 0.6,
    maxTokens: isThinking ? 16000 : 8000,
    thinkingType: isThinking ? 'enabled' : 'disabled',
    budgetTokens: isThinking ? 8000 : null,
    ...overrides,
  };
}

describe('PromptResolverService', () => {
  let resolver: PromptResolverService;

  beforeEach(() => {
    resolver = new PromptResolverService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolve', () => {
    it('should throw NotFoundError when prompt does not exist', async () => {
      vi.spyOn(promptService, 'getByKey').mockResolvedValue(null);

      await expect(resolver.resolve('NONEXISTENT', true)).rejects.toThrow(
        'Prompt with id "NONEXISTENT" not found'
      );
    });

    it('should resolve prompt without A/B test when none active', async () => {
      const mockPrompt = createMockPrompt();
      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(null);

      const result = await resolver.resolve('TEST_PROMPT', true);

      expect(result.config.prompt).toBe('Test prompt content');
      expect(result.config.model).toBe('claude-sonnet-4-0');
      expect(result.abTestId).toBeUndefined();
      expect(result.variantId).toBeUndefined();
    });

    it('should return thinking config when thinkingEnabled is true', async () => {
      const mockPrompt = createMockPrompt();
      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(null);

      const result = await resolver.resolve('TEST_PROMPT', true);

      expect(result.config.temperature).toBe(1);
      expect(result.config.max_tokens).toBe(16000);
      expect(result.config.thinking).toEqual({
        type: 'enabled',
        budget_tokens: 8000,
      });
    });

    it('should return non-thinking config when thinkingEnabled is false', async () => {
      const mockPrompt = createMockPrompt();
      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(null);

      const result = await resolver.resolve('TEST_PROMPT', false);

      expect(result.config.temperature).toBe(0.6);
      expect(result.config.max_tokens).toBe(8000);
      expect(result.config.thinking).toBeUndefined();
    });

    it('should throw NotFoundError when variant type not found', async () => {
      const mockPrompt = createMockPrompt({
        variants: [createMockVariant('withThinking')], // Missing withoutThinking
      });
      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(null);

      await expect(resolver.resolve('TEST_PROMPT', false)).rejects.toThrow(
        'Variant with id "withoutThinking for prompt TEST_PROMPT" not found'
      );
    });

    it('should resolve with A/B test when active test exists', async () => {
      const mockPrompt = createMockPrompt();
      const mockABVariant = createMockABVariant();
      const mockABTest = createMockABTest([mockABVariant]);

      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(mockABTest);
      vi.spyOn(abTestService, 'selectVariant').mockReturnValue(mockABVariant);
      const recordImpressionSpy = vi
        .spyOn(abTestService, 'recordImpression')
        .mockResolvedValue(undefined);

      const result = await resolver.resolve('TEST_PROMPT', true);

      expect(result.config.prompt).toBe('AB test content');
      expect(result.abTestId).toBe('ab-test-1');
      expect(result.variantId).toBe('ab-variant-1');
      expect(recordImpressionSpy).toHaveBeenCalledWith('ab-variant-1');
    });

    it('should use A/B variant config when available', async () => {
      const mockPrompt = createMockPrompt();
      const mockABVariant = createMockABVariant({
        configs: [
          createMockABVariantConfig('withThinking', {
            temperature: 0.9,
            maxTokens: 12000,
            budgetTokens: 6000,
          }),
        ],
      });
      const mockABTest = createMockABTest([mockABVariant]);

      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(mockABTest);
      vi.spyOn(abTestService, 'selectVariant').mockReturnValue(mockABVariant);
      vi.spyOn(abTestService, 'recordImpression').mockResolvedValue(undefined);

      const result = await resolver.resolve('TEST_PROMPT', true);

      expect(result.config.temperature).toBe(0.9);
      expect(result.config.max_tokens).toBe(12000);
      expect(result.config.thinking).toEqual({
        type: 'enabled',
        budget_tokens: 6000,
      });
    });

    it('should use defaults when A/B variant config is not available', async () => {
      const mockPrompt = createMockPrompt();
      const mockABVariant = createMockABVariant({ configs: [] });
      const mockABTest = createMockABTest([mockABVariant]);

      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(mockABTest);
      vi.spyOn(abTestService, 'selectVariant').mockReturnValue(mockABVariant);
      vi.spyOn(abTestService, 'recordImpression').mockResolvedValue(undefined);

      const result = await resolver.resolve('TEST_PROMPT', true);

      // Should use defaults when config not found
      expect(result.config.temperature).toBe(1); // default for thinking
      expect(result.config.max_tokens).toBe(16000); // default for thinking
      expect(result.config.thinking).toEqual({
        type: 'enabled',
        budget_tokens: 8000, // default
      });
    });

    it('should skip A/B test resolution when test has no variants', async () => {
      const mockPrompt = createMockPrompt();
      const mockABTest = createMockABTest([]); // No variants

      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(mockABTest);

      const result = await resolver.resolve('TEST_PROMPT', true);

      // Should fall back to base prompt
      expect(result.config.prompt).toBe('Test prompt content');
      expect(result.abTestId).toBeUndefined();
    });
  });

  describe('validateClaudeModel', () => {
    it('should throw ValidationError for invalid model', async () => {
      const mockPrompt = createMockPrompt({ model: 'invalid-model' });
      vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
      vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(null);

      await expect(resolver.resolve('TEST_PROMPT', false)).rejects.toThrow(
        'Invalid Claude model: "invalid-model"'
      );
    });

    it('should accept valid Claude models', async () => {
      const validModels = [
        'claude-sonnet-4-0',
        'claude-sonnet-4-5',
        'claude-opus-4-5',
        'claude-3-7-sonnet-latest',
        'claude-3-5-haiku-latest',
      ];

      for (const model of validModels) {
        const mockPrompt = createMockPrompt({ model });
        vi.spyOn(promptService, 'getByKey').mockResolvedValue(mockPrompt);
        vi.spyOn(abTestService, 'getActiveForPrompt').mockResolvedValue(null);

        const result = await resolver.resolve('TEST_PROMPT', false);
        expect(result.config.model).toBe(model);

        vi.restoreAllMocks();
      }
    });
  });
});
