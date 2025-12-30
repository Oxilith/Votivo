/**
 * @file components/assessment/navigation/AssessmentProgress.tsx
 * @purpose Progress bar and phase info header with Ink & Stone styling
 * @functionality
 * - Displays current phase title and subtitle with mono typography
 * - Shows step progress (e.g., "Step 5 of 20")
 * - Renders vermilion progress bar
 * - Sticky positioning below floating navigation
 * - Uses backdrop blur for visual hierarchy
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 */

import { useTranslation } from 'react-i18next';
import React from "react";

interface AssessmentProgressProps {
  phaseTitle: string;
  phaseSubtitle: string;
  currentStep: number;
  totalSteps: number;
}

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  phaseTitle,
  phaseSubtitle,
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation('common');
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b border-[var(--border)] sticky top-20 lg:top-24 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-10">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-[var(--accent)]" />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {phaseTitle}
            </span>
            <span className="text-[var(--text-faint)]">·</span>
            <span className="font-body text-sm text-[var(--text-secondary)]">
              {phaseSubtitle}
            </span>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            {t('progress.stepOf', { current: currentStep, total: totalSteps })}
          </span>
        </div>
        <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
