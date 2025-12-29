/**
 * @file shared/src/index.ts
 * @purpose Barrel export for shared types, labels, and utilities
 * @functionality
 * - Re-exports all types from assessment.types
 * - Re-exports all AI analysis types from analysis.types
 * - Re-exports all label mappings from labels
 * - Re-exports validation constants from validation
 * - Re-exports API types from api.types
 * - Re-exports prompt types from prompt.types
 * - Re-exports response formatter from responseFormatter
 * @dependencies
 * - ./assessment.types for assessment type definitions
 * - ./analysis.types for AI analysis type definitions
 * - ./labels for label mappings
 * - ./validation for validation constants
 * - ./api.types for API type definitions
 * - ./prompt.types for prompt configuration types
 * - ./responseFormatter for response formatting
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

// API Types
export type { AnalysisLanguage } from './api.types.js';
export { SUPPORTED_LANGUAGES } from './api.types.js';

// Labels
export {
  timeLabels,
  triggerLabels,
  valueLabels,
  willpowerLabels,
} from './labels.js';

// Validation Constants
export {
  TIME_OF_DAY_VALUES,
  MOOD_TRIGGER_VALUES,
  WILLPOWER_PATTERN_VALUES,
  CORE_VALUE_VALUES,
  REQUIRED_FIELDS,
  ARRAY_FIELDS,
  NUMBER_FIELDS,
  STRING_FIELDS,
} from './validation.js';

// Prompt Types
export { ClaudeModel } from './prompt.types.js';
export type {
  ClaudeModel as ClaudeModelType,
  ThinkingConfigParam,
  PromptConfig,
  PromptConfigKey,
  ThinkingVariant,
  PromptConfigDefinition,
} from './prompt.types.js';

// Response Formatter
export { formatResponsesForPrompt } from './responseFormatter.js';

// Auth Types
export type { Gender, SafeUserResponse } from './auth.types.js';

// Tracing (W3C Trace Context)
export {
  TRACEPARENT_HEADER,
  TRACESTATE_HEADER,
  generateTraceId,
  generateSpanId,
  createTraceparent,
  parseTraceparent,
  extractOrCreateTrace,
} from './tracing.js';
export type { TraceContext, TraceInfo } from './tracing.js';
