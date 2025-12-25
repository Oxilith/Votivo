/**
 * @file prompt-service/src/routes/auth.routes.ts
 * @purpose Authentication routes for admin session management with HttpOnly cookies
 * @functionality
 * - Provides login endpoint that validates API key and sets session cookie
 * - Provides logout endpoint that clears session cookie
 * - Provides verify endpoint to check authentication status
 * @dependencies
 * - express Router
 * - crypto for timing-safe comparison
 * - @/config for configuration
 */

import crypto from 'crypto';
import { Router, type Request, type Response } from 'express';
import { config } from '@/config/index.js';

const router = Router();

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * POST /api/auth/login
 * Validates admin API key and sets HttpOnly session cookie
 */
router.post('/login', (req: Request, res: Response): void => {
  const { apiKey } = req.body as { apiKey?: string };

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ error: 'API key is required' });
    return;
  }

  // Check if admin authentication is configured
  if (!config.adminApiKey) {
    if (config.nodeEnv === 'production') {
      res.status(503).json({ error: 'Admin access not configured' });
      return;
    }
    // Allow any key in development if not configured
    setSessionCookie(res);
    res.json({ success: true });
    return;
  }

  // Validate API key using timing-safe comparison
  const apiKeyBuffer = Buffer.from(apiKey);
  const configKeyBuffer = Buffer.from(config.adminApiKey);

  if (
    apiKeyBuffer.length !== configKeyBuffer.length ||
    !crypto.timingSafeEqual(apiKeyBuffer, configKeyBuffer)
  ) {
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
  res.clearCookie(COOKIE_NAME, {
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
  const sessionCookie = req.signedCookies[COOKIE_NAME] as string | undefined;

  if (sessionCookie === 'authenticated') {
    res.json({ authenticated: true });
    return;
  }

  // Also check X-Admin-Key header for backward compatibility
  const apiKey = req.headers['x-admin-key'];
  if (apiKey && config.adminApiKey) {
    const apiKeyBuffer = Buffer.from(String(apiKey));
    const configKeyBuffer = Buffer.from(config.adminApiKey);

    if (
      apiKeyBuffer.length === configKeyBuffer.length &&
      crypto.timingSafeEqual(apiKeyBuffer, configKeyBuffer)
    ) {
      res.json({ authenticated: true });
      return;
    }
  }

  // Development mode without key configured
  if (!config.adminApiKey && config.nodeEnv !== 'production') {
    res.json({ authenticated: true });
    return;
  }

  res.json({ authenticated: false });
});

/**
 * Helper function to set the session cookie
 */
function setSessionCookie(res: Response): void {
  res.cookie(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    signed: true,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export { router as authRoutes };
