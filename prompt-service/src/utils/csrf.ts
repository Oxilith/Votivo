/**
 * @file prompt-service/src/utils/csrf.ts
 * @purpose CSRF token generation and validation utilities
 * @functionality
 * - Generates cryptographically secure CSRF tokens
 * - Validates tokens using timing-safe comparison
 * - Provides constants for header and cookie names
 * @dependencies
 * - crypto for secure token generation and timing-safe comparison
 */

import crypto from 'crypto';

/**
 * CSRF cookie name
 */
export const CSRF_COOKIE = 'csrf-token';

/**
 * CSRF header name for requests
 */
export const CSRF_HEADER = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 *
 * @returns 64-character hex string (32 bytes of randomness)
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token using timing-safe comparison
 *
 * This prevents timing attacks by ensuring the comparison
 * takes constant time regardless of where tokens differ.
 *
 * @param token - Token from request header
 * @param expected - Token from cookie
 * @returns True if tokens match
 */
export function validateCsrfToken(token: string, expected: string): boolean {
  // Length check first (not timing-sensitive for different lengths)
  if (!token || !expected || token.length !== expected.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
}
