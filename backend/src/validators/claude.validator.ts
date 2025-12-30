/**
 * @file validators/claude.validator.ts
 * @purpose Request validation schemas for Claude API endpoints
 * @functionality
 * - Defines Zod schemas for request body validation
 * - Validates assessment responses structure using shared enum arrays
 * - Validates optional user profile for demographic context
 * - Ensures language parameter is valid
 * - Provides type-safe validation errors
 * @dependencies
 * - zod for schema validation
 * - shared for enum value arrays and supported languages
 */

import { z } from 'zod';
import {
  TIME_OF_DAY_VALUES,
  MOOD_TRIGGER_VALUES,
  WILLPOWER_PATTERN_VALUES,
  CORE_VALUE_VALUES,
  GENDER_VALUES,
  SUPPORTED_LANGUAGES,
} from 'shared';

const timeOfDaySchema = z.enum(TIME_OF_DAY_VALUES);
const moodTriggerSchema = z.enum(MOOD_TRIGGER_VALUES);
const willpowerPatternSchema = z.enum(WILLPOWER_PATTERN_VALUES);
const coreValueSchema = z.enum(CORE_VALUE_VALUES);
const genderSchema = z.enum(GENDER_VALUES);

// Optional user profile for demographic context in analysis
const userProfileSchema = z
  .object({
    name: z.string().min(1),
    age: z.number().min(13).max(120),
    gender: genderSchema.nullable(),
  })
  .optional();

const assessmentResponsesSchema = z.object({
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

export const analyzeRequestSchema = z.object({
  responses: assessmentResponsesSchema,
  language: z.enum(SUPPORTED_LANGUAGES).default('english'),
  userProfile: userProfileSchema,
});

export type ValidatedAnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
