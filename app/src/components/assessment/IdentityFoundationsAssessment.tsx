/**
 * @file src/components/assessment/IdentityFoundationsAssessment.tsx
 * @purpose Container component orchestrating multi-phase identity assessment questionnaire
 * @functionality
 * - Renders current step based on navigation state
 * - Delegates step rendering to specialized step components
 * - Coordinates navigation via useAssessmentNavigation hook
 * - Manages response state for all questions
 * - Handles completion callback with explicit save for authenticated users
 * - Tracks when user reaches synthesis phase for navigation state
 * - Supports view-only mode for viewing saved assessments with PageHeader
 * - Supports dark mode and internationalization
 * - Uses shared PageNavigation component for consistent navigation
 * - Includes progress bar and footer for consistent design
 * - Includes decorative ink brush SVG
 * @dependencies
 * - React (useState, useEffect, useRef)
 * - react-i18next (useTranslation)
 * - @/types (AssessmentResponses, AssessmentProps)
 * - @/stores (useUIStore, useIsAuthenticated)
 * - @/services (authService)
 * - ./steps (IntroStep, MultiSelectStep, etc.)
 * - ./navigation (AssessmentProgress, NavigationControls)
 * - ./hooks (useAssessmentNavigation)
 * - ./types (Phase)
 * - @/components (FooterSection, PageNavigation, InkBrushDecoration, ErrorCircleIcon)
 * - ./AssessmentPageHeader
 * - @/utils (importFromJson)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssessmentResponses, AssessmentProps } from '@/types';
import { useUIStore } from '@/stores/useUIStore';
import { useIsAuthenticated, useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/services/api';
import { logger } from '@/utils';
import { REQUIRED_FIELDS } from '@votive/shared';
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
import {
  FooterSection,
  PageNavigation,
  ErrorCircleIcon,
  InkBrushDecoration,
} from '@/components';
import AssessmentPageHeader from './AssessmentPageHeader';
import { importFromJson } from '@/utils';

const IdentityFoundationsAssessment: React.FC<AssessmentProps> = ({
  initialResponses,
  onComplete,
  startAtSynthesis,
  onImport,
  onExport,
  onNavigateToLanding,
  onNavigateToInsights,
  onNavigateToAuth,
  onNavigateToProfile,
  onSignOut,
  isReadOnly = false,
  viewOnlyAssessment,
}) => {
  const { t } = useTranslation(['assessment', 'header']);
  // In view-only mode, use the viewOnlyAssessment.responses instead of store responses
  const effectiveInitialResponses = viewOnlyAssessment?.responses ?? initialResponses ?? {};
  const [responses, setResponses] = useState<Partial<AssessmentResponses>>(effectiveInitialResponses);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const isAuthenticated = useIsAuthenticated();
  const invalidateAssessmentsList = useAuthStore((state) => state.invalidateAssessmentsList);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelectAsync = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const data = await importFromJson(file);
      onImport?.(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('header:errors.importFailed'));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFileSelectAsync(event);
  };

  const handleExportClick = () => {
    onExport?.();
  };

  const hasResponses = Object.keys(responses).length > 0;

  // Phase configuration with all steps
  const phases: Phase[] = [
    {
      id: 'intro',
      title: t('welcome.title'),
      subtitle: t('welcome.subtitle'),
      steps: [
        {
          type: 'intro',
          content: {
            heading: t('welcome.heading'),
            subheading: t('welcome.subheading'),
            description: t('welcome.description'),
            buttonText: t('welcome.buttonText'),
          },
        },
      ],
    },
    {
      id: 'phase1',
      title: t('phase1.title'),
      subtitle: t('phase1.subtitle'),
      description: t('phase1.description'),
      steps: [
        {
          type: 'multiSelect',
          id: 'peak_energy_times',
          question: t('phase1.peakEnergy.question'),
          context: t('phase1.peakEnergy.context'),
          options: [
            { id: 'early_morning', label: t('phase1.peakEnergy.options.earlyMorning.label'), description: t('phase1.peakEnergy.options.earlyMorning.description') },
            { id: 'mid_morning', label: t('phase1.peakEnergy.options.midMorning.label'), description: t('phase1.peakEnergy.options.midMorning.description') },
            { id: 'midday', label: t('phase1.peakEnergy.options.midday.label'), description: t('phase1.peakEnergy.options.midday.description') },
            { id: 'afternoon', label: t('phase1.peakEnergy.options.afternoon.label'), description: t('phase1.peakEnergy.options.afternoon.description') },
            { id: 'evening', label: t('phase1.peakEnergy.options.evening.label'), description: t('phase1.peakEnergy.options.evening.description') },
            { id: 'night', label: t('phase1.peakEnergy.options.night.label'), description: t('phase1.peakEnergy.options.night.description') },
            { id: 'late_night', label: t('phase1.peakEnergy.options.lateNight.label'), description: t('phase1.peakEnergy.options.lateNight.description') },
          ],
        },
        {
          type: 'multiSelect',
          id: 'low_energy_times',
          question: t('phase1.lowEnergy.question'),
          context: t('phase1.lowEnergy.context'),
          options: [
            { id: 'early_morning', label: t('phase1.lowEnergy.options.earlyMorning.label'), description: t('phase1.lowEnergy.options.earlyMorning.description') },
            { id: 'mid_morning', label: t('phase1.lowEnergy.options.midMorning.label'), description: t('phase1.lowEnergy.options.midMorning.description') },
            { id: 'midday', label: t('phase1.lowEnergy.options.midday.label'), description: t('phase1.lowEnergy.options.midday.description') },
            { id: 'afternoon', label: t('phase1.lowEnergy.options.afternoon.label'), description: t('phase1.lowEnergy.options.afternoon.description') },
            { id: 'evening', label: t('phase1.lowEnergy.options.evening.label'), description: t('phase1.lowEnergy.options.evening.description') },
            { id: 'night', label: t('phase1.lowEnergy.options.night.label'), description: t('phase1.lowEnergy.options.night.description') },
          ],
        },
        {
          type: 'scale',
          id: 'energy_consistency',
          question: t('phase1.energyConsistency.question'),
          context: t('phase1.energyConsistency.context'),
          lowLabel: t('phase1.energyConsistency.lowLabel'),
          highLabel: t('phase1.energyConsistency.highLabel'),
          min: 1,
          max: 5,
        },
        {
          type: 'textarea',
          id: 'energy_drains',
          question: t('phase1.energyDrains.question'),
          context: t('phase1.energyDrains.context'),
          placeholder: t('phase1.energyDrains.placeholder'),
        },
        {
          type: 'textarea',
          id: 'energy_restores',
          question: t('phase1.energyRestores.question'),
          context: t('phase1.energyRestores.context'),
          placeholder: t('phase1.energyRestores.placeholder'),
        },
        {
          type: 'multiSelect',
          id: 'mood_triggers_negative',
          question: t('phase1.moodTriggers.question'),
          context: t('phase1.moodTriggers.context'),
          options: [
            { id: 'lack_of_progress', label: t('phase1.moodTriggers.options.lackOfProgress.label') },
            { id: 'conflict', label: t('phase1.moodTriggers.options.conflict.label') },
            { id: 'uncertainty', label: t('phase1.moodTriggers.options.uncertainty.label') },
            { id: 'overwhelm', label: t('phase1.moodTriggers.options.overwhelm.label') },
            { id: 'lack_of_control', label: t('phase1.moodTriggers.options.lackOfControl.label') },
            { id: 'poor_sleep', label: t('phase1.moodTriggers.options.poorSleep.label') },
            { id: 'physical', label: t('phase1.moodTriggers.options.physical.label') },
            { id: 'isolation', label: t('phase1.moodTriggers.options.isolation.label') },
            { id: 'overstimulation', label: t('phase1.moodTriggers.options.overstimulation.label') },
            { id: 'criticism', label: t('phase1.moodTriggers.options.criticism.label') },
            { id: 'comparison', label: t('phase1.moodTriggers.options.comparison.label') },
            { id: 'boredom', label: t('phase1.moodTriggers.options.boredom.label') },
          ],
        },
        {
          type: 'scale',
          id: 'motivation_reliability',
          question: t('phase1.motivationReliability.question'),
          context: t('phase1.motivationReliability.context'),
          lowLabel: t('phase1.motivationReliability.lowLabel'),
          highLabel: t('phase1.motivationReliability.highLabel'),
          min: 1,
          max: 5,
        },
        {
          type: 'singleSelect',
          id: 'willpower_pattern',
          question: t('phase1.willpowerPattern.question'),
          context: t('phase1.willpowerPattern.context'),
          options: [
            { id: 'never_start', label: t('phase1.willpowerPattern.options.neverStart.label'), description: t('phase1.willpowerPattern.options.neverStart.description') },
            { id: 'start_stop', label: t('phase1.willpowerPattern.options.startStop.label'), description: t('phase1.willpowerPattern.options.startStop.description') },
            { id: 'distraction', label: t('phase1.willpowerPattern.options.distraction.label'), description: t('phase1.willpowerPattern.options.distraction.description') },
            { id: 'perfectionism', label: t('phase1.willpowerPattern.options.perfectionism.label'), description: t('phase1.willpowerPattern.options.perfectionism.description') },
            { id: 'energy', label: t('phase1.willpowerPattern.options.energy.label'), description: t('phase1.willpowerPattern.options.energy.description') },
            { id: 'forget', label: t('phase1.willpowerPattern.options.forget.label'), description: t('phase1.willpowerPattern.options.forget.description') },
          ],
        },
      ],
    },
    {
      id: 'phase2',
      title: t('phase2.title'),
      subtitle: t('phase2.subtitle'),
      description: t('phase2.description'),
      steps: [
        {
          type: 'intro',
          content: {
            heading: t('phase2.intro.heading'),
            subheading: t('phase2.intro.subheading'),
            description: t('phase2.intro.description'),
            buttonText: t('phase2.intro.buttonText'),
          },
        },
        { type: 'textarea', id: 'identity_statements', question: t('phase2.identityStatements.question'), context: t('phase2.identityStatements.context'), placeholder: t('phase2.identityStatements.placeholder'), rows: 8 },
        { type: 'textarea', id: 'others_describe', question: t('phase2.othersDescribe.question'), context: t('phase2.othersDescribe.context'), placeholder: t('phase2.othersDescribe.placeholder') },
        { type: 'textarea', id: 'automatic_behaviors', question: t('phase2.automaticBehaviors.question'), context: t('phase2.automaticBehaviors.context'), placeholder: t('phase2.automaticBehaviors.placeholder'), rows: 6 },
        { type: 'textarea', id: 'keystone_behaviors', question: t('phase2.keystoneBehaviors.question'), context: t('phase2.keystoneBehaviors.context'), placeholder: t('phase2.keystoneBehaviors.placeholder') },
        {
          type: 'multiSelect',
          id: 'core_values',
          question: t('phase2.coreValues.question'),
          context: t('phase2.coreValues.context'),
          options: [
            { id: 'growth', label: t('phase2.coreValues.options.growth.label') },
            { id: 'autonomy', label: t('phase2.coreValues.options.autonomy.label') },
            { id: 'mastery', label: t('phase2.coreValues.options.mastery.label') },
            { id: 'impact', label: t('phase2.coreValues.options.impact.label') },
            { id: 'connection', label: t('phase2.coreValues.options.connection.label') },
            { id: 'integrity', label: t('phase2.coreValues.options.integrity.label') },
            { id: 'creativity', label: t('phase2.coreValues.options.creativity.label') },
            { id: 'security', label: t('phase2.coreValues.options.security.label') },
            { id: 'adventure', label: t('phase2.coreValues.options.adventure.label') },
            { id: 'balance', label: t('phase2.coreValues.options.balance.label') },
            { id: 'recognition', label: t('phase2.coreValues.options.recognition.label') },
            { id: 'service', label: t('phase2.coreValues.options.service.label') },
            { id: 'wisdom', label: t('phase2.coreValues.options.wisdom.label') },
            { id: 'efficiency', label: t('phase2.coreValues.options.efficiency.label') },
            { id: 'authenticity', label: t('phase2.coreValues.options.authenticity.label') },
            { id: 'leadership', label: t('phase2.coreValues.options.leadership.label') },
          ],
        },
        { type: 'textarea', id: 'natural_strengths', question: t('phase2.naturalStrengths.question'), context: t('phase2.naturalStrengths.context'), placeholder: t('phase2.naturalStrengths.placeholder') },
        { type: 'textarea', id: 'resistance_patterns', question: t('phase2.resistancePatterns.question'), context: t('phase2.resistancePatterns.context'), placeholder: t('phase2.resistancePatterns.placeholder') },
        { type: 'scale', id: 'identity_clarity', question: t('phase2.identityClarity.question'), context: t('phase2.identityClarity.context'), lowLabel: t('phase2.identityClarity.lowLabel'), highLabel: t('phase2.identityClarity.highLabel'), min: 1, max: 5 },
      ],
    },
    {
      id: 'synthesis',
      title: t('synthesis.title'),
      subtitle: t('synthesis.subtitle'),
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

  // UI Store for tracking synthesis reached
  const setHasReachedSynthesis = useUIStore((state) => state.setHasReachedSynthesis);

  // Set hasReachedSynthesis when user reaches synthesis phase
  useEffect(() => {
    if (currentPhaseData.id === 'synthesis') {
      setHasReachedSynthesis(true);
    }
  }, [currentPhaseData.id, setHasReachedSynthesis]);

  // Auto-set default value (3) for scale steps when they are first rendered
  useEffect(() => {
    if (currentStepData?.type === 'scale' && currentStepData.id && !isReadOnly) {
      const stepId = currentStepData.id as keyof AssessmentResponses;
      const currentValue = responses[stepId];
      // Only set default if no value exists yet
      if (currentValue === undefined) {
        setResponses((prev) => ({ ...prev, [stepId]: 3 }));
      }
    }
  }, [currentStepData, isReadOnly, responses]);

  // Update response handler - clears validation error when user makes changes
  const updateResponse = (key: string, value: string | number | string[]) => {
    setResponses((prev: Partial<AssessmentResponses>) => ({ ...prev, [key]: value }));
    // Clear validation error when user makes a change
    if (validationError) {
      setValidationError(null);
    }
  };

  // Check if the current step has valid data
  const isCurrentStepValid = useMemo(() => {
    if (!currentStepData) return true;

    // Intro and synthesis steps don't require validation
    if (currentStepData.type === 'intro' || currentStepData.type === 'synthesis') {
      return true;
    }

    const stepId = currentStepData.id as keyof AssessmentResponses;
    const value = responses[stepId];

    if (value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true; // Scale steps always have a value (default 3)
    return false;
  }, [currentStepData, responses]);

  // Check if all required fields are complete
  const isAssessmentComplete = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => {
      const value = responses[field];
      if (value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    });
  }, [responses]);

  // Validated next handler - only advances if current step is valid
  const handleNext = useCallback(() => {
    if (!isCurrentStepValid) {
      setValidationError(t('validation.required'));
      return;
    }
    setValidationError(null);
    goNext();
  }, [isCurrentStepValid, goNext, t]);

  // Complete handler - saves assessment to database for authenticated users
  const handleCompleteAsync = async () => {
    // Validate that assessment is complete before saving
    if (!isAssessmentComplete) {
      logger.error('Attempted to save incomplete assessment', undefined, { responses });
      setValidationError(t('validation.incomplete'));
      return;
    }

    if (isAuthenticated && !isReadOnly) {
      setIsSaving(true);
      try {
        const hasResponseData = Object.keys(responses).length > 0;
        if (hasResponseData) {
          await authService.saveAssessment(responses as AssessmentResponses);
          // Invalidate the assessments list so profile page fetches fresh data
          invalidateAssessmentsList();
        }
      } catch (error) {
        logger.error('Failed to save assessment', error);
        // Continue to insights even if save fails - user can still see their results
      } finally {
        setIsSaving(false);
      }
    }
    onComplete(responses as AssessmentResponses);
  };

  const handleComplete = useCallback(() => {
    void handleCompleteAsync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssessmentComplete, isAuthenticated, isReadOnly, responses, onComplete]);

  // Determine if navigation should be shown (hide only for intro steps)
  const showNavigation = currentStepData?.type !== 'intro';
  const isSynthesisStep = currentStepData?.type === 'synthesis';

  // Render current step
  const renderStep = () => {
    if (!currentStepData) return null;

    switch (currentStepData.type) {
      case 'intro':
        return (
          <IntroStep
            content={currentStepData.content}
            onNext={goNext}
            onBack={goBack}
            isFirstStep={isFirstStep}
          />
        );

      case 'multiSelect': {
        const rawValue = responses[currentStepData.id as keyof AssessmentResponses];
        const multiSelectValue = Array.isArray(rawValue) ? rawValue : [];
        return (
          <MultiSelectStep
            step={currentStepData}
            value={multiSelectValue}
            onChange={(value) => { updateResponse(currentStepData.id, value); }}
            isReadOnly={isReadOnly}
          />
        );
      }

      case 'singleSelect':
        return (
          <SingleSelectStep
            step={currentStepData}
            value={responses[currentStepData.id as keyof AssessmentResponses] as string | undefined}
            onChange={(value) => { updateResponse(currentStepData.id, value); }}
            isReadOnly={isReadOnly}
          />
        );

      case 'scale': {
        const rawScaleValue = responses[currentStepData.id as keyof AssessmentResponses];
        const scaleValue = typeof rawScaleValue === 'number' ? rawScaleValue : 3;
        return (
          <ScaleStep
            step={currentStepData}
            value={scaleValue}
            onChange={(value) => { updateResponse(currentStepData.id, value); }}
            isReadOnly={isReadOnly}
          />
        );
      }

      case 'textarea': {
        const rawTextValue = responses[currentStepData.id as keyof AssessmentResponses];
        const textValue = typeof rawTextValue === 'string' ? rawTextValue : '';
        return (
          <TextareaStep
            step={currentStepData}
            value={textValue}
            onChange={(value) => { updateResponse(currentStepData.id, value); }}
            isReadOnly={isReadOnly}
          />
        );
      }

      case 'synthesis':
        return (
          <SynthesisStep
            responses={responses}
            phases={phases}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative" data-testid="assessment-page">
      {/* Hidden file input for import - placed at root level for browser compatibility */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ position: 'fixed', top: '-100px', left: '-100px', opacity: 0 }}
      />

      {/* Fixed Ink Brush Decoration - Right side */}
      <InkBrushDecoration />

      {/* Page Navigation */}
      <PageNavigation
        currentPage="assessment"
        onNavigateToLanding={onNavigateToLanding}
        onNavigateToAssessment={undefined} // Already on assessment
        onNavigateToInsights={onNavigateToInsights}
        onNavigateToAuth={onNavigateToAuth}
        onImport={isReadOnly ? undefined : handleImportClick}
        onExportAssessment={isReadOnly ? undefined : (hasResponses ? handleExportClick : undefined)}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />

      {/* View-only Page Header */}
      {isReadOnly && viewOnlyAssessment && (
        <AssessmentPageHeader
          createdAt={viewOnlyAssessment.createdAt}
          onExport={handleExportClick}
        />
      )}

      {/* Import error message */}
      {importError && (
        <div className={`fixed ${isReadOnly && viewOnlyAssessment ? 'top-32 lg:top-36' : 'top-20 lg:top-24'} left-4 right-4 lg:left-10 lg:right-10 z-30 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2`}>
          <ErrorCircleIcon size="sm" className="flex-shrink-0" />
          <span>{importError}</span>
          <button
            onClick={() => { setImportError(null); }}
            className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress Header - with top padding for floating nav (extra padding when view-only header is shown) */}
      <div className={isReadOnly && viewOnlyAssessment ? 'pt-32 lg:pt-36' : 'pt-20 lg:pt-24'}>
        <AssessmentProgress
          phaseTitle={currentPhaseData.title}
          phaseSubtitle={currentPhaseData.subtitle}
          currentStep={currentTotalStep}
          totalSteps={totalSteps}
        />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">{renderStep()}</div>

      {/* Navigation - hide in read-only mode */}
      {!isReadOnly && (
        <NavigationControls
          onBack={goBack}
          onNext={handleNext}
          isFirstStep={isFirstStep}
          showNavigation={showNavigation}
          isSynthesis={isSynthesisStep}
          onComplete={handleComplete}
          isSaving={isSaving}
          validationError={validationError}
        />
      )}

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default IdentityFoundationsAssessment;
