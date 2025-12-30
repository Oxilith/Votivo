/**
 * @file src/components/insights/InsightsPageHeader.tsx
 * @purpose Header section displayed when viewing a saved analysis in read-only mode
 * @functionality
 * - Displays "View Only" badge to indicate non-editable state
 * - Shows "Saved Analysis" title for context
 * - Renders DateBadge with analysis creation date
 * - Provides Export button(s) for exporting analysis and optionally linked assessment
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - @/components/shared/DateBadge
 * - @/components/shared/icons (DownloadIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DateBadge, DownloadIcon } from '@/components';

interface InsightsPageHeaderProps {
  /** ISO date string when the analysis was created */
  createdAt: string;
  /** Export callback for exporting this analysis */
  onExportAnalysis?: () => void;
  /** Export callback for exporting the linked assessment (if available) */
  onExportAssessment?: () => void;
}

/**
 * InsightsPageHeader - Header for view-only insights pages
 * Shows badge, title, date, and export action(s)
 */
const InsightsPageHeader: FC<InsightsPageHeaderProps> = ({
  createdAt,
  onExportAnalysis,
  onExportAssessment,
}) => {
  const { t } = useTranslation('header');

  const hasExportOptions = onExportAnalysis || onExportAssessment;

  return (
    <div className="fixed top-20 lg:top-24 left-4 right-4 lg:left-10 lg:right-10 z-40 flex items-center justify-between px-4 py-2 lg:px-6 bg-[var(--bg-secondary)]/90 backdrop-blur-[8px] border border-[var(--border)] transition-colors">
      {/* Left: Badge and Title */}
      <div className="flex items-center gap-4">
        {/* View Only Badge */}
        <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30">
          {t('viewOnly.badge')}
        </span>

        {/* Title */}
        <span className="hidden sm:block font-body text-sm text-[var(--text-muted)]">
          {t('viewOnly.savedAnalysis')}
        </span>

        {/* DateBadge */}
        <DateBadge date={createdAt} />
      </div>

      {/* Right: Export Buttons */}
      {hasExportOptions && (
        <div className="flex items-center gap-2">
          {/* Export Analysis Button */}
          {onExportAnalysis && (
            <button
              type="button"
              onClick={onExportAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
            >
              <DownloadIcon size="sm" />
              <span className="hidden sm:inline">{t('buttons.exportInsights')}</span>
              <span className="sm:hidden">{t('buttons.export')}</span>
            </button>
          )}

          {/* Export Linked Assessment Button (if available) */}
          {onExportAssessment && (
            <button
              type="button"
              onClick={onExportAssessment}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-faint)] hover:text-[var(--text-muted)] border border-[var(--border-faint)] hover:border-[var(--border)] transition-colors"
            >
              <DownloadIcon size="sm" />
              <span>{t('buttons.exportAssessment')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InsightsPageHeader;
