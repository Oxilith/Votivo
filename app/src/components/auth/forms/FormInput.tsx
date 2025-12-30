/**
 * @file src/components/auth/forms/FormInput.tsx
 * @purpose Reusable form input component with Ink & Stone styling and validation support
 * @functionality
 * - Renders labeled input field with consistent styling
 * - Supports text, email, password input types
 * - Shows/hides password toggle for password fields
 * - Displays validation error messages
 * - Supports required field indicator
 * @dependencies
 * - React (useState)
 * - @/components/shared/icons (EyeIcon, EyeOffIcon)
 */

import { useState, forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components';

/**
 * Props for FormInput component
 */
export interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Field label */
  label: string;
  /** Error message to display */
  error?: string;
  /** Whether field is required */
  required?: boolean;
}

/**
 * FormInput - Styled input component for authentication forms
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, required, type = 'text', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]"
        >
          {label}
          {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`
              w-full p-3 font-body text-base
              bg-[var(--bg-primary)] text-[var(--text-primary)]
              border transition-colors duration-200
              placeholder:text-[var(--text-faint)]
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                error
                  ? 'border-red-600 dark:border-red-400'
                  : 'border-[var(--border)] focus:border-[var(--accent)]'
              }
              ${isPasswordField ? 'pr-12' : ''}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOffIcon size="sm" />
              ) : (
                <EyeIcon size="sm" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="font-body text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
