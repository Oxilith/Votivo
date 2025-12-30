/**
 * @file src/components/auth/AuthLayout.tsx
 * @purpose Shared layout for authentication pages with Ink & Stone styling
 * @functionality
 * - Provides consistent floating header matching landing page NavSection
 * - Includes language switcher (EN/PL) for internationalization
 * - Includes fixed ink brush SVG decoration
 * - Provides centered content card with proper styling
 * - Handles theme toggle and navigation to landing
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components/landing/shared/VotiveLogo
 * - @/components/shared/InkBrushDecoration
 * - @/components/shared/icons
 * - @/hooks/useThemeContext
 * - @/hooks/useRouting
 */

import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { VotiveLogo, InkBrushDecoration, SunIcon, MoonIcon } from '@/components';
import { useThemeContext, useRouting } from '@/hooks';

interface AuthLayoutProps {
  children: ReactNode;
  /** Maximum width of the content card */
  maxWidth?: 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * AuthLayout - Shared layout for auth pages matching Ink & Stone design
 */
const AuthLayout: FC<AuthLayoutProps> = ({ children, maxWidth = 'md' }) => {
  const { i18n } = useTranslation();
  const { isDark, toggleTheme } = useThemeContext();
  const { navigate } = useRouting();

  const handleNavigateToLanding = () => {
    navigate('landing');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Ink Brush Decoration */}
      <InkBrushDecoration />

      {/* Floating Header - matches NavSection */}
      <nav className="fixed top-4 left-4 right-4 lg:top-6 lg:left-10 lg:right-10 z-50 flex justify-between items-center px-4 py-3 lg:px-6 bg-[var(--bg-primary)]/85 backdrop-blur-[12px] border border-[var(--border)] transition-colors">
        {/* Logo and Brand */}
        <button
          onClick={handleNavigateToLanding}
          className="flex items-center gap-2 group"
        >
          <VotiveLogo size="sm" />
          <span className="font-display text-xl font-semibold tracking-[0.05em] text-[var(--text-primary)]">
            Votive
          </span>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Language Toggle - Inline EN | PL */}
          <div className="flex items-center gap-0.5 font-mono text-xs text-[var(--text-faint)]">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-1.5 py-1 transition-colors ${
                i18n.language === 'en'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-faint)] hover:text-[var(--text-primary)]'
              }`}
            >
              EN
            </button>
            <span className="text-[var(--border-strong)]">|</span>
            <button
              onClick={() => changeLanguage('pl')}
              className={`px-1.5 py-1 transition-colors ${
                i18n.language === 'pl'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-faint)] hover:text-[var(--text-primary)]'
              }`}
            >
              PL
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon size="sm" /> : <MoonIcon size="sm" />}
          </button>
        </div>
      </nav>

      {/* Main content - centered with proper spacing for floating nav */}
      <main className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12 lg:px-10">
        <div className={`w-full ${maxWidthClasses[maxWidth]}`}>
          {/* Card container */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 md:p-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
