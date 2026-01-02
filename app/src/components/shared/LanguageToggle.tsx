/**
 * @file src/components/shared/LanguageToggle.tsx
 * @purpose Inline language toggle button (EN | PL) for navigation
 * @functionality
 * - Displays EN and PL buttons with divider
 * - Highlights active language
 * - Triggers language change on click via i18next
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle: FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div
      className="flex items-center gap-0.5 font-mono text-xs text-[var(--text-faint)]"
      role="group"
      aria-label="Language selection"
      data-testid="language-toggle"
    >
      <button
        onClick={() => { changeLanguage('en'); }}
        aria-pressed={i18n.language === 'en'}
        data-testid="language-btn-en"
        className={`px-1.5 py-1 transition-colors ${
          i18n.language === 'en'
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-faint)] hover:text-[var(--text-primary)]'
        }`}
      >
        EN
      </button>
      <span className="text-[var(--border-strong)]" aria-hidden="true">|</span>
      <button
        onClick={() => { changeLanguage('pl'); }}
        aria-pressed={i18n.language === 'pl'}
        data-testid="language-btn-pl"
        className={`px-1.5 py-1 transition-colors ${
          i18n.language === 'pl'
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-faint)] hover:text-[var(--text-primary)]'
        }`}
      >
        PL
      </button>
    </div>
  );
};

export default LanguageToggle;
