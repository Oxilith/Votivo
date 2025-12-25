/**
 * @file prompt-service/src/validators/prompt.validator.ts
 * @purpose Zod validation schemas for prompt API endpoints
 * @functionality
 * - Validates prompt creation requests
 * - Validates prompt update requests
 * - Validates thinking variant configurations
 * - Provides type-safe request body parsing
 * @dependencies
 * - zod for schema validation
 */

import { z } from 'zod';

/**
 * Maximum allowed length for prompt content (~50KB)
 * Prevents memory exhaustion and ReDoS attacks from large inputs
 */
export const MAX_PROMPT_CONTENT_LENGTH = 50000;

const thinkingVariantSchema = z.object({
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
  budgetTokens: z.number().int().positive().optional(),
});

const nonThinkingVariantSchema = z.object({
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
});

export const createPromptSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be UPPER_SNAKE_CASE'),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.string().min(1).max(MAX_PROMPT_CONTENT_LENGTH),
  model: z.string().min(1),
  variants: z.object({
    withThinking: thinkingVariantSchema,
    withoutThinking: nonThinkingVariantSchema,
  }),
});

export const updatePromptSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  content: z.string().min(1).max(MAX_PROMPT_CONTENT_LENGTH).optional(),
  model: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  changedBy: z.string().max(100).optional(),
  changeNote: z.string().max(500).optional(),
  variants: z
    .object({
      withThinking: thinkingVariantSchema.partial().optional(),
      withoutThinking: nonThinkingVariantSchema.partial().optional(),
    })
    .optional(),
});

export const promptIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const promptKeyParamSchema = z.object({
  key: z.string().min(1),
});

export const versionIdParamSchema = z.object({
  id: z.string().uuid(),
  versionId: z.string().uuid(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
