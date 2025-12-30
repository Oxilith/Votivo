/**
 * @file src/components/landing/sections/HeroSection.tsx
 * @purpose Hero section with Ink & Stone Japanese minimalism and asymmetric layout
 * @functionality
 * - Displays eyebrow label with vermilion line prefix
 * - Shows hero tagline with fade-up animation
 * - Highlights key words in vermilion italic
 * - Provides vermilion CTA button with lift/shrink effect
 * - Shows vote counter in aside column (desktop only)
 * - Includes fixed ink brush decoration SVG on right side
 * - Uses fade-up-opacity animation pattern
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components (VoteCounter, InkBrushDecoration, ArrowRightIcon, ArrowDownIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { VoteCounter, InkBrushDecoration, ArrowRightIcon, ArrowDownIcon } from '@/components';

interface HeroSectionProps {
  onStartDiscovery: () => void;
}

const HeroSection: FC<HeroSectionProps> = ({ onStartDiscovery }) => {
  const { t } = useTranslation('landing');

  return (
    <section className="min-h-screen flex items-center py-28 relative overflow-visible">
      {/* Fixed Ink Brush Decoration - Right side */}
      <InkBrushDecoration />

      {/* Main Content - Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-12 lg:gap-28 max-w-[1200px] mx-auto px-6 lg:px-10 items-end">
        {/* Left Column - Content */}
        <div className="relative">
          {/* Hero Eyebrow */}
          <p
            className="inline-flex items-center gap-3 mb-6 font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-muted)] opacity-0"
            style={{ animation: 'fade-up 0.8s var(--ease-out) 0.2s forwards' }}
          >
            <span className="w-6 h-px bg-[var(--accent)]" />
            {t('hero.eyebrow', 'Identity-First Change')}
          </p>

          {/* Hero Tagline */}
          <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] font-medium leading-[1.15] tracking-[-0.02em] mb-10">
            <span
              className="inline-block opacity-0"
              style={{ animation: 'fade-up 0.8s var(--ease-out) 0.1s forwards' }}
            >
              {t('hero.tagline1')}
            </span>{' '}
            <em
              className="inline-block not-italic text-[var(--accent)] opacity-0"
              style={{ animation: 'fade-up 0.8s var(--ease-out) 0.25s forwards' }}
            >
              {t('hero.tagline2Highlight')}
            </em>{' '}
            <span
              className="inline-block opacity-0"
              style={{ animation: 'fade-up 0.8s var(--ease-out) 0.4s forwards' }}
            >
              {t('hero.tagline3')}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="font-body text-[1.0625rem] text-[var(--text-secondary)] max-w-[480px] leading-[1.9] mb-10 opacity-0"
            style={{ animation: 'fade-up 0.8s var(--ease-out) 0.5s forwards' }}
          >
            {t('hero.subtitle')}
          </p>

          {/* CTA Button */}
          <button
            onClick={onStartDiscovery}
            className="cta-button inline-flex items-center gap-4 bg-[var(--accent)] text-white px-8 py-4 text-[0.9375rem] font-medium rounded-sm opacity-0"
            style={{ animation: 'fade-up-opacity 0.8s var(--ease-out) 0.6s forwards' }}
          >
            {t('hero.cta')}
            <ArrowRightIcon size="md" />
          </button>

          {/* Decorative stroke */}
          <div
            className="absolute bottom-[10%] right-[5%] w-[120px] h-[2px] bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 hidden lg:block"
            style={{ animation: 'fade-up-opacity 1s var(--ease-out) 1s forwards' }}
          />
        </div>

        {/* Right Column - Vote Counter (Desktop only) */}
        <div
          className="hidden lg:block opacity-0"
          style={{ animation: 'fade-up 0.8s var(--ease-out) 0.9s forwards' }}
        >
          <p className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-[var(--text-faint)] mb-2">
            {t('hero.votesLabel')}
          </p>
          <p className="font-display text-[2.5rem] font-semibold text-[var(--accent)] leading-none mb-2">
            <VoteCounter targetValue={47832} duration={2500} />
          </p>
          <p className="font-body text-sm text-[var(--text-muted)] max-w-[180px]">
            {t('hero.votesDesc', 'toward better selves')}
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <a
        href="#philosophy"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors animate-bounce"
        aria-label={t('hero.scrollDown', 'Scroll down')}
      >
        <ArrowDownIcon size="lg" />
      </a>
    </section>
  );
};

export default HeroSection;
