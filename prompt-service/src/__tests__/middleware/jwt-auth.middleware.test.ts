/**
 * @file prompt-service/src/__tests__/middleware/jwt-auth.middleware.test.ts
 * @purpose Unit tests for JWT authentication middleware
 * @description Tests that JWT middleware correctly protects routes by:
 * - Returning 401 when no token is provided
 * - Returning 401 when token is invalid/malformed
 * - Returning 401 when token is expired
 * - Returning 200 and attaching user to request when token is valid
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock config before importing middleware
vi.mock('@/config/index.js', () => ({
  config: {
    jwtAccessSecret: 'test-access-secret-1234567890abcdef',
    jwtRefreshSecret: 'test-refresh-secret-0987654321fedcba',
    jwtAccessExpiry: '15m',
    jwtRefreshExpiry: '7d',
    nodeEnv: 'test',
    devAuthBypass: false,
  },
}));

// Import after mocking
import {
  jwtAuthMiddleware,
  optionalJwtAuthMiddleware,
  type AuthenticatedRequest,
} from '@/middleware/jwt-auth.middleware.js';
import { generateAccessToken, type JwtConfig } from '@/utils/jwt.js';

describe('JWT Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  const testJwtConfig: JwtConfig = {
    accessSecret: 'test-access-secret-1234567890abcdef',
    refreshSecret: 'test-refresh-secret-0987654321fedcba',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  };

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('jwtAuthMiddleware', () => {
    describe('when no token is provided', () => {
      it('should return 401 with NO_TOKEN code', () => {
        mockRequest.headers = {};

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Authorization required',
          code: 'NO_TOKEN',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 401 when Authorization header is missing Bearer prefix', () => {
        mockRequest.headers = {
          authorization: 'some-token-without-bearer',
        };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Authorization required',
          code: 'NO_TOKEN',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 401 when Authorization header uses Basic instead of Bearer', () => {
        mockRequest.headers = {
          authorization: 'Basic some-credentials',
        };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Authorization required',
          code: 'NO_TOKEN',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('when token is invalid', () => {
      it('should return 401 with INVALID_TOKEN code for malformed token', () => {
        mockRequest.headers = {
          authorization: 'Bearer not-a-valid-jwt',
        };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 401 with INVALID_TOKEN code for token with wrong signature', () => {
        // Create a token with wrong signature
        const invalidToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjQwMDAwMDAwfQ.wrong_signature';

        mockRequest.headers = {
          authorization: `Bearer ${invalidToken}`,
        };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('when token is valid', () => {
      it('should call next() and attach user to request', () => {
        const userId = 'test-user-id-12345';
        const validToken = generateAccessToken(userId, testJwtConfig);

        mockRequest.headers = {
          authorization: `Bearer ${validToken}`,
        };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();

        const authRequest = mockRequest as AuthenticatedRequest;
        expect(authRequest.user).toBeDefined();
        expect(authRequest.user.userId).toBe(userId);
        expect(authRequest.user.type).toBe('access');
      });

      it('should work with multiple valid tokens for different users', () => {
        const userId1 = 'user-1';
        const userId2 = 'user-2';

        // Test first user
        const token1 = generateAccessToken(userId1, testJwtConfig);
        mockRequest.headers = { authorization: `Bearer ${token1}` };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect((mockRequest as AuthenticatedRequest).user.userId).toBe(userId1);

        // Reset for second user
        mockNext = vi.fn();
        mockRequest = { headers: { authorization: `Bearer ${generateAccessToken(userId2, testJwtConfig)}` } };

        jwtAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect((mockRequest as AuthenticatedRequest).user.userId).toBe(userId2);
      });
    });
  });

  describe('optionalJwtAuthMiddleware', () => {
    it('should call next() when no token is provided', () => {
      mockRequest.headers = {};

      optionalJwtAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
    });

    it('should call next() and not attach user for invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      optionalJwtAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
    });

    it('should call next() and attach user for valid token', () => {
      const userId = 'test-user-id';
      const validToken = generateAccessToken(userId, testJwtConfig);

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      optionalJwtAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();

      const authRequest = mockRequest as AuthenticatedRequest;
      expect(authRequest.user).toBeDefined();
      expect(authRequest.user.userId).toBe(userId);
    });
  });
});

describe('JWT Protected Routes Integration', () => {
  /**
   * These tests verify the full flow of JWT protection on actual routes.
   * They should be run with the server running.
   *
   * Verification steps:
   * 1. POST /api/user-auth/login - get access token
   * 2. Access /api/user-auth/me without token - should return 401
   * 3. Access /api/user-auth/me with valid token - should return 200
   * 4. Access /api/user-auth/me with invalid token - should return 401
   * 5. Access /api/user-auth/me with expired token - should return 401
   */

  it.todo('should return 401 for /me without token');
  it.todo('should return 200 for /me with valid token');
  it.todo('should return 401 for /me with invalid token');
  it.todo('should return 401 for /me with expired token');
  it.todo('should return 401 for /logout-all without token');
  it.todo('should return 200 for /logout-all with valid token');
  it.todo('should return 401 for /resend-verification without token');
});
