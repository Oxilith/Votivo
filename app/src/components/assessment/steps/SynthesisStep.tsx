/**
 * @file components/assessment/steps/SynthesisStep.tsx
 * @purpose Renders the synthesis/summary step showing all assessment responses
 * @functionality
 * - Displays organized summary of all collected responses
 * - Groups responses into themed sections (rhythm, energy, identity, etc.)
 * - Shows what's next guidance
 * - Provides back and complete buttons
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (AssessmentResponses)
 * - @/styles/theme (cardStyles, textStyles, circleBadge)
 * - @/components/assessment/types (Phase, MultiSelectStep, SingleSelectStep, SelectOption)
 */

import { useTranslation } from 'react-i18next';
import type { AssessmentResponses } from '@/types/assessment.types';
import { cardStyles, textStyles, circleBadge } from '@/styles/theme';
import type { Phase, MultiSelectStep, SingleSelectStep, SelectOption } from '../types';

interface SynthesisStepProps {
  responses: Partial<AssessmentResponses>;
  phases: Phase[];
  onBack: () => void;
  onComplete: () => void;
}

export const SynthesisStep: React.FC<SynthesisStepProps> = ({
  responses,
  phases,
  onBack,
  onComplete,
}) => {
  const { t } = useTranslation();

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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('assessment.synthesis.heading')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('assessment.synthesis.description')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Operating Rhythm */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>
              {t('assessment.synthesis.sections.operatingRhythm.number')}
            </span>
            {t('assessment.synthesis.sections.operatingRhythm.title')}
          </h3>
          <div className={`space-y-3 ${textStyles.secondary}`}>
            {peakTimes.length > 0 && (
              <p>
                <span className="font-medium">{t('assessment.synthesis.labels.peakEnergy')}</span>{' '}
                {peakTimes.join(', ')}
              </p>
            )}
            {lowTimes.length > 0 && (
              <p>
                <span className="font-medium">{t('assessment.synthesis.labels.lowEnergy')}</span>{' '}
                {lowTimes.join(', ')}
              </p>
            )}
            <p>
              <span className="font-medium">{t('assessment.synthesis.labels.energyConsistency')}</span>{' '}
              {responses.energy_consistency ?? 3}/5
            </p>
            <p>
              <span className="font-medium">{t('assessment.synthesis.labels.motivationReliability')}</span>{' '}
              {responses.motivation_reliability ?? 3}/5
            </p>
            {willpowerPattern && (
              <p>
                <span className="font-medium">{t('assessment.synthesis.labels.primaryFailurePattern')}</span>{' '}
                {willpowerPattern.label}
              </p>
            )}
          </div>
        </div>

        {/* Energy Management */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>
              {t('assessment.synthesis.sections.energyManagement.number')}
            </span>
            {t('assessment.synthesis.sections.energyManagement.title')}
          </h3>
          <div className={`space-y-3 ${textStyles.secondary}`}>
            {responses.energy_drains && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.whatDrainsYou')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.energy_drains}
                </p>
              </div>
            )}
            {responses.energy_restores && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.whatRestoresYou')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.energy_restores}
                </p>
              </div>
            )}
            {moodTriggers.length > 0 && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.keyMoodTriggers')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400">{moodTriggers.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Identity */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>
              {t('assessment.synthesis.sections.currentIdentity.number')}
            </span>
            {t('assessment.synthesis.sections.currentIdentity.title')}
          </h3>
          <div className={`space-y-3 ${textStyles.secondary}`}>
            {responses.identity_statements && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.identityStatements')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.identity_statements}
                </p>
              </div>
            )}
            {responses.others_describe && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.howOthersSeeYou')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.others_describe}
                </p>
              </div>
            )}
            <p>
              <span className="font-medium">{t('assessment.synthesis.labels.identityClarity')}</span>{' '}
              {responses.identity_clarity ?? 3}/5
            </p>
          </div>
        </div>

        {/* Behavioral Foundation */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>
              {t('assessment.synthesis.sections.behavioralFoundation.number')}
            </span>
            {t('assessment.synthesis.sections.behavioralFoundation.title')}
          </h3>
          <div className={`space-y-3 ${textStyles.secondary}`}>
            {responses.automatic_behaviors && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.automaticBehaviors')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.automatic_behaviors}
                </p>
              </div>
            )}
            {responses.keystone_behaviors && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.keystoneBehaviors')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.keystone_behaviors}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Values & Strengths */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>
              {t('assessment.synthesis.sections.valuesStrengths.number')}
            </span>
            {t('assessment.synthesis.sections.valuesStrengths.title')}
          </h3>
          <div className={`space-y-3 ${textStyles.secondary}`}>
            {coreValues.length > 0 && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.coreValues')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400">{coreValues.join(', ')}</p>
              </div>
            )}
            {responses.natural_strengths && (
              <div>
                <p className="font-medium mb-1">{t('assessment.synthesis.labels.naturalStrengths')}</p>
                <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {responses.natural_strengths}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resistance Patterns */}
        <div className={`p-6 ${cardStyles.base}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
            <span className="text-xl">⚠️</span>
            {t('assessment.synthesis.sections.resistancePatterns.title')}
          </h3>
          {responses.resistance_patterns && (
            <p className={`${textStyles.secondary} whitespace-pre-line`}>
              {responses.resistance_patterns}
            </p>
          )}
          <p className={`${textStyles.muted} text-sm mt-3 italic`}>
            {t('assessment.synthesis.sections.resistancePatterns.helpText')}
          </p>
        </div>
      </div>

      {/* What's Next */}
      <div className={`p-6 ${cardStyles.hero}`}>
        <h3 className={`font-semibold ${textStyles.primary} mb-3`}>
          {t('assessment.synthesis.whatsNext.title')}
        </h3>
        <p className={`${textStyles.secondary} mb-4`}>
          {t('assessment.synthesis.whatsNext.description')}
        </p>
        <ul className={`space-y-2 ${textStyles.secondary}`}>
          <li className="flex items-start gap-2">
            <span className={textStyles.subtle}>•</span>
            <span>
              <span className={`${textStyles.primary} font-medium`}>
                {t('assessment.synthesis.whatsNext.achievable.title')}
              </span>{' '}
              — {t('assessment.synthesis.whatsNext.achievable.description')}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={textStyles.subtle}>•</span>
            <span>
              <span className={`${textStyles.primary} font-medium`}>
                {t('assessment.synthesis.whatsNext.aligned.title')}
              </span>{' '}
              — {t('assessment.synthesis.whatsNext.aligned.description')}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={textStyles.subtle}>•</span>
            <span>
              <span className={`${textStyles.primary} font-medium`}>
                {t('assessment.synthesis.whatsNext.bridged.title')}
              </span>{' '}
              — {t('assessment.synthesis.whatsNext.bridged.description')}
            </span>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg"
        >
          {t('assessment.navigation.back')}
        </button>
        <button
          onClick={onComplete}
          className="flex-1 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-lg"
        >
          {t('assessment.navigation.complete')}
        </button>
      </div>
    </div>
  );
};
