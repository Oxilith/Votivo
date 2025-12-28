/**
 * @file src/components/landing/sections/FooterSection.tsx
 * @purpose Footer section with branding, GitHub link, and attribution
 * @functionality
 * - Displays Votive logo and brand name
 * - Shows GitHub repository link with icon
 * - Displays MIT License and author attribution
 * - Features electric gradient divider line at top
 * - Adapts styling for light and dark themes
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components/landing/shared/VotiveLogo
 * - @/components/shared/icons (GitHubIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import VotiveLogo from '@/components/landing/shared/VotiveLogo';
import { GitHubIcon } from '@/components/shared/icons';

const FooterSection: FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative py-12 px-6 bg-[var(--bg-primary)] border-t border-white/5">
      {/* Gradient divider line - violet in light mode, electric in dark mode */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-violet)]/40 dark:via-[var(--color-electric)]/40 to-transparent" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <VotiveLogo size="sm" />
          <span className="font-serif text-lg text-[var(--text-primary)]">
            {t('landing.footer.brand')}
          </span>
        </div>

        {/* Links and Attribution */}
        <div className="flex items-center gap-8 text-sm text-[var(--text-muted)]">
          <a
            href="https://github.com/Oxilith/Votive"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
          >
            <GitHubIcon size="sm" />
            {t('landing.footer.github')}
          </a>
          <span className="text-[var(--text-muted)]/60">{t('landing.footer.license')}</span>
          <span className="text-[var(--text-muted)]/60">{t('landing.footer.author')}</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
