/**
 * @file src/components/auth/forms/PasswordResetConfirmForm.tsx
 * @purpose Form for setting new password after clicking reset email link
 * @functionality
 * - Validates reset token from URL
 * - Allows user to enter and confirm new password
 * - Shows success message and redirects to login
 * - Shows error for invalid/expired tokens
 * - Supports internationalization (EN/PL)
 * @dependencies
 * - React (useState)
 * - react-i18next (useTranslation)
 * - @/components/auth/forms/FormInput
 * - @/components/auth/forms/FormButton
 * - @/services/api/AuthService
 * - shared/index (PASSWORD_REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
 */

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import FormInput from './FormInput';
import FormButton from './FormButton';
import { authService } from '@/services';
import { CheckIcon } from '@/components';
import { PASSWORD_REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from 'shared';

/**
 * Props for PasswordResetConfirmForm
 */
export interface PasswordResetConfirmFormProps {
  /** Reset token from URL */
  token: string;
  /** Callback to navigate to login */
  onNavigateToLogin: () => void;
}

/**
 * Form validation errors
 */
interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

/**
 * PasswordResetConfirmForm - Set new password after email reset
 */
const PasswordResetConfirmForm: React.FC<PasswordResetConfirmFormProps> = ({
  token,
  onNavigateToLogin,
}) => {
  const { t } = useTranslation('auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = t('validation.passwordTooShort');
    } else if (password.length > PASSWORD_MAX_LENGTH) {
      newErrors.password = t('validation.passwordTooLong');
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password = t('validation.passwordWeak');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.confirmPasswordReset(token, password);
      setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-2 border-green-500 flex items-center justify-center">
          <CheckIcon size="lg" className="text-green-500" />
        </div>
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">
          {t('resetPassword.success')}
        </h2>
        <p className="font-body text-[var(--text-secondary)] mb-6">
          {t('resetPassword.successMessage')}
        </p>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="font-body font-medium text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
        >
          {t('resetPassword.goToLogin')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">
          {t('resetPassword.title')}
        </h2>
        <p className="font-body text-[var(--text-secondary)]">
          {t('resetPassword.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          label={t('resetPassword.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          autoComplete="new-password"
          placeholder={t('resetPassword.passwordPlaceholder')}
        />

        <FormInput
          label={t('resetPassword.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
          placeholder={t('resetPassword.confirmPasswordPlaceholder')}
        />

        {apiError && (
          <div
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-600 dark:border-red-400"
            role="alert"
          >
            <p className="font-body text-sm text-red-600 dark:text-red-400">
              {apiError}
            </p>
          </div>
        )}

        <FormButton isLoading={isSubmitting}>{t('resetPassword.submit')}</FormButton>
      </form>

      <p className="mt-6 text-center font-body text-[var(--text-secondary)]">
        {t('resetPassword.rememberPassword')}{' '}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
        >
          {t('resetPassword.signIn')}
        </button>
      </p>
    </div>
  );
};

export default PasswordResetConfirmForm;
