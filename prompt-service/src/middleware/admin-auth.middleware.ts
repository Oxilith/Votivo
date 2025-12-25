/**
 * @file prompt-service/src/middleware/admin-auth.middleware.ts
 * @purpose API key authentication middleware for admin routes
 * @functionality
 * - Validates authentication via HttpOnly session cookie (primary method)
 * - Falls back to X-Admin-Key header validation for backward compatibility
 * - Uses timing-safe comparison to prevent timing attacks
 * - Returns 401 Unauthorized if authentication fails
 * - Allows access in development mode without key if not configured
 * - Blocks access in production if admin key is not configured
 * @dependencies
 * - crypto for timing-safe comparison
 * - express for Request, Response, NextFunction types
 * - @/config for configuration
 */

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index.js';
import { AUTH_CONSTANTS } from '@/constants/auth.js';

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Development mode without key configured - allow all
  if (!config.adminApiKey) {
    if (config.nodeEnv === 'production') {
      res.status(503).json({ error: 'Admin access not configured' });
      return;
    }
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
  if (apiKey && typeof apiKey === 'string') {
    const apiKeyBuffer = Buffer.from(apiKey);
    const configKeyBuffer = Buffer.from(config.adminApiKey);

    if (
      apiKeyBuffer.length === configKeyBuffer.length &&
      crypto.timingSafeEqual(apiKeyBuffer, configKeyBuffer)
    ) {
      next();
      return;
    }
  }

  res.status(401).json({ error: 'Unauthorized' });
}
