/**
 * @file prompt-service/src/services/__tests__/user.service.test.ts
 * @purpose Unit tests for UserService authentication and user management
 * @functionality
 * - Tests user registration with timing-safe enumeration protection
 * - Tests login authentication flow
 * - Tests token refresh and rotation
 * - Tests password reset flow (request and confirm)
 * - Tests email verification flow
 * - Tests profile management operations
 * - Tests assessment and analysis CRUD operations
 * @dependencies
 * - vitest for testing framework
 * - Prisma client mock for database operations
 * - Email service mock for email sending
 */

import type { User, RefreshToken, PasswordResetToken, EmailVerifyToken, Assessment, Analysis } from '@prisma/client';

// Define the return type for verifyRefreshToken mock
interface VerifyResult {
  success: boolean;
  payload: { userId: string; tokenId: string; type: 'refresh' } | null;
  error: 'invalid' | 'expired' | null;
}

// Create mock functions with hoisting to ensure they're available before module loading
const mockJwtFunctions = vi.hoisted(() => ({
  generateAccessToken: vi.fn(() => 'mock_access_token'),
  generateRefreshToken: vi.fn(() => 'mock_refresh_token'),
  verifyRefreshToken: vi.fn((): VerifyResult => ({
    success: true,
    payload: { userId: 'user-123', tokenId: 'token-123', type: 'refresh' as const },
    error: null,
  })),
}));

const mockTokenFunctions = vi.hoisted(() => ({
  generateTokenId: vi.fn(() => 'generated_token_id'),
  generatePasswordResetToken: vi.fn(() => 'reset_token'),
  generateEmailVerificationToken: vi.fn(() => 'email_verify_token'),
  generateFamilyId: vi.fn(() => 'family_id_123'),
  hashToken: vi.fn((token: string) => `hashed_${token}`),
}));

const mockPasswordFunctions = vi.hoisted(() => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed_password')),
  comparePassword: vi.fn(() => Promise.resolve(true)),
}));

const mockEmailServiceObj = vi.hoisted(() => ({
  sendPasswordResetEmail: vi.fn(() => Promise.resolve({ success: true })),
  sendEmailVerificationEmail: vi.fn(() => Promise.resolve({ success: true })),
}));

const mockPrismaObj = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  refreshToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  passwordResetToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  emailVerifyToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  assessment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  analysis: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock modules with hoisted values
vi.mock('@/prisma', () => ({
  prisma: mockPrismaObj,
}));

vi.mock('@/services/email.service', () => ({
  emailService: mockEmailServiceObj,
}));

vi.mock('@/utils', () => ({
  ...mockPasswordFunctions,
  ...mockJwtFunctions,
  ...mockTokenFunctions,
}));

vi.mock('@/config', () => ({
  config: {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtAccessExpiry: '15m',
    jwtRefreshExpiry: '7d',
    lockout: {
      maxAttempts: 15,
      initialDurationMins: 15,
      maxDurationMins: 1440,
    },
  },
}));

// Mock @/index.js to provide logger without loading entire app
vi.mock('@', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Mock audit service to avoid logger initialization issues
vi.mock('@/services/audit.service', () => ({
  auditLog: vi.fn(),
}));

import {
  UserService,
  type RegisterInput,
  type LoginInput,
  type ProfileUpdateInput,
  type PasswordChangeInput,
} from '@/services';
import {
  NotFoundError,
  ConflictError,
  AuthenticationError,
  TokenError,
  ValidationError,
} from '@/errors';

// Use the hoisted mocks directly
const mockPrisma = mockPrismaObj;
const mockEmailService = mockEmailServiceObj;
const mockHashPassword = mockPasswordFunctions.hashPassword;
const mockComparePassword = mockPasswordFunctions.comparePassword;
const mockVerifyRefreshToken = mockJwtFunctions.verifyRefreshToken;

describe('UserService', () => {
  let userService: UserService;

  // Sample user data for tests
  const sampleUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    gender: 'male',
    birthYear: 1990,
    emailVerified: false,
    emailVerifiedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    // Account lockout fields
    failedLoginAttempts: 0,
    lockoutUntil: null,
    lastFailedLoginAt: null,
  };

  const sampleRefreshToken: RefreshToken = {
    id: 'refresh-id',
    userId: 'user-123',
    token: 'token-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    // Token family and device tracking fields
    deviceInfo: null,
    ipAddress: null,
    familyId: 'family-123',
    isRevoked: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('register', () => {
    const registerInput: RegisterInput = {
      email: 'new@example.com',
      password: 'StrongPass123!',
      name: 'New User',
      gender: 'female',
      birthYear: 1995,
    };

    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const newUser = { ...sampleUser, email: 'new@example.com', name: 'New User' };
      const emailVerifyToken = { id: 'verify-id', userId: 'user-123', token: 'email_verify_token', expiresAt: new Date(), usedAt: null, createdAt: new Date() };

      // Mock transaction - the callback receives tx and returns the result
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          user: { create: vi.fn().mockResolvedValue(newUser) },
          refreshToken: { create: vi.fn().mockResolvedValue(sampleRefreshToken) },
          emailVerifyToken: { create: vi.fn().mockResolvedValue(emailVerifyToken) },
        };
        // The callback is expected to return { user, refreshTokenRecord, emailVerifyToken }
        const result = await (callback as (tx: typeof txMock) => Promise<unknown>)(txMock);
        return result;
      });

      const result = await userService.register(registerInput);

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.name).toBe('New User');

      // Verify password was hashed
      expect(mockHashPassword).toHaveBeenCalledWith('StrongPass123!');

      // Verify email verification was sent
      expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalledWith({
        to: 'new@example.com',
        verificationToken: 'email_verify_token',
      });
    });

    it('should throw ConflictError for existing email with timing-safe hash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

      await expect(userService.register(registerInput)).rejects.toThrow(ConflictError);

      // Verify timing-safe hash was performed
      expect(mockHashPassword).toHaveBeenCalledWith('dummy-password-for-timing');
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const newUser = { ...sampleUser, email: 'test@example.com' };
      const emailVerifyToken = { id: 'verify-id', userId: 'user-123', token: 'email_verify_token', expiresAt: new Date(), usedAt: null, createdAt: new Date() };

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          user: { create: vi.fn().mockResolvedValue(newUser) },
          refreshToken: { create: vi.fn().mockResolvedValue(sampleRefreshToken) },
          emailVerifyToken: { create: vi.fn().mockResolvedValue(emailVerifyToken) },
        };
        return (callback as (tx: typeof txMock) => Promise<unknown>)(txMock);
      });

      await userService.register({ ...registerInput, email: 'TEST@EXAMPLE.COM' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('login', () => {
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'correctPassword',
    };

    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockComparePassword.mockResolvedValue(true);
      mockPrisma.refreshToken.create.mockResolvedValue(sampleRefreshToken);

      const result = await userService.login(loginInput);

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw AuthenticationError for non-existent user with timing-safe hash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.login(loginInput)).rejects.toThrow(AuthenticationError);

      // Verify timing-safe hash was performed to prevent enumeration
      expect(mockHashPassword).toHaveBeenCalledWith('dummy-password-for-timing');
    });

    it('should throw AuthenticationError for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockComparePassword.mockResolvedValue(false);

      await expect(userService.login(loginInput)).rejects.toThrow(AuthenticationError);
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockComparePassword.mockResolvedValue(true);
      mockPrisma.refreshToken.create.mockResolvedValue(sampleRefreshToken);

      await userService.login({ ...loginInput, email: 'TEST@Example.COM' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: true,
        payload: { userId: 'user-123', tokenId: 'token-123', type: 'refresh' },
        error: null,
      });
      mockPrisma.refreshToken.findUnique.mockResolvedValue(sampleRefreshToken);
      mockPrisma.$transaction.mockResolvedValue(undefined);

      const result = await userService.refreshTokens('valid_refresh_jwt');

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });
    });

    it('should throw TokenError for invalid JWT', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: false,
        payload: null,
        error: 'invalid',
      });

      await expect(userService.refreshTokens('invalid_jwt')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError for expired JWT', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: false,
        payload: null,
        error: 'expired',
      });

      const error = await userService.refreshTokens('expired_jwt').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TokenError);
      expect((error as TokenError).code).toBe('TOKEN_EXPIRED');
    });

    it('should throw TokenError when token not found in database', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: true,
        payload: { userId: 'user-123', tokenId: 'token-123', type: 'refresh' },
        error: null,
      });
      // Mock $transaction to execute callback with tx mock
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          refreshToken: {
            findUnique: vi.fn().mockResolvedValue(null),
            delete: vi.fn(),
            create: vi.fn(),
          },
        };
        return (callback as (tx: typeof txMock) => Promise<unknown>)(txMock);
      });

      await expect(userService.refreshTokens('valid_jwt')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError when user ID mismatch', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: true,
        payload: { userId: 'different-user', tokenId: 'token-123', type: 'refresh' },
        error: null,
      });
      // Mock $transaction to execute callback with tx mock
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          refreshToken: {
            findUnique: vi.fn().mockResolvedValue(sampleRefreshToken),
            delete: vi.fn(),
            create: vi.fn(),
          },
        };
        return (callback as (tx: typeof txMock) => Promise<unknown>)(txMock);
      });

      await expect(userService.refreshTokens('valid_jwt')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError and cleanup when database token is expired', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: true,
        payload: { userId: 'user-123', tokenId: 'token-123', type: 'refresh' },
        error: null,
      });
      const expiredToken = { ...sampleRefreshToken, expiresAt: new Date(Date.now() - 1000) };
      const deleteMock = vi.fn().mockResolvedValue(expiredToken);
      // Mock $transaction to execute callback with tx mock
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          refreshToken: {
            findUnique: vi.fn().mockResolvedValue(expiredToken),
            delete: deleteMock,
            create: vi.fn(),
          },
        };
        return (callback as (tx: typeof txMock) => Promise<unknown>)(txMock);
      });

      const error = await userService.refreshTokens('valid_jwt').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TokenError);
      expect((error as TokenError).code).toBe('TOKEN_EXPIRED');
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    it('should create reset token and send email for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'reset-id',
        userId: 'user-123',
        token: 'reset_token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await userService.requestPasswordReset('test@example.com');

      expect(result).toBe(true);
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        resetToken: 'reset_token',
      });
    });

    it('should return true for non-existent user (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.requestPasswordReset('nonexistent@example.com');

      expect(result).toBe(true);
      // Should NOT create token or send email
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    const validResetToken: PasswordResetToken & { user: User } = {
      id: 'reset-id',
      userId: 'user-123',
      token: 'valid_reset_token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      createdAt: new Date(),
      user: sampleUser,
    };

    it('should reset password successfully', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validResetToken);
      mockPrisma.$transaction.mockResolvedValue(undefined);

      await userService.confirmPasswordReset('valid_reset_token', 'newPassword123');

      expect(mockHashPassword).toHaveBeenCalledWith('newPassword123');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw TokenError for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(userService.confirmPasswordReset('invalid_token', 'newPass')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError for already used token', async () => {
      const usedToken = { ...validResetToken, usedAt: new Date() };
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(usedToken);

      await expect(userService.confirmPasswordReset('used_token', 'newPass')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError for expired token', async () => {
      const expiredToken = { ...validResetToken, expiresAt: new Date(Date.now() - 1000) };
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(expiredToken);
      // Mock the opportunistic cleanup of expired token
      mockPrisma.passwordResetToken.delete.mockResolvedValue(expiredToken);

      const error = await userService.confirmPasswordReset('expired_token', 'newPass').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TokenError);
      expect((error as TokenError).code).toBe('TOKEN_EXPIRED');
      // Verify expired token was cleaned up
      expect(mockPrisma.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: expiredToken.id },
      });
    });
  });

  describe('verifyEmail', () => {
    const validEmailToken: EmailVerifyToken & { user: User } = {
      id: 'verify-id',
      userId: 'user-123',
      token: 'valid_verify_token',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
      createdAt: new Date(),
      user: sampleUser,
    };

    it('should verify email successfully', async () => {
      mockPrisma.emailVerifyToken.findUnique.mockResolvedValue(validEmailToken);
      const verifiedUser = { ...sampleUser, emailVerified: true, emailVerifiedAt: new Date() };

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          user: { update: vi.fn().mockResolvedValue(verifiedUser) },
          emailVerifyToken: { update: vi.fn().mockResolvedValue({ ...validEmailToken, usedAt: new Date() }) },
        };
        return (callback as (tx: typeof txMock) => Promise<unknown>)(txMock);
      });

      const result = await userService.verifyEmail('valid_verify_token');

      expect(result).toMatchObject({
        id: 'user-123',
        emailVerified: true,
      });
    });

    it('should throw TokenError for invalid token', async () => {
      mockPrisma.emailVerifyToken.findUnique.mockResolvedValue(null);

      await expect(userService.verifyEmail('invalid_token')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError for already used token', async () => {
      const usedToken = { ...validEmailToken, usedAt: new Date() };
      mockPrisma.emailVerifyToken.findUnique.mockResolvedValue(usedToken);

      await expect(userService.verifyEmail('used_token')).rejects.toThrow(TokenError);
    });

    it('should throw TokenError for expired token', async () => {
      const expiredToken = { ...validEmailToken, expiresAt: new Date(Date.now() - 1000) };
      mockPrisma.emailVerifyToken.findUnique.mockResolvedValue(expiredToken);

      const error = await userService.verifyEmail('expired_token').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TokenError);
      expect((error as TokenError).code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('resendEmailVerification', () => {
    it('should resend verification email successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.emailVerifyToken.count.mockResolvedValue(0);
      mockPrisma.emailVerifyToken.create.mockResolvedValue({
        id: 'verify-id',
        userId: 'user-123',
        token: 'email_verify_token',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await userService.resendEmailVerification('user-123');

      expect(result).toBe(true);
      expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.resendEmailVerification('invalid-id')).rejects.toThrow(NotFoundError);
    });

    it('should return false if already verified', async () => {
      const verifiedUser = { ...sampleUser, emailVerified: true };
      mockPrisma.user.findUnique.mockResolvedValue(verifiedUser);

      const result = await userService.resendEmailVerification('user-123');

      expect(result).toBe(false);
      expect(mockEmailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when rate limit exceeded (5 requests per hour)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.emailVerifyToken.count.mockResolvedValue(5); // At limit

      await expect(userService.resendEmailVerification('user-123')).rejects.toThrow(
        ValidationError
      );
      await expect(userService.resendEmailVerification('user-123')).rejects.toThrow(
        'Too many verification email requests'
      );
      expect(mockEmailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
    });

    it('should allow resend when under rate limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.emailVerifyToken.count.mockResolvedValue(4); // Under limit
      mockPrisma.emailVerifyToken.create.mockResolvedValue({
        id: 'verify-id',
        userId: 'user-123',
        token: 'email_verify_token',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await userService.resendEmailVerification('user-123');

      expect(result).toBe(true);
      expect(mockPrisma.emailVerifyToken.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          createdAt: { gte: expect.any(Date) as unknown as Date },
        },
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: true,
        payload: { userId: 'user-123', tokenId: 'token-123', type: 'refresh' },
        error: null,
      });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await userService.logout('valid_refresh_jwt');

      expect(result).toBe(true);
      // Verify explicit ownership check - token can only be deleted by its owner
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'token-123', userId: 'user-123' },
      });
    });

    it('should return false for invalid token', async () => {
      mockVerifyRefreshToken.mockReturnValue({
        success: false,
        payload: null,
        error: 'invalid',
      });

      const result = await userService.logout('invalid_jwt');

      expect(result).toBe(false);
    });
  });

  describe('logoutAll', () => {
    it('should logout all sessions', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await userService.logoutAll('user-123');

      expect(result).toBe(3);
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });

  describe('getById', () => {
    it('should return user without sensitive fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

      const result = await userService.getById('user-123');

      expect(result).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
      // Password should not be included
      expect(result).not.toHaveProperty('password');
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

      const result = await userService.getByEmail('test@example.com');

      expect(result).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

      await userService.getByEmail('TEST@EXAMPLE.COM');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    const updateInput: ProfileUpdateInput = {
      name: 'Updated Name',
      gender: 'other',
      birthYear: 1985,
    };

    it('should update profile successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.user.update.mockResolvedValue({ ...sampleUser, ...updateInput });

      const result = await userService.updateProfile('user-123', updateInput);

      expect(result).toMatchObject({
        name: 'Updated Name',
        gender: 'other',
        birthYear: 1985,
      });
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.updateProfile('invalid-id', updateInput)).rejects.toThrow(NotFoundError);
    });

    it('should handle partial updates', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.user.update.mockResolvedValue({ ...sampleUser, name: 'Only Name Changed' });

      await userService.updateProfile('user-123', { name: 'Only Name Changed' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'Only Name Changed' },
      });
    });
  });

  describe('changePassword', () => {
    const passwordInput: PasswordChangeInput = {
      currentPassword: 'currentPass123',
      newPassword: 'newSecurePass456',
    };

    it('should change password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockComparePassword.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(sampleUser);
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await userService.changePassword('user-123', passwordInput);

      expect(mockHashPassword).toHaveBeenCalledWith('newSecurePass456');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      // Should invalidate all refresh tokens
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.changePassword('invalid-id', passwordInput)).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthenticationError for wrong current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockComparePassword.mockResolvedValue(false);

      await expect(userService.changePassword('user-123', passwordInput)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);
      mockPrisma.user.delete.mockResolvedValue(sampleUser);

      await userService.deleteAccount('user-123');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.deleteAccount('invalid-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('assessment operations', () => {
    const sampleAssessment: Assessment = {
      id: 'assessment-123',
      userId: 'user-123',
      responses: '{"question1":"answer1"}',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('saveAssessment', () => {
      it('should save assessment successfully', async () => {
        mockPrisma.assessment.create.mockResolvedValue(sampleAssessment);

        const result = await userService.saveAssessment('user-123', '{"question1":"answer1"}');

        expect(result).toMatchObject({
          id: 'assessment-123',
          userId: 'user-123',
        });
      });
    });

    describe('getAssessments', () => {
      it('should return user assessments sorted by createdAt desc', async () => {
        mockPrisma.assessment.findMany.mockResolvedValue([sampleAssessment]);

        const result = await userService.getAssessments('user-123');

        expect(result).toHaveLength(1);
        expect(mockPrisma.assessment.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('getAssessmentById', () => {
      it('should return assessment if owned by user', async () => {
        mockPrisma.assessment.findFirst.mockResolvedValue(sampleAssessment);

        const result = await userService.getAssessmentById('assessment-123', 'user-123');

        expect(result).toMatchObject({ id: 'assessment-123' });
        expect(mockPrisma.assessment.findFirst).toHaveBeenCalledWith({
          where: { id: 'assessment-123', userId: 'user-123' },
        });
      });

      it('should return null if not found or not owned', async () => {
        mockPrisma.assessment.findFirst.mockResolvedValue(null);

        const result = await userService.getAssessmentById('assessment-123', 'other-user');

        expect(result).toBeNull();
      });
    });
  });

  describe('analysis operations', () => {
    const sampleAnalysis: Analysis = {
      id: 'analysis-123',
      userId: 'user-123',
      assessmentId: 'assessment-123',
      result: '{"pattern":"result"}',
      createdAt: new Date(),
    };

    describe('saveAnalysis', () => {
      it('should save analysis with assessment reference', async () => {
        mockPrisma.analysis.create.mockResolvedValue(sampleAnalysis);

        const result = await userService.saveAnalysis('user-123', '{"pattern":"result"}', 'assessment-123');

        expect(result).toMatchObject({
          id: 'analysis-123',
          assessmentId: 'assessment-123',
        });
      });

      it('should save analysis without assessment reference', async () => {
        const analysisWithoutAssessment = { ...sampleAnalysis, assessmentId: null };
        mockPrisma.analysis.create.mockResolvedValue(analysisWithoutAssessment);

        const result = await userService.saveAnalysis('user-123', '{"pattern":"result"}');

        expect(result.assessmentId).toBeNull();
      });
    });

    describe('getAnalyses', () => {
      it('should return user analyses sorted by createdAt desc', async () => {
        mockPrisma.analysis.findMany.mockResolvedValue([sampleAnalysis]);

        const result = await userService.getAnalyses('user-123');

        expect(result).toHaveLength(1);
        expect(mockPrisma.analysis.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('getAnalysisById', () => {
      it('should return analysis if owned by user', async () => {
        mockPrisma.analysis.findFirst.mockResolvedValue(sampleAnalysis);

        const result = await userService.getAnalysisById('analysis-123', 'user-123');

        expect(result).toMatchObject({ id: 'analysis-123' });
      });

      it('should return null if not found or not owned', async () => {
        mockPrisma.analysis.findFirst.mockResolvedValue(null);

        const result = await userService.getAnalysisById('analysis-123', 'other-user');

        expect(result).toBeNull();
      });
    });
  });
});
