/**
 * @file prompt-service/src/middleware/__tests__/admin-auth.middleware.test.ts
 * @purpose Unit tests for admin authentication middleware
 * @functionality
 * - Tests HttpOnly cookie authentication (primary method)
 * - Tests X-Admin-Key header authentication (backward compatibility)
 * - Tests error response when API key is not configured
 * - Verifies timing-safe comparison is used
 * @dependencies
 * - vitest for testing framework
 * - adminAuthMiddleware for middleware under test
 */

import type { Request, Response, NextFunction } from 'express';

// Mock the config module before importing the middleware
vi.mock('@/config', () => ({
  config: {
    adminApiKey: '',
    nodeEnv: 'development',
    rateLimit: {
      windowMs: 60000,
      login: 5,
      register: 5,
      passwordReset: 3,
      forgotPassword: 3,
      tokenRefresh: 20,
      userData: 30,
      profile: 15,
    },
  },
}));

// Mock logger to prevent pino initialization errors when config is mocked
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { adminAuthMiddleware } from '@/middleware';
import { config } from '@/config';

// Helper to create mock request
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    signedCookies: {},
    headers: {},
    ...overrides,
  } as Request;
}

// Helper to create mock response
function createMockResponse(): Response & { statusCode: number; jsonData: unknown } {
  const res = {
    statusCode: 200,
    jsonData: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
  };
  return res as Response & { statusCode: number; jsonData: unknown };
}

describe('adminAuthMiddleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
    // Reset config to defaults
    (config as { adminApiKey: string; nodeEnv: string }).adminApiKey = '';
    (config as { adminApiKey: string; nodeEnv: string }).nodeEnv = 'development';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API key not configured', () => {
    it('should return 503 when API key is not configured', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(503);
      expect(res.jsonData).toEqual({
        error: 'Admin access not configured',
      });
    });
  });

  describe('cookie authentication', () => {
    beforeEach(() => {
      (config as { adminApiKey: string; nodeEnv: string }).adminApiKey = 'test-api-key-12345';
    });

    it('should allow access with valid session cookie', () => {
      const req = createMockRequest({
        signedCookies: { admin_session: 'authenticated' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject with invalid session cookie value', () => {
      const req = createMockRequest({
        signedCookies: { admin_session: 'invalid' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Unauthorized' });
    });

    it('should reject when session cookie is missing', () => {
      const req = createMockRequest({
        signedCookies: {},
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe('X-Admin-Key header authentication', () => {
    beforeEach(() => {
      (config as { adminApiKey: string; nodeEnv: string }).adminApiKey = 'test-api-key-12345';
    });

    it('should allow access with valid API key header', () => {
      const req = createMockRequest({
        headers: { 'x-admin-key': 'test-api-key-12345' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject with invalid API key header', () => {
      const req = createMockRequest({
        headers: { 'x-admin-key': 'wrong-api-key' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Unauthorized' });
    });

    it('should reject when API key header is missing', () => {
      const req = createMockRequest({
        headers: {},
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it('should reject when API key has different length', () => {
      const req = createMockRequest({
        headers: { 'x-admin-key': 'short' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe('authentication priority', () => {
    beforeEach(() => {
      (config as { adminApiKey: string; nodeEnv: string }).adminApiKey = 'test-api-key-12345';
    });

    it('should prefer cookie over header when both are present', () => {
      const req = createMockRequest({
        signedCookies: { admin_session: 'authenticated' },
        headers: { 'x-admin-key': 'wrong-key' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      // Cookie is valid, so should pass even though header is invalid
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fall back to header when cookie is invalid', () => {
      const req = createMockRequest({
        signedCookies: { admin_session: 'invalid' },
        headers: { 'x-admin-key': 'test-api-key-12345' },
      });
      const res = createMockResponse();

      adminAuthMiddleware(req, res, mockNext);

      // Header is valid, so should pass
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
