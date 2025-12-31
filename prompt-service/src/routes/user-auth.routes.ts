/**
 * @file prompt-service/src/routes/user-auth.routes.ts
 * @purpose Express router for user authentication endpoints
 * @functionality
 * - Routes for user registration and login
 * - Routes for token refresh and logout
 * - Routes for password reset flow (request and confirm)
 * - Routes for email verification
 * - Routes for assessment CRUD (save, list, get by ID)
 * - Routes for analysis CRUD (save, list, get by ID)
 * - Wraps controller methods with async error handling
 * - Applies JWT authentication middleware to protected routes
 * - Applies CSRF protection to state-changing endpoints
 * - Applies per-route rate limiting with env-configurable limits
 * @dependencies
 * - express Router
 * - @/controllers/user-auth.controller for request handling
 * - @/middleware/jwt-auth.middleware for protected routes
 * - @/middleware/csrf.middleware for CSRF protection
 * - @/middleware/rate-limit.middleware for per-route rate limiting
 */

import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { userAuthController } from '@/controllers';
import {
  jwtAuthMiddleware,
  csrfMiddleware,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  forgotPasswordLimiter,
  tokenRefreshLimiter,
  userDataLimiter,
  profileLimiter,
} from '@/middleware';

const router = Router();

// Async wrapper to catch errors
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

// Public routes - no authentication required

// Registration (5 req/min default)
router.post(
  '/register',
  registerLimiter,
  asyncHandler(userAuthController.register.bind(userAuthController))
);

// Login (5 req/min default)
router.post(
  '/login',
  loginLimiter,
  asyncHandler(userAuthController.login.bind(userAuthController))
);

// Token refresh (20 req/min default)
router.post(
  '/refresh',
  tokenRefreshLimiter,
  asyncHandler(userAuthController.refresh.bind(userAuthController))
);

// Token refresh with user data (20 req/min default) - for efficient auth restoration
router.post(
  '/refresh-with-user',
  tokenRefreshLimiter,
  asyncHandler(userAuthController.refreshWithUser.bind(userAuthController))
);

// Password reset - request email (3 req/min default)
router.post(
  '/password-reset',
  passwordResetLimiter,
  asyncHandler(userAuthController.requestPasswordReset.bind(userAuthController))
);

// Password reset - confirm with token (3 req/min default)
router.post(
  '/password-reset/confirm',
  forgotPasswordLimiter,
  asyncHandler(userAuthController.confirmPasswordReset.bind(userAuthController))
);

// Email verification (token in URL) - uses profile limiter (15 req/min)
router.get(
  '/verify-email/:token',
  profileLimiter,
  asyncHandler(userAuthController.verifyEmail.bind(userAuthController))
);

// Logout (uses profile limiter - 15 req/min, CSRF protected)
router.post(
  '/logout',
  csrfMiddleware,
  profileLimiter,
  asyncHandler(userAuthController.logout.bind(userAuthController))
);

// Protected routes - require JWT authentication

// Resend verification email (3 req/min - email abuse prevention, CSRF protected)
router.post(
  '/resend-verification',
  csrfMiddleware,
  passwordResetLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.resendVerification.bind(userAuthController))
);

// Logout from all sessions (15 req/min, CSRF protected)
router.post(
  '/logout-all',
  csrfMiddleware,
  profileLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.logoutAll.bind(userAuthController))
);

// Get current user profile (15 req/min)
router.get(
  '/me',
  profileLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.getCurrentUser.bind(userAuthController))
);

// Update user profile (15 req/min, CSRF protected)
router.put(
  '/profile',
  csrfMiddleware,
  profileLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.updateProfile.bind(userAuthController))
);

// Change password (5 req/min - sensitive operation, CSRF protected)
router.put(
  '/password',
  csrfMiddleware,
  loginLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.changePassword.bind(userAuthController))
);

// Delete account (5 req/min - sensitive operation, CSRF protected)
router.delete(
  '/account',
  csrfMiddleware,
  loginLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.deleteAccount.bind(userAuthController))
);

// Save assessment (30 req/min - user data, CSRF protected)
router.post(
  '/assessment',
  csrfMiddleware,
  userDataLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.saveAssessment.bind(userAuthController))
);

// Get user's assessments (30 req/min - user data)
router.get(
  '/assessment',
  userDataLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.getAssessments.bind(userAuthController))
);

// Get specific assessment by ID (30 req/min - user data)
router.get(
  '/assessment/:id',
  userDataLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.getAssessmentById.bind(userAuthController))
);

// Save analysis (30 req/min - user data, CSRF protected)
router.post(
  '/analysis',
  csrfMiddleware,
  userDataLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.saveAnalysis.bind(userAuthController))
);

// Get user's analyses (30 req/min - user data)
router.get(
  '/analyses',
  userDataLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.getAnalyses.bind(userAuthController))
);

// Get specific analysis by ID (30 req/min - user data)
router.get(
  '/analysis/:id',
  userDataLimiter,
  jwtAuthMiddleware,
  asyncHandler(userAuthController.getAnalysisById.bind(userAuthController))
);

export { router as userAuthRoutes };
