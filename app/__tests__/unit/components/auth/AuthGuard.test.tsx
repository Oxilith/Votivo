/**
 * @file app/__tests__/unit/components/auth/AuthGuard.test.tsx
 * @purpose Unit tests for AuthGuard component
 * @functionality
 * - Tests rendering children when authenticated
 * - Tests redirect to auth when not authenticated (required mode)
 * - Tests showing loading state while auth initializes
 * - Tests optional mode allowing access without auth
 * - Tests custom fallback rendering
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - AuthGuard under test
 */

import { render, screen, waitFor } from '@testing-library/react';
import AuthGuard from '@/components/auth/AuthGuard';

// Mock useRouting
const mockNavigate = vi.fn();
vi.mock('@/hooks', () => ({
  useRouting: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock stores
let mockIsAuthenticated = true;
let mockIsInitialized = true;

vi.mock('@/stores', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
  useAuthInitialized: () => mockIsInitialized,
}));

// Mock LoadingSpinnerIcon
vi.mock('@/components', () => ({
  LoadingSpinnerIcon: () => <span data-testid="loading-spinner" />,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsInitialized = true;
  });

  describe('authenticated state', () => {
    it('should render children when authenticated', () => {
      render(
        <AuthGuard>
          <div data-testid="protected-content">Protected</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading while auth is not initialized', () => {
      mockIsInitialized = false;

      render(
        <AuthGuard>
          <div data-testid="protected-content">Protected</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show custom fallback while loading', () => {
      mockIsInitialized = false;

      render(
        <AuthGuard fallback={<div data-testid="custom-fallback">Custom Loading</div>}>
          <div data-testid="protected-content">Protected</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('required mode (default)', () => {
    it('should redirect to auth when not authenticated', async () => {
      mockIsAuthenticated = false;

      render(
        <AuthGuard mode="required">
          <div data-testid="protected-content">Protected</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('auth', { authMode: 'login', replace: true });
      });
    });

    it('should show loading while not authenticated', () => {
      mockIsAuthenticated = false;

      render(
        <AuthGuard mode="required">
          <div data-testid="protected-content">Protected</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not redirect multiple times', async () => {
      mockIsAuthenticated = false;

      const { rerender } = render(
        <AuthGuard mode="required">
          <div>Protected</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(1);
      });

      // Force re-render
      rerender(
        <AuthGuard mode="required">
          <div>Protected</div>
        </AuthGuard>
      );

      // Should still only be called once
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('optional mode', () => {
    it('should render children even when not authenticated', () => {
      mockIsAuthenticated = false;

      render(
        <AuthGuard mode="optional">
          <div data-testid="optional-content">Optional Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('optional-content')).toBeInTheDocument();
    });

    it('should not redirect when not authenticated in optional mode', async () => {
      mockIsAuthenticated = false;

      render(
        <AuthGuard mode="optional">
          <div data-testid="optional-content">Optional Content</div>
        </AuthGuard>
      );

      // Wait a tick
      await new Promise((r) => setTimeout(r, 10));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
