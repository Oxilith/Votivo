/**
 * @file stores/index.ts
 * @purpose Aggregates and exports all Zustand stores
 * @functionality
 * - Provides centralized export for all stores
 * - Simplifies imports throughout the application
 * @dependencies
 * - ./useAssessmentStore
 * - ./useUIStore
 * - ./useAnalysisStore
 * - ./useAuthStore
 */

export { useAssessmentStore } from './useAssessmentStore';
export { useUIStore } from './useUIStore';
export { useAnalysisStore } from './useAnalysisStore';
export {
  useAuthStore,
  useIsAuthenticated,
  useCurrentUser,
  useAuthLoading,
  useAuthInitialized,
  useAuthError,
  useAuthHydrated,
} from './useAuthStore';
