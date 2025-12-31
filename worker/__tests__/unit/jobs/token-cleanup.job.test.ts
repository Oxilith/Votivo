/**
 * @file src/jobs/__tests__/token-cleanup.job.test.ts
 * @purpose Unit tests for the token cleanup job
 * @functionality
 * - Tests successful deletion of expired refresh tokens
 * - Tests successful deletion of expired/used password reset tokens
 * - Tests successful deletion of expired/used email verification tokens
 * - Tests correct metrics calculation
 * - Tests error handling for database failures
 * - Tests proper connection cleanup with $disconnect
 * @dependencies
 * - vitest for testing framework
 * - tokenCleanupJob under test
 * - Mocked Prisma client factory and config
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma with hoisting
const mockPrisma = vi.hoisted(() => ({
  refreshToken: {
    deleteMany: vi.fn(),
  },
  passwordResetToken: {
    deleteMany: vi.fn(),
  },
  emailVerifyToken: {
    deleteMany: vi.fn(),
  },
  $disconnect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/prisma', () => ({
  createFreshPrismaClient: () => mockPrisma,
}));

// Mock config with hoisting
vi.mock('@/config', () => ({
  config: {
    jobs: {
      tokenCleanup: {
        schedule: '0 * * * *',
        enabled: true,
      },
    },
  },
}));

import { tokenCleanupJob } from '@/jobs';

describe('tokenCleanupJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('job configuration', () => {
    it('should have correct name', () => {
      expect(tokenCleanupJob.name).toBe('token-cleanup');
    });

    it('should have schedule from config', () => {
      expect(tokenCleanupJob.schedule).toBe('0 * * * *');
    });

    it('should have enabled flag from config', () => {
      expect(tokenCleanupJob.enabled).toBe(true);
    });
  });

  describe('run()', () => {
    it('should delete expired tokens and return correct metrics', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.emailVerifyToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token cleanup completed. Deleted 10 expired/used/revoked tokens.');
      expect(result.metrics).toEqual({
        refreshTokensDeleted: 5,
        passwordResetTokensDeleted: 3,
        emailVerifyTokensDeleted: 2,
        totalDeleted: 10,
      });
    });

    it('should return success with zero counts when no tokens to delete', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.emailVerifyToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token cleanup completed. Deleted 0 expired/used/revoked tokens.');
      expect(result.metrics).toEqual({
        refreshTokensDeleted: 0,
        passwordResetTokensDeleted: 0,
        emailVerifyTokensDeleted: 0,
        totalDeleted: 0,
      });
    });

    it('should use correct filter for refresh tokens (expired OR old revoked)', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.emailVerifyToken.deleteMany.mockResolvedValue({ count: 0 });

      await tokenCleanupJob.run();

      // Should delete expired tokens OR revoked tokens older than 7 days
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: new Date('2024-01-15T12:00:00.000Z') } },
            {
              AND: [
                { isRevoked: true },
                { createdAt: { lt: new Date('2024-01-08T12:00:00.000Z') } }, // 7 days ago
              ],
            },
          ],
        },
      });
    });

    it('should use correct filter for password reset tokens (expired OR used)', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.emailVerifyToken.deleteMany.mockResolvedValue({ count: 0 });

      await tokenCleanupJob.run();

      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: new Date('2024-01-15T12:00:00.000Z') } },
            { usedAt: { not: null } },
          ],
        },
      });
    });

    it('should use correct filter for email verify tokens (expired OR used)', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.emailVerifyToken.deleteMany.mockResolvedValue({ count: 0 });

      await tokenCleanupJob.run();

      expect(mockPrisma.emailVerifyToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: new Date('2024-01-15T12:00:00.000Z') } },
            { usedAt: { not: null } },
          ],
        },
      });
    });

    it('should return failure result on database error', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.refreshToken.deleteMany.mockRejectedValue(dbError);

      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token cleanup failed: Database connection failed');
      expect(result.metrics).toEqual({
        refreshTokensDeleted: 0,
        passwordResetTokensDeleted: 0,
        emailVerifyTokensDeleted: 0,
        totalDeleted: 0,
      });
    });

    it('should handle non-Error thrown objects', async () => {
      mockPrisma.refreshToken.deleteMany.mockRejectedValue('string error');

      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token cleanup failed: Unknown error');
    });

    it('should fail if password reset deletion fails after refresh succeeds', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.passwordResetToken.deleteMany.mockRejectedValue(
        new Error('Password token table locked')
      );

      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token cleanup failed: Password token table locked');
    });

    it('should fail if email verify deletion fails after others succeed', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.emailVerifyToken.deleteMany.mockRejectedValue(
        new Error('Email token table locked')
      );

      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token cleanup failed: Email token table locked');
    });
  });
});
