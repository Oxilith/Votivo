/**
 * @file src/components/assessment/IdentityFoundationsAssessment.tsx
 * @purpose Container component orchestrating multi-phase identity assessment questionnaire
 * @functionality
 * - Renders current step based on navigation state
 * - Delegates step rendering to specialized step components
 * - Coordinates navigation via useAssessmentNavigation hook
 * - Manages response state for all questions
 * - Handles completion callback when user finishes assessment
 * - Supports dark mode and internationalization
 * @dependencies
 * - React (useState)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (AssessmentResponses, AssessmentProps)
 * - @/components/assessment/steps (IntroStep, MultiSelectStep, etc.)
 * - @/components/assessment/navigation (AssessmentProgress, NavigationControls)
 * - @/components/assessment/hooks (useAssessmentNavigation)
 * - @/components/assessment/types (Phase, Step)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssessmentResponses, AssessmentProps } from '@/types/assessment.types';
import {
  IntroStep,
  MultiSelectStep,
  SingleSelectStep,
  ScaleStep,
  TextareaStep,
  SynthesisStep,
} from './steps';
import { AssessmentProgress, NavigationControls } from './navigation';
import { useAssessmentNavigation } from './hooks';
import type { Phase } from './types';

const IdentityFoundationsAssessment: React.FC<AssessmentProps> = ({
  initialResponses,
  onComplete,
  startAtSynthesis,
}) => {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<Partial<AssessmentResponses>>(initialResponses ?? {});

  // Phase configuration with all steps
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
        { type: 'textarea', id: 'identity_statements', question: t('assessment.phase2.identityStatements.question'), context: t('assessment.phase2.identityStatements.context'), placeholder: t('assessment.phase2.identityStatements.placeholder'), rows: 8 },
        { type: 'textarea', id: 'others_describe', question: t('assessment.phase2.othersDescribe.question'), context: t('assessment.phase2.othersDescribe.context'), placeholder: t('assessment.phase2.othersDescribe.placeholder') },
        { type: 'textarea', id: 'automatic_behaviors', question: t('assessment.phase2.automaticBehaviors.question'), context: t('assessment.phase2.automaticBehaviors.context'), placeholder: t('assessment.phase2.automaticBehaviors.placeholder'), rows: 6 },
        { type: 'textarea', id: 'keystone_behaviors', question: t('assessment.phase2.keystoneBehaviors.question'), context: t('assessment.phase2.keystoneBehaviors.context'), placeholder: t('assessment.phase2.keystoneBehaviors.placeholder') },
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
        { type: 'textarea', id: 'natural_strengths', question: t('assessment.phase2.naturalStrengths.question'), context: t('assessment.phase2.naturalStrengths.context'), placeholder: t('assessment.phase2.naturalStrengths.placeholder') },
        { type: 'textarea', id: 'resistance_patterns', question: t('assessment.phase2.resistancePatterns.question'), context: t('assessment.phase2.resistancePatterns.context'), placeholder: t('assessment.phase2.resistancePatterns.placeholder') },
        { type: 'scale', id: 'identity_clarity', question: t('assessment.phase2.identityClarity.question'), context: t('assessment.phase2.identityClarity.context'), lowLabel: t('assessment.phase2.identityClarity.lowLabel'), highLabel: t('assessment.phase2.identityClarity.highLabel'), min: 1, max: 5 },
      ],
    },
    {
      id: 'synthesis',
      title: t('assessment.synthesis.title'),
      subtitle: t('assessment.synthesis.subtitle'),
      steps: [{ type: 'synthesis' }],
    },
  ];

  // Navigation hook
  const {
    currentPhaseData,
    currentStepData,
    totalSteps,
    currentTotalStep,
    isFirstStep,
    goNext,
    goBack,
  } = useAssessmentNavigation({ phases, startAtSynthesis });

  // Update response handler
  const updateResponse = (key: string, value: string | number | string[]) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  // Complete handler
  const handleComplete = () => {
    onComplete(responses as AssessmentResponses);
  };

  // Determine if navigation should be shown
  const showNavigation =
    currentStepData?.type !== 'intro' && currentStepData?.type !== 'synthesis';

  // Render current step
  const renderStep = () => {
    if (!currentStepData) return null;

    switch (currentStepData.type) {
      case 'intro':
        return <IntroStep content={currentStepData.content} onNext={goNext} />;

      case 'multiSelect':
        return (
          <MultiSelectStep
            step={currentStepData}
            value={(responses[currentStepData.id as keyof AssessmentResponses] as string[]) ?? []}
            onChange={(value) => updateResponse(currentStepData.id, value)}
          />
        );

      case 'singleSelect':
        return (
          <SingleSelectStep
            step={currentStepData}
            value={responses[currentStepData.id as keyof AssessmentResponses] as string | undefined}
            onChange={(value) => updateResponse(currentStepData.id, value)}
          />
        );

      case 'scale':
        return (
          <ScaleStep
            step={currentStepData}
            value={(responses[currentStepData.id as keyof AssessmentResponses] as number) ?? 3}
            onChange={(value) => updateResponse(currentStepData.id, value)}
          />
        );

      case 'textarea':
        return (
          <TextareaStep
            step={currentStepData}
            value={(responses[currentStepData.id as keyof AssessmentResponses] as string) ?? ''}
            onChange={(value) => updateResponse(currentStepData.id, value)}
          />
        );

      case 'synthesis':
        return (
          <SynthesisStep
            responses={responses}
            phases={phases}
            onBack={goBack}
            onComplete={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Progress Header */}
      <AssessmentProgress
        phaseTitle={currentPhaseData.title}
        phaseSubtitle={currentPhaseData.subtitle}
        currentStep={currentTotalStep}
        totalSteps={totalSteps}
      />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">{renderStep()}</div>

      {/* Navigation */}
      <NavigationControls
        onBack={goBack}
        onNext={goNext}
        isFirstStep={isFirstStep}
        showNavigation={showNavigation}
      />
    </div>
  );
};

export default IdentityFoundationsAssessment;
