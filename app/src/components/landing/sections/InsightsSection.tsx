/**
 * @file src/components/landing/sections/InsightsSection.tsx
 * @purpose AI Insights preview section showcasing analysis capabilities
 * @functionality
 * - Displays two-column layout: LEFT has header text + insight pills, RIGHT has sample card
 * - Shows four insight type pills with icons (patterns, contradictions, blind spots, leverage)
 * - Features sample insight card with glow effect demonstrating AI synthesis output
 * - Highlights key phrases with colored emphasis (electric/violet)
 * - Adapts styling for light and dark themes
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components/landing/shared/InsightPill
 * - @/components/shared/icons (ChartBarIcon, SwitchHorizontalIcon, EyeIcon, LightningBoltIcon, LightbulbIcon)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import InsightPill from '@/components/landing/shared/InsightPill';
import {
  ChartBarIcon,
  SwitchHorizontalIcon,
  EyeIcon,
  LightningBoltIcon,
  LightbulbIcon,
} from '@/components/shared/icons';

const InsightsSection: FC = () => {
  const { t } = useTranslation();

  const insightTypes = [
    {
      key: 'patterns',
      icon: <ChartBarIcon size="sm" />,
    },
    {
      key: 'contradictions',
      icon: <SwitchHorizontalIcon size="sm" />,
    },
    {
      key: 'blindSpots',
      icon: <EyeIcon size="sm" />,
    },
    {
      key: 'leverage',
      icon: <LightningBoltIcon size="sm" />,
    },
  ];

  return (
    <section id="insights" className="py-24 px-6 bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column: Header + Insight Pills */}
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.3em] tech-gradient-text mb-4">
              {t('landing.insights.label')}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium leading-tight text-[var(--text-primary)] mb-6">
              {t('landing.insights.title')}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
              {t('landing.insights.subtitle')}
            </p>
            <div className="space-y-3">
              {insightTypes.map((insight) => (
                <InsightPill
                  key={insight.key}
                  icon={insight.icon}
                  label={t(`landing.insights.types.${insight.key}`)}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Sample Insight Card with Glow Effect */}
          <div className="relative">
            {/* Glow layer */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[var(--color-electric)]/10 via-transparent to-[var(--color-violet)]/10  blur-xl" />

            {/* Card */}
            <div className="relative bg-[var(--bg-card)]  p-8 border border-[var(--border-subtle)] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-[0.2em] tech-gradient-text">
                  {t('landing.insights.sampleCard.label')}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {t('landing.insights.sampleCard.category')}
                </span>
              </div>
              <p className="font-serif text-lg text-[var(--text-primary)]/90 leading-relaxed mb-6">
                "You describe yourself as disciplined, yet your energy crashes and mood triggers suggest you're running on willpower alone, a finite resource. Your keystone behavior of morning exercise could be the anchor that replenishes rather than depletes, if you shift from{' '}
                <em className="text-[var(--color-electric)] font-medium">forcing performance</em>
                {' '}to{' '}
                <em className="text-[var(--color-violet)] font-medium">honoring rhythm</em>."
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <LightbulbIcon size="sm" className="text-[var(--color-violet)]" />
                <span>{t('landing.insights.sampleCard.poweredBy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InsightsSection;
