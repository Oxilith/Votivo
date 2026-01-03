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
 * History state type for popstate events
 */
interface HistoryState {
  view: AppView;
  authMode?: AuthMode;
  resourceId?: string;
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
  /** True when route is /assessment/new - indicates fresh start, don't load from DB */
  isFreshStart?: boolean;
}

/**
 * Path to route configuration mapping
 */
const ROUTES: Partial<Record<string, RouteConfig>> = {
  '/': { view: 'landing' },
  '/assessment': { view: 'assessment' },
  '/insights': { view: 'insights' },
  '/profile': { view: 'profile' },
  '/verify-email': { view: 'verify-email' },
  '/reset-password': { view: 'reset-password' },
  '/sign-in': { view: 'auth', authMode: 'login' },
  '/sign-up': { view: 'auth', authMode: 'register' },
  '/forgot-password': { view: 'auth', authMode: 'login' }, // Redirects to auth, login form has forgot-password link
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
  'not-found': '/404',
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

  // Check for /assessment/new (fresh start) first
  if (pathname === '/assessment/new') {
    return {
      view: 'assessment',
      isFreshStart: true,
      token: urlParams.get('token') ?? undefined,
      hash: hash ? hash.slice(1) : undefined,
    };
  }

  // Check for resource ID patterns: /assessment/:id or /insights/:id
  const assessmentIdMatch = /^\/assessment\/([^/]+)$/.exec(pathname);
  if (assessmentIdMatch) {
    return {
      view: 'assessment',
      resourceId: assessmentIdMatch[1],
      token: urlParams.get('token') ?? undefined,
      hash: hash ? hash.slice(1) : undefined,
    };
  }

  const insightsMatch = /^\/insights\/([^/]+)$/.exec(pathname);
  if (insightsMatch) {
    return {
      view: 'insights',
      resourceId: insightsMatch[1],
      token: urlParams.get('token') ?? undefined,
      hash: hash ? hash.slice(1) : undefined,
    };
  }

  // Show 404 page for unknown routes
  return { view: 'not-found' };
}

/**
 * Navigation options
 */
export interface NavigateOptions {
  authMode?: AuthMode;
  token?: string;
  hash?: string;
  resourceId?: string;
    /** Navigate to /assessment/new for fresh start */
  freshStart?: boolean;
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

  // Handle /assessment/new for fresh start
  if (view === 'assessment' && options?.freshStart) {
    path = '/assessment/new';
  }
  // Append resource ID for assessment and insights views
  else if (options?.resourceId && (view === 'assessment' || view === 'insights')) {
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

  // Capture initial route params once on mount (before any effects run)
  // Using lazy initializer pattern - the function only runs on first render
  const initialParamsRef = useRef<RouteParams | null>(null);
  initialParamsRef.current ??= parseRoute(
    window.location.pathname,
    window.location.search,
    window.location.hash
  );

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

  // Effect 1: URL normalization and auth mode setup on mount
  useEffect(() => {
    const params = initialParamsRef.current;
    if (!params) return;

    // Set initial auth mode from URL
    if (params.authMode) {
      authModeRef.current = params.authMode;
    }

    // Normalize URL (fix trailing slashes, etc.)
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
  }, []);

  // Effect 2: Sync store view with initial URL (one-time, uses captured initial params)
  useEffect(() => {
    const params = initialParamsRef.current;
    if (!params) return;

    // Mark as initialized
    isInitializedRef.current = true;

    // Update store if initial URL view differs from store's default
    // We compare against the captured initial params, not potentially stale currentView
    setView(params.view);
  }, [setView]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent duplicate updates if we triggered the navigation
      if (isNavigatingRef.current) return;

      const params = getRouteParams();
      const state = event.state as HistoryState | null;

      // Update auth mode from state or URL
      if (state?.authMode) {
        authModeRef.current = state.authMode;
      } else if (params.authMode) {
        authModeRef.current = params.authMode;
      }

      // Update Zustand store
      setView(params.view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [getRouteParams, setView]);

  // Sync URL when view changes externally (e.g., from setView calls)
  // Use a ref to track if initial sync has completed to avoid race conditions
  const hasInitialSyncCompletedRef = useRef(false);

  useEffect(() => {
    // Skip if we're already navigating or not initialized yet
    if (isNavigatingRef.current || !isInitializedRef.current) return;

    const currentPath = window.location.pathname;
    const currentParams = getRouteParams();

    // If current URL already represents this view (including ID-based routes), don't modify
    // This prevents /assessment/123 from being replaced with /assessment
    if (currentParams.view === currentView) {
      // Mark initial sync as complete when view matches URL
      hasInitialSyncCompletedRef.current = true;
      return;
    }

    // On initial page load, the URL is the source of truth.
    // Don't push a new URL until we've synced with the initial URL at least once.
    // This prevents race conditions where we push '/' before setView('profile') takes effect.
    if (!hasInitialSyncCompletedRef.current) {
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
