/**
 * @file prompt-service/src/services/email.service.ts
 * @purpose Email delivery service for authentication-related emails
 * @functionality
 * - Configures Nodemailer transporter with SMTP settings from environment
 * - Sends password reset emails with secure reset links
 * - Sends email verification emails with verification links
 * - Handles SMTP failures gracefully with logging
 * - Provides email templates for consistent formatting
 * @dependencies
 * - nodemailer for email sending
 * - @/utils/escapeHtml for HTML entity escaping in templates
 * - environment variables for SMTP configuration
 */

import nodemailer from 'nodemailer';
import { escapeHtml, logger } from '@/utils';

/**
 * SMTP configuration loaded from environment variables
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

/**
 * Result of an email send operation
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True if email was skipped (e.g., SMTP not configured in development) */
  skipped?: boolean;
}

/**
 * Input for password reset email
 */
export interface PasswordResetEmailInput {
  to: string;
  resetToken: string;
  userName?: string;
}

/**
 * Input for email verification email
 */
export interface EmailVerificationInput {
  to: string;
  verificationToken: string;
  userName?: string;
}

/**
 * Creates SMTP configuration from environment variables
 */
export function createSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST ?? '';
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER ?? '';
  const password = process.env.SMTP_PASSWORD ?? '';
  const from = process.env.SMTP_FROM ?? 'noreply@votive.app';

  return { host, port, secure, user, password, from };
}

/**
 * Gets the application URL for email links
 */
function getAppUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: SmtpConfig;

  constructor(config?: SmtpConfig) {
    this.config = config ?? createSmtpConfig();
  }

  /**
   * Initialize the nodemailer transporter
   * Creates transport only when needed (lazy initialization)
   */
  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Validate required configuration
      if (!this.config.host) {
        throw new Error('SMTP_HOST is not configured. Email service cannot send emails.');
      }

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Check if the email service is configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.host && this.config.user && this.config.password);
  }

  /**
   * Verify SMTP connection is working
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : 'Unknown error' },
        'SMTP verification failed'
      );
      return false;
    }
  }

  /**
   * Send password reset email with reset link
   */
  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<EmailResult> {
    const appUrl = getAppUrl();
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(input.resetToken)}`;
    const greeting = input.userName ? `Hi ${escapeHtml(input.userName)}` : 'Hi';

    const subject = 'Reset Your Votive Password';
    const text = `${greeting},

You requested to reset your password for your Votive account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

- The Votive Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f7f7f7; border-radius: 8px; padding: 30px;">
    <h1 style="color: #4a5568; margin-top: 0;">Reset Your Password</h1>
    <p>${greeting},</p>
    <p>You requested to reset your password for your Votive account.</p>
    <p>Click the button below to reset your password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #4a90a4; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">Reset Password</a>
    </p>
    <p style="font-size: 14px; color: #718096;">This link will expire in 1 hour.</p>
    <p style="font-size: 14px; color: #718096;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    <p style="font-size: 13px; color: #a0aec0; margin-bottom: 0;">- The Votive Team</p>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: input.to,
      subject,
      text,
      html,
    });
  }

  /**
   * Send email verification email with verification link
   */
  async sendEmailVerificationEmail(input: EmailVerificationInput): Promise<EmailResult> {
    const appUrl = getAppUrl();
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(input.verificationToken)}`;
    const greeting = input.userName ? `Hi ${escapeHtml(input.userName)}` : 'Hi';

    const subject = 'Verify Your Votive Email Address';
    const text = `${greeting},

Welcome to Votive! Please verify your email address to complete your registration.

Click the link below to verify your email:
${verifyUrl}

This link will expire in 24 hours.

If you didn't create a Votive account, you can safely ignore this email.

- The Votive Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f7f7f7; border-radius: 8px; padding: 30px;">
    <h1 style="color: #4a5568; margin-top: 0;">Verify Your Email</h1>
    <p>${greeting},</p>
    <p>Welcome to Votive! Please verify your email address to complete your registration.</p>
    <p>Click the button below to verify your email:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #4a90a4; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">Verify Email</a>
    </p>
    <p style="font-size: 14px; color: #718096;">This link will expire in 24 hours.</p>
    <p style="font-size: 14px; color: #718096;">If you didn't create a Votive account, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    <p style="font-size: 13px; color: #a0aec0; margin-bottom: 0;">- The Votive Team</p>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: input.to,
      subject,
      text,
      html,
    });
  }

  /**
   * Internal method to send an email
   * Handles SMTP failures gracefully
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<EmailResult> {
    // Check if email service is configured
    if (!this.isConfigured()) {
      const errorMessage = 'Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.';
      // Log warning in development/test, return skipped result
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logger.warn(
          { to: options.to, subject: options.subject },
          `${errorMessage} Would have sent email.`
        );
        // Return with skipped flag to indicate email was not actually sent
        return {
          success: false,
          skipped: true,
          messageId: 'dev-mode-no-smtp',
          error: 'Email not sent - SMTP not configured in development/test',
        };
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    try {
      const transporter = this.getTransporter();
      const info = (await transporter.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      })) as unknown as { messageId: string };

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
      // Log the error but don't crash - spec says "graceful handling"
      logger.error({ to: options.to, err: errorMessage }, 'Failed to send email');

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Close the transporter connection
   */
  close(): void {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
