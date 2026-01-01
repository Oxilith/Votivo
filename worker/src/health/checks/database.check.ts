/**
 * @file worker/src/health/checks/database.check.ts
 * @purpose Health check for database connectivity
 * @functionality
 * - Verifies database connection is active
 * - Executes simple query to confirm database responsiveness
 * - Returns healthy/unhealthy status based on query result
 * - Critical check (worker cannot function without database)
 * @dependencies
 * - @/prisma for database client
 * - @/health for HealthCheck, ComponentHealth types
 */

import { prisma } from '@/prisma';
import type { HealthCheck, ComponentHealth } from '@/health';

async function checkDatabaseHealth(): Promise<ComponentHealth> {
  try {
    // Simple query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'healthy',
      message: 'Database connection is active',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

export function createDatabaseCheck(): HealthCheck {
  return {
    name: 'database',
    check: checkDatabaseHealth,
    critical: true, // Worker cannot function without database
  };
}
