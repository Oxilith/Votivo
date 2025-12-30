/**
 * @file services/api/index.ts
 * @purpose Aggregates and exports API service implementations
 * @functionality
 * - Provides centralized export for API services
 * - Exports both classes and singleton instances
 * @dependencies
 * - ./ApiClient
 * - ./ClaudeService
 */

export { ApiClient, ApiClientError, apiClient } from './ApiClient';
export { ClaudeService, claudeService } from './ClaudeService';
export { AuthService, authService } from './AuthService';
