/**
 * @file shared/src/testing/index.ts
 * @purpose Main barrel export for shared testing infrastructure
 * @functionality
 * - Exports all fixture factory functions
 * - Exports mock utilities (Prisma, MSW)
 * - Exports custom Vitest matchers
 * - Exports test utility functions
 * - Exports database test utilities
 * @dependencies
 * - ./fixtures
 * - ./mocks
 * - ./matchers
 * - ./utils
 * - ./db
 */

// Fixtures - factory functions for creating test data
export * from './fixtures'; // @allow-wildcard

// Mocks - Prisma and MSW mocking utilities
export * from './mocks'; // @allow-wildcard

// Utils - async helpers and Express mocks
export * from './utils'; // @allow-wildcard

// Database utilities - test DB lifecycle management
export {
  setTestPrisma,
  getTestPrisma,
  hasTestPrisma,
  cleanupTestDb,
  cleanupTables,
  disconnectTestDb,
  setupTestDb,
  withCleanup,
  CLEANUP_TABLE_ORDER,
  type PrismaLikeClient,
  type TableName,
} from './db';

// Custom matchers - must be imported for side effects (extends vitest)
// Import this in your test setup file to register the matchers
export * from './matchers'; // @allow-wildcard
