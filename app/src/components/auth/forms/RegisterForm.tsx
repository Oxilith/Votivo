/**
 * @file src/components/auth/forms/RegisterForm.tsx
 * @purpose User registration form with profile information
 * @functionality
 * - Renders email, password, name, birthYear, and gender fields
 * - Validates all form data before submission
 * - Displays password strength requirements
 * - Shows loading state during registration
 * - Shows error messages from API
 * - Provides link to login page
 * - Supports internationalization (EN/PL)
 * @dependencies
 * - React (useState)
 * - react-i18next (useTranslation)
 * - @/components/auth/forms/FormInput
 * - @/components/auth/forms/FormButton
 * - @/services/api/AuthService
 * - @/stores/useAuthStore
 * - @/types/auth.types (Gender)
 * - shared/index (PASSWORD_REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
 */

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import FormInput from './FormInput';
import FormButton from './FormButton';
import { authService } from '@/services/api';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Gender } from '@/types';
import { PASSWORD_REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@votive/shared';

/**
 * Props for RegisterForm component
 */
export interface RegisterFormProps {
  /** Callback when user wants to switch to login */
  onSwitchToLogin: () => void;
  /** Callback after successful registration */
  onSuccess?: () => void;
}

/**
 * Form validation errors
 */
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  birthYear?: string;
  gender?: string;
}

const currentYear = new Date().getFullYear();
const minYear = 1900;
const maxYear = currentYear - 13; // Must be at least 13 years old

/**
 * RegisterForm - User registration form with profile fields
 */
const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const { t } = useTranslation('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<Gender>('prefer-not-to-say');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'prefer-not-to-say', label: t('register.genderOptions.default') },
    { value: 'male', label: t('register.genderOptions.male') },
    { value: 'female', label: t('register.genderOptions.female') },
    { value: 'other', label: t('register.genderOptions.other') },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (name.trim().length > 100) {
      newErrors.name = t('validation.nameTooLong');
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.emailInvalid');
    } else if (email.length > 254) {
      newErrors.email = t('validation.emailTooLong');
    }

    // Password validation
    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = t('validation.passwordTooShort');
    } else if (password.length > PASSWORD_MAX_LENGTH) {
      newErrors.password = t('validation.passwordTooLong');
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password = t('validation.passwordWeak');
    }

    // Confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }

    // Birth year validation
    const yearNum = parseInt(birthYear, 10);
    if (!birthYear) {
      newErrors.birthYear = t('validation.birthYearInvalid');
    } else if (isNaN(yearNum) || yearNum < minYear || yearNum > maxYear) {
      newErrors.birthYear = t('validation.birthYearRange', { min: minYear, max: maxYear });
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
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        birthYear: parseInt(birthYear, 10),
        gender,
      });
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
    <div className="w-full max-w-md mx-auto" data-testid="register-form">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">
          {t('register.title')}
        </h2>
        <p className="font-body text-[var(--text-secondary)]">
          {t('register.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" aria-label={t('register.title')}>
        <FormInput
          label={t('register.name')}
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          error={errors.name}
          required
          autoComplete="name"
          placeholder={t('register.namePlaceholder')}
        />

        <FormInput
          label={t('register.email')}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); }}
          error={errors.email}
          required
          autoComplete="email"
          placeholder={t('register.emailPlaceholder')}
        />

        <FormInput
          label={t('register.password')}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); }}
          error={errors.password}
          required
          autoComplete="new-password"
          placeholder={t('register.passwordPlaceholder')}
        />

        <FormInput
          label={t('register.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); }}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
          placeholder={t('register.confirmPasswordPlaceholder')}
        />

        <FormInput
          label={t('register.birthYear')}
          type="number"
          value={birthYear}
          onChange={(e) => { setBirthYear(e.target.value); }}
          error={errors.birthYear}
          required
          min={minYear}
          max={maxYear}
          placeholder={`e.g., ${String(currentYear - 25)}`}
        />

        {/* Gender Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="gender"
            className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]"
          >
            {t('register.gender')}
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => { setGender(e.target.value as Gender); }}
            className={`
              w-full p-3 font-body text-base
              bg-[var(--bg-primary)] text-[var(--text-primary)]
              border border-[var(--border)]
              transition-colors duration-200
              focus:outline-none focus:border-[var(--accent)]
            `}
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {apiError && (
          <div
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-600 dark:border-red-400"
            role="alert"
            aria-live="polite"
            data-testid="register-error"
          >
            <p className="font-body text-sm text-red-600 dark:text-red-400">
              {apiError}
            </p>
          </div>
        )}

        <FormButton isLoading={isSubmitting}>{t('register.submit')}</FormButton>
      </form>

      <p className="mt-6 text-center font-body text-[var(--text-secondary)]">
        {t('register.hasAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
          data-testid="register-btn-login"
        >
          {t('register.signIn')}
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
