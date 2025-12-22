/**
 * @file src/types/assessment.types.ts
 * @purpose Define TypeScript interfaces for assessment responses and component props
 * @functionality
 * - Re-exports shared assessment types from @shared/index
 * - Re-exports shared AI analysis types from @shared/index
 * - Defines prop interfaces for Assessment and Insights components
 * @dependencies
 * - @shared/index for shared assessment and analysis types
 */

// Re-export shared types
export type {
  TimeOfDay,
  MoodTrigger,
  CoreValue,
  WillpowerPattern,
  AssessmentResponses,
  AnalysisPattern,
  AnalysisContradiction,
  AnalysisBlindSpot,
  AnalysisLeveragePoint,
  AnalysisRisk,
  IdentitySynthesis,
  AIAnalysisResult,
} from '@shared/index';

// Re-import for use in local interfaces
import type { AssessmentResponses } from '@shared/index';

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
}

// App state
export type AppView = 'assessment' | 'insights';
