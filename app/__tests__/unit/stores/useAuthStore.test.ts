/**
 * @file app/__tests__/unit/stores/useAuthStore.test.ts
 * @purpose Unit tests for authentication state management store
 * @functionality
 * - Tests initial state values
 * - Tests setAuth, clearAuth, and token management
 * - Tests loading and error state
 * - Tests cached lists (assessments, analyses) with staleness
 * - Tests computed getters (isAuthenticated, staleness checks)
 * @dependencies
 * - vitest
 * - @/stores/useAuthStore
 * - shared/testing for mock fixtures
 */

import { renderHook } from '@testing-library/react';
import {
  useAuthStore,
  useIsAuthenticated,
  useCurrentUser,
  useAuthInitialized,
  useAuthError,
  useAuthHydrated,
} from '@/stores/useAuthStore';
import { createMockSafeUser, createMockSavedAssessment, createMockSavedAnalysis } from '@votive/shared/testing';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      csrfToken: null,
      isLoading: false,
      isInitialized: false,
      isHydrated: false,
      error: null,
      assessmentsList: null,
      assessmentsListLoadedAt: null,
      analysesList: null,
      analysesListLoadedAt: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.csrfToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
      expect(state.isHydrated).toBe(false);
      expect(state.error).toBeNull();
      expect(state.assessmentsList).toBeNull();
      expect(state.analysesList).toBeNull();
    });

    it('should report not authenticated when user is null', () => {
      const { getIsAuthenticated } = useAuthStore.getState();
      expect(getIsAuthenticated()).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('should set user, accessToken, and csrfToken', () => {
      const mockUser = createMockSafeUser({ email: 'test@example.com' });
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token-123', 'csrf-token-456');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token-123');
      expect(state.csrfToken).toBe('csrf-token-456');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should report authenticated when user is set', () => {
      const mockUser = createMockSafeUser();
      const { setAuth, getIsAuthenticated } = useAuthStore.getState();

      setAuth(mockUser, 'token', 'csrf');
      expect(getIsAuthenticated()).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state', () => {
      const mockUser = createMockSafeUser();
      const { setAuth, clearAuth, setAssessmentsList, setAnalysesList } = useAuthStore.getState();

      // Set up authenticated state with cached lists
      setAuth(mockUser, 'token', 'csrf');
      setAssessmentsList([createMockSavedAssessment()]);
      setAnalysesList([createMockSavedAnalysis()]);

      // Clear auth
      clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.csrfToken).toBeNull();
      expect(state.error).toBeNull();
      expect(state.assessmentsList).toBeNull();
      expect(state.analysesList).toBeNull();
    });

    it('should report not authenticated after clearing', () => {
      const mockUser = createMockSafeUser();
      const { setAuth, clearAuth, getIsAuthenticated } = useAuthStore.getState();

      setAuth(mockUser, 'token', 'csrf');
      expect(getIsAuthenticated()).toBe(true);

      clearAuth();
      expect(getIsAuthenticated()).toBe(false);
    });
  });

  describe('individual setters', () => {
    it('should set user only', () => {
      const mockUser = createMockSafeUser({ email: 'new@example.com' });
      const { setUser } = useAuthStore.getState();

      setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should set accessToken only', () => {
      const { setAccessToken } = useAuthStore.getState();

      setAccessToken('new-access-token');
      expect(useAuthStore.getState().accessToken).toBe('new-access-token');
    });

    it('should set csrfToken only', () => {
      const { setCsrfToken } = useAuthStore.getState();

      setCsrfToken('new-csrf-token');
      expect(useAuthStore.getState().csrfToken).toBe('new-csrf-token');
    });

    it('should clear csrfToken when set to null', () => {
      const { setCsrfToken } = useAuthStore.getState();

      setCsrfToken('some-token');
      expect(useAuthStore.getState().csrfToken).toBe('some-token');

      setCsrfToken(null);
      expect(useAuthStore.getState().csrfToken).toBeNull();
    });
  });

  describe('loading and error state', () => {
    it('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error and clear loading', () => {
      const { setLoading, setError } = useAuthStore.getState();

      setLoading(true);
      setError('Authentication failed');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Authentication failed');
      expect(state.isLoading).toBe(false);
    });

    it('should clear error', () => {
      const { setError } = useAuthStore.getState();

      setError('Some error');
      expect(useAuthStore.getState().error).toBe('Some error');

      setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('initialization and hydration', () => {
    it('should set initialized flag', () => {
      const { setInitialized } = useAuthStore.getState();

      expect(useAuthStore.getState().isInitialized).toBe(false);
      setInitialized();
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });

    it('should set hydrated flag', () => {
      const { setHydrated } = useAuthStore.getState();

      expect(useAuthStore.getState().isHydrated).toBe(false);
      setHydrated();
      expect(useAuthStore.getState().isHydrated).toBe(true);
    });
  });

  describe('assessments list caching', () => {
    it('should set assessments list with timestamp', () => {
      const mockAssessment = createMockSavedAssessment();
      const { setAssessmentsList } = useAuthStore.getState();

      const beforeSet = Date.now();
      setAssessmentsList([mockAssessment]);
      const afterSet = Date.now();

      const state = useAuthStore.getState();
      expect(state.assessmentsList).toHaveLength(1);
      expect(state.assessmentsListLoadedAt).toBeGreaterThanOrEqual(beforeSet);
      expect(state.assessmentsListLoadedAt).toBeLessThanOrEqual(afterSet);
    });

    it('should invalidate assessments list', () => {
      const mockAssessment = createMockSavedAssessment();
      const { setAssessmentsList, invalidateAssessmentsList } = useAuthStore.getState();

      setAssessmentsList([mockAssessment]);
      expect(useAuthStore.getState().assessmentsList).not.toBeNull();

      invalidateAssessmentsList();

      const state = useAuthStore.getState();
      expect(state.assessmentsList).toBeNull();
      expect(state.assessmentsListLoadedAt).toBeNull();
    });

    it('should report stale when list is null', () => {
      const { isAssessmentsListStale } = useAuthStore.getState();
      expect(isAssessmentsListStale()).toBe(true);
    });

    it('should report fresh immediately after setting', () => {
      const { setAssessmentsList, isAssessmentsListStale } = useAuthStore.getState();

      setAssessmentsList([createMockSavedAssessment()]);
      expect(isAssessmentsListStale()).toBe(false);
    });

    it('should report stale after cache threshold expires', () => {
      vi.useFakeTimers();
      const { setAssessmentsList, isAssessmentsListStale } = useAuthStore.getState();

      setAssessmentsList([createMockSavedAssessment()]);
      expect(isAssessmentsListStale()).toBe(false);

      // Advance past 5 minute threshold (300,001ms)
      vi.advanceTimersByTime(300001);
      expect(isAssessmentsListStale()).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('analyses list caching', () => {
    it('should set analyses list with timestamp', () => {
      const mockAnalysis = createMockSavedAnalysis();
      const { setAnalysesList } = useAuthStore.getState();

      const beforeSet = Date.now();
      setAnalysesList([mockAnalysis]);
      const afterSet = Date.now();

      const state = useAuthStore.getState();
      expect(state.analysesList).toHaveLength(1);
      expect(state.analysesListLoadedAt).toBeGreaterThanOrEqual(beforeSet);
      expect(state.analysesListLoadedAt).toBeLessThanOrEqual(afterSet);
    });

    it('should invalidate analyses list', () => {
      const mockAnalysis = createMockSavedAnalysis();
      const { setAnalysesList, invalidateAnalysesList } = useAuthStore.getState();

      setAnalysesList([mockAnalysis]);
      expect(useAuthStore.getState().analysesList).not.toBeNull();

      invalidateAnalysesList();

      const state = useAuthStore.getState();
      expect(state.analysesList).toBeNull();
      expect(state.analysesListLoadedAt).toBeNull();
    });

    it('should report stale when list is null', () => {
      const { isAnalysesListStale } = useAuthStore.getState();
      expect(isAnalysesListStale()).toBe(true);
    });

    it('should report fresh immediately after setting', () => {
      const { setAnalysesList, isAnalysesListStale } = useAuthStore.getState();

      setAnalysesList([createMockSavedAnalysis()]);
      expect(isAnalysesListStale()).toBe(false);
    });

    it('should report stale after cache threshold expires', () => {
      vi.useFakeTimers();
      const { setAnalysesList, isAnalysesListStale } = useAuthStore.getState();

      setAnalysesList([createMockSavedAnalysis()]);
      expect(isAnalysesListStale()).toBe(false);

      // Advance past 5 minute threshold (300,001ms)
      vi.advanceTimersByTime(300001);
      expect(isAnalysesListStale()).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('selector hooks', () => {
    it('useIsAuthenticated should return false when user is null', () => {
      const { result } = renderHook(() => useIsAuthenticated());
      expect(result.current).toBe(false);
    });

    it('useIsAuthenticated should return true when user is set', () => {
      const mockUser = createMockSafeUser();
      useAuthStore.getState().setAuth(mockUser, 'token', 'csrf');

      const { result } = renderHook(() => useIsAuthenticated());
      expect(result.current).toBe(true);
    });

    it('useCurrentUser should return null initially', () => {
      const { result } = renderHook(() => useCurrentUser());
      expect(result.current).toBeNull();
    });

    it('useCurrentUser should return user when set', () => {
      const mockUser = createMockSafeUser({ email: 'hook@test.com' });
      useAuthStore.getState().setAuth(mockUser, 'token', 'csrf');

      const { result } = renderHook(() => useCurrentUser());
      expect(result.current).toEqual(mockUser);
    });

    it('useAuthInitialized should return false initially', () => {
      const { result } = renderHook(() => useAuthInitialized());
      expect(result.current).toBe(false);
    });

    it('useAuthInitialized should return true after setInitialized', () => {
      useAuthStore.getState().setInitialized();

      const { result } = renderHook(() => useAuthInitialized());
      expect(result.current).toBe(true);
    });

    it('useAuthError should return null initially', () => {
      const { result } = renderHook(() => useAuthError());
      expect(result.current).toBeNull();
    });

    it('useAuthError should return error when set', () => {
      useAuthStore.getState().setError('Auth failed');

      const { result } = renderHook(() => useAuthError());
      expect(result.current).toBe('Auth failed');
    });

    it('useAuthHydrated should return false initially', () => {
      const { result } = renderHook(() => useAuthHydrated());
      expect(result.current).toBe(false);
    });

    it('useAuthHydrated should return true after setHydrated', () => {
      useAuthStore.getState().setHydrated();

      const { result } = renderHook(() => useAuthHydrated());
      expect(result.current).toBe(true);
    });
  });
});
