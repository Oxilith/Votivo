/**
 * @file app/src/components/insights/IdentityInsightsAI.tsx
 * @purpose AI-powered analysis display with Ink & Stone styling (requires authentication)
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
 * - Auto-saves analysis via store action with error tracking
 * - Shows save error alert with retry option when save fails
 * - Blocks analysis when assessment has unsaved changes (dirty state)
 * @dependencies
 * - React (useState, useCallback, useRef, useEffect)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (InsightsProps)
 * - @/stores (useAnalysisStore, useAssessmentStore)
 * - @/stores/useAuthStore (useCurrentUser)
 * - @/services/api/AuthService
 * - @/styles/theme (cardStyles, textStyles)
 * - shared (UserProfileForAnalysis)
 * - @/components/landing/sections/FooterSection
 * - @/components/shared/PageNavigation
 * - @/components/shared/Alert
 * - @/components/insights/InsightsPageHeader
 * - @/components/shared/InkBrushDecoration
 * - @/components/shared/icons (ErrorCircleIcon, SearchIcon, etc.)
 * - @/utils/fileUtils
 * - ./InsightCard (InsightCard component)
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
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import { useAssessmentStore } from '@/stores/useAssessmentStore';
import { useCurrentUser } from '@/stores/useAuthStore';
import type { UserProfileForAnalysis } from '@votive/shared';
import { authService } from '@/services/api';
import { cardStyles, textStyles } from '@/styles';
import InsightCard from './InsightCard';
import {
  FooterSection,
  PageNavigation,
  InkBrushDecoration,
  InkLoader,
  Alert,
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
import { importFromJson, logger } from '@/utils';

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
    // Save status
    saveError,
    isSaving,
    saveAnalysis,
    clearSaveError,
  } = useAnalysisStore();

  // In view-only mode, use the viewOnlyAnalysis.result instead of store analysis
  const analysis = viewOnlyAnalysis?.result ?? storeAnalysis;

  // Auth state - insights page requires authentication (enforced by App.tsx)
  const currentUser = useCurrentUser();

  // Check if assessment is not yet completed (blocks analysis)
  const savedAt = useAssessmentStore((state) => state.savedAt);
  const isAssessmentIncomplete = savedAt === null;
  const prevAnalysisRef = useRef(storeAnalysis);

  // Auto-save analysis when it completes
  // Skip if read-only (viewing a saved analysis) to prevent duplication
  useEffect(() => {
    // Only run when store analysis changes from null/undefined to a value
    if (storeAnalysis && storeAnalysis !== prevAnalysisRef.current && !loading && !isReadOnly) {
      prevAnalysisRef.current = storeAnalysis;

      // Link analysis to assessment: use viewingAssessmentId if set, otherwise get most recent
      const saveAnalysisAsync = async () => {
        let assessmentIdToLink = viewingAssessmentId ?? undefined;

        // If no viewingAssessmentId, get the most recent assessment to link to
        if (!assessmentIdToLink) {
          try {
            const assessments = await authService.getAssessments();
            if (Array.isArray(assessments) && assessments.length > 0) {
              const sorted = [...assessments].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              assessmentIdToLink = sorted[0].id;
            }
          } catch (error) {
            // If fetching assessments fails, proceed without linking
            // Log for debugging purposes
            logger.debug('Failed to fetch assessments for analysis linking', { error });
          }
        }

        // Use store action to save with error tracking
        void saveAnalysis(storeAnalysis, assessmentIdToLink);
      };
      void saveAnalysisAsync();
    }
  }, [storeAnalysis, loading, isReadOnly, viewingAssessmentId, saveAnalysis]);

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

  const handleExportAnalysisClick = () => {
    onExportAnalysis?.();
  };

  const hasResponses = Object.keys(responses).length > 0;

  const analyzeWithClaudeAsync = useCallback(async () => {
    const language = i18n.language === 'pl' ? 'polish' : 'english';

    // Build user profile for demographic context
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

  const analyzeWithClaude = useCallback(() => {
    void analyzeWithClaudeAsync();
  }, [analyzeWithClaudeAsync]);

  // Handler for retrying save when it fails
  const handleRetrySave = useCallback(() => {
    if (!storeAnalysis) return;
    void saveAnalysis(storeAnalysis, viewingAssessmentId ?? undefined);
  }, [storeAnalysis, saveAnalysis, viewingAssessmentId]);

  const tabs: Tab[] = analysis
    ? [
        { id: 'patterns', label: t('tabs.patterns'), count: analysis.patterns.length, icon: <SearchIcon size="md" /> },
        { id: 'contradictions', label: t('tabs.contradictions'), count: analysis.contradictions.length, icon: <SwitchHorizontalIcon size="md" /> },
        { id: 'blindSpots', label: t('tabs.blindSpots'), count: analysis.blindSpots.length, icon: <EyeIcon size="md" /> },
        { id: 'leverage', label: t('tabs.leverage'), count: analysis.leveragePoints.length, icon: <TargetIcon size="md" /> },
        { id: 'risks', label: t('tabs.risks'), count: analysis.risks.length, icon: <AlertTriangleIcon size="md" /> },
        { id: 'synthesis', label: t('tabs.synthesis'), count: null, icon: <MirrorIcon size="md" /> },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative" data-testid="insights-page">
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

      {/* Page Navigation - export is handled by InsightsPageHeader */}
      <PageNavigation
        currentPage="insights"
        onNavigateToLanding={onNavigateToLanding}
        onNavigateToAssessment={onNavigateToAssessment}
        onNavigateToInsights={undefined} // Already on insights
        onNavigateToAuth={onNavigateToAuth}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />

      {/* Page Header - always visible */}
      <InsightsPageHeader
        isReadOnly={isReadOnly}
        createdAt={viewOnlyAnalysis?.createdAt}
        onExportAnalysis={hasAnalysis ? handleExportAnalysisClick : undefined}
        onExportAssessment={hasResponses ? handleExportClick : undefined}
      />

      {/* Import error message */}
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

      {/* Content with top padding to clear nav + header */}
      <div className="flex-1 pt-32 lg:pt-36">
        <div className="max-w-6xl mx-auto px-6 py-8">
        {/* No assessment data - prompt user to complete assessment first */}
        {!hasResponses && !loading && !error && (
          <div className="text-center py-16" data-testid="insights-no-assessment">
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
              data-testid="insights-btn-start-assessment"
              className="cta-button px-6 py-3 bg-[var(--accent)] text-white font-body font-medium rounded-sm inline-flex items-center gap-2"
            >
              <span>{t('noAssessment.button')}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Ready for analysis - has assessment data but no analysis yet */}
        {hasResponses && !analysis && !loading && !error && (
          <div className="text-center py-16" data-testid="insights-ready">
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

            {/* Show warning alert when assessment is not completed */}
            {isAssessmentIncomplete && onNavigateToAssessment ? (
              <div className="max-w-lg mx-auto" data-testid="insights-incomplete-warning">
                <Alert.Warning
                  title={t('dirty.title', 'Assessment Incomplete')}
                  description={t('dirty.message')}
                  data-testid="insights-pending-changes-alert"
                >
                  <Alert.Actions>
                    <Alert.Action onClick={onNavigateToAssessment} data-testid="insights-pending-changes-alert-action">
                      {t('dirty.action')}
                    </Alert.Action>
                  </Alert.Actions>
                </Alert.Warning>
              </div>
            ) : isAssessmentIncomplete ? null : (
              <button
                onClick={analyzeWithClaude}
                className="cta-button px-6 py-3 bg-[var(--accent)] text-white font-body font-medium rounded-sm inline-flex items-center gap-2"
                data-testid="insights-btn-analyze"
              >
                <span>{t('ready.button')}</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}

        {loading && (
          <InkLoader
            variant="contained"
            message={t('loading.title')}
            description={t('loading.description')}
          />
        )}

        {error && (
          <div className="text-center py-16" data-testid="insights-error">
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
                  data-testid="insights-btn-download-raw"
                  className="px-4 py-2.5 text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 font-body font-medium rounded-sm transition-colors"
                >
                  {t('error.downloadRaw')}
                </button>
              )}
              <button
                onClick={analyzeWithClaude}
                data-testid="insights-btn-try-again"
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
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-sm mb-6 overflow-hidden" data-testid="insights-tabs">
              <div className="flex overflow-x-auto" role="tablist" aria-label="Analysis categories">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); }}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`insights-tabpanel-${tab.id}`}
                    data-testid={`insights-tab-${tab.id}`}
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

            {/* Save error alert - shown when analysis save fails */}
            {!isReadOnly && saveError && (
              <div className="mb-6">
                <Alert.Warning
                  title={t('saveError.title')}
                  description={t('saveError.message')}
                  note={saveError}
                  onDismiss={clearSaveError}
                  data-testid="analysis-save-error-alert"
                >
                  <Alert.Actions>
                    <Alert.Action
                      onClick={handleRetrySave}
                      loading={isSaving}
                      data-testid="analysis-save-error-alert-retry"
                    >
                      {t('saveError.retry')}
                    </Alert.Action>
                  </Alert.Actions>
                </Alert.Warning>
              </div>
            )}

            {/* Content */}
            <div
              className="space-y-4"
              role="tabpanel"
              id={`insights-tabpanel-${activeTab}`}
              aria-labelledby={`insights-tab-${activeTab}`}
              data-testid={`insights-tabpanel-${activeTab}`}
            >
              {activeTab === 'patterns' && analysis.patterns.map((item: AnalysisPattern, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'contradictions' && analysis.contradictions.map((item: AnalysisContradiction, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'blindSpots' && analysis.blindSpots.map((item: AnalysisBlindSpot, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'leverage' && analysis.leveragePoints.map((item: AnalysisLeveragePoint, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'risks' && analysis.risks.map((item: AnalysisRisk, i: number) => <InsightCard key={i} item={item} />)}

              {activeTab === 'synthesis' && (
                <div className="space-y-6">
                  <div className={`p-6 ${cardStyles.hero}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <MirrorIcon size="lg" className="text-[var(--accent)]" />
                      <h3 className={`font-display font-semibold text-lg ${textStyles.primary}`}>{t('synthesisTab.whoYouAre')}</h3>
                    </div>
                    <p className={`font-body ${textStyles.secondary} leading-relaxed`}>{analysis.identitySynthesis.currentIdentityCore}</p>
                  </div>

                  {analysis.identitySynthesis.hiddenStrengths.length > 0 && (
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

            {/* Re-analyze button - hide in view-only mode, show warning when incomplete */}
            {!isReadOnly && (
              <div className="mt-8 text-center">
                {isAssessmentIncomplete && onNavigateToAssessment ? (
                  <div className="max-w-lg mx-auto" data-testid="insights-reanalyze-incomplete-warning">
                    <Alert.Warning
                      title={t('dirty.title', 'Assessment Incomplete')}
                      description={t('dirty.message')}
                      data-testid="insights-reanalyze-pending-changes-alert"
                    >
                      <Alert.Actions>
                        <Alert.Action onClick={onNavigateToAssessment} data-testid="insights-reanalyze-pending-changes-alert-action">
                          {t('dirty.action')}
                        </Alert.Action>
                      </Alert.Actions>
                    </Alert.Warning>
                  </div>
                ) : isAssessmentIncomplete ? null : (
                  <>
                    <button
                      onClick={analyzeWithClaude}
                      className="px-5 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-sm font-body font-medium hover:bg-[var(--bg-tertiary)] border border-[var(--border)] transition-colors inline-flex items-center gap-2"
                      data-testid="insights-btn-reanalyze"
                    >
                      <RefreshIcon size="sm" />
                      <span>{t('reanalyze.button')}</span>
                    </button>
                    <p className="font-body text-[var(--text-muted)] text-sm mt-2">{t('reanalyze.description')}</p>
                  </>
                )}
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
