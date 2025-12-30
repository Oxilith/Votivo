/**
 * @file prompt-service/src/services/user.service.ts
 * @purpose User authentication operations with JWT token management
 * @functionality
 * - Registers new users with hashed passwords
 * - Authenticates users and issues JWT access/refresh tokens
 * - Implements progressive account lockout after failed login attempts
 * - Refreshes access tokens using valid refresh tokens
 * - Initiates password reset with email delivery
 * - Confirms password reset with token validation
 * - Verifies email addresses with token validation
 * - Invalidates refresh tokens on logout
 * @dependencies
 * - @/prisma/client for database access
 * - @/utils/jwt for token generation/verification
 * - @/utils/password for bcrypt hashing
 * - @/utils/token for secure token generation
 * - @/services/email.service for email delivery
 * - @/config for application configuration
 * - @/errors for custom error types
 * - shared/auth.types for Gender type
 */

import { prisma } from '@/prisma';
import type { User } from '@prisma/client';
import { config } from '@/config';
import {
  NotFoundError,
  ConflictError,
  AuthenticationError,
  TokenError,
  ValidationError,
} from '@/errors';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenId,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  logger,
  type JwtConfig,
} from '@/utils';
import { emailService } from '@/services/email.service';
import type { Gender } from 'shared';

// Re-export Gender for backward compatibility
export type { Gender };

/**
 * Token expiry constants in milliseconds
 */
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * User data without sensitive fields
 * Uses Omit to structurally enforce password exclusion
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * Input for user registration
 */
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  gender?: Gender;
  birthYear: number;
}

/**
 * Input for user login
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Input for profile update
 */
export interface ProfileUpdateInput {
  name?: string;
  gender?: Gender;
  birthYear?: number;
}

/**
 * Input for password change
 */
export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Saved assessment with metadata
 */
export interface SavedAssessment {
  id: string;
  userId: string;
  responses: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Saved analysis with metadata
 */
export interface SavedAnalysis {
  id: string;
  userId: string;
  assessmentId: string | null;
  result: string; // JSON string
  createdAt: Date;
}

/**
 * Result of successful authentication
 *
 * Note: emailVerificationSent is optional because email verification is not required.
 * The system works without SMTP configured - this is intentional for deployments
 * that don't need email verification.
 */
export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  /** Whether verification email was sent (false if SMTP not configured) */
  emailVerificationSent?: boolean;
}

/**
 * Result of token refresh
 */
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Result of registration request
 * Returns generic message to prevent email enumeration
 */
export interface RegistrationResult {
  success: true;
  message: string;
}


/**
 * Strips sensitive fields from user object
 */
function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    name: user.name,
    gender: user.gender as Gender | null,
    birthYear: user.birthYear,
    failedLoginAttempts: user.failedLoginAttempts,
    lockoutUntil: user.lockoutUntil,
    lastFailedLoginAt: user.lastFailedLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  private jwtConfig: JwtConfig;

  constructor() {
    // Build JWT config from application configuration
    // Use fallback secrets in development for testing
    this.jwtConfig = {
      accessSecret: config.jwtAccessSecret ?? 'dev-access-secret-change-in-production',
      refreshSecret: config.jwtRefreshSecret ?? 'dev-refresh-secret-change-in-production',
      accessExpiresIn: config.jwtAccessExpiry,
      refreshExpiresIn: config.jwtRefreshExpiry,
    };
  }

  /**
   * Register a new user account
   * Creates user with hashed password and optionally sends verification email
   *
   * Security: Uses timing-safe comparison to prevent enumeration via timing attacks.
   * Returns tokens immediately - email verification is optional (for SMTP-less deployments).
   *
   * @param input - Registration details (email, password)
   * @returns Authentication result with user and tokens, or throws ConflictError
   * @throws ConflictError if email already exists
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      // Hash dummy password to prevent timing attacks
      await hashPassword('dummy-password-for-timing');
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user and tokens in a transaction
    const { user, refreshTokenRecord, emailVerifyToken } = await prisma.$transaction(async (tx) => {
      // Create user with profile fields
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          password: hashedPassword,
          name: input.name,
          gender: input.gender ?? null,
          birthYear: input.birthYear,
        },
      });

      // Generate and store refresh token
      const tokenId = generateTokenId();
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
      const refreshTokenValue = generateRefreshToken(newUser.id, tokenId, this.jwtConfig);

      const newRefreshToken = await tx.refreshToken.create({
        data: {
          userId: newUser.id,
          token: tokenId,
          expiresAt,
        },
      });

      // Generate and store email verification token
      const verificationToken = generateEmailVerificationToken();
      const verifyExpiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRY_MS);

      const newEmailVerifyToken = await tx.emailVerifyToken.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          expiresAt: verifyExpiresAt,
        },
      });

      return {
        user: newUser,
        refreshTokenRecord: { ...newRefreshToken, tokenValue: refreshTokenValue },
        emailVerifyToken: newEmailVerifyToken,
      };
    });

    // Send verification email (don't fail registration if email fails)
    // This is optional - the system works without SMTP configured
    const emailResult = await emailService.sendEmailVerificationEmail({
      to: user.email,
      verificationToken: emailVerifyToken.token,
    });

    // Log email result but don't fail registration
    if (!emailResult.success) {
      logger.warn(
        {
          userId: user.id,
          email: user.email,
          error: emailResult.error,
          skipped: emailResult.skipped,
        },
        emailResult.skipped
          ? 'Verification email skipped (SMTP not configured in development)'
          : 'Verification email not sent (SMTP may not be configured)'
      );
    }

    // Generate access token
    const accessToken = generateAccessToken(user.id, this.jwtConfig);

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken: refreshTokenRecord.tokenValue,
      emailVerificationSent: emailResult.success,
    };
  }

  /**
   * Authenticate a user with email and password
   *
   * Security features:
   * - Timing-safe comparison to prevent enumeration attacks
   * - Progressive account lockout after failed attempts
   * - Lockout duration doubles with each successive lockout (15min -> 30min -> 60min...)
   *
   * @param input - Login credentials (email, password)
   * @returns Authentication result with user and tokens
   * @throws AuthenticationError if credentials are invalid or account is locked
   */
  async login(input: LoginInput): Promise<AuthResult> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    // Check lockout status first (even for non-existent users to prevent enumeration)
    if (user?.lockoutUntil && user.lockoutUntil > new Date()) {
      // Use timing-safe hash even in lockout path
      await hashPassword('dummy-password-for-timing');
      // Use generic message to prevent timing-based account enumeration
      throw new AuthenticationError(
        'Account temporarily locked due to too many failed attempts. Please try again later.'
      );
    }

    // Use constant-time comparison to prevent timing attacks
    // Always hash password even if user doesn't exist
    if (!user) {
      // Hash a dummy password to prevent timing-based user enumeration
      await hashPassword('dummy-password-for-timing');
      throw new AuthenticationError();
    }

    // Verify password
    const isValidPassword = await comparePassword(input.password, user.password);
    if (!isValidPassword) {
      // Increment failed attempts and potentially lock account
      await this.handleFailedLogin(user);
      throw new AuthenticationError();
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lastFailedLoginAt: null,
        },
      });
    }

    // Generate and store refresh token
    const tokenId = generateTokenId();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    const refreshTokenValue = generateRefreshToken(user.id, tokenId, this.jwtConfig);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenId,
        expiresAt,
      },
    });

    // Generate access token
    const accessToken = generateAccessToken(user.id, this.jwtConfig);

    // Get fresh user data with reset lockout fields
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return {
      user: toSafeUser(freshUser ?? user),
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  /**
   * Handle failed login attempt - increment counter and potentially lock account
   *
   * @param user - The user who failed to login
   */
  private async handleFailedLogin(user: User): Promise<void> {
    const newAttempts = user.failedLoginAttempts + 1;
    const updateData: {
      failedLoginAttempts: number;
      lastFailedLoginAt: Date;
      lockoutUntil?: Date;
    } = {
      failedLoginAttempts: newAttempts,
      lastFailedLoginAt: new Date(),
    };

    // Check if we've hit the lockout threshold
    if (newAttempts >= config.lockout.maxAttempts) {
      const lockoutDuration = this.calculateLockoutDuration(newAttempts);
      updateData.lockoutUntil = new Date(Date.now() + lockoutDuration);
      logger.warn(
        { userId: user.id, attempts: newAttempts, lockoutMins: lockoutDuration / 60000 },
        'Account locked due to failed login attempts'
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  /**
   * Calculate progressive lockout duration
   * First lockout: initialDurationMins, then doubles (15 -> 30 -> 60 -> 120...) up to max
   *
   * @param attempts - Total number of failed attempts
   * @returns Lockout duration in milliseconds
   */
  private calculateLockoutDuration(attempts: number): number {
    const { maxAttempts, initialDurationMins, maxDurationMins } = config.lockout;
    // Calculate how many times the user has been locked out (0-indexed)
    const lockoutCount = Math.floor((attempts - 1) / maxAttempts);
    // Double the duration for each lockout, capped at max
    const durationMins = Math.min(
      initialDurationMins * Math.pow(2, lockoutCount),
      maxDurationMins
    );
    return durationMins * 60 * 1000; // Convert to ms
  }

  /**
   * Refresh access token using a valid refresh token
   *
   * Security: Uses database transaction to prevent race conditions where
   * concurrent refresh requests with the same token could both succeed.
   * The lookup, validation, and rotation all happen atomically.
   *
   * @param refreshTokenJwt - The JWT refresh token
   * @returns New access and refresh tokens
   * @throws TokenError if refresh token is invalid or expired
   */
  async refreshTokens(refreshTokenJwt: string): Promise<RefreshResult> {
    // Verify the refresh token JWT (cryptographic verification before DB lookup)
    const verifyResult = verifyRefreshToken(refreshTokenJwt, this.jwtConfig);

    if (!verifyResult.success) {
      const errorMessage = verifyResult.error === 'expired'
        ? 'Refresh token expired'
        : 'Invalid refresh token';
      throw new TokenError(errorMessage, verifyResult.error === 'expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN');
    }

    // After success check, TypeScript knows payload is non-null due to discriminated union
    const { userId, tokenId } = verifyResult.payload;

    // Prepare new token values before transaction
    const newTokenId = generateTokenId();
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    const newRefreshTokenValue = generateRefreshToken(userId, newTokenId, this.jwtConfig);

    // Atomic transaction: lookup, validate, and rotate in one operation
    // This prevents race conditions where concurrent requests could both succeed
    await prisma.$transaction(async (tx) => {
      // Find the refresh token in database (inside transaction for atomicity)
      const storedToken = await tx.refreshToken.findUnique({
        where: { token: tokenId },
      });

      // Validate stored token
      if (!storedToken || storedToken.userId !== userId) {
        throw new TokenError('Invalid refresh token');
      }

      // Check if token is expired in database
      if (storedToken.expiresAt < new Date()) {
        // Clean up expired token
        await tx.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new TokenError('Refresh token expired', 'TOKEN_EXPIRED');
      }

      // Delete old token and create new one atomically
      await tx.refreshToken.delete({
        where: { id: storedToken.id },
      });

      await tx.refreshToken.create({
        data: {
          userId,
          token: newTokenId,
          expiresAt: newExpiresAt,
        },
      });
    });

    // Generate new access token
    const accessToken = generateAccessToken(userId, this.jwtConfig);

    return {
      accessToken,
      refreshToken: newRefreshTokenValue,
    };
  }

  /**
   * Initiate password reset flow
   * Generates reset token and sends email
   *
   * @param email - User's email address
   * @returns True if email was sent (always returns true to prevent enumeration)
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return true;
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

    // Store token in database
    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email
    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      resetToken,
    });

    // Handle email failure (still return true to prevent enumeration)
    if (!emailResult.success) {
      // In development mode with no SMTP, just log warning
      if (emailResult.skipped) {
        logger.warn(
          { userId: user.id, skipped: true },
          'Password reset email skipped (SMTP not configured in development)'
        );
      } else {
        // Real email failure - clean up token
        await prisma.passwordResetToken.delete({
          where: { id: tokenRecord.id },
        });
        logger.error(
          { userId: user.id, error: emailResult.error },
          'Password reset email failed, token cleaned up'
        );
      }
    }

    return true;
  }

  /**
   * Complete password reset with token validation
   *
   * @param token - Password reset token from email
   * @param newPassword - New password to set
   * @throws TokenError if token is invalid or expired
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token exists and hasn't been used
    if (!resetToken || resetToken.usedAt !== null) {
      throw new TokenError('Invalid or expired password reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new TokenError('Password reset token expired', 'TOKEN_EXPIRED');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used in transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all refresh tokens for security
      await tx.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });
  }

  /**
   * Verify user's email address
   *
   * @param token - Email verification token
   * @throws TokenError if token is invalid or expired
   */
  async verifyEmail(token: string): Promise<SafeUser> {
    // Find the verification token
    const verifyToken = await prisma.emailVerifyToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token exists and hasn't been used
    if (!verifyToken || verifyToken.usedAt !== null) {
      throw new TokenError('Invalid or expired verification token');
    }

    // Check if token is expired
    if (verifyToken.expiresAt < new Date()) {
      throw new TokenError('Verification token expired', 'TOKEN_EXPIRED');
    }

    // Update user and mark token as used in transaction
    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: verifyToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.emailVerifyToken.update({
        where: { id: verifyToken.id },
        data: { usedAt: new Date() },
      });

      return updatedUser;
    });

    return toSafeUser(user);
  }

  /**
   * Resend email verification
   *
   * @param userId - User ID to resend verification for
   * @returns True if email was sent
   * @throws NotFoundError if user not found
   */
  async resendEmailVerification(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (user.emailVerified) {
      return false; // Already verified
    }

    // Rate limit: max 5 verification email requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokenCount = await prisma.emailVerifyToken.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentTokenCount >= 5) {
      throw new ValidationError('Too many verification email requests. Please try again later.');
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRY_MS);

    const tokenRecord = await prisma.emailVerifyToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email and check result
    const result = await emailService.sendEmailVerificationEmail({
      to: user.email,
      verificationToken,
    });

    if (!result.success) {
      // In development mode with no SMTP, log warning but don't fail
      if (result.skipped) {
        logger.warn(
          { userId, skipped: true },
          'Verification email skipped (SMTP not configured in development)'
        );
        return true;
      }

      // Real email failure - clean up unused token and throw error
      await prisma.emailVerifyToken.delete({
        where: { id: tokenRecord.id },
      });
      logger.error(
        { userId, error: result.error },
        'Failed to send verification email'
      );
      throw new Error('Failed to send verification email. Please try again later.');
    }

    return true;
  }

  /**
   * Logout user by invalidating refresh token
   *
   * @param refreshTokenJwt - The JWT refresh token to invalidate
   * @returns True if token was invalidated
   */
  async logout(refreshTokenJwt: string): Promise<boolean> {
    // Verify the refresh token JWT to get the token ID
    const verifyResult = verifyRefreshToken(refreshTokenJwt, this.jwtConfig);

    if (!verifyResult.success) {
      return false; // Invalid token, nothing to do
    }

    // After success check, TypeScript knows payload is non-null due to discriminated union
    const { tokenId } = verifyResult.payload;

    // Delete the refresh token from database
    const result = await prisma.refreshToken.deleteMany({
      where: { token: tokenId },
    });

    return result.count > 0;
  }

  /**
   * Logout user from all sessions by invalidating all refresh tokens
   *
   * @param userId - User ID to logout from all sessions
   * @returns Number of sessions invalidated
   */
  async logoutAll(userId: string): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Get user by ID
   *
   * @param id - User ID
   * @returns User without sensitive fields, or null if not found
   */
  async getById(id: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? toSafeUser(user) : null;
  }

  /**
   * Get user by email
   *
   * @param email - User email
   * @returns User without sensitive fields, or null if not found
   */
  async getByEmail(email: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user ? toSafeUser(user) : null;
  }

  /**
   * Update user profile
   *
   * @param userId - User ID
   * @param input - Profile update data
   * @returns Updated user without sensitive fields
   * @throws NotFoundError if user not found
   */
  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.birthYear !== undefined && { birthYear: input.birthYear }),
      },
    });

    return toSafeUser(updatedUser);
  }

  /**
   * Change user password
   *
   * @param userId - User ID
   * @param input - Current and new password
   * @throws NotFoundError if user not found
   * @throws AuthenticationError if current password is wrong
   */
  async changePassword(userId: string, input: PasswordChangeInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verify current password
    const isValidPassword = await comparePassword(input.currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(input.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete user account and all related data
   *
   * @param userId - User ID
   * @throws NotFoundError if user not found
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Cascade delete will handle related records
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Save assessment for user
   *
   * @param userId - User ID
   * @param responses - Assessment responses as JSON string
   * @returns Saved assessment
   */
  async saveAssessment(userId: string, responses: string): Promise<SavedAssessment> {
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        responses,
      },
    });

    return assessment;
  }

  /**
   * Get user's assessments
   *
   * @param userId - User ID
   * @returns List of saved assessments
   */
  async getAssessments(userId: string): Promise<SavedAssessment[]> {
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return assessments;
  }

  /**
   * Get specific assessment by ID
   *
   * @param assessmentId - Assessment ID
   * @param userId - User ID for ownership verification
   * @returns Assessment or null if not found/not owned
   */
  async getAssessmentById(assessmentId: string, userId: string): Promise<SavedAssessment | null> {
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId,
      },
    });

    return assessment;
  }

  /**
   * Save analysis for user
   *
   * @param userId - User ID
   * @param result - Analysis result as JSON string
   * @param assessmentId - Optional linked assessment ID
   * @returns Saved analysis
   */
  async saveAnalysis(userId: string, result: string, assessmentId?: string): Promise<SavedAnalysis> {
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        result,
        assessmentId: assessmentId ?? null,
      },
    });

    return analysis;
  }

  /**
   * Get user's analyses
   *
   * @param userId - User ID
   * @returns List of saved analyses
   */
  async getAnalyses(userId: string): Promise<SavedAnalysis[]> {
    const analyses = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return analyses;
  }

  /**
   * Get specific analysis by ID
   *
   * @param analysisId - Analysis ID
   * @param userId - User ID for ownership verification
   * @returns Analysis or null if not found/not owned
   */
  async getAnalysisById(analysisId: string, userId: string): Promise<SavedAnalysis | null> {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    return analysis;
  }
}

// Export singleton instance
export const userService = new UserService();
