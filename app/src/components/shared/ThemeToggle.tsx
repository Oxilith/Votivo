/**
 * @file src/components/shared/ThemeToggle.tsx
 * @purpose Inline theme toggle button for navigation (light/dark mode)
 * @functionality
 * - Displays sun icon in dark mode, moon icon in light mode
 * - Toggles theme on click via ThemeContext
 * - Provides accessible label for screen readers
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/hooks (useThemeContext)
 * - ./icons (SunIcon, MoonIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/hooks';
import { SunIcon, MoonIcon } from './icons';

const ThemeToggle: FC = () => {
  const { t } = useTranslation('header');
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
      aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
    >
      {isDark ? <SunIcon size="sm" /> : <MoonIcon size="sm" />}
    </button>
  );
};

export default ThemeToggle;
