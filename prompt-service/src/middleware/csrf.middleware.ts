/**
 * @file prompt-service/src/middleware/csrf.middleware.ts
 * @purpose CSRF protection middleware using double-submit cookie pattern
 * @functionality
 * - Validates CSRF token from header against httpOnly cookie
 * - Sets CSRF token in httpOnly cookie and returns token in response body
 * - App stores token from response body, not from reading cookie
 * - Skips validation for safe HTTP methods (GET, HEAD, OPTIONS)
 * - Provides defense-in-depth alongside SameSite cookie protection
 * @dependencies
 * - express for middleware types
 * - @/utils/csrf for token generation and validation
 */

import type { Request, Response, NextFunction } from 'express';
import { CSRF_COOKIE, CSRF_HEADER, generateCsrfToken, validateCsrfToken } from '@/utils';

/**
 * CSRF cookie options
 *
 * Security: httpOnly is TRUE for defense-in-depth.
 * The App gets the CSRF token from the response body (login/register/refresh),
 * stores it in memory, and sends it in the X-CSRF-Token header.
 * The browser automatically sends the httpOnly cookie, and the server compares both.
 *
 * This prevents XSS from easily exfiltrating the CSRF token via document.cookie,
 * even though the token is also available in the initial response body.
 */
const CSRF_COOKIE_OPTIONS = {
  httpOnly: true, // Defense-in-depth: token comes from response body, not cookie
  // In local development (NODE_ENV !== 'production'), secure is false to allow
  // HTTP without HTTPS. In production, requires HTTPS for cookie transmission.
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
  signed: false, // Not signed - exact match required for double-submit pattern
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
