/**
 * @file app/__tests__/unit/components/assessment/hooks/useAssessmentNavigation.test.ts
 * @purpose Unit tests for assessment navigation hook
 * @functionality
 * - Tests initial state at phase 0, step 0
 * - Tests startAtSynthesis starts at last phase
 * - Tests goNext navigation within and across phases
 * - Tests goBack navigation within and across phases
 * - Tests boundary conditions (first/last step)
 * - Tests progress calculations
 * @dependencies
 * - vitest globals
 * - @testing-library/react for renderHook
 * - useAssessmentNavigation under test
 */

import { renderHook, act } from '@testing-library/react';
import { useAssessmentNavigation } from '@/components/assessment/hooks/useAssessmentNavigation';
import type { Phase } from '@/components/assessment/types';

// Create mock phases for testing
const createMockPhases = (): Phase[] => [
  {
    id: 'phase-1',
    title: 'Phase 1',
    subtitle: 'First phase',
    steps: [
      { type: 'intro', content: { heading: 'Welcome', subheading: 'Start', description: 'Intro', buttonText: 'Begin' } },
      { type: 'textarea', id: 'q1', question: 'Question 1' },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2',
    subtitle: 'Second phase',
    steps: [
      { type: 'scale', id: 'q2', question: 'Question 2', lowLabel: 'Low', highLabel: 'High', min: 1, max: 5 },
      { type: 'textarea', id: 'q3', question: 'Question 3' },
      { type: 'textarea', id: 'q4', question: 'Question 4' },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3',
    subtitle: 'Third phase',
    steps: [
      { type: 'synthesis' },
    ],
  },
];

describe('useAssessmentNavigation', () => {
  const mockPhases = createMockPhases();

  describe('initial state', () => {
    it('should start at phase 0, step 0 by default', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentStep).toBe(0);
    });

    it('should return correct phase data', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      expect(result.current.currentPhaseData.id).toBe('phase-1');
      expect(result.current.currentPhaseData.title).toBe('Phase 1');
    });

    it('should return correct step data', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      expect(result.current.currentStepData?.type).toBe('intro');
    });

    it('should start at synthesis when startAtSynthesis is true', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases, startAtSynthesis: true })
      );

      expect(result.current.currentPhase).toBe(2); // Last phase
      expect(result.current.currentStep).toBe(0);
      expect(result.current.currentPhaseData.id).toBe('phase-3');
    });
  });

  describe('progress calculations', () => {
    it('should calculate totalSteps correctly', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      // Phase 1: 2 steps, Phase 2: 3 steps, Phase 3: 1 step = 6 total
      expect(result.current.totalSteps).toBe(6);
    });

    it('should calculate currentTotalStep correctly at start', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      expect(result.current.currentTotalStep).toBe(1);
    });

    it('should calculate currentTotalStep correctly mid-assessment', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      // Navigate to phase 2, step 1 (4th step overall)
      act(() => result.current.goNext()); // phase 0, step 1
      act(() => result.current.goNext()); // phase 1, step 0
      act(() => result.current.goNext()); // phase 1, step 1

      expect(result.current.currentTotalStep).toBe(4);
    });
  });

  describe('boundary detection', () => {
    it('should detect first step', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
    });

    it('should not be first step after navigating', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      act(() => result.current.goNext());

      expect(result.current.isFirstStep).toBe(false);
    });

    it('should detect last step', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      // Navigate to last step (phase 3, step 0 - synthesis)
      act(() => result.current.goNext()); // phase 0, step 1
      act(() => result.current.goNext()); // phase 1, step 0
      act(() => result.current.goNext()); // phase 1, step 1
      act(() => result.current.goNext()); // phase 1, step 2
      act(() => result.current.goNext()); // phase 2, step 0

      expect(result.current.isLastStep).toBe(true);
      expect(result.current.isFirstStep).toBe(false);
    });
  });

  describe('goNext navigation', () => {
    it('should increment step within phase', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      act(() => result.current.goNext());

      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentStep).toBe(1);
    });

    it('should advance to next phase at end of phase', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      act(() => result.current.goNext()); // step 1
      act(() => result.current.goNext()); // next phase

      expect(result.current.currentPhase).toBe(1);
      expect(result.current.currentStep).toBe(0);
    });

    it('should not go beyond last step', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      // Navigate to last step
      for (let i = 0; i < 10; i++) {
        act(() => result.current.goNext());
      }

      expect(result.current.currentPhase).toBe(2);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.isLastStep).toBe(true);
    });
  });

  describe('goBack navigation', () => {
    it('should decrement step within phase', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      act(() => result.current.goNext());
      act(() => result.current.goBack());

      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentStep).toBe(0);
    });

    it('should go to previous phase at start of phase', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      // Go to phase 2
      act(() => result.current.goNext()); // phase 0, step 1
      act(() => result.current.goNext()); // phase 1, step 0
      act(() => result.current.goBack()); // back to phase 0, last step

      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentStep).toBe(1); // Last step of phase 0
    });

    it('should not go before first step', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      act(() => result.current.goBack());
      act(() => result.current.goBack());

      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
    });
  });

  describe('setPhaseAndStep', () => {
    it('should set specific phase and step', () => {
      const { result } = renderHook(() =>
        useAssessmentNavigation({ phases: mockPhases })
      );

      act(() => result.current.setPhaseAndStep(1, 2));

      expect(result.current.currentPhase).toBe(1);
      expect(result.current.currentStep).toBe(2);
    });
  });
});
