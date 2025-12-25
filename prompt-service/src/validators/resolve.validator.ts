/**
 * @file prompt-service/src/validators/resolve.validator.ts
 * @purpose Zod validation schemas for prompt resolution API
 * @functionality
 * - Validates prompt resolution requests
 * - Validates conversion tracking requests
 * @dependencies
 * - zod for schema validation
 */

import { z } from 'zod';

export const resolvePromptSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be UPPER_SNAKE_CASE'),
  thinkingEnabled: z.boolean(),
});

export const variantIdParamSchema = z.object({
  variantId: z.string().uuid(),
});

export type ResolvePromptInput = z.infer<typeof resolvePromptSchema>;
