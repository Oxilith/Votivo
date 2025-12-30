/**
 * @file shared/src/testing/mocks/index.ts
 * @purpose Barrel export for mock utilities
 * @functionality
 * - Exports Prisma mock factory (createMockPrisma)
 * - Exports MSW handlers for API mocking
 * - Exports MSW server setup utilities
 * @dependencies
 * - ./prisma.mock
 * - ./handlers
 * - ./server
 */

// Prisma mock
export {
  createMockPrisma,
  createTransactionAwareMockPrisma,
  resetMockPrisma,
  createHoistedPrismaMock,
  type ModelMock,
  type MockPrismaClient,
} from './prisma.mock';

// MSW handlers
export {
  handlers,
  anthropicHandlers,
  createRateLimitHandler,
  createNetworkErrorHandler,
  createSlowResponseHandler,
  createCustomResponseHandler,
  createErrorHandler,
  createOverloadedHandler,
  createAuthenticationErrorHandler,
} from './handlers';

// MSW server
export {
  server,
  setupMswServer,
  useHandlers,
  resetHandlers,
  getRegisteredHandlers,
  type SetupMswServerOptions,
} from './server';
