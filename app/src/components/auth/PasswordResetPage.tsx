/**
 * @file src/components/auth/PasswordResetPage.tsx
 * @purpose Password reset confirmation page for handling reset tokens from email links
 * @functionality
 * - Validates reset token from URL
 * - Renders PasswordResetConfirmForm for setting new password
 * - Shows error state for missing/invalid tokens
 * - Uses shared AuthLayout for consistent styling
 * @dependencies
 * - React (useCallback)
 * - react-i18next (useTranslation)
 * - @/components/auth/AuthLayout
 * - @/components/auth/forms/PasswordResetConfirmForm
 * - @/components/shared/icons
 * - @/hooks/useRouting
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import { PasswordResetConfirmForm } from './forms';
import { ErrorCircleIcon } from '@/components';
import { useRouting } from '@/hooks';

/**
 * Props for PasswordResetPage
 */
export interface PasswordResetPageProps {
  /** Reset token from URL */
  token?: string;
}

/**
 * PasswordResetPage - Handles password reset confirmation from email links
 */
const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ token }) => {
  const { t } = useTranslation('auth');
  const { navigate } = useRouting();

  const handleNavigateToLanding = useCallback(() => {
    navigate('landing');
  }, [navigate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('auth', { authMode: 'login' });
  }, [navigate]);

  return (
    <AuthLayout maxWidth="md">
      {token ? (
        <PasswordResetConfirmForm
          token={token}
          onNavigateToLogin={handleNavigateToLogin}
        />
      ) : (
        /* No Token State */
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-2 border-red-500 flex items-center justify-center">
            <ErrorCircleIcon size="lg" className="text-red-500" />
          </div>
          <h2 className="font-display text-2xl text-[var(--text-primary)] mb-2">
            {t('resetPassword.invalidLink.title')}
          </h2>
          <p className="font-body text-[var(--text-secondary)] mb-6">
            {t('resetPassword.invalidLink.description')}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleNavigateToLogin}
              data-testid="password-reset-btn-signin"
              className="cta-button w-full py-3 px-6 font-body font-medium text-white bg-[var(--accent)]"
            >
              {t('resetPassword.invalidLink.goToSignIn')}
            </button>
            <button
              onClick={handleNavigateToLanding}
              data-testid="password-reset-btn-home"
              className="w-full py-2 font-body text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {t('resetPassword.invalidLink.backToHome')}
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default PasswordResetPage;
