/**
 * @file app/__tests__/unit/stores/useAssessmentStore.test.ts
 * @purpose Unit tests for assessment responses store
 * @functionality
 * - Tests initial state values
 * - Tests response update actions
 * - Tests completion calculation
 * - Tests clear functionality
 * @dependencies
 * - vitest
 * - @/stores/useAssessmentStore
 */

import { useAssessmentStore } from '@/stores/useAssessmentStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      Reflect.deleteProperty(store, key);
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAssessmentStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    useAssessmentStore.setState({
      responses: {},
      savedAt: null,
      lastReachedPhase: 0,
      lastReachedStep: 0,
    });
  });

  describe('initial state', () => {
    it('should have empty responses initially', () => {
      const state = useAssessmentStore.getState();

      expect(state.responses).toEqual({});
      expect(state.savedAt).toBeNull();
    });

    it('should have null savedAt initially', () => {
      const state = useAssessmentStore.getState();

      expect(state.savedAt).toBeNull();
    });

    it('should report 0% completion when empty', () => {
      const { getCompletionPercentage } = useAssessmentStore.getState();

      expect(getCompletionPercentage()).toBe(0);
    });

    it('should report incomplete when empty', () => {
      const { isComplete } = useAssessmentStore.getState();

      expect(isComplete()).toBe(false);
    });
  });

  describe('updateResponse', () => {
    it('should update a single response', () => {
      const { updateResponse } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);

      const state = useAssessmentStore.getState();
      expect(state.responses.peak_energy_times).toEqual(['early_morning']);
    });

    it('should update multiple responses independently', () => {
      const { updateResponse } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning', 'afternoon']);
      updateResponse('energy_consistency', 3);

      const state = useAssessmentStore.getState();
      expect(state.responses.peak_energy_times).toEqual(['early_morning', 'afternoon']);
      expect(state.responses.energy_consistency).toBe(3);
    });

    it('should overwrite existing response', () => {
      const { updateResponse } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);
      updateResponse('peak_energy_times', ['evening']);

      expect(useAssessmentStore.getState().responses.peak_energy_times).toEqual(['evening']);
    });
  });

  describe('setResponses', () => {
    it('should set multiple responses at once', () => {
      const { setResponses } = useAssessmentStore.getState();

      setResponses({
        peak_energy_times: ['mid_morning'],
        low_energy_times: ['afternoon'],
        energy_consistency: 4,
      });

      const state = useAssessmentStore.getState();
      expect(state.responses.peak_energy_times).toEqual(['mid_morning']);
      expect(state.responses.low_energy_times).toEqual(['afternoon']);
      expect(state.responses.energy_consistency).toBe(4);
    });

    it('should replace all responses', () => {
      const { updateResponse, setResponses } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);
      setResponses({ low_energy_times: ['evening'] });

      const state = useAssessmentStore.getState();
      expect(state.responses.peak_energy_times).toBeUndefined();
      expect(state.responses.low_energy_times).toEqual(['evening']);
    });
  });

  describe('clearResponses', () => {
    it('should clear all responses', () => {
      const { updateResponse, clearResponses } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);
      updateResponse('energy_consistency', 3);

      clearResponses();

      const state = useAssessmentStore.getState();
      expect(state.responses).toEqual({});
      expect(state.savedAt).toBeNull();
    });
  });

  describe('completion calculation', () => {
    it('should calculate partial completion percentage', () => {
      const { updateResponse, getCompletionPercentage } = useAssessmentStore.getState();

      // Fill in 4 out of 16 required fields
      updateResponse('peak_energy_times', ['early_morning']);
      updateResponse('low_energy_times', ['afternoon']);
      updateResponse('energy_consistency', 3);
      updateResponse('energy_drains', 'meetings');

      expect(getCompletionPercentage()).toBe(25); // 4/16 = 25%
    });

    it('should not count empty arrays as complete', () => {
      const { updateResponse, getCompletionPercentage } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', []);

      expect(getCompletionPercentage()).toBe(0);
    });

    it('should not count empty strings as complete', () => {
      const { updateResponse, getCompletionPercentage } = useAssessmentStore.getState();

      updateResponse('identity_statements', '   ');

      expect(getCompletionPercentage()).toBe(0);
    });

    it('should report complete when all required fields are filled', () => {
      const { setResponses, isComplete } = useAssessmentStore.getState();

      setResponses({
        peak_energy_times: ['early_morning'],
        low_energy_times: ['afternoon'],
        energy_consistency: 3,
        energy_drains: 'meetings',
        energy_restores: 'breaks',
        mood_triggers_negative: ['lack_of_progress'],
        motivation_reliability: 4,
        willpower_pattern: 'distraction',
        identity_statements: 'I am a developer',
        others_describe: 'Hardworking',
        automatic_behaviors: 'coding',
        keystone_behaviors: 'exercise',
        core_values: ['integrity'],
        natural_strengths: 'problem-solving',
        resistance_patterns: 'procrastination',
        identity_clarity: 4,
      });

      expect(isComplete()).toBe(true);
    });
  });

  describe('getResponses', () => {
    it('should return current responses', () => {
      const { updateResponse, getResponses } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);
      updateResponse('energy_consistency', 3);

      const responses = getResponses();
      expect(responses.peak_energy_times).toEqual(['early_morning']);
      expect(responses.energy_consistency).toBe(3);
    });
  });

  describe('setSavedAt', () => {
    it('should set savedAt timestamp', () => {
      const { setSavedAt } = useAssessmentStore.getState();
      const timestamp = '2024-01-15T10:30:00.000Z';

      setSavedAt(timestamp);

      expect(useAssessmentStore.getState().savedAt).toBe(timestamp);
    });

    it('should mark assessment as completed (readonly)', () => {
      const { setSavedAt } = useAssessmentStore.getState();

      // Initially not saved
      expect(useAssessmentStore.getState().savedAt).toBeNull();

      // Save assessment
      setSavedAt(new Date().toISOString());

      // Now saved (readonly)
      expect(useAssessmentStore.getState().savedAt).not.toBeNull();
    });
  });

  describe('updateLastReached', () => {
    it('should update lastReached when position is further', () => {
      const { updateLastReached } = useAssessmentStore.getState();

      updateLastReached(1, 2);

      const state = useAssessmentStore.getState();
      expect(state.lastReachedPhase).toBe(1);
      expect(state.lastReachedStep).toBe(2);
    });

    it('should update when phase is greater', () => {
      const { updateLastReached } = useAssessmentStore.getState();

      updateLastReached(0, 5);
      updateLastReached(2, 0); // Higher phase, lower step

      const state = useAssessmentStore.getState();
      expect(state.lastReachedPhase).toBe(2);
      expect(state.lastReachedStep).toBe(0);
    });

    it('should update when same phase but greater step', () => {
      const { updateLastReached } = useAssessmentStore.getState();

      updateLastReached(1, 2);
      updateLastReached(1, 5);

      const state = useAssessmentStore.getState();
      expect(state.lastReachedPhase).toBe(1);
      expect(state.lastReachedStep).toBe(5);
    });

    it('should NOT update when position is not further', () => {
      const { updateLastReached } = useAssessmentStore.getState();

      updateLastReached(2, 3);
      updateLastReached(1, 5); // Lower phase

      const state = useAssessmentStore.getState();
      expect(state.lastReachedPhase).toBe(2);
      expect(state.lastReachedStep).toBe(3);
    });

    it('should NOT update when same phase but lower step', () => {
      const { updateLastReached } = useAssessmentStore.getState();

      updateLastReached(2, 5);
      updateLastReached(2, 3); // Same phase, lower step

      const state = useAssessmentStore.getState();
      expect(state.lastReachedPhase).toBe(2);
      expect(state.lastReachedStep).toBe(5);
    });
  });

  describe('hasResponsesInStore', () => {
    it('should return false when store is empty', () => {
      const { hasResponsesInStore } = useAssessmentStore.getState();

      expect(hasResponsesInStore()).toBe(false);
    });

    it('should return true when store has responses', () => {
      const { updateResponse, hasResponsesInStore } = useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);

      expect(hasResponsesInStore()).toBe(true);
    });
  });

  describe('clearResponses with lastReached', () => {
    it('should reset lastReached values when clearing', () => {
      const { updateResponse, updateLastReached, clearResponses, setSavedAt } =
        useAssessmentStore.getState();

      updateResponse('peak_energy_times', ['early_morning']);
      updateLastReached(2, 5);
      setSavedAt(new Date().toISOString());

      clearResponses();

      const state = useAssessmentStore.getState();
      expect(state.lastReachedPhase).toBe(0);
      expect(state.lastReachedStep).toBe(0);
      expect(state.savedAt).toBeNull();
    });
  });
});
