/**
 * @file prompt-service/src/utils/crypto.ts
 * @purpose Cryptographic utilities for secure authentication
 * @functionality
 * - Provides timing-safe string comparison to prevent timing attacks
 * - Pads buffers to equal length to prevent length leakage
 * - Used by authentication middleware and routes
 * @dependencies
 * - crypto (Node.js built-in)
 */

import crypto from 'crypto';

/**
 * Compares two strings in constant time to prevent timing attacks.
 * Pads both buffers to equal length to prevent leaking information about expected length.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  // Pad to equal length to prevent length-based timing attacks
  const maxLen = Math.max(aBuffer.length, bBuffer.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);

  aBuffer.copy(paddedA);
  bBuffer.copy(paddedB);

  // Compare padded buffers, then verify actual lengths match
  // Both conditions are evaluated to maintain constant time
  const buffersEqual = crypto.timingSafeEqual(paddedA, paddedB);
  const lengthsEqual = aBuffer.length === bBuffer.length;

  return buffersEqual && lengthsEqual;
}
