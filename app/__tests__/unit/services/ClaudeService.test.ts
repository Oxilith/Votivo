/**
 * @file app/__tests__/unit/services/ClaudeService.test.ts
 * @purpose Unit tests for Claude AI analysis service
 * @functionality
 * - Tests successful analysis returns transformed response
 * - Tests error handling when API returns failure
 * - Tests error handling when data is missing
 * - Tests request payload is correctly passed to client
 * @dependencies
 * - vitest globals
 * - ClaudeService under test
 * - IApiClient mock
 */

import { ClaudeService } from '@/services/api/ClaudeService';
import { ApiClientError } from '@/services';
import type { IApiClient, AnalysisRequest, ApiResponse } from '@/services';
import type { AIAnalysisResult, AssessmentResponses, UserProfileForAnalysis } from 'shared';

// Create mock Headers object
function createMockHeaders(): Headers {
  return new Headers();
}

// Mock API client
function createMockClient(): IApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

// Sample analysis result
const mockAnalysis: AIAnalysisResult = {
  patterns: [
    {
      title: 'Test Pattern',
      icon: '🔍',
      severity: 'high',
      description: 'A test pattern',
      evidence: ['evidence 1'],
      implication: 'Some implication',
      leverage: 'Build on this',
    },
  ],
  contradictions: [],
  blindSpots: [],
  leveragePoints: [],
  risks: [],
  identitySynthesis: {
    currentIdentityCore: 'Current identity text',
    hiddenStrengths: ['Strength 1'],
    keyTension: 'Key tension text',
    nextIdentityStep: 'Next step text',
  },
};

// Valid assessment responses for tests
const validResponses: AssessmentResponses = {
  peak_energy_times: ['mid_morning'],
  low_energy_times: ['late_night'],
  energy_consistency: 4,
  energy_drains: 'Meetings',
  energy_restores: 'Creative work',
  mood_triggers_negative: ['overwhelm'],
  motivation_reliability: 3,
  willpower_pattern: 'distraction',
  identity_statements: 'I am a learner',
  others_describe: 'Creative',
  automatic_behaviors: 'Coffee routine',
  keystone_behaviors: 'Exercise',
  core_values: ['growth'],
  natural_strengths: 'Problem solving',
  resistance_patterns: 'Procrastination',
  identity_clarity: 4,
};

describe('ClaudeService', () => {
  let mockClient: IApiClient;
  let service: ClaudeService;

  const validRequest: AnalysisRequest = {
    responses: validResponses,
    language: 'english',
  };

  beforeEach(() => {
    mockClient = createMockClient();
    service = new ClaudeService(mockClient);
  });

  describe('analyze', () => {
    it('should return analysis on successful response', async () => {
      const backendResponse: ApiResponse<{
        success: boolean;
        data: { analysis: AIAnalysisResult; rawResponse: string };
      }> = {
        data: {
          success: true,
          data: {
            analysis: mockAnalysis,
            rawResponse: 'raw response text',
          },
        },
        status: 200,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(backendResponse);

      const result = await service.analyze(validRequest);

      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.rawResponse).toBe('raw response text');
    });

    it('should pass correct request payload to client', async () => {
      const backendResponse: ApiResponse<{
        success: boolean;
        data: { analysis: AIAnalysisResult; rawResponse: string };
      }> = {
        data: {
          success: true,
          data: {
            analysis: mockAnalysis,
            rawResponse: 'raw',
          },
        },
        status: 200,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(backendResponse);

      await service.analyze(validRequest);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/claude/analyze',
        {
          responses: validRequest.responses,
          language: validRequest.language,
          userProfile: undefined,
        },
        {
          timeout: 600000,
          retries: 2,
        }
      );
    });

    it('should include userProfile when provided', async () => {
      const userProfile: UserProfileForAnalysis = {
        name: 'Test User',
        age: 34,
        gender: 'male',
      };

      const requestWithProfile: AnalysisRequest = {
        ...validRequest,
        userProfile,
      };

      const backendResponse: ApiResponse<{
        success: boolean;
        data: { analysis: AIAnalysisResult; rawResponse: string };
      }> = {
        data: {
          success: true,
          data: {
            analysis: mockAnalysis,
            rawResponse: 'raw',
          },
        },
        status: 200,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(backendResponse);

      await service.analyze(requestWithProfile);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/claude/analyze',
        expect.objectContaining({
          userProfile,
        }),
        expect.any(Object)
      );
    });

    it('should throw ApiClientError when success is false', async () => {
      const errorResponse: ApiResponse<{
        success: boolean;
        error: { code: string; message: string };
      }> = {
        data: {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
          },
        },
        status: 429,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(errorResponse);

      await expect(service.analyze(validRequest)).rejects.toThrow(ApiClientError);
    });

    it('should include error code and message from response', async () => {
      const errorResponse: ApiResponse<{
        success: boolean;
        error: { code: string; message: string };
      }> = {
        data: {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
          },
        },
        status: 429,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(errorResponse);

      await expect(service.analyze(validRequest)).rejects.toMatchObject({
        message: 'Too many requests',
        code: 'RATE_LIMITED',
      });
    });

    it('should throw ApiClientError when data is missing', async () => {
      const errorResponse: ApiResponse<{
        success: boolean;
        data?: undefined;
      }> = {
        data: {
          success: true,
          data: undefined,
        },
        status: 200,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(errorResponse);

      await expect(service.analyze(validRequest)).rejects.toThrow(ApiClientError);
    });

    it('should use default error message when not provided', async () => {
      const errorResponse: ApiResponse<{
        success: boolean;
      }> = {
        data: {
          success: false,
        },
        status: 500,
        headers: createMockHeaders(),
      };

      vi.mocked(mockClient.post).mockResolvedValueOnce(errorResponse);

      await expect(service.analyze(validRequest)).rejects.toMatchObject({
        message: 'Analysis failed',
        code: 'ANALYSIS_ERROR',
      });
    });
  });
});
