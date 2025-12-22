/**
 * @file src/utils/responseFormatter.ts
 * @purpose Formats assessment responses into structured text for AI analysis
 * @functionality
 * - Converts response object to formatted markdown string
 * - Re-exports shared label mappings for use in components
 * - Structures data for optimal Claude analysis
 * @dependencies
 * - @/types/assessment.types (AssessmentResponses)
 * - @shared/index (shared label mappings)
 */

import type { AssessmentResponses } from '@/types/assessment.types';
import {
  valueLabels,
  timeLabels,
  triggerLabels,
  willpowerLabels,
} from '@shared/index';

// Re-export labels for components that import from this file
export { valueLabels, timeLabels, triggerLabels, willpowerLabels };

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
