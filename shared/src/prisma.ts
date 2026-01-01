/**
 * @file shared/src/prisma.ts
 * @purpose Server-side Prisma client and type exports for backend packages
 * @functionality
 * - Re-exports PrismaClient class for database connections
 * - Re-exports Prisma namespace with TransactionClient and utilities
 * - Re-exports all model types (User, Prompt, ABTest, etc.)
 * - Re-exports common input types and enums
 * - Re-exports TransactionIsolationLevel for explicit transaction control
 * @dependencies
 * - ./generated/prisma/client for PrismaClient and runtime
 * - ./generated/prisma/models for model types
 * - ./generated/prisma/enums for enum types
 * - ./generated/prisma/commonInputTypes for filter/sort types
 *
 * NOTE: This file contains Node.js-specific code and should NOT be imported
 * in browser/app code. Use the main 'shared' import for browser-safe types.
 */

// Prisma Client (server-side only - contains Node.js runtime)
export * from './generated/prisma/client';
export * from './generated/prisma/commonInputTypes';
export * from './generated/prisma/enums';
export * from './generated/prisma/models';

// Explicitly re-export TransactionIsolationLevel (tree-shaken by bundler otherwise)
export { TransactionIsolationLevel } from './generated/prisma/internal/prismaNamespace';
