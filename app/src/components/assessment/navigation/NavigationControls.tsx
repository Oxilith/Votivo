/**
 * @file app/src/components/assessment/navigation/NavigationControls.tsx
 * @purpose Back and Continue/Complete navigation buttons with Ink & Stone styling
 * @functionality
 * - Renders back button (disabled on first step)
 * - Renders vermilion continue button for regular steps
 * - Renders complete button for synthesis step with save functionality
 * - Shows saving state with disabled button when saving
 * - Displays validation error message when step is incomplete
 * - Sticky positioning at bottom of viewport
 * - Uses cta-button class for lift/shrink hover effects
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 */

import { useTranslation } from 'react-i18next';
import React from "react";

interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  showNavigation: boolean;
  isSynthesis?: boolean;
  onComplete?: () => void;
  /** Whether save is in progress (disables complete button) */
  isSaving?: boolean;
  /** Validation error message to display */
  validationError?: string | null;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  onNext,
  isFirstStep,
  showNavigation,
  isSynthesis = false,
  onComplete,
  isSaving = false,
  validationError,
}) => {
  const { t } = useTranslation('assessment');

  if (!showNavigation) {
    return null;
  }

  const handlePrimaryAction = isSynthesis && onComplete ? onComplete : onNext;
  const primaryButtonText = isSaving
    ? t('navigation.saving', 'Saving...')
    : isSynthesis
      ? t('navigation.complete')
      : t('navigation.continue');

  const isPrimaryDisabled = isSaving;

  return (
    <div className="border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-secondary)]">
      {/* Validation error message */}
      {validationError && (
        <div
          className="max-w-6xl mx-auto px-6 pt-3"
          role="alert"
          data-testid="validation-error"
        >
          <p className="text-sm text-[var(--error)] font-body">
            {validationError}
          </p>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
        <button
          onClick={onBack}
          disabled={isFirstStep || isSaving}
          data-testid="assessment-back-button"
          className={`px-5 py-2.5 font-body font-medium rounded-sm transition-colors ${
            isFirstStep || isSaving
              ? 'text-[var(--text-muted)] cursor-not-allowed opacity-50'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          {t('navigation.back')}
        </button>
        <button
          onClick={handlePrimaryAction}
          disabled={isPrimaryDisabled}
          data-testid={isSynthesis ? 'assessment-complete-button' : 'assessment-continue-button'}
          className={`cta-button px-5 py-2.5 bg-[var(--accent)] text-white font-body font-medium rounded-sm ${
            isPrimaryDisabled ? 'opacity-70 cursor-wait' : ''
          }`}
        >
          {primaryButtonText}
        </button>
      </div>
    </div>
  );
};
