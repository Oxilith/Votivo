/**
 * @file worker/src/prisma/client.ts
 * @purpose Prisma client setup with libsql adapter for encrypted SQLite
 * @functionality
 * - Creates Prisma client with libsql adapter
 * - Supports database encryption via DATABASE_KEY
 * - Shares database with prompt-service
 * - Provides factory function for fresh connections (avoids stale connection issues)
 * @dependencies
 * - shared/prisma for PrismaClient (generated types)
 * - @prisma/adapter-libsql for libsql support
 * - @/config for database configuration
 *
 * ESLint disabled rules are due to PrismaLibSql adapter not preserving full PrismaClient types.
 * This is a known limitation when using Prisma's driver adapter pattern.
 * See: https://github.com/prisma/prisma/issues/21365
 */

import { PrismaClient } from 'shared/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { config } from '@/config';

/**
 * Creates a fresh Prisma client with a new libsql connection.
 * Use this for long-running processes where the connection may become stale.
 * Remember to call prisma.$disconnect() when done.
 */
export function createFreshPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSql({
    url: config.databaseUrl,
    encryptionKey: config.databaseKey,
  });
  return new PrismaClient({
    adapter,
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }) as PrismaClient;
}

// Create Prisma adapter with libsql config (Prisma 7+ API)
const adapter = new PrismaLibSql({
  url: config.databaseUrl,
  encryptionKey: config.databaseKey,
});

// Create Prisma client with adapter (for startup/immediate use)
export const prisma = new PrismaClient({
  adapter,
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
}) as PrismaClient;
