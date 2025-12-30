/**
 * @file shared/src/testing/matchers/index.ts
 * @purpose Custom Vitest matchers with TypeScript type augmentation
 * @functionality
 * - toBeValidJWT: Validates JWT format (header.payload.signature)
 * - toBeValidUUID: Validates UUID v4 format
 * - toBeWithinSeconds: Compares dates within a tolerance
 * @dependencies
 * - vitest for matcher extension
 */

import { expect } from 'vitest';

// Augment Vitest's expect types with custom matchers
declare module 'vitest' {
  interface Assertion<T> {
    /**
     * Asserts that the value is a valid JWT format (header.payload.signature)
     *
     * @example
     * expect(token).toBeValidJWT();
     */
    toBeValidJWT(): T;

    /**
     * Asserts that the value is a valid UUID v4 format
     *
     * @example
     * expect(id).toBeValidUUID();
     */
    toBeValidUUID(): T;

    /**
     * Asserts that a date is within the specified number of seconds of another date
     *
     * @param expected - The date to compare against
     * @param seconds - Maximum allowed difference in seconds
     *
     * @example
     * expect(createdAt).toBeWithinSeconds(new Date(), 5);
     */
    toBeWithinSeconds(expected: Date, seconds: number): T;
  }

  interface AsymmetricMatchersContaining {
    toBeValidJWT(): unknown;
    toBeValidUUID(): unknown;
    toBeWithinSeconds(expected: Date, seconds: number): unknown;
  }
}

// Register custom matchers
expect.extend({
  /**
   * Validates that a string is in valid JWT format.
   * JWTs consist of three base64url-encoded parts separated by dots.
   */
  toBeValidJWT(received: unknown) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () =>
          `Expected a string JWT, but received ${typeof received}`,
      };
    }

    // JWT format: base64url.base64url.base64url (signature can be empty for unsecured JWTs)
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
    const pass = jwtRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected "${received}" not to be a valid JWT`
          : `Expected "${received}" to be a valid JWT (format: header.payload.signature)`,
    };
  },

  /**
   * Validates that a string is a valid UUID v4.
   * UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * where y is one of 8, 9, a, or b
   */
  toBeValidUUID(received: unknown) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () =>
          `Expected a string UUID, but received ${typeof received}`,
      };
    }

    // UUID v4 regex - version 4, variant 1 (8, 9, a, b)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected "${received}" not to be a valid UUID v4`
          : `Expected "${received}" to be a valid UUID v4`,
    };
  },

  /**
   * Validates that a date is within the specified number of seconds of another date.
   * Useful for testing timestamps that should be close to "now" or another reference time.
   */
  toBeWithinSeconds(received: unknown, expected: Date, seconds: number) {
    if (!(received instanceof Date)) {
      return {
        pass: false,
        message: () =>
          `Expected a Date object, but received ${typeof received}`,
      };
    }

    if (!(expected instanceof Date)) {
      return {
        pass: false,
        message: () =>
          `Expected comparison date to be a Date object, but received ${typeof expected}`,
      };
    }

    const diffMs = Math.abs(received.getTime() - expected.getTime());
    const diffSeconds = diffMs / 1000;
    const pass = diffSeconds <= seconds;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received.toISOString()} not to be within ${seconds}s of ${expected.toISOString()}`
          : `Expected ${received.toISOString()} to be within ${seconds}s of ${expected.toISOString()} (actual diff: ${diffSeconds.toFixed(2)}s)`,
    };
  },
});

// Export empty object to make this a module
export {};
