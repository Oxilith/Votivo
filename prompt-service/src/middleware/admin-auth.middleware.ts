/**
 * @file prompt-service/src/middleware/admin-auth.middleware.ts
 * @purpose API key authentication middleware for admin routes
 * @functionality
 * - Validates X-Admin-Key header against configured key using timing-safe comparison
 * - Returns 401 Unauthorized if key is missing or invalid
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

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-admin-key'];

  if (!config.adminApiKey) {
    // If no key configured, block all admin access in production
    if (config.nodeEnv === 'production') {
      res.status(503).json({ error: 'Admin access not configured' });
      return;
    }
    // Allow in development without key
    next();
    return;
  }

  // Validate API key exists and is a string
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey);
  const configKeyBuffer = Buffer.from(config.adminApiKey);

  if (
    apiKeyBuffer.length !== configKeyBuffer.length ||
    !crypto.timingSafeEqual(apiKeyBuffer, configKeyBuffer)
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
