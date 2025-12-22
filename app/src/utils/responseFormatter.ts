/**
 * @file src/utils/responseFormatter.ts
 * @purpose Formats assessment responses into structured text for AI analysis
 * @functionality
 * - Converts response object to formatted markdown string
 * - Maps internal IDs to human-readable labels
 * - Structures data for optimal Claude analysis
 * @dependencies
 * - @/types/assessment.types (AssessmentResponses)
 */

import type { AssessmentResponses, TimeOfDay, MoodTrigger, CoreValue, WillpowerPattern } from '@/types/assessment.types';

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

export const willpowerLabels: Record<WillpowerPattern, string> = {
  never_start: 'Never starting - task feels too big or unclear',
  start_stop: 'Starting but stopping quickly - momentum fades',
  distraction: 'Getting distracted - something else captures attention',
  perfectionism: 'Overthinking and stalling - analysis paralysis',
  energy: 'Running out of energy - willpower depletes',
  forget: 'Simply forgetting - falls off radar',
};

export const formatResponsesForPrompt = (responses: AssessmentResponses): string => {
  return `
## Phase 1: State Awareness

**Peak Energy Times:** ${responses.peak_energy_times.map((t) => timeLabels[t]).join(', ')}

**Low Energy Times:** ${responses.low_energy_times.map((t) => timeLabels[t]).join(', ')}

**Energy Consistency:** ${responses.energy_consistency}/5

**What Drains Energy:**
${responses.energy_drains}

**What Restores Energy:**
${responses.energy_restores}

**Mood Triggers (Negative):** ${responses.mood_triggers_negative.map((t) => triggerLabels[t]).join(', ')}

**Motivation Reliability:** ${responses.motivation_reliability}/5

**Primary Failure Pattern:** ${willpowerLabels[responses.willpower_pattern]}

## Phase 2: Identity Mapping

**Identity Statements ("I am someone who..."):**
${responses.identity_statements}

**How Others Describe Them:**
${responses.others_describe}

**Automatic Behaviors (Current Habits):**
${responses.automatic_behaviors}

**Keystone Behaviors (High-Leverage):**
${responses.keystone_behaviors}

**Core Values:** ${responses.core_values.map((v) => valueLabels[v]).join(', ')}

**Natural Strengths:**
${responses.natural_strengths}

**Resistance Patterns (Areas of Repeated Failed Change):**
${responses.resistance_patterns}

**Identity Clarity:** ${responses.identity_clarity}/5
`.trim();
};
