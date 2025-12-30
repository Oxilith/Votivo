/**
 * @file src/components/landing/shared/PhaseCard.tsx
 * @purpose Stone card component for displaying journey phase information
 * @functionality
 * - Displays large phase number in vermilion (low opacity)
 * - Shows Coming Soon badge with vermilion accent for inactive phases
 * - Includes feature bullet points with vermilion dots
 * - Uses stone-card class with ink splatter hover effect
 * - Organic rotation on reveal (-0.5deg/0.5deg alternating)
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 */

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface PhaseCardProps {
  phaseNumber: number;
  phaseName: string;
  title: string;
  description: string;
  features?: string[];
  isActive?: boolean;
  className?: string;
}

const PhaseCard: FC<PhaseCardProps> = ({
  phaseNumber,
  phaseName,
  title,
  description,
  features = [],
  isActive = true,
  className = '',
}) => {
  const { t } = useTranslation('landing');

  // Organic rotation alternates between cards
  const rotation = phaseNumber % 2 === 0 ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]';

  return (
    <div
      className={`stone-card relative p-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-sm reveal ${rotation} ${
        isActive ? '' : 'coming-soon'
      } ${className}`.trim()}
      style={{ animationDelay: `${(phaseNumber - 1) * 100}ms` }}
    >
      {/* Coming Soon badge - absolute top right */}
      {!isActive && (
        <div className="absolute top-4 right-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            {t('journey.comingSoon')}
          </span>
        </div>
      )}

      {/* Large phase number + Phase name */}
      <div className="flex items-end gap-4 mb-6">
        <span
          className={`font-display text-5xl font-medium leading-none ${
            isActive
              ? 'text-[var(--accent)] opacity-30'
              : 'text-[var(--text-muted)] opacity-20'
          }`}
        >
          {phaseNumber.toString().padStart(2, '0')}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)] pb-1">
          {phaseName}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-xl font-medium text-[var(--text-primary)] mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="font-body text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
        {description}
      </p>

      {/* Feature bullet points with vermilion dots */}
      {features.length > 0 && (
        <ul className={`space-y-2 font-body text-sm ${isActive ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                  isActive ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)] opacity-30'
                }`}
              />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PhaseCard;
