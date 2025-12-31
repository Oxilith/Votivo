/**
 * @file prompt-service/src/validators/ab-test.validator.ts
 * @purpose Zod validation schemas for A/B test API endpoints
 * @functionality
 * - Validates A/B test creation requests
 * - Validates A/B test update requests
 * - Validates variant creation and updates
 * - Provides type-safe request body parsing
 * @dependencies
 * - zod for schema validation
 */

import { z } from 'zod';

export const createABTestSchema = z.object({
  promptId: z.uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startDate: z.iso.datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.iso.datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export const updateABTestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  startDate: z
    .iso.datetime()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  endDate: z
    .iso.datetime()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

const variantConfigSchema = z.object({
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
  budgetTokens: z.number().int().positive().optional(),
});

export const createABVariantSchema = z.object({
  name: z.string().min(1).max(200),
  content: z.string().min(1),
  model: z.string().min(1),
  weight: z.number().min(0).max(1).optional(),
  configs: z
    .object({
      withThinking: variantConfigSchema.optional(),
      withoutThinking: variantConfigSchema.omit({ budgetTokens: true }).optional(),
    })
    .optional(),
});

export const updateABVariantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  weight: z.number().min(0).max(1).optional(),
});

export const abTestIdParamSchema = z.object({
  id: z.uuid(),
});

export const variantIdParamSchema = z.object({
  id: z.uuid(),
  variantId: z.uuid(),
});

export type CreateABTestInput = z.infer<typeof createABTestSchema>;
export type UpdateABTestInput = z.infer<typeof updateABTestSchema>;
export type CreateABVariantInput = z.infer<typeof createABVariantSchema>;
export type UpdateABVariantInput = z.infer<typeof updateABVariantSchema>;
