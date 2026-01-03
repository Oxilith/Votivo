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

  describe('synthesis state', () => {
    it('should set hasReachedSynthesis', () => {
      const { setHasReachedSynthesis } = useUIStore.getState();

      expect(useUIStore.getState().hasReachedSynthesis).toBe(false);

      setHasReachedSynthesis(true);
      expect(useUIStore.getState().hasReachedSynthesis).toBe(true);

      setHasReachedSynthesis(false);
      expect(useUIStore.getState().hasReachedSynthesis).toBe(false);
    });
  });

  describe('auth return state', () => {
    it('should set pending auth return view', () => {
      const { setPendingAuthReturn } = useUIStore.getState();

      expect(useUIStore.getState().pendingAuthReturn).toBeNull();

      setPendingAuthReturn('insights');
      expect(useUIStore.getState().pendingAuthReturn).toBe('insights');

      setPendingAuthReturn('assessment');
      expect(useUIStore.getState().pendingAuthReturn).toBe('assessment');
    });

    it('should clear pending auth return', () => {
      const { setPendingAuthReturn } = useUIStore.getState();

      setPendingAuthReturn('insights');
      expect(useUIStore.getState().pendingAuthReturn).toBe('insights');

      setPendingAuthReturn(null);
      expect(useUIStore.getState().pendingAuthReturn).toBeNull();
    });

    it('should set pending assessment save flag', () => {
      const { setPendingAssessmentSave } = useUIStore.getState();

      expect(useUIStore.getState().pendingAssessmentSave).toBe(false);

      setPendingAssessmentSave(true);
      expect(useUIStore.getState().pendingAssessmentSave).toBe(true);

      setPendingAssessmentSave(false);
      expect(useUIStore.getState().pendingAssessmentSave).toBe(false);
    });
  });

  describe('read-only mode', () => {
    it('should set read-only mode with resource ID', () => {
      const { setReadOnlyMode } = useUIStore.getState();

      setReadOnlyMode('resource-123');

      const state = useUIStore.getState();
      expect(state.isReadOnly).toBe(true);
      expect(state.viewingResourceId).toBe('resource-123');
      expect(state.viewingAssessmentId).toBeNull();
    });

    it('should set read-only mode with resource and assessment IDs', () => {
      const { setReadOnlyMode } = useUIStore.getState();

      setReadOnlyMode('analysis-456', 'assessment-789');

      const state = useUIStore.getState();
      expect(state.isReadOnly).toBe(true);
      expect(state.viewingResourceId).toBe('analysis-456');
      expect(state.viewingAssessmentId).toBe('assessment-789');
    });

    it('should clear read-only mode', () => {
      const { setReadOnlyMode, clearReadOnlyMode } = useUIStore.getState();

      setReadOnlyMode('resource-123', 'assessment-456');
      expect(useUIStore.getState().isReadOnly).toBe(true);

      clearReadOnlyMode();

      const state = useUIStore.getState();
      expect(state.isReadOnly).toBe(false);
      expect(state.viewingResourceId).toBeNull();
      expect(state.viewingAssessmentId).toBeNull();
    });
  });

  describe('reset UI state', () => {
    it('should reset all UI state to initial values', () => {
      const {
        setView,
        setPhase,
        setStep,
        setStartAtSynthesis,
        setHasReachedSynthesis,
        setPendingAuthReturn,
        setPendingAssessmentSave,
        setReadOnlyMode,
        setLoading,
        setError,
        incrementAssessmentKey,
        resetUIState,
      } = useUIStore.getState();

      // Set various state values
      setView('insights');
      setPhase(2);
      setStep(3);
      setStartAtSynthesis(true);
      setHasReachedSynthesis(true);
      setPendingAuthReturn('profile');
      setPendingAssessmentSave(true);
      setReadOnlyMode('resource-123', 'assessment-456');
      setLoading(true);
      setError('Some error');
      incrementAssessmentKey();

      // Verify state was changed
      expect(useUIStore.getState().currentView).toBe('insights');
      expect(useUIStore.getState().assessmentKey).toBe(1);

      // Reset
      resetUIState();

      // Verify all state is reset
      const state = useUIStore.getState();
      expect(state.currentView).toBe('landing');
      expect(state.currentPhase).toBe(0);
      expect(state.currentStep).toBe(0);
      expect(state.startAtSynthesis).toBe(false);
      expect(state.assessmentKey).toBe(0);
      expect(state.hasReachedSynthesis).toBe(false);
      expect(state.pendingAuthReturn).toBeNull();
      expect(state.pendingAssessmentSave).toBe(false);
      expect(state.isReadOnly).toBe(false);
      expect(state.viewingResourceId).toBeNull();
      expect(state.viewingAssessmentId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
