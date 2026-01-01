/**
 * @file prompt-service/__tests__/unit/config/config.test.ts
 * @purpose Unit tests for config validation, specifically cookie signing secret requirements
 * @functionality
 * - Tests that development mode requires SESSION_SECRET or ADMIN_API_KEY
 * - Tests error message is descriptive when no secret is configured
 * - Tests successful config loading when SESSION_SECRET is set
 * - Tests successful config loading when ADMIN_API_KEY is set as fallback
 * - Tests warning log when using ADMIN_API_KEY as SESSION_SECRET fallback
 * - Tests minimum length validation for SESSION_SECRET (32 characters)
 * - Tests production mode requires explicit SESSION_SECRET
 * @dependencies
 * - vitest for testing framework
 */

// Create hoisted mock for bootstrap logger
const mockBootstrapLogger = vi.hoisted(() => ({
  warn: vi.fn(),
  error: vi.fn(),
}));

// Mock dotenv to prevent loading .env file values during tests
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

vi.mock('@/utils/bootstrap-logger', () => ({
  bootstrapLogger: mockBootstrapLogger,
}));

describe('config validation', () => {
  // Store original environment variables
  const originalEnv: Record<string, string | undefined> = {};
  const envVarsToPreserve = [
    'NODE_ENV',
    'SESSION_SECRET',
    'ADMIN_API_KEY',
    'DATABASE_URL',
    'DATABASE_KEY',
    'PORT',
    'CORS_ORIGINS',
    'LOG_LEVEL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
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
        Reflect.deleteProperty(process.env, key);
      }
    }
    vi.resetModules();
  });

  describe('development mode cookie secret validation', () => {
    beforeEach(() => {
      // Set to development mode
      process.env.NODE_ENV = 'development';
      // Clear both secrets
      Reflect.deleteProperty(process.env, 'SESSION_SECRET');
      Reflect.deleteProperty(process.env, 'ADMIN_API_KEY');
      // Clear DATABASE_KEY to avoid unrelated validation
      Reflect.deleteProperty(process.env, 'DATABASE_KEY');
      // Clear JWT secrets to avoid unrelated validation
      Reflect.deleteProperty(process.env, 'JWT_ACCESS_SECRET');
      Reflect.deleteProperty(process.env, 'JWT_REFRESH_SECRET');
    });

    it('should throw an error when neither SESSION_SECRET nor ADMIN_API_KEY is set', async () => {
      // Arrange: Provide JWT secrets to test cookie validation
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';

      // Act & Assert
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow('Cookie signing secret is required');
    });

    it('should include helpful instructions in the error message', async () => {
      // Arrange: Provide JWT secrets to test cookie validation
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';

      // Act & Assert
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow(/SESSION_SECRET.*ADMIN_API_KEY/s);
    });

    it('should include an example in the error message', async () => {
      // Arrange: Provide JWT secrets to test cookie validation
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';

      // Act & Assert
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow('Example:');
    });

    it('should throw an error when JWT secrets are missing', async () => {
      // Arrange: JWT secrets are cleared in beforeEach
      // Provide cookie secret so we're specifically testing JWT validation
      process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters-long';

      // Act & Assert - Zod 4 reports "Invalid input: expected string, received undefined" for missing fields
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow(/jwtAccessSecret:.*expected string/i);
    });

    it('should not throw an error when SESSION_SECRET is set', async () => {
      // Arrange
      process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';
      process.env.DATABASE_KEY = 'test-database-key-at-least-32-characters';

      // Act
      const { config } = await import('@/config');

      // Assert
      expect(config).toBeDefined();
      expect(config.sessionSecret).toBe('test-session-secret-at-least-32-characters-long');
    });

    it('should not throw an error when ADMIN_API_KEY is set as fallback', async () => {
      // Arrange
      process.env.ADMIN_API_KEY = 'test-admin-api-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';
      process.env.DATABASE_KEY = 'test-database-key-at-least-32-characters';

      // Act
      const { config } = await import('@/config');

      // Assert
      expect(config).toBeDefined();
      // sessionSecret should fall back to ADMIN_API_KEY
      expect(config.sessionSecret).toBe('test-admin-api-key-at-least-32-characters-long');
    });

    it('should prefer SESSION_SECRET over ADMIN_API_KEY when both are set', async () => {
      // Arrange
      process.env.SESSION_SECRET = 'primary-session-secret-at-least-32-characters';
      process.env.ADMIN_API_KEY = 'fallback-admin-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';
      process.env.DATABASE_KEY = 'test-database-key-at-least-32-characters';

      // Act
      const { config } = await import('@/config');

      // Assert
      expect(config.sessionSecret).toBe('primary-session-secret-at-least-32-characters');
    });

    it('should log a warning when using ADMIN_API_KEY as SESSION_SECRET fallback', async () => {
      // Arrange
      process.env.ADMIN_API_KEY = 'test-admin-api-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';
      process.env.DATABASE_KEY = 'test-database-key-at-least-32-characters';

      // Act
      await import('@/config');

      // Assert
      expect(mockBootstrapLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('SESSION_SECRET not set, falling back to ADMIN_API_KEY')
      );
    });

    it('should reject SESSION_SECRET shorter than 32 characters', async () => {
      // Arrange
      process.env.SESSION_SECRET = 'short-secret'; // Only 12 characters
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';

      // Act & Assert - Zod 4 uses "Too small" for min length violations
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow(/sessionSecret:.*>=32 characters/i);
    });
  });

  describe('production mode cookie secret validation', () => {
    beforeEach(() => {
      // Set to production mode
      process.env.NODE_ENV = 'production';
      // Production requires DATABASE_URL
      process.env.DATABASE_URL = 'file:./test.db';
      // Clear secrets
      Reflect.deleteProperty(process.env, 'SESSION_SECRET');
      Reflect.deleteProperty(process.env, 'ADMIN_API_KEY');
      // Clear JWT secrets
      Reflect.deleteProperty(process.env, 'JWT_ACCESS_SECRET');
      Reflect.deleteProperty(process.env, 'JWT_REFRESH_SECRET');
    });

    it('should throw an error when SESSION_SECRET is not set in production', async () => {
      // Arrange
      process.env.ADMIN_API_KEY = 'test-admin-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';

      // Act & Assert
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow('SESSION_SECRET is required in production');
    });

    it('should explain why ADMIN_API_KEY fallback is not allowed in production', async () => {
      // Arrange
      process.env.ADMIN_API_KEY = 'test-admin-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-at-least-32-chars';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';

      // Act & Assert
      await expect(async () => {
        await import('@/config');
      }).rejects.toThrow(/security risk/i);
    });

    it('should not throw an error when SESSION_SECRET is set in production', async () => {
      // Arrange
      process.env.SESSION_SECRET = 'production-secret-at-least-32-characters-long';
      process.env.JWT_ACCESS_SECRET = 'jwt-access-secret-at-least-32-chars-here';
      process.env.JWT_REFRESH_SECRET = 'jwt-refresh-secret-at-least-32-chars-here';
      process.env.DATABASE_KEY = 'production-database-key-at-least-32-chars';

      // Act
      const { config } = await import('@/config');

      // Assert
      expect(config).toBeDefined();
      expect(config.sessionSecret).toBe('production-secret-at-least-32-characters-long');
    });
  });
});
