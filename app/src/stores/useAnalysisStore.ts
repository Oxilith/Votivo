/**
 * @file app/src/stores/useAnalysisStore.ts
 * @purpose Zustand store for AI analysis results management
 * @functionality
 * - Stores Claude analysis results
 * - Manages analysis loading and error state
 * - Caches raw response for debugging
 * - Provides analyze action that calls the API via service layer
 * - Passes optional user profile for demographic context
 * - Supports export functionality
 * - Tracks save status for database persistence
 * @dependencies
 * - zustand
 * - @/types/assessment.types (AIAnalysisResult, AssessmentResponses)
 * - @/services (claudeService, authService, ApiClientError, AnalysisLanguage)
 * - @/utils/logger
 * - shared (UserProfileForAnalysis)
 */

import { create } from 'zustand';
import type { AIAnalysisResult, AssessmentResponses } from '@/types';
import { claudeService, authService, ApiClientError } from '@/services';
import type { AnalysisLanguage } from '@/services';
import type { UserProfileForAnalysis } from '@votive/shared';
import { logger } from '@/utils/logger';

interface AnalysisState {
  // State
  analysis: AIAnalysisResult | null;
  rawResponse: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;

  // Save status tracking
  isSaved: boolean;
  saveError: string | null;
  isSaving: boolean;

  // Actions
  analyze: (
    responses: AssessmentResponses,
    language: AnalysisLanguage,
    userProfile?: UserProfileForAnalysis
  ) => Promise<void>;
  setAnalysis: (analysis: AIAnalysisResult, rawResponse: string) => void;
  clearAnalysis: () => void;
  clearError: () => void;

  // Save to database
  saveAnalysis: (analysis: AIAnalysisResult, assessmentId?: string | null) => Promise<void>;
  clearSaveError: () => void;

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

  // Save status tracking
  isSaved: true, // No analysis = nothing to save
  saveError: null,
  isSaving: false,

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
        isSaved: false, // New analysis needs to be saved
        saveError: null,
      });
    } catch (error) {
      let errorMessage = 'Failed to analyze responses';

      if (error instanceof ApiClientError) {
        errorMessage = error.message;
        logger.error('Analysis API error:', { code: error.code, status: error.status, details: error.details });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        logger.error('Analysis error:', error);
      }

      set({
        analysisError: errorMessage,
        isAnalyzing: false,
      });
    }
  },

  setAnalysis: (analysis, rawResponse) => {
    set({ analysis, rawResponse, analysisError: null, isSaved: false, saveError: null });
  },

  clearAnalysis: () => {
    set({
      analysis: null,
      rawResponse: null,
      analysisError: null,
      isSaved: true,
      saveError: null,
      isSaving: false,
    });
  },

  clearError: () => {
    set({ analysisError: null });
  },

  // Save to database
  saveAnalysis: async (analysis, assessmentId) => {
    set({ isSaving: true, saveError: null });

    try {
      await authService.saveAnalysis(analysis, assessmentId ?? undefined);
      set({ isSaved: true, isSaving: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save analysis';
      logger.error('Failed to save analysis to database', error);
      set({ saveError: errorMessage, isSaving: false });
    }
  },

  clearSaveError: () => {
    set({ saveError: null });
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
