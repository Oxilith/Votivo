/**
 * @file components/assessment/steps/SynthesisStep.tsx
 * @purpose Renders the synthesis/summary step with Ink & Stone styling
 * @functionality
 * - Displays organized summary of all collected responses
 * - Groups responses into themed sections (rhythm, energy, identity, etc.)
 * - Uses stone cards with vermilion phase badges
 * - Shows what's next guidance with accent card
 * - Navigation handled by parent NavigationControls component
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/types (AssessmentResponses)
 * - @/styles (cardStyles, textStyles, phaseBadge)
 * - @/components (Phase, MultiSelectStep, SingleSelectStep, SelectOption)
 */

import { useTranslation } from 'react-i18next';
import type { AssessmentResponses } from '@/types';
import { cardStyles, textStyles, phaseBadge } from '@/styles';
import type { Phase, MultiSelectStep, SingleSelectStep, SelectOption } from '@/components';
import React from "react";

interface SynthesisStepProps {
  responses: Partial<AssessmentResponses>;
  phases: Phase[];
}

export const SynthesisStep: React.FC<SynthesisStepProps> = ({
  responses,
  phases,
}) => {
  const { t } = useTranslation('assessment');

  const getSelectedLabels = (stepId: keyof AssessmentResponses, options: SelectOption[]) => {
    const selected = (responses[stepId] as string[] | undefined) ?? [];
    return options.filter((opt) => selected.includes(opt.id)).map((opt) => opt.label);
  };

  // Get steps from phases for option lookups
  const phase1Steps = phases[1]?.steps ?? [];
  const phase2Steps = phases[2]?.steps ?? [];

  const peakTimesStep = phase1Steps[0] as MultiSelectStep | undefined;
  const lowTimesStep = phase1Steps[1] as MultiSelectStep | undefined;
  const moodTriggersStep = phase1Steps[5] as MultiSelectStep | undefined;
  const willpowerStep = phase1Steps[7] as SingleSelectStep | undefined;
  const coreValuesStep = phase2Steps[5] as MultiSelectStep | undefined;

  const peakTimes = peakTimesStep ? getSelectedLabels('peak_energy_times', peakTimesStep.options) : [];
  const lowTimes = lowTimesStep ? getSelectedLabels('low_energy_times', lowTimesStep.options) : [];
  const moodTriggers = moodTriggersStep ? getSelectedLabels('mood_triggers_negative', moodTriggersStep.options) : [];
  const coreValues = coreValuesStep ? getSelectedLabels('core_values', coreValuesStep.options) : [];
  const willpowerPattern = willpowerStep?.options.find((o) => o.id === responses.willpower_pattern);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
          {t('synthesis.heading')}
        </h2>
        <p className="font-body text-[var(--text-secondary)]">
          {t('synthesis.description')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Operating Rhythm */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-display font-semibold ${textStyles.primary} mb-4 flex items-center gap-3`}>
            <span className={phaseBadge}>
              {String(t('synthesis.sections.operatingRhythm.number')).padStart(2, '0')}
            </span>
            <span className="text-base">
              {t('synthesis.sections.operatingRhythm.title')}
            </span>
          </h3>
          <div className={`space-y-3 font-body ${textStyles.secondary}`}>
            {peakTimes.length > 0 && (
              <p>
                <span className="font-medium">{t('synthesis.labels.peakEnergy')}</span>{' '}
                {peakTimes.join(', ')}
              </p>
            )}
            {lowTimes.length > 0 && (
              <p>
                <span className="font-medium">{t('synthesis.labels.lowEnergy')}</span>{' '}
                {lowTimes.join(', ')}
              </p>
            )}
            <p>
              <span className="font-medium">{t('synthesis.labels.energyConsistency')}</span>{' '}
              {responses.energy_consistency ?? 3}/5
            </p>
            <p>
              <span className="font-medium">{t('synthesis.labels.motivationReliability')}</span>{' '}
              {responses.motivation_reliability ?? 3}/5
            </p>
            {willpowerPattern && (
              <p>
                <span className="font-medium">{t('synthesis.labels.primaryFailurePattern')}</span>{' '}
                {willpowerPattern.label}
              </p>
            )}
          </div>
        </div>

        {/* Energy Management */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-display font-semibold ${textStyles.primary} mb-4 flex items-center gap-3`}>
            <span className={phaseBadge}>
              {String(t('synthesis.sections.energyManagement.number')).padStart(2, '0')}
            </span>
            <span className="text-base">
              {t('synthesis.sections.energyManagement.title')}
            </span>
          </h3>
          <div className={`space-y-3 font-body ${textStyles.secondary}`}>
            {responses.energy_drains && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.whatDrainsYou')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.energy_drains}
                </p>
              </div>
            )}
            {responses.energy_restores && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.whatRestoresYou')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.energy_restores}
                </p>
              </div>
            )}
            {moodTriggers.length > 0 && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.keyMoodTriggers')}</p>
                <p className="pl-4 text-[var(--text-secondary)]">{moodTriggers.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Identity */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-display font-semibold ${textStyles.primary} mb-4 flex items-center gap-3`}>
            <span className={phaseBadge}>
              {String(t('synthesis.sections.currentIdentity.number')).padStart(2, '0')}
            </span>
            <span className="text-base">
              {t('synthesis.sections.currentIdentity.title')}
            </span>
          </h3>
          <div className={`space-y-3 font-body ${textStyles.secondary}`}>
            {responses.identity_statements && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.identityStatements')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.identity_statements}
                </p>
              </div>
            )}
            {responses.others_describe && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.howOthersSeeYou')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.others_describe}
                </p>
              </div>
            )}
            <p>
              <span className="font-medium">{t('synthesis.labels.identityClarity')}</span>{' '}
              {responses.identity_clarity ?? 3}/5
            </p>
          </div>
        </div>

        {/* Behavioral Foundation */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-display font-semibold ${textStyles.primary} mb-4 flex items-center gap-3`}>
            <span className={phaseBadge}>
              {String(t('synthesis.sections.behavioralFoundation.number')).padStart(2, '0')}
            </span>
            <span className="text-base">
              {t('synthesis.sections.behavioralFoundation.title')}
            </span>
          </h3>
          <div className={`space-y-3 font-body ${textStyles.secondary}`}>
            {responses.automatic_behaviors && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.automaticBehaviors')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.automatic_behaviors}
                </p>
              </div>
            )}
            {responses.keystone_behaviors && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.keystoneBehaviors')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.keystone_behaviors}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Values & Strengths */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-display font-semibold ${textStyles.primary} mb-4 flex items-center gap-3`}>
            <span className={phaseBadge}>
              {String(t('synthesis.sections.valuesStrengths.number')).padStart(2, '0')}
            </span>
            <span className="text-base">
              {t('synthesis.sections.valuesStrengths.title')}
            </span>
          </h3>
          <div className={`space-y-3 font-body ${textStyles.secondary}`}>
            {coreValues.length > 0 && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.coreValues')}</p>
                <p className="pl-4 text-[var(--text-secondary)]">{coreValues.join(', ')}</p>
              </div>
            )}
            {responses.natural_strengths && (
              <div>
                <p className="font-medium mb-1">{t('synthesis.labels.naturalStrengths')}</p>
                <p className="pl-4 text-[var(--text-secondary)] whitespace-pre-line">
                  {responses.natural_strengths}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resistance Patterns */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-display font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className="text-xl">⚠️</span>
            {t('synthesis.sections.resistancePatterns.title')}
          </h3>
          {responses.resistance_patterns && (
            <p className={`font-body ${textStyles.secondary} whitespace-pre-line`}>
              {responses.resistance_patterns}
            </p>
          )}
          <p className={`font-body ${textStyles.muted} text-sm mt-3 italic`}>
            {t('synthesis.sections.resistancePatterns.helpText')}
          </p>
        </div>
      </div>

      {/* What's Next - Stone card with vermilion top accent */}
      <div className={`p-6 ${cardStyles.hero}`}>
        <h3 className={`font-display font-semibold ${textStyles.primary} mb-3`}>
          {t('synthesis.whatsNext.title')}
        </h3>
        <p className={`font-body ${textStyles.secondary} mb-4`}>
          {t('synthesis.whatsNext.description')}
        </p>
        <ul className={`space-y-2 font-body ${textStyles.secondary}`}>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
            <span>
              <span className={`${textStyles.primary} font-medium`}>
                {t('synthesis.whatsNext.achievable.title')}
              </span>{' '}
              — {t('synthesis.whatsNext.achievable.description')}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
            <span>
              <span className={`${textStyles.primary} font-medium`}>
                {t('synthesis.whatsNext.aligned.title')}
              </span>{' '}
              — {t('synthesis.whatsNext.aligned.description')}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
            <span>
              <span className={`${textStyles.primary} font-medium`}>
                {t('synthesis.whatsNext.bridged.title')}
              </span>{' '}
              — {t('synthesis.whatsNext.bridged.description')}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
