/**
 * @file prompt-service/src/middleware/rate-limit.middleware.ts
 * @purpose Rate limiting middleware with environment-configurable limits per endpoint type
 * @functionality
 * - Provides factory function for creating rate limiters
 * - Exports pre-configured limiters for different endpoint types
 * - All limits are configurable via environment variables
 * - Uses standard RateLimit headers (RFC 6585)
 * @dependencies
 * - express-rate-limit for rate limiting
 * - @/config for rate limit configuration
 */

import rateLimit from 'express-rate-limit';
import { config } from '@/config';

/**
 * Factory function to create a rate limiter with configurable max requests
 *
 * @param max - Maximum number of requests per window
 * @param message - Error message to return when limit is exceeded
 * @returns Configured rate limiter middleware
 */
function createLimiter(max: number, message: string) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Rate limiter for login endpoint
 * Default: 5 requests per minute
 * Purpose: Brute force protection
 */
export const loginLimiter = createLimiter(
  config.rateLimit.login,
  'Too many login attempts, please try again later'
);

/**
 * Rate limiter for registration endpoint
 * Default: 5 requests per minute
 * Purpose: Account spam prevention
 */
export const registerLimiter = createLimiter(
  config.rateLimit.register,
  'Too many registration attempts, please try again later'
);

/**
 * Rate limiter for password reset request endpoint
 * Default: 3 requests per minute
 * Purpose: Email abuse prevention
 */
export const passwordResetLimiter = createLimiter(
  config.rateLimit.passwordReset,
  'Too many password reset attempts, please try again later'
);

/**
 * Rate limiter for forgot password (confirm) endpoint
 * Default: 3 requests per minute
 * Purpose: Email abuse prevention
 */
export const forgotPasswordLimiter = createLimiter(
  config.rateLimit.forgotPassword,
  'Too many password reset confirmation attempts, please try again later'
);

/**
 * Rate limiter for token refresh endpoint
 * Default: 20 requests per minute
 * Purpose: Normal auth flow needs
 */
export const tokenRefreshLimiter = createLimiter(
  config.rateLimit.tokenRefresh,
  'Too many token refresh attempts, please try again later'
);

/**
 * Rate limiter for user data endpoints (assessment, analysis)
 * Default: 30 requests per minute
 * Purpose: Higher limit for normal usage
 */
export const userDataLimiter = createLimiter(
  config.rateLimit.userData,
  'Too many requests, please try again later'
);

/**
 * Rate limiter for profile operations
 * Default: 15 requests per minute
 * Purpose: Moderate limit for profile updates
 */
export const profileLimiter = createLimiter(
  config.rateLimit.profile,
  'Too many profile requests, please try again later'
);

/**
 * Rate limiter for admin login endpoint
 * Default: 5 requests per minute (uses same config as user login)
 * Purpose: Brute force protection for admin API key authentication
 */
export const adminLoginLimiter = createLimiter(
  config.rateLimit.login,
  'Too many login attempts, please try again later'
);
