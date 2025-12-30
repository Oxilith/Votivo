/**
 * @file src/components/auth/AuthGuard.tsx
 * @purpose Wrapper component that handles authentication requirements for protected views
 * @functionality
 * - Checks if user is authenticated (via store state set by App.tsx)
 * - Redirects to auth page when authentication is required
 * - Supports "soft" guard mode for prompting instead of blocking
 * - Shows loading state while auth is initializing
 * @dependencies
 * - React (useEffect, useRef)
 * - @/stores (useIsAuthenticated, useAuthInitialized)
 * - @/hooks (useRouting)
 * - @/components (LoadingSpinnerIcon)
 */

import React, { useEffect, useRef, type ReactNode } from 'react';
import { useIsAuthenticated, useAuthInitialized } from '@/stores';
import { useRouting } from '@/hooks';
import { LoadingSpinnerIcon } from '@/components';

/**
 * Props for AuthGuard component
 */
export interface AuthGuardProps {
  /** Child content to render when authenticated */
  children: ReactNode;
  /** Whether authentication is strictly required (redirects) or optional (shows prompt) */
  mode?: 'required' | 'optional';
  /** Fallback component to show while checking auth */
  fallback?: ReactNode;
}

/**
 * Loading spinner for auth check
 */
const AuthLoading: React.FC = () => (
  <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinnerIcon size="lg" className="text-[var(--accent)] mx-auto mb-4" />
      <p className="font-body text-[var(--text-secondary)]">Loading...</p>
    </div>
  </div>
);

/**
 * AuthGuard - Protects views that require authentication
 *
 * @example
 * // Required auth - redirects to login
 * <AuthGuard mode="required">
 *   <ProfilePage />
 * </AuthGuard>
 *
 * @example
 * // Optional auth - allows access, can show prompts
 * <AuthGuard mode="optional">
 *   <InsightsPage />
 * </AuthGuard>
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  mode = 'required',
  fallback,
}) => {
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  const { navigate } = useRouting();
  const hasRedirected = useRef(false);

  // Handle redirect for required mode (auth is initialized by App.tsx)
  useEffect(() => {
    if (isInitialized && mode === 'required' && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('auth', { authMode: 'login', replace: true });
    }
  }, [isInitialized, mode, isAuthenticated, navigate]);

  // Show loading while initializing or redirecting
  if (!isInitialized || (mode === 'required' && !isAuthenticated)) {
    return <>{fallback ?? <AuthLoading />}</>;
  }

  // Render children (for optional mode, always render regardless of auth state)
  return <>{children}</>;
};

export default AuthGuard;
