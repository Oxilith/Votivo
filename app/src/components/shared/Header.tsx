/**
 * @file src/components/shared/Header.tsx
 * @purpose Persistent header component with navigation, data management, theme, and language controls
 * @functionality
 * - Displays application branding with Votive logo
 * - Provides navigation links to landing page sections (Philosophy, Journey, AI Insights)
 * - Shows Assessment and Analysis view indicators with active states
 * - Provides more menu with import/export functionality
 * - Shows error messages for invalid imports
 * - Displays theme toggle (sun/moon icons) for dark/light mode switching
 * - Displays language selector (EN/PL) for internationalization
 * @dependencies
 * - React (useRef, useState, useEffect)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (AssessmentResponses, AppView)
 * - @/utils/fileUtils (importFromJson)
 * - @/hooks/useThemeContext (useThemeContext)
 * - @/components/landing/shared/VotiveLogo
 * - @/components/shared/icons (ChevronDownIcon, SunIcon, MoonIcon, MoreVerticalIcon, UploadIcon, DownloadIcon, ErrorCircleIcon)
 */

import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssessmentResponses, AppView } from '@/types/assessment.types';
import { importFromJson } from '@/utils/fileUtils';
import { useThemeContext } from '@/hooks/useThemeContext';
import VotiveLogo from '@/components/landing/shared/VotiveLogo';
import {
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  MoreVerticalIcon,
  UploadIcon,
  DownloadIcon,
  ErrorCircleIcon,
} from '@/components/shared/icons';

interface HeaderProps {
  currentView: AppView;
  hasResponses: boolean;
  hasReachedSynthesis: boolean;
  onImport: (data: AssessmentResponses) => void;
  onExport: () => void;
  onExportAnalysis?: () => void;
  hasAnalysis?: boolean;
  onNavigateToLanding: (hash?: string) => void;
  onNavigateToAssessment: () => void;
  onNavigateToInsights: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  hasResponses,
  hasReachedSynthesis,
  onImport,
  onExport,
  onExportAnalysis,
  hasAnalysis,
  onNavigateToLanding,
  onNavigateToAssessment,
  onNavigateToInsights,
}) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useThemeContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showAnalysisTooltip, setShowAnalysisTooltip] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const data = await importFromJson(file);
      onImport(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('header.errors.importFailed'));
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMoreMenuOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setMoreMenuOpen(false);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  const handleExportResponses = () => {
    onExport();
    setMoreMenuOpen(false);
  };

  const handleExportAnalysis = () => {
    onExportAnalysis?.();
    setMoreMenuOpen(false);
  };

  const handleAnalysisClick = () => {
    if (hasReachedSynthesis) {
      onNavigateToInsights();
    } else {
      setShowAnalysisTooltip(true);
      setTimeout(() => setShowAnalysisTooltip(false), 3000);
    }
  };

  const navLinkClass = 'nav-link text-sm tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer';
  const activeNavClass = 'nav-link text-sm tracking-wide text-[var(--text-primary)] transition-colors cursor-pointer';
  const disabledNavClass = 'nav-link text-sm tracking-wide text-[var(--text-muted)] cursor-not-allowed opacity-50';

  return (
    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <button
            onClick={() => onNavigateToLanding()}
            className="flex items-center gap-3 cursor-pointer"
          >
            <VotiveLogo size="sm" />
            <span className="font-serif text-xl font-semibold text-[var(--text-primary)]">
              {t('header.title')}
            </span>
          </button>

          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => onNavigateToLanding('philosophy')}
                className={navLinkClass}
              >
                {t('header.nav.philosophy')}
              </button>
              <button
                onClick={() => onNavigateToLanding('journey')}
                className={navLinkClass}
              >
                {t('header.nav.journey')}
              </button>
              <button
                onClick={() => onNavigateToLanding('insights')}
                className={navLinkClass}
              >
                {t('header.nav.insights')}
              </button>

              {/* Assessment Link */}
              <button
                onClick={onNavigateToAssessment}
                className={currentView === 'assessment' ? activeNavClass : navLinkClass}
              >
                {t('header.nav.assessment')}
              </button>

              {/* Analysis Link */}
              <div className="relative">
                <button
                  onClick={handleAnalysisClick}
                  className={
                    currentView === 'insights'
                      ? activeNavClass
                      : hasReachedSynthesis
                        ? navLinkClass
                        : disabledNavClass
                  }
                >
                  {t('header.nav.analysis')}
                </button>
                {showAnalysisTooltip && !hasReachedSynthesis && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-lg text-xs text-[var(--text-secondary)] whitespace-nowrap z-50">
                    {t('header.nav.completeAssessment')}
                  </div>
                )}
              </div>
            </nav>

            {/* Separator */}
            <div className="h-6 w-px bg-[var(--border-subtle)]" />

            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card)] font-medium transition-colors flex items-center gap-1.5"
              >
                <span>{i18n.language === 'pl' ? 'PL' : 'EN'}</span>
                <ChevronDownIcon size="sm" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-1 py-1 w-32 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-lg z-50">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] ${
                      i18n.language === 'en' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('header.language.en')}
                  </button>
                  <button
                    onClick={() => changeLanguage('pl')}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] ${
                      i18n.language === 'pl' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('header.language.pl')}
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
              aria-label={isDark ? t('header.theme.toggleLight') : t('header.theme.toggleDark')}
            >
              {isDark ? <SunIcon size="md" /> : <MoonIcon size="md" />}
            </button>

            {/* More Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
                aria-label={t('header.menu.more')}
              >
                <MoreVerticalIcon size="md" />
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 mt-1 py-1 w-48 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-lg z-50">
                  {/* Hidden file input */}
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

                  <button
                    onClick={handleImportClick}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                  >
                    <UploadIcon size="sm" />
                    {t('header.buttons.import')}
                  </button>

                  {hasResponses && (
                    <button
                      onClick={handleExportResponses}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                    >
                      <DownloadIcon size="sm" />
                      {t('header.buttons.exportResponses')}
                    </button>
                  )}

                  {hasAnalysis && currentView === 'insights' && (
                    <button
                      onClick={handleExportAnalysis}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                    >
                      <DownloadIcon size="sm" />
                      {t('header.buttons.exportAnalysis')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Import error message */}
        {importError && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <ErrorCircleIcon size="sm" className="flex-shrink-0" />
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
