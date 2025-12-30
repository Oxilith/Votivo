/**
 * @file src/data/sampleResponses.ts
 * @purpose Sample assessment responses for development and testing
 * @functionality
 * - Provides pre-filled sample data for quick testing
 * - Demonstrates the expected data structure for AssessmentResponses
 * @dependencies
 * - @/types (AssessmentResponses)
 */

import type { AssessmentResponses } from '@/types';

const sampleResponses: AssessmentResponses = {
  peak_energy_times: ['mid_morning', 'night', 'late_night'],
  low_energy_times: ['early_morning', 'midday', 'afternoon'],
  energy_consistency: 2,
  energy_drains: '- Context switching\n- Ambiguity',
  energy_restores: '- Talking with someone\n- Meeting with someone\n- Listening to music',
  mood_triggers_negative: ['conflict', 'uncertainty', 'overwhelm', 'lack_of_control', 'boredom'],
  motivation_reliability: 2,
  willpower_pattern: 'energy',
  identity_statements:
    'I am someone who tends not to finish what I start. I am someone for whom relationships matter. I am someone who likes to learn new stuff. I am someone who likes to listen to music. I am someone who likes clarity. I value honesty and transparency.',
  others_describe:
    'They would say I sometimes drift away from the goal. They would say that sometimes it is hard to talk to me.',
  automatic_behaviors:
    '- Make coffee first thing in the morning.\n- I tend to open YouTube or LinkedIn when I am bored.\n- Start thinking about what I should do, yet I rarely start doing that.\n- Smoke when bored.',
  keystone_behaviors: '- Consistent sleep schedule\n- Learning something each day',
  core_values: ['growth', 'autonomy', 'connection', 'integrity', 'recognition', 'wisdom', 'authenticity'],
  natural_strengths: '- Working long hours\n- Analysing everything',
  resistance_patterns: '- Negative thinking\n- Smoking\n- Low self-esteem',
  identity_clarity: 3,
};

export default sampleResponses;
