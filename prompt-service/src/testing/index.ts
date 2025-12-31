/**
 * @file prompt-service/src/testing/index.ts
 * @purpose Barrel export for prompt-service testing utilities
 * @functionality
 * - Exports integration test setup and helpers
 * - Exports test app factory and authenticated request builders
 * @dependencies
 * - ./integration-setup
 */

export {
  TEST_CONFIG,
  createIntegrationTestApp,
  createTestAgent,
  createAuthenticatedRequest,
  integrationTestHooks,
  registerTestUser,
  loginTestUser,
  prisma,
  type AuthenticatedRequestBuilder,
} from './integration-setup';
