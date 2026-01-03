/**
 * @file src/components/assessment/AssessmentHeader.tsx
 * @purpose Unified header bar for assessment wizard with state-dependent content
 * @functionality
 * - Displays Skip to Last button (always visible, disabled at last step or readonly)
 * - Shows Import button for in-progress assessments
 * - Displays View Only badge, title, and DateBadge for completed assessments
 * - Provides Export and Retake buttons for completed assessments
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - @/components (DateBadge, DownloadIcon, UploadIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DateBadge, DownloadIcon, UploadIcon } from '@/components';

interface AssessmentHeaderProps {
  /** Whether the assessment is in readonly mode (completed/saved) */
  isReadOnly: boolean;
  /** ISO date string when the assessment was created (for readonly mode) */
  createdAt?: string;
  /** Current phase index */
  currentPhase: number;
  /** Current step index within the phase */
  currentStep: number;
  /** Furthest reached phase index */
  lastReachedPhase: number;
  /** Furthest reached step index */
  lastReachedStep: number;
  /** Skip to last reached step callback */
  onSkipToLast: () => void;
  /** Retake assessment callback (clears and starts new) */
  onRetake: () => void;
  /** Import assessment callback */
  onImport: () => void;
  /** Export assessment callback */
  onExport: () => void;
}

/**
 * AssessmentHeader - Unified header for all assessment states
 *
 * Left side:  Empty (in-progress) | View Only badge + title + DateBadge (completed)
 * Right side: Skip to Last + Import (in-progress) | Skip to Last (disabled) + Export + Retake (completed)
 */
const AssessmentHeader: FC<AssessmentHeaderProps> = ({
  isReadOnly,
  createdAt,
  currentPhase,
  currentStep,
  lastReachedPhase,
  lastReachedStep,
  onSkipToLast,
  onRetake,
  onImport,
  onExport,
}) => {
  const { t } = useTranslation(['assessment', 'header']);

  // Skip to Last is disabled if already at the last reached step OR in readonly mode
  const isAtLastReachedStep =
    currentPhase === lastReachedPhase && currentStep === lastReachedStep;
  const skipToLastDisabled = isAtLastReachedStep || isReadOnly;

  return (
    <div
      data-testid="assessment-header"
      className="fixed top-20 lg:top-24 left-4 right-4 lg:left-10 lg:right-10 z-40 flex items-center justify-between px-4 py-2 lg:px-6 bg-[var(--bg-secondary)]/90 backdrop-blur-[8px] border border-[var(--border)] transition-colors"
    >
      {/* Left Side - View Only info or empty */}
      <div className="flex items-center gap-4">
        {isReadOnly && (
          <>
            {/* View Only Badge */}
            <span
              data-testid="view-only-badge"
              className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30"
            >
              {t('header:viewOnly.badge')}
            </span>

            {/* Title */}
            <span className="hidden sm:block font-body text-sm text-[var(--text-muted)]">
              {t('header:viewOnly.savedAssessment')}
            </span>

            {/* DateBadge */}
            {createdAt && <DateBadge date={createdAt} />}
          </>
        )}
      </div>

      {/* Right Side - Skip to Last always first, then Import/Export, then Retake */}
      <div className="flex items-center gap-2">
        {/* Skip to Last - always visible, disabled at last step or in readonly */}
        <button
          type="button"
          onClick={onSkipToLast}
          disabled={skipToLastDisabled}
          data-testid="assessment-btn-skip-to-last"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--text-muted)] disabled:hover:border-[var(--border)]"
        >
          {t('assessment:navigation.skipToLast')}
        </button>

        {isReadOnly ? (
          <>
            {/* Export Button */}
            <button
              type="button"
              onClick={onExport}
              data-testid="export-btn-assessment"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
            >
              <DownloadIcon size="sm" />
              <span className="hidden sm:inline">{t('header:buttons.exportAssessment')}</span>
              <span className="sm:hidden">{t('header:buttons.export')}</span>
            </button>

            {/* Retake Button */}
            <button
              type="button"
              onClick={onRetake}
              data-testid="assessment-btn-retake"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--accent)] hover:text-[var(--accent)] border border-[var(--accent)]/50 hover:border-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors"
            >
              {t('assessment:navigation.retakeAssessment')}
            </button>
          </>
        ) : (
          /* In-progress: Import button */
          <button
            type="button"
            onClick={onImport}
            data-testid="import-btn-assessment"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
          >
            <UploadIcon size="sm" />
            <span className="hidden sm:inline">{t('assessment:navigation.import')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AssessmentHeader;
