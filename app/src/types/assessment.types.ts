/**
 * @file src/types/assessment.types.ts
 * @purpose Define TypeScript interfaces for assessment responses and component props
 * @functionality
 * - Defines the structure of user responses from questionnaire
 * - Defines prop interfaces for Assessment and Insights components
 * - Defines AI analysis result types from Claude API
 * - Provides type unions for multi-select option values
 * @dependencies
 * - None (pure type definitions)
 */

// Multi-select question answer types
export type TimeOfDay =
  | 'early_morning'
  | 'mid_morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late_night';

export type MoodTrigger =
  | 'lack_of_progress'
  | 'conflict'
  | 'uncertainty'
  | 'overwhelm'
  | 'lack_of_control'
  | 'poor_sleep'
  | 'physical'
  | 'isolation'
  | 'overstimulation'
  | 'criticism'
  | 'comparison'
  | 'boredom';

export type CoreValue =
  | 'growth'
  | 'autonomy'
  | 'mastery'
  | 'impact'
  | 'connection'
  | 'integrity'
  | 'creativity'
  | 'security'
  | 'adventure'
  | 'balance'
  | 'recognition'
  | 'service'
  | 'wisdom'
  | 'efficiency'
  | 'authenticity'
  | 'leadership';

export type WillpowerPattern =
  | 'never_start'
  | 'start_stop'
  | 'distraction'
  | 'perfectionism'
  | 'energy'
  | 'forget';

// Main responses interface
export interface AssessmentResponses {
  // Phase 1: State Awareness
  peak_energy_times: TimeOfDay[];
  low_energy_times: TimeOfDay[];
  energy_consistency: number; // 1-5 scale
  energy_drains: string;
  energy_restores: string;
  mood_triggers_negative: MoodTrigger[];
  motivation_reliability: number; // 1-5 scale
  willpower_pattern: WillpowerPattern;

  // Phase 2: Identity Mapping
  identity_statements: string;
  others_describe: string;
  automatic_behaviors: string;
  keystone_behaviors: string;
  core_values: CoreValue[];
  natural_strengths: string;
  resistance_patterns: string;
  identity_clarity: number; // 1-5 scale
}

// Component props
export interface AssessmentProps {
  initialResponses?: Partial<AssessmentResponses>;
  onComplete: (responses: AssessmentResponses) => void;
  startAtSynthesis?: boolean;
}

export interface InsightsProps {
  responses: AssessmentResponses;
  onBack?: () => void;
  onExport?: () => void;
  onAnalysisReady?: (exportFn: (() => void) | null) => void;
}

// AI Analysis types
export interface AnalysisPattern {
  title: string;
  icon: string;
  severity: 'high' | 'medium';
  description: string;
  evidence: string[];
  implication: string;
  leverage: string;
}

export interface AnalysisContradiction {
  title: string;
  icon: string;
  description: string;
  sides: [string, string];
  hypothesis: string;
  question: string;
}

export interface AnalysisBlindSpot {
  title: string;
  icon: string;
  observation: string;
  evidence: string;
  reframe: string;
}

export interface AnalysisLeveragePoint {
  title: string;
  insight: string;
}

export interface AnalysisRisk {
  title: string;
  description: string;
}

export interface IdentitySynthesis {
  currentIdentityCore: string;
  hiddenStrengths: string[];
  keyTension: string;
  nextIdentityStep: string;
}

export interface AIAnalysisResult {
  patterns: AnalysisPattern[];
  contradictions: AnalysisContradiction[];
  blindSpots: AnalysisBlindSpot[];
  leveragePoints: AnalysisLeveragePoint[];
  risks: AnalysisRisk[];
  identitySynthesis: IdentitySynthesis;
}

// App state
export type AppView = 'assessment' | 'insights';
