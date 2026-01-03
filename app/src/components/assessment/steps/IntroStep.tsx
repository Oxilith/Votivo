/**
 * @file components/assessment/steps/IntroStep.tsx
 * @purpose Renders introduction/welcome step with Ink & Stone styling
 * @functionality
 * - Displays heading with display font, subheading, and description
 * - Provides vermilion continue button to proceed to next step
 * - Provides back button when not on first step (for navigation to previous phases)
 * - Supports multi-paragraph descriptions
 * - Uses fade-up animation pattern
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/components (IntroContent)
 */

import { useTranslation } from 'react-i18next';
import type { IntroContent } from '@/components';
import React from "react";

interface IntroStepProps {
  content: IntroContent;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep?: boolean;
}

export const IntroStep: React.FC<IntroStepProps> = ({
  content,
  onNext,
  onBack,
  isFirstStep = true,
}) => {
  const { t } = useTranslation('assessment');

  return (
    <div className="space-y-6" data-testid="intro-step">
      <div
        className="opacity-0"
        style={{ animation: 'fade-up 0.6s var(--ease-out) 0.1s forwards' }}
      >
        <h2 className="font-display text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-2">
          {content.heading}
        </h2>
        <p className="font-body text-lg text-[var(--text-secondary)]">
          {content.subheading}
        </p>
      </div>
      <div
        className="prose max-w-none opacity-0"
        style={{ animation: 'fade-up 0.6s var(--ease-out) 0.2s forwards' }}
      >
        {content.description.split('\n\n').map((para, i) => (
          <p
            key={i}
            className="font-body text-[var(--text-secondary)] whitespace-pre-line leading-relaxed"
          >
            {para}
          </p>
        ))}
      </div>
      <div
        className="flex justify-between mt-4 opacity-0"
        style={{ animation: 'fade-up 0.6s var(--ease-out) 0.3s forwards' }}
      >
        {!isFirstStep && onBack && (
          <button
            onClick={onBack}
            data-testid="assessment-back-button"
            className="px-6 py-3 font-body text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-sm transition-colors"
          >
            {t('navigation.back')}
          </button>
        )}
        <button
          onClick={onNext}
          data-testid="assessment-continue-button"
          className="cta-button px-6 py-3 bg-[var(--accent)] text-white font-body font-medium rounded-sm"
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
};
