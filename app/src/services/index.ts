/**
 * @file services/index.ts
 * @purpose Main services module aggregator
 * @functionality
 * - Exports all service interfaces
 * - Exports all service implementations
 * - Provides convenient access to default service instances
 * @dependencies
 * - ./interfaces
 * - ./api
 */

// Interfaces
export type {
  IApiClient,
  RequestConfig,
  ApiResponse,
  ApiError,
  IClaudeService,
  AnalysisLanguage,
  AnalysisRequest,
  AnalysisResponse,
  IAuthService,
} from './interfaces';

// Implementations
export {
  ApiClient,
  ApiClientError,
  apiClient,
  ClaudeService,
  claudeService,
  AuthService,
  authService,
} from './api';
