/**
 * @file worker/__tests__/unit/config/config.test.ts
 * @purpose Unit tests for configuration loading and validation
 * @functionality
 * - Tests default development configuration values
 * - Tests production validation requirements
 * - Tests Zod schema validation for invalid values
 * - Tests environment variable transformation (string to boolean)
 * - Tests warning for missing DATABASE_KEY in development
 * @dependencies
 * - vitest for testing framework
 * - Config module under test (dynamically imported)
 */



// Create hoisted mock for bootstrap logger
const mockBootstrapLogger = vi.hoisted(() => ({
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/utils/bootstrap-logger', () => ({
  bootstrapLogger: mockBootstrapLogger,
}));

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Reset environment to a clean state
    process.env = { ...originalEnv };
    // Clear any existing env vars that might affect tests
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_KEY;
    delete process.env.LOG_LEVEL;
    delete process.env.JOB_TOKEN_CLEANUP_ENABLED;
    delete process.env.JOB_TOKEN_CLEANUP_SCHEDULE;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('development defaults', () => {
    it('should use default database URL in development', async () => {
      process.env.NODE_ENV = 'development';

      const { config } = await import('@/config');

      // Worker shares database with prompt-service
      expect(config.databaseUrl).toBe('file:../prompt-service/prisma/dev.db');
    });

    it('should use default job schedule in development', async () => {
      process.env.NODE_ENV = 'development';

      const { config } = await import('@/config');

      expect(config.jobs.tokenCleanup.schedule).toBe('0 * * * *');
    });

    it('should enable job by default', async () => {
      process.env.NODE_ENV = 'development';

      const { config } = await import('@/config');

      expect(config.jobs.tokenCleanup.enabled).toBe(true);
    });

    it('should use default log level', async () => {
      process.env.NODE_ENV = 'development';

      const { config } = await import('@/config');

      expect(config.logLevel).toBe('info');
    });
  });

  describe('production validation', () => {
    it('should throw error if DATABASE_URL is missing in production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(import('@/config')).rejects.toThrow(
        'DATABASE_URL is required in production'
      );
    });

    it('should not throw if DATABASE_URL is provided in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'libsql://prod.db';
      process.env.DATABASE_KEY = 'a'.repeat(32);

      const { config } = await import('@/config');

      expect(config.databaseUrl).toBe('libsql://prod.db');
    });
  });

  describe('job enabled transformation', () => {
    it('should transform "true" string to boolean true', async () => {
      process.env.NODE_ENV = 'development';
      process.env.JOB_TOKEN_CLEANUP_ENABLED = 'true';

      const { config } = await import('@/config');

      expect(config.jobs.tokenCleanup.enabled).toBe(true);
    });

    it('should transform "false" string to boolean false', async () => {
      process.env.NODE_ENV = 'development';
      process.env.JOB_TOKEN_CLEANUP_ENABLED = 'false';

      const { config } = await import('@/config');

      expect(config.jobs.tokenCleanup.enabled).toBe(false);
    });

    it('should treat any non-"false" value as true', async () => {
      process.env.NODE_ENV = 'development';
      process.env.JOB_TOKEN_CLEANUP_ENABLED = '1';

      const { config } = await import('@/config');

      expect(config.jobs.tokenCleanup.enabled).toBe(true);
    });
  });

  describe('custom schedule', () => {
    it('should use custom schedule when provided', async () => {
      process.env.NODE_ENV = 'development';
      process.env.JOB_TOKEN_CLEANUP_SCHEDULE = '*/30 * * * *';

      const { config } = await import('@/config');

      expect(config.jobs.tokenCleanup.schedule).toBe('*/30 * * * *');
    });
  });

  describe('log level validation', () => {
    it('should accept valid log levels', async () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'debug';

      const { config } = await import('@/config');

      expect(config.logLevel).toBe('debug');
    });

    it('should throw error for invalid log level', async () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'invalid-level';

      await expect(import('@/config')).rejects.toThrow(
        'Configuration validation failed'
      );
    });
  });

  describe('DATABASE_KEY validation', () => {
    it('should warn in development if DATABASE_KEY is not set', async () => {
      process.env.NODE_ENV = 'development';

      await import('@/config');

      expect(mockBootstrapLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DATABASE_KEY not set')
      );
    });

    it('should not warn if DATABASE_KEY is set', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_KEY = 'a'.repeat(32);
      mockBootstrapLogger.warn.mockClear();

      await import('@/config');

      expect(mockBootstrapLogger.warn).not.toHaveBeenCalled();
    });

    it('should throw error if DATABASE_KEY is too short', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_KEY = 'tooshort';

      await expect(import('@/config')).rejects.toThrow(
        'Configuration validation failed'
      );
    });
  });

  describe('nodeEnv validation', () => {
    it('should accept development environment', async () => {
      process.env.NODE_ENV = 'development';

      const { config } = await import('@/config');

      expect(config.nodeEnv).toBe('development');
    });

    it('should accept test environment', async () => {
      process.env.NODE_ENV = 'test';

      const { config } = await import('@/config');

      expect(config.nodeEnv).toBe('test');
    });

    it('should accept production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'libsql://prod.db';
      process.env.DATABASE_KEY = 'a'.repeat(32);

      const { config } = await import('@/config');

      expect(config.nodeEnv).toBe('production');
    });

    it('should default to development when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;

      const { config } = await import('@/config');

      expect(config.nodeEnv).toBe('development');
    });
  });
});
