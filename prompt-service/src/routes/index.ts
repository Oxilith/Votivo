/**
 * @file prompt-service/src/routes/index.ts
 * @purpose Aggregates all API routes for the prompt service
 * @functionality
 * - Combines auth, prompt, A/B test, resolve, and user-auth routes
 * - Applies admin auth middleware to protected routes (prompts, ab-tests)
 * - Applies rate limiting to admin routes (100 req/15min)
 * - Applies strict rate limiting to auth routes (5 req/min) to prevent brute-force attacks
 * - User-auth routes use per-route rate limiting (see user-auth.routes.ts)
 * - Applies lenient rate limiting to resolve routes (1000 req/min) for service-to-service
 * - Provides a single router for mounting in Express app
 * @dependencies
 * - express Router
 * - express-rate-limit for rate limiting
 * - @/routes/auth.routes
 * - @/routes/prompt.routes
 * - @/routes/ab-test.routes
 * - @/routes/resolve.routes
 * - @/routes/user-auth.routes
 * - @/middleware/admin-auth.middleware
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './auth.routes';
import { promptRoutes } from './prompt.routes';
import { abTestRoutes } from './ab-test.routes';
import { resolveRoutes } from './resolve.routes';
import { userAuthRoutes } from './user-auth.routes';
import { adminAuthMiddleware } from '@/middleware';

const router = Router();

// Rate limiter for admin endpoints
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for auth endpoints (stricter to prevent brute-force attacks)
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for resolve endpoint (more lenient - service-to-service)
const resolveRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: { error: 'Rate limit exceeded for resolve endpoint' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Note: User auth routes use per-route rate limiting configured in user-auth.routes.ts
// with env-configurable limits (see rate-limit.middleware.ts)

// Public routes (used by backend service) - rate limited to prevent abuse
router.use('/resolve', resolveRateLimiter, resolveRoutes);

// Auth routes (public - for login/logout) - rate limited to prevent brute-force attacks
router.use('/auth', authRateLimiter, authRoutes);

// User auth routes - per-route rate limiting applied in user-auth.routes.ts
router.use('/user-auth', userAuthRoutes);

// Protected admin routes (require X-Admin-Key header + rate limiting)
router.use('/prompts', adminRateLimiter, adminAuthMiddleware, promptRoutes);
router.use('/ab-tests', adminRateLimiter, adminAuthMiddleware, abTestRoutes);

export { router as apiRouter };
