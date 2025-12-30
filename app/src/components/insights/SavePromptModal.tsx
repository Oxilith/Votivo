/**
 * @file src/components/insights/SavePromptModal.tsx
 * @purpose Modal to prompt users to sign in to save their analysis results
 * @functionality
 * - Shows after analysis is complete for unauthenticated users
 * - Offers options to sign in, create account, or continue without saving
 * - Displays brief explanation of benefits of saving
 * - Supports Ink & Stone design system styling
 * @dependencies
 * - React
 * - @/components/shared/icons
 */

import type { FC } from 'react';
import { CheckIcon } from '@/components';

/**
 * Props for SavePromptModal
 */
interface SavePromptModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Handler for sign in action */
  onSignIn: () => void;
  /** Handler for create account action */
  onCreateAccount: () => void;
  /** Handler for continue without saving */
  onContinue: () => void;
}

/**
 * Benefits list for saving
 */
const SAVE_BENEFITS = [
  'Access your analysis anytime',
  'Track your progress over time',
  'Compare multiple analyses',
  'Never lose your insights',
];

/**
 * SavePromptModal - Prompts users to save their analysis
 */
const SavePromptModal: FC<SavePromptModalProps> = ({
  isOpen,
  onSignIn,
  onCreateAccount,
  onContinue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onContinue}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-2xl overflow-hidden">
        {/* Header accent */}
        <div className="h-1 bg-[var(--accent)]" />

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--accent)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl text-[var(--text-primary)] text-center mb-2">
            Save Your Analysis?
          </h2>

          {/* Description */}
          <p className="font-body text-[var(--text-secondary)] text-center mb-6">
            Create a free account to keep your insights safe and track your journey over time.
          </p>

          {/* Benefits */}
          <ul className="space-y-2 mb-8">
            {SAVE_BENEFITS.map((benefit, index) => (
              <li
                key={index}
                className="flex items-center gap-3 font-body text-sm text-[var(--text-secondary)]"
              >
                <CheckIcon size="sm" className="text-[var(--accent)] flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onCreateAccount}
              className="cta-button w-full py-3 px-6 font-body font-medium text-white bg-[var(--accent)]"
            >
              Create Free Account
            </button>

            <button
              onClick={onSignIn}
              className="w-full py-3 px-6 font-body font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Sign In to Existing Account
            </button>

            <button
              onClick={onContinue}
              className="w-full py-2 font-body text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Continue without saving
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePromptModal;
