/**
 * @file services/interfaces/index.ts
 * @purpose Aggregates and exports all service interfaces
 * @functionality
 * - Provides centralized export for service interfaces
 * - Simplifies imports throughout the application
 * @dependencies
 * - ./IApiClient
 * - ./IClaudeService
 */

export type {
  IApiClient,
  RequestConfig,
  ApiResponse,
  ApiError,
} from './IApiClient';

export type {
  IClaudeService,
  AnalysisLanguage,
  AnalysisRequest,
  AnalysisResponse,
} from './IClaudeService';
