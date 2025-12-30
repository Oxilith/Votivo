/**
 * @file shared/src/testing/db.ts
 * @purpose Database test utilities with injectable Prisma client pattern
 * @functionality
 * - Provides setTestPrisma for injecting test database client
 * - Provides getTestPrisma for retrieving the configured client
 * - Provides hasTestPrisma for checking client initialization
 * - Provides cleanupTestDb for clearing all test data (ignores missing tables)
 * - Provides cleanupTables for clearing specific tables (throws on error)
 * - Provides disconnectTestDb for cleanup after test suite
 * - Provides setupTestDb for automatic lifecycle management
 * - Provides withCleanup for isolated test execution with cleanup
 * @dependencies
 * - vitest for test lifecycle hooks
 */

import { beforeEach, afterAll } from 'vitest';

/**
 * Minimal interface for Prisma-like client operations.
 * This allows the shared testing module to work without importing @prisma/client.
 */
export interface PrismaLikeClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $executeRawUnsafe(query: string): Promise<unknown>;
}

// Module-level client storage
let testClient: PrismaLikeClient | null = null;

/**
 * Sets the Prisma client for test database operations.
 * Call this in your workspace's test setup file.
 *
 * @param client - The Prisma client instance to use for tests
 *
 * @example
 * ```typescript
 * // prompt-service/vitest.setup.ts
 * import { PrismaClient } from '@prisma/client';
 * import { setTestPrisma } from 'shared/testing';
 *
 * const prisma = new PrismaClient();
 * setTestPrisma(prisma);
 * ```
 */
export function setTestPrisma(client: PrismaLikeClient): void {
  testClient = client;
}

/**
 * Gets the configured test Prisma client.
 * Throws if setTestPrisma has not been called.
 *
 * @returns The configured Prisma client
 * @throws Error if no client has been set
 *
 * @example
 * ```typescript
 * const prisma = getTestPrisma();
 * await prisma.$executeRawUnsafe('DELETE FROM "User"');
 * ```
 */
export function getTestPrisma(): PrismaLikeClient {
  if (!testClient) {
    throw new Error(
      'Test Prisma client not initialized. Call setTestPrisma() in your test setup file.'
    );
  }
  return testClient;
}

/**
 * Checks if a test Prisma client has been configured.
 *
 * @returns true if a client has been set
 */
export function hasTestPrisma(): boolean {
  return testClient !== null;
}

/**
 * Tables to clean up, ordered by foreign key dependencies.
 * Children (dependent tables) must be deleted before parents.
 * Exported for use with cleanupTables type validation.
 */
export const CLEANUP_TABLE_ORDER = [
  // A/B test related (most dependent)
  'ABVariantConfig',
  'ABVariant',
  'ABTest',

  // Prompt related
  'PromptVersion',
  'PromptVariant',

  // User data (depends on User and Assessment)
  'Analysis',
  'Assessment',

  // Auth tokens (depends on User)
  'EmailVerifyToken',
  'PasswordResetToken',
  'RefreshToken',

  // Core tables (least dependent)
  'User',
  'Prompt',
] as const;

/**
 * Type for valid table names from the schema.
 * Use with cleanupTables for compile-time validation.
 */
export type TableName = (typeof CLEANUP_TABLE_ORDER)[number];

/**
 * Cleans up all test data from the database.
 * Deletes from tables in correct order to respect foreign key constraints.
 *
 * @throws Error if no client has been configured
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await cleanupTestDb();
 * });
 * ```
 */
export async function cleanupTestDb(): Promise<void> {
  const prisma = getTestPrisma();

  for (const table of CLEANUP_TABLE_ORDER) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    } catch (error: unknown) {
      // Only suppress "table does not exist" errors for workspaces with partial schemas
      const isTableNotExist =
        error instanceof Error &&
        (error.message.includes('no such table') ||
          error.message.includes('does not exist'));

      if (!isTableNotExist) {
        // Log unexpected errors (connection, permissions) but continue cleanup
        console.error(`[cleanupTestDb] Failed to clean table "${table}":`, error);
      }
    }
  }
}

/**
 * Cleans up specific tables from the database.
 * Useful when you only need to clean certain tables between tests.
 *
 * Note: Unlike cleanupTestDb(), this function throws on errors including
 * missing tables. Use this when you need strict cleanup verification.
 *
 * @param tables - Array of valid table names from CLEANUP_TABLE_ORDER
 * @throws Error if any table doesn't exist or deletion fails
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await cleanupTables(['User', 'RefreshToken']);
 * });
 * ```
 */
export async function cleanupTables(tables: readonly TableName[]): Promise<void> {
  const prisma = getTestPrisma();

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
}

/**
 * Disconnects the test Prisma client and clears the reference.
 * Call this in afterAll to clean up resources.
 *
 * @example
 * ```typescript
 * afterAll(async () => {
 *   await disconnectTestDb();
 * });
 * ```
 */
export async function disconnectTestDb(): Promise<void> {
  if (testClient) {
    const client = testClient;
    testClient = null; // Clear first to prevent stale state on error
    try {
      await client.$disconnect();
    } catch (error: unknown) {
      console.error('[disconnectTestDb] Failed to disconnect:', error);
      throw error;
    }
  }
}

/**
 * Sets up database lifecycle hooks for a test file.
 * Automatically cleans up between tests and disconnects after the suite.
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * describe('UserService Integration', () => {
 *   setupTestDb();
 *
 *   it('creates a user', async () => {
 *     // Database is clean at the start of each test
 *   });
 * });
 * ```
 */
export function setupTestDb(options: { cleanupBeforeEach?: boolean } = {}): void {
  const { cleanupBeforeEach = true } = options;

  if (cleanupBeforeEach) {
    beforeEach(async () => {
      if (hasTestPrisma()) {
        await cleanupTestDb();
      }
    });
  }

  afterAll(async () => {
    await disconnectTestDb();
  });
}

/**
 * Wraps a test callback with automatic database cleanup afterward.
 * Useful for keeping test data isolated without explicit cleanup calls.
 *
 * Note: This performs cleanup via DELETE, not transaction rollback.
 * All data created during the callback will be deleted after it completes.
 *
 * @param callback - Test function to run
 * @returns Promise that resolves with the callback's return value after cleanup
 *
 * @example
 * ```typescript
 * it('creates data in isolation', async () => {
 *   const result = await withCleanup(async (prisma) => {
 *     await prisma.$executeRawUnsafe('INSERT INTO "User" ...');
 *     return { success: true };
 *     // Data is automatically cleaned up after the test
 *   });
 *   expect(result.success).toBe(true);
 * });
 * ```
 */
export async function withCleanup<T>(
  callback: (prisma: PrismaLikeClient) => Promise<T>
): Promise<T> {
  const prisma = getTestPrisma();

  try {
    return await callback(prisma);
  } finally {
    await cleanupTestDb();
  }
}
