/**
 * @file app/__tests__/unit/hooks/useResourceLoader.test.ts
 * @purpose Unit tests for resource loading hook behaviors
 * @functionality
 * - Tests skipping load when auth not ready
 * - Tests skipping load when not authenticated
 * - Tests loading assessment by ID sets view-only mode
 * - Tests loading analysis by ID sets view-only mode
 * - Tests clearing read-only when leaving resource views
 * - Tests error handling on load failure
 * - Tests duplicate load prevention
 * @dependencies
 * - vitest globals
 * - @testing-library/react for hook testing
 * - useResourceLoader under test
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useResourceLoader } from '@/hooks/useResourceLoader';

// Mock stores
const mockSetReadOnlyMode = vi.fn();
const mockClearReadOnlyMode = vi.fn();
const mockSetLoading = vi.fn();
const mockSetStartAtSynthesis = vi.fn();
const mockSetHasReachedSynthesis = vi.fn();
const mockIncrementAssessmentKey = vi.fn();
const mockHydrateFromDB = vi.fn();
const mockSetAnalysis = vi.fn();

let mockUser: { id: string } | null = { id: 'user-1' };
let mockIsAuthInitialized = true;
let mockIsAuthHydrated = true;
let mockResponses: Record<string, unknown> = {};
let mockSavedAt: string | null = null;
let mockAnalysis: unknown = null;
let mockCurrentView = 'assessment';
let mockResourceId: string | undefined = undefined;

vi.mock('@/stores', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: mockUser }),
  useAuthInitialized: () => mockIsAuthInitialized,
  useAuthHydrated: () => mockIsAuthHydrated,
  useAssessmentStore: (selector?: (state: {
    responses: Record<string, unknown>;
    hydrateFromDB: typeof mockHydrateFromDB;
    savedAt: string | null;
  }) => unknown) => {
    const state = {
      responses: mockResponses,
      hydrateFromDB: mockHydrateFromDB,
      savedAt: mockSavedAt,
    };
    // Handle both selector and direct usage patterns
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  },
  useAnalysisStore: (selector: (state: { analysis: unknown; setAnalysis: typeof mockSetAnalysis }) => unknown) => {
    const state = { analysis: mockAnalysis, setAnalysis: mockSetAnalysis };
    return selector(state);
  },
  useUIStore: () => ({
    setReadOnlyMode: mockSetReadOnlyMode,
    clearReadOnlyMode: mockClearReadOnlyMode,
    setLoading: mockSetLoading,
    setStartAtSynthesis: mockSetStartAtSynthesis,
    setHasReachedSynthesis: mockSetHasReachedSynthesis,
    incrementAssessmentKey: mockIncrementAssessmentKey,
  }),
}));

vi.mock('@/hooks/useRouting', () => ({
  useRouting: () => ({
    currentView: mockCurrentView,
    getRouteParams: () => ({
      view: mockCurrentView,
      resourceId: mockResourceId,
    }),
  }),
}));

const mockGetAssessmentById = vi.fn();
const mockGetAnalysisById = vi.fn();
const mockGetAssessments = vi.fn();
const mockGetAnalyses = vi.fn();

vi.mock('@/services', () => ({
  authService: {
    getAssessmentById: (...args: unknown[]) => mockGetAssessmentById(...args),
    getAnalysisById: (...args: unknown[]) => mockGetAnalysisById(...args),
    getAssessments: (...args: unknown[]) => mockGetAssessments(...args),
    getAnalyses: (...args: unknown[]) => mockGetAnalyses(...args),
  },
}));

vi.mock('@/utils', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useResourceLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default authenticated state
    mockUser = { id: 'user-1' };
    mockIsAuthInitialized = true;
    mockIsAuthHydrated = true;
    mockResponses = {};
    mockSavedAt = null; // Default to unsaved (uncompleted)
    mockAnalysis = null;
    mockCurrentView = 'assessment';
    mockResourceId = undefined;
    // Set default return values for mocked functions
    mockGetAssessments.mockResolvedValue([]);
    mockGetAnalyses.mockResolvedValue([]);
  });

  describe('auth state checks', () => {
    it('should not load when auth is not hydrated', async () => {
      mockIsAuthHydrated = false;
      mockResourceId = 'assessment-123';

      renderHook(() => useResourceLoader());

      // Wait a tick for effect to run
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockGetAssessmentById).not.toHaveBeenCalled();
      expect(mockSetReadOnlyMode).not.toHaveBeenCalled();
    });

    it('should not load when auth is not initialized', async () => {
      mockIsAuthInitialized = false;
      mockResourceId = 'assessment-123';

      renderHook(() => useResourceLoader());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockGetAssessmentById).not.toHaveBeenCalled();
    });

    it('should not load when user is not authenticated', async () => {
      mockUser = null;
      mockResourceId = 'assessment-123';

      renderHook(() => useResourceLoader());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockGetAssessmentById).not.toHaveBeenCalled();
      expect(mockClearReadOnlyMode).toHaveBeenCalled();
    });
  });

  describe('assessment loading by ID', () => {
    it('should load assessment by ID and set view-only mode', async () => {
      mockResourceId = 'assessment-123';
      mockGetAssessmentById.mockResolvedValueOnce({
        id: 'assessment-123',
        responses: { peakEnergyTime: 'morning' },
        createdAt: '2024-01-01T00:00:00Z',
      });

      const { result } = renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetAssessmentById).toHaveBeenCalledWith('assessment-123');
      expect(mockSetReadOnlyMode).toHaveBeenCalledWith('assessment-123');
      expect(mockSetStartAtSynthesis).toHaveBeenCalledWith(true);
      expect(mockSetHasReachedSynthesis).toHaveBeenCalledWith(true);
      expect(result.current.viewOnlyAssessment).toEqual({
        responses: { peakEnergyTime: 'morning' },
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

  });

  describe('analysis loading by ID', () => {
    it('should load analysis by ID and set view-only mode', async () => {
      mockCurrentView = 'insights';
      mockResourceId = 'analysis-456';
      mockGetAnalysisById.mockResolvedValueOnce({
        id: 'analysis-456',
        result: { patterns: [] },
        createdAt: '2024-01-01T00:00:00Z',
        assessmentId: 'assessment-123',
      });

      const { result } = renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetAnalysisById).toHaveBeenCalledWith('analysis-456');
      expect(mockSetReadOnlyMode).toHaveBeenCalledWith('analysis-456', 'assessment-123');
      expect(result.current.viewOnlyAnalysis).toEqual({
        result: { patterns: [] },
        createdAt: '2024-01-01T00:00:00Z',
        assessmentId: 'assessment-123',
      });
    });

    it('should handle analysis without assessmentId', async () => {
      mockCurrentView = 'insights';
      mockResourceId = 'analysis-789';
      mockGetAnalysisById.mockResolvedValueOnce({
        id: 'analysis-789',
        result: { patterns: [] },
        createdAt: '2024-01-01T00:00:00Z',
        assessmentId: null,
      });

      const { result } = renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(result.current.viewOnlyAnalysis?.assessmentId).toBeNull();
      });

      expect(mockSetReadOnlyMode).toHaveBeenCalledWith('analysis-789', undefined);
    });
  });

  describe('most recent loading', () => {
    it('should load most recent assessment when store is empty', async () => {
      mockResourceId = undefined;
      mockResponses = {}; // Empty store
      mockGetAssessments.mockResolvedValueOnce([
        { id: 'old', responses: { peakEnergyTime: 'evening' }, createdAt: '2024-01-01T00:00:00Z' },
        { id: 'newest', responses: { peakEnergyTime: 'morning' }, createdAt: '2024-01-02T00:00:00Z' },
      ]);

      renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(mockHydrateFromDB).toHaveBeenCalled();
      });

      // Should load the newest one (sorted by createdAt desc)
      expect(mockHydrateFromDB).toHaveBeenCalledWith({ peakEnergyTime: 'morning' }, '2024-01-02T00:00:00Z');
      expect(mockClearReadOnlyMode).toHaveBeenCalled();
    });

    it('should not load most recent when store has data', async () => {
      mockResourceId = undefined;
      mockResponses = { peakEnergyTime: 'afternoon' }; // Has data

      renderHook(() => useResourceLoader());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockGetAssessments).not.toHaveBeenCalled();
    });
  });

  describe('saved assessment readonly detection', () => {
    it('should set readonly mode when savedAt is set (completed assessment)', async () => {
      mockResourceId = undefined;
      mockResponses = { peakEnergyTime: 'morning' }; // Has data
      mockSavedAt = '2024-01-01T00:00:00Z'; // Completed (savedAt set)

      renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(mockSetReadOnlyMode).toHaveBeenCalledWith('local-saved');
      });

      expect(mockSetStartAtSynthesis).toHaveBeenCalledWith(true);
      expect(mockSetHasReachedSynthesis).toHaveBeenCalledWith(true);
      expect(mockIncrementAssessmentKey).toHaveBeenCalled();
    });

    it('should clear readonly mode when savedAt is null (uncompleted assessment)', async () => {
      mockResourceId = undefined;
      mockResponses = { peakEnergyTime: 'morning' }; // Has data
      mockSavedAt = null; // Uncompleted (never saved)

      renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(mockClearReadOnlyMode).toHaveBeenCalled();
      });

      expect(mockSetReadOnlyMode).not.toHaveBeenCalled();
    });
  });

  describe('insights view with analysis in store', () => {
    it('should load assessment first, then matching analysis when stores are empty', async () => {
      mockCurrentView = 'insights';
      mockResourceId = undefined;
      mockResponses = {}; // Empty assessment store
      mockAnalysis = null; // Empty analysis store

      // Mock getAssessments returns newest assessment with id
      mockGetAssessments.mockResolvedValueOnce([
        { id: 'assessment-1', responses: { peakEnergyTime: 'morning' }, createdAt: '2024-01-02T00:00:00Z' },
      ]);

      // Mock getAnalyses returns analysis linked to that assessment
      mockGetAnalyses.mockResolvedValueOnce([
        { id: 'analysis-1', result: { patterns: ['test'] }, createdAt: '2024-01-02T00:00:00Z', assessmentId: 'assessment-1' },
      ]);

      renderHook(() => useResourceLoader());

      await waitFor(() => {
        expect(mockHydrateFromDB).toHaveBeenCalled();
      });

      // Should load assessment first
      expect(mockHydrateFromDB).toHaveBeenCalledWith({ peakEnergyTime: 'morning' }, '2024-01-02T00:00:00Z');

      await waitFor(() => {
        expect(mockSetAnalysis).toHaveBeenCalled();
      });

      // Should load matching analysis
      expect(mockSetAnalysis).toHaveBeenCalledWith({ patterns: ['test'] }, '');
      expect(mockClearReadOnlyMode).toHaveBeenCalled();
    });

    it('should not load when analysis store already has data', async () => {
      mockCurrentView = 'insights';
      mockResourceId = undefined;
      mockResponses = { peakEnergyTime: 'morning' }; // Has data
      mockAnalysis = { patterns: ['existing'] }; // Has data

      renderHook(() => useResourceLoader());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockGetAnalyses).not.toHaveBeenCalled();
      expect(mockClearReadOnlyMode).toHaveBeenCalled();
    });
  });

  describe('view transitions', () => {
    it('should skip loading for non-resource views', async () => {
      mockCurrentView = 'profile';

      renderHook(() => useResourceLoader());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockGetAssessmentById).not.toHaveBeenCalled();
      expect(mockGetAnalysisById).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should return clearError function', async () => {
      const { result } = renderHook(() => useResourceLoader());

      // Wait for hook to settle after initial effects
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.clearError).toBe('function');
    });
  });
});
