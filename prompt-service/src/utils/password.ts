/**
 * @file prompt-service/src/utils/password.ts
 * @purpose Password hashing and verification utilities using bcrypt
 * @functionality
 * - Hashes passwords with bcrypt using configurable salt rounds
 * - Compares plaintext passwords against hashed passwords
 * - Uses async methods to avoid blocking the event loop
 * @dependencies
 * - bcryptjs for password hashing
 */

import bcrypt from 'bcryptjs';

/**
 * Default number of salt rounds for bcrypt hashing.
 * Higher values are more secure but slower.
 * 10 is a good balance for most applications.
 */
const DEFAULT_SALT_ROUNDS = 10;

/**
 * Configuration for password operations
 */
export interface PasswordConfig {
  saltRounds: number;
}

/**
 * Creates a password configuration from environment variables.
 *
 * @returns Password configuration with salt rounds
 */
export function createPasswordConfig(): PasswordConfig {
  const saltRoundsEnv = process.env['BCRYPT_SALT_ROUNDS'];
  const saltRounds = saltRoundsEnv ? parseInt(saltRoundsEnv, 10) : DEFAULT_SALT_ROUNDS;

  // Ensure valid salt rounds (bcrypt accepts 4-31)
  if (isNaN(saltRounds) || saltRounds < 4 || saltRounds > 31) {
    return { saltRounds: DEFAULT_SALT_ROUNDS };
  }

  return { saltRounds };
}

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param password - The plaintext password to hash
 * @param config - Password configuration with salt rounds (optional, uses default if not provided)
 * @returns The bcrypt hash of the password
 *
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 * // hash will be something like '$2b$10$...'
 */
export async function hashPassword(
  password: string,
  config?: PasswordConfig
): Promise<string> {
  const { saltRounds } = config ?? createPasswordConfig();
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 *
 * @param password - The plaintext password to check
 * @param hash - The bcrypt hash to compare against
 * @returns True if the password matches the hash, false otherwise
 *
 * @example
 * const isValid = await comparePassword('mySecurePassword123', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
