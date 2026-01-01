/**
 * @file shared/__tests__/unit/responseFormatter.test.ts
 * @purpose Unit tests for formatResponsesForPrompt function
 * @functionality
 * - Tests that responses are formatted correctly
 * - Tests that labels are applied properly
 * - Tests language specification is included
 * @dependencies
 * - vitest for testing framework
 * - formatResponsesForPrompt function under test
 */


import { formatResponsesForPrompt } from '@/responseFormatter';
import type { AssessmentResponses } from '@/assessment.types';

// Complete mock assessment responses
const mockResponses: AssessmentResponses = {
  peak_energy_times: ['early_morning', 'mid_morning'],
  low_energy_times: ['afternoon', 'evening'],
  energy_consistency: 3,
  energy_drains: 'Too many meetings and context switching',
  energy_restores: 'Exercise and time in nature',
  mood_triggers_negative: ['lack_of_progress', 'overwhelm'],
  motivation_reliability: 4,
  willpower_pattern: 'distraction',
  identity_statements: 'I am someone who values learning and growth',
  others_describe: 'Thoughtful and analytical',
  automatic_behaviors: 'Checking email first thing in the morning',
  keystone_behaviors: 'Morning exercise routine',
  core_values: ['growth', 'autonomy', 'mastery'],
  natural_strengths: 'Problem solving and pattern recognition',
  resistance_patterns: 'Consistently struggle with maintaining focus on long-term projects',
  identity_clarity: 4,
};

describe('formatResponsesForPrompt', () => {
  it('should include language specification', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Language:** english');
  });

  it('should format with Polish language', () => {
    const result = formatResponsesForPrompt(mockResponses, 'polish');
    expect(result).toContain('**Language:** polish');
  });

  it('should include Phase 1: State Awareness section', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('## Phase 1: State Awareness');
  });

  it('should include Phase 2: Identity Mapping section', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('## Phase 2: Identity Mapping');
  });

  it('should format peak energy times with labels', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Peak Energy Times:** Early morning (5-8am), Mid-morning (8-11am)');
  });

  it('should format low energy times with labels', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Low Energy Times:** Afternoon (2-5pm), Evening (5-8pm)');
  });

  it('should format energy consistency rating', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Energy Consistency:** 3/5');
  });

  it('should include energy drains text', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**What Drains Energy:**');
    expect(result).toContain('Too many meetings and context switching');
  });

  it('should include energy restores text', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**What Restores Energy:**');
    expect(result).toContain('Exercise and time in nature');
  });

  it('should format mood triggers with labels', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain(
      '**Mood Triggers (Negative):** Feeling stuck or unproductive, Too many demands at once'
    );
  });

  it('should format motivation reliability rating', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Motivation Reliability:** 4/5');
  });

  it('should format willpower pattern with label', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain(
      '**Primary Failure Pattern:** Getting distracted - something else captures attention'
    );
  });

  it('should include identity statements text', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Identity Statements ("I am someone who..."):**');
    expect(result).toContain('I am someone who values learning and growth');
  });

  it('should include others describe text', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**How Others Describe Them:**');
    expect(result).toContain('Thoughtful and analytical');
  });

  it('should format core values with labels', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain(
      '**Core Values:** Growth & Learning, Autonomy & Independence, Mastery & Excellence'
    );
  });

  it('should format identity clarity rating', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toContain('**Identity Clarity:** 4/5');
  });

  it('should return trimmed output without leading/trailing whitespace', () => {
    const result = formatResponsesForPrompt(mockResponses, 'english');
    expect(result).toBe(result.trim());
  });

  it('should handle single-item arrays', () => {
    const singleItemResponses: AssessmentResponses = {
      ...mockResponses,
      peak_energy_times: ['midday'],
      core_values: ['integrity'],
    };
    const result = formatResponsesForPrompt(singleItemResponses, 'english');
    expect(result).toContain('**Peak Energy Times:** Midday (11am-2pm)');
    expect(result).toContain('**Core Values:** Integrity & Honesty');
  });
});
