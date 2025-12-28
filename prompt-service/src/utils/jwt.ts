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

import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

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
 * Result of token verification
 */
export interface TokenVerificationResult<T> {
  success: boolean;
  payload: T | null;
  error: 'invalid' | 'expired' | null;
}

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
    expiresIn: config.accessExpiresIn,
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
    expiresIn: config.refreshExpiresIn,
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
    const decoded = jwt.verify(token, config.accessSecret) as AccessTokenPayload;

    // Validate token type to prevent using refresh token as access token
    if (decoded.type !== 'access') {
      return {
        success: false,
        payload: null,
        error: 'invalid',
      };
    }

    return {
      success: true,
      payload: decoded,
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
    const decoded = jwt.verify(token, config.refreshSecret) as RefreshTokenPayload;

    // Validate token type to prevent using access token as refresh token
    if (decoded.type !== 'refresh') {
      return {
        success: false,
        payload: null,
        error: 'invalid',
      };
    }

    return {
      success: true,
      payload: decoded,
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
