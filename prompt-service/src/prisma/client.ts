/**
 * @file prompt-service/src/prisma/client.ts
 * @purpose Singleton Prisma client instance with SQLCipher encryption support
 * @functionality
 * - Provides a single shared Prisma client instance
 * - Supports SQLCipher encryption via libsql adapter when DATABASE_KEY is set
 * - Falls back to standard SQLite when no encryption key is provided
 * - Handles graceful shutdown on process termination
 * - Prevents multiple client instances in development with hot reload
 * @dependencies
 * - @prisma/client for database access
 * - @prisma/adapter-libsql for driver adapter
 * - @libsql/client for SQLCipher encrypted connections
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const encryptionKey = process.env.DATABASE_KEY;

  // If encryption key is provided, use libsql with SQLCipher
  if (encryptionKey) {
    const libsql = createClient({
      url: databaseUrl ?? 'file:./dev.db',
      encryptionKey,
    });

    const adapter = new PrismaLibSQL(libsql);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  // No encryption key - use standard Prisma client
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', () => {
  void prisma.$disconnect();
});
