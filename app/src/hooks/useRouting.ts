/**
 * @file src/hooks/useRouting.ts
 * @purpose Custom routing hook that syncs URL with Zustand UI store
 * @functionality
 * - Parses URL path to determine current view
 * - Supports resource ID patterns (/assessment/:id, /insights/:id)
 * - Syncs browser URL with Zustand store state
 * - Handles browser back/forward navigation (popstate)
 * - Provides navigate function for programmatic navigation
 * - Extracts query parameters (tokens for verification/reset)
 * - Handles auth mode (sign-in, sign-up) via URL path
 * @dependencies
 * - React (useEffect, useCallback)
 * - @/stores
 * - @/types
 */

import { useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores';
import type { AppView } from '@/types';

/**
 * Auth mode for the auth page
 */
export type AuthMode = 'login' | 'register';

/**
 * Route configuration mapping paths to views
 */
interface RouteConfig {
  view: AppView;
  authMode?: AuthMode;
}

/**
 * Route parameters extracted from URL
 */
export interface RouteParams {
  view: AppView;
  authMode?: AuthMode;
  token?: string;
  hash?: string;
  resourceId?: string;
}

/**
 * Path to route configuration mapping
 */
const ROUTES: Record<string, RouteConfig> = {
  '/': { view: 'landing' },
  '/assessment': { view: 'assessment' },
  '/insights': { view: 'insights' },
  '/profile': { view: 'profile' },
  '/verify-email': { view: 'verify-email' },
  '/reset-password': { view: 'reset-password' },
  '/sign-in': { view: 'auth', authMode: 'login' },
  '/sign-up': { view: 'auth', authMode: 'register' },
};

/**
 * View to path mapping for navigation
 */
const VIEW_TO_PATH: Record<AppView, string> = {
  landing: '/',
  assessment: '/assessment',
  insights: '/insights',
  auth: '/sign-in', // Default auth path
  profile: '/profile',
  'verify-email': '/verify-email',
  'reset-password': '/reset-password',
};

/**
 * Parse the current URL to extract route params
 */
export function parseRoute(pathname: string, search: string, hash: string): RouteParams {
  const route = ROUTES[pathname];
  const urlParams = new URLSearchParams(search);

  if (route) {
    return {
      view: route.view,
      authMode: route.authMode,
      token: urlParams.get('token') ?? undefined,
      hash: hash ? hash.slice(1) : undefined, // Remove leading #
    };
  }

  // Check for resource ID patterns: /assessment/:id or /insights/:id
  const assessmentMatch = pathname.match(/^\/assessment\/([^/]+)$/);
  if (assessmentMatch) {
    return {
      view: 'assessment',
      resourceId: assessmentMatch[1],
      token: urlParams.get('token') ?? undefined,
      hash: hash ? hash.slice(1) : undefined,
    };
  }

  const insightsMatch = pathname.match(/^\/insights\/([^/]+)$/);
  if (insightsMatch) {
    return {
      view: 'insights',
      resourceId: insightsMatch[1],
      token: urlParams.get('token') ?? undefined,
      hash: hash ? hash.slice(1) : undefined,
    };
  }

  // Default to landing for unknown routes
  return { view: 'landing' };
}

/**
 * Navigation options
 */
export interface NavigateOptions {
  authMode?: AuthMode;
  token?: string;
  hash?: string;
  resourceId?: string;
  replace?: boolean;
}

/**
 * Build a URL path with optional query params
 */
export function buildPath(
  view: AppView,
  options?: Omit<NavigateOptions, 'replace'>
): string {
  let path: string;

  if (view === 'auth' && options?.authMode) {
    path = options.authMode === 'register' ? '/sign-up' : '/sign-in';
  } else {
    path = VIEW_TO_PATH[view];
  }

  // Append resource ID for assessment and insights views
  if (options?.resourceId && (view === 'assessment' || view === 'insights')) {
    path += `/${options.resourceId}`;
  }

  if (options?.token) {
    path += `?token=${encodeURIComponent(options.token)}`;
  }

  if (options?.hash) {
    path += `#${options.hash}`;
  }

  return path;
}

/**
 * Custom routing hook that syncs URL with Zustand store
 */
export function useRouting() {
  const { currentView, setView } = useUIStore();
  const authModeRef = useRef<AuthMode>('login');
  const isNavigatingRef = useRef(false);
  const isInitializedRef = useRef(false);

  /**
   * Navigate to a new route
   */
  const navigate = useCallback(
    (view: AppView, options?: NavigateOptions) => {
      const path = buildPath(view, options);

      // Update auth mode ref if provided
      if (options?.authMode) {
        authModeRef.current = options.authMode;
      }

      // Mark that we're navigating to avoid duplicate state updates
      isNavigatingRef.current = true;

      // Update URL
      const historyState = {
        view,
        authMode: options?.authMode,
        resourceId: options?.resourceId,
      };

      if (options?.replace) {
        window.history.replaceState(historyState, '', path);
      } else {
        window.history.pushState(historyState, '', path);
      }

      // Update Zustand store
      setView(view);

      // Reset navigation flag after a tick
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 0);
    },
    [setView]
  );

  /**
   * Get current route params
   */
  const getRouteParams = useCallback((): RouteParams => {
    return parseRoute(
      window.location.pathname,
      window.location.search,
      window.location.hash
    );
  }, []);

  /**
   * Get current auth mode
   */
  const getAuthMode = useCallback((): AuthMode => {
    return authModeRef.current;
  }, []);

  // Initialize route on mount
  useEffect(() => {
    const params = getRouteParams();

    // Set initial auth mode
    if (params.authMode) {
      authModeRef.current = params.authMode;
    }

    // Update URL to match the route (in case of trailing slashes, etc.)
    // Include resourceId to preserve ID-based routes
    const expectedPath = buildPath(params.view, {
      authMode: params.authMode,
      token: params.token,
      hash: params.hash,
      resourceId: params.resourceId,
    });

    if (window.location.pathname !== expectedPath.split('?')[0].split('#')[0]) {
      window.history.replaceState(
        { view: params.view, authMode: params.authMode, resourceId: params.resourceId },
        '',
        expectedPath
      );
    }

    // Mark as initialized before updating view to prevent URL sync effect from running prematurely
    isInitializedRef.current = true;

    // Only update view if it differs from current
    if (params.view !== currentView) {
      setView(params.view);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent duplicate updates if we triggered the navigation
      if (isNavigatingRef.current) return;

      const params = getRouteParams();

      // Update auth mode from state or URL
      if (event.state?.authMode) {
        authModeRef.current = event.state.authMode;
      } else if (params.authMode) {
        authModeRef.current = params.authMode;
      }

      // Update Zustand store
      setView(params.view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getRouteParams, setView]);

  // Sync URL when view changes externally (e.g., from setView calls)
  useEffect(() => {
    // Skip if we're already navigating or not initialized yet
    if (isNavigatingRef.current || !isInitializedRef.current) return;

    const currentPath = window.location.pathname;
    const currentParams = getRouteParams();

    // If current URL already represents this view (including ID-based routes), don't modify
    // This prevents /assessment/123 from being replaced with /assessment
    if (currentParams.view === currentView) {
      return;
    }

    const expectedPath = buildPath(currentView, {
      authMode: currentView === 'auth' ? authModeRef.current : undefined,
    });

    // Only update if paths differ (ignore query params and hash)
    if (currentPath !== expectedPath.split('?')[0].split('#')[0]) {
      window.history.pushState(
        { view: currentView, authMode: authModeRef.current },
        '',
        expectedPath
      );
    }
  }, [currentView, getRouteParams]);

  return {
    navigate,
    getRouteParams,
    getAuthMode,
    currentView,
  };
}

export default useRouting;
