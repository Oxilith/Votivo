/**
 * @file stores/useAssessmentStore.ts
 * @purpose Zustand store for managing assessment responses state
 * @functionality
 * - Manages assessment response state with persistence
 * - Provides actions for updating individual responses
 * - Supports hydration from imported data
 * - Computes completion status and percentage
 * - Persists to localStorage for session recovery
 * - Clears analysis results when responses change (invalidates stale analysis)
 * @dependencies
 * - zustand (create, persist, createJSONStorage)
 * - @/types/assessment.types (AssessmentResponses)
 * - @shared/index (REQUIRED_FIELDS)
 * - @/stores/useAnalysisStore (clearAnalysis)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssessmentResponses } from '@/types';
import { REQUIRED_FIELDS } from 'shared';
import { useAnalysisStore } from '@/stores';

interface AssessmentState {
  // State
  responses: Partial<AssessmentResponses>;
  lastUpdated: string | null;

  // Actions
  updateResponse: <K extends keyof AssessmentResponses>(
    key: K,
    value: AssessmentResponses[K]
  ) => void;
  setResponses: (responses: Partial<AssessmentResponses>) => void;
  clearResponses: () => void;

  // Computed
  isComplete: () => boolean;
  getCompletionPercentage: () => number;
  getResponses: () => Partial<AssessmentResponses>;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      responses: {},
      lastUpdated: null,

      // Actions
      updateResponse: (key, value) => {
        // Clear analysis when responses change (stale data)
        useAnalysisStore.getState().clearAnalysis();
        set((state) => ({
          responses: {
            ...state.responses,
            [key]: value,
          },
          lastUpdated: new Date().toISOString(),
        }));
      },

      setResponses: (responses) => {
        // Clear analysis when responses change (stale data)
        useAnalysisStore.getState().clearAnalysis();
        set({
          responses,
          lastUpdated: new Date().toISOString(),
        });
      },

      clearResponses: () => {
        set({
          responses: {},
          lastUpdated: null,
        });
      },

      // Computed
      isComplete: () => {
        const { responses } = get();
        return REQUIRED_FIELDS.every((field: keyof AssessmentResponses) => {
          const value = responses[field];
          if (value === undefined || value === null) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          return true;
        });
      },

      getCompletionPercentage: () => {
        const { responses } = get();
        const completedFields = REQUIRED_FIELDS.filter((field: keyof AssessmentResponses) => {
          const value = responses[field];
          if (value === undefined || value === null) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          return true;
        });
        return Math.round((completedFields.length / REQUIRED_FIELDS.length) * 100);
      },

      getResponses: () => get().responses,
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        responses: state.responses,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
