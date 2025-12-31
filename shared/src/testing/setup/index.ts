/**
 * @file shared/src/testing/setup/index.ts
 * @purpose Barrel export for integration test setup utilities
 * @functionality
 * - Exports database setup utilities for integration tests
 * @dependencies
 * - ./test-db for database setup functions
 */

export { setupIntegrationDb, checkDatabaseAvailable } from './test-db';

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
    type CleanupOptions,
} from './db';