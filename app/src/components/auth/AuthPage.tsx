/**
 * @file src/components/auth/AuthPage.tsx
 * @purpose Container page for authentication flows (login, register, password reset)
 * @functionality
 * - Renders login and registration forms with toggle between them
 * - Renders password reset request form with FormInput/FormButton components
 * - Uses shared AuthLayout for consistent styling
 * - Provides Ink & Stone design consistency with font-display headers
 * - Supports internationalization (EN/PL)
 * @dependencies
 * - React (useState, useCallback)
 * - react-i18next (useTranslation)
 * - @/components/auth/AuthLayout
 * - @/components/auth/forms (LoginForm, RegisterForm, FormInput, FormButton)
 * - @/components/shared/icons (MailIcon)
 * - @/hooks/useRouting
 * - @/services/api/AuthService (authService)
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import { LoginForm, RegisterForm, FormInput, FormButton } from './forms';
import { useRouting } from '@/hooks';
import { MailIcon } from '@/components';
import { authService } from '@/services';

/**
 * Authentication mode
 */
type AuthMode = 'login' | 'register' | 'forgot-password';

/**
 * Props for AuthPage component
 */
export interface AuthPageProps {
  /** Initial mode to display */
  initialMode?: AuthMode;
  /** Callback after successful authentication */
  onAuthSuccess?: () => void;
}

/**
 * PasswordResetRequestForm - Form for requesting password reset email
 */
const PasswordResetRequestForm: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      // The API already returns success regardless of whether email exists
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-2 border-[var(--accent)] flex items-center justify-center">
          <MailIcon size="lg" className="text-[var(--accent)]" />
        </div>
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">
          {t('forgotPassword.success')}
        </h2>
        <p className="font-body text-[var(--text-secondary)] mb-6">
          {t('forgotPassword.successMessage')}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="font-body font-medium text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
        >
          {t('forgotPassword.backToLogin')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">
          {t('forgotPassword.title')}
        </h2>
        <p className="font-body text-[var(--text-secondary)]">
          {t('forgotPassword.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          label={t('forgotPassword.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={t('forgotPassword.emailPlaceholder')}
        />

        <FormButton isLoading={isLoading}>{t('forgotPassword.submit')}</FormButton>
      </form>

      <p className="mt-6 text-center font-body text-[var(--text-secondary)]">
        {t('forgotPassword.rememberPassword')}{' '}
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
        >
          {t('forgotPassword.backToLogin')}
        </button>
      </p>
    </div>
  );
};

/**
 * AuthPage - Container for authentication flows
 */
const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { navigate } = useRouting();

  const handleAuthSuccess = useCallback(() => {
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      navigate('landing');
    }
  }, [onAuthSuccess, navigate]);

  return (
    <AuthLayout maxWidth="lg">
      {mode === 'login' && (
        <LoginForm
          onSwitchToRegister={() => setMode('register')}
          onForgotPassword={() => setMode('forgot-password')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {mode === 'register' && (
        <RegisterForm
          onSwitchToLogin={() => setMode('login')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {mode === 'forgot-password' && (
        <PasswordResetRequestForm onBack={() => setMode('login')} />
      )}
    </AuthLayout>
  );
};

export default AuthPage;
