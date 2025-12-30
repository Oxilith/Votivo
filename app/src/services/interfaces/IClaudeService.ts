/**
 * @file services/interfaces/IClaudeService.ts
 * @purpose Interface definition for Claude AI analysis service
 * @functionality
 * - Defines contract for Claude API interactions
 * - Provides typed analysis request/response with optional user profile
 * - Enables dependency injection for testing
 * - Facilitates mocking in unit tests
 * @dependencies
 * - @/types (AssessmentResponses, AIAnalysisResult)
 * - shared (AnalysisLanguage, UserProfileForAnalysis)
 */

import type { AssessmentResponses, AIAnalysisResult } from '@/types';
import type { AnalysisLanguage, UserProfileForAnalysis } from 'shared';

// Re-export for backward compatibility
export type { AnalysisLanguage } from 'shared';

export interface AnalysisRequest {
  responses: AssessmentResponses;
  language: AnalysisLanguage;
  userProfile?: UserProfileForAnalysis;
}

export interface AnalysisResponse {
  analysis: AIAnalysisResult;
  rawResponse: string;
}

export interface IClaudeService {
  /**
   * Analyzes assessment responses using Claude AI
   * @param request - Analysis request with responses and language
   * @returns Promise with analysis result and raw response
   * @throws Error if analysis fails
   */
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
}
