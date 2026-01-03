/**
 * @file src/components/auth/forms/FormButton.tsx
 * @purpose Reusable form submit button with loading state and Ink & Stone styling
 * @functionality
 * - Renders CTA-styled button for form submission
 * - Shows loading spinner when isLoading is true
 * - Disables button during loading or when disabled prop is true
 * - Supports full-width layout
 * @dependencies
 * - React
 * - @/components/shared (InkLoader)
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React from 'react';
import { InkLoader } from '@/components';

/**
 * Props for FormButton component
 */
export interface FormButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Button content */
  children: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Variant styling */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * FormButton - Styled button component for form submission
 * Uses cta-button class for consistent hover/active effects
 */
const FormButton: React.FC<FormButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  type = 'submit',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const baseClasses = `
    relative font-body font-medium py-3 px-6
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: 'cta-button bg-[var(--accent)] text-white',
    secondary: `
      bg-[var(--bg-primary)] text-[var(--text-primary)]
      border border-[var(--border)]
      transition-all duration-200
      hover:border-[var(--accent)] hover:text-[var(--accent)]
    `,
    danger: 'cta-button bg-red-600 text-white',
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
      data-testid="form-btn-submit"
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <InkLoader variant="inline" />
        </span>
      )}
      <span className={isLoading ? 'invisible' : ''}>{children}</span>
    </button>
  );
};

export default FormButton;
