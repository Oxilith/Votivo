/**
 * @file shared/src/validation.ts
 * @purpose Single source of truth for validation constants and field metadata
 * @functionality
 * - Exports enum value arrays for Zod schema construction in backend
 * - Exports REQUIRED_FIELDS array for completion validation
 * - Exports field categorization (array, number, string fields)
 * - Exports password validation constants and utilities
 * - Ensures backend and app validation stays in sync
 * @dependencies
 * - ./assessment.types for AssessmentResponses type
 */

import type { AssessmentResponses } from '@/assessment.types';

// Enum value arrays (used by backend Zod schemas)
export const TIME_OF_DAY_VALUES = [
  'early_morning',
  'mid_morning',
  'midday',
  'afternoon',
  'evening',
  'night',
  'late_night',
] as const;

export const MOOD_TRIGGER_VALUES = [
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
] as const;

export const WILLPOWER_PATTERN_VALUES = [
  'never_start',
  'start_stop',
  'distraction',
  'perfectionism',
  'energy',
  'forget',
] as const;

export const CORE_VALUE_VALUES = [
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
] as const;

export const GENDER_VALUES = ['male', 'female', 'other', 'prefer-not-to-say'] as const;

// Required fields for completion validation
export const REQUIRED_FIELDS: (keyof AssessmentResponses)[] = [
  'peak_energy_times',
  'low_energy_times',
  'energy_consistency',
  'energy_drains',
  'energy_restores',
  'mood_triggers_negative',
  'motivation_reliability',
  'willpower_pattern',
  'identity_statements',
  'others_describe',
  'automatic_behaviors',
  'keystone_behaviors',
  'core_values',
  'natural_strengths',
  'resistance_patterns',
  'identity_clarity',
];

// Field categorization for validation logic
export const ARRAY_FIELDS: (keyof AssessmentResponses)[] = [
  'peak_energy_times',
  'low_energy_times',
  'mood_triggers_negative',
  'core_values',
];

export const NUMBER_FIELDS: (keyof AssessmentResponses)[] = [
  'energy_consistency',
  'motivation_reliability',
  'identity_clarity',
];

export const STRING_FIELDS: (keyof AssessmentResponses)[] = [
  'energy_drains',
  'energy_restores',
  'willpower_pattern',
  'identity_statements',
  'others_describe',
  'automatic_behaviors',
  'keystone_behaviors',
  'natural_strengths',
  'resistance_patterns',
];

// Password validation constants
/** Minimum password length */
export const PASSWORD_MIN_LENGTH = 8;

/** Maximum password length */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Password strength regex pattern.
 * Requires: at least 1 lowercase letter, 1 uppercase letter, 1 digit, minimum 8 characters.
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Human-readable password requirements message for validation errors.
 */
export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, and one number';

/**
 * Validates password against strength requirements.
 * @param password - Password to validate
 * @returns true if password meets requirements
 */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_REGEX.test(password)
  );
}

