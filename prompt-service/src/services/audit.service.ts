/**
 * @file prompt-service/src/services/audit.service.ts
 * @purpose Structured security event logging for authentication operations
 * @functionality
 * - Defines audit event types for security-relevant actions
 * - Logs events with consistent structure via Pino
 * - Includes metadata for monitoring and alerting
 * - Supports IP and user agent tracking for forensics
 * @dependencies
 * - @/utils/logger for Pino logger instance
 */

import { logger } from '@/utils';

/**
 * Audit event types for security-relevant actions
 */
export type AuditEventType =
  | 'AUTH_REGISTER'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_ACCOUNT_LOCKOUT'
  | 'AUTH_LOGOUT'
  | 'AUTH_LOGOUT_ALL'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_CONFIRM'
  | 'AUTH_TOKEN_REFRESH_SUCCESS'
  | 'AUTH_TOKEN_REFRESH_FAILED'
  | 'AUTH_TOKEN_THEFT_DETECTED'
  | 'AUTH_EMAIL_VERIFIED'
  | 'AUTH_ACCOUNT_DELETED'
  | 'AUTH_VERIFICATION_EMAIL_SENT'
  | 'AUTH_VERIFICATION_EMAIL_RATE_LIMITED'
  | 'AUTH_VERIFICATION_ALREADY_VERIFIED';

/**
 * Request context for audit logging
 */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a security audit event
 *
 * Events are logged at info level with `audit: true` field for easy filtering.
 * Use in log aggregation: filter by `audit=true` for security monitoring.
 *
 * @param entry - Audit log entry containing event details
 *
 * @example
 * ```typescript
 * auditLog({
 *   eventType: 'AUTH_LOGIN_SUCCESS',
 *   userId: user.id,
 *   email: user.email,
 *   ip: req.ip,
 *   userAgent: req.headers['user-agent'],
 * });
 * ```
 */
export function auditLog(entry: AuditLogEntry): void {
  logger.info(
    {
      audit: true,
      eventType: entry.eventType,
      userId: entry.userId,
      email: entry.email,
      ip: entry.ip,
      userAgent: entry.userAgent,
      ...entry.metadata,
    },
    `[AUDIT] ${entry.eventType}`
  );
}
