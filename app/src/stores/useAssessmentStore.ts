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
 * - Tracks dirty state (unsaved changes) via lastSavedAt comparison
 * @dependencies
 * - zustand (create, persist, createJSONStorage)
 * - @/types/assessment.types (AssessmentResponses)
 * - @shared/index (REQUIRED_FIELDS)
 * - @/stores/useAnalysisStore (clearAnalysis)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssessmentResponses } from '@/types';
import { REQUIRED_FIELDS } from '@votive/shared';
import { useAnalysisStore } from '@/stores';

interface AssessmentState {
  // State
  responses: Partial<AssessmentResponses>;
  lastUpdated: string | null;
  lastSavedAt: string | null;

  // Actions
  updateResponse: <K extends keyof AssessmentResponses>(
    key: K,
    value: AssessmentResponses[K]
  ) => void;
  setResponses: (responses: Partial<AssessmentResponses>) => void;
  clearResponses: () => void;
  setLastSavedAt: (timestamp: string) => void;

  // Computed
  isComplete: () => boolean;
  getCompletionPercentage: () => number;
  getResponses: () => Partial<AssessmentResponses>;
  isDirty: () => boolean;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      responses: {},
      lastUpdated: null,
      lastSavedAt: null,

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
          lastSavedAt: null,
        });
      },

      setLastSavedAt: (timestamp: string) => {
        set({ lastSavedAt: timestamp });
      },

      // Computed
      isComplete: () => {
        const { responses } = get();
        return REQUIRED_FIELDS.every((field: keyof AssessmentResponses) => {
          const value = responses[field];
          if (value === undefined) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          return true;
        });
      },

      getCompletionPercentage: () => {
        const { responses } = get();
        const completedFields = REQUIRED_FIELDS.filter((field: keyof AssessmentResponses) => {
          const value = responses[field];
          if (value === undefined) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          return true;
        });
        return Math.round((completedFields.length / REQUIRED_FIELDS.length) * 100);
      },

      getResponses: () => get().responses,

      isDirty: () => {
        const { lastUpdated, lastSavedAt } = get();
        // No changes if nothing has been updated
        if (!lastUpdated) return false;
        // If never saved, any update means dirty
        if (!lastSavedAt) return true;
        // Compare timestamps - dirty if updated after last save
        return new Date(lastUpdated) > new Date(lastSavedAt);
      },
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        responses: state.responses,
        lastUpdated: state.lastUpdated,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
