/**
 * @file shared/src/labels.ts
 * @purpose Single source of truth for human-readable label mappings
 * @functionality
 * - Maps TimeOfDay enum values to human-readable labels
 * - Maps MoodTrigger enum values to human-readable labels
 * - Maps CoreValue enum values to human-readable labels
 * - Maps WillpowerPattern enum values to human-readable labels
 * @dependencies
 * - ./assessment.types for type definitions
 */

import type { TimeOfDay, MoodTrigger, CoreValue, WillpowerPattern } from '@/assessment.types';

export const timeLabels: Record<TimeOfDay, string> = {
  early_morning: 'Early morning (5-8am)',
  mid_morning: 'Mid-morning (8-11am)',
  midday: 'Midday (11am-2pm)',
  afternoon: 'Afternoon (2-5pm)',
  evening: 'Evening (5-8pm)',
  night: 'Night (8pm-12am)',
  late_night: 'Late night (after midnight)',
};

export const triggerLabels: Record<MoodTrigger, string> = {
  lack_of_progress: 'Feeling stuck or unproductive',
  conflict: 'Interpersonal conflict or tension',
  uncertainty: 'Ambiguity or uncertainty',
  overwhelm: 'Too many demands at once',
  lack_of_control: 'Feeling out of control',
  poor_sleep: 'Poor sleep the night before',
  physical: 'Physical discomfort',
  isolation: 'Too much time alone',
  overstimulation: 'Too much social interaction',
  criticism: 'Criticism or negative feedback',
  comparison: 'Comparing yourself to others',
  boredom: 'Lack of challenge or meaning',
};

export const valueLabels: Record<CoreValue, string> = {
  growth: 'Growth & Learning',
  autonomy: 'Autonomy & Independence',
  mastery: 'Mastery & Excellence',
  impact: 'Impact & Contribution',
  connection: 'Connection & Relationships',
  integrity: 'Integrity & Honesty',
  creativity: 'Creativity & Innovation',
  security: 'Security & Stability',
  adventure: 'Adventure & Novelty',
  balance: 'Balance & Harmony',
  recognition: 'Recognition & Status',
  service: 'Service & Helping Others',
  wisdom: 'Wisdom & Understanding',
  efficiency: 'Efficiency & Optimization',
  authenticity: 'Authenticity & Self-expression',
  leadership: 'Leadership & Influence',
};

export const willpowerLabels: Record<WillpowerPattern, string> = {
  never_start: 'Never starting - task feels too big or unclear',
  start_stop: 'Starting but stopping quickly - momentum fades',
  distraction: 'Getting distracted - something else captures attention',
  perfectionism: 'Overthinking and stalling - analysis paralysis',
  energy: 'Running out of energy - willpower depletes',
  forget: 'Simply forgetting - falls off radar',
};
