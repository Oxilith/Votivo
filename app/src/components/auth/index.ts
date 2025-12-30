/**
 * @file src/components/auth/index.ts
 * @purpose Barrel exports for authentication components
 * @functionality
 * - Exports AuthLayout shared layout component
 * - Exports AuthPage container component
 * - Exports AuthGuard for protected routes
 * - Exports EmailVerificationPage for email verification flow
 * - Exports PasswordResetPage for password reset confirmation flow
 * - Re-exports form components for convenience
 * @dependencies
 * - ./AuthLayout
 * - ./AuthPage
 * - ./AuthGuard
 * - ./EmailVerificationPage
 * - ./PasswordResetPage
 * - ./forms
 */

export { default as AuthLayout } from './AuthLayout';

export { default as AuthPage } from './AuthPage';
export type { AuthPageProps } from './AuthPage';

export { default as AuthGuard } from './AuthGuard';
export type { AuthGuardProps } from './AuthGuard';

export { default as EmailVerificationPage } from './EmailVerificationPage';
export type { EmailVerificationPageProps } from './EmailVerificationPage';

export { default as PasswordResetPage } from './PasswordResetPage';
export type { PasswordResetPageProps } from './PasswordResetPage';

// Re-export form components
export * from './forms'; // @allow-wildcard
