/**
 * @file src/components/insights/IdentityInsightsAI.tsx
 * @purpose AI-powered analysis of assessment responses using Claude API via backend proxy
 * @functionality
 * - Receives assessment responses as props
 * - Uses Zustand analysis store for state management
 * - Displays analysis results in tabbed interface (patterns, contradictions, blind spots, etc.)
 * - Shows identity synthesis with hidden strengths and next steps
 * - Provides re-analyze functionality for additional insights
 * - Includes loading states and error handling
 * - Supports dark mode theme switching
 * - Supports internationalization (English/Polish)
 * @dependencies
 * - React (useState, useCallback)
 * - react-i18next (useTranslation)
 * - @/types/assessment.types (InsightsProps)
 * - @/stores (useAnalysisStore)
 * - @/styles/theme (cardStyles, textStyles)
 * - ./InsightCard (InsightCard component)
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { InsightsProps } from '@/types/assessment.types';
import { useAnalysisStore } from '@/stores';
import { cardStyles, textStyles } from '@/styles/theme';
import InsightCard from './InsightCard';

interface Tab {
  id: string;
  label: string;
  count: number | null;
  icon: string;
}

const IdentityInsightsAI: React.FC<InsightsProps> = ({ responses }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('patterns');

  // Use Zustand analysis store
  const {
    analysis,
    rawResponse,
    isAnalyzing: loading,
    analysisError: error,
    analyze,
    downloadRawResponse,
  } = useAnalysisStore();

  const analyzeWithClaude = useCallback(async () => {
    const language = i18n.language === 'pl' ? 'polish' : 'english';
    await analyze(responses, language);
  }, [analyze, responses, i18n.language]);

  const tabs: Tab[] = analysis
    ? [
        { id: 'patterns', label: t('insights.tabs.patterns'), count: analysis.patterns?.length ?? 0, icon: '🔍' },
        { id: 'contradictions', label: t('insights.tabs.contradictions'), count: analysis.contradictions?.length ?? 0, icon: '🔀' },
        { id: 'blindSpots', label: t('insights.tabs.blindSpots'), count: analysis.blindSpots?.length ?? 0, icon: '👁️' },
        { id: 'leverage', label: t('insights.tabs.leverage'), count: analysis.leveragePoints?.length ?? 0, icon: '🎯' },
        { id: 'risks', label: t('insights.tabs.risks'), count: analysis.risks?.length ?? 0, icon: '⚠️' },
        { id: 'synthesis', label: t('insights.tabs.synthesis'), count: null, icon: '🪞' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!analysis && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[var(--color-violet)]/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔮</span>
            </div>
            <h2 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-2">{t('insights.ready.title')}</h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">{t('insights.ready.description')}</p>
            <button
              onClick={analyzeWithClaude}
              className="cta-button px-6 py-3 tech-gradient text-white font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <span>{t('insights.ready.button')}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[var(--color-violet)]/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-4xl">🧠</span>
            </div>
            <h2 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-2">{t('insights.loading.title')}</h2>
            <p className="text-[var(--text-secondary)]">{t('insights.loading.description')}</p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-[var(--color-violet)]  animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-2">{t('insights.error.title')}</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              {rawResponse && (
                <button
                  onClick={downloadRawResponse}
                  className="px-4 py-2.5 text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 font-medium transition-colors"
                >
                  {t('insights.error.downloadRaw')}
                </button>
              )}
              <button
                onClick={analyzeWithClaude}
                className="cta-button px-6 py-3 tech-gradient text-white font-medium hover:opacity-90 transition-opacity"
              >
                {t('insights.error.tryAgain')}
              </button>
            </div>
          </div>
        )}

        {analysis && (
          <>
            {/* Tabs */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-6 overflow-hidden">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-1 ${
                      activeTab === tab.id
                        ? 'border-[var(--color-violet)] text-[var(--color-violet)] bg-[var(--color-violet)]/10'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <span className="mr-1.5">{tab.icon}</span>
                    {tab.label}
                    {tab.count !== null && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 text-xs ${
                          activeTab === tab.id ? 'bg-[var(--color-violet)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
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
              {activeTab === 'patterns' && analysis.patterns?.map((item, i) => <InsightCard key={i} item={item} type="pattern" />)}

              {activeTab === 'contradictions' && analysis.contradictions?.map((item, i) => <InsightCard key={i} item={item} type="contradiction" />)}

              {activeTab === 'blindSpots' && analysis.blindSpots?.map((item, i) => <InsightCard key={i} item={item} type="blindSpot" />)}

              {activeTab === 'leverage' && analysis.leveragePoints?.map((item, i) => <InsightCard key={i} item={{ ...item, icon: '🎯' }} type="leverage" />)}

              {activeTab === 'risks' && analysis.risks?.map((item, i) => <InsightCard key={i} item={{ ...item, icon: '⚠️' }} type="risk" />)}

              {activeTab === 'synthesis' && analysis.identitySynthesis && (
                <div className="space-y-6">
                  <div className={`p-6 ${cardStyles.hero} ${textStyles.primary}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🪞</span>
                      <h3 className="font-semibold text-lg">{t('insights.synthesisTab.whoYouAre')}</h3>
                    </div>
                    <p className={`${textStyles.secondary} leading-relaxed`}>{analysis.identitySynthesis.currentIdentityCore}</p>
                  </div>

                  {analysis.identitySynthesis.hiddenStrengths?.length > 0 && (
                    <div className={`p-5 ${cardStyles.base}`}>
                      <h4 className={`font-semibold ${textStyles.primary} mb-3 flex items-center gap-2`}>
                        <span>💪</span> {t('insights.synthesisTab.hiddenStrengths')}
                      </h4>
                      <ul className="space-y-2">
                        {analysis.identitySynthesis.hiddenStrengths.map((s, i) => (
                          <li key={i} className={`flex items-start gap-2 ${textStyles.secondary}`}>
                            <span className={textStyles.subtle}>•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.identitySynthesis.keyTension && (
                    <div className={`p-5 ${cardStyles.base}`}>
                      <h4 className={`font-semibold ${textStyles.primary} mb-3 flex items-center gap-2`}>
                        <span>⚡</span> {t('insights.synthesisTab.keyTension')}
                      </h4>
                      <p className={textStyles.secondary}>{analysis.identitySynthesis.keyTension}</p>
                    </div>
                  )}

                  {analysis.identitySynthesis.nextIdentityStep && (
                    <div className={`p-5 ${cardStyles.base}`}>
                      <h4 className={`font-semibold ${textStyles.primary} mb-3 flex items-center gap-2`}>
                        <span>🚀</span> {t('insights.synthesisTab.nextStep')}
                      </h4>
                      <p className={textStyles.secondary}>{analysis.identitySynthesis.nextIdentityStep}</p>
                      <p className={`${textStyles.muted} text-sm mt-3 italic`}>{t('insights.synthesisTab.nextStepHelp')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Re-analyze button */}
            <div className="mt-8 text-center">
              <button
                onClick={analyzeWithClaude}
                className="px-5 py-2.5 bg-[var(--bg-card)] text-[var(--text-secondary)]  font-medium hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] transition-colors inline-flex items-center gap-2"
              >
                <span>🔄</span>
                <span>{t('insights.reanalyze.button')}</span>
              </button>
              <p className="text-[var(--text-muted)] text-sm mt-2">{t('insights.reanalyze.description')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IdentityInsightsAI;
