/**
 * @file stores/useAnalysisStore.ts
 * @purpose Zustand store for AI analysis results management
 * @functionality
 * - Stores Claude analysis results
 * - Manages analysis loading and error state
 * - Caches raw response for debugging
 * - Provides analyze action that calls the API via service layer
 * - Passes optional user profile for demographic context
 * - Supports export functionality
 * @dependencies
 * - zustand
 * - @/types/assessment.types (AIAnalysisResult, AssessmentResponses)
 * - @/services (claudeService, ApiClientError, AnalysisLanguage)
 * - shared (UserProfileForAnalysis)
 */

import { create } from 'zustand';
import type { AIAnalysisResult, AssessmentResponses } from '@/types';
import { claudeService, ApiClientError } from '@/services';
import type { AnalysisLanguage } from '@/services';
import type { UserProfileForAnalysis } from 'shared';

interface AnalysisState {
  // State
  analysis: AIAnalysisResult | null;
  rawResponse: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;

  // Actions
  analyze: (
    responses: AssessmentResponses,
    language: AnalysisLanguage,
    userProfile?: UserProfileForAnalysis
  ) => Promise<void>;
  setAnalysis: (analysis: AIAnalysisResult, rawResponse: string) => void;
  clearAnalysis: () => void;
  clearError: () => void;

  // Export
  exportAnalysisToJson: () => void;
  downloadRawResponse: () => void;
}

export const useAnalysisStore = create<AnalysisState>()((set, get) => ({
  // Initial state
  analysis: null,
  rawResponse: null,
  isAnalyzing: false,
  analysisError: null,

  // Actions
  analyze: async (responses, language, userProfile) => {
    set({ isAnalyzing: true, analysisError: null });

    try {
      const { analysis, rawResponse } = await claudeService.analyze({
        responses,
        language,
        userProfile,
      });
      set({
        analysis,
        rawResponse,
        isAnalyzing: false,
      });
    } catch (error) {
      let errorMessage = 'Failed to analyze responses';

      if (error instanceof ApiClientError) {
        errorMessage = error.message;
        console.error('Analysis API error:', { code: error.code, status: error.status, details: error.details });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Analysis error:', error);
      }

      set({
        analysisError: errorMessage,
        isAnalyzing: false,
      });
    }
  },

  setAnalysis: (analysis, rawResponse) => {
    set({ analysis, rawResponse, analysisError: null });
  },

  clearAnalysis: () => {
    set({
      analysis: null,
      rawResponse: null,
      analysisError: null,
    });
  },

  clearError: () => {
    set({ analysisError: null });
  },

  // Export functions
  exportAnalysisToJson: () => {
    const { analysis } = get();
    if (!analysis) return;

    const jsonString = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'identity-analysis-results.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  downloadRawResponse: () => {
    const { rawResponse } = get();
    if (!rawResponse) return;

    const blob = new Blob([rawResponse], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'raw-ai-response.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
}));
