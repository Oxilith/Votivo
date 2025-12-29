/**
 * @file prompt-service/src/middleware/csrf.middleware.ts
 * @purpose CSRF protection middleware using double-submit cookie pattern
 * @functionality
 * - Validates CSRF token from header against signed cookie
 * - Sets CSRF token cookie on successful authentication
 * - Skips validation for safe HTTP methods (GET, HEAD, OPTIONS)
 * - Provides defense-in-depth alongside SameSite cookie protection
 * @dependencies
 * - express for middleware types
 * - @/utils/csrf for token generation and validation
 */

import type { Request, Response, NextFunction } from 'express';
import { CSRF_COOKIE, CSRF_HEADER, generateCsrfToken, validateCsrfToken } from '@/utils/csrf.js';

/**
 * CSRF cookie options
 * Note: httpOnly is FALSE so JavaScript can read and send the token in headers
 * Note: signed is FALSE because the double-submit pattern doesn't require signing -
 *       the token in the cookie must match the token in the header exactly
 */
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Must be readable by JavaScript to send in header
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
  signed: false, // Not signed - client needs to read exact value for header
};

/**
 * CSRF protection middleware
 *
 * Validates that the CSRF token in the request header matches the signed cookie.
 * Skips validation for safe HTTP methods (GET, HEAD, OPTIONS).
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Get tokens from cookie and header
  const cookieToken = req.cookies[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  // Validate tokens
  if (!cookieToken || !headerToken || !validateCsrfToken(headerToken, cookieToken)) {
    res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_FAILED',
    });
    return;
  }

  next();
}

/**
 * Set CSRF token cookie on response
 *
 * Call this on successful login/register to establish CSRF protection.
 *
 * @param res - Express response object
 * @returns The generated CSRF token (to include in response body)
 */
export function setCsrfToken(res: Response): string {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE, token, CSRF_COOKIE_OPTIONS);
  return token;
}

/**
 * Clear CSRF token cookie
 *
 * Call this on logout to remove CSRF protection.
 *
 * @param res - Express response object
 */
export function clearCsrfToken(res: Response): void {
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}
