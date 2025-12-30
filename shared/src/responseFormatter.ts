/**
 * @file shared/src/responseFormatter.ts
 * @purpose Formats assessment responses into structured text for AI analysis
 * @functionality
 * - Converts AssessmentResponses object to formatted markdown string
 * - Maps enum values to human-readable labels
 * - Structures data by assessment phases for optimal AI comprehension
 * - Includes language specification for multilingual analysis
 * - Includes optional user profile for demographic context
 * @dependencies
 * - ./assessment.types for AssessmentResponses type
 * - ./api.types for AnalysisLanguage and UserProfileForAnalysis types
 * - ./auth.types for Gender type
 * - ./labels for label mappings
 */

import type { AssessmentResponses } from '@/assessment.types';
import type { AnalysisLanguage, UserProfileForAnalysis } from '@/api.types';
import type { Gender } from '@/auth.types';
import { valueLabels, timeLabels, triggerLabels, willpowerLabels } from '@/labels';

/**
 * Formats gender value for display in prompt
 * @param gender - The gender value
 * @returns Human-readable gender string
 */
const formatGender = (gender: Gender): string => {
  if (gender === 'prefer-not-to-say') return 'Not specified';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

/**
 * Formats assessment responses into a structured markdown string for AI analysis
 * @param responses - The assessment responses to format
 * @param language - The language for AI analysis output
 * @param userProfile - Optional user profile for demographic context
 * @returns Formatted markdown string
 */
export const formatResponsesForPrompt = (
  responses: AssessmentResponses,
  language: AnalysisLanguage,
  userProfile?: UserProfileForAnalysis
): string => {
  const userSection = userProfile
    ? `
## User Profile

**Name:** ${userProfile.name}
**Age:** ${userProfile.age} years old
**Gender:** ${formatGender(userProfile.gender)}
`
    : '';

  return `
**Language:** ${language}
${userSection}
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
