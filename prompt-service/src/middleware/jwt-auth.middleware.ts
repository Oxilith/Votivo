/**
 * @file prompt-service/src/middleware/jwt-auth.middleware.ts
 * @purpose JWT authentication middleware for protecting user routes
 * @functionality
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT access tokens using configured secrets
 * - Attaches decoded user payload to request for downstream handlers
 * - Returns 401 Unauthorized for missing, invalid, or expired tokens
 * @dependencies
 * - @/utils/jwt for token verification
 * - @/config for configuration
 * - express for Request, Response, NextFunction types
 */

import type { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { verifyAccessToken, type AccessTokenPayload, type JwtConfig } from '@/utils';

/**
 * Extended Express Request with authenticated user payload
 */
export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

/**
 * Type guard to check if request is authenticated
 */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

/**
 * JWT configuration for middleware
 */
function getJwtConfig(): JwtConfig | null {
  if (!config.jwtAccessSecret || !config.jwtRefreshSecret) {
    return null;
  }

  return {
    accessSecret: config.jwtAccessSecret,
    refreshSecret: config.jwtRefreshSecret,
    accessExpiresIn: config.jwtAccessExpiry,
    refreshExpiresIn: config.jwtRefreshExpiry,
  };
}

/**
 * Extracts Bearer token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The token string or null if not valid Bearer format
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
}

/**
 * JWT authentication middleware for protecting routes.
 * Validates access tokens from the Authorization header.
 *
 * Usage:
 * ```typescript
 * router.get('/protected', jwtAuthMiddleware, (req, res) => {
 *   const { userId } = (req as AuthenticatedRequest).user;
 *   // ... handle request
 * });
 * ```
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get JWT configuration
  const jwtConfig = getJwtConfig();

  // Check if JWT is configured
  if (!jwtConfig) {
    res.status(503).json({
      error: 'Authentication service not configured',
    });
    return;
  }

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    res.status(401).json({
      error: 'Authorization required',
      code: 'NO_TOKEN',
    });
    return;
  }

  // Verify the access token
  const verificationResult = verifyAccessToken(token, jwtConfig);

  if (!verificationResult.success) {
    // Provide specific error messages for different failure types
    if (verificationResult.error === 'expired') {
      res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    // Invalid token (malformed, wrong signature, etc.)
    res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  // Token is valid - attach user payload to request
  // After success check above, TypeScript knows payload is non-null due to discriminated union
  (req as AuthenticatedRequest).user = verificationResult.payload;
  next();
}

/**
 * Optional JWT authentication middleware.
 * Similar to jwtAuthMiddleware but allows requests without tokens.
 * If a valid token is provided, user payload is attached to request.
 * If no token or invalid token, request proceeds without user payload.
 *
 * Useful for routes that have different behavior for authenticated vs. anonymous users.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function optionalJwtAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Get JWT configuration
  const jwtConfig = getJwtConfig();

  if (!jwtConfig) {
    // No JWT configured - proceed without authentication
    next();
    return;
  }

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    // No token provided - proceed without authentication
    next();
    return;
  }

  // Verify the access token
  const verificationResult = verifyAccessToken(token, jwtConfig);

  if (verificationResult.success) {
    // Token is valid - attach user payload to request
    // When success is true, TypeScript knows payload is non-null due to discriminated union
    (req as AuthenticatedRequest).user = verificationResult.payload;
  }

  // Proceed regardless of token validity
  next();
}
