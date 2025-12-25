/**
 * @file prompt-service/src/admin/components/ProtectedRoute.tsx
 * @purpose Route wrapper that requires authentication
 * @functionality
 * - Checks if user is authenticated via stored API key
 * - Redirects to login page if not authenticated
 * - Renders children if authenticated
 * @dependencies
 * - react for ReactNode type
 * - react-router-dom for Navigate
 * - ../api/auth for authentication check
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/auth.js';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
