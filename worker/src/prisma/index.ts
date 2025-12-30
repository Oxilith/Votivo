/**
 * @file src/prisma/index.ts
 * @purpose Centralized export for Prisma client
 * @functionality
 * - Exports Prisma client singleton
 * - Exports factory function for fresh connections
 * @dependencies
 * - client.ts
 */

export { prisma, createFreshPrismaClient } from './client';
