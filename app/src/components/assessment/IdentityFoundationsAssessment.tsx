/**
 * @file src/components/assessment/IdentityFoundationsAssessment.tsx
 * @purpose Multi-phase identity assessment questionnaire for gathering user self-reflection data
 * @functionality
 * - Displays welcome introduction and assessment instructions
 * - Guides users through Phase 1 (State Awareness) with 8 question steps
 * - Guides users through Phase 2 (Identity Mapping) with 9 question steps
 * - Renders synthesis summary of all collected responses
 * - Provides navigation controls (back/continue) between steps
 * - Supports multiple question types: multiSelect, singleSelect, scale, textarea
 * - Accepts initial responses for hydration (import/sample data)
 * - Supports startAtSynthesis prop to navigate directly to synthesis page
 * - Provides Back button on synthesis page to navigate to previous step
 * - Triggers completion callback when user finishes synthesis review
 * - Supports dark mode theme switching
 * - Supports internationalization (English/Polish)
 * @dependencies
 * - React (useState)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (AssessmentResponses, AssessmentProps)
 * - @/styles/theme (cardStyles, textStyles, circleBadge)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssessmentResponses, AssessmentProps } from '@/types/assessment.types';
import { cardStyles, textStyles, circleBadge } from '@/styles/theme';

interface IntroContent {
  heading: string;
  subheading: string;
  description: string;
  buttonText: string;
}

interface SelectOption {
  id: string;
  label: string;
  description?: string;
}

interface BaseStep {
  id?: string;
  question?: string;
  context?: string;
}

interface IntroStep extends BaseStep {
  type: 'intro';
  content: IntroContent;
}

interface MultiSelectStep extends BaseStep {
  type: 'multiSelect';
  id: string;
  question: string;
  options: SelectOption[];
}

interface SingleSelectStep extends BaseStep {
  type: 'singleSelect';
  id: string;
  question: string;
  options: SelectOption[];
}

interface ScaleStep extends BaseStep {
  type: 'scale';
  id: string;
  question: string;
  lowLabel: string;
  highLabel: string;
  min: number;
  max: number;
}

interface TextareaStep extends BaseStep {
  type: 'textarea';
  id: string;
  question: string;
  placeholder?: string;
  rows?: number;
}

interface SynthesisStep extends BaseStep {
  type: 'synthesis';
}

type Step = IntroStep | MultiSelectStep | SingleSelectStep | ScaleStep | TextareaStep | SynthesisStep;

interface Phase {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  steps: Step[];
}

const IdentityFoundationsAssessment: React.FC<AssessmentProps> = ({ initialResponses, onComplete, startAtSynthesis }) => {
  const { t } = useTranslation();
  // Synthesis page is at phase index 3, step index 0
  const [currentPhase, setCurrentPhase] = useState(startAtSynthesis ? 3 : 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Partial<AssessmentResponses>>(initialResponses ?? {});

  const updateResponse = (key: string, value: string | number | string[]) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const phases: Phase[] = [
    {
      id: 'intro',
      title: t('assessment.welcome.title'),
      subtitle: t('assessment.welcome.subtitle'),
      steps: [
        {
          type: 'intro',
          content: {
            heading: t('assessment.welcome.heading'),
            subheading: t('assessment.welcome.subheading'),
            description: t('assessment.welcome.description'),
            buttonText: t('assessment.welcome.buttonText'),
          },
        },
      ],
    },
    {
      id: 'phase1',
      title: t('assessment.phase1.title'),
      subtitle: t('assessment.phase1.subtitle'),
      description: t('assessment.phase1.description'),
      steps: [
        {
          type: 'multiSelect',
          id: 'peak_energy_times',
          question: t('assessment.phase1.peakEnergy.question'),
          context: t('assessment.phase1.peakEnergy.context'),
          options: [
            { id: 'early_morning', label: t('assessment.phase1.peakEnergy.options.earlyMorning.label'), description: t('assessment.phase1.peakEnergy.options.earlyMorning.description') },
            { id: 'mid_morning', label: t('assessment.phase1.peakEnergy.options.midMorning.label'), description: t('assessment.phase1.peakEnergy.options.midMorning.description') },
            { id: 'midday', label: t('assessment.phase1.peakEnergy.options.midday.label'), description: t('assessment.phase1.peakEnergy.options.midday.description') },
            { id: 'afternoon', label: t('assessment.phase1.peakEnergy.options.afternoon.label'), description: t('assessment.phase1.peakEnergy.options.afternoon.description') },
            { id: 'evening', label: t('assessment.phase1.peakEnergy.options.evening.label'), description: t('assessment.phase1.peakEnergy.options.evening.description') },
            { id: 'night', label: t('assessment.phase1.peakEnergy.options.night.label'), description: t('assessment.phase1.peakEnergy.options.night.description') },
            { id: 'late_night', label: t('assessment.phase1.peakEnergy.options.lateNight.label'), description: t('assessment.phase1.peakEnergy.options.lateNight.description') },
          ],
        },
        {
          type: 'multiSelect',
          id: 'low_energy_times',
          question: t('assessment.phase1.lowEnergy.question'),
          context: t('assessment.phase1.lowEnergy.context'),
          options: [
            { id: 'early_morning', label: t('assessment.phase1.lowEnergy.options.earlyMorning.label'), description: t('assessment.phase1.lowEnergy.options.earlyMorning.description') },
            { id: 'mid_morning', label: t('assessment.phase1.lowEnergy.options.midMorning.label'), description: t('assessment.phase1.lowEnergy.options.midMorning.description') },
            { id: 'midday', label: t('assessment.phase1.lowEnergy.options.midday.label'), description: t('assessment.phase1.lowEnergy.options.midday.description') },
            { id: 'afternoon', label: t('assessment.phase1.lowEnergy.options.afternoon.label'), description: t('assessment.phase1.lowEnergy.options.afternoon.description') },
            { id: 'evening', label: t('assessment.phase1.lowEnergy.options.evening.label'), description: t('assessment.phase1.lowEnergy.options.evening.description') },
            { id: 'night', label: t('assessment.phase1.lowEnergy.options.night.label'), description: t('assessment.phase1.lowEnergy.options.night.description') },
          ],
        },
        {
          type: 'scale',
          id: 'energy_consistency',
          question: t('assessment.phase1.energyConsistency.question'),
          context: t('assessment.phase1.energyConsistency.context'),
          lowLabel: t('assessment.phase1.energyConsistency.lowLabel'),
          highLabel: t('assessment.phase1.energyConsistency.highLabel'),
          min: 1,
          max: 5,
        },
        {
          type: 'textarea',
          id: 'energy_drains',
          question: t('assessment.phase1.energyDrains.question'),
          context: t('assessment.phase1.energyDrains.context'),
          placeholder: t('assessment.phase1.energyDrains.placeholder'),
        },
        {
          type: 'textarea',
          id: 'energy_restores',
          question: t('assessment.phase1.energyRestores.question'),
          context: t('assessment.phase1.energyRestores.context'),
          placeholder: t('assessment.phase1.energyRestores.placeholder'),
        },
        {
          type: 'multiSelect',
          id: 'mood_triggers_negative',
          question: t('assessment.phase1.moodTriggers.question'),
          context: t('assessment.phase1.moodTriggers.context'),
          options: [
            { id: 'lack_of_progress', label: t('assessment.phase1.moodTriggers.options.lackOfProgress.label') },
            { id: 'conflict', label: t('assessment.phase1.moodTriggers.options.conflict.label') },
            { id: 'uncertainty', label: t('assessment.phase1.moodTriggers.options.uncertainty.label') },
            { id: 'overwhelm', label: t('assessment.phase1.moodTriggers.options.overwhelm.label') },
            { id: 'lack_of_control', label: t('assessment.phase1.moodTriggers.options.lackOfControl.label') },
            { id: 'poor_sleep', label: t('assessment.phase1.moodTriggers.options.poorSleep.label') },
            { id: 'physical', label: t('assessment.phase1.moodTriggers.options.physical.label') },
            { id: 'isolation', label: t('assessment.phase1.moodTriggers.options.isolation.label') },
            { id: 'overstimulation', label: t('assessment.phase1.moodTriggers.options.overstimulation.label') },
            { id: 'criticism', label: t('assessment.phase1.moodTriggers.options.criticism.label') },
            { id: 'comparison', label: t('assessment.phase1.moodTriggers.options.comparison.label') },
            { id: 'boredom', label: t('assessment.phase1.moodTriggers.options.boredom.label') },
          ],
        },
        {
          type: 'scale',
          id: 'motivation_reliability',
          question: t('assessment.phase1.motivationReliability.question'),
          context: t('assessment.phase1.motivationReliability.context'),
          lowLabel: t('assessment.phase1.motivationReliability.lowLabel'),
          highLabel: t('assessment.phase1.motivationReliability.highLabel'),
          min: 1,
          max: 5,
        },
        {
          type: 'singleSelect',
          id: 'willpower_pattern',
          question: t('assessment.phase1.willpowerPattern.question'),
          context: t('assessment.phase1.willpowerPattern.context'),
          options: [
            { id: 'never_start', label: t('assessment.phase1.willpowerPattern.options.neverStart.label'), description: t('assessment.phase1.willpowerPattern.options.neverStart.description') },
            { id: 'start_stop', label: t('assessment.phase1.willpowerPattern.options.startStop.label'), description: t('assessment.phase1.willpowerPattern.options.startStop.description') },
            { id: 'distraction', label: t('assessment.phase1.willpowerPattern.options.distraction.label'), description: t('assessment.phase1.willpowerPattern.options.distraction.description') },
            { id: 'perfectionism', label: t('assessment.phase1.willpowerPattern.options.perfectionism.label'), description: t('assessment.phase1.willpowerPattern.options.perfectionism.description') },
            { id: 'energy', label: t('assessment.phase1.willpowerPattern.options.energy.label'), description: t('assessment.phase1.willpowerPattern.options.energy.description') },
            { id: 'forget', label: t('assessment.phase1.willpowerPattern.options.forget.label'), description: t('assessment.phase1.willpowerPattern.options.forget.description') },
          ],
        },
      ],
    },
    {
      id: 'phase2',
      title: t('assessment.phase2.title'),
      subtitle: t('assessment.phase2.subtitle'),
      description: t('assessment.phase2.description'),
      steps: [
        {
          type: 'intro',
          content: {
            heading: t('assessment.phase2.intro.heading'),
            subheading: t('assessment.phase2.intro.subheading'),
            description: t('assessment.phase2.intro.description'),
            buttonText: t('assessment.phase2.intro.buttonText'),
          },
        },
        {
          type: 'textarea',
          id: 'identity_statements',
          question: t('assessment.phase2.identityStatements.question'),
          context: t('assessment.phase2.identityStatements.context'),
          placeholder: t('assessment.phase2.identityStatements.placeholder'),
          rows: 8,
        },
        {
          type: 'textarea',
          id: 'others_describe',
          question: t('assessment.phase2.othersDescribe.question'),
          context: t('assessment.phase2.othersDescribe.context'),
          placeholder: t('assessment.phase2.othersDescribe.placeholder'),
        },
        {
          type: 'textarea',
          id: 'automatic_behaviors',
          question: t('assessment.phase2.automaticBehaviors.question'),
          context: t('assessment.phase2.automaticBehaviors.context'),
          placeholder: t('assessment.phase2.automaticBehaviors.placeholder'),
          rows: 6,
        },
        {
          type: 'textarea',
          id: 'keystone_behaviors',
          question: t('assessment.phase2.keystoneBehaviors.question'),
          context: t('assessment.phase2.keystoneBehaviors.context'),
          placeholder: t('assessment.phase2.keystoneBehaviors.placeholder'),
        },
        {
          type: 'multiSelect',
          id: 'core_values',
          question: t('assessment.phase2.coreValues.question'),
          context: t('assessment.phase2.coreValues.context'),
          options: [
            { id: 'growth', label: t('assessment.phase2.coreValues.options.growth.label') },
            { id: 'autonomy', label: t('assessment.phase2.coreValues.options.autonomy.label') },
            { id: 'mastery', label: t('assessment.phase2.coreValues.options.mastery.label') },
            { id: 'impact', label: t('assessment.phase2.coreValues.options.impact.label') },
            { id: 'connection', label: t('assessment.phase2.coreValues.options.connection.label') },
            { id: 'integrity', label: t('assessment.phase2.coreValues.options.integrity.label') },
            { id: 'creativity', label: t('assessment.phase2.coreValues.options.creativity.label') },
            { id: 'security', label: t('assessment.phase2.coreValues.options.security.label') },
            { id: 'adventure', label: t('assessment.phase2.coreValues.options.adventure.label') },
            { id: 'balance', label: t('assessment.phase2.coreValues.options.balance.label') },
            { id: 'recognition', label: t('assessment.phase2.coreValues.options.recognition.label') },
            { id: 'service', label: t('assessment.phase2.coreValues.options.service.label') },
            { id: 'wisdom', label: t('assessment.phase2.coreValues.options.wisdom.label') },
            { id: 'efficiency', label: t('assessment.phase2.coreValues.options.efficiency.label') },
            { id: 'authenticity', label: t('assessment.phase2.coreValues.options.authenticity.label') },
            { id: 'leadership', label: t('assessment.phase2.coreValues.options.leadership.label') },
          ],
        },
        {
          type: 'textarea',
          id: 'natural_strengths',
          question: t('assessment.phase2.naturalStrengths.question'),
          context: t('assessment.phase2.naturalStrengths.context'),
          placeholder: t('assessment.phase2.naturalStrengths.placeholder'),
        },
        {
          type: 'textarea',
          id: 'resistance_patterns',
          question: t('assessment.phase2.resistancePatterns.question'),
          context: t('assessment.phase2.resistancePatterns.context'),
          placeholder: t('assessment.phase2.resistancePatterns.placeholder'),
        },
        {
          type: 'scale',
          id: 'identity_clarity',
          question: t('assessment.phase2.identityClarity.question'),
          context: t('assessment.phase2.identityClarity.context'),
          lowLabel: t('assessment.phase2.identityClarity.lowLabel'),
          highLabel: t('assessment.phase2.identityClarity.highLabel'),
          min: 1,
          max: 5,
        },
      ],
    },
    {
      id: 'synthesis',
      title: t('assessment.synthesis.title'),
      subtitle: t('assessment.synthesis.subtitle'),
      steps: [
        {
          type: 'synthesis',
        },
      ],
    },
  ];

  const currentPhaseData = phases[currentPhase];
  const currentStepData = currentPhaseData?.steps[currentStep];
  const totalSteps = phases.reduce((acc, phase) => acc + phase.steps.length, 0);
  const currentTotalStep = phases.slice(0, currentPhase).reduce((acc, phase) => acc + phase.steps.length, 0) + currentStep + 1;

  const goNext = () => {
    if (currentStep < currentPhaseData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentStep(0);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      setCurrentStep(phases[currentPhase - 1].steps.length - 1);
    }
  };

  const isFirstStep = currentPhase === 0 && currentStep === 0;

  const handleComplete = () => {
    onComplete(responses as AssessmentResponses);
  };

  const renderIntro = (content: IntroContent) => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{content.heading}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">{content.subheading}</p>
      </div>
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {content.description.split('\n\n').map((para, i) => (
          <p key={i} className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>
      <button onClick={goNext} className="mt-4 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
        {content.buttonText}
      </button>
    </div>
  );

  const renderMultiSelect = (step: MultiSelectStep) => {
    const selected = (responses[step.id as keyof AssessmentResponses] as string[] | undefined) ?? [];
    const toggleOption = (optionId: string) => {
      const newSelected = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId];
      updateResponse(step.id, newSelected);
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{step.question}</h3>
          {step.context && <p className="text-gray-600 dark:text-gray-400 text-sm">{step.context}</p>}
        </div>
        <div className="grid gap-2">
          {step.options.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selected.includes(option.id) ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected.includes(option.id) ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selected.includes(option.id) && (
                    <svg className="w-3 h-3 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                  {option.description && <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSingleSelect = (step: SingleSelectStep) => {
    const selected = responses[step.id as keyof AssessmentResponses] as string | undefined;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{step.question}</h3>
          {step.context && <p className="text-gray-600 dark:text-gray-400 text-sm">{step.context}</p>}
        </div>
        <div className="grid gap-2">
          {step.options.map((option) => (
            <button
              key={option.id}
              onClick={() => updateResponse(step.id, option.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selected === option.id ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected === option.id ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selected === option.id && <div className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-white" />}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                  {option.description && <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderScale = (step: ScaleStep) => {
    const value = (responses[step.id as keyof AssessmentResponses] as number | undefined) ?? 3;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{step.question}</h3>
          {step.context && <p className="text-gray-600 dark:text-gray-400 text-sm">{step.context}</p>}
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="max-w-32">{step.lowLabel}</span>
            <span className="max-w-32 text-right">{step.highLabel}</span>
          </div>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => updateResponse(step.id, num)}
                className={`w-14 h-14 rounded-lg border-2 text-lg font-medium transition-all ${
                  value === num ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTextarea = (step: TextareaStep) => {
    const value = (responses[step.id as keyof AssessmentResponses] as string | undefined) ?? '';

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{step.question}</h3>
          {step.context && <p className="text-gray-600 dark:text-gray-400 text-sm">{step.context}</p>}
        </div>
        <textarea
          value={value}
          onChange={(e) => updateResponse(step.id, e.target.value)}
          placeholder={step.placeholder}
          rows={step.rows ?? 5}
          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-gray-900 dark:focus:border-white focus:outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800"
        />
      </div>
    );
  };

  const renderSynthesis = () => {
    const getSelectedLabels = (stepId: keyof AssessmentResponses, options: SelectOption[]) => {
      const selected = (responses[stepId] as string[] | undefined) ?? [];
      return options.filter((opt) => selected.includes(opt.id)).map((opt) => opt.label);
    };

    const phase1Steps = phases[1].steps as (MultiSelectStep | SingleSelectStep | ScaleStep | TextareaStep)[];
    const phase2Steps = phases[2].steps as (IntroStep | MultiSelectStep | SingleSelectStep | ScaleStep | TextareaStep)[];

    const peakTimesStep = phase1Steps[0] as MultiSelectStep;
    const lowTimesStep = phase1Steps[1] as MultiSelectStep;
    const moodTriggersStep = phase1Steps[5] as MultiSelectStep;
    const willpowerStep = phase1Steps[7] as SingleSelectStep;
    const coreValuesStep = phase2Steps[5] as MultiSelectStep;

    const peakTimes = getSelectedLabels('peak_energy_times', peakTimesStep.options);
    const lowTimes = getSelectedLabels('low_energy_times', lowTimesStep.options);
    const moodTriggers = getSelectedLabels('mood_triggers_negative', moodTriggersStep.options);
    const coreValues = getSelectedLabels('core_values', coreValuesStep.options);
    const willpowerPattern = willpowerStep.options.find((o) => o.id === responses.willpower_pattern);

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('assessment.synthesis.heading')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('assessment.synthesis.description')}</p>
        </div>

        <div className="space-y-6">
          <div className={`p-6 ${cardStyles.base}`}>
            <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
              <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>{t('assessment.synthesis.sections.operatingRhythm.number')}</span>
              {t('assessment.synthesis.sections.operatingRhythm.title')}
            </h3>
            <div className={`space-y-3 ${textStyles.secondary}`}>
              {peakTimes.length > 0 && (
                <p>
                  <span className="font-medium">{t('assessment.synthesis.labels.peakEnergy')}</span> {peakTimes.join(', ')}
                </p>
              )}
              {lowTimes.length > 0 && (
                <p>
                  <span className="font-medium">{t('assessment.synthesis.labels.lowEnergy')}</span> {lowTimes.join(', ')}
                </p>
              )}
              <p>
                <span className="font-medium">{t('assessment.synthesis.labels.energyConsistency')}</span> {responses.energy_consistency ?? 3}/5
              </p>
              <p>
                <span className="font-medium">{t('assessment.synthesis.labels.motivationReliability')}</span> {responses.motivation_reliability ?? 3}/5
              </p>
              {willpowerPattern && (
                <p>
                  <span className="font-medium">{t('assessment.synthesis.labels.primaryFailurePattern')}</span> {willpowerPattern.label}
                </p>
              )}
            </div>
          </div>

          <div className={`p-6 ${cardStyles.base}`}>
            <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
              <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>{t('assessment.synthesis.sections.energyManagement.number')}</span>
              {t('assessment.synthesis.sections.energyManagement.title')}
            </h3>
            <div className={`space-y-3 ${textStyles.secondary}`}>
              {responses.energy_drains && (
                <div>
                  <p className="font-medium mb-1">{t('assessment.synthesis.labels.whatDrainsYou')}</p>
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.energy_drains}</p>
                </div>
              )}
              {responses.energy_restores && (
                <div>
                  <p className="font-medium mb-1">{t('assessment.synthesis.labels.whatRestoresYou')}</p>
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.energy_restores}</p>
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

          <div className={`p-6 ${cardStyles.base}`}>
            <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
              <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>{t('assessment.synthesis.sections.currentIdentity.number')}</span>
              {t('assessment.synthesis.sections.currentIdentity.title')}
            </h3>
            <div className={`space-y-3 ${textStyles.secondary}`}>
              {responses.identity_statements && (
                <div>
                  <p className="font-medium mb-1">{t('assessment.synthesis.labels.identityStatements')}</p>
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.identity_statements}</p>
                </div>
              )}
              {responses.others_describe && (
                <div>
                  <p className="font-medium mb-1">{t('assessment.synthesis.labels.howOthersSeeYou')}</p>
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.others_describe}</p>
                </div>
              )}
              <p>
                <span className="font-medium">{t('assessment.synthesis.labels.identityClarity')}</span> {responses.identity_clarity ?? 3}/5
              </p>
            </div>
          </div>

          <div className={`p-6 ${cardStyles.base}`}>
            <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
              <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>{t('assessment.synthesis.sections.behavioralFoundation.number')}</span>
              {t('assessment.synthesis.sections.behavioralFoundation.title')}
            </h3>
            <div className={`space-y-3 ${textStyles.secondary}`}>
              {responses.automatic_behaviors && (
                <div>
                  <p className="font-medium mb-1">{t('assessment.synthesis.labels.automaticBehaviors')}</p>
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.automatic_behaviors}</p>
                </div>
              )}
              {responses.keystone_behaviors && (
                <div>
                  <p className="font-medium mb-1">{t('assessment.synthesis.labels.keystoneBehaviors')}</p>
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.keystone_behaviors}</p>
                </div>
              )}
            </div>
          </div>

          <div className={`p-6 ${cardStyles.base}`}>
            <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
              <span className={`w-8 h-8 ${circleBadge} rounded-full flex items-center justify-center text-sm`}>{t('assessment.synthesis.sections.valuesStrengths.number')}</span>
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
                  <p className="pl-4 text-gray-600 dark:text-gray-400 whitespace-pre-line">{responses.natural_strengths}</p>
                </div>
              )}
            </div>
          </div>

          <div className={`p-6 ${cardStyles.base}`}>
            <h3 className={`font-semibold ${textStyles.primary} mb-4 flex items-center gap-2`}>
              <span className="text-xl">⚠️</span>
              {t('assessment.synthesis.sections.resistancePatterns.title')}
            </h3>
            {responses.resistance_patterns && <p className={`${textStyles.secondary} whitespace-pre-line`}>{responses.resistance_patterns}</p>}
            <p className={`${textStyles.muted} text-sm mt-3 italic`}>{t('assessment.synthesis.sections.resistancePatterns.helpText')}</p>
          </div>
        </div>

        <div className={`p-6 ${cardStyles.hero}`}>
          <h3 className={`font-semibold ${textStyles.primary} mb-3`}>{t('assessment.synthesis.whatsNext.title')}</h3>
          <p className={`${textStyles.secondary} mb-4`}>{t('assessment.synthesis.whatsNext.description')}</p>
          <ul className={`space-y-2 ${textStyles.secondary}`}>
            <li className="flex items-start gap-2">
              <span className={textStyles.subtle}>•</span>
              <span>
                <span className={`${textStyles.primary} font-medium`}>{t('assessment.synthesis.whatsNext.achievable.title')}</span> — {t('assessment.synthesis.whatsNext.achievable.description')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={textStyles.subtle}>•</span>
              <span>
                <span className={`${textStyles.primary} font-medium`}>{t('assessment.synthesis.whatsNext.aligned.title')}</span> — {t('assessment.synthesis.whatsNext.aligned.description')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={textStyles.subtle}>•</span>
              <span>
                <span className={`${textStyles.primary} font-medium`}>{t('assessment.synthesis.whatsNext.bridged.title')}</span> — {t('assessment.synthesis.whatsNext.bridged.description')}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button onClick={goBack} className="px-6 py-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg">
            {t('assessment.navigation.back')}
          </button>
          <button onClick={handleComplete} className="flex-1 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-lg">
            {t('assessment.navigation.complete')}
          </button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (!currentStepData) return null;

    switch (currentStepData.type) {
      case 'intro':
        return renderIntro(currentStepData.content);
      case 'multiSelect':
        return renderMultiSelect(currentStepData);
      case 'singleSelect':
        return renderSingleSelect(currentStepData);
      case 'scale':
        return renderScale(currentStepData);
      case 'textarea':
        return renderTextarea(currentStepData);
      case 'synthesis':
        return renderSynthesis();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{currentPhaseData.title}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 mx-2">·</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{currentPhaseData.subtitle}</span>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">{t('common.progress.stepOf', { current: currentTotalStep, total: totalSteps })}</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 dark:bg-white transition-all duration-300" style={{ width: `${(currentTotalStep / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">{renderStep()}</div>

      {/* Navigation */}
      {currentStepData?.type !== 'intro' && currentStepData?.type !== 'synthesis' && (
        <div className="border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
            <button
              onClick={goBack}
              disabled={isFirstStep}
              className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                isFirstStep ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('assessment.navigation.back')}
            </button>
            <button onClick={goNext} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              {t('assessment.navigation.continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityFoundationsAssessment;
