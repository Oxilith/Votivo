/**
 * @file src/components/auth/EmailVerificationPage.tsx
 * @purpose Email verification page that handles verification tokens from email links
 * @functionality
 * - Automatically verifies email when page loads with token
 * - Shows loading state during verification
 * - Shows success message after verification
 * - Shows error message for invalid/expired tokens
 * - Allows resending verification email
 * - Uses shared AuthLayout for consistent styling
 * @dependencies
 * - React (useState, useEffect, useCallback)
 * - react-i18next (useTranslation)
 * - @/components/auth/AuthLayout
 * - @/components/shared/icons
 * - @/stores/useAuthStore
 * - @/services/api/AuthService
 * - @/hooks/useRouting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import { CheckIcon, InkLoader, ErrorCircleIcon } from '@/components';
import { useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/services/api';
import { useRouting } from '@/hooks';

/**
 * Props for EmailVerificationPage
 */
export interface EmailVerificationPageProps {
  /** Verification token from URL */
  token?: string;
}

/**
 * Verification state
 */
type VerificationState = 'loading' | 'success' | 'error' | 'no-token';

/**
 * EmailVerificationPage - Handles email verification from email links
 */
const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  token,
}) => {
  const { t } = useTranslation('auth');
  const { navigate } = useRouting();
  const { setUser } = useAuthStore();
  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'no-token');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Verify email on mount if token is present
  useEffect(() => {
    if (!token) {
      setState('no-token');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setUser(response.user);
        setState('success');
      } catch (error) {
        setState('error');
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(null); // Will use default translation
        }
      }
    };

    void verifyEmail();
  }, [token, setUser]);

  const handleResendVerificationAsync = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      await authService.resendVerification();
      setResendSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        setResendError(error.message);
      } else {
        setResendError(t('verifyEmail.resendError'));
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleResendVerification = () => {
    void handleResendVerificationAsync();
  };

  const handleNavigateToLanding = useCallback(() => {
    navigate('landing');
  }, [navigate]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('profile');
  }, [navigate]);

  return (
    <AuthLayout maxWidth="md">
      <div className="text-center">
        {/* Loading State */}
        {state === 'loading' && (
          <InkLoader variant="contained" message={t('verifyEmail.loading.title')} />
        )}

        {/* Success State */}
        {state === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-green-500 flex items-center justify-center">
              <CheckIcon size="lg" className="text-green-500" />
            </div>
            <h2 className="font-display text-2xl text-[var(--text-primary)] mb-2">
              {t('verifyEmail.success.title')}
            </h2>
            <p className="font-body text-[var(--text-secondary)] mb-6">
              {t('verifyEmail.success.description')}
            </p>
            <button
              onClick={handleNavigateToProfile}
              data-testid="email-verify-btn-profile"
              className="cta-button px-6 py-3 font-body font-medium text-white bg-[var(--accent)]"
            >
              {t('verifyEmail.success.goToProfile')}
            </button>
          </>
        )}

        {/* Error State */}
        {state === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-red-500 flex items-center justify-center">
              <ErrorCircleIcon size="lg" className="text-red-500" />
            </div>
            <h2 className="font-display text-2xl text-[var(--text-primary)] mb-2">
              {t('verifyEmail.error.title')}
            </h2>
            <p className="font-body text-[var(--text-secondary)] mb-6">
              {errorMessage ?? t('verifyEmail.error.defaultMessage')}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendSuccess}
                data-testid="email-verify-btn-resend-error"
                className="cta-button w-full py-3 px-6 font-body font-medium text-white bg-[var(--accent)] disabled:opacity-50"
              >
                {resendLoading ? t('verifyEmail.resending') : resendSuccess ? t('verifyEmail.resent') : t('verifyEmail.resend')}
              </button>
              {resendError && (
                <p className="font-body text-sm text-red-600 dark:text-red-400">
                  {resendError}
                </p>
              )}
              <button
                onClick={handleNavigateToLanding}
                data-testid="email-verify-btn-home-error"
                className="w-full py-2 font-body text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {t('verifyEmail.backToHome')}
              </button>
            </div>
          </>
        )}

        {/* No Token State */}
        {state === 'no-token' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-[var(--accent)] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[var(--accent)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-[var(--text-primary)] mb-2">
              {t('verifyEmail.noToken.title')}
            </h2>
            <p className="font-body text-[var(--text-secondary)] mb-6">
              {t('verifyEmail.noToken.description')}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendSuccess}
                data-testid="email-verify-btn-resend"
                className="w-full py-3 px-6 font-body font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border)] transition-colors hover:border-[var(--accent)] disabled:opacity-50"
              >
                {resendLoading ? t('verifyEmail.resending') : resendSuccess ? t('verifyEmail.resent') : t('verifyEmail.resend')}
              </button>
              {resendError && (
                <p className="font-body text-sm text-red-600 dark:text-red-400">
                  {resendError}
                </p>
              )}
              <button
                onClick={handleNavigateToLanding}
                data-testid="email-verify-btn-home"
                className="w-full py-2 font-body text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {t('verifyEmail.backToHome')}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerificationPage;
