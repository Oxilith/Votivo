/**
 * @file components/assessment/hooks/useAssessmentNavigation.ts
 * @purpose Custom hook for managing assessment navigation state
 * @functionality
 * - Tracks current phase and step indices
 * - Provides goNext and goBack navigation functions
 * - Calculates total progress across all phases
 * - Determines if on first/last step
 * @dependencies
 * - React (useState, useMemo, useCallback)
 * - @/components (Phase)
 */

import { useState, useMemo, useCallback } from 'react';
import type { Phase } from '@/components';

interface UseAssessmentNavigationProps {
  phases: Phase[];
  startAtSynthesis?: boolean;
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
}: UseAssessmentNavigationProps): UseAssessmentNavigationReturn {
  // Synthesis is at phase index 3 (last phase)
  const synthesisPhaseIndex = phases.length - 1;

  const [currentPhase, setCurrentPhase] = useState(startAtSynthesis ? synthesisPhaseIndex : 0);
  const [currentStep, setCurrentStep] = useState(0);

  const currentPhaseData = phases[currentPhase] ?? phases[0];
  const currentStepData = currentPhaseData?.steps[currentStep];

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
    if (currentStep < currentPhaseData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentStep(0);
    }
  }, [currentStep, currentPhase, currentPhaseData.steps.length, phases.length]);

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
