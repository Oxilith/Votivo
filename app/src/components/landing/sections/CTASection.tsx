/**
 * @file src/components/landing/sections/CTASection.tsx
 * @purpose Final call-to-action section encouraging users to begin their discovery
 * @functionality
 * - Displays Votive logo with glow effect
 * - Shows compelling headline and supporting text
 * - Provides primary CTA button with enhanced glow effect
 * - Shows time estimate and open source messaging
 * - Features subtle grid pattern background overlay
 * - Adapts styling for light (dark background) and dark (graphite background) themes
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components/landing/shared/VotiveLogo
 * - @/components/shared/icons (ArrowRightIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import VotiveLogo from '@/components/landing/shared/VotiveLogo';
import { ArrowRightIcon } from '@/components/shared/icons';

interface CTASectionProps {
  onStartDiscovery: () => void;
}

const CTASection: FC<CTASectionProps> = ({ onStartDiscovery }) => {
  const { t } = useTranslation();

  return (
    <section
      id="begin"
      className="py-24 px-6 bg-[var(--bg-section-alt)] text-[var(--color-parchment)] dark:text-[var(--color-mist)] relative overflow-hidden"
    >
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-[0.18] dark:opacity-[0.09]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto text-center relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <VotiveLogo size="md" withGlow />
        </div>

        {/* Headline */}
        <h2 className="font-serif text-4xl md:text-5xl font-medium mb-6">
          {t('landing.cta.title')}
        </h2>

        {/* Supporting Text */}
        <p className="text-lg text-[var(--color-parchment)]/70 dark:text-[var(--color-fog)] mb-8 max-w-xl mx-auto">
          {t('landing.cta.subtitle')}
        </p>

        {/* CTA Button */}
        <button
          onClick={onStartDiscovery}
          className="cta-button inline-flex items-center gap-3 tech-gradient text-white px-8 py-4 text-base font-medium tracking-wide hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-electric)]/30 mb-8"
        >
          {t('landing.cta.button')}
          <ArrowRightIcon size="md" />
        </button>

        {/* Time Estimate */}
        <p className="text-sm text-[var(--color-parchment)]/50 dark:text-[var(--color-fog)]/50 mb-2">
          {t('landing.cta.timeEstimate')}
        </p>

        {/* Open Source Note */}
        <p className="text-xs text-[var(--color-parchment)]/40 dark:text-[var(--color-fog)]/40">
          {t('landing.cta.openSource')}
        </p>
      </div>
    </section>
  );
};

export default CTASection;
