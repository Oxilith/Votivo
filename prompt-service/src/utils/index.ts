/**
 * @file prompt-service/src/utils/index.ts
 * @purpose Centralized export for all utility modules
 * @functionality
 * - Exports structured logging utility
 * - Exports authentication validation utilities
 * - Exports cryptographic utilities
 * - Exports password hashing utilities
 * - Exports token generation utilities
 * - Exports JWT utilities
 * - Exports CSRF utilities
 * - Exports sanitization utilities
 * @dependencies
 * - logger.ts
 * - auth.ts
 * - crypto.ts
 * - password.ts
 * - token.ts
 * - jwt.ts
 * - csrf.ts
 * - sanitize.ts
 */

export { logger, type Logger } from './logger';
export { validateAuthConfig, type AuthConfigValidationResult } from './auth';
export { timingSafeCompare } from './crypto';
export {
  createPasswordConfig,
  hashPassword,
  comparePassword,
  type PasswordConfig,
} from './password';
export {
  generateSecureToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateTokenId,
  generateFamilyId,
} from './token';
export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type AccessTokenPayload,
  type RefreshTokenPayload,
  type TokenVerificationResult,
  type JwtConfig,
} from './jwt';
export {
  CSRF_COOKIE,
  CSRF_HEADER,
  generateCsrfToken,
  validateCsrfToken,
} from './csrf';
export { validatePromptContent, validatePromptKey, escapeHtml } from './sanitize';
