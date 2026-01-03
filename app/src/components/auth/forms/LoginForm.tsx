/**
 * @file src/components/auth/forms/LoginForm.tsx
 * @purpose User login form with email and password authentication
 * @functionality
 * - Renders email and password input fields
 * - Validates form data before submission
 * - Displays loading state during authentication
 * - Shows error messages from API
 * - Provides link to register page
 * - Provides link to password reset
 * - Supports internationalization (EN/PL)
 * @dependencies
 * - React (useState)
 * - react-i18next (useTranslation)
 * - @/components/auth/forms/FormInput
 * - @/components/auth/forms/FormButton
 * - @/services/api/AuthService
 * - @/stores/useAuthStore
 */

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import FormInput from './FormInput';
import FormButton from './FormButton';
import { authService } from '@/services/api';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Props for LoginForm component
 */
export interface LoginFormProps {
  /** Callback when user wants to switch to register */
  onSwitchToRegister: () => void;
  /** Callback when user wants to reset password */
  onForgotPassword: () => void;
  /** Callback after successful login */
  onSuccess?: () => void;
}

/**
 * Form validation errors
 */
interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * LoginForm - Email/password authentication form
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onForgotPassword,
  onSuccess,
}) => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAsync = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.login({ email, password });
      setAuth(response.user, response.accessToken, response.csrfToken);
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError(t('errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    void handleSubmitAsync(e);
  };

  return (
    <div className="w-full max-w-md mx-auto" data-testid="login-form">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">
          {t('login.title')}
        </h2>
        <p className="font-body text-[var(--text-secondary)]">
          {t('login.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" aria-label={t('login.title')}>
        <FormInput
          label={t('login.email')}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); }}
          error={errors.email}
          required
          autoComplete="email"
          placeholder={t('login.emailPlaceholder')}
        />

        <FormInput
          label={t('login.password')}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); }}
          error={errors.password}
          required
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
        />

        {apiError && (
          <div
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-600 dark:border-red-400"
            role="alert"
            aria-live="polite"
            data-testid="login-error"
          >
            <p className="font-body text-sm text-red-600 dark:text-red-400">
              {apiError}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-body text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            data-testid="login-btn-forgot-password"
          >
            {t('login.forgotPassword')}
          </button>
        </div>

        <FormButton isLoading={isSubmitting}>{t('login.submit')}</FormButton>
      </form>

      <p className="mt-6 text-center font-body text-[var(--text-secondary)]">
        {t('login.noAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
          data-testid="login-btn-register"
        >
          {t('login.signUp')}
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
