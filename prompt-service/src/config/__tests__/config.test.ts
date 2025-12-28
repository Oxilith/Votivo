/**
 * @file prompt-service/src/config/__tests__/config.test.ts
 * @purpose Unit tests for config validation, specifically cookie signing secret requirements
 * @functionality
 * - Tests that development mode requires SESSION_SECRET or ADMIN_API_KEY
 * - Tests error message is descriptive when no secret is configured
 * - Tests successful config loading when SESSION_SECRET is set
 * - Tests successful config loading when ADMIN_API_KEY is set as fallback
 * @dependencies
 * - vitest for testing framework
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config validation', () => {
  // Store original environment variables
  const originalEnv: Record<string, string | undefined> = {};
  const envVarsToPreserve = [
    'NODE_ENV',
    'SESSION_SECRET',
    'ADMIN_API_KEY',
    'DATABASE_URL',
    'DATABASE_KEY',
    'DEV_AUTH_BYPASS',
    'PORT',
    'CORS_ORIGINS',
    'LOG_LEVEL',
  ];

  beforeEach(() => {
    // Save original values
    for (const key of envVarsToPreserve) {
      originalEnv[key] = process.env[key];
    }
    // Reset module registry to allow fresh config imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original values
    for (const key of envVarsToPreserve) {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    }
    vi.resetModules();
  });

  describe('development mode cookie secret validation', () => {
    beforeEach(() => {
      // Set to development mode
      process.env['NODE_ENV'] = 'development';
      // Clear both secrets
      delete process.env['SESSION_SECRET'];
      delete process.env['ADMIN_API_KEY'];
      // Clear DATABASE_KEY to avoid unrelated validation
      delete process.env['DATABASE_KEY'];
    });

    it('should throw an error when neither SESSION_SECRET nor ADMIN_API_KEY is set', async () => {
      // Arrange: Both secrets are cleared in beforeEach

      // Act & Assert
      await expect(async () => {
        await import('../index.js');
      }).rejects.toThrow('Cookie signing secret is required');
    });

    it('should include helpful instructions in the error message', async () => {
      // Arrange: Both secrets are cleared in beforeEach

      // Act & Assert
      await expect(async () => {
        await import('../index.js');
      }).rejects.toThrow(/SESSION_SECRET.*ADMIN_API_KEY/s);
    });

    it('should include an example in the error message', async () => {
      // Arrange: Both secrets are cleared in beforeEach

      // Act & Assert
      await expect(async () => {
        await import('../index.js');
      }).rejects.toThrow('Example:');
    });

    it('should not throw an error when SESSION_SECRET is set', async () => {
      // Arrange
      process.env['SESSION_SECRET'] = 'test-session-secret-at-least-32-characters-long';

      // Act
      const { config } = await import('../index.js');

      // Assert
      expect(config).toBeDefined();
      expect(config.sessionSecret).toBe('test-session-secret-at-least-32-characters-long');
    });

    it('should not throw an error when ADMIN_API_KEY is set as fallback', async () => {
      // Arrange
      process.env['ADMIN_API_KEY'] = 'test-admin-api-key-at-least-32-characters-long';

      // Act
      const { config } = await import('../index.js');

      // Assert
      expect(config).toBeDefined();
      // sessionSecret should fall back to ADMIN_API_KEY
      expect(config.sessionSecret).toBe('test-admin-api-key-at-least-32-characters-long');
    });

    it('should prefer SESSION_SECRET over ADMIN_API_KEY when both are set', async () => {
      // Arrange
      process.env['SESSION_SECRET'] = 'primary-session-secret-at-least-32-characters';
      process.env['ADMIN_API_KEY'] = 'fallback-admin-key-at-least-32-characters-long';

      // Act
      const { config } = await import('../index.js');

      // Assert
      expect(config.sessionSecret).toBe('primary-session-secret-at-least-32-characters');
    });
  });

  describe('production mode cookie secret validation', () => {
    beforeEach(() => {
      // Set to production mode
      process.env['NODE_ENV'] = 'production';
      // Production requires DATABASE_URL
      process.env['DATABASE_URL'] = 'file:./test.db';
      // Clear secrets
      delete process.env['SESSION_SECRET'];
      delete process.env['ADMIN_API_KEY'];
    });

    it('should throw an error when SESSION_SECRET is not set in production', async () => {
      // Arrange
      process.env['ADMIN_API_KEY'] = 'test-admin-key-at-least-32-characters-long';

      // Act & Assert
      await expect(async () => {
        await import('../index.js');
      }).rejects.toThrow('SESSION_SECRET is required in production');
    });

    it('should explain why ADMIN_API_KEY fallback is not allowed in production', async () => {
      // Arrange
      process.env['ADMIN_API_KEY'] = 'test-admin-key-at-least-32-characters-long';

      // Act & Assert
      await expect(async () => {
        await import('../index.js');
      }).rejects.toThrow(/security risk/i);
    });

    it('should not throw an error when SESSION_SECRET is set in production', async () => {
      // Arrange
      process.env['SESSION_SECRET'] = 'production-secret-at-least-32-characters-long';

      // Act
      const { config } = await import('../index.js');

      // Assert
      expect(config).toBeDefined();
      expect(config.sessionSecret).toBe('production-secret-at-least-32-characters-long');
    });
  });
});
