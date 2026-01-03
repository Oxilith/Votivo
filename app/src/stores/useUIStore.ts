/**
 * @file stores/useUIStore.ts
 * @purpose Zustand store for UI state management
 * @functionality
 * - Manages current view (landing/assessment/insights)
 * - Tracks current phase and step in assessment
 * - Controls loading and error states
 * - Manages navigation history for back/forward
 * - Handles assessment key for component remounting
 * - Manages read-only mode for viewing saved resources by ID
 * @dependencies
 * - zustand
 * - @/types/assessment.types (AppView)
 */

import { create } from 'zustand';
import type { AppView } from '@/types';

interface UIState {
  // Navigation state
  currentView: AppView;
  currentPhase: number;
  currentStep: number;
  startAtSynthesis: boolean;
  assessmentKey: number;
  hasReachedSynthesis: boolean;
  pendingAuthReturn: AppView | null; // Where to redirect after successful auth
  pendingAssessmentSave: boolean; // Whether to save assessment after auth (for complete flow)

  // Read-only view state (for viewing saved assessments/analyses by ID)
  isReadOnly: boolean;
  viewingResourceId: string | null; // ID of assessment or analysis being viewed
  viewingAssessmentId: string | null; // Assessment ID for linking new analyses

  // Save error state (for assessment save failures)
  assessmentSaveError: string | null;

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
  setHasReachedSynthesis: (value: boolean) => void;
  setPendingAuthReturn: (view: AppView | null) => void;
  setPendingAssessmentSave: (value: boolean) => void;

  // Read-only mode actions
  setReadOnlyMode: (resourceId: string, assessmentId?: string) => void;
  clearReadOnlyMode: () => void;

  // Save error actions
  setAssessmentSaveError: (error: string | null) => void;

  // Reset action for logout
  resetUIState: () => void;

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
  currentView: 'landing',
  currentPhase: 0,
  currentStep: 0,
  startAtSynthesis: false,
  assessmentKey: 0,
  hasReachedSynthesis: false,
  pendingAuthReturn: null,
  pendingAssessmentSave: false,
  isReadOnly: false,
  viewingResourceId: null,
  viewingAssessmentId: null,
  assessmentSaveError: null,
  isLoading: false,
  error: null,

  // Actions
  setView: (view) => { set({ currentView: view }); },

  setPhase: (phase) => { set({ currentPhase: phase, currentStep: 0 }); },

  setStep: (step) => { set({ currentStep: step }); },

  setPhaseAndStep: (phase, step) => { set({ currentPhase: phase, currentStep: step }); },

  goToSynthesis: () =>
    { set({
      currentPhase: SYNTHESIS_PHASE,
      currentStep: SYNTHESIS_STEP,
    }); },

  resetAssessment: () =>
    { set({
      currentView: 'landing',
      currentPhase: 0,
      currentStep: 0,
      startAtSynthesis: false,
      hasReachedSynthesis: false,
    }); },

  incrementAssessmentKey: () =>
    { set((state) => ({
      assessmentKey: state.assessmentKey + 1,
    })); },

  setStartAtSynthesis: (value) => { set({ startAtSynthesis: value }); },

  setHasReachedSynthesis: (value) => { set({ hasReachedSynthesis: value }); },

  setPendingAuthReturn: (view) => { set({ pendingAuthReturn: view }); },

  setPendingAssessmentSave: (value) => { set({ pendingAssessmentSave: value }); },

  // Read-only mode actions
  setReadOnlyMode: (resourceId, assessmentId) =>
    { set({
      isReadOnly: true,
      viewingResourceId: resourceId,
      viewingAssessmentId: assessmentId ?? null,
    }); },

  clearReadOnlyMode: () =>
    { set({
      isReadOnly: false,
      viewingResourceId: null,
      viewingAssessmentId: null,
    }); },

  // Save error actions
  setAssessmentSaveError: (error) => { set({ assessmentSaveError: error }); },

  // Reset all UI state for logout
  resetUIState: () =>
    { set({
      currentView: 'landing',
      currentPhase: 0,
      currentStep: 0,
      startAtSynthesis: false,
      assessmentKey: 0,
      hasReachedSynthesis: false,
      pendingAuthReturn: null,
      pendingAssessmentSave: false,
      isReadOnly: false,
      viewingResourceId: null,
      viewingAssessmentId: null,
      assessmentSaveError: null,
      isLoading: false,
      error: null,
    }); },

  // Loading/Error actions
  setLoading: (loading) => { set({ isLoading: loading }); },

  setError: (error) => { set({ error }); },

  clearError: () => { set({ error: null }); },
}));
