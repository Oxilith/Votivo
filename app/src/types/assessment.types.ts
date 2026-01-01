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
} from '@votive/shared';

// Re-import for use in local interfaces
import type { AssessmentResponses, AIAnalysisResult } from '@votive/shared';

/**
 * View-only assessment data (for /assessment/:id routes)
 */
export interface ViewOnlyAssessment {
  responses: AssessmentResponses;
  createdAt: string;
}

/**
 * View-only analysis data (for /insights/:id routes)
 */
export interface ViewOnlyAnalysis {
  result: AIAnalysisResult;
  createdAt: string;
  assessmentId: string | null;
}

// Component props
export interface AssessmentProps {
  initialResponses?: Partial<AssessmentResponses>;
  onComplete: (responses: AssessmentResponses) => void;
  startAtSynthesis?: boolean;
  onImport?: (data: AssessmentResponses) => void;
  onExport?: () => void;
  onNavigateToLanding?: () => void;
  onNavigateToInsights?: () => void;
  onNavigateToAuth?: () => void;
  onNavigateToProfile?: () => void;
  onSignOut?: () => void;
  isReadOnly?: boolean;
  /** View-only assessment data for /assessment/:id routes */
  viewOnlyAssessment?: ViewOnlyAssessment | null;
}

export interface InsightsProps {
  responses: AssessmentResponses;
  onExport?: () => void;
  onImport?: (data: AssessmentResponses) => void;
  onExportAnalysis?: () => void;
  hasAnalysis?: boolean;
  onNavigateToLanding?: () => void;
  onNavigateToAssessment?: () => void;
  onNavigateToAuth?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToAuthWithReturn?: (returnTo: 'insights' | 'assessment') => void;
  onSignOut?: () => void;
  isReadOnly?: boolean;
  viewingAssessmentId?: string | null;
  /** View-only analysis data for /insights/:id routes */
  viewOnlyAnalysis?: ViewOnlyAnalysis | null;
}

// App state - includes auth views and error pages
export type AppView = 'landing' | 'assessment' | 'insights' | 'auth' | 'profile' | 'verify-email' | 'reset-password' | 'not-found';
