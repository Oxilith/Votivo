/**
 * @file shared/src/testing/fixtures/assessment.fixture.ts
 * @purpose Factory functions for creating mock assessment data
 * @functionality
 * - Creates complete AssessmentResponses objects with valid enum values
 * - Creates partial assessment data for testing in-progress states
 * - Creates mock Assessment database records
 * @dependencies
 * - @faker-js/faker for realistic data generation
 * - @/assessment.types for type definitions
 * - @/validation for enum value arrays
 */

import { faker } from '@faker-js/faker';
import type {
  AssessmentResponses,
  TimeOfDay,
  MoodTrigger,
  CoreValue,
  WillpowerPattern,
} from '@/assessment.types';
import {
  TIME_OF_DAY_VALUES,
  MOOD_TRIGGER_VALUES,
  CORE_VALUE_VALUES,
  WILLPOWER_PATTERN_VALUES,
} from '@/validation';
import type { JsonString } from './index';

/**
 * Options for creating a complete assessment
 */
export type MockAssessmentResponsesOptions = Partial<AssessmentResponses>;

/**
 * Creates a complete, valid AssessmentResponses object.
 * All fields are populated with valid values from the enum constants.
 *
 * @param overrides - Optional overrides for specific fields
 * @returns Complete AssessmentResponses object
 *
 * @example
 * ```typescript
 * const responses = createCompleteAssessment({
 *   energy_consistency: 5,
 *   core_values: ['growth', 'mastery'],
 * });
 * ```
 */
export function createCompleteAssessment(
  overrides: MockAssessmentResponsesOptions = {}
): AssessmentResponses {
  return {
    // Phase 1: State Awareness
    peak_energy_times:
      overrides.peak_energy_times ??
      faker.helpers.arrayElements([...TIME_OF_DAY_VALUES] as TimeOfDay[], {
        min: 1,
        max: 3,
      }),
    low_energy_times:
      overrides.low_energy_times ??
      faker.helpers.arrayElements([...TIME_OF_DAY_VALUES] as TimeOfDay[], {
        min: 1,
        max: 3,
      }),
    energy_consistency:
      overrides.energy_consistency ?? faker.number.int({ min: 1, max: 5 }),
    energy_drains: overrides.energy_drains ?? faker.lorem.sentence(),
    energy_restores: overrides.energy_restores ?? faker.lorem.sentence(),
    mood_triggers_negative:
      overrides.mood_triggers_negative ??
      faker.helpers.arrayElements([...MOOD_TRIGGER_VALUES] as MoodTrigger[], {
        min: 1,
        max: 4,
      }),
    motivation_reliability:
      overrides.motivation_reliability ?? faker.number.int({ min: 1, max: 5 }),
    willpower_pattern:
      overrides.willpower_pattern ??
      (faker.helpers.arrayElement([
        ...WILLPOWER_PATTERN_VALUES,
      ]) as WillpowerPattern),

    // Phase 2: Identity Mapping
    identity_statements:
      overrides.identity_statements ?? faker.lorem.paragraph(),
    others_describe: overrides.others_describe ?? faker.lorem.sentence(),
    automatic_behaviors:
      overrides.automatic_behaviors ?? faker.lorem.sentence(),
    keystone_behaviors: overrides.keystone_behaviors ?? faker.lorem.sentence(),
    core_values:
      overrides.core_values ??
      faker.helpers.arrayElements([...CORE_VALUE_VALUES] as CoreValue[], {
        min: 3,
        max: 5,
      }),
    natural_strengths: overrides.natural_strengths ?? faker.lorem.sentence(),
    resistance_patterns:
      overrides.resistance_patterns ?? faker.lorem.sentence(),
    identity_clarity:
      overrides.identity_clarity ?? faker.number.int({ min: 1, max: 5 }),
  };
}

/**
 * Options for creating a mock Assessment database record
 */
export interface MockAssessmentRecordOptions {
  id?: string;
  userId?: string;
  responses?: Partial<AssessmentResponses>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mock Assessment database record.
 * The responses field uses JsonString to indicate it contains serialized AssessmentResponses.
 */
export interface MockAssessmentRecord {
  id: string;
  userId: string;
  responses: JsonString<AssessmentResponses>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a mock Assessment database record.
 * Responses are JSON-stringified as they would be stored in the database.
 *
 * @param options - Optional overrides for record fields
 * @returns Mock Assessment record with JSON-stringified responses
 *
 * @example
 * ```typescript
 * const assessment = createMockAssessment({ userId: 'user-123' });
 * expect(JSON.parse(assessment.responses)).toBeDefined();
 * ```
 */
export function createMockAssessment(
  options: MockAssessmentRecordOptions = {}
): MockAssessmentRecord {
  const responses = createCompleteAssessment(options.responses);
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    responses: JSON.stringify(responses) as JsonString<AssessmentResponses>,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates a partial assessment with only the specified fields.
 * Useful for testing in-progress or incomplete assessments.
 *
 * @param fieldsToInclude - Array of field names to include
 * @returns Partial AssessmentResponses with only specified fields
 *
 * @example
 * ```typescript
 * // Phase 1 only
 * const partial = createPartialAssessment([
 *   'peak_energy_times',
 *   'low_energy_times',
 *   'energy_consistency',
 * ]);
 * ```
 */
export function createPartialAssessment(
  fieldsToInclude: (keyof AssessmentResponses)[]
): Partial<AssessmentResponses> {
  const complete = createCompleteAssessment();
  const partial: Partial<AssessmentResponses> = {};

  for (const field of fieldsToInclude) {
    // TypeScript doesn't narrow the type here, so we use type assertion
    (partial as Record<keyof AssessmentResponses, unknown>)[field] =
      complete[field];
  }

  return partial;
}

/**
 * Creates Phase 1 (State Awareness) responses only.
 *
 * @param overrides - Optional overrides for Phase 1 fields
 * @returns Partial AssessmentResponses with Phase 1 fields
 */
export function createPhase1Assessment(
  overrides: Partial<AssessmentResponses> = {}
): Partial<AssessmentResponses> {
  const complete = createCompleteAssessment(overrides);

  return {
    peak_energy_times: complete.peak_energy_times,
    low_energy_times: complete.low_energy_times,
    energy_consistency: complete.energy_consistency,
    energy_drains: complete.energy_drains,
    energy_restores: complete.energy_restores,
    mood_triggers_negative: complete.mood_triggers_negative,
    motivation_reliability: complete.motivation_reliability,
    willpower_pattern: complete.willpower_pattern,
  };
}

/**
 * Creates Phase 2 (Identity Mapping) responses only.
 *
 * @param overrides - Optional overrides for Phase 2 fields
 * @returns Partial AssessmentResponses with Phase 2 fields
 */
export function createPhase2Assessment(
  overrides: Partial<AssessmentResponses> = {}
): Partial<AssessmentResponses> {
  const complete = createCompleteAssessment(overrides);

  return {
    identity_statements: complete.identity_statements,
    others_describe: complete.others_describe,
    automatic_behaviors: complete.automatic_behaviors,
    keystone_behaviors: complete.keystone_behaviors,
    core_values: complete.core_values,
    natural_strengths: complete.natural_strengths,
    resistance_patterns: complete.resistance_patterns,
    identity_clarity: complete.identity_clarity,
  };
}

/**
 * App format for saved assessments (parsed JSON, ISO date strings).
 * Use this type for app store tests where data is already parsed.
 */
export interface SavedAssessmentApp {
  id: string;
  userId: string;
  responses: AssessmentResponses;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a mock assessment in app format (parsed responses, ISO date strings).
 * Use this for testing app stores where data has already been processed.
 *
 * @param options - Optional overrides for record fields
 * @returns Mock assessment in app-ready format
 *
 * @example
 * ```typescript
 * const assessment = createMockSavedAssessment({ userId: 'user-123' });
 * expect(assessment.responses.core_values).toBeDefined();
 * ```
 */
export function createMockSavedAssessment(
  options: MockAssessmentRecordOptions = {}
): SavedAssessmentApp {
  const responses = createCompleteAssessment(options.responses);
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    responses,
    createdAt: (options.createdAt ?? now).toISOString(),
    updatedAt: (options.updatedAt ?? now).toISOString(),
  };
}
