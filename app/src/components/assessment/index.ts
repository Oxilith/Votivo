/**
 * @file app/src/components/assessment/index.ts
 * @purpose Barrel export for assessment components
 * @functionality
 * - Exports assessment page header component
 * - Exports save prompt modal for unauthenticated users at synthesis
 * - Exports assessment types
 * - Re-exports hooks, steps, and navigation sub-barrels
 * - NOTE: IdentityFoundationsAssessment is NOT exported here - it's lazy-loaded in App.tsx for code splitting
 * @dependencies
 * - ./AssessmentPageHeader
 * - ./SavePromptModal
 * - ./types
 * - ./hooks
 * - ./steps
 * - ./navigation
 */

// Main components (IdentityFoundationsAssessment is lazy-loaded in App.tsx)
export { default as AssessmentHeader } from './AssessmentHeader';
export { default as AssessmentPageHeader } from './AssessmentPageHeader';
export { default as SavePromptModal } from './SavePromptModal';

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
