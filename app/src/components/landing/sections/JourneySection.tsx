/**
 * @file src/components/landing/sections/JourneySection.tsx
 * @purpose Journey section showcasing the five transformation phases
 * @functionality
 * - Displays section marker with vermilion line prefix (left-aligned)
 * - Renders five PhaseCards as stone cards with staggered reveal
 * - Indicates active phases (1-2) and coming soon phases (3-5)
 * - Uses asymmetric 12-column grid layout like zen garden stones
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components (PhaseCard)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PhaseCard } from '@/components';

const JourneySection: FC = () => {
  const { t } = useTranslation('landing');

  const phases = [
    { number: 1, isActive: true },
    { number: 2, isActive: true },
    { number: 3, isActive: false },
    { number: 4, isActive: false },
    { number: 5, isActive: false },
  ];

  // Grid column spans for asymmetric zen garden placement
  const gridPlacements = [
    'lg:col-span-5 lg:col-start-1', // Phase 1: columns 1-5
    'lg:col-span-6 lg:col-start-7', // Phase 2: columns 7-12
    'lg:col-span-5 lg:col-start-2', // Phase 3: columns 2-6
    'lg:col-span-5 lg:col-start-8', // Phase 4: columns 8-12
    'lg:col-span-6 lg:col-start-1', // Phase 5: columns 1-6
  ];

  return (
    <section id="journey" className="py-28 bg-[var(--bg-primary)]">
      {/* Section Header - Left aligned */}
      <div className="max-w-[520px] mb-12 px-6 lg:px-10 lg:ml-[calc((100%-1200px)/2+var(--space-xl))] reveal">
        <div className="flex items-center gap-4 mb-4">
          <span className="w-6 h-px bg-[var(--accent)]" />
          <span className="font-mono text-[0.6875rem] tracking-[0.15em] uppercase text-[var(--text-muted)]">
            {t('journey.label')}
          </span>
        </div>
        <h2 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-[1.3] mb-4">
          {t('journey.title')}
        </h2>
        <p className="font-body text-base text-[var(--text-secondary)] leading-[1.8]">
          {t('journey.subtitle')}
        </p>
      </div>

      {/* Phase Cards - Asymmetric 12-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 max-w-[1200px] mx-auto px-6 lg:px-10">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.number}
            phaseNumber={phase.number}
            phaseName={t(`journey.phases.${phase.number}.name`)}
            title={t(`journey.phases.${phase.number}.title`)}
            description={t(`journey.phases.${phase.number}.description`)}
            features={t(`journey.phases.${phase.number}.features`, { returnObjects: true }) as string[]}
            isActive={phase.isActive}
            className={`md:col-span-1 ${gridPlacements[index]}`}
          />
        ))}
      </div>
    </section>
  );
};

export default JourneySection;
