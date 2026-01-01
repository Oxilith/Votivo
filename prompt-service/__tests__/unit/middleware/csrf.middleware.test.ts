/**
 * @file prompt-service/__tests__/unit/middleware/csrf.middleware.test.ts
 * @purpose Unit tests for CSRF protection middleware
 * @functionality
 * - Tests CSRF token validation for state-changing requests
 * - Tests skipping validation for safe HTTP methods
 * - Tests token generation and cookie setting
 * - Tests token clearing on logout
 * @dependencies
 * - vitest for testing framework
 * - express for request/response mocking
 * - @/middleware/csrf.middleware for middleware under test
 * - @/utils/csrf for token utilities
 */

import type { Request, Response, NextFunction } from 'express';
import { csrfMiddleware, setCsrfToken, clearCsrfToken } from '@/middleware';
import { CSRF_COOKIE, CSRF_HEADER, generateCsrfToken } from '@/utils';

describe('CSRF Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      cookies: {},
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn() as unknown as NextFunction;
  });

  describe('csrfMiddleware', () => {
    describe('safe methods', () => {
      it.each(['GET', 'HEAD', 'OPTIONS'])('should skip validation for %s requests', (method: string) => {
        mockReq.method = method;

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });

    describe('state-changing methods', () => {
      it.each(['POST', 'PUT', 'DELETE', 'PATCH'])('should require CSRF token for %s requests', (method: string) => {
        mockReq.method = method;
        // No cookie, no header

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Invalid CSRF token',
          code: 'CSRF_FAILED',
        });
      });

      it('should reject when cookie is missing', () => {
        mockReq.method = 'POST';
        mockReq.headers = { [CSRF_HEADER]: 'some-token' };
        mockReq.cookies = {};

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('should reject when header is missing', () => {
        mockReq.method = 'POST';
        mockReq.cookies = { [CSRF_COOKIE]: 'some-token' };
        mockReq.headers = {};

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('should reject when tokens do not match', () => {
        mockReq.method = 'POST';
        mockReq.cookies = { [CSRF_COOKIE]: 'cookie-token' };
        mockReq.headers = { [CSRF_HEADER]: 'different-header-token' };

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('should accept when tokens match', () => {
        const token = generateCsrfToken();
        mockReq.method = 'POST';
        mockReq.cookies = { [CSRF_COOKIE]: token };
        mockReq.headers = { [CSRF_HEADER]: token };

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should reject tokens with different lengths', () => {
        mockReq.method = 'POST';
        mockReq.cookies = { [CSRF_COOKIE]: 'short' };
        mockReq.headers = { [CSRF_HEADER]: 'longer-token-value' };

        csrfMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('setCsrfToken', () => {
    it('should set CSRF cookie with correct options', () => {
      const token = setCsrfToken(mockRes as Response);

      expect(token).toBeDefined();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(mockRes.cookie).toHaveBeenCalledWith(
        CSRF_COOKIE,
        token,
        expect.objectContaining({
          httpOnly: true, // Defense-in-depth: token comes from response body, not cookie
          sameSite: 'strict',
          path: '/',
          signed: false,
        })
      );
    });

    it('should generate unique tokens each time', () => {
      const token1 = setCsrfToken(mockRes as Response);
      const token2 = setCsrfToken(mockRes as Response);

      expect(token1).not.toBe(token2);
    });
  });

  describe('clearCsrfToken', () => {
    it('should clear CSRF cookie', () => {
      clearCsrfToken(mockRes as Response);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(CSRF_COOKIE, { path: '/' });
    });
  });
});
