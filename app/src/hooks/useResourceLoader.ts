/**
 * @file app/src/hooks/useResourceLoader.ts
 * @purpose Manages loading assessment and analysis resources from database based on URL or authentication state
 * @functionality
 * - Loads specific resources by ID for view-only mode (no store modifications)
 * - Falls back to most recent resource from database when store is empty (authenticated users)
 * - Returns view-only data for ID-based routes to be used as component props
 * - Handles loading states and error handling for resource fetch operations
 * - Loads associated assessment when loading analysis to ensure both stores are populated
 * - Uses hydrateFromDB to load saved assessments from database
 * - Sets readonly mode for completed (saved) assessments
 * @dependencies
 * - React (useEffect, useCallback, useState)
 * - @/stores (useAuthStore, useAssessmentStore, useAnalysisStore, useUIStore)
 * - @/services (authService)
 * - @/utils (logger)
 * - ./useRouting
 * - @/types (AppView, ViewOnlyAssessment, ViewOnlyAnalysis)
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuthStore, useAuthInitialized, useAuthHydrated, useAssessmentStore, useAnalysisStore, useUIStore } from '@/stores';
import { authService } from '@/services';
import { useRouting } from './useRouting';
import { logger } from '@/utils';
import type { AppView, ViewOnlyAssessment, ViewOnlyAnalysis } from '@/types';

// Re-export types for convenience
export type { ViewOnlyAssessment, ViewOnlyAnalysis };

interface UseResourceLoaderResult {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  /** View-only assessment data when viewing /assessment/:id */
  viewOnlyAssessment: ViewOnlyAssessment | null;
  /** View-only analysis data when viewing /insights/:id */
  viewOnlyAnalysis: ViewOnlyAnalysis | null;
}

/**
 * Hook that loads resources from database based on URL patterns and authentication state
 */
export function useResourceLoader(): UseResourceLoaderResult {
  const { getRouteParams, currentView } = useRouting();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = user !== null;
  const isAuthInitialized = useAuthInitialized();
  const isAuthHydrated = useAuthHydrated();
  const { responses, savedAt, hydrateFromDB } = useAssessmentStore();
  const analysis = useAnalysisStore((state) => state.analysis);
  const setAnalysis = useAnalysisStore((state) => state.setAnalysis);
  const { setReadOnlyMode, clearReadOnlyMode, setLoading, setStartAtSynthesis, setHasReachedSynthesis, incrementAssessmentKey } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewOnlyAssessment, setViewOnlyAssessment] = useState<ViewOnlyAssessment | null>(null);
  const [viewOnlyAnalysis, setViewOnlyAnalysis] = useState<ViewOnlyAnalysis | null>(null);
  const loadedResourceRef = useRef<string | null>(null);
  const lastViewRef = useRef<AppView | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load assessment by ID for view-only mode (does NOT modify store)
   */
  const loadAssessmentByIdViewOnly = useCallback(
    async (id: string): Promise<ViewOnlyAssessment> => {
      try {
        const assessment = await authService.getAssessmentById(id);
        return {
          responses: assessment.responses,
          createdAt: assessment.createdAt,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load assessment';
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Load analysis by ID for view-only mode (does NOT modify store)
   */
  const loadAnalysisByIdViewOnly = useCallback(
    async (id: string): Promise<ViewOnlyAnalysis> => {
      try {
        const loadedAnalysis = await authService.getAnalysisById(id);
        return {
          result: loadedAnalysis.result,
          createdAt: loadedAnalysis.createdAt,
          assessmentId: loadedAnalysis.assessmentId ?? null,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load analysis';
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Load most recent assessment from database
   */
  const loadMostRecentAssessment = useCallback(async (): Promise<string | undefined> => {
    try {
      const assessments = await authService.getAssessments();
      if (Array.isArray(assessments) && assessments.length > 0) {
        // Sort by createdAt descending and get most recent
        const sorted = [...assessments].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const mostRecent = sorted[0];
        // Use hydrateFromDB to load saved assessment with savedAt timestamp
        hydrateFromDB(mostRecent.responses, mostRecent.createdAt);
        return mostRecent.id;
      }
      return undefined;
    } catch (err) {
      // Silently fail for most recent - user may not have any saved
      logger.warn('Failed to load most recent assessment:', { error: err });
      return undefined;
    }
  }, [hydrateFromDB]);

  /**
   * Load assessment by ID and populate store
   */
  const loadAssessmentByIdToStore = useCallback(async (id: string): Promise<boolean> => {
    try {
      const assessment = await authService.getAssessmentById(id);
      // Use hydrateFromDB to load saved assessment with savedAt timestamp
      hydrateFromDB(assessment.responses, assessment.createdAt);
      return true;
    } catch (err) {
      logger.warn('Failed to load assessment by ID:', { error: err });
      return false;
    }
  }, [hydrateFromDB]);

  /**
   * Load most recent analysis from database
   */
  const loadMostRecentAnalysis = useCallback(async (): Promise<
    { analysisId: string; assessmentId?: string } | undefined
  > => {
    try {
      const analyses = await authService.getAnalyses();
      if (Array.isArray(analyses) && analyses.length > 0) {
        // Sort by createdAt descending and get most recent
        const sorted = [...analyses].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const mostRecent = sorted[0];
        setAnalysis(mostRecent.result, ''); // No raw response when loading from DB
        return {
          analysisId: mostRecent.id,
          assessmentId: mostRecent.assessmentId ?? undefined,
        };
      }
      return undefined;
    } catch (err) {
      // Silently fail for most recent - user may not have any saved
      logger.warn('Failed to load most recent analysis:', { error: err });
      return undefined;
    }
  }, [setAnalysis]);

  /**
   * Check if assessment store has meaningful data
   */
  const isAssessmentStoreEmpty = useCallback((): boolean => {
    // Check if any responses have been filled out by iterating over keys
    const responseKeys = Object.keys(responses) as (keyof typeof responses)[];
    if (responseKeys.length === 0) return true;

    const hasAnyResponses = responseKeys.some((key) => {
      const value = responses[key];
      if (value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true; // Numbers are valid responses
      return true;
    });
    return !hasAnyResponses;
  }, [responses]);

  /**
   * Check if analysis store has data
   */
  const isAnalysisStoreEmpty = useCallback((): boolean => {
    return !analysis;
  }, [analysis]);

  /**
   * Main effect for loading resources
   */
  useEffect(() => {
    const loadResourcesAsync = async () => {
      // Wait for auth store to hydrate and initialize before attempting to load resources
      // This prevents race conditions where we try to load before auth is ready
      if (!isAuthHydrated || !isAuthInitialized) {
        return;
      }

      const routeParams = getRouteParams();
      const { view, resourceId, isFreshStart } = routeParams;

      // Skip if not on assessment or insights view
      if (view !== 'assessment' && view !== 'insights') {
        // Clear read-only mode and view-only data when leaving these views
        if (lastViewRef.current === 'assessment' || lastViewRef.current === 'insights') {
          clearReadOnlyMode();
          setViewOnlyAssessment(null);
          setViewOnlyAnalysis(null);
          loadedResourceRef.current = null;
        }
        lastViewRef.current = view;
        return;
      }

      // Skip if not authenticated (can't load from database)
      if (!isAuthenticated) {
        clearReadOnlyMode();
        lastViewRef.current = view;
        return;
      }

      // Skip if we've already loaded this specific resource
      // Include savedAt in key so readonly detection re-runs after assessment is completed
      const resourceKey = resourceId
        ? `${view}:${resourceId}`
        : `${view}:latest:${savedAt ?? 'none'}`;
      if (loadedResourceRef.current === resourceKey && lastViewRef.current === view) {
        return;
      }

      setIsLoading(true);
      setLoading(true);
      setError(null);

      try {
        if (view === 'assessment') {
          if (isFreshStart) {
            // Fresh start route (/assessment/new) - don't load from DB
            // Clear any existing view-only state and readonly mode
            setViewOnlyAssessment(null);
            setViewOnlyAnalysis(null);
            clearReadOnlyMode();
            setStartAtSynthesis(false);
            loadedResourceRef.current = `${view}:fresh`;
          } else if (resourceId) {
            // Load specific assessment by ID for view-only (does NOT modify store)
            const assessmentData = await loadAssessmentByIdViewOnly(resourceId);
            setViewOnlyAssessment(assessmentData);
            setViewOnlyAnalysis(null); // Clear any previous analysis view-only data
            // Set read-only mode
            setReadOnlyMode(resourceId);
            // Start at synthesis for saved assessments (they're complete)
            setStartAtSynthesis(true);
            setHasReachedSynthesis(true);
            // Force component remount to apply startAtSynthesis
            incrementAssessmentKey();
            loadedResourceRef.current = resourceKey;
          } else if (isAssessmentStoreEmpty()) {
            // Load most recent if store is empty (editable) - copies to store
            const loadedId = await loadMostRecentAssessment();
            if (loadedId) {
              loadedResourceRef.current = `${view}:${loadedId}`;
            }
            // Clear any view-only state and read-only mode for edit mode
            setViewOnlyAssessment(null);
            setViewOnlyAnalysis(null);
            clearReadOnlyMode();
          } else {
            // Store has data - check if assessment is completed (savedAt !== null)
            if (savedAt !== null) {
              // Store has completed assessment - show in readonly mode
              // Use store data directly (no viewOnlyAssessment needed)
              setViewOnlyAssessment(null);
              setViewOnlyAnalysis(null);
              setReadOnlyMode('local-saved');
              setStartAtSynthesis(true);
              setHasReachedSynthesis(true);
              incrementAssessmentKey();
              loadedResourceRef.current = `${view}:local-saved:${savedAt}`;
            } else {
              // Assessment not completed - editable mode
              setViewOnlyAssessment(null);
              setViewOnlyAnalysis(null);
              clearReadOnlyMode();
            }
          }
        } else {
          // view === 'insights' at this point (early return handles other views)
          if (resourceId) {
            // Load specific analysis by ID for view-only (does NOT modify store)
            const analysisData = await loadAnalysisByIdViewOnly(resourceId);
            setViewOnlyAnalysis(analysisData);
            setViewOnlyAssessment(null); // Clear any previous assessment view-only data
            // Set read-only mode with assessmentId if available
            setReadOnlyMode(resourceId, analysisData.assessmentId ?? undefined);
            loadedResourceRef.current = resourceKey;
          } else {
            // No specific resourceId - load latest data from DB
            // Assessment is the primary entity, analysis is derived from it

            // Step 1: Ensure assessment is in store (load latest if empty)
            let currentAssessmentId: string | undefined;
            if (isAssessmentStoreEmpty()) {
              currentAssessmentId = await loadMostRecentAssessment();
            }

            // Step 2: Load analysis for that assessment if analysis store is empty
            if (isAnalysisStoreEmpty() && currentAssessmentId) {
              // Find analysis that matches this assessment
              const analyses = await authService.getAnalyses();
              if (Array.isArray(analyses) && analyses.length > 0) {
                // Find analysis linked to current assessment
                const matchingAnalysis = analyses.find(a => a.assessmentId === currentAssessmentId);
                if (matchingAnalysis) {
                  setAnalysis(matchingAnalysis.result, '');
                  loadedResourceRef.current = `${view}:${matchingAnalysis.id}`;
                }
              }
            }

            // Clear any view-only state and read-only mode for edit mode
            setViewOnlyAssessment(null);
            setViewOnlyAnalysis(null);
            clearReadOnlyMode();
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load resource';
        setError(message);
        // Clear read-only mode if loading failed
        clearReadOnlyMode();
        logger.error('Resource loading error:', err);
      } finally {
        setIsLoading(false);
        setLoading(false);
        lastViewRef.current = view;
      }
    };

    void loadResourcesAsync();
  }, [
    currentView,
    isAuthenticated,
    isAuthHydrated,
    isAuthInitialized,
    getRouteParams,
    loadAssessmentByIdViewOnly,
    loadAnalysisByIdViewOnly,
    loadAssessmentByIdToStore,
    loadMostRecentAssessment,
    loadMostRecentAnalysis,
    isAssessmentStoreEmpty,
    isAnalysisStoreEmpty,
    savedAt,
    setReadOnlyMode,
    clearReadOnlyMode,
    setLoading,
    setStartAtSynthesis,
    setHasReachedSynthesis,
    incrementAssessmentKey,
    setAnalysis,
  ]);

  return {
    isLoading,
    error,
    clearError,
    viewOnlyAssessment,
    viewOnlyAnalysis,
  };
}

export default useResourceLoader;
