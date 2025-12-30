/**
 * @file prompt-service/src/middleware/admin-auth.middleware.ts
 * @purpose API key authentication middleware for admin routes
 * @functionality
 * - Allows login page and static assets without authentication (SPA needs to load first)
 * - Validates authentication via HttpOnly session cookie (primary method)
 * - Falls back to X-Admin-Key header validation for backward compatibility
 * - Uses timing-safe comparison to prevent timing attacks
 * - Returns 401 Unauthorized if authentication fails
 * - Requires explicit DEV_AUTH_BYPASS=true in development for auth bypass
 * - Blocks access in production if admin key is not configured
 * @dependencies
 * - @/utils/crypto for timing-safe comparison
 * - @/utils/auth for shared auth config validation
 * - express for Request, Response, NextFunction types
 * - @/config for configuration
 */

import type { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { AUTH_CONSTANTS } from '@/constants';
import { timingSafeCompare, validateAuthConfig } from '@/utils';

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Allow login page and static assets without authentication
  // The React SPA needs to load before it can show the login form
  // Check both req.path (relative when mounted) and req.originalUrl (full path)
  const path = req.path || '';
  const originalUrl = req.originalUrl || '';

  // Normalize paths - remove trailing slashes
  // Only treat as root if path was actually set (not undefined/empty)
  const normalizedPath = path ? (path.replace(/\/$/, '') || '/') : '';
  const normalizedOriginalUrl = originalUrl ? (originalUrl.replace(/\/$/, '') || '/') : '';

  // Check for login route (both relative and full paths)
  const isLoginRoute =
    normalizedPath === '/login' ||
    normalizedPath === '/' ||
    normalizedOriginalUrl === '/admin/login' ||
    normalizedOriginalUrl === '/admin';

  // Check for static assets
  const isStaticAsset = /\.(js|css|html|ico|png|svg|woff|woff2|ttf|map|json)$/i.test(path);

  if (isLoginRoute || isStaticAsset) {
    next();
    return;
  }

  // Validate auth configuration using shared utility
  const authValidation = validateAuthConfig();

  if (!authValidation.isValid && authValidation.errorResponse) {
    res.status(authValidation.errorResponse.status).json({
      error: authValidation.errorResponse.error,
    });
    return;
  }

  // Development bypass enabled - skip authentication
  if (authValidation.shouldBypass) {
    next();
    return;
  }

  // Check for authenticated session cookie first (primary auth method)
  const sessionCookie = req.signedCookies[AUTH_CONSTANTS.COOKIE_NAME] as string | undefined;
  if (sessionCookie === AUTH_CONSTANTS.SESSION_VALUES.AUTHENTICATED) {
    next();
    return;
  }

  // Fall back to X-Admin-Key header for backward compatibility
  const apiKey = req.headers[AUTH_CONSTANTS.API_KEY_HEADER];
  if (apiKey && typeof apiKey === 'string' && config.adminApiKey) {
    if (timingSafeCompare(apiKey, config.adminApiKey)) {
      next();
      return;
    }
  }

  res.status(401).json({ error: 'Unauthorized' });
}
