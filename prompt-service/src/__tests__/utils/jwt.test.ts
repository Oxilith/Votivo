/**
 * @file prompt-service/src/__tests__/utils/jwt.test.ts
 * @purpose Unit tests for JWT token generation and verification utilities
 * @description Tests that JWT utilities correctly:
 * - Generate access tokens with proper payload and expiry
 * - Generate refresh tokens with proper payload and expiry
 * - Verify valid tokens and return payload
 * - Reject invalid tokens with appropriate error type
 * - Reject expired tokens with 'expired' error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtConfig,
} from '@/utils/jwt.js';

describe('JWT Utilities', () => {
  const testConfig: JwtConfig = {
    accessSecret: 'test-access-secret-1234567890abcdef',
    refreshSecret: 'test-refresh-secret-0987654321fedcba',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-123';
      const token = generateAccessToken(userId, testConfig);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include userId and type in payload', () => {
      const userId = 'test-user-456';
      const token = generateAccessToken(userId, testConfig);
      const decoded = jwt.verify(token, testConfig.accessSecret) as { userId: string; type: string };

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('access');
    });

    it('should include expiration time in token', () => {
      const userId = 'test-user-789';
      const token = generateAccessToken(userId, testConfig);
      const decoded = jwt.decode(token) as { exp: number; iat: number };

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-123';
      const tokenId = 'token-id-abc';
      const token = generateRefreshToken(userId, tokenId, testConfig);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId, tokenId, and type in payload', () => {
      const userId = 'test-user-456';
      const tokenId = 'token-id-def';
      const token = generateRefreshToken(userId, tokenId, testConfig);
      const decoded = jwt.verify(token, testConfig.refreshSecret) as {
        userId: string;
        tokenId: string;
        type: string;
      };

      expect(decoded.userId).toBe(userId);
      expect(decoded.tokenId).toBe(tokenId);
      expect(decoded.type).toBe('refresh');
    });

    it('should use refresh secret, not access secret', () => {
      const userId = 'test-user-789';
      const tokenId = 'token-id-ghi';
      const token = generateRefreshToken(userId, tokenId, testConfig);

      // Should verify with refresh secret
      expect(() => jwt.verify(token, testConfig.refreshSecret)).not.toThrow();

      // Should NOT verify with access secret
      expect(() => jwt.verify(token, testConfig.accessSecret)).toThrow();
    });
  });

  describe('verifyAccessToken', () => {
    it('should return success with payload for valid token', () => {
      const userId = 'test-user-123';
      const token = generateAccessToken(userId, testConfig);
      const result = verifyAccessToken(token, testConfig);

      expect(result.success).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(userId);
      expect(result.payload?.type).toBe('access');
      expect(result.error).toBeNull();
    });

    it('should return error for malformed token', () => {
      const result = verifyAccessToken('not-a-valid-token', testConfig);

      expect(result.success).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe('invalid');
    });

    it('should return error for token with wrong signature', () => {
      const wrongConfig = { ...testConfig, accessSecret: 'wrong-secret' };
      const token = generateAccessToken('user', wrongConfig);
      const result = verifyAccessToken(token, testConfig);

      expect(result.success).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe('invalid');
    });

    it('should return error for expired token', () => {
      // Create a token that expires immediately
      const shortExpiryConfig = { ...testConfig, accessExpiresIn: '0s' };
      const token = generateAccessToken('user', shortExpiryConfig);

      // Wait a tiny bit to ensure expiration
      const result = verifyAccessToken(token, testConfig);

      expect(result.success).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe('expired');
    });

    it('should reject refresh token used as access token', () => {
      const token = generateRefreshToken('user', 'token-id', testConfig);
      // Even if we try to verify with access secret (which will fail),
      // or if someone tries to craft a token with wrong type
      const result = verifyAccessToken(token, testConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return success with payload for valid token', () => {
      const userId = 'test-user-123';
      const tokenId = 'token-id-abc';
      const token = generateRefreshToken(userId, tokenId, testConfig);
      const result = verifyRefreshToken(token, testConfig);

      expect(result.success).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(userId);
      expect(result.payload?.tokenId).toBe(tokenId);
      expect(result.payload?.type).toBe('refresh');
      expect(result.error).toBeNull();
    });

    it('should return error for malformed token', () => {
      const result = verifyRefreshToken('not-a-valid-token', testConfig);

      expect(result.success).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe('invalid');
    });

    it('should return error for token with wrong signature', () => {
      const wrongConfig = { ...testConfig, refreshSecret: 'wrong-secret' };
      const token = generateRefreshToken('user', 'token-id', wrongConfig);
      const result = verifyRefreshToken(token, testConfig);

      expect(result.success).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe('invalid');
    });

    it('should reject access token used as refresh token', () => {
      const token = generateAccessToken('user', testConfig);
      const result = verifyRefreshToken(token, testConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid');
    });
  });

  describe('Token Type Separation', () => {
    it('should use different secrets for access and refresh tokens', () => {
      expect(testConfig.accessSecret).not.toBe(testConfig.refreshSecret);
    });

    it('should not allow access token verification with refresh secret', () => {
      const token = generateAccessToken('user', testConfig);

      // Create a config that swaps secrets (simulating wrong usage)
      const swappedConfig = {
        ...testConfig,
        accessSecret: testConfig.refreshSecret,
        refreshSecret: testConfig.accessSecret,
      };

      const result = verifyAccessToken(token, swappedConfig);
      expect(result.success).toBe(false);
    });

    it('should not allow refresh token verification with access secret', () => {
      const token = generateRefreshToken('user', 'token-id', testConfig);

      // Create a config that swaps secrets
      const swappedConfig = {
        ...testConfig,
        accessSecret: testConfig.refreshSecret,
        refreshSecret: testConfig.accessSecret,
      };

      const result = verifyRefreshToken(token, swappedConfig);
      expect(result.success).toBe(false);
    });
  });
});
