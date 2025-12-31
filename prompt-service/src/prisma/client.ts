/**
 * @file prompt-service/src/prisma/client.ts
 * @purpose Singleton Prisma client instance with SQLCipher encryption support
 * @functionality
 * - Provides a single shared Prisma client instance
 * - Supports SQLCipher encryption via libsql adapter when DATABASE_KEY is set
 * - Falls back to standard SQLite when no encryption key is provided
 * - Prevents multiple client instances in development with hot reload
 * @note Graceful shutdown is handled in index.ts via SIGTERM/SIGINT handlers
 * @dependencies
 * - @prisma/client for database access
 * - @prisma/adapter-libsql for driver adapter
 * - @libsql/client for SQLCipher encrypted connections
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
  const encryptionKey = process.env.DATABASE_KEY;

  // Create adapter with libsql config (Prisma 7+ API)
  const adapter = new PrismaLibSql({
    url: databaseUrl,
    encryptionKey,
  });

  // Determine log level based on environment
  // - Development: verbose logging for debugging
  // - Test: no logging to keep test output clean
  // - Production: error logging only
  const logConfig =
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : process.env.NODE_ENV === 'test'
        ? []
        : ['error'];

  return new PrismaClient({
    adapter,
    log: logConfig as ('query' | 'info' | 'warn' | 'error')[],
  });
}

/**
 * Singleton Prisma instance
 * Uses global caching in all environments to ensure a single connection pool:
 * - Development: Prevents connection leaks during hot module reloading
 * - Production: Ensures consistent single instance across module imports
 * The caching is safe because PrismaClient manages its own connection pool.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache instance globally to prevent connection leaks
globalForPrisma.prisma = prisma;
