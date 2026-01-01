/**
 * @file app/__tests__/unit/hooks/useRouting.test.ts
 * @purpose Unit tests for routing hook and utilities
 * @functionality
 * - Tests parseRoute extracts correct view from paths
 * - Tests parseRoute handles resource ID patterns
 * - Tests parseRoute extracts query params and hash
 * - Tests buildPath generates correct URLs
 * - Tests buildPath handles auth modes
 * - Tests buildPath handles resource IDs
 * @dependencies
 * - vitest globals
 * - parseRoute, buildPath utilities under test
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { parseRoute, buildPath, useRouting } from '@/hooks/useRouting';
import type { AppView } from '@/types';

// Mock useUIStore
let mockCurrentView: AppView = 'landing';
const mockSetView = vi.fn();

vi.mock('@/stores', () => ({
  useUIStore: () => ({
    currentView: mockCurrentView,
    setView: mockSetView,
  }),
}));

// Store original location and history
const originalLocation = window.location;
const originalHistory = window.history;

describe('useRouting utilities', () => {
  describe('parseRoute', () => {
    describe('static routes', () => {
      it('should parse / as landing', () => {
        const result = parseRoute('/', '', '');
        expect(result.view).toBe('landing');
      });

      it('should parse /assessment as assessment', () => {
        const result = parseRoute('/assessment', '', '');
        expect(result.view).toBe('assessment');
      });

      it('should parse /insights as insights', () => {
        const result = parseRoute('/insights', '', '');
        expect(result.view).toBe('insights');
      });

      it('should parse /profile as profile', () => {
        const result = parseRoute('/profile', '', '');
        expect(result.view).toBe('profile');
      });

      it('should parse /verify-email as verify-email', () => {
        const result = parseRoute('/verify-email', '', '');
        expect(result.view).toBe('verify-email');
      });

      it('should parse /reset-password as reset-password', () => {
        const result = parseRoute('/reset-password', '', '');
        expect(result.view).toBe('reset-password');
      });
    });

    describe('auth routes', () => {
      it('should parse /sign-in as auth with login mode', () => {
        const result = parseRoute('/sign-in', '', '');
        expect(result.view).toBe('auth');
        expect(result.authMode).toBe('login');
      });

      it('should parse /sign-up as auth with register mode', () => {
        const result = parseRoute('/sign-up', '', '');
        expect(result.view).toBe('auth');
        expect(result.authMode).toBe('register');
      });
    });

    describe('resource ID patterns', () => {
      it('should parse /assessment/:id with resource ID', () => {
        const result = parseRoute('/assessment/abc-123', '', '');
        expect(result.view).toBe('assessment');
        expect(result.resourceId).toBe('abc-123');
      });

      it('should parse /insights/:id with resource ID', () => {
        const result = parseRoute('/insights/xyz-456', '', '');
        expect(result.view).toBe('insights');
        expect(result.resourceId).toBe('xyz-456');
      });

      it('should handle UUID-style resource IDs', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440001';
        const result = parseRoute(`/assessment/${uuid}`, '', '');
        expect(result.view).toBe('assessment');
        expect(result.resourceId).toBe(uuid);
      });
    });

    describe('query params and hash', () => {
      it('should extract token from query string', () => {
        const result = parseRoute('/verify-email', '?token=abc123', '');
        expect(result.token).toBe('abc123');
      });

      it('should extract hash without leading #', () => {
        const result = parseRoute('/assessment', '', '#step-2');
        expect(result.hash).toBe('step-2');
      });

      it('should handle empty hash', () => {
        const result = parseRoute('/assessment', '', '');
        expect(result.hash).toBeUndefined();
      });

      it('should extract both token and hash', () => {
        const result = parseRoute('/reset-password', '?token=reset123', '#form');
        expect(result.token).toBe('reset123');
        expect(result.hash).toBe('form');
      });

      it('should include token with resource ID route', () => {
        const result = parseRoute('/assessment/abc', '?token=test', '');
        expect(result.view).toBe('assessment');
        expect(result.resourceId).toBe('abc');
        expect(result.token).toBe('test');
      });
    });

    describe('unknown routes', () => {
      it('should return not-found for unknown routes', () => {
        const result = parseRoute('/unknown-page', '', '');
        expect(result.view).toBe('not-found');
      });

      it('should return not-found for nested unknown routes', () => {
        const result = parseRoute('/foo/bar/baz', '', '');
        expect(result.view).toBe('not-found');
      });
    });
  });

  describe('buildPath', () => {
    describe('basic views', () => {
      it('should build path for landing', () => {
        expect(buildPath('landing')).toBe('/');
      });

      it('should build path for assessment', () => {
        expect(buildPath('assessment')).toBe('/assessment');
      });

      it('should build path for insights', () => {
        expect(buildPath('insights')).toBe('/insights');
      });

      it('should build path for profile', () => {
        expect(buildPath('profile')).toBe('/profile');
      });

      it('should build path for verify-email', () => {
        expect(buildPath('verify-email')).toBe('/verify-email');
      });

      it('should build path for reset-password', () => {
        expect(buildPath('reset-password')).toBe('/reset-password');
      });
    });

    describe('auth modes', () => {
      it('should build /sign-in for auth with login mode', () => {
        expect(buildPath('auth', { authMode: 'login' })).toBe('/sign-in');
      });

      it('should build /sign-up for auth with register mode', () => {
        expect(buildPath('auth', { authMode: 'register' })).toBe('/sign-up');
      });

      it('should default to /sign-in for auth without mode', () => {
        expect(buildPath('auth')).toBe('/sign-in');
      });
    });

    describe('resource IDs', () => {
      it('should append resource ID to assessment path', () => {
        expect(buildPath('assessment', { resourceId: 'abc-123' })).toBe('/assessment/abc-123');
      });

      it('should append resource ID to insights path', () => {
        expect(buildPath('insights', { resourceId: 'xyz-456' })).toBe('/insights/xyz-456');
      });

      it('should not append resource ID to non-resource views', () => {
        expect(buildPath('profile', { resourceId: 'ignored' })).toBe('/profile');
      });
    });

    describe('query params', () => {
      it('should append token as query param', () => {
        expect(buildPath('verify-email', { token: 'abc123' })).toBe('/verify-email?token=abc123');
      });

      it('should encode special characters in token', () => {
        expect(buildPath('reset-password', { token: 'a=b&c' })).toBe('/reset-password?token=a%3Db%26c');
      });
    });

    describe('hash', () => {
      it('should append hash', () => {
        expect(buildPath('assessment', { hash: 'step-3' })).toBe('/assessment#step-3');
      });

      it('should combine token and hash', () => {
        expect(buildPath('verify-email', { token: 'abc', hash: 'success' })).toBe(
          '/verify-email?token=abc#success'
        );
      });
    });

    describe('combined options', () => {
      it('should handle resourceId with token', () => {
        expect(buildPath('assessment', { resourceId: 'id-1', token: 'tok' })).toBe(
          '/assessment/id-1?token=tok'
        );
      });

      it('should handle all options together', () => {
        const result = buildPath('assessment', {
          resourceId: 'my-id',
          token: 'my-token',
          hash: 'my-hash',
        });
        expect(result).toBe('/assessment/my-id?token=my-token#my-hash');
      });
    });
  });
});

describe('useRouting hook', () => {
  const mockPushState = vi.fn();
  const mockReplaceState = vi.fn();
  let mockPathname = '/';
  let mockSearch = '';
  let mockHash = '';

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentView = 'landing';
    mockPathname = '/';
    mockSearch = '';
    mockHash = '';

    // Mock history
    Object.defineProperty(window, 'history', {
      value: {
        pushState: mockPushState,
        replaceState: mockReplaceState,
        state: null,
      },
      writable: true,
    });

    // Mock location
    Object.defineProperty(window, 'location', {
      value: {
        get pathname() {
          return mockPathname;
        },
        get search() {
          return mockSearch;
        },
        get hash() {
          return mockHash;
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    Object.defineProperty(window, 'history', { value: originalHistory, writable: true });
  });

  describe('navigate', () => {
    it('should navigate to a view and update history', () => {
      const { result } = renderHook(() => useRouting());

      act(() => {
        result.current.navigate('assessment');
      });

      expect(mockPushState).toHaveBeenCalledWith(
        { view: 'assessment', authMode: undefined, resourceId: undefined },
        '',
        '/assessment'
      );
      expect(mockSetView).toHaveBeenCalledWith('assessment');
    });

    it('should use replaceState when replace option is true', () => {
      const { result } = renderHook(() => useRouting());

      act(() => {
        result.current.navigate('profile', { replace: true });
      });

      expect(mockReplaceState).toHaveBeenCalledWith(
        { view: 'profile', authMode: undefined, resourceId: undefined },
        '',
        '/profile'
      );
    });

    it('should navigate to auth with authMode', () => {
      const { result } = renderHook(() => useRouting());

      act(() => {
        result.current.navigate('auth', { authMode: 'register' });
      });

      expect(mockPushState).toHaveBeenCalledWith(
        { view: 'auth', authMode: 'register', resourceId: undefined },
        '',
        '/sign-up'
      );
    });

    it('should navigate with resourceId', () => {
      const { result } = renderHook(() => useRouting());

      act(() => {
        result.current.navigate('assessment', { resourceId: 'abc-123' });
      });

      expect(mockPushState).toHaveBeenCalledWith(
        { view: 'assessment', authMode: undefined, resourceId: 'abc-123' },
        '',
        '/assessment/abc-123'
      );
    });
  });

  describe('getRouteParams', () => {
    it('should return current route params', () => {
      mockPathname = '/assessment';
      const { result } = renderHook(() => useRouting());

      const params = result.current.getRouteParams();

      expect(params.view).toBe('assessment');
    });

    it('should extract token from search', () => {
      mockPathname = '/verify-email';
      mockSearch = '?token=abc123';
      const { result } = renderHook(() => useRouting());

      const params = result.current.getRouteParams();

      expect(params.token).toBe('abc123');
    });

    it('should extract resourceId from path', () => {
      mockPathname = '/insights/my-id';
      const { result } = renderHook(() => useRouting());

      const params = result.current.getRouteParams();

      expect(params.view).toBe('insights');
      expect(params.resourceId).toBe('my-id');
    });
  });

  describe('getAuthMode', () => {
    it('should return default login mode', () => {
      const { result } = renderHook(() => useRouting());

      expect(result.current.getAuthMode()).toBe('login');
    });

    it('should return register mode after navigating to sign-up', () => {
      const { result } = renderHook(() => useRouting());

      act(() => {
        result.current.navigate('auth', { authMode: 'register' });
      });

      expect(result.current.getAuthMode()).toBe('register');
    });
  });

  describe('currentView', () => {
    it('should expose currentView from store', () => {
      mockCurrentView = 'profile';
      const { result } = renderHook(() => useRouting());

      expect(result.current.currentView).toBe('profile');
    });
  });

  describe('initialization', () => {
    it('should update view on mount if URL differs from store', async () => {
      mockPathname = '/profile';
      mockCurrentView = 'landing';

      renderHook(() => useRouting());

      await waitFor(() => {
        expect(mockSetView).toHaveBeenCalledWith('profile');
      });
    });

    it('should set authMode from URL on mount', () => {
      mockPathname = '/sign-up';
      mockCurrentView = 'auth';

      const { result } = renderHook(() => useRouting());

      expect(result.current.getAuthMode()).toBe('register');
    });
  });

  describe('popstate handling', () => {
    it('should handle popstate event', async () => {
      mockPathname = '/assessment';
      renderHook(() => useRouting());

      // Simulate back navigation
      mockPathname = '/profile';
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'profile' } }));
      });

      await waitFor(() => {
        expect(mockSetView).toHaveBeenCalledWith('profile');
      });
    });

    it('should update authMode from popstate state', async () => {
      mockPathname = '/sign-in';
      const { result } = renderHook(() => useRouting());

      // Simulate back to sign-up
      mockPathname = '/sign-up';
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'auth', authMode: 'register' } }));
      });

      expect(result.current.getAuthMode()).toBe('register');
    });
  });
});
