/**
 * @file shared/src/analysis.types.ts
 * @purpose Single source of truth for AI analysis result types
 * @functionality
 * - Defines AnalysisPattern interface for behavioral patterns
 * - Defines AnalysisContradiction interface for internal tensions
 * - Defines AnalysisBlindSpot interface for hidden insights
 * - Defines AnalysisLeveragePoint interface for change opportunities
 * - Defines AnalysisRisk interface for potential pitfalls
 * - Defines IdentitySynthesis interface for identity summary
 * - Defines AIAnalysisResult interface for complete analysis
 * @dependencies
 * - None (pure TypeScript types)
 */

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
  language?: string;
  patterns: AnalysisPattern[];
  contradictions: AnalysisContradiction[];
  blindSpots: AnalysisBlindSpot[];
  leveragePoints: AnalysisLeveragePoint[];
  risks: AnalysisRisk[];
  identitySynthesis: IdentitySynthesis;
}
