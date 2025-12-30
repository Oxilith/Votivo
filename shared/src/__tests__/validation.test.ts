/**
 * @file shared/src/__tests__/validation.test.ts
 * @purpose Unit tests for validation constants and field metadata
 * @functionality
 * - Tests that all enum value arrays are defined and non-empty
 * - Tests that REQUIRED_FIELDS includes expected fields
 * - Tests field categorization consistency
 * @dependencies
 * - vitest for testing framework
 */

import { describe, it, expect } from 'vitest';
import {
  TIME_OF_DAY_VALUES,
  MOOD_TRIGGER_VALUES,
  WILLPOWER_PATTERN_VALUES,
  CORE_VALUE_VALUES,
  REQUIRED_FIELDS,
  ARRAY_FIELDS,
  NUMBER_FIELDS,
  STRING_FIELDS,
} from '../validation';

describe('Enum value arrays', () => {
  it('should define TIME_OF_DAY_VALUES with all expected values', () => {
    expect(TIME_OF_DAY_VALUES).toHaveLength(7);
    expect(TIME_OF_DAY_VALUES).toContain('early_morning');
    expect(TIME_OF_DAY_VALUES).toContain('mid_morning');
    expect(TIME_OF_DAY_VALUES).toContain('midday');
    expect(TIME_OF_DAY_VALUES).toContain('afternoon');
    expect(TIME_OF_DAY_VALUES).toContain('evening');
    expect(TIME_OF_DAY_VALUES).toContain('night');
    expect(TIME_OF_DAY_VALUES).toContain('late_night');
  });

  it('should define MOOD_TRIGGER_VALUES with all expected values', () => {
    expect(MOOD_TRIGGER_VALUES).toHaveLength(12);
    expect(MOOD_TRIGGER_VALUES).toContain('lack_of_progress');
    expect(MOOD_TRIGGER_VALUES).toContain('conflict');
    expect(MOOD_TRIGGER_VALUES).toContain('uncertainty');
    expect(MOOD_TRIGGER_VALUES).toContain('overwhelm');
    expect(MOOD_TRIGGER_VALUES).toContain('lack_of_control');
    expect(MOOD_TRIGGER_VALUES).toContain('poor_sleep');
    expect(MOOD_TRIGGER_VALUES).toContain('physical');
    expect(MOOD_TRIGGER_VALUES).toContain('isolation');
    expect(MOOD_TRIGGER_VALUES).toContain('overstimulation');
    expect(MOOD_TRIGGER_VALUES).toContain('criticism');
    expect(MOOD_TRIGGER_VALUES).toContain('comparison');
    expect(MOOD_TRIGGER_VALUES).toContain('boredom');
  });

  it('should define WILLPOWER_PATTERN_VALUES with all expected values', () => {
    expect(WILLPOWER_PATTERN_VALUES).toHaveLength(6);
    expect(WILLPOWER_PATTERN_VALUES).toContain('never_start');
    expect(WILLPOWER_PATTERN_VALUES).toContain('start_stop');
    expect(WILLPOWER_PATTERN_VALUES).toContain('distraction');
    expect(WILLPOWER_PATTERN_VALUES).toContain('perfectionism');
    expect(WILLPOWER_PATTERN_VALUES).toContain('energy');
    expect(WILLPOWER_PATTERN_VALUES).toContain('forget');
  });

  it('should define CORE_VALUE_VALUES with all expected values', () => {
    expect(CORE_VALUE_VALUES).toHaveLength(16);
    expect(CORE_VALUE_VALUES).toContain('growth');
    expect(CORE_VALUE_VALUES).toContain('autonomy');
    expect(CORE_VALUE_VALUES).toContain('mastery');
    expect(CORE_VALUE_VALUES).toContain('impact');
    expect(CORE_VALUE_VALUES).toContain('connection');
    expect(CORE_VALUE_VALUES).toContain('integrity');
    expect(CORE_VALUE_VALUES).toContain('creativity');
    expect(CORE_VALUE_VALUES).toContain('security');
    expect(CORE_VALUE_VALUES).toContain('adventure');
    expect(CORE_VALUE_VALUES).toContain('balance');
    expect(CORE_VALUE_VALUES).toContain('recognition');
    expect(CORE_VALUE_VALUES).toContain('service');
    expect(CORE_VALUE_VALUES).toContain('wisdom');
    expect(CORE_VALUE_VALUES).toContain('efficiency');
    expect(CORE_VALUE_VALUES).toContain('authenticity');
    expect(CORE_VALUE_VALUES).toContain('leadership');
  });
});

describe('REQUIRED_FIELDS', () => {
  it('should contain all required assessment fields', () => {
    expect(REQUIRED_FIELDS).toContain('peak_energy_times');
    expect(REQUIRED_FIELDS).toContain('low_energy_times');
    expect(REQUIRED_FIELDS).toContain('energy_consistency');
    expect(REQUIRED_FIELDS).toContain('energy_drains');
    expect(REQUIRED_FIELDS).toContain('energy_restores');
    expect(REQUIRED_FIELDS).toContain('mood_triggers_negative');
    expect(REQUIRED_FIELDS).toContain('motivation_reliability');
    expect(REQUIRED_FIELDS).toContain('willpower_pattern');
    expect(REQUIRED_FIELDS).toContain('identity_statements');
    expect(REQUIRED_FIELDS).toContain('others_describe');
    expect(REQUIRED_FIELDS).toContain('automatic_behaviors');
    expect(REQUIRED_FIELDS).toContain('keystone_behaviors');
    expect(REQUIRED_FIELDS).toContain('core_values');
    expect(REQUIRED_FIELDS).toContain('natural_strengths');
    expect(REQUIRED_FIELDS).toContain('resistance_patterns');
    expect(REQUIRED_FIELDS).toContain('identity_clarity');
  });

  it('should have 16 required fields', () => {
    expect(REQUIRED_FIELDS).toHaveLength(16);
  });
});

describe('Field categorization', () => {
  it('should categorize ARRAY_FIELDS correctly', () => {
    expect(ARRAY_FIELDS).toContain('peak_energy_times');
    expect(ARRAY_FIELDS).toContain('low_energy_times');
    expect(ARRAY_FIELDS).toContain('mood_triggers_negative');
    expect(ARRAY_FIELDS).toContain('core_values');
    expect(ARRAY_FIELDS).toHaveLength(4);
  });

  it('should categorize NUMBER_FIELDS correctly', () => {
    expect(NUMBER_FIELDS).toContain('energy_consistency');
    expect(NUMBER_FIELDS).toContain('motivation_reliability');
    expect(NUMBER_FIELDS).toContain('identity_clarity');
    expect(NUMBER_FIELDS).toHaveLength(3);
  });

  it('should categorize STRING_FIELDS correctly', () => {
    expect(STRING_FIELDS).toContain('energy_drains');
    expect(STRING_FIELDS).toContain('energy_restores');
    expect(STRING_FIELDS).toContain('willpower_pattern');
    expect(STRING_FIELDS).toContain('identity_statements');
    expect(STRING_FIELDS).toContain('others_describe');
    expect(STRING_FIELDS).toContain('automatic_behaviors');
    expect(STRING_FIELDS).toContain('keystone_behaviors');
    expect(STRING_FIELDS).toContain('natural_strengths');
    expect(STRING_FIELDS).toContain('resistance_patterns');
    expect(STRING_FIELDS).toHaveLength(9);
  });

  it('should cover all required fields across categories', () => {
    const allCategorized = [...ARRAY_FIELDS, ...NUMBER_FIELDS, ...STRING_FIELDS];
    for (const field of REQUIRED_FIELDS) {
      expect(allCategorized).toContain(field);
    }
  });
});
