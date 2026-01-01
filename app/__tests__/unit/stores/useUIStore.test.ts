/**
 * @file app/__tests__/unit/stores/useUIStore.test.ts
 * @purpose Unit tests for UI state management store
 * @functionality
 * - Tests initial state values
 * - Tests navigation actions (setView, setPhase, setStep)
 * - Tests reset and synthesis navigation
 * - Tests loading and error state management
 * @dependencies
 * - vitest
 * - @/stores/useUIStore
 */

import { useUIStore } from '@/stores/useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      currentView: 'assessment',
      currentPhase: 0,
      currentStep: 0,
      startAtSynthesis: false,
      assessmentKey: 0,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();

      expect(state.currentView).toBe('assessment');
      expect(state.currentPhase).toBe(0);
      expect(state.currentStep).toBe(0);
      expect(state.startAtSynthesis).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('navigation actions', () => {
    it('should set view correctly', () => {
      const { setView } = useUIStore.getState();

      setView('insights');
      expect(useUIStore.getState().currentView).toBe('insights');

      setView('assessment');
      expect(useUIStore.getState().currentView).toBe('assessment');
    });

    it('should set phase and reset step to 0', () => {
      const { setPhase, setStep } = useUIStore.getState();

      setStep(5);
      expect(useUIStore.getState().currentStep).toBe(5);

      setPhase(2);
      expect(useUIStore.getState().currentPhase).toBe(2);
      expect(useUIStore.getState().currentStep).toBe(0);
    });

    it('should set step correctly', () => {
      const { setStep } = useUIStore.getState();

      setStep(3);
      expect(useUIStore.getState().currentStep).toBe(3);
    });

    it('should set phase and step together', () => {
      const { setPhaseAndStep } = useUIStore.getState();

      setPhaseAndStep(2, 4);
      expect(useUIStore.getState().currentPhase).toBe(2);
      expect(useUIStore.getState().currentStep).toBe(4);
    });

    it('should navigate to synthesis phase', () => {
      const { goToSynthesis } = useUIStore.getState();

      goToSynthesis();
      expect(useUIStore.getState().currentPhase).toBe(3);
      expect(useUIStore.getState().currentStep).toBe(0);
    });
  });

  describe('reset actions', () => {
    it('should reset assessment to initial state', () => {
      const { setView, setPhase, setStep, setStartAtSynthesis, resetAssessment } =
        useUIStore.getState();

      // Set some values
      setView('insights');
      setPhase(2);
      setStep(3);
      setStartAtSynthesis(true);

      // Reset
      resetAssessment();

      const state = useUIStore.getState();
      expect(state.currentView).toBe('landing');
      expect(state.currentPhase).toBe(0);
      expect(state.currentStep).toBe(0);
      expect(state.startAtSynthesis).toBe(false);
    });

    it('should increment assessment key', () => {
      const { incrementAssessmentKey } = useUIStore.getState();

      expect(useUIStore.getState().assessmentKey).toBe(0);

      incrementAssessmentKey();
      expect(useUIStore.getState().assessmentKey).toBe(1);

      incrementAssessmentKey();
      expect(useUIStore.getState().assessmentKey).toBe(2);
    });
  });

  describe('loading and error state', () => {
    it('should set loading state', () => {
      const { setLoading } = useUIStore.getState();

      setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useUIStore.getState().isLoading).toBe(false);
    });

    it('should set error message', () => {
      const { setError } = useUIStore.getState();

      setError('Something went wrong');
      expect(useUIStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const { setError, clearError } = useUIStore.getState();

      setError('Error message');
      expect(useUIStore.getState().error).toBe('Error message');

      clearError();
      expect(useUIStore.getState().error).toBeNull();
    });
  });
});
