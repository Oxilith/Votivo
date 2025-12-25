/**
 * @file prompt-service/src/utils/auth.ts
 * @purpose Shared authentication validation utilities
 * @functionality
 * - Validates admin authentication configuration
 * - Provides consistent auth bypass checking for development
 * - Returns structured validation results for route handlers and middleware
 * - Centralizes auth config logic to prevent duplication
 * @dependencies
 * - @/config for configuration access
 */

import { config } from '@/config/index.js';

/**
 * Result of auth configuration validation
 */
export interface AuthConfigValidationResult {
  /** Whether the configuration is valid for proceeding */
  isValid: boolean;
  /** Whether auth should be bypassed (development mode with DEV_AUTH_BYPASS) */
  shouldBypass: boolean;
  /** Error response to send if isValid is false */
  errorResponse: { status: number; error: string } | null;
}

/**
 * Validates the authentication configuration
 * Centralizes the logic for checking admin API key and dev bypass settings
 * @returns Validation result with status, bypass flag, and error details
 */
export function validateAuthConfig(): AuthConfigValidationResult {
  // Check if admin API key is configured
  if (!config.adminApiKey) {
    // In production, always require the key
    if (config.nodeEnv === 'production') {
      return {
        isValid: false,
        shouldBypass: false,
        errorResponse: { status: 503, error: 'Admin access not configured' },
      };
    }

    // In development, only bypass if explicitly enabled
    if (config.devAuthBypass) {
      return {
        isValid: true,
        shouldBypass: true,
        errorResponse: null,
      };
    }

    // Development without bypass enabled
    return {
      isValid: false,
      shouldBypass: false,
      errorResponse: {
        status: 503,
        error: 'Admin access not configured. Set ADMIN_API_KEY or DEV_AUTH_BYPASS=true',
      },
    };
  }

  // Admin API key is configured, proceed normally
  return {
    isValid: true,
    shouldBypass: false,
    errorResponse: null,
  };
}
