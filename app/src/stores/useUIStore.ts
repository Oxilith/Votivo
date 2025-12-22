/**
 * @file stores/useUIStore.ts
 * @purpose Zustand store for UI state management
 * @functionality
 * - Manages current view (assessment/insights)
 * - Tracks current phase and step in assessment
 * - Controls loading and error states
 * - Manages navigation history for back/forward
 * - Handles assessment key for component remounting
 * @dependencies
 * - zustand
 * - @/types/assessment.types (AppView)
 */

import { create } from 'zustand';
import type { AppView } from '@/types/assessment.types';

interface UIState {
  // Navigation state
  currentView: AppView;
  currentPhase: number;
  currentStep: number;
  startAtSynthesis: boolean;
  assessmentKey: number;

  // Loading/Error state
  isLoading: boolean;
  error: string | null;

  // Actions
  setView: (view: AppView) => void;
  setPhase: (phase: number) => void;
  setStep: (step: number) => void;
  setPhaseAndStep: (phase: number, step: number) => void;
  goToSynthesis: () => void;
  resetAssessment: () => void;
  incrementAssessmentKey: () => void;
  setStartAtSynthesis: (value: boolean) => void;

  // Loading/Error actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Phase 3 (index 3) is the synthesis phase
const SYNTHESIS_PHASE = 3;
const SYNTHESIS_STEP = 0;

export const useUIStore = create<UIState>()((set) => ({
  // Initial state
  currentView: 'assessment',
  currentPhase: 0,
  currentStep: 0,
  startAtSynthesis: false,
  assessmentKey: 0,
  isLoading: false,
  error: null,

  // Actions
  setView: (view) => set({ currentView: view }),

  setPhase: (phase) => set({ currentPhase: phase, currentStep: 0 }),

  setStep: (step) => set({ currentStep: step }),

  setPhaseAndStep: (phase, step) => set({ currentPhase: phase, currentStep: step }),

  goToSynthesis: () =>
    set({
      currentPhase: SYNTHESIS_PHASE,
      currentStep: SYNTHESIS_STEP,
    }),

  resetAssessment: () =>
    set({
      currentView: 'assessment',
      currentPhase: 0,
      currentStep: 0,
      startAtSynthesis: false,
    }),

  incrementAssessmentKey: () =>
    set((state) => ({
      assessmentKey: state.assessmentKey + 1,
    })),

  setStartAtSynthesis: (value) => set({ startAtSynthesis: value }),

  // Loading/Error actions
  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
