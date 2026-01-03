/**
 * @file prompt-service/src/admin/components/ProtectedRoute.tsx
 * @purpose Route wrapper that requires authentication
 * @functionality
 * - Verifies authentication status via server API call
 * - Shows loading state while checking authentication
 * - Redirects to login page if not authenticated
 * - Renders children if authenticated
 * @dependencies
 * - react for useState, useEffect, ReactNode
 * - react-router-dom for Navigate
 * - ../api/auth for authentication verification
 * - ./InkLoader for loading state display
 */

import { useState, useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAuth } from '@/admin';
import { InkLoader } from './InkLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    let mounted = true;

    const verifyAuth = async () => {
      const isAuthenticated = await checkAuth();
      if (mounted) {
        setAuthState(isAuthenticated ? 'authenticated' : 'unauthenticated');
      }
    };

    void verifyAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (authState === 'loading') {
    return <InkLoader variant="fullscreen" message="Verifying authentication..." data-testid="admin-loading" />;
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
