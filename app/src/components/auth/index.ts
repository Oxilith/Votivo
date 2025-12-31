/**
 * @file src/components/auth/index.ts
 * @purpose Barrel exports for authentication components
 * @functionality
 * - Exports AuthLayout shared layout component
 * - Exports AuthGuard for protected routes
 * - Re-exports form components for convenience
 * - NOTE: Page components (AuthPage, EmailVerificationPage, PasswordResetPage)
 *   are NOT exported here - they are lazy-loaded in App.tsx for code splitting
 * @dependencies
 * - ./AuthLayout
 * - ./AuthGuard
 * - ./forms
 */

export { default as AuthLayout } from './AuthLayout';

export { default as AuthGuard } from './AuthGuard';
export type { AuthGuardProps } from './AuthGuard';

// Re-export form components
export * from './forms'; // @allow-wildcard

// Page components are lazy-loaded in App.tsx - not exported from barrel
// See: app/src/App.tsx for lazy imports of AuthPage, EmailVerificationPage, PasswordResetPage
