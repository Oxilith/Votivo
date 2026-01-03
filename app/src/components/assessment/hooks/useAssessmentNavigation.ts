/**
 * @file app/src/components/assessment/hooks/useAssessmentNavigation.ts
 * @purpose Custom hook for managing assessment navigation state
 * @functionality
 * - Tracks current phase and step indices
 * - Provides goNext and goBack navigation functions
 * - Calculates total progress across all phases
 * - Determines if on first/last step
 * - Auto-jumps to last reached step when responses exist in store
 * - Updates last reached position when advancing
 * @dependencies
 * - React (useState, useMemo, useCallback)
 * - @/components (Phase)
 */

import { useState, useMemo, useCallback } from 'react';
import type { Phase } from '@/components';

interface UseAssessmentNavigationProps {
  phases: Phase[];
  startAtSynthesis?: boolean;
  /** Initial phase to start at (used for auto-jump to last reached) */
  initialPhase?: number;
  /** Initial step to start at (used for auto-jump to last reached) */
  initialStep?: number;
  /** Callback to update the furthest reached position in the store */
  onReachNewPosition?: (phase: number, step: number) => void;
}

interface UseAssessmentNavigationReturn {
  currentPhase: number;
  currentStep: number;
  currentPhaseData: Phase;
  currentStepData: Phase['steps'][number] | undefined;
  totalSteps: number;
  currentTotalStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goNext: () => void;
  goBack: () => void;
  setPhaseAndStep: (phase: number, step: number) => void;
}

export function useAssessmentNavigation({
  phases,
  startAtSynthesis = false,
  initialPhase,
  initialStep,
  onReachNewPosition,
}: UseAssessmentNavigationProps): UseAssessmentNavigationReturn {
  // Synthesis is always the last phase
  const synthesisPhaseIndex = phases.length - 1;

  // Lazy initialization for starting position - prioritizes initial values from store
  const [currentPhase, setCurrentPhase] = useState(() => {
    if (startAtSynthesis) return synthesisPhaseIndex;
    if (initialPhase !== undefined) return initialPhase;
    return 0;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    if (startAtSynthesis) return 0;
    if (initialStep !== undefined) return initialStep;
    return 0;
  });

  const currentPhaseData = phases[currentPhase] ?? phases[0];
  const currentStepData = currentPhaseData.steps[currentStep];

  const totalSteps = useMemo(
    () => phases.reduce((acc, phase) => acc + phase.steps.length, 0),
    [phases]
  );

  const currentTotalStep = useMemo(
    () =>
      phases.slice(0, currentPhase).reduce((acc, phase) => acc + phase.steps.length, 0) +
      currentStep +
      1,
    [phases, currentPhase, currentStep]
  );

  const isFirstStep = currentPhase === 0 && currentStep === 0;
  const isLastStep =
    currentPhase === phases.length - 1 &&
    currentStep === currentPhaseData.steps.length - 1;

  const goNext = useCallback(() => {
    let nextPhase = currentPhase;
    let nextStep = currentStep;

    if (currentStep < currentPhaseData.steps.length - 1) {
      nextStep = currentStep + 1;
    } else if (currentPhase < phases.length - 1) {
      nextPhase = currentPhase + 1;
      nextStep = 0;
    } else {
      // Already at the last step, nothing to do
      return;
    }

    // Update state
    setCurrentPhase(nextPhase);
    setCurrentStep(nextStep);

    // Notify about reaching a new position (for updating lastReached in store)
    if (onReachNewPosition) {
      onReachNewPosition(nextPhase, nextStep);
    }
  }, [currentStep, currentPhase, currentPhaseData.steps.length, phases.length, onReachNewPosition]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentPhase > 0) {
      const prevPhase = currentPhase - 1;
      setCurrentPhase(prevPhase);
      setCurrentStep(phases[prevPhase].steps.length - 1);
    }
  }, [currentStep, currentPhase, phases]);

  const setPhaseAndStep = useCallback((phase: number, step: number) => {
    setCurrentPhase(phase);
    setCurrentStep(step);
  }, []);

  return {
    currentPhase,
    currentStep,
    currentPhaseData,
    currentStepData,
    totalSteps,
    currentTotalStep,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    setPhaseAndStep,
  };
}
