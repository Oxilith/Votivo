/**
 * @file app/src/components/assessment/IdentityFoundationsAssessment.tsx
 * @purpose Container component orchestrating multi-phase identity assessment questionnaire
 * @functionality
 * - Renders current step based on navigation state
 * - Delegates step rendering to specialized step components
 * - Coordinates navigation via useAssessmentNavigation hook
 * - Manages response state for all questions
 * - Handles completion callback with explicit save for authenticated users
 * - Blocks navigation to insights when save fails (shows error alert with retry)
 * - Tracks when user reaches synthesis phase for navigation state
 * - Supports view-only mode showing only synthesis (no progress bar or navigation)
 * - Supports dark mode and internationalization
 * - Uses shared PageNavigation component for consistent navigation
 * - Includes unified header with Skip to Last and Import/Export/Retake buttons
 * - Auto-jumps to last reached step when returning with responses in store
 * - Includes progress bar and footer for consistent design (edit mode only)
 * - Includes decorative ink brush SVG
 * @dependencies
 * - React (useState, useEffect, useRef, useMemo, useCallback)
 * - react-i18next (useTranslation)
 * - @/types (AssessmentResponses, AssessmentProps)
 * - @/stores (useUIStore, useIsAuthenticated, useAssessmentStore)
 * - @/services (authService)
 * - ./steps (IntroStep, MultiSelectStep, etc.)
 * - ./navigation (AssessmentProgress, NavigationControls)
 * - ./hooks (useAssessmentNavigation)
 * - ./types (Phase)
 * - @/components (FooterSection, PageNavigation, InkBrushDecoration, ErrorCircleIcon, Alert)
 * - ./AssessmentHeader
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
  Alert,
} from '@/components';
import AssessmentHeader from './AssessmentHeader';
import SavePromptModal from './SavePromptModal';
import { importFromJson } from '@/utils';
import { useAssessmentStore } from '@/stores';

const IdentityFoundationsAssessment: React.FC<AssessmentProps> = ({
  initialResponses,
  onComplete,
  startAtSynthesis,
  onImport,
  onExport,
  onNavigateToLanding,
  onNavigateToAssessment: _onNavigateToAssessment,
  onRetakeAssessment,
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

  // Assessment store - for navigation persistence
  const lastReachedPhase = useAssessmentStore((state) => state.lastReachedPhase);
  const lastReachedStep = useAssessmentStore((state) => state.lastReachedStep);
  const updateLastReached = useAssessmentStore((state) => state.updateLastReached);
  const hasResponsesInStore = useAssessmentStore((state) => state.hasResponsesInStore());
  const setSavedAt = useAssessmentStore((state) => state.setSavedAt);
  const savedAt = useAssessmentStore((state) => state.savedAt);

  // Local state for save prompt modal (shows each time user reaches synthesis unauthenticated)
  const [isModalDismissed, setIsModalDismissed] = useState(false);

  // UI store for pending auth flags and save error
  const setPendingAuthReturn = useUIStore((state) => state.setPendingAuthReturn);
  const setPendingAssessmentSave = useUIStore((state) => state.setPendingAssessmentSave);
  const assessmentSaveError = useUIStore((state) => state.assessmentSaveError);
  const setAssessmentSaveError = useUIStore((state) => state.setAssessmentSaveError);

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

  // Navigation hook - pass initial position for auto-jump when returning with responses in store
  // Check if all required fields are complete (needed for effectiveReadOnly before navigation)
  const isAssessmentComplete = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => {
      const value = responses[field];
      if (value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    });
  }, [responses]);

  // Derive readonly from saved assessment state (not just isReadOnly prop)
  // A completed assessment (savedAt !== null) is readonly with a Retake option
  const isCompletedAssessment = savedAt !== null;
  const effectiveReadOnly = isReadOnly || isCompletedAssessment;

  const {
    currentPhase,
    currentStep,
    currentPhaseData,
    currentStepData,
    totalSteps,
    currentTotalStep,
    isFirstStep,
    goNext,
    goBack,
    setPhaseAndStep,
  } = useAssessmentNavigation({
    phases,
    startAtSynthesis,
    // Auto-jump to last reached position if we have responses and not in readonly
    initialPhase: !effectiveReadOnly && hasResponsesInStore ? lastReachedPhase : undefined,
    initialStep: !effectiveReadOnly && hasResponsesInStore ? lastReachedStep : undefined,
    // Update lastReached when advancing
    onReachNewPosition: !effectiveReadOnly ? updateLastReached : undefined,
  });

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
    if (currentStepData?.type === 'scale' && currentStepData.id && !effectiveReadOnly) {
      const stepId = currentStepData.id as keyof AssessmentResponses;
      const currentValue = responses[stepId];
      // Only set default if no value exists yet
      if (currentValue === undefined) {
        setResponses((prev) => ({ ...prev, [stepId]: 3 }));
      }
    }
  }, [currentStepData, effectiveReadOnly, responses]);

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

  // Validated next handler - only advances if current step is valid
  const handleNext = useCallback(() => {
    if (!isCurrentStepValid) {
      setValidationError(t('validation.required'));
      return;
    }
    setValidationError(null);
    goNext();
  }, [isCurrentStepValid, goNext, t]);

  // Save assessment to database and return success status
  const saveAssessmentToDatabase = useCallback(async (): Promise<{ success: boolean; timestamp?: string }> => {
    if (!isAuthenticated || effectiveReadOnly) return { success: true }; // Skip save for these cases

    const hasResponseData = Object.keys(responses).length > 0;
    if (!hasResponseData) return { success: true }; // Nothing to save

    setIsSaving(true);
    setAssessmentSaveError(null);

    try {
      const savedAssessment = await authService.saveAssessment(responses as AssessmentResponses);
      setSavedAt(savedAssessment.createdAt);
      invalidateAssessmentsList();
      return { success: true, timestamp: savedAssessment.createdAt };
    } catch (error) {
      logger.error('Failed to save assessment', error);
      const errorMessage = error instanceof Error ? error.message : t('save.error.default', 'Unable to save your assessment. Please try again.');
      setAssessmentSaveError(errorMessage);
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, effectiveReadOnly, responses, setSavedAt, invalidateAssessmentsList, setAssessmentSaveError, t]);

  // Complete handler - validates and triggers completion flow (async for save await)
  const handleCompleteAsync = useCallback(async () => {
    if (!isAssessmentComplete) {
      logger.error('Attempted to save incomplete assessment', undefined, { responses });
      setValidationError(t('validation.incomplete'));
      return;
    }

    // For unauthenticated users, redirect to auth with pending save flag
    if (!isAuthenticated) {
      setPendingAssessmentSave(true);
      setPendingAuthReturn('insights');
      onNavigateToAuth?.();
      return;
    }

    // Await save to get server timestamp - block navigation on failure
    const result = await saveAssessmentToDatabase();
    if (!result.success) {
      // Don't navigate - stay in synthesis, error alert will be shown
      return;
    }

    onComplete(responses as AssessmentResponses);
  }, [isAssessmentComplete, responses, t, isAuthenticated, setPendingAssessmentSave, setPendingAuthReturn, onNavigateToAuth, saveAssessmentToDatabase, onComplete]);

  // Sync wrapper for event handlers
  const handleComplete = useCallback(() => {
    void handleCompleteAsync();
  }, [handleCompleteAsync]);

  // Skip to last reached step handler
  const handleSkipToLast = useCallback(() => {
    setPhaseAndStep(lastReachedPhase, lastReachedStep);
  }, [setPhaseAndStep, lastReachedPhase, lastReachedStep]);

  // Retake assessment handler (clears store and navigates to fresh assessment)
  const handleRetakeAssessment = useCallback(() => {
    // Clear local component state
    setResponses({});
    setPhaseAndStep(0, 0);
    setValidationError(null);
    // Navigate to /assessment/new for fresh start (clears stores, doesn't load from DB)
    onRetakeAssessment?.();
  }, [setPhaseAndStep, onRetakeAssessment]);

  // Determine if navigation should be shown (hide only for intro steps)
  const showNavigation = currentStepData?.type !== 'intro';
  const isSynthesisStep = currentStepData?.type === 'synthesis';

  // Show save prompt modal at synthesis for unauthenticated users (unless dismissed this session)
  const showSavePromptModal = isSynthesisStep && !isAuthenticated && !isModalDismissed && !effectiveReadOnly;

  // Modal action handlers
  const handleSignIn = useCallback(() => {
    // Set pending return so after auth they come back to assessment
    setPendingAuthReturn('assessment');
    onNavigateToAuth?.();
  }, [setPendingAuthReturn, onNavigateToAuth]);

  const handleCreateAccount = useCallback(() => {
    // Set pending return so after auth they come back to assessment
    setPendingAuthReturn('assessment');
    // Navigate to auth with register mode
    onNavigateToAuth?.();
  }, [setPendingAuthReturn, onNavigateToAuth]);

  const handleDismissModal = useCallback(() => {
    setIsModalDismissed(true);
  }, []);

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
            isReadOnly={effectiveReadOnly}
          />
        );
      }

      case 'singleSelect':
        return (
          <SingleSelectStep
            step={currentStepData}
            value={responses[currentStepData.id as keyof AssessmentResponses] as string | undefined}
            onChange={(value) => { updateResponse(currentStepData.id, value); }}
            isReadOnly={effectiveReadOnly}
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
            isReadOnly={effectiveReadOnly}
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
            isReadOnly={effectiveReadOnly}
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

      {/* Page Navigation - import/export now in AssessmentHeader */}
      <PageNavigation
        currentPage="assessment"
        onNavigateToLanding={onNavigateToLanding}
        onNavigateToAssessment={undefined} // Already on assessment
        onNavigateToInsights={onNavigateToInsights}
        onNavigateToAuth={onNavigateToAuth}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />

      {/* Unified Assessment Header - always visible */}
      <AssessmentHeader
        isReadOnly={effectiveReadOnly}
        createdAt={viewOnlyAssessment?.createdAt}
        currentPhase={currentPhase}
        currentStep={currentStep}
        lastReachedPhase={lastReachedPhase}
        lastReachedStep={lastReachedStep}
        onSkipToLast={handleSkipToLast}
        onRetake={handleRetakeAssessment}
        onImport={handleImportClick}
        onExport={handleExportClick}
      />

      {/* Import error message - positioned below header */}
      {importError && (
        <div className="fixed top-32 lg:top-36 left-4 right-4 lg:left-10 lg:right-10 z-30 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
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

      {/* Progress Header - hidden in readonly mode (synthesis only) */}
      {!effectiveReadOnly && (
        <div className="pt-32 lg:pt-36">
          <AssessmentProgress
            phaseTitle={currentPhaseData.title}
            phaseSubtitle={currentPhaseData.subtitle}
            currentStep={currentTotalStep}
            totalSteps={totalSteps}
          />
        </div>
      )}

      {/* Content - always account for header space (readonly needs more to clear AssessmentHeader) */}
      <div className={`flex-1 max-w-6xl mx-auto px-6 py-8 w-full ${effectiveReadOnly ? 'pt-40 lg:pt-44' : ''}`}>
        {effectiveReadOnly ? (
          <SynthesisStep responses={responses} phases={phases} />
        ) : (
          renderStep()
        )}
      </div>

      {/* Save error alert - shown in synthesis when save fails */}
      {isSynthesisStep && assessmentSaveError && !effectiveReadOnly && (
        <div className="max-w-2xl mx-auto px-6 mb-4">
          <Alert.Error
            title={t('save.error.title')}
            description={assessmentSaveError}
            note={t('save.error.note')}
            data-testid="assessment-save-error-alert"
          >
            <Alert.Actions>
              <Alert.Action
                onClick={handleComplete}
                loading={isSaving}
                data-testid="assessment-save-error-alert-retry"
              >
                {t('save.error.retry')}
              </Alert.Action>
            </Alert.Actions>
          </Alert.Error>
        </div>
      )}

      {/* Navigation - hide in read-only mode */}
      {!effectiveReadOnly && (
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

      {/* Save prompt modal for unauthenticated users at synthesis */}
      <SavePromptModal
        isOpen={showSavePromptModal}
        onSignIn={handleSignIn}
        onCreateAccount={handleCreateAccount}
        onDismiss={handleDismissModal}
      />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default IdentityFoundationsAssessment;
