/**
 * @file src/components/landing/sections/CTASection.tsx
 * @purpose Final call-to-action section with centered vermilion button
 * @functionality
 * - Shows compelling headline with display font
 * - Provides vermilion CTA button with lift/shrink effect
 * - Shows time estimate only
 * - Uses primary background (not dark) for Ink & Stone aesthetic
 * - Centered layout with max-width constraint (600px)
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components/shared/icons (ArrowRightIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from '@/components';

interface CTASectionProps {
  onStartDiscovery: () => void;
}

const CTASection: FC<CTASectionProps> = ({ onStartDiscovery }) => {
  const { t } = useTranslation('landing');

  return (
    <section id="begin" className="pt-16 pb-28 bg-[var(--bg-primary)] relative">
      {/* Vertical accent line at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-[var(--accent)] opacity-30"
        style={{
          animation: 'brush-reveal 0.8s var(--ease-out) forwards',
          transformOrigin: 'top',
        }}
      />

      <div className="max-w-[600px] mx-auto px-6 lg:px-10 text-center pt-12">
        {/* Headline */}
        <h2 className="font-display text-[clamp(2rem,5vw,2.75rem)] font-medium leading-[1.2] mb-4 reveal">
          {t('cta.title')}
        </h2>

        {/* Supporting Text */}
        <p className="font-body text-[1.0625rem] text-[var(--text-secondary)] leading-[1.8] mb-10 reveal">
          {t('cta.subtitle')}
        </p>

        {/* CTA Button */}
        <button
          onClick={onStartDiscovery}
          className="cta-button inline-flex items-center gap-4 bg-[var(--accent)] text-white px-10 py-4 text-base font-medium rounded-sm mb-10 opacity-0 reveal"
          style={{ animation: 'fade-up-opacity 0.8s var(--ease-out) 0.2s forwards' }}
        >
          {t('cta.button')}
          <ArrowRightIcon size="md" />
        </button>

        {/* Time Estimate */}
        <p className="font-body text-sm text-[var(--text-muted)] leading-[1.8] reveal">
          {t('cta.timeEstimate')}
        </p>
      </div>
    </section>
  );
};

export default CTASection;
