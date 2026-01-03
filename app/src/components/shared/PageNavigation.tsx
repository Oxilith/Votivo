/**
 * @file src/components/shared/PageNavigation.tsx
 * @purpose Unified navigation component for Assessment, Insights, and Profile pages
 * @functionality
 * - Displays logo and brand that navigates to landing page
 * - Shows Assessment and Insights links with active state based on current page
 * - Shows language toggle (EN/PL), theme toggle, and user avatar/sign in
 * - Import/Export is handled by page-specific headers (AssessmentHeader, InsightsPageHeader)
 * @dependencies
 * - React (FC)
 * - react-i18next (useTranslation)
 * - @/components (VotiveLogo)
 * - ./LanguageToggle
 * - ./ThemeToggle
 * - ./UserAvatarDropdown
 * - @/stores (useCurrentUser)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { VotiveLogo } from '@/components';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import UserAvatarDropdown from './UserAvatarDropdown';
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
  onNavigateToProfile,
  onSignOut,
}) => {
  const { t } = useTranslation(['landing', 'header']);
  const user = useCurrentUser();
  const isAuthenticated = user !== null;

  return (
    <>
      {/* Background mask - sits below headers, above page content */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-30 pointer-events-none h-[120px] lg:h-[136px] bg-[var(--bg-primary)]/85 backdrop-blur-[12px]"
      />
      <nav
        className="fixed top-4 left-4 right-4 lg:top-6 lg:left-10 lg:right-10 z-50 flex justify-between items-center px-4 py-3 lg:px-6 bg-[var(--bg-primary)]/85 backdrop-blur-[12px] border border-[var(--border)] transition-colors"
        data-testid="nav-header"
        aria-label="Main navigation"
      >
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
            data-testid="nav-link-assessment"
            aria-current={currentPage === 'assessment' ? 'page' : undefined}
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
            data-testid="nav-link-insights"
            aria-current={currentPage === 'insights' ? 'page' : undefined}
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

      {/* Right Section: Controls */}
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <ThemeToggle />

        {/* User Avatar Dropdown or Sign In */}
        {isAuthenticated && onSignOut ? (
          <UserAvatarDropdown
            onNavigateToProfile={onNavigateToProfile}
            onSignOut={onSignOut}
          />
        ) : (
          <button
            onClick={() => onNavigateToAuth?.()}
            data-testid="nav-btn-signin"
            className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t('nav.signIn')}
          </button>
        )}
      </div>
      </nav>
    </>
  );
};

export default PageNavigation;
