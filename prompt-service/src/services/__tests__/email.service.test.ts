/**
 * @file prompt-service/src/services/__tests__/email.service.test.ts
 * @purpose Unit tests for EmailService email delivery functionality
 * @functionality
 * - Tests SMTP configuration handling from environment variables
 * - Tests email service configuration detection
 * - Tests password reset email sending with templates
 * - Tests email verification email sending with templates
 * - Tests graceful error handling when SMTP is not configured
 * - Tests development mode behavior without SMTP
 * @dependencies
 * - vitest for testing framework
 * - nodemailer mock for email transport
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create hoisted mocks for nodemailer
const mockTransporter = vi.hoisted(() => ({
  sendMail: vi.fn(),
  verify: vi.fn(),
  close: vi.fn(),
}));

const mockCreateTransport = vi.hoisted(() => vi.fn(() => mockTransporter));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

import {
  EmailService,
  createSmtpConfig,
  type SmtpConfig,
  type PasswordResetEmailInput,
  type EmailVerificationInput,
} from '@/services';

describe('EmailService', () => {
  const validSmtpConfig: SmtpConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    user: 'user@example.com',
    password: 'secret-password',
    from: 'noreply@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env['SMTP_HOST'];
    delete process.env['SMTP_PORT'];
    delete process.env['SMTP_SECURE'];
    delete process.env['SMTP_USER'];
    delete process.env['SMTP_PASSWORD'];
    delete process.env['SMTP_FROM'];
    delete process.env['APP_URL'];
    delete process.env['NODE_ENV'];
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSmtpConfig', () => {
    it('should return default values when environment variables are not set', () => {
      const config = createSmtpConfig();

      expect(config).toEqual({
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        from: 'noreply@votive.app',
      });
    });

    it('should read values from environment variables', () => {
      process.env['SMTP_HOST'] = 'smtp.test.com';
      process.env['SMTP_PORT'] = '465';
      process.env['SMTP_SECURE'] = 'true';
      process.env['SMTP_USER'] = 'testuser';
      process.env['SMTP_PASSWORD'] = 'testpass';
      process.env['SMTP_FROM'] = 'test@test.com';

      const config = createSmtpConfig();

      expect(config).toEqual({
        host: 'smtp.test.com',
        port: 465,
        secure: true,
        user: 'testuser',
        password: 'testpass',
        from: 'test@test.com',
      });
    });

    it('should handle invalid port gracefully', () => {
      process.env['SMTP_PORT'] = 'not-a-number';

      const config = createSmtpConfig();

      expect(config.port).toBeNaN();
    });
  });

  describe('isConfigured', () => {
    it('should return true when all required fields are set', () => {
      const emailService = new EmailService(validSmtpConfig);

      expect(emailService.isConfigured()).toBe(true);
    });

    it('should return false when host is missing', () => {
      const emailService = new EmailService({
        ...validSmtpConfig,
        host: '',
      });

      expect(emailService.isConfigured()).toBe(false);
    });

    it('should return false when user is missing', () => {
      const emailService = new EmailService({
        ...validSmtpConfig,
        user: '',
      });

      expect(emailService.isConfigured()).toBe(false);
    });

    it('should return false when password is missing', () => {
      const emailService = new EmailService({
        ...validSmtpConfig,
        password: '',
      });

      expect(emailService.isConfigured()).toBe(false);
    });
  });

  describe('verifyConnection', () => {
    it('should return true when SMTP connection is valid', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      const emailService = new EmailService(validSmtpConfig);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockCreateTransport).toHaveBeenCalled();
    });

    it('should return false when SMTP connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      const emailService = new EmailService(validSmtpConfig);

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });

    it('should return false when service is not configured', async () => {
      const emailService = new EmailService({
        ...validSmtpConfig,
        host: '',
      });

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    const resetEmailInput: PasswordResetEmailInput = {
      to: 'user@example.com',
      resetToken: 'abc123token',
      userName: 'John Doe',
    };

    it('should send password reset email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      const emailService = new EmailService(validSmtpConfig);

      const result = await emailService.sendPasswordResetEmail(resetEmailInput);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'user@example.com',
          subject: 'Reset Your Votive Password',
        })
      );
    });

    it('should include reset URL with token in email body', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      process.env['APP_URL'] = 'https://votive.app';
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendPasswordResetEmail(resetEmailInput);

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string; html: string } | undefined;
      expect(callArgs?.text).toContain('https://votive.app/reset-password?token=abc123token');
      expect(callArgs?.html).toContain('https://votive.app/reset-password?token=abc123token');
    });

    it('should use user name in greeting when provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendPasswordResetEmail(resetEmailInput);

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string } | undefined;
      expect(callArgs?.text).toContain('Hi John Doe');
    });

    it('should use generic greeting when user name is not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'token123',
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string } | undefined;
      expect(callArgs?.text).toContain('Hi,');
      expect(callArgs?.text).not.toContain('Hi undefined');
    });

    it('should handle send errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));
      const emailService = new EmailService(validSmtpConfig);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await emailService.sendPasswordResetEmail(resetEmailInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP error');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return skipped result in development mode without SMTP config', async () => {
      process.env['NODE_ENV'] = 'development';
      const unconfiguredService = new EmailService({
        ...validSmtpConfig,
        host: '',
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await unconfiguredService.sendPasswordResetEmail(resetEmailInput);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.messageId).toBe('dev-mode-no-smtp');
      expect(result.error).toBe('Email not sent - SMTP not configured in development');
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should return error in production mode without SMTP config', async () => {
      process.env['NODE_ENV'] = 'production';
      const unconfiguredService = new EmailService({
        ...validSmtpConfig,
        host: '',
      });

      const result = await unconfiguredService.sendPasswordResetEmail(resetEmailInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email service is not configured');
    });
  });

  describe('sendEmailVerificationEmail', () => {
    const verifyEmailInput: EmailVerificationInput = {
      to: 'newuser@example.com',
      verificationToken: 'verify-token-456',
      userName: 'Jane Doe',
    };

    it('should send verification email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-456' });
      const emailService = new EmailService(validSmtpConfig);

      const result = await emailService.sendEmailVerificationEmail(verifyEmailInput);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-456');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'newuser@example.com',
          subject: 'Verify Your Votive Email Address',
        })
      );
    });

    it('should include verification URL with token in email body', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-456' });
      process.env['APP_URL'] = 'https://votive.app';
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendEmailVerificationEmail(verifyEmailInput);

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string; html: string } | undefined;
      expect(callArgs?.text).toContain('https://votive.app/verify-email?token=verify-token-456');
      expect(callArgs?.html).toContain('https://votive.app/verify-email?token=verify-token-456');
    });

    it('should use user name in greeting when provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-456' });
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendEmailVerificationEmail(verifyEmailInput);

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string } | undefined;
      expect(callArgs?.text).toContain('Hi Jane Doe');
    });

    it('should use generic greeting when user name is not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-456' });
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendEmailVerificationEmail({
        to: 'user@example.com',
        verificationToken: 'token123',
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string } | undefined;
      expect(callArgs?.text).toContain('Hi,');
    });

    it('should handle send errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Connection refused'));
      const emailService = new EmailService(validSmtpConfig);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await emailService.sendEmailVerificationEmail(verifyEmailInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
      consoleSpy.mockRestore();
    });

    it('should include HTML template with styled button', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-456' });
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendEmailVerificationEmail(verifyEmailInput);

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { html: string } | undefined;
      expect(callArgs?.html).toContain('Verify Email');
      expect(callArgs?.html).toContain('Welcome to Votive');
      expect(callArgs?.html).toContain('24 hours');
    });
  });

  describe('close', () => {
    it('should close the transporter', async () => {
      const emailService = new EmailService(validSmtpConfig);

      // Force transporter to be created by calling a method
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'token',
      });

      emailService.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it('should handle close when transporter was never created', () => {
      const emailService = new EmailService({
        ...validSmtpConfig,
        host: '',
      });

      // Should not throw
      expect(() => emailService.close()).not.toThrow();
    });
  });

  describe('lazy initialization', () => {
    it('should create transporter only when needed', () => {
      const emailService = new EmailService(validSmtpConfig);

      // Transporter should not be created on construction
      expect(mockCreateTransport).not.toHaveBeenCalled();

      // Access isConfigured should not create transporter
      emailService.isConfigured();
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it('should reuse existing transporter', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      const emailService = new EmailService(validSmtpConfig);

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'token1',
      });

      await emailService.sendEmailVerificationEmail({
        to: 'user@example.com',
        verificationToken: 'token2',
      });

      // Should only create transporter once
      expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL encoding', () => {
    it('should properly encode special characters in tokens', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      const emailService = new EmailService(validSmtpConfig);
      const tokenWithSpecialChars = 'token+with/special=chars';

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: tokenWithSpecialChars,
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0]?.[0] as { text: string } | undefined;
      expect(callArgs?.text).toContain(encodeURIComponent(tokenWithSpecialChars));
    });
  });

  describe('error handling edge cases', () => {
    it('should handle non-Error exceptions', async () => {
      mockTransporter.sendMail.mockRejectedValue('String error');
      const emailService = new EmailService(validSmtpConfig);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown email error');
      consoleSpy.mockRestore();
    });
  });
});
