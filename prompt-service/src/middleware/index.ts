/**
 * @file prompt-service/src/middleware/index.ts
 * @purpose Centralized export for all middleware modules
 * @functionality
 * - Exports admin authentication middleware
 * - Exports JWT authentication middleware and types
 * - Exports CSRF protection middleware and utilities
 * - Exports tracing middleware
 * - Exports rate limiting middleware
 * @dependencies
 * - admin-auth.middleware.ts
 * - jwt-auth.middleware.ts
 * - csrf.middleware.ts
 * - tracing.middleware.ts
 * - rate-limit.middleware.ts
 */

export { adminAuthMiddleware } from './admin-auth.middleware';
export {
  jwtAuthMiddleware,
  optionalJwtAuthMiddleware,
  isAuthenticatedRequest,
  type AuthenticatedRequest,
} from './jwt-auth.middleware';
export { csrfMiddleware, setCsrfToken, clearCsrfToken } from './csrf.middleware';
export { tracingMiddleware } from './tracing.middleware';
export {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  forgotPasswordLimiter,
  tokenRefreshLimiter,
  userDataLimiter,
  profileLimiter,
  adminLoginLimiter,
} from './rate-limit.middleware';
