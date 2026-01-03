/**
 * @file prompt-service/src/routes/index.ts
 * @purpose Aggregates all API routes for the prompt service
 * @functionality
 * - Combines auth, prompt, A/B test, resolve, and user-auth routes
 * - Applies admin auth middleware to protected routes (prompts, ab-tests)
 * - Applies configurable rate limiting to admin routes (RATE_LIMIT_ADMIN_API, RATE_LIMIT_ADMIN_WINDOW_MS)
 * - Auth routes use per-route rate limiting (login only, see auth.routes.ts)
 * - User-auth routes use per-route rate limiting (see user-auth.routes.ts)
 * - Applies lenient rate limiting to resolve routes (1000 req/min) for service-to-service
 * - Provides a single router for mounting in Express app
 * @dependencies
 * - express Router
 * - express-rate-limit for rate limiting
 * - @/config for rate limit configuration
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
import { config } from '@/config';

const router = Router();

// Rate limiter for admin endpoints (configurable via RATE_LIMIT_ADMIN_API and RATE_LIMIT_ADMIN_WINDOW_MS)
const adminRateLimiter = rateLimit({
  windowMs: config.rateLimit.adminWindowMs,
  max: config.rateLimit.adminApi,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Note: Auth routes use per-route rate limiting (see auth.routes.ts)
// Only login is rate limited, verify/logout are not rate limited

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

// Auth routes (public - for login/logout) - per-route rate limiting in auth.routes.ts
// Only login is rate limited; verify/logout are not rate limited
router.use('/auth', authRoutes);

// User auth routes - per-route rate limiting applied in user-auth.routes.ts
router.use('/user-auth', userAuthRoutes);

// Protected admin routes (require X-Admin-Key header + rate limiting)
router.use('/prompts', adminRateLimiter, adminAuthMiddleware, promptRoutes);
router.use('/ab-tests', adminRateLimiter, adminAuthMiddleware, abTestRoutes);

export { router as apiRouter };
