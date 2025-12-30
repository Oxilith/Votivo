/**
 * @file src/components/insights/IdentityInsightsAI.tsx
 * @purpose AI-powered analysis display with Ink & Stone styling
 * @functionality
 * - Receives assessment responses as props
 * - Uses Zustand analysis store for state management
 * - Displays analysis results in tabbed interface with vermilion accents
 * - Shows identity synthesis with hidden strengths and next steps
 * - Provides re-analyze functionality that creates new analysis record
 * - Passes user profile (name, age, gender) for personalized AI analysis
 * - Includes loading states with ink-style dots and error handling
 * - Uses shared PageNavigation component for consistent navigation
 * - Includes decorative ink brush SVG and footer
 * - Supports view-only mode for viewing saved analyses with PageHeader
 * - Supports dark mode theme switching
 * - Supports internationalization (English/Polish)
 * - Prompts unauthenticated users to save their analysis
 * - Auto-saves analysis for authenticated users
 * @dependencies
 * - React (useState, useCallback, useRef, useEffect)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (InsightsProps)
 * - @/stores (useAnalysisStore)
 * - @/stores/useAuthStore (useIsAuthenticated, useCurrentUser)
 * - @/services/api/AuthService
 * - @/styles/theme (cardStyles, textStyles)
 * - shared (UserProfileForAnalysis)
 * - @/components/landing/sections/FooterSection
 * - @/components/shared/PageNavigation
 * - @/components/insights/InsightsPageHeader
 * - @/components/shared/InkBrushDecoration
 * - @/components/shared/icons (ErrorCircleIcon, SearchIcon, etc.)
 * - @/utils/fileUtils
 * - ./InsightCard (InsightCard component)
 * - ./SavePromptModal
 */

import React, { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  InsightsProps,
  AnalysisPattern,
  AnalysisContradiction,
  AnalysisBlindSpot,
  AnalysisLeveragePoint,
  AnalysisRisk,
} from '@/types';
import { useAnalysisStore, useIsAuthenticated, useCurrentUser } from '@/stores';
import type { UserProfileForAnalysis } from 'shared';
import { authService } from '@/services';
import { cardStyles, textStyles } from '@/styles';
import InsightCard from './InsightCard';
import SavePromptModal from './SavePromptModal';
import {
  FooterSection,
  PageNavigation,
  InkBrushDecoration,
  ErrorCircleIcon,
  SearchIcon,
  SwitchHorizontalIcon,
  EyeIcon,
  TargetIcon,
  AlertTriangleIcon,
  MirrorIcon,
  RefreshIcon,
  LightningBoltIcon,
  ArrowRightIcon,
} from '@/components';
import InsightsPageHeader from './InsightsPageHeader';
import { importFromJson } from '@/utils';

interface Tab {
  id: string;
  label: string;
  count: number | null;
  icon: ReactNode;
}

const IdentityInsightsAI: React.FC<InsightsProps> = ({
  responses,
  onExport,
  onImport,
  onExportAnalysis,
  hasAnalysis,
  onNavigateToLanding,
  onNavigateToAssessment,
  onNavigateToAuth,
  onNavigateToProfile,
  onNavigateToAuthWithReturn,
  onSignOut,
  isReadOnly = false,
  viewingAssessmentId,
  viewOnlyAnalysis,
}) => {
  const { t, i18n } = useTranslation(['insights', 'header']);
  const [activeTab, setActiveTab] = useState('patterns');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Zustand analysis store
  const {
    analysis: storeAnalysis,
    rawResponse,
    isAnalyzing: loading,
    analysisError: error,
    analyze,
    downloadRawResponse,
  } = useAnalysisStore();

  // In view-only mode, use the viewOnlyAnalysis.result instead of store analysis
  const analysis = viewOnlyAnalysis?.result ?? storeAnalysis;

  // Auth state
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const prevAnalysisRef = useRef(storeAnalysis);

  // Auto-save for authenticated users when analysis completes
  // Skip if read-only (viewing a saved analysis) to prevent duplication
  useEffect(() => {
    // Only run when store analysis changes from null/undefined to a value
    if (storeAnalysis && storeAnalysis !== prevAnalysisRef.current && !loading && !isReadOnly) {
      prevAnalysisRef.current = storeAnalysis;

      if (isAuthenticated) {
        // Auto-save for authenticated users
        // Pass viewingAssessmentId to link this analysis to its assessment
        const saveAnalysis = async () => {
          try {
            await authService.saveAnalysis(storeAnalysis, viewingAssessmentId ?? undefined);
            setHasSaved(true);
          } catch {
            // Silently fail - user can still see their analysis
            console.error('Failed to save analysis');
          }
        };
        saveAnalysis();
      }
    }
  }, [storeAnalysis, isAuthenticated, loading, isReadOnly, viewingAssessmentId]);

  // Show save prompt for unauthenticated users after analysis completes
  // Using a separate effect to track when we should show the prompt
  // Skip in view-only mode (we're viewing an existing analysis, not creating new)
  const shouldShowPrompt = !!(analysis && !isAuthenticated && !hasSaved && !loading && !showSavePrompt && !isReadOnly);

  useEffect(() => {
    if (shouldShowPrompt) {
      // Use a small delay to avoid cascading render issues
      const timer = setTimeout(() => {
        setShowSavePrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleExportClick = () => {
    onExport?.();
  };

  const handleExportAnalysisClick = () => {
    onExportAnalysis?.();
  };

  const hasResponses = Object.keys(responses).length > 0;

  const analyzeWithClaude = useCallback(async () => {
    const language = i18n.language === 'pl' ? 'polish' : 'english';
    setHasSaved(false); // Reset saved state for new analysis

    // Build user profile for demographic context if authenticated
    let userProfile: UserProfileForAnalysis | undefined;
    if (currentUser) {
      const currentYear = new Date().getFullYear();
      userProfile = {
        name: currentUser.name,
        age: currentYear - currentUser.birthYear,
        gender: currentUser.gender,
      };
    }

    await analyze(responses, language, userProfile);
  }, [analyze, responses, i18n.language, currentUser]);

  // Save prompt handlers - use returnTo so user comes back to insights after auth
  const handleSavePromptSignIn = useCallback(() => {
    setShowSavePrompt(false);
    if (onNavigateToAuthWithReturn) {
      onNavigateToAuthWithReturn('insights');
    } else {
      onNavigateToAuth?.();
    }
  }, [onNavigateToAuth, onNavigateToAuthWithReturn]);

  const handleSavePromptCreateAccount = useCallback(() => {
    setShowSavePrompt(false);
    if (onNavigateToAuthWithReturn) {
      onNavigateToAuthWithReturn('insights');
    } else {
      onNavigateToAuth?.();
    }
  }, [onNavigateToAuth, onNavigateToAuthWithReturn]);

  const handleSavePromptContinue = useCallback(() => {
    setShowSavePrompt(false);
    setHasSaved(true); // Prevent modal from reappearing
  }, []);

  const tabs: Tab[] = analysis
    ? [
        { id: 'patterns', label: t('tabs.patterns'), count: analysis.patterns?.length ?? 0, icon: <SearchIcon size="md" /> },
        { id: 'contradictions', label: t('tabs.contradictions'), count: analysis.contradictions?.length ?? 0, icon: <SwitchHorizontalIcon size="md" /> },
        { id: 'blindSpots', label: t('tabs.blindSpots'), count: analysis.blindSpots?.length ?? 0, icon: <EyeIcon size="md" /> },
        { id: 'leverage', label: t('tabs.leverage'), count: analysis.leveragePoints?.length ?? 0, icon: <TargetIcon size="md" /> },
        { id: 'risks', label: t('tabs.risks'), count: analysis.risks?.length ?? 0, icon: <AlertTriangleIcon size="md" /> },
        { id: 'synthesis', label: t('tabs.synthesis'), count: null, icon: <MirrorIcon size="md" /> },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative">
      {/* Save Prompt Modal */}
      <SavePromptModal
        isOpen={showSavePrompt}
        onSignIn={handleSavePromptSignIn}
        onCreateAccount={handleSavePromptCreateAccount}
        onContinue={handleSavePromptContinue}
      />

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
        currentPage="insights"
        onNavigateToLanding={onNavigateToLanding}
        onNavigateToAssessment={onNavigateToAssessment}
        onNavigateToInsights={() => {}} // Already on insights
        onNavigateToAuth={onNavigateToAuth}
        onExportAssessment={isReadOnly ? undefined : (hasResponses ? handleExportClick : undefined)}
        onExportAnalysis={isReadOnly ? undefined : (hasAnalysis && onExportAnalysis ? handleExportAnalysisClick : undefined)}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />

      {/* View-only Page Header */}
      {isReadOnly && viewOnlyAnalysis && (
        <InsightsPageHeader
          createdAt={viewOnlyAnalysis.createdAt}
          onExportAnalysis={handleExportAnalysisClick}
          onExportAssessment={viewOnlyAnalysis.assessmentId ? handleExportClick : undefined}
        />
      )}

      {/* Import error message */}
      {importError && (
        <div className={`fixed ${isReadOnly && viewOnlyAnalysis ? 'top-32 lg:top-36' : 'top-20 lg:top-24'} left-4 right-4 lg:left-10 lg:right-10 z-30 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2`}>
          <ErrorCircleIcon size="sm" className="flex-shrink-0" />
          <span>{importError}</span>
          <button
            onClick={() => setImportError(null)}
            className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content with top padding for floating nav (extra padding when view-only header is shown) */}
      <div className={`flex-1 ${isReadOnly && viewOnlyAnalysis ? 'pt-32 lg:pt-36' : 'pt-20 lg:pt-24'}`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
        {/* No assessment data - prompt user to complete assessment first */}
        {!hasResponses && !loading && !error && (
          <div className="text-center py-16 reveal">
            {/* Ink brush circle - empty assessment indicator */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="180 20"
                  className="opacity-30"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="24"
                  fill="var(--text-muted)"
                  className="opacity-10"
                />
                <path
                  d="M40 28 L40 44 M40 50 L40 52"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-60"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">{t('noAssessment.title')}</h2>
            <p className="font-body text-[var(--text-secondary)] mb-6 max-w-md mx-auto">{t('noAssessment.description')}</p>
            <button
              onClick={onNavigateToAssessment}
              className="cta-button px-6 py-3 bg-[var(--accent)] text-white font-body font-medium rounded-sm inline-flex items-center gap-2"
            >
              <span>{t('noAssessment.button')}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Ready for analysis - has assessment data but no analysis yet */}
        {hasResponses && !analysis && !loading && !error && (
          <div className="text-center py-16 reveal">
            {/* Ink brush circle - minimalist ready state */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="180 20"
                  className="opacity-20"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="24"
                  fill="var(--accent)"
                  className="opacity-10"
                />
                <path
                  d="M32 40 L38 46 L50 34"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">{t('ready.title')}</h2>
            <p className="font-body text-[var(--text-secondary)] mb-6 max-w-md mx-auto">{t('ready.description')}</p>
            <button
              onClick={analyzeWithClaude}
              className="cta-button px-6 py-3 bg-[var(--accent)] text-white font-body font-medium rounded-sm inline-flex items-center gap-2"
            >
              <span>{t('ready.button')}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            {/* Ink brush loading animation */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg viewBox="0 0 80 80" className="w-full h-full animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="60 140"
                  className="opacity-60"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="40 120"
                  className="opacity-30"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">{t('loading.title')}</h2>
            <p className="font-body text-[var(--text-secondary)]">{t('loading.description')}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            {/* Minimalist error indicator */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="180 20"
                  className="text-red-500/30"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="24"
                  fill="currentColor"
                  className="text-red-500/10"
                />
                <path
                  d="M40 28 L40 44 M40 50 L40 52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-red-500"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">{t('error.title')}</h2>
            <p className="font-body text-[var(--text-secondary)] mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              {rawResponse && (
                <button
                  onClick={downloadRawResponse}
                  className="px-4 py-2.5 text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 font-body font-medium rounded-sm transition-colors"
                >
                  {t('error.downloadRaw')}
                </button>
              )}
              <button
                onClick={analyzeWithClaude}
                className="cta-button px-6 py-3 bg-[var(--accent)] text-white font-body font-medium rounded-sm"
              >
                {t('error.tryAgain')}
              </button>
            </div>
          </div>
        )}

        {analysis && (
          <>
            {/* Tabs */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-sm mb-6 overflow-hidden">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 font-body text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-1 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <span className="flex-shrink-0">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded-sm ${
                          activeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {activeTab === 'patterns' && analysis.patterns?.map((item: AnalysisPattern, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'contradictions' && analysis.contradictions?.map((item: AnalysisContradiction, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'blindSpots' && analysis.blindSpots?.map((item: AnalysisBlindSpot, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'leverage' && analysis.leveragePoints?.map((item: AnalysisLeveragePoint, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'risks' && analysis.risks?.map((item: AnalysisRisk, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'synthesis' && analysis.identitySynthesis && (
                <div className="space-y-6">
                  <div className={`p-6 ${cardStyles.hero}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <MirrorIcon size="lg" className="text-[var(--accent)]" />
                      <h3 className={`font-display font-semibold text-lg ${textStyles.primary}`}>{t('synthesisTab.whoYouAre')}</h3>
                    </div>
                    <p className={`font-body ${textStyles.secondary} leading-relaxed`}>{analysis.identitySynthesis.currentIdentityCore}</p>
                  </div>

                  {analysis.identitySynthesis.hiddenStrengths?.length > 0 && (
                    <div className={`p-5 ${cardStyles.base}`}>
                      <h4 className={`font-display font-semibold ${textStyles.primary} mb-3 flex items-center gap-2`}>
                        <LightningBoltIcon size="md" className="text-[var(--accent)]" />
                        {t('synthesisTab.hiddenStrengths')}
                      </h4>
                      <ul className="space-y-2">
                        {analysis.identitySynthesis.hiddenStrengths.map((s: string, i: number) => (
                          <li key={i} className={`flex items-start gap-2 font-body ${textStyles.secondary}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.identitySynthesis.keyTension && (
                    <div className={`p-5 ${cardStyles.base}`}>
                      <h4 className={`font-display font-semibold ${textStyles.primary} mb-3 flex items-center gap-2`}>
                        <SwitchHorizontalIcon size="md" className="text-[var(--accent)]" />
                        {t('synthesisTab.keyTension')}
                      </h4>
                      <p className={`font-body ${textStyles.secondary}`}>{analysis.identitySynthesis.keyTension}</p>
                    </div>
                  )}

                  {analysis.identitySynthesis.nextIdentityStep && (
                    <div className={`p-5 ${cardStyles.base}`}>
                      <h4 className={`font-display font-semibold ${textStyles.primary} mb-3 flex items-center gap-2`}>
                        <ArrowRightIcon size="md" className="text-[var(--accent)]" />
                        {t('synthesisTab.nextStep')}
                      </h4>
                      <p className={`font-body ${textStyles.secondary}`}>{analysis.identitySynthesis.nextIdentityStep}</p>
                      <p className={`font-body ${textStyles.muted} text-sm mt-3 italic`}>{t('synthesisTab.nextStepHelp')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Re-analyze button - hide in view-only mode */}
            {!isReadOnly && (
              <div className="mt-8 text-center">
                <button
                  onClick={analyzeWithClaude}
                  className="px-5 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-sm font-body font-medium hover:bg-[var(--bg-tertiary)] border border-[var(--border)] transition-colors inline-flex items-center gap-2"
                >
                  <RefreshIcon size="sm" />
                  <span>{t('reanalyze.button')}</span>
                </button>
                <p className="font-body text-[var(--text-muted)] text-sm mt-2">{t('reanalyze.description')}</p>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default IdentityInsightsAI;
