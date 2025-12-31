/**
 * @file shared/src/testing/setup/test-db.ts
 * @purpose Database setup for integration tests with availability checking
 * @functionality
 * - Checks database availability and migrations
 * - Sets up test Prisma instance for cleanup utilities
 * - Provides cleanup between tests for isolation
 * - Gracefully skips tests when database unavailable
 * @dependencies
 * - vitest for test hooks
 * - ../db for Prisma test utilities
 */

import { beforeAll, beforeEach, afterAll } from 'vitest';
import { setTestPrisma, cleanupTestDb, type PrismaLikeClient } from './db'; 

/**
 * Checks if the database is available and has migrations applied.
 * @param prisma - The Prisma client instance to check
 * @returns Promise<boolean> - True if database is available and ready
 */
export async function checkDatabaseAvailable(prisma: PrismaLikeClient): Promise<boolean> {
  try {
    // Check basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    // Check if User table exists (migrations applied)
    // Using type assertion because different packages may have different models
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (typeof prismaAny.user === 'object' && prismaAny.user !== null) {
      const userModel = prismaAny.user as { findFirst?: () => Promise<unknown> };
      if (typeof userModel.findFirst === 'function') {
        await userModel.findFirst();
      }
    }
    return true;
  } catch {
    console.warn(
      'Database not available or migrations not applied. ' +
      'Integration tests will be skipped. ' +
      'Run `npm run db:migrate` in prompt-service to enable these tests.'
    );
    return false;
  }
}

/**
 * Sets up integration test database lifecycle hooks.
 * Provides beforeAll/beforeEach/afterAll hooks that:
 * - Check database availability
 * - Register Prisma for cleanup utilities
 * - Clean up data between tests
 * - Disconnect after all tests
 *
 * @param prisma - The Prisma client instance to use
 * @returns Object with isDatabaseAvailable function for conditional test skipping
 *
 * @example
 * ```typescript
 * describe('Integration Tests', () => {
 *   const { isDatabaseAvailable } = setupIntegrationDb(prisma);
 *
 *   it('should do something with database', async () => {
 *     if (!isDatabaseAvailable()) {
 *       console.log('Skipping: database not available');
 *       return;
 *     }
 *     // ... test code
 *   });
 * });
 * ```
 */
export function setupIntegrationDb(prisma: PrismaLikeClient) {
  let databaseAvailable = false;

  beforeAll(async () => {
    databaseAvailable = await checkDatabaseAvailable(prisma);
    if (databaseAvailable) {
      setTestPrisma(prisma);
    }
  });

  beforeEach(async () => {
    if (databaseAvailable) {
      await cleanupTestDb();
    }
  });

  afterAll(async () => {
    if (databaseAvailable) {
      await cleanupTestDb();
    }
    await prisma.$disconnect();
  });

  return {
    /**
     * Returns whether the database is available for testing.
     * Use this to conditionally skip tests that require database.
     */
    isDatabaseAvailable: () => databaseAvailable,
  };
}
