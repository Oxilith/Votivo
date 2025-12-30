/**
 * @file services/api/ClaudeService.ts
 * @purpose Claude AI analysis service implementation
 * @functionality
 * - Implements IClaudeService interface
 * - Sends analysis requests to backend API
 * - Passes optional user profile for demographic context
 * - Handles response transformation
 * - Provides singleton instance for application use
 * @dependencies
 * - @/services/interfaces (IClaudeService, AnalysisRequest, AnalysisResponse)
 * - @/services/api/ApiClient (apiClient)
 */

import type { IClaudeService, AnalysisRequest, AnalysisResponse } from '@/services';
import { apiClient, ApiClientError } from '@/services';
import type { IApiClient } from '@/services';

interface BackendAnalyzeResponse {
  success: boolean;
  data?: {
    analysis: AnalysisResponse['analysis'];
    rawResponse: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class ClaudeService implements IClaudeService {
  private client: IApiClient;

  constructor(client: IApiClient) {
    this.client = client;
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await this.client.post<BackendAnalyzeResponse>(
      '/api/v1/claude/analyze',
      {
        responses: request.responses,
        language: request.language,
        userProfile: request.userProfile,
      },
      {
        timeout: 60000 * 10, // 10 minutes for AI analysis with extended thinking
        retries: 2, // Limited retries for expensive API calls
      }
    );

    const { data } = response;

    if (!data.success || !data.data) {
      throw new ApiClientError(
        data.error?.message ?? 'Analysis failed',
        data.error?.code ?? 'ANALYSIS_ERROR',
        response.status
      );
    }

    return {
      analysis: data.data.analysis,
      rawResponse: data.data.rawResponse,
    };
  }
}

// Default service instance using the default API client
export const claudeService = new ClaudeService(apiClient);
