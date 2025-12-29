/**
 * @file prompt-service/src/utils/jwt.ts
 * @purpose JWT utilities for token generation and verification
 * @functionality
 * - Generates access tokens with short expiry (15min default)
 * - Generates refresh tokens with longer expiry (7d default)
 * - Verifies and decodes JWT tokens
 * - Uses separate secrets for access and refresh tokens
 * - Returns structured results for consistent error handling
 * @dependencies
 * - jsonwebtoken for JWT operations
 */

import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

// CommonJS module - destructure from default export
const { JsonWebTokenError, TokenExpiredError } = jwt;

/**
 * Payload included in access tokens
 */
export interface AccessTokenPayload {
  userId: string;
  type: 'access';
}

/**
 * Payload included in refresh tokens
 */
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

/**
 * Result of token verification - discriminated union for type-safe handling
 * When success is true, payload is guaranteed to be defined
 * When success is false, error is guaranteed to be defined
 */
export type TokenVerificationResult<T> =
  | { success: true; payload: T; error: null }
  | { success: false; payload: null; error: 'invalid' | 'expired' };

/**
 * Configuration for JWT operations
 */
export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

/**
 * Generates an access token for the given user ID.
 *
 * @param userId - The user's unique identifier
 * @param config - JWT configuration with secrets and expiry settings
 * @returns The signed JWT access token
 */
export function generateAccessToken(userId: string, config: JwtConfig): string {
  const payload: AccessTokenPayload = {
    userId,
    type: 'access',
  };

  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessExpiresIn as SignOptions['expiresIn'],
  });
}

/**
 * Generates a refresh token for the given user ID.
 *
 * @param userId - The user's unique identifier
 * @param tokenId - Unique identifier for this refresh token (for revocation)
 * @param config - JWT configuration with secrets and expiry settings
 * @returns The signed JWT refresh token
 */
export function generateRefreshToken(
  userId: string,
  tokenId: string,
  config: JwtConfig
): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn as SignOptions['expiresIn'],
  });
}

/**
 * Verifies an access token and returns the decoded payload.
 *
 * @param token - The JWT access token to verify
 * @param config - JWT configuration with secrets
 * @returns Verification result with success status, payload, and error type
 */
export function verifyAccessToken(
  token: string,
  config: JwtConfig
): TokenVerificationResult<AccessTokenPayload> {
  try {
    const decoded = jwt.verify(token, config.accessSecret) as { type?: string; userId?: string };

    // Validate token type to prevent using refresh token as access token
    if (decoded.type !== 'access' || !decoded.userId) {
      return {
        success: false,
        payload: null,
        error: 'invalid',
      };
    }

    return {
      success: true,
      payload: { type: 'access', userId: decoded.userId },
      error: null,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        success: false,
        payload: null,
        error: 'expired',
      };
    }

    if (error instanceof JsonWebTokenError) {
      return {
        success: false,
        payload: null,
        error: 'invalid',
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Verifies a refresh token and returns the decoded payload.
 *
 * @param token - The JWT refresh token to verify
 * @param config - JWT configuration with secrets
 * @returns Verification result with success status, payload, and error type
 */
export function verifyRefreshToken(
  token: string,
  config: JwtConfig
): TokenVerificationResult<RefreshTokenPayload> {
  try {
    const decoded = jwt.verify(token, config.refreshSecret) as { type?: string; userId?: string; tokenId?: string };

    // Validate token type to prevent using access token as refresh token
    if (decoded.type !== 'refresh' || !decoded.userId || !decoded.tokenId) {
      return {
        success: false,
        payload: null,
        error: 'invalid',
      };
    }

    return {
      success: true,
      payload: { type: 'refresh', userId: decoded.userId, tokenId: decoded.tokenId },
      error: null,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        success: false,
        payload: null,
        error: 'expired',
      };
    }

    if (error instanceof JsonWebTokenError) {
      return {
        success: false,
        payload: null,
        error: 'invalid',
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}
