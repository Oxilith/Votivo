/**
 * @file stores/useAuthStore.ts
 * @purpose Zustand store for user authentication state management
 * @functionality
 * - Manages authenticated user state
 * - Tracks access token for API requests
 * - Tracks CSRF token for state-changing requests
 * - Tracks initialization status for auth check on app load
 * - Provides actions for login, logout, and token management
 * - Persists user info to localStorage for optimistic UI
 * - Caches assessments and analyses lists with staleness tracking
 * @dependencies
 * - zustand for state management
 * - zustand/middleware for persistence
 * - @/types/auth.types (SafeUser, SavedAssessment, SavedAnalysis)
 * - @/config/auth.config for cache constants
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SafeUser, SavedAssessment, SavedAnalysis } from '@/types';
import { AUTH_CACHE_STALE_THRESHOLD_MS } from '@/config';

/**
 * Authentication state interface
 */
interface AuthState {
  // State
  user: SafeUser | null;
  accessToken: string | null;
  csrfToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isHydrated: boolean; // Track if store has been hydrated from localStorage
  error: string | null;

  // Cached lists for profile page
  assessmentsList: SavedAssessment[] | null;
  assessmentsListLoadedAt: number | null;
  analysesList: SavedAnalysis[] | null;
  analysesListLoadedAt: number | null;

  // Computed (as getter functions)
  getIsAuthenticated: () => boolean;
  isAssessmentsListStale: () => boolean;
  isAnalysesListStale: () => boolean;

  // Actions
  setAuth: (user: SafeUser, accessToken: string, csrfToken: string) => void;
  clearAuth: () => void;
  setUser: (user: SafeUser) => void;
  setAccessToken: (token: string) => void;
  setCsrfToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: () => void;
  setHydrated: () => void;
  setAssessmentsList: (list: SavedAssessment[]) => void;
  setAnalysesList: (list: SavedAnalysis[]) => void;
  invalidateAssessmentsList: () => void;
  invalidateAnalysesList: () => void;
}

/**
 * Auth store with persistence for user info
 * Note: Access token is NOT persisted - it's short-lived and refreshed via cookie
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
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

      // Computed
      getIsAuthenticated: () => get().user !== null,

      isAssessmentsListStale: () => {
        const loadedAt = get().assessmentsListLoadedAt;
        if (loadedAt === null) return true;
        return Date.now() - loadedAt > AUTH_CACHE_STALE_THRESHOLD_MS;
      },

      isAnalysesListStale: () => {
        const loadedAt = get().analysesListLoadedAt;
        if (loadedAt === null) return true;
        return Date.now() - loadedAt > AUTH_CACHE_STALE_THRESHOLD_MS;
      },

      // Actions
      setAuth: (user, accessToken, csrfToken) =>
        set({
          user,
          accessToken,
          csrfToken,
          isLoading: false,
          error: null,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          csrfToken: null,
          error: null,
          assessmentsList: null,
          assessmentsListLoadedAt: null,
          analysesList: null,
          analysesListLoadedAt: null,
        }),

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setCsrfToken: (csrfToken) => set({ csrfToken }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      setInitialized: () => set({ isInitialized: true }),

      setHydrated: () => set({ isHydrated: true }),

      setAssessmentsList: (list) =>
        set({
          assessmentsList: list,
          assessmentsListLoadedAt: Date.now(),
        }),

      setAnalysesList: (list) =>
        set({
          analysesList: list,
          analysesListLoadedAt: Date.now(),
        }),

      invalidateAssessmentsList: () =>
        set({
          assessmentsList: null,
          assessmentsListLoadedAt: null,
        }),

      invalidateAnalysesList: () =>
        set({
          analysesList: null,
          analysesListLoadedAt: null,
        }),
    }),
    {
      name: 'votive-auth',
      // Only persist user info, not tokens or loading states
      partialize: (state) => ({
        user: state.user,
      }),
      // Called when store is rehydrated from localStorage
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated when rehydration completes
        state?.setHydrated();
      },
    }
  )
);

/**
 * Selector for checking if user is authenticated
 * Use this in components for reactive updates
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.user !== null);

/**
 * Selector for current user
 */
export const useCurrentUser = () => useAuthStore((state) => state.user);

/**
 * Selector for auth initialization state
 */
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);

/**
 * Selector for auth error
 */
export const useAuthError = () => useAuthStore((state) => state.error);

/**
 * Selector for hydration state (if store has been rehydrated from localStorage)
 */
export const useAuthHydrated = () => useAuthStore((state) => state.isHydrated);
