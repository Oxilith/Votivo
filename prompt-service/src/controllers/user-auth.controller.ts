/**
 * @file prompt-service/src/controllers/user-auth.controller.ts
 * @purpose Express controller for user authentication API endpoints
 * @functionality
 * - Handles user registration with email/password
 * - Handles user login with JWT token generation
 * - Handles token refresh for session continuity
 * - Handles password reset flow (request and confirm)
 * - Handles email verification
 * - Handles user logout
 * - Returns appropriate HTTP status codes
 * @dependencies
 * - express for request/response handling
 * - @/services/user.service for authentication business logic
 * - @/validators/auth.validator for input validation
 * - @/middleware/jwt-auth.middleware for authenticated request type
 * - @/errors for custom error types
 */

import type { Request, Response } from 'express';

/**
 * Type for request cookies containing refresh token
 */
interface AuthCookies {
  refreshToken?: string;
}
import { StatusCodes } from 'http-status-codes';
import {
  userService,
  AuthenticationError,
  TokenError,
} from '@/services/user.service.js';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  emailVerifyTokenParamSchema,
} from '@/validators/auth.validator.js';
import { isAppError } from '@/errors/index.js';
import type { AuthenticatedRequest } from '@/middleware/jwt-auth.middleware.js';

/**
 * Cookie name for refresh token
 */
const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Cookie options for refresh token (httpOnly for security)
 */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};

export class UserAuthController {
  /**
   * POST /api/user-auth/register - Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const result = await userService.register(body.data);

      // Set refresh token in httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.status(StatusCodes.CREATED).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/user-auth/login - Authenticate user
   */
  async login(req: Request, res: Response): Promise<void> {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const result = await userService.login(body.data);

      // Set refresh token in httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/user-auth/refresh - Refresh access token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    // Get refresh token from cookie
    const cookies = req.cookies as AuthCookies;
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'No refresh token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    try {
      const result = await userService.refreshTokens(refreshToken);

      // Set new refresh token in httpOnly cookie (token rotation)
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.json({
        accessToken: result.accessToken,
      });
    } catch (error) {
      if (error instanceof TokenError) {
        // Clear invalid cookie
        res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/user-auth/password-reset - Request password reset email
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const body = passwordResetRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      // Always returns true to prevent user enumeration
      await userService.requestPasswordReset(body.data.email);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch {
      // Email service errors should not leak to client
      // Log internally and return generic success message
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }
  }

  /**
   * POST /api/user-auth/password-reset/confirm - Complete password reset
   */
  async confirmPasswordReset(req: Request, res: Response): Promise<void> {
    const body = passwordResetConfirmSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      await userService.confirmPasswordReset(body.data.token, body.data.newPassword);

      res.json({
        message: 'Password has been reset successfully. Please login with your new password.',
      });
    } catch (error) {
      if (error instanceof TokenError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      throw error;
    }
  }

  /**
   * GET /api/user-auth/verify-email/:token - Verify email address
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const params = emailVerifyTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: params.error.format() });
      return;
    }

    try {
      const user = await userService.verifyEmail(params.data.token);

      res.json({
        message: 'Email verified successfully.',
        user,
      });
    } catch (error) {
      if (error instanceof TokenError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/user-auth/resend-verification - Resend verification email
   * Requires authentication
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    try {
      const sent = await userService.resendEmailVerification(userId);

      if (!sent) {
        res.json({
          message: 'Email is already verified.',
        });
        return;
      }

      res.json({
        message: 'Verification email has been sent.',
      });
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * POST /api/user-auth/logout - Logout user
   */
  async logout(req: Request, res: Response): Promise<void> {
    // Get refresh token from cookie
    const cookies = req.cookies as AuthCookies;
    const refreshToken = cookies.refreshToken;

    if (refreshToken) {
      // Invalidate the refresh token in database
      await userService.logout(refreshToken);
    }

    // Clear the cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    res.json({
      message: 'Logged out successfully.',
    });
  }

  /**
   * POST /api/user-auth/logout-all - Logout from all sessions
   * Requires authentication
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const count = await userService.logoutAll(userId);

    // Clear the current cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    res.json({
      message: `Logged out from ${count} session(s).`,
    });
  }

  /**
   * GET /api/user-auth/me - Get current user profile
   * Requires authentication
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const user = await userService.getById(userId);

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({
        error: 'User not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json(user);
  }
}

export const userAuthController = new UserAuthController();
