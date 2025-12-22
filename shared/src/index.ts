/**
 * @file shared/src/index.ts
 * @purpose Barrel export for shared types, labels, and prompts
 * @functionality
 * - Re-exports all types from assessment.types
 * - Re-exports all AI analysis types from analysis.types
 * - Re-exports all label mappings from labels
 * - Re-exports AI analysis prompt from prompts
 * @dependencies
 * - ./assessment.types for assessment type definitions
 * - ./analysis.types for AI analysis type definitions
 * - ./labels for label mappings
 * - ./prompts for AI prompts
 */

// Assessment Types
export type {
  TimeOfDay,
  MoodTrigger,
  CoreValue,
  WillpowerPattern,
  AssessmentResponses,
} from './assessment.types.js';

// AI Analysis Types
export type {
  AnalysisPattern,
  AnalysisContradiction,
  AnalysisBlindSpot,
  AnalysisLeveragePoint,
  AnalysisRisk,
  IdentitySynthesis,
  AIAnalysisResult,
} from './analysis.types.js';

// Labels
export {
  timeLabels,
  triggerLabels,
  valueLabels,
  willpowerLabels,
} from './labels.js';

// Prompts
export { IDENTITY_ANALYSIS_PROMPT } from './prompts.js';
