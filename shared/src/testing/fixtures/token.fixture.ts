/**
 * @file shared/src/testing/fixtures/token.fixture.ts
 * @purpose Factory functions for creating mock authentication token data
 * @functionality
 * - Creates mock refresh tokens with family tracking
 * - Creates mock password reset tokens
 * - Creates mock email verification tokens
 * - Creates expired token variants for testing expiration logic
 * @dependencies
 * - @faker-js/faker for realistic data generation
 */

import { faker } from '@faker-js/faker';

/**
 * Options for creating a mock RefreshToken record
 */
export interface MockRefreshTokenOptions {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt?: Date;
  createdAt?: Date;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  familyId?: string;
  isRevoked?: boolean;
}

/**
 * Mock RefreshToken database record
 */
export interface MockRefreshTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  deviceInfo: string | null;
  ipAddress: string | null;
  familyId: string;
  isRevoked: boolean;
}

// Default token expiration: 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Creates a mock RefreshToken database record.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock RefreshToken record
 *
 * @example
 * ```typescript
 * const token = createMockRefreshToken({
 *   userId: 'user-123',
 *   deviceInfo: 'Mozilla/5.0...',
 * });
 * ```
 */
export function createMockRefreshToken(
  options: MockRefreshTokenOptions = {}
): MockRefreshTokenRecord {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    token: options.token ?? faker.string.alphanumeric(64),
    expiresAt: options.expiresAt ?? new Date(now.getTime() + REFRESH_TOKEN_EXPIRY_MS),
    createdAt: options.createdAt ?? now,
    deviceInfo: options.deviceInfo ?? null,
    ipAddress: options.ipAddress ?? null,
    familyId: options.familyId ?? faker.string.uuid(),
    isRevoked: options.isRevoked ?? false,
  };
}

/**
 * Creates an expired refresh token.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock RefreshToken record with expired expiresAt
 */
export function createExpiredRefreshToken(
  options: MockRefreshTokenOptions = {}
): MockRefreshTokenRecord {
  return createMockRefreshToken({
    ...options,
    expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
  });
}

/**
 * Creates a revoked refresh token.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock RefreshToken record with isRevoked set to true
 */
export function createRevokedRefreshToken(
  options: MockRefreshTokenOptions = {}
): MockRefreshTokenRecord {
  return createMockRefreshToken({
    ...options,
    isRevoked: true,
  });
}

/**
 * Options for creating a mock PasswordResetToken record
 */
export interface MockPasswordResetTokenOptions {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt?: Date;
  usedAt?: Date | null;
  createdAt?: Date;
}

/**
 * Mock PasswordResetToken database record
 */
export interface MockPasswordResetTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// Default password reset token expiration: 1 hour
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Creates a mock PasswordResetToken database record.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock PasswordResetToken record
 *
 * @example
 * ```typescript
 * const token = createMockPasswordResetToken({ userId: 'user-123' });
 * ```
 */
export function createMockPasswordResetToken(
  options: MockPasswordResetTokenOptions = {}
): MockPasswordResetTokenRecord {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    token: options.token ?? faker.string.alphanumeric(64),
    expiresAt: options.expiresAt ?? new Date(now.getTime() + PASSWORD_RESET_EXPIRY_MS),
    usedAt: options.usedAt ?? null,
    createdAt: options.createdAt ?? now,
  };
}

/**
 * Creates an expired password reset token.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock PasswordResetToken record with expired expiresAt
 */
export function createExpiredPasswordResetToken(
  options: MockPasswordResetTokenOptions = {}
): MockPasswordResetTokenRecord {
  return createMockPasswordResetToken({
    ...options,
    expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
  });
}

/**
 * Creates a used password reset token.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock PasswordResetToken record with usedAt set
 */
export function createUsedPasswordResetToken(
  options: MockPasswordResetTokenOptions = {}
): MockPasswordResetTokenRecord {
  return createMockPasswordResetToken({
    ...options,
    usedAt: new Date(),
  });
}

/**
 * Options for creating a mock EmailVerifyToken record
 */
export interface MockEmailVerifyTokenOptions {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt?: Date;
  usedAt?: Date | null;
  createdAt?: Date;
}

/**
 * Mock EmailVerifyToken database record
 */
export interface MockEmailVerifyTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// Default email verification token expiration: 24 hours
const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Creates a mock EmailVerifyToken database record.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock EmailVerifyToken record
 *
 * @example
 * ```typescript
 * const token = createMockEmailVerificationToken({ userId: 'user-123' });
 * ```
 */
export function createMockEmailVerificationToken(
  options: MockEmailVerifyTokenOptions = {}
): MockEmailVerifyTokenRecord {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    token: options.token ?? faker.string.alphanumeric(64),
    expiresAt: options.expiresAt ?? new Date(now.getTime() + EMAIL_VERIFY_EXPIRY_MS),
    usedAt: options.usedAt ?? null,
    createdAt: options.createdAt ?? now,
  };
}

/**
 * Creates an expired email verification token.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock EmailVerifyToken record with expired expiresAt
 */
export function createExpiredEmailVerificationToken(
  options: MockEmailVerifyTokenOptions = {}
): MockEmailVerifyTokenRecord {
  return createMockEmailVerificationToken({
    ...options,
    expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
  });
}

/**
 * Creates a used email verification token.
 *
 * @param options - Optional overrides for token properties
 * @returns Mock EmailVerifyToken record with usedAt set
 */
export function createUsedEmailVerificationToken(
  options: MockEmailVerifyTokenOptions = {}
): MockEmailVerifyTokenRecord {
  return createMockEmailVerificationToken({
    ...options,
    usedAt: new Date(),
  });
}

/**
 * Creates a token family (multiple refresh tokens sharing the same familyId).
 * Useful for testing token rotation and family revocation.
 *
 * @param count - Number of tokens in the family
 * @param options - Optional overrides applied to all tokens
 * @returns Array of RefreshToken records with the same familyId
 *
 * @example
 * ```typescript
 * const family = createTokenFamily(3, { userId: 'user-123' });
 * // family[0], family[1], family[2] all have the same familyId
 * ```
 */
export function createTokenFamily(
  count: number,
  options: MockRefreshTokenOptions = {}
): MockRefreshTokenRecord[] {
  const familyId = options.familyId ?? faker.string.uuid();
  const userId = options.userId ?? faker.string.uuid();

  return Array.from({ length: count }, (_, index) =>
    createMockRefreshToken({
      ...options,
      userId,
      familyId,
      // Each subsequent token is created 1 hour after the previous
      createdAt: new Date(Date.now() - (count - index - 1) * 60 * 60 * 1000),
    })
  );
}
