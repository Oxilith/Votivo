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
      lastUpdated: null,
    });
  });

  describe('initial state', () => {
    it('should have empty responses initially', () => {
      const state = useAssessmentStore.getState();

      expect(state.responses).toEqual({});
      expect(state.lastUpdated).toBeNull();
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
      expect(state.lastUpdated).not.toBeNull();
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
      expect(state.lastUpdated).toBeNull();
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
});
