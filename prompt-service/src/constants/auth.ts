/**
 * @file prompt-service/src/constants/auth.ts
 * @purpose Authentication-related constants for consistent usage across the application
 * @functionality
 * - Defines cookie name for admin sessions
 * - Defines cookie max age duration
 * - Defines session value constants
 * @dependencies
 * - None (pure constants)
 */

/**
 * Authentication constants used across middleware and routes
 */
export const AUTH_CONSTANTS = {
  /** Name of the HttpOnly session cookie */
  COOKIE_NAME: 'admin_session',

  /** Cookie max age in milliseconds (24 hours) */
  COOKIE_MAX_AGE_MS: 24 * 60 * 60 * 1000,

  /** Session values for cookie content */
  SESSION_VALUES: {
    AUTHENTICATED: 'authenticated',
  },

  /** HTTP header name for API key authentication (backward compatibility) */
  API_KEY_HEADER: 'x-admin-key',
} as const;
