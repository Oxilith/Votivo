/**
 * @file shared/src/auth.types.ts
 * @purpose Shared authentication types used across app and backend
 * @functionality
 * - Provides Gender type for user profiles
 * - Provides SafeUserResponse for API responses (with serialized dates)
 * @dependencies
 * - None (pure TypeScript types)
 */

/**
 * Gender options for user profile
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

/**
 * User data without sensitive fields (API response format)
 * Uses string for dates as they are serialized in JSON responses
 */
export interface SafeUserResponse {
  id: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  name: string;
  gender: Gender;
  birthYear: number;
  createdAt: string;
  updatedAt: string;
}
