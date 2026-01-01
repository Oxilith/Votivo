/**
 * @file src/components/not-found/NotFoundPage.tsx
 * @purpose 404 error page following the Ink & Stone design system
 * @functionality
 * - Displays a user-friendly 404 error message
 * - Provides navigation back to home page
 * - Supports English and Polish translations
 * - Theme-aware styling with Ink & Stone aesthetic
 * - Includes InkBrushDecoration for visual consistency
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/hooks (useRouting)
 * - @/components/shared (InkBrushDecoration)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouting } from '@/hooks';
import { InkBrushDecoration } from '@/components';

/**
 * NotFoundPage - 404 error page with Ink & Stone aesthetic
 */
const NotFoundPage: FC = () => {
  const { t } = useTranslation('notFound');
  const { navigate } = useRouting();

  const handleGoHome = () => {
    navigate('landing');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 relative">
      {/* Ink brush decoration */}
      <InkBrushDecoration />

      <div className="max-w-md text-center relative z-10">
        {/* 404 code */}
        <div className="mb-6">
          <span className="font-display text-8xl sm:text-9xl text-[var(--accent)] opacity-80">
            {t('code')}
          </span>
        </div>

        {/* Error title */}
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)] mb-4">
          {t('title')}
        </h1>

        {/* Error description */}
        <p className="font-body text-[var(--text-secondary)] mb-8 leading-relaxed">
          {t('description')}
        </p>

        {/* Go home button */}
        <button
          onClick={handleGoHome}
          className="cta-button px-8 py-3 bg-[var(--accent)] text-white font-body text-base
                   hover:bg-[var(--accent-soft)] transition-all duration-200
                   hover:-translate-y-0.5 hover:shadow-lg"
        >
          {t('goHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
