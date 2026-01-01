/**
 * @file prompt-service/__tests__/unit/utils/password.test.ts
 * @purpose Unit tests for password hashing utilities
 * @functionality
 * - Tests createPasswordConfig with default and custom salt rounds
 * - Tests hashPassword produces valid bcrypt hashes
 * - Tests comparePassword correctly validates passwords
 * @dependencies
 * - vitest for testing framework
 * - password utilities under test
 */

import { createPasswordConfig, hashPassword, comparePassword } from '@/utils/password';

describe('password', () => {
  describe('createPasswordConfig', () => {
    const originalEnv = process.env.BCRYPT_SALT_ROUNDS;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.BCRYPT_SALT_ROUNDS;
      } else {
        process.env.BCRYPT_SALT_ROUNDS = originalEnv;
      }
    });

    it('should return default salt rounds when env not set', () => {
      delete process.env.BCRYPT_SALT_ROUNDS;
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(10);
    });

    it('should use salt rounds from environment variable', () => {
      process.env.BCRYPT_SALT_ROUNDS = '12';
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(12);
    });

    it('should return default for invalid salt rounds', () => {
      process.env.BCRYPT_SALT_ROUNDS = 'invalid';
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(10);
    });

    it('should return default for salt rounds below minimum (4)', () => {
      process.env.BCRYPT_SALT_ROUNDS = '3';
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(10);
    });

    it('should return default for salt rounds above maximum (31)', () => {
      process.env.BCRYPT_SALT_ROUNDS = '32';
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(10);
    });

    it('should accept salt rounds at minimum (4)', () => {
      process.env.BCRYPT_SALT_ROUNDS = '4';
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(4);
    });

    it('should accept salt rounds at maximum (31)', () => {
      process.env.BCRYPT_SALT_ROUNDS = '31';
      const config = createPasswordConfig();
      expect(config.saltRounds).toBe(31);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ab]\$\d+\$.{53}$/); // bcrypt hash format
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should use custom salt rounds from config', async () => {
      const password = 'SecurePassword123!';
      const config = { saltRounds: 4 }; // Minimum for faster test
      const hash = await hashPassword(password, config);

      expect(hash).toMatch(/^\$2[ab]\$04\$/); // Should show 04 for 4 rounds
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password, { saltRounds: 4 });

      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'SecurePassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password, { saltRounds: 4 });

      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password, { saltRounds: 4 });

      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });
  });
});
