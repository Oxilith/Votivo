/**
 * @file backend/src/testing/index.ts
 * @purpose Barrel export for backend testing utilities
 * @functionality
 * - Exports integration test setup and helpers
 * - Exports MSW handlers and server factory
 * @dependencies
 * - ./integration-setup
 */

export {
  createBackendTestApp,
  createMswServer,
  createMswHandlers,
  mockClaudeSuccessResponse,
  mockPromptServiceResponse,
  validAssessmentResponses,
  http,
  HttpResponse,
} from './integration-setup';
