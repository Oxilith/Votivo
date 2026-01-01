/**
 * @file shared/src/assessment.types.ts
 * @purpose Single source of truth for assessment type definitions shared between app and backend
 * @functionality
 * - Defines TimeOfDay type union for energy time selections
 * - Defines MoodTrigger type union for negative mood trigger selections
 * - Defines CoreValue type union for core values selections
 * - Defines WillpowerPattern type union for willpower pattern selections
 * - Defines AssessmentResponses interface for complete assessment data
 * @dependencies
 * - None (pure TypeScript types)
 */

// Time of day options for energy level questions
export type TimeOfDay =
  | 'early_morning'
  | 'mid_morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late_night';

// Mood trigger options for negative mood question
export type MoodTrigger =
  | 'lack_of_progress'
  | 'conflict'
  | 'uncertainty'
  | 'overwhelm'
  | 'lack_of_control'
  | 'poor_sleep'
  | 'physical'
  | 'isolation'
  | 'overstimulation'
  | 'criticism'
  | 'comparison'
  | 'boredom';

// Core value options for values question
export type CoreValue =
  | 'growth'
  | 'autonomy'
  | 'mastery'
  | 'impact'
  | 'connection'
  | 'integrity'
  | 'creativity'
  | 'security'
  | 'adventure'
  | 'balance'
  | 'recognition'
  | 'service'
  | 'wisdom'
  | 'efficiency'
  | 'authenticity'
  | 'leadership';

// Willpower pattern options for willpower question
export type WillpowerPattern =
  | 'never_start'
  | 'start_stop'
  | 'distraction'
  | 'perfectionism'
  | 'energy'
  | 'forget';

// Main assessment responses interface
export interface AssessmentResponses {
  // Phase 1: State Awareness
  peak_energy_times: TimeOfDay[];
  low_energy_times: TimeOfDay[];
  energy_consistency: number; // 1-5 scale
  energy_drains: string;
  energy_restores: string;
  mood_triggers_negative: MoodTrigger[];
  motivation_reliability: number; // 1-5 scale
  willpower_pattern: WillpowerPattern;

  // Phase 2: Identity Mapping
  identity_statements: string;
  others_describe: string;
  automatic_behaviors: string;
  keystone_behaviors: string;
  core_values: CoreValue[];
  natural_strengths: string;
  resistance_patterns: string;
  identity_clarity: number; // 1-5 scale
}
