/**
 * @file stores/__tests__/useAnalysisStore.test.ts
 * @purpose Unit tests for AI analysis state management store
 * @functionality
 * - Tests initial state values
 * - Tests setAnalysis and clearAnalysis actions
 * - Tests analyze action with mocked service
 * - Tests error handling for API failures
 * - Tests export functionality (exportAnalysisToJson, downloadRawResponse)
 * @dependencies
 * - vitest
 * - @/stores/useAnalysisStore
 * - shared/testing for mock fixtures
 */

import { useAnalysisStore } from '../useAnalysisStore';
import { createMockAnalysisResult, createCompleteAssessment } from 'shared/testing';

// Mock the service layer
vi.mock('@/services', () => ({
  claudeService: {
    analyze: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string;
    status?: number;
    details?: unknown;
    constructor(message: string, code: string, status?: number, details?: unknown) {
      super(message);
      this.name = 'ApiClientError';
      this.code = code;
      this.status = status;
      this.details = details;
    }
  },
}));

// Import mocked service after mocking
import { claudeService, ApiClientError } from '@/services';

describe('useAnalysisStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAnalysisStore.setState({
      analysis: null,
      rawResponse: null,
      isAnalyzing: false,
      analysisError: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAnalysisStore.getState();

      expect(state.analysis).toBeNull();
      expect(state.rawResponse).toBeNull();
      expect(state.isAnalyzing).toBe(false);
      expect(state.analysisError).toBeNull();
    });
  });

  describe('setAnalysis', () => {
    it('should set analysis and raw response', () => {
      const mockAnalysis = createMockAnalysisResult();
      const rawResponse = '{"patterns": []}';
      const { setAnalysis } = useAnalysisStore.getState();

      setAnalysis(mockAnalysis, rawResponse);

      const state = useAnalysisStore.getState();
      expect(state.analysis).toEqual(mockAnalysis);
      expect(state.rawResponse).toBe(rawResponse);
      expect(state.analysisError).toBeNull();
    });

    it('should clear any existing error', () => {
      useAnalysisStore.setState({ analysisError: 'previous error' });

      const mockAnalysis = createMockAnalysisResult();
      const { setAnalysis } = useAnalysisStore.getState();

      setAnalysis(mockAnalysis, 'raw');

      expect(useAnalysisStore.getState().analysisError).toBeNull();
    });
  });

  describe('clearAnalysis', () => {
    it('should clear all analysis state', () => {
      const mockAnalysis = createMockAnalysisResult();
      const { setAnalysis, clearAnalysis } = useAnalysisStore.getState();

      setAnalysis(mockAnalysis, 'raw response');
      useAnalysisStore.setState({ analysisError: 'some error' });

      clearAnalysis();

      const state = useAnalysisStore.getState();
      expect(state.analysis).toBeNull();
      expect(state.rawResponse).toBeNull();
      expect(state.analysisError).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear only the error', () => {
      const mockAnalysis = createMockAnalysisResult();
      const { setAnalysis, clearError } = useAnalysisStore.getState();

      setAnalysis(mockAnalysis, 'raw');
      useAnalysisStore.setState({ analysisError: 'some error' });

      clearError();

      const state = useAnalysisStore.getState();
      expect(state.analysis).toEqual(mockAnalysis);
      expect(state.rawResponse).toBe('raw');
      expect(state.analysisError).toBeNull();
    });
  });

  describe('analyze', () => {
    it('should set isAnalyzing true at start', async () => {
      const mockAnalysis = createMockAnalysisResult();
      vi.mocked(claudeService.analyze).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Verify state during the call
            expect(useAnalysisStore.getState().isAnalyzing).toBe(true);
            resolve({ analysis: mockAnalysis, rawResponse: 'raw' });
          })
      );

      const responses = createCompleteAssessment();
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'english');
    });

    it('should call claudeService.analyze with correct parameters', async () => {
      const mockAnalysis = createMockAnalysisResult();
      vi.mocked(claudeService.analyze).mockResolvedValue({
        analysis: mockAnalysis,
        rawResponse: 'raw response',
      });

      const responses = createCompleteAssessment();
      const userProfile = { name: 'Test User', gender: 'male' as const, age: 30 };
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'polish', userProfile);

      expect(claudeService.analyze).toHaveBeenCalledWith({
        responses,
        language: 'polish',
        userProfile,
      });
    });

    it('should set analysis and rawResponse on success', async () => {
      const mockAnalysis = createMockAnalysisResult();
      vi.mocked(claudeService.analyze).mockResolvedValue({
        analysis: mockAnalysis,
        rawResponse: 'the raw response',
      });

      const responses = createCompleteAssessment();
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'english');

      const state = useAnalysisStore.getState();
      expect(state.analysis).toEqual(mockAnalysis);
      expect(state.rawResponse).toBe('the raw response');
      expect(state.isAnalyzing).toBe(false);
      expect(state.analysisError).toBeNull();
    });

    it('should clear previous error on new analysis', async () => {
      useAnalysisStore.setState({ analysisError: 'old error' });

      const mockAnalysis = createMockAnalysisResult();
      vi.mocked(claudeService.analyze).mockResolvedValue({
        analysis: mockAnalysis,
        rawResponse: 'raw',
      });

      const responses = createCompleteAssessment();
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'english');

      expect(useAnalysisStore.getState().analysisError).toBeNull();
    });

    it('should handle ApiClientError correctly', async () => {
      const apiError = new ApiClientError('Rate limit exceeded', 'RATE_LIMITED', 429);
      vi.mocked(claudeService.analyze).mockRejectedValue(apiError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const responses = createCompleteAssessment();
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'english');

      const state = useAnalysisStore.getState();
      expect(state.analysisError).toBe('Rate limit exceeded');
      expect(state.isAnalyzing).toBe(false);
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should handle generic Error correctly', async () => {
      const error = new Error('Network failure');
      vi.mocked(claudeService.analyze).mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const responses = createCompleteAssessment();
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'english');

      const state = useAnalysisStore.getState();
      expect(state.analysisError).toBe('Network failure');
      expect(state.isAnalyzing).toBe(false);
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should handle unknown error type', async () => {
      vi.mocked(claudeService.analyze).mockRejectedValue('string error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const responses = createCompleteAssessment();
      const { analyze } = useAnalysisStore.getState();

      await analyze(responses, 'english');

      const state = useAnalysisStore.getState();
      expect(state.analysisError).toBe('Failed to analyze responses');
      expect(state.isAnalyzing).toBe(false);
      // Note: console.error is NOT called for unknown error types (only ApiClientError and Error instances)
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('exportAnalysisToJson', () => {
    it('should not create download if analysis is null', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const { exportAnalysisToJson } = useAnalysisStore.getState();

      exportAnalysisToJson();

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should create and trigger download link when analysis exists', () => {
      const mockAnalysis = createMockAnalysisResult();
      useAnalysisStore.setState({ analysis: mockAnalysis });

      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const { exportAnalysisToJson } = useAnalysisStore.getState();
      exportAnalysisToJson();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('identity-analysis-results.json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
    });
  });

  describe('downloadRawResponse', () => {
    it('should not create download if rawResponse is null', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const { downloadRawResponse } = useAnalysisStore.getState();

      downloadRawResponse();

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should create and trigger download link when rawResponse exists', () => {
      useAnalysisStore.setState({ rawResponse: 'raw AI response text' });

      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:raw');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const { downloadRawResponse } = useAnalysisStore.getState();
      downloadRawResponse();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('raw-ai-response.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:raw');
    });
  });
});
