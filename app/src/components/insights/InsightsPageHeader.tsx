/**
 * @file src/components/insights/InsightsPageHeader.tsx
 * @purpose Header section for insights page with state-dependent content
 * @functionality
 * - Always visible on insights page for consistent header structure
 * - Displays "View Only" badge and DateBadge when viewing saved analysis
 * - Shows empty left side in edit mode (no badge/date)
 * - Provides Export dropdown for exporting analysis and/or assessment
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - @/components/shared/DateBadge
 * - @/components/shared/ExportDropdown
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DateBadge, ExportDropdown } from '@/components';

interface InsightsPageHeaderProps {
  /** Whether the insights page is in readonly mode (viewing saved analysis) */
  isReadOnly?: boolean;
  /** ISO date string when the analysis was created (for readonly mode) */
  createdAt?: string;
  /** Export callback for exporting this analysis */
  onExportAnalysis?: () => void;
  /** Export callback for exporting the linked assessment (if available) */
  onExportAssessment?: () => void;
}

/**
 * InsightsPageHeader - Header for insights page
 * Shows badge, title, date in readonly mode; export buttons when data available
 */
const InsightsPageHeader: FC<InsightsPageHeaderProps> = ({
  isReadOnly = false,
  createdAt,
  onExportAnalysis,
  onExportAssessment,
}) => {
  const { t } = useTranslation('header');

  const hasExportOptions = onExportAnalysis ?? onExportAssessment;

  return (
    <div
      data-testid="insights-page-header"
      className="fixed top-20 lg:top-24 left-4 right-4 lg:left-10 lg:right-10 z-40 flex items-center justify-between px-4 py-2 lg:px-6 bg-[var(--bg-secondary)]/90 backdrop-blur-[8px] border border-[var(--border)] transition-colors"
    >
      {/* Left: Badge and Title (readonly) or empty (edit mode) */}
      <div className="flex items-center gap-4">
        {isReadOnly && (
          <>
            {/* View Only Badge */}
            <span
              data-testid="view-only-badge"
              className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30"
            >
              {t('viewOnly.badge')}
            </span>

            {/* Title */}
            <span className="hidden sm:block font-body text-sm text-[var(--text-muted)]">
              {t('viewOnly.savedAnalysis')}
            </span>

            {/* DateBadge */}
            {createdAt && <DateBadge date={createdAt} />}
          </>
        )}
      </div>

      {/* Right: Export Dropdown */}
      {hasExportOptions && (
        <ExportDropdown
          onExportAssessment={onExportAssessment}
          onExportAnalysis={onExportAnalysis}
        />
      )}
    </div>
  );
};

export default InsightsPageHeader;
