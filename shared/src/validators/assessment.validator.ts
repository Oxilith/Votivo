/**
 * @file shared/src/validators/assessment.validator.ts
 * @purpose Zod schema for runtime validation of AssessmentResponses
 * @functionality
 * - Defines comprehensive Zod schema for assessment responses
 * - Validates enum values using shared validation constants
 * - Provides parseAssessmentResponses function for safe JSON parsing
 * - Ensures data integrity when deserializing from database/API
 * @dependencies
 * - zod for schema validation
 * - @/validation for enum value constants
 * - @/assessment.types for TypeScript types
 */

import { z } from 'zod';
import {
  TIME_OF_DAY_VALUES,
  MOOD_TRIGGER_VALUES,
  WILLPOWER_PATTERN_VALUES,
  CORE_VALUE_VALUES,
} from '@/validation';
import type { AssessmentResponses } from '@/assessment.types';

/**
 * Zod schema for TimeOfDay enum values
 */
const timeOfDaySchema = z.enum(TIME_OF_DAY_VALUES);

/**
 * Zod schema for MoodTrigger enum values
 */
const moodTriggerSchema = z.enum(MOOD_TRIGGER_VALUES);

/**
 * Zod schema for WillpowerPattern enum values
 */
const willpowerPatternSchema = z.enum(WILLPOWER_PATTERN_VALUES);

/**
 * Zod schema for CoreValue enum values
 */
const coreValueSchema = z.enum(CORE_VALUE_VALUES);

/**
 * Zod schema for AssessmentResponses
 *
 * Validates the complete structure of assessment responses including:
 * - Phase 1: State Awareness fields
 * - Phase 2: Identity Mapping fields
 * - All enum values against allowed constants
 * - Number fields within 1-5 scale range
 * - Required array minimums
 */
export const assessmentResponsesSchema = z.object({
  // Phase 1: State Awareness
  peak_energy_times: z.array(timeOfDaySchema).min(1),
  low_energy_times: z.array(timeOfDaySchema).min(1),
  energy_consistency: z.number().min(1).max(5),
  energy_drains: z.string().min(1),
  energy_restores: z.string().min(1),
  mood_triggers_negative: z.array(moodTriggerSchema).min(1),
  motivation_reliability: z.number().min(1).max(5),
  willpower_pattern: willpowerPatternSchema,

  // Phase 2: Identity Mapping
  identity_statements: z.string().min(1),
  others_describe: z.string().min(1),
  automatic_behaviors: z.string().min(1),
  keystone_behaviors: z.string().min(1),
  core_values: z.array(coreValueSchema).min(1),
  natural_strengths: z.string().min(1),
  resistance_patterns: z.string().min(1),
  identity_clarity: z.number().min(1).max(5),
});

/**
 * Parse and validate JSON string as AssessmentResponses
 *
 * @param json - JSON string to parse
 * @param context - Context string for error messages (e.g., "assessment abc123")
 * @returns Validated AssessmentResponses object
 * @throws ZodError if validation fails
 * @throws SyntaxError if JSON parsing fails
 *
 * @example
 * ```typescript
 * const responses = parseAssessmentResponses(jsonString, 'assessment user-123');
 * ```
 */
export function parseAssessmentResponses(
  json: string,
  context: string
): AssessmentResponses {
  try {
    const parsed: unknown = JSON.parse(json);
    return assessmentResponsesSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Invalid data structure (${context}): ${issues}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format (${context})`);
    }
    throw error;
  }
}
