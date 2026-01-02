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
 * - Tracks completion state via savedAt (null = uncompleted/editable, non-null = completed and readonly)
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
  /** When assessment was saved (completed). Null = uncompleted, non-null = completed/readonly */
  savedAt: string | null;
  lastReachedPhase: number;
  lastReachedStep: number;

  // Actions
  updateResponse: <K extends keyof AssessmentResponses>(
    key: K,
    value: AssessmentResponses[K]
  ) => void;
  setResponses: (responses: Partial<AssessmentResponses>) => void;
  clearResponses: () => void;
  /** Mark assessment as saved/completed with timestamp */
  setSavedAt: (timestamp: string) => void;
  updateLastReached: (phase: number, step: number) => void;
  /**
   * Hydrate responses from database.
   * Sets responses and savedAt for completed assessments loaded from DB.
   */
  hydrateFromDB: (responses: Partial<AssessmentResponses>, savedAt: string) => void;

  // Computed
  isComplete: () => boolean;
  getCompletionPercentage: () => number;
  getResponses: () => Partial<AssessmentResponses>;
  hasResponsesInStore: () => boolean;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      responses: {},
      savedAt: null,
      lastReachedPhase: 0,
      lastReachedStep: 0,

      // Actions
      updateResponse: (key, value) => {
        // Clear analysis when responses change (stale data)
        useAnalysisStore.getState().clearAnalysis();
        set((state) => ({
          responses: {
            ...state.responses,
            [key]: value,
          },
        }));
      },

      setResponses: (responses) => {
        // Clear analysis when responses change (stale data)
        useAnalysisStore.getState().clearAnalysis();
        set({ responses });
      },

      clearResponses: () => {
        set({
          responses: {},
          savedAt: null,
          lastReachedPhase: 0,
          lastReachedStep: 0,
        });
      },

      setSavedAt: (timestamp: string) => {
        set({ savedAt: timestamp });
      },

      hydrateFromDB: (responses: Partial<AssessmentResponses>, savedAt: string) => {
        // Load saved assessment from database
        set({
          responses,
          savedAt,
        });
      },

      updateLastReached: (phase: number, step: number) => {
        const { lastReachedPhase, lastReachedStep } = get();
        // Only update if the new position is further than current
        const isNewPositionFurther =
          phase > lastReachedPhase ||
          (phase === lastReachedPhase && step > lastReachedStep);
        if (isNewPositionFurther) {
          set({ lastReachedPhase: phase, lastReachedStep: step });
        }
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

      hasResponsesInStore: () => {
        const { responses } = get();
        return Object.keys(responses).length > 0;
      },
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        responses: state.responses,
        savedAt: state.savedAt,
        lastReachedPhase: state.lastReachedPhase,
        lastReachedStep: state.lastReachedStep,
      }),
    }
  )
);
