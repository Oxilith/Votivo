/**
 * @file validators/claude.validator.ts
 * @purpose Request validation schemas for Claude API endpoints
 * @functionality
 * - Defines Zod schemas for request body validation
 * - Validates assessment responses structure
 * - Ensures language parameter is valid
 * - Provides type-safe validation errors
 * @dependencies
 * - zod for schema validation
 */

import { z } from 'zod';

const timeOfDaySchema = z.enum([
  'early_morning',
  'mid_morning',
  'midday',
  'afternoon',
  'evening',
  'night',
  'late_night',
]);

const moodTriggerSchema = z.enum([
  'lack_of_progress',
  'conflict',
  'uncertainty',
  'overwhelm',
  'lack_of_control',
  'poor_sleep',
  'physical',
  'isolation',
  'overstimulation',
  'criticism',
  'comparison',
  'boredom',
]);

const willpowerPatternSchema = z.enum([
  'never_start',
  'start_stop',
  'distraction',
  'perfectionism',
  'energy',
  'forget',
]);

const coreValueSchema = z.enum([
  'growth',
  'autonomy',
  'mastery',
  'impact',
  'connection',
  'integrity',
  'creativity',
  'security',
  'adventure',
  'balance',
  'recognition',
  'service',
  'wisdom',
  'efficiency',
  'authenticity',
  'leadership',
]);

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
  language: z.enum(['english', 'polish']).default('english'),
});

export type ValidatedAnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
