/**
 * @file shared/src/validators/analysis.validator.ts
 * @purpose Zod schema for runtime validation of AIAnalysisResult
 * @functionality
 * - Defines comprehensive Zod schema for AI analysis results
 * - Validates all nested objects (patterns, contradictions, blindSpots, etc.)
 * - Provides parseAIAnalysisResult function for safe JSON parsing
 * - Ensures data integrity when deserializing from database/API
 * @dependencies
 * - zod for schema validation
 * - @/analysis.types for TypeScript types
 */

import { z } from 'zod';
import type { AIAnalysisResult } from '@/analysis.types';

/**
 * Zod schema for AnalysisPattern
 */
const analysisPatternSchema = z.object({
  title: z.string(),
  icon: z.string(),
  severity: z.enum(['high', 'medium']),
  description: z.string(),
  evidence: z.array(z.string()),
  implication: z.string(),
  leverage: z.string(),
});

/**
 * Zod schema for AnalysisContradiction
 */
const analysisContradictionSchema = z.object({
  title: z.string(),
  icon: z.string(),
  description: z.string(),
  sides: z.tuple([z.string(), z.string()]),
  hypothesis: z.string(),
  question: z.string(),
});

/**
 * Zod schema for AnalysisBlindSpot
 */
const analysisBlindSpotSchema = z.object({
  title: z.string(),
  icon: z.string(),
  observation: z.string(),
  evidence: z.string(),
  reframe: z.string(),
});

/**
 * Zod schema for AnalysisLeveragePoint
 */
const analysisLeveragePointSchema = z.object({
  title: z.string(),
  insight: z.string(),
});

/**
 * Zod schema for AnalysisRisk
 */
const analysisRiskSchema = z.object({
  title: z.string(),
  description: z.string(),
});

/**
 * Zod schema for IdentitySynthesis
 */
const identitySynthesisSchema = z.object({
  currentIdentityCore: z.string(),
  hiddenStrengths: z.array(z.string()),
  keyTension: z.string(),
  nextIdentityStep: z.string(),
});

/**
 * Zod schema for AIAnalysisResult
 *
 * Validates the complete structure of AI analysis results including:
 * - patterns: Behavioral patterns with severity levels
 * - contradictions: Internal tensions with opposing sides
 * - blindSpots: Hidden insights with reframes
 * - leveragePoints: Change opportunities
 * - risks: Potential pitfalls
 * - identitySynthesis: Overall identity summary
 */
export const aiAnalysisResultSchema = z.object({
  language: z.string().optional(),
  patterns: z.array(analysisPatternSchema),
  contradictions: z.array(analysisContradictionSchema),
  blindSpots: z.array(analysisBlindSpotSchema),
  leveragePoints: z.array(analysisLeveragePointSchema),
  risks: z.array(analysisRiskSchema),
  identitySynthesis: identitySynthesisSchema,
});

/**
 * Parse and validate JSON string as AIAnalysisResult
 *
 * @param json - JSON string to parse
 * @param context - Context string for error messages (e.g., "analysis abc123")
 * @returns Validated AIAnalysisResult object
 * @throws ZodError if validation fails
 * @throws SyntaxError if JSON parsing fails
 *
 * @example
 * ```typescript
 * const result = parseAIAnalysisResult(jsonString, 'analysis user-123');
 * ```
 */
export function parseAIAnalysisResult(
  json: string,
  context: string
): AIAnalysisResult {
  try {
    const parsed: unknown = JSON.parse(json);
    return aiAnalysisResultSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Invalid data structure (${context}): ${issues}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format (${context})`);
    }
    throw error;
  }
}
