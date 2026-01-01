/**
 * @file src/App.tsx
 * @purpose Root application component with Zustand state management and URL routing
 * @functionality
 * - Uses Zustand stores for state management
 * - Coordinates view transitions between landing, assessment, insights, and auth
 * - Handles URL-based routing with browser history support
 * - Supports ID-based navigation for assessments and analyses (/assessment/:id, /insights/:id)
 * - Loads resources from database based on URL or authentication state
 * - Provides theme context to component tree for dark/light mode
 * - Displays landing page as default entry point
 * - Initializes authentication state on app load
 * - Handles auth, profile, email verification, and password reset views
 * - Uses React.lazy for route-based code splitting
 * @dependencies
 * - React (lazy, Suspense, useCallback, useEffect)
 * - @/stores (useAssessmentStore, useUIStore, useAnalysisStore, useAuthStore)
 * - @/hooks/useRouting
 * - @/hooks/useResourceLoader
 * - @/components/landing/LandingPage (lazy)
 * - @/components/assessment/IdentityFoundationsAssessment (lazy)
 * - @/components/insights/IdentityInsightsAI (lazy)
 * - @/components/auth (AuthPage, AuthGuard, EmailVerificationPage, PasswordResetPage - lazy)
 * - @/components/profile (ProfilePage - lazy)
 * - @/components/shared/ChunkErrorBoundary
 * - @/components/shared/LoadingFallback
 * - @/types/assessment.types
 * - @/utils/fileUtils
 * - @/components/providers/ThemeProvider
 * - @/services/api/AuthService
 */

import { lazy, Suspense, useCallback, useEffect } from 'react';
import { AuthGuard, ChunkErrorBoundary, ThemeProvider, LoadingFallback } from '@/components';
import type { AssessmentResponses } from '@/types';
import { exportToJson } from '@/utils';
import { useAssessmentStore, useUIStore, useAnalysisStore, useAuthStore, useAuthInitialized, useAuthHydrated } from '@/stores';
import { authService } from '@/services';
import { useRouting, useResourceLoader } from '@/hooks';

// Lazy-loaded route components for code splitting
const LandingPage = lazy(() => import('@/components/landing/LandingPage'));
const IdentityFoundationsAssessment = lazy(() => import('@/components/assessment/IdentityFoundationsAssessment'));
const IdentityInsightsAI = lazy(() => import('@/components/insights/IdentityInsightsAI'));
const AuthPage = lazy(() => import('@/components/auth/AuthPage'));
const EmailVerificationPage = lazy(() => import('@/components/auth/EmailVerificationPage'));
const PasswordResetPage = lazy(() => import('@/components/auth/PasswordResetPage'));
const ProfilePage = lazy(() => import('@/components/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('@/components/not-found/NotFoundPage'));

function App() {
  // Zustand stores
  const { responses, setResponses, clearResponses } = useAssessmentStore();
  const {
    currentView,
    assessmentKey,
    incrementAssessmentKey,
    startAtSynthesis,
    setStartAtSynthesis,
    pendingAuthReturn,
    setPendingAuthReturn,
    isReadOnly,
    viewingAssessmentId,
  } = useUIStore();
  const { analysis, exportAnalysisToJson, clearAnalysis } = useAnalysisStore();

  // URL routing
  const { navigate, getRouteParams, getAuthMode } = useRouting();

  // Resource loading (handles ID-based navigation and database fallback)
  const { viewOnlyAssessment, viewOnlyAnalysis } = useResourceLoader();

  // Auth state
  const isAuthInitialized = useAuthInitialized();
  const isAuthHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.user !== null);
  const { setAuth, setInitialized, setLoading, clearAuth } = useAuthStore();

  // Initialize auth state on mount
  // Wait for Zustand persist to hydrate before attempting auth refresh
  useEffect(() => {
    const initAuth = async () => {
      // Wait for store to be hydrated from localStorage first
      if (!isAuthHydrated) return;
      if (isAuthInitialized) return;

      setLoading(true);

      try {
        // Use combined endpoint for efficient auth restoration
        const result = await authService.refreshTokenWithUser();
        setAuth(result.user, result.accessToken, result.csrfToken);
      } catch {
        // No valid session - clear any stale auth state
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized();
      }
    };

    void initAuth();
  }, [isAuthHydrated, isAuthInitialized, setAuth, setInitialized, setLoading, clearAuth]);

  const handleAssessmentComplete = useCallback(
    (completedResponses: AssessmentResponses) => {
      setResponses(completedResponses);
      navigate('insights');
    },
    [setResponses, navigate]
  );

  const handleImportResponses = useCallback(
    (imported: AssessmentResponses) => {
      setResponses(imported);
      setStartAtSynthesis(true);
      incrementAssessmentKey();
    },
    [setResponses, setStartAtSynthesis, incrementAssessmentKey]
  );

  const handleExportResponses = useCallback(() => {
    if (Object.keys(responses).length > 0) {
      exportToJson(responses as AssessmentResponses);
    }
  }, [responses]);

  const handleStartDiscovery = useCallback(() => {
    navigate('assessment');
  }, [navigate]);

  const handleNavigateToLanding = useCallback((hash?: string) => {
    navigate('landing', { hash });
  }, [navigate]);

  const handleNavigateToAssessment = useCallback(() => {
    navigate('assessment');
  }, [navigate]);

  const handleNavigateToAuth = useCallback(() => {
    navigate('auth', { authMode: 'login' });
  }, [navigate]);

  const handleNavigateToSignUp = useCallback(() => {
    navigate('auth', { authMode: 'register' });
  }, [navigate]);

  const handleAuthSuccess = useCallback(() => {
    // Check if we should return to a specific view after auth
    if (pendingAuthReturn) {
      const returnTo = pendingAuthReturn;
      setPendingAuthReturn(null);
      navigate(returnTo);
    } else {
      navigate('landing');
    }
  }, [navigate, pendingAuthReturn, setPendingAuthReturn]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('profile');
  }, [navigate]);

  const handleNavigateToInsights = useCallback(() => {
    navigate('insights');
  }, [navigate]);

  // Navigate to specific assessment by ID (for profile page)
  const handleNavigateToAssessmentById = useCallback(
    (id: string) => {
      navigate('assessment', { resourceId: id });
    },
    [navigate]
  );

  // Navigate to specific analysis by ID (for profile page)
  const handleNavigateToInsightsById = useCallback(
    (id: string) => {
      navigate('insights', { resourceId: id });
    },
    [navigate]
  );

  // Navigate to auth with return destination (for save prompts)
  const handleNavigateToAuthWithReturn = useCallback((returnTo: 'insights' | 'assessment') => {
    setPendingAuthReturn(returnTo);
    navigate('auth', { authMode: 'login' });
  }, [navigate, setPendingAuthReturn]);

  // Sign out - clear auth and all user data
  const handleSignOutAsync = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout errors are expected (e.g., expired token) - proceed with local cleanup
    } finally {
      clearResponses();
      clearAnalysis();
      clearAuth();
      navigate('landing');
    }
  }, [clearResponses, clearAnalysis, clearAuth, navigate]);

  // Sync wrapper for event handlers
  const handleSignOut = useCallback(() => {
    void handleSignOutAsync();
  }, [handleSignOutAsync]);

  const hasAnalysisResults = !!analysis;

  // Get route params for token-based pages
  const routeParams = getRouteParams();

  // Auth page
  if (currentView === 'auth') {
    const authMode = getAuthMode();
    return (
      <ThemeProvider>
        <ChunkErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AuthPage
              initialMode={authMode}
              onAuthSuccess={handleAuthSuccess}
            />
          </Suspense>
        </ChunkErrorBoundary>
      </ThemeProvider>
    );
  }

  // Profile page (requires authentication)
  if (currentView === 'profile') {
    return (
      <ThemeProvider>
        <AuthGuard mode="required">
          <ChunkErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage
                onNavigateToAssessmentById={handleNavigateToAssessmentById}
                onNavigateToInsightsById={handleNavigateToInsightsById}
              />
            </Suspense>
          </ChunkErrorBoundary>
        </AuthGuard>
      </ThemeProvider>
    );
  }

  // Email verification page
  if (currentView === 'verify-email') {
    return (
      <ThemeProvider>
        <ChunkErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <EmailVerificationPage token={routeParams.token} />
          </Suspense>
        </ChunkErrorBoundary>
      </ThemeProvider>
    );
  }

  // Password reset confirmation page
  if (currentView === 'reset-password') {
    return (
      <ThemeProvider>
        <ChunkErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <PasswordResetPage token={routeParams.token} />
          </Suspense>
        </ChunkErrorBoundary>
      </ThemeProvider>
    );
  }

  // 404 Not Found page
  if (currentView === 'not-found') {
    return (
      <ThemeProvider>
        <ChunkErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        </ChunkErrorBoundary>
      </ThemeProvider>
    );
  }

  // Landing page has its own navigation and styling
  if (currentView === 'landing') {
    return (
      <ThemeProvider>
        <ChunkErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <LandingPage
              onStartDiscovery={handleStartDiscovery}
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToSignUp={handleNavigateToSignUp}
              onNavigateToProfile={handleNavigateToProfile}
              onSignOut={handleSignOut}
            />
          </Suspense>
        </ChunkErrorBoundary>
      </ThemeProvider>
    );
  }

  // Assessment view has its own navigation
  if (currentView === 'assessment') {
    // For ID-based navigation, wait for auth to be fully ready before rendering
    if (routeParams.resourceId) {
      // Show loading while auth is initializing
      if (!isAuthHydrated || !isAuthInitialized) {
        return (
          <ThemeProvider>
            <LoadingFallback />
          </ThemeProvider>
        );
      }
      // Now auth is ready - require authentication
      if (!isAuthenticated) {
        return (
          <ThemeProvider>
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <AuthPage
                  initialMode="login"
                  onAuthSuccess={() => {
                    // Stay on current URL - component re-renders when auth state changes
                    // and useResourceLoader will load the assessment
                  }}
                />
              </Suspense>
            </ChunkErrorBoundary>
          </ThemeProvider>
        );
      }
    }
    return (
      <ThemeProvider>
        <ChunkErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <IdentityFoundationsAssessment
              key={assessmentKey}
              initialResponses={responses}
              onComplete={handleAssessmentComplete}
              startAtSynthesis={startAtSynthesis}
              onImport={handleImportResponses}
              onExport={handleExportResponses}
              onNavigateToLanding={handleNavigateToLanding}
              onNavigateToInsights={handleNavigateToInsights}
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToProfile={handleNavigateToProfile}
              onSignOut={handleSignOut}
              isReadOnly={isReadOnly}
              viewOnlyAssessment={viewOnlyAssessment}
            />
          </Suspense>
        </ChunkErrorBoundary>
      </ThemeProvider>
    );
  }

  // Insights view has its own navigation
  // For ID-based navigation, wait for auth to be fully ready before rendering
  if (routeParams.resourceId) {
    // Show loading while auth is initializing
    if (!isAuthHydrated || !isAuthInitialized) {
      return (
        <ThemeProvider>
          <LoadingFallback />
        </ThemeProvider>
      );
    }
    // Now auth is ready - require authentication
    if (!isAuthenticated) {
      return (
        <ThemeProvider>
          <ChunkErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AuthPage
                initialMode="login"
                onAuthSuccess={() => {
                  // Stay on current URL - component re-renders when auth state changes
                  // and useResourceLoader will load the analysis
                }}
              />
            </Suspense>
          </ChunkErrorBoundary>
        </ThemeProvider>
      );
    }
  }
  return (
    <ThemeProvider>
      <ChunkErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <IdentityInsightsAI
            responses={responses as AssessmentResponses}
            onExport={handleExportResponses}
            onImport={handleImportResponses}
            onExportAnalysis={hasAnalysisResults ? exportAnalysisToJson : undefined}
            hasAnalysis={hasAnalysisResults}
            onNavigateToLanding={handleNavigateToLanding}
            onNavigateToAssessment={handleNavigateToAssessment}
            onNavigateToAuth={handleNavigateToAuth}
            onNavigateToProfile={handleNavigateToProfile}
            onNavigateToAuthWithReturn={handleNavigateToAuthWithReturn}
            onSignOut={handleSignOut}
            isReadOnly={isReadOnly}
            viewingAssessmentId={viewingAssessmentId}
            viewOnlyAnalysis={viewOnlyAnalysis}
          />
        </Suspense>
      </ChunkErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
