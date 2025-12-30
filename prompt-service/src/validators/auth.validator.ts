/**
 * @file prompt-service/src/validators/auth.validator.ts
 * @purpose Zod validation schemas for authentication API endpoints
 * @functionality
 * - Validates user registration requests
 * - Validates login requests
 * - Validates password reset requests (request and confirm)
 * - Validates email verification token parameters
 * - Validates profile update requests
 * - Validates password change requests
 * - Provides type-safe request body parsing
 * @dependencies
 * - zod for schema validation
 * - shared/index for password validation constants
 */

import { z } from 'zod';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from 'shared';

/**
 * Maximum email length to prevent abuse
 */
export const MAX_EMAIL_LENGTH = 254;

/**
 * Maximum name length
 */
export const MAX_NAME_LENGTH = 100;

/**
 * Valid gender options
 */
export const VALID_GENDERS = ['male', 'female', 'other', 'prefer-not-to-say'] as const;
export type Gender = (typeof VALID_GENDERS)[number];

/**
 * Birth year bounds (for reasonable age validation)
 */
export const MIN_BIRTH_YEAR = 1900;
export const MAX_BIRTH_YEAR = new Date().getFullYear() - 13; // Minimum age 13

/**
 * Schema for user registration
 * POST /api/auth/register
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(MAX_EMAIL_LENGTH, `Email must be at most ${MAX_EMAIL_LENGTH} characters`)
    .email('Invalid email format'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  gender: z
    .enum(VALID_GENDERS)
    .optional(),
  birthYear: z
    .number()
    .int('Birth year must be a whole number')
    .min(MIN_BIRTH_YEAR, `Birth year must be at least ${MIN_BIRTH_YEAR}`)
    .max(MAX_BIRTH_YEAR, `You must be at least 13 years old`),
});

/**
 * Schema for user login
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(MAX_EMAIL_LENGTH)
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_LENGTH),
});

/**
 * Schema for password reset request
 * POST /api/auth/password-reset
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(MAX_EMAIL_LENGTH)
    .email('Invalid email format'),
});

/**
 * Schema for password reset confirmation
 * POST /api/auth/password-reset/confirm
 */
export const passwordResetConfirmSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE),
});

/**
 * Schema for email verification token parameter
 * GET /api/auth/verify-email/:token
 */
export const emailVerifyTokenParamSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
});

/**
 * Schema for resend email verification request
 * POST /api/auth/resend-verification
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(MAX_EMAIL_LENGTH)
    .email('Invalid email format'),
});

/**
 * Schema for profile update (PATCH-style)
 * PUT /api/user-auth/profile
 * All fields are optional - only update what's provided
 * If a field is provided, it must meet validation requirements
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
    .optional(),
  gender: z
    .enum(VALID_GENDERS)
    .optional(),
  birthYear: z
    .number()
    .int('Birth year must be a whole number')
    .min(MIN_BIRTH_YEAR, `Birth year must be at least ${MIN_BIRTH_YEAR}`)
    .max(MAX_BIRTH_YEAR, `You must be at least 13 years old`)
    .optional(),
});

/**
 * Schema for password change
 * PUT /api/user-auth/password
 */
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required')
    .max(PASSWORD_MAX_LENGTH),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE),
});

// Type exports for type-safe request handling
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
