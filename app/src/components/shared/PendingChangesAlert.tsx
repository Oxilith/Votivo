/**
 * @file src/components/shared/PendingChangesAlert.tsx
 * @purpose Alert component for notifying users about unsaved assessment changes
 * @functionality
 * - Displays warning message when assessment has unsaved changes
 * - Provides action button to navigate to assessment
 * - Uses Ink & Stone design system styling
 * - Supports optional custom message and button text
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - Ink & Stone design system CSS variables
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface PendingChangesAlertProps {
  /** Optional custom message override */
  message?: string;
  /** Optional custom button text override */
  buttonText?: string;
  /** Callback when action button is clicked */
  onNavigateToAssessment: () => void;
  /** Optional data-testid for E2E testing */
  'data-testid'?: string;
}

/**
 * Warning icon component
 */
const WarningIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * Alert component displaying pending changes warning with action button
 */
const PendingChangesAlert: FC<PendingChangesAlertProps> = ({
  message,
  buttonText,
  onNavigateToAssessment,
  'data-testid': testId = 'pending-changes-alert',
}) => {
  const { t } = useTranslation('insights');

  const alertMessage = message ?? t('dirty.message', 'You have pending changes in your assessment. Complete the assessment to save and enable new analysis.');
  const actionText = buttonText ?? t('dirty.action', 'Complete Assessment');

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid={testId}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-sm border border-[var(--accent)]/30 bg-[var(--accent)]/5"
    >
      <div className="flex items-center gap-3 flex-1">
        <WarningIcon className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]" data-testid={`${testId}-message`}>
          {alertMessage}
        </p>
      </div>
      <button
        type="button"
        onClick={onNavigateToAssessment}
        data-testid={`${testId}-action`}
        className="flex-shrink-0 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/30 rounded-sm hover:bg-[var(--accent)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      >
        {actionText}
      </button>
    </div>
  );
};

export default PendingChangesAlert;
