/**
 * @file src/components/shared/Header.tsx
 * @purpose Persistent header component with navigation, data management, theme, and language controls
 * @functionality
 * - Displays application branding/title
 * - Provides import JSON file button with file input
 * - Provides export responses to JSON button
 * - Provides load sample data button for development/testing
 * - Shows error messages for invalid imports
 * - Displays theme toggle (sun/moon icons) for dark/light mode switching
 * - Displays language selector (EN/PL) for internationalization
 * @dependencies
 * - React (useRef, useState, useEffect)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (AssessmentResponses, AppView)
 * - @/utils/fileUtils (importFromJson)
 * - @/hooks/useThemeContext (useThemeContext)
 */

import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssessmentResponses, AppView } from '@/types/assessment.types';
import { importFromJson } from '@/utils/fileUtils';
import { useThemeContext } from '@/hooks/useThemeContext';

interface HeaderProps {
  currentView: AppView;
  hasResponses: boolean;
  onImport: (data: AssessmentResponses) => void;
  onExport: () => void;
  onExportAnalysis?: () => void;
  hasAnalysis?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, hasResponses, onImport, onExport, onExportAnalysis, hasAnalysis }) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useThemeContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
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
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  const handleExportResponses = () => {
    onExport();
    setExportMenuOpen(false);
  };

  const handleExportAnalysis = () => {
    onExportAnalysis?.();
    setExportMenuOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-gray-900 text-sm">🎯</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('header.title')}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'assessment' && (
              <>
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

                {/* Import button */}
                <button
                  onClick={handleImportClick}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('header.buttons.import')}
                </button>
              </>
            )}

            {/* Export button - simple on assessment, dropdown on insights */}
            {hasResponses && currentView === 'assessment' && (
              <button
                onClick={onExport}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('header.buttons.export')}
              </button>
            )}

            {/* Export dropdown on insights view */}
            {hasResponses && currentView === 'insights' && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('header.buttons.export')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-1 py-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleExportResponses}
                      className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t('header.buttons.exportResponses')}
                    </button>
                    {hasAnalysis && (
                      <button
                        onClick={handleExportAnalysis}
                        className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t('header.buttons.exportAnalysis')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <span>{i18n.language === 'pl' ? 'PL' : 'EN'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-1 py-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      i18n.language === 'en' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t('header.language.en')}
                  </button>
                  <button
                    onClick={() => changeLanguage('pl')}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      i18n.language === 'pl' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
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
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isDark ? t('header.theme.toggleLight') : t('header.theme.toggleDark')}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Import error message */}
        {importError && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
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
