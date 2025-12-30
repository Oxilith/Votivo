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
 */

import { useState, useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAuth } from '@/admin';

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
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
    color: '#6b7280',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
