/**
 * @file utils/__tests__/token.test.ts
 * @purpose Unit tests for token generation utilities
 * @functionality
 * - Tests generateSecureToken produces cryptographically random tokens
 * - Tests generatePasswordResetToken produces correct length tokens
 * - Tests generateEmailVerificationToken produces correct length tokens
 * - Tests generateTokenId produces correct length identifiers
 * - Tests generateFamilyId produces correct length family identifiers
 * - Tests hashToken produces SHA-256 hashes
 * @dependencies
 * - vitest for testing framework
 * - token utilities under test
 */

import {
  generateSecureToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateTokenId,
  generateFamilyId,
  hashToken,
} from '@/utils/token';

describe('token', () => {
  describe('generateSecureToken', () => {
    it('should generate 64 character token by default (32 bytes)', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(64);
    });

    it('should generate token with custom length', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate valid hex string', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate 64 character token', () => {
      const token = generatePasswordResetToken();
      expect(token).toHaveLength(64);
    });

    it('should generate valid hex string', () => {
      const token = generatePasswordResetToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generatePasswordResetToken();
      const token2 = generatePasswordResetToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate 64 character token', () => {
      const token = generateEmailVerificationToken();
      expect(token).toHaveLength(64);
    });

    it('should generate valid hex string', () => {
      const token = generateEmailVerificationToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateEmailVerificationToken();
      const token2 = generateEmailVerificationToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateTokenId', () => {
    it('should generate 32 character token id', () => {
      const tokenId = generateTokenId();
      expect(tokenId).toHaveLength(32);
    });

    it('should generate valid hex string', () => {
      const tokenId = generateTokenId();
      expect(tokenId).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique token ids', () => {
      const tokenId1 = generateTokenId();
      const tokenId2 = generateTokenId();
      expect(tokenId1).not.toBe(tokenId2);
    });
  });

  describe('generateFamilyId', () => {
    it('should generate 32 character family id', () => {
      const familyId = generateFamilyId();
      expect(familyId).toHaveLength(32);
    });

    it('should generate valid hex string', () => {
      const familyId = generateFamilyId();
      expect(familyId).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique family ids', () => {
      const familyId1 = generateFamilyId();
      const familyId2 = generateFamilyId();
      expect(familyId1).not.toBe(familyId2);
    });
  });

  describe('hashToken', () => {
    it('should produce 64 character SHA-256 hash', () => {
      const token = generateSecureToken();
      const hash = hashToken(token);
      expect(hash).toHaveLength(64);
    });

    it('should produce valid hex string', () => {
      const token = generateSecureToken();
      const hash = hashToken(token);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce same hash for same input', () => {
      const token = 'test-token-12345';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = hashToken('token-1');
      const hash2 = hashToken('token-2');
      expect(hash1).not.toBe(hash2);
    });

    it('should not equal the original token', () => {
      const token = generateSecureToken();
      const hash = hashToken(token);
      expect(hash).not.toBe(token);
    });
  });
});
