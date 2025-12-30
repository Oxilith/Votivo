/**
 * @file prompt-service/src/controllers/user-auth.controller.ts
 * @purpose Express controller for user authentication API endpoints with audit logging
 * @functionality
 * - Handles user registration with email/password
 * - Handles user login with JWT token generation
 * - Handles token refresh for session continuity
 * - Handles password reset flow (request and confirm)
 * - Handles email verification
 * - Handles user logout with CSRF token cleanup
 * - Handles assessment CRUD (save, list, get by ID)
 * - Handles analysis CRUD (save, list, get by ID)
 * - Sets CSRF token on successful authentication
 * - Passes request context (IP, userAgent) to service for audit logging
 * - Returns appropriate HTTP status codes
 * @dependencies
 * - express for request/response handling
 * - @/services/user.service for authentication business logic
 * - @/services/audit.service for RequestContext type
 * - @/validators/auth.validator for input validation
 * - @/middleware/jwt-auth.middleware for authenticated request type
 * - @/middleware/csrf.middleware for CSRF token management
 * - @/errors for custom error types
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userService, type RequestContext } from '@/services';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  emailVerifyTokenParamSchema,
  profileUpdateSchema,
  passwordChangeSchema,
} from '@/validators';
import {
  isAppError,
  AuthenticationError,
  TokenError,
} from '@/errors';
import { type AuthenticatedRequest, setCsrfToken, clearCsrfToken } from '@/middleware';
import { logger } from '@/utils';

/**
 * Type for request cookies containing refresh token
 */
interface AuthCookies {
  refreshToken?: string;
}

/**
 * Cookie name for refresh token
 */
const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Cookie options for refresh token (httpOnly for security)
 * Note: sameSite='lax' allows cookie to be sent on top-level navigations (page refresh)
 * while still protecting against CSRF on POST requests from other sites
 */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
  signed: true, // Sign cookie for integrity verification
};

/**
 * Extract request context for audit logging
 */
function getRequestContext(req: Request): RequestContext {
  // Get IP from x-forwarded-for header (behind proxy) or direct connection
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.ip ?? req.socket.remoteAddress;

  return {
    ip,
    userAgent: req.headers['user-agent'],
  };
}

export class UserAuthController {
  /**
   * POST /api/user-auth/register - Register new user
   * Returns tokens immediately - email verification is optional.
   */
  async register(req: Request, res: Response): Promise<void> {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: body.error.format() });
      return;
    }

    try {
      const ctx = getRequestContext(req);
      const result = await userService.register(body.data, ctx);

      // Set refresh token in httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      // Set CSRF token for subsequent requests
      const csrfToken = setCsrfToken(res);

      res.status(StatusCodes.CREATED).json({
        user: result.user,
        accessToken: result.accessToken,
        csrfToken, // Include in response for immediate use
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
      const ctx = getRequestContext(req);
      const result = await userService.login(body.data, ctx);

      // Set refresh token in httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      // Set CSRF token for subsequent requests
      const csrfToken = setCsrfToken(res);

      res.json({
        user: result.user,
        accessToken: result.accessToken,
        csrfToken, // Include in response for immediate use
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
    // Get refresh token from signed cookie
    const signedCookies = req.signedCookies as AuthCookies;
    const refreshToken = signedCookies.refreshToken;

    if (!refreshToken) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'No refresh token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    try {
      const ctx = getRequestContext(req);
      const result = await userService.refreshTokens(refreshToken, ctx);

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
   * POST /api/user-auth/refresh-with-user - Refresh access token and get user data
   *
   * Combined endpoint for efficient auth state restoration. Returns new access token,
   * rotates refresh token, sets CSRF token, and returns user data in a single request.
   */
  async refreshWithUser(req: Request, res: Response): Promise<void> {
    // Get refresh token from signed cookie
    const signedCookies = req.signedCookies as AuthCookies;
    const refreshToken = signedCookies.refreshToken;

    if (!refreshToken) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'No refresh token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    try {
      const ctx = getRequestContext(req);
      const result = await userService.refreshTokensWithUser(refreshToken, ctx);

      // Set new refresh token in httpOnly cookie (token rotation)
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      // Set CSRF token for subsequent requests
      const csrfToken = setCsrfToken(res);

      res.json({
        accessToken: result.accessToken,
        user: result.user,
        csrfToken,
      });
    } catch (error) {
      if (error instanceof TokenError) {
        // Clear invalid cookies
        res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
        clearCsrfToken(res);
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
      const ctx = getRequestContext(req);
      // Always returns true to prevent user enumeration
      await userService.requestPasswordReset(body.data.email, ctx);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      // Log the error for monitoring but don't leak to client
      // This could be SMTP failure, database error, etc.
      logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Password reset request failed'
      );

      // Return generic success message to prevent user enumeration
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
      const ctx = getRequestContext(req);
      await userService.confirmPasswordReset(body.data.token, body.data.newPassword, ctx);

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
      const ctx = getRequestContext(req);
      const user = await userService.verifyEmail(params.data.token, ctx);

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
      const ctx = getRequestContext(req);
      const sent = await userService.resendEmailVerification(userId, ctx);

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
    // Get refresh token from signed cookie
    const signedCookies = req.signedCookies as AuthCookies;
    const refreshToken = signedCookies.refreshToken;

    if (refreshToken) {
      const ctx = getRequestContext(req);
      // Invalidate the refresh token in database
      await userService.logout(refreshToken, ctx);
    }

    // Clear the cookies
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    clearCsrfToken(res);

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

    const ctx = getRequestContext(req);
    const count = await userService.logoutAll(userId, ctx);

    // Clear the cookies
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    clearCsrfToken(res);

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

  /**
   * PUT /api/user-auth/profile - Update user profile
   * Requires authentication
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Validate request body
    const parseResult = profileUpdateSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parseResult.error.errors,
      });
      return;
    }

    try {
      const user = await userService.updateProfile(userId, parseResult.data);
      res.json(user);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * PUT /api/user-auth/password - Change password
   * Requires authentication
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Validate request body
    const parseResult = passwordChangeSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parseResult.error.errors,
      });
      return;
    }

    const { currentPassword, newPassword } = parseResult.data;

    try {
      const ctx = getRequestContext(req);
      await userService.changePassword(userId, { currentPassword, newPassword }, ctx);

      // Clear refresh token cookie after password change
      res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

      res.json({
        message: 'Password changed successfully. Please log in again.',
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * DELETE /api/user-auth/account - Delete user account
   * Requires authentication
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
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
      const ctx = getRequestContext(req);
      await userService.deleteAccount(userId, ctx);

      // Clear refresh token cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

      res.json({
        message: 'Account deleted successfully.',
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
   * POST /api/user-auth/assessment - Save assessment
   * Requires authentication
   */
  async saveAssessment(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const { responses } = req.body as { responses?: unknown };

    if (!responses) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Assessment responses are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    try {
      const assessment = await userService.saveAssessment(
        userId,
        typeof responses === 'string' ? responses : JSON.stringify(responses)
      );
      res.status(StatusCodes.CREATED).json(assessment);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * GET /api/user-auth/assessment - Get user's assessments
   * Requires authentication
   */
  async getAssessments(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const assessments = await userService.getAssessments(userId);
    res.json(assessments);
  }

  /**
   * POST /api/user-auth/analysis - Save analysis
   * Requires authentication
   */
  async saveAnalysis(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const { result, assessmentId } = req.body as {
      result?: unknown;
      assessmentId?: string;
    };

    if (!result) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Analysis result is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    try {
      const analysis = await userService.saveAnalysis(
        userId,
        typeof result === 'string' ? result : JSON.stringify(result),
        assessmentId
      );
      res.status(StatusCodes.CREATED).json(analysis);
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      throw error;
    }
  }

  /**
   * GET /api/user-auth/analyses - Get user's analyses
   * Requires authentication
   */
  async getAnalyses(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const analyses = await userService.getAnalyses(userId);
    res.json(analyses);
  }

  /**
   * GET /api/user-auth/assessment/:id - Get specific assessment by ID
   * Requires authentication
   */
  async getAssessmentById(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Assessment ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const assessment = await userService.getAssessmentById(id, userId);

    if (!assessment) {
      res.status(StatusCodes.NOT_FOUND).json({
        error: 'Assessment not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json(assessment);
  }

  /**
   * GET /api/user-auth/analysis/:id - Get specific analysis by ID
   * Requires authentication
   */
  async getAnalysisById(req: Request, res: Response): Promise<void> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Analysis ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const analysis = await userService.getAnalysisById(id, userId);

    if (!analysis) {
      res.status(StatusCodes.NOT_FOUND).json({
        error: 'Analysis not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json(analysis);
  }
}

export const userAuthController = new UserAuthController();
