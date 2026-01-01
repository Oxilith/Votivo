/**
 * @file prompt-service/__tests__/unit/services/prompt.service.test.ts
 * @purpose Unit tests for PromptService CRUD operations and input validation
 * @functionality
 * - Tests prompt key validation format
 * - Tests content sanitization (XSS prevention)
 * - Tests getAll, getById, getByKey service methods
 * - Verifies ValidationError is thrown for invalid input
 * @dependencies
 * - vitest for testing framework
 * - Prisma client mock for database operations
 * - Sanitization utilities for validation
 */

import type { Prompt, PromptVariant } from '@votive/shared/prisma';
import { ValidationError } from '@/errors';
import { validatePromptContent, validatePromptKey } from '@/utils';

// Create mock Prisma object with hoisting
const mockPrismaObj = vi.hoisted(() => ({
  prompt: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  promptVersion: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  promptVariant: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock modules
vi.mock('@/prisma', () => ({
  prisma: mockPrismaObj,
}));

// Import after mocking
import { PromptService } from '@/services';

// Sample data for tests
const sampleVariant: PromptVariant = {
  id: 'variant-1',
  promptId: 'prompt-1',
  variantType: 'withThinking',
  temperature: 0.7,
  maxTokens: 4000,
  thinkingType: 'enabled',
  budgetTokens: 10000,
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const samplePrompt: Prompt & { variants: PromptVariant[] } = {
  id: 'prompt-1',
  key: 'IDENTITY_ANALYSIS',
  name: 'Identity Analysis',
  description: 'Analyzes user identity',
  content: 'You are an assistant that analyzes {{data}}',
  model: 'claude-sonnet-4-20250514',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  variants: [sampleVariant],
};

describe('Prompt Validation', () => {
  describe('validatePromptKey', () => {
    it('should accept valid uppercase keys', () => {
      expect(() => { validatePromptKey('IDENTITY_ANALYSIS'); }).not.toThrow();
      expect(() => { validatePromptKey('TEST_PROMPT_1'); }).not.toThrow();
      expect(() => { validatePromptKey('A'); }).not.toThrow();
    });

    it('should reject lowercase keys', () => {
      expect(() => { validatePromptKey('invalid-key'); }).toThrow(ValidationError);
      expect(() => { validatePromptKey('lowercase'); }).toThrow(ValidationError);
    });

    it('should reject keys starting with numbers', () => {
      expect(() => { validatePromptKey('1_INVALID'); }).toThrow(ValidationError);
    });

    it('should reject keys with special characters', () => {
      expect(() => { validatePromptKey('TEST-KEY'); }).toThrow(ValidationError);
      expect(() => { validatePromptKey('TEST.KEY'); }).toThrow(ValidationError);
    });
  });

  describe('validatePromptContent', () => {
    it('should accept valid prompt content', () => {
      expect(() => { validatePromptContent('Analyze the following: {{data}}'); }).not.toThrow();
      expect(() => { validatePromptContent('You are an AI assistant.'); }).not.toThrow();
      expect(() => { validatePromptContent('Return JSON: {"key": "value"}'); }).not.toThrow();
    });

    it('should reject script tags', () => {
      expect(() => { validatePromptContent('<script>alert("xss")</script>'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<SCRIPT src="evil.js"></SCRIPT>'); }).toThrow(ValidationError);
    });

    it('should reject event handlers', () => {
      expect(() => { validatePromptContent('<div onclick="evil()">Click</div>'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<img onload="hack()" src="x">'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<body onmouseover="steal()">'); }).toThrow(ValidationError);
    });

    it('should reject javascript: URLs', () => {
      expect(() => { validatePromptContent('<a href="javascript:alert(1)">'); }).toThrow(ValidationError);
    });

    it('should reject iframe tags', () => {
      expect(() => { validatePromptContent('<iframe src="evil.com"></iframe>'); }).toThrow(ValidationError);
    });

    it('should reject object and embed tags', () => {
      expect(() => { validatePromptContent('<object data="evil.swf">'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<embed src="evil.swf">'); }).toThrow(ValidationError);
    });

    it('should reject data: URLs with HTML', () => {
      expect(() => { validatePromptContent('data: text/html,<script>evil()</script>'); }).toThrow(ValidationError);
    });

    it('should reject CSS expression hacks', () => {
      expect(() => { validatePromptContent('expression(alert(1))'); }).toThrow(ValidationError);
    });
  });
});

describe('PromptService', () => {
  let promptService: PromptService;
  const mockPrisma = mockPrismaObj;

  beforeEach(() => {
    vi.clearAllMocks();
    promptService = new PromptService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('should return all active prompts with variants', async () => {
      mockPrisma.prompt.findMany.mockResolvedValue([samplePrompt]);

      const result = await promptService.getAll();

      expect(result).toEqual([samplePrompt]);
      expect(mockPrisma.prompt.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no prompts exist', async () => {
      mockPrisma.prompt.findMany.mockResolvedValue([]);

      const result = await promptService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return prompt by ID with variants', async () => {
      mockPrisma.prompt.findUnique.mockResolvedValue(samplePrompt);

      const result = await promptService.getById('prompt-1');

      expect(result).toEqual(samplePrompt);
      expect(mockPrisma.prompt.findUnique).toHaveBeenCalledWith({
        where: { id: 'prompt-1' },
        include: { variants: true },
      });
    });

    it('should return null for non-existent prompt', async () => {
      mockPrisma.prompt.findUnique.mockResolvedValue(null);

      const result = await promptService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByKey', () => {
    it('should return prompt by key with variants', async () => {
      mockPrisma.prompt.findUnique.mockResolvedValue(samplePrompt);

      const result = await promptService.getByKey('IDENTITY_ANALYSIS');

      expect(result).toEqual(samplePrompt);
      expect(mockPrisma.prompt.findUnique).toHaveBeenCalledWith({
        where: { key: 'IDENTITY_ANALYSIS' },
        include: { variants: true },
      });
    });

    it('should return null for non-existent key', async () => {
      mockPrisma.prompt.findUnique.mockResolvedValue(null);

      const result = await promptService.getByKey('NON_EXISTENT_KEY');

      expect(result).toBeNull();
    });
  });
});
