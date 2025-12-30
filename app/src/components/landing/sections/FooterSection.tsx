/**
 * @file src/components/landing/sections/FooterSection.tsx
 * @purpose Footer section with hanko seal logo, copyright, and simple border
 * @functionality
 * - Displays Votive hanko seal logo and brand name
 * - Shows GitHub repository link with icon
 * - Displays copyright text with dynamic year
 * - Displays author attribution
 * - Features simple border-top (not gradient)
 * - Adapts styling for light and dark themes
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components (VotiveLogo, GitHubIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { VotiveLogo, GitHubIcon } from '@/components';

const FooterSection: FC = () => {
  const { t } = useTranslation('landing');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-10 px-6 lg:px-10 border-t border-[var(--border)]">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        {/* Logo and Brand - Left */}
        <div className="flex items-center gap-2">
          <VotiveLogo size="sm" />
          <span className="font-display text-base font-semibold tracking-[0.05em]">
            {t('footer.brand')}
          </span>
        </div>

        {/* Copyright - Center */}
        <span className="font-body text-sm text-[var(--text-muted)]">
          {t('footer.copyright', { year: currentYear })}
        </span>

        {/* GitHub and Author - Right */}
        <div className="flex items-center gap-4 font-body text-sm text-[var(--text-muted)]">
          <a
            href="https://github.com/Oxilith/Votive"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
          >
            <GitHubIcon size="sm" />
            {t('footer.github')}
          </a>
          <span>{t('footer.author')}</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
