/**
 * @file src/components/assessment/index.ts
 * @purpose Barrel export for assessment components
 * @functionality
 * - Exports main assessment page component
 * - Exports assessment page header component
 * - Exports assessment types
 * - Re-exports hooks, steps, and navigation sub-barrels
 * @dependencies
 * - ./IdentityFoundationsAssessment
 * - ./AssessmentPageHeader
 * - ./types
 * - ./hooks
 * - ./steps
 * - ./navigation
 */

// Main components
export { default as IdentityFoundationsAssessment } from './IdentityFoundationsAssessment';
export { default as AssessmentPageHeader } from './AssessmentPageHeader';

// Types
export type {
  IntroContent,
  SelectOption,
  IntroStep,
  MultiSelectStep,
  SingleSelectStep,
  ScaleStep,
  TextareaStep,
  SynthesisStep,
  Step,
  Phase,
  StepProps,
  SelectStepProps,
  ScaleStepProps,
  TextareaStepProps,
} from './types';

// Sub-barrels
export * from './hooks'; // @allow-wildcard
export * from './steps'; // @allow-wildcard
export * from './navigation'; // @allow-wildcard
