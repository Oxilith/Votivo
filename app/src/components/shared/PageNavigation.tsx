/**
 * @file src/components/shared/PageNavigation.tsx
 * @purpose Unified navigation component for Assessment, Insights, and Profile pages
 * @functionality
 * - Displays logo and brand that navigates to landing page
 * - Shows Assessment and Insights links with active state based on current page
 * - Renders Import button (Assessment page only, edit mode only)
 * - Renders Export dropdown with dynamic options based on data availability
 * - Shows language toggle (EN/PL), theme toggle, and user avatar/sign in
 * - Uses vertical dividers to separate navigation sections
 * - Hides Import/Export in read-only mode (handled by parent via not passing callbacks)
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - @/components (VotiveLogo)
 * - ./LanguageToggle
 * - ./ThemeToggle
 * - ./ExportDropdown
 * - ./UserAvatarDropdown
 * - ./icons (UploadIcon)
 * - @/stores (useCurrentUser)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { VotiveLogo } from '@/components';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import ExportDropdown from './ExportDropdown';
import UserAvatarDropdown from './UserAvatarDropdown';
import { UploadIcon } from './icons';
import { useCurrentUser } from '@/stores';

interface PageNavigationProps {
  /** Current page for highlighting active link */
  currentPage: 'assessment' | 'insights' | 'profile';
  /** Navigate to landing page */
  onNavigateToLanding?: () => void;
  /** Navigate to assessment page */
  onNavigateToAssessment?: () => void;
  /** Navigate to insights page */
  onNavigateToInsights?: () => void;
  /** Navigate to authentication page */
  onNavigateToAuth?: () => void;
  /** Import assessment callback - only shown on assessment page when provided */
  onImport?: () => void;
  /** Export assessment callback - shown when assessment data exists */
  onExportAssessment?: () => void;
  /** Export analysis callback - shown when analysis data exists */
  onExportAnalysis?: () => void;
  /** Navigate to user profile */
  onNavigateToProfile?: () => void;
  /** Sign out callback */
  onSignOut?: () => void;
}

const PageNavigation: FC<PageNavigationProps> = ({
  currentPage,
  onNavigateToLanding,
  onNavigateToAssessment,
  onNavigateToInsights,
  onNavigateToAuth,
  onImport,
  onExportAssessment,
  onExportAnalysis,
  onNavigateToProfile,
  onSignOut,
}) => {
  const { t } = useTranslation(['landing', 'header']);
  const user = useCurrentUser();
  const isAuthenticated = user !== null;

  // Check if we have any import/export options to show
  const hasImportExport = onImport || onExportAssessment || onExportAnalysis;

  return (
    <nav className="fixed top-4 left-4 right-4 lg:top-6 lg:left-10 lg:right-10 z-[100] flex justify-between items-center px-4 py-3 lg:px-6 bg-[var(--bg-primary)]/85 backdrop-blur-[12px] border border-[var(--border)] transition-colors">
      {/* Left Section: Logo and Nav Links */}
      <div className="flex items-center gap-6 lg:gap-10">
        {/* Logo and Brand - Click to go back to landing */}
        <button
          onClick={() => onNavigateToLanding?.()}
          className="flex items-center gap-2 group"
        >
          <VotiveLogo size="sm" />
          <span className="font-display text-xl font-semibold tracking-[0.05em] text-[var(--text-primary)]">
            {t('nav.brand')}
          </span>
        </button>

        {/* Nav Links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigateToAssessment?.()}
            className={`nav-link font-body text-sm transition-colors cursor-pointer ${
              currentPage === 'assessment'
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('header:nav.assessment')}
          </button>
          <button
            type="button"
            onClick={() => onNavigateToInsights?.()}
            className={`nav-link font-body text-sm transition-colors cursor-pointer ${
              currentPage === 'insights'
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('header:nav.insights')}
          </button>
        </div>
      </div>

      {/* Right Section: Actions and Controls */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Import/Export Section - hidden on mobile */}
        {hasImportExport && (
          <>
            <div className="hidden md:flex items-center gap-3">
              {/* Import Button - only on assessment page */}
              {onImport && (
                <button
                  type="button"
                  onClick={onImport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
                >
                  <UploadIcon size="sm" />
                  <span>{t('header:buttons.import')}</span>
                </button>
              )}

              {/* Export Dropdown */}
              <ExportDropdown
                onExportAssessment={onExportAssessment}
                onExportAnalysis={onExportAnalysis}
              />
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-6 bg-[var(--border)]" />
          </>
        )}

        {/* Controls Section */}
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <ThemeToggle />

          {/* User Avatar Dropdown or Sign In */}
          {isAuthenticated && onNavigateToProfile && onSignOut ? (
            <UserAvatarDropdown
              onNavigateToProfile={onNavigateToProfile}
              onSignOut={onSignOut}
            />
          ) : (
            <button
              onClick={() => onNavigateToAuth?.()}
              className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PageNavigation;
