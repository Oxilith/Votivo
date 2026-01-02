/**
 * @file src/components/shared/ExportDropdown.tsx
 * @purpose Click-to-open dropdown for exporting assessment and/or analysis data
 * @functionality
 * - Displays "Export" button with chevron indicator
 * - Opens dropdown menu on click with export options
 * - Conditionally shows export options based on data availability
 * - Closes on outside click or option selection
 * - Chevron rotates when dropdown is open
 * @dependencies
 * - React (FC, useState, useRef, useEffect)
 * - react-i18next (useTranslation)
 * - ./icons (ChevronDownIcon, DownloadIcon)
 */

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, DownloadIcon } from './icons';

interface ExportDropdownProps {
  onExportAssessment?: () => void;
  onExportAnalysis?: () => void;
}

const ExportDropdown: FC<ExportDropdownProps> = ({
  onExportAssessment,
  onExportAnalysis,
}) => {
  const { t } = useTranslation('header');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasExportOptions = onExportAssessment ?? onExportAnalysis;

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render if no export options available
  if (!hasExportOptions) {
    return null;
  }

  const handleExportAssessment = () => {
    onExportAssessment?.();
    setIsOpen(false);
  };

  const handleExportAnalysis = () => {
    onExportAnalysis?.();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="export-dropdown-trigger"
      >
        <DownloadIcon size="sm" />
        <span>{t('buttons.export')}</span>
        <ChevronDownIcon
          size="xs"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[180px] bg-[var(--bg-primary)] border border-[var(--border)] shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
          data-testid="export-dropdown-menu"
        >
          {onExportAssessment && (
            <button
              onClick={handleExportAssessment}
              role="menuitem"
              data-testid="export-btn-assessment"
              className="w-full text-left px-4 py-2.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {t('buttons.exportAssessment')}
            </button>
          )}
          {onExportAnalysis && (
            <button
              onClick={handleExportAnalysis}
              role="menuitem"
              data-testid="export-btn-analysis"
              className="w-full text-left px-4 py-2.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {t('buttons.exportInsights')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
