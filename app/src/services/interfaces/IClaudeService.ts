/**
 * @file services/interfaces/IClaudeService.ts
 * @purpose Interface definition for Claude AI analysis service
 * @functionality
 * - Defines contract for Claude API interactions
 * - Provides typed analysis request/response
 * - Enables dependency injection for testing
 * - Facilitates mocking in unit tests
 * @dependencies
 * - @/types/assessment.types (AssessmentResponses, AIAnalysisResult)
 */

import type { AssessmentResponses, AIAnalysisResult } from '@/types/assessment.types';

export type AnalysisLanguage = 'english' | 'polish';

export interface AnalysisRequest {
  responses: AssessmentResponses;
  language: AnalysisLanguage;
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
