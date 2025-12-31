/**
 * @file worker/__tests__/integration/job-execution.flow.test.ts
 * @purpose Integration tests for worker job execution
 * @functionality
 * - Tests token cleanup job execution
 * - Tests expired token deletion
 * - Tests job result metrics
 * @dependencies
 * - vitest for testing framework
 * - @/jobs for job implementations
 * - @/prisma for database access
 * @note These tests require a running database with migrations applied.
 *       They will be skipped if the database is not available.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { tokenCleanupJob } from '@/jobs';
import { createFreshPrismaClient } from '@/prisma';
import {
  setTestPrisma,
  cleanupTestDb,
  type PrismaLikeClient,
} from 'shared/testing';

describe('Job Execution Integration Tests', () => {
  const prisma = createFreshPrismaClient();
  let databaseAvailable = false;

  beforeAll(async () => {
    // Check if database is available and has migrations applied
    try {
      await prisma.$queryRaw`SELECT 1`;
      // Check if User table exists (migrations applied)
      await prisma.user.findFirst();
      databaseAvailable = true;
      setTestPrisma(prisma as PrismaLikeClient);
    } catch {
      console.warn(
        'Database not available or migrations not applied. ' +
        'Skipping worker integration tests. ' +
        'Run `npm run db:migrate` in prompt-service to enable these tests.'
      );
      databaseAvailable = false;
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

  describe('Token Cleanup Job', () => {
    it('should run successfully with no tokens to clean', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalDeleted).toBe(0);
    });

    it('should delete expired refresh tokens', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      // Create a test user first
      const user = await prisma.user.create({
        data: {
          email: 'cleanup-test@example.com',
          password: '$2b$10$hashedpassword123456789012345678901234567890',
          name: 'Cleanup Test',
          birthYear: 1990,
          gender: 'prefer_not_to_say',
        },
      });

      // Create an expired refresh token
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      await prisma.refreshToken.create({
        data: {
          token: 'expired-refresh-token',
          userId: user.id,
          expiresAt: expiredDate,
          familyId: 'test-family-1',
          deviceInfo: 'test-agent',
          ipAddress: '127.0.0.1',
        },
      });

      // Create a valid (non-expired) refresh token
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      await prisma.refreshToken.create({
        data: {
          token: 'valid-refresh-token',
          userId: user.id,
          expiresAt: futureDate,
          familyId: 'test-family-2',
          deviceInfo: 'test-agent',
          ipAddress: '127.0.0.1',
        },
      });

      // Run cleanup
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics?.refreshTokensDeleted).toBe(1);

      // Verify expired token is deleted but valid token remains
      const remainingTokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(remainingTokens.length).toBe(1);
      expect(remainingTokens[0].token).toBe('valid-refresh-token');
    });

    it('should delete expired password reset tokens', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'password-reset@example.com',
          password: '$2b$10$hashedpassword123456789012345678901234567890',
          name: 'Password Reset Test',
          birthYear: 1990,
          gender: 'prefer_not_to_say',
        },
      });

      // Create an expired password reset token
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: {
          token: 'expired-password-token',
          userId: user.id,
          expiresAt: expiredDate,
        },
      });

      // Run cleanup
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics?.passwordResetTokensDeleted).toBe(1);

      // Verify token is deleted
      const remainingTokens = await prisma.passwordResetToken.findMany({
        where: { userId: user.id },
      });
      expect(remainingTokens.length).toBe(0);
    });

    it('should delete used password reset tokens', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'used-token@example.com',
          password: '$2b$10$hashedpassword123456789012345678901234567890',
          name: 'Used Token Test',
          birthYear: 1990,
          gender: 'prefer_not_to_say',
        },
      });

      // Create a used password reset token (not expired but used)
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: {
          token: 'used-password-token',
          userId: user.id,
          expiresAt: futureDate,
          usedAt: new Date(), // Mark as used
        },
      });

      // Run cleanup
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics?.passwordResetTokensDeleted).toBe(1);
    });

    it('should delete expired email verification tokens', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'email-verify@example.com',
          password: '$2b$10$hashedpassword123456789012345678901234567890',
          name: 'Email Verify Test',
          birthYear: 1990,
          gender: 'prefer_not_to_say',
        },
      });

      // Create an expired email verification token
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.emailVerifyToken.create({
        data: {
          token: 'expired-email-token',
          userId: user.id,
          expiresAt: expiredDate,
        },
      });

      // Run cleanup
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics?.emailVerifyTokensDeleted).toBe(1);
    });

    it('should clean up old revoked refresh tokens', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'revoked-test@example.com',
          password: '$2b$10$hashedpassword123456789012345678901234567890',
          name: 'Revoked Token Test',
          birthYear: 1990,
          gender: 'prefer_not_to_say',
        },
      });

      // Create an old revoked refresh token (older than 7 days)
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.create({
        data: {
          token: 'old-revoked-token',
          userId: user.id,
          expiresAt: futureExpiry, // Not expired
          isRevoked: true, // But revoked
          createdAt: eightDaysAgo, // And old
          familyId: 'test-family-old',
          deviceInfo: 'test-agent',
          ipAddress: '127.0.0.1',
        },
      });

      // Create a recently revoked token (should NOT be deleted)
      await prisma.refreshToken.create({
        data: {
          token: 'recent-revoked-token',
          userId: user.id,
          expiresAt: futureExpiry,
          isRevoked: true,
          // createdAt defaults to now
          familyId: 'test-family-recent',
          deviceInfo: 'test-agent',
          ipAddress: '127.0.0.1',
        },
      });

      // Run cleanup
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics?.refreshTokensDeleted).toBe(1);

      // Verify recent revoked token is still there
      const remainingTokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(remainingTokens.length).toBe(1);
      expect(remainingTokens[0].token).toBe('recent-revoked-token');
    });

    it('should report accurate metrics for mixed cleanup', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test: database not available');
        return;
      }
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'metrics-test@example.com',
          password: '$2b$10$hashedpassword123456789012345678901234567890',
          name: 'Metrics Test',
          birthYear: 1990,
          gender: 'prefer_not_to_say',
        },
      });

      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Create 2 expired refresh tokens
      await prisma.refreshToken.createMany({
        data: [
          {
            token: 'expired-refresh-1',
            userId: user.id,
            expiresAt: expiredDate,
            familyId: 'test-family-m1',
            deviceInfo: 'test',
            ipAddress: '127.0.0.1',
          },
          {
            token: 'expired-refresh-2',
            userId: user.id,
            expiresAt: expiredDate,
            familyId: 'test-family-m2',
            deviceInfo: 'test',
            ipAddress: '127.0.0.1',
          },
        ],
      });

      // Create 1 expired password token
      await prisma.passwordResetToken.create({
        data: {
          token: 'expired-password',
          userId: user.id,
          expiresAt: expiredDate,
        },
      });

      // Create 3 expired email tokens
      await prisma.emailVerifyToken.createMany({
        data: [
          { token: 'expired-email-1', userId: user.id, expiresAt: expiredDate },
          { token: 'expired-email-2', userId: user.id, expiresAt: expiredDate },
          { token: 'expired-email-3', userId: user.id, expiresAt: expiredDate },
        ],
      });

      // Run cleanup
      const result = await tokenCleanupJob.run();

      expect(result.success).toBe(true);
      expect(result.metrics?.refreshTokensDeleted).toBe(2);
      expect(result.metrics?.passwordResetTokensDeleted).toBe(1);
      expect(result.metrics?.emailVerifyTokensDeleted).toBe(3);
      expect(result.metrics?.totalDeleted).toBe(6);
    });
  });
});
