/**
 * @file src/components/assessment/AssessmentPageHeader.tsx
 * @purpose Header section displayed when viewing a saved assessment in read-only mode
 * @functionality
 * - Displays "View Only" badge to indicate non-editable state
 * - Shows "Saved Assessment" title for context
 * - Renders DateBadge with assessment creation date
 * - Provides Export button for exporting the viewed assessment
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - @/components (DateBadge, DownloadIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DateBadge, DownloadIcon } from '@/components';

interface AssessmentPageHeaderProps {
  /** ISO date string when the assessment was created */
  createdAt: string;
  /** Export callback for exporting this assessment */
  onExport?: () => void;
}

/**
 * AssessmentPageHeader - Header for view-only assessment pages
 * Shows badge, title, date, and export action
 */
const AssessmentPageHeader: FC<AssessmentPageHeaderProps> = ({
  createdAt,
  onExport,
}) => {
  const { t } = useTranslation('header');

  return (
    <div
      data-testid="page-header"
      className="fixed top-20 lg:top-24 left-4 right-4 lg:left-10 lg:right-10 z-40 flex items-center justify-between px-4 py-2 lg:px-6 bg-[var(--bg-secondary)]/90 backdrop-blur-[8px] border border-[var(--border)] transition-colors"
    >
      {/* Left: Badge and Title */}
      <div className="flex items-center gap-4">
        {/* View Only Badge */}
        <span
          data-testid="view-only-badge"
          className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30"
        >
          {t('viewOnly.badge')}
        </span>

        {/* Title */}
        <span className="hidden sm:block font-body text-sm text-[var(--text-muted)]">
          {t('viewOnly.savedAssessment')}
        </span>

        {/* DateBadge */}
        <DateBadge date={createdAt} />
      </div>

      {/* Right: Export Button */}
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          data-testid="export-btn-assessment"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
        >
          <DownloadIcon size="sm" />
          <span className="hidden sm:inline">{t('buttons.exportAssessment')}</span>
          <span className="sm:hidden">{t('buttons.export')}</span>
        </button>
      )}
    </div>
  );
};

export default AssessmentPageHeader;
