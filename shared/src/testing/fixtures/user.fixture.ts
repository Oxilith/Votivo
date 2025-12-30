/**
 * @file shared/src/testing/fixtures/user.fixture.ts
 * @purpose Factory functions for creating mock user and authentication data
 * @functionality
 * - Creates mock User objects matching Prisma schema
 * - Creates SafeUserResponse objects for API responses
 * - Creates mock registration/login input data
 * - Creates batch user collections for testing
 * @dependencies
 * - @faker-js/faker for realistic data generation
 * - @/auth.types for type definitions
 * - @/validation for GENDER_VALUES constant
 */

import { faker } from '@faker-js/faker';
import type { Gender, SafeUserResponse } from '@/auth.types';
import { GENDER_VALUES } from '@/validation';

/**
 * Options for creating a mock user
 */
export interface MockUserOptions {
  id?: string;
  email?: string;
  password?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  name?: string;
  gender?: Gender;
  birthYear?: number;
  failedLoginAttempts?: number;
  lockoutUntil?: Date | null;
  lastFailedLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mock user object matching the Prisma User model
 */
export interface MockUser {
  id: string;
  email: string;
  password: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  name: string;
  gender: Gender;
  birthYear: number;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  lastFailedLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Pre-computed bcrypt hash for 'ValidPass123!' - use in tests expecting this password
export const MOCK_PASSWORD_HASH =
  '$2a$10$2tuoWcP1U6CAKF6GNx/BYuF893GuJWciKiSmZvW6jCE41BSZzpqfe';

// Default test password that meets requirements
export const MOCK_PASSWORD = 'ValidPass123!';

/**
 * Creates a mock user object matching the Prisma User model.
 *
 * @param options - Optional overrides for user properties
 * @returns Mock user object with all required fields
 *
 * @example
 * ```typescript
 * const user = createMockUser({ email: 'test@example.com' });
 * expect(user.email).toBe('test@example.com');
 * ```
 */
export function createMockUser(options: MockUserOptions = {}): MockUser {
  const now = new Date();
  const emailVerified = options.emailVerified ?? false;

  return {
    id: options.id ?? faker.string.uuid(),
    email: options.email ?? faker.internet.email().toLowerCase(),
    password: options.password ?? MOCK_PASSWORD_HASH,
    emailVerified,
    emailVerifiedAt: emailVerified
      ? (options.emailVerifiedAt ?? now)
      : (options.emailVerifiedAt ?? null),
    name: options.name ?? faker.person.fullName(),
    gender: options.gender ?? faker.helpers.arrayElement([...GENDER_VALUES]),
    birthYear: options.birthYear ?? faker.number.int({ min: 1950, max: 2005 }),
    failedLoginAttempts: options.failedLoginAttempts ?? 0,
    lockoutUntil: options.lockoutUntil ?? null,
    lastFailedLoginAt: options.lastFailedLoginAt ?? null,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates a SafeUserResponse object (API response format without password).
 * Dates are serialized to ISO strings as they would be in JSON responses.
 *
 * @param options - Optional overrides for user properties
 * @returns SafeUserResponse with serialized dates
 *
 * @example
 * ```typescript
 * const safeUser = createMockSafeUser({ emailVerified: true });
 * expect(safeUser.password).toBeUndefined();
 * expect(typeof safeUser.createdAt).toBe('string');
 * ```
 */
export function createMockSafeUser(
  options: MockUserOptions = {}
): SafeUserResponse {
  const user = createMockUser(options);

  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    name: user.name,
    gender: user.gender,
    birthYear: user.birthYear,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Options for creating mock user input (registration/login)
 */
export interface MockUserInputOptions {
  email?: string;
  password?: string;
  name?: string;
  gender?: Gender;
  birthYear?: number;
}

/**
 * Mock user registration input
 */
export interface MockUserInput {
  email: string;
  password: string;
  name: string;
  gender: Gender;
  birthYear: number;
}

/**
 * Creates mock user registration input (for API request bodies).
 * Password meets the validation requirements by default.
 *
 * @param options - Optional overrides for input fields
 * @returns Mock registration input
 *
 * @example
 * ```typescript
 * const input = createMockUserInput({ email: 'new@example.com' });
 * const response = await request.post('/api/auth/register').send(input);
 * ```
 */
export function createMockUserInput(
  options: MockUserInputOptions = {}
): MockUserInput {
  return {
    email: options.email ?? faker.internet.email().toLowerCase(),
    password: options.password ?? MOCK_PASSWORD,
    name: options.name ?? faker.person.fullName(),
    gender: options.gender ?? faker.helpers.arrayElement([...GENDER_VALUES]),
    birthYear: options.birthYear ?? faker.number.int({ min: 1950, max: 2005 }),
  };
}

/**
 * Mock login input
 */
export interface MockLoginInput {
  email: string;
  password: string;
}

/**
 * Creates mock login input (for API request bodies).
 *
 * @param options - Optional overrides for login fields
 * @returns Mock login input
 *
 * @example
 * ```typescript
 * const input = createMockLoginInput({ email: user.email });
 * const response = await request.post('/api/auth/login').send(input);
 * ```
 */
export function createMockLoginInput(
  options: Partial<MockLoginInput> = {}
): MockLoginInput {
  return {
    email: options.email ?? faker.internet.email().toLowerCase(),
    password: options.password ?? MOCK_PASSWORD,
  };
}

/**
 * Creates multiple mock users.
 *
 * @param count - Number of users to create
 * @param options - Optional overrides applied to all users
 * @returns Array of mock users
 *
 * @example
 * ```typescript
 * const users = createMockUsers(5, { emailVerified: true });
 * expect(users).toHaveLength(5);
 * users.forEach(u => expect(u.emailVerified).toBe(true));
 * ```
 */
export function createMockUsers(
  count: number,
  options: MockUserOptions = {}
): MockUser[] {
  return Array.from({ length: count }, () => createMockUser(options));
}
