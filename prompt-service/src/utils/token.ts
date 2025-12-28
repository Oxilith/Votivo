/**
 * @file prompt-service/src/utils/token.ts
 * @purpose Token generation utilities for authentication flows
 * @functionality
 * - Generates cryptographically secure random tokens
 * - Used for password reset and email verification tokens
 * - Provides configurable token length for different use cases
 * @dependencies
 * - crypto (Node.js built-in)
 */

import crypto from 'crypto';

/**
 * Default length in bytes for generated tokens.
 * 32 bytes = 256 bits of entropy, resulting in a 64-character hex string.
 */
const DEFAULT_TOKEN_LENGTH = 32;

/**
 * Generates a cryptographically secure random token.
 *
 * @param length - The number of bytes for the token (default: 32)
 * @returns A hex-encoded random token string
 *
 * @example
 * const token = generateSecureToken();
 * // token will be a 64-character hex string like '7f3a2b1c...'
 */
export function generateSecureToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generates a token specifically for password reset flows.
 * Uses 32 bytes (256 bits) of entropy for high security.
 *
 * @returns A 64-character hex-encoded token
 *
 * @example
 * const resetToken = generatePasswordResetToken();
 * // Store in database with expiry time (1 hour recommended)
 */
export function generatePasswordResetToken(): string {
  return generateSecureToken(DEFAULT_TOKEN_LENGTH);
}

/**
 * Generates a token specifically for email verification flows.
 * Uses 32 bytes (256 bits) of entropy for high security.
 *
 * @returns A 64-character hex-encoded token
 *
 * @example
 * const verifyToken = generateEmailVerificationToken();
 * // Store in database with expiry time (24 hours recommended)
 */
export function generateEmailVerificationToken(): string {
  return generateSecureToken(DEFAULT_TOKEN_LENGTH);
}

/**
 * Generates a unique identifier suitable for database records.
 * Uses 16 bytes (128 bits) of entropy, resulting in a 32-character hex string.
 *
 * @returns A 32-character hex-encoded unique identifier
 *
 * @example
 * const tokenId = generateTokenId();
 * // Use as unique identifier for refresh tokens in database
 */
export function generateTokenId(): string {
  return generateSecureToken(16);
}
