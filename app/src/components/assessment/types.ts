/**
 * @file components/assessment/types.ts
 * @purpose Type definitions for assessment step components
 * @functionality
 * - Defines step type interfaces (Intro, MultiSelect, Scale, etc.)
 * - Provides discriminated union for step rendering
 * - Defines phase structure for questionnaire flow
 * @dependencies
 * - None (pure TypeScript types)
 */

export interface IntroContent {
  heading: string;
  subheading: string;
  description: string;
  buttonText: string;
}

export interface SelectOption {
  id: string;
  label: string;
  description?: string;
}

interface BaseStep {
  id?: string;
  question?: string;
  context?: string;
}

export interface IntroStep extends BaseStep {
  type: 'intro';
  content: IntroContent;
}

export interface MultiSelectStep extends BaseStep {
  type: 'multiSelect';
  id: string;
  question: string;
  options: SelectOption[];
}

export interface SingleSelectStep extends BaseStep {
  type: 'singleSelect';
  id: string;
  question: string;
  options: SelectOption[];
}

export interface ScaleStep extends BaseStep {
  type: 'scale';
  id: string;
  question: string;
  lowLabel: string;
  highLabel: string;
  min: number;
  max: number;
}

export interface TextareaStep extends BaseStep {
  type: 'textarea';
  id: string;
  question: string;
  placeholder?: string;
  rows?: number;
}

export interface SynthesisStep extends BaseStep {
  type: 'synthesis';
}

export type Step = IntroStep | MultiSelectStep | SingleSelectStep | ScaleStep | TextareaStep | SynthesisStep;

export interface Phase {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  steps: Step[];
}

// Common props for step components
export interface StepProps<T extends Step = Step> {
  step: T;
  onNext: () => void;
}

export interface SelectStepProps<T extends MultiSelectStep | SingleSelectStep> extends StepProps<T> {
  value: string[] | string | undefined;
  onChange: (value: string[] | string) => void;
}

export interface ScaleStepProps extends StepProps<ScaleStep> {
  value: number;
  onChange: (value: number) => void;
}

export interface TextareaStepProps extends StepProps<TextareaStep> {
  value: string;
  onChange: (value: string) => void;
}
