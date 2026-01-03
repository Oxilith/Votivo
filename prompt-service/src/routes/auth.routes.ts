/**
 * @file prompt-service/src/routes/auth.routes.ts
 * @purpose Authentication routes for admin session management with HttpOnly cookies
 * @functionality
 * - Provides login endpoint that validates API key and sets session cookie
 * - Provides logout endpoint that clears session cookie
 * - Provides verify endpoint to check authentication status
 * - Applies rate limiting only to login endpoint (not verify/logout)
 * @dependencies
 * - express Router
 * - @/utils/crypto for timing-safe comparison
 * - @/utils/auth for shared auth config validation
 * - @/config for configuration
 * - @/middleware for rate limiting
 */

import { Router, type Request, type Response } from 'express';
import { config } from '@/config';
import { AUTH_CONSTANTS } from '@/constants';
import { adminLoginLimiter } from '@/middleware';
import { timingSafeCompare, validateAuthConfig } from '@/utils';

const router = Router();

/**
 * POST /api/auth/login
 * Validates admin API key and sets HttpOnly session cookie
 * Rate limited to prevent brute-force attacks (uses config.rateLimit.login)
 */
router.post('/login', adminLoginLimiter, (req: Request, res: Response): void => {
  const { apiKey } = req.body as { apiKey?: string };

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ error: 'API key is required' });
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

  // Validate API key using timing-safe comparison
  if (!config.adminApiKey || !timingSafeCompare(apiKey, config.adminApiKey)) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  // Set authenticated session cookie
  setSessionCookie(res);
  res.json({ success: true });
});

/**
 * POST /api/auth/logout
 * Clears the session cookie
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(AUTH_CONSTANTS.COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.json({ success: true });
});

/**
 * GET /api/auth/verify
 * Checks if the current session is authenticated
 */
router.get('/verify', (req: Request, res: Response): void => {
  const sessionCookie = req.signedCookies[AUTH_CONSTANTS.COOKIE_NAME] as string | undefined;

  if (sessionCookie === AUTH_CONSTANTS.SESSION_VALUES.AUTHENTICATED) {
    res.json({ authenticated: true });
    return;
  }

  // Also check X-Admin-Key header for backward compatibility
  const apiKey = req.headers[AUTH_CONSTANTS.API_KEY_HEADER];
  if (apiKey && config.adminApiKey && timingSafeCompare(String(apiKey), config.adminApiKey)) {
    res.json({ authenticated: true });
    return;
  }

  res.json({ authenticated: false });
});

/**
 * Helper function to set the session cookie
 */
function setSessionCookie(res: Response): void {
  res.cookie(AUTH_CONSTANTS.COOKIE_NAME, AUTH_CONSTANTS.SESSION_VALUES.AUTHENTICATED, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    signed: true,
    maxAge: AUTH_CONSTANTS.COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export { router as authRoutes };
