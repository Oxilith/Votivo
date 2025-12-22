/**
 * @file src/App.tsx
 * @purpose Root application component managing view state, assessment responses, theme, and i18n
 * @functionality
 * - Manages application view state (assessment vs insights)
 * - Lifts assessment responses state for sharing between components
 * - Handles transitions between questionnaire and insights views
 * - Coordinates import/export functionality
 * - Provides persistent header with navigation and data management
 * - Navigates to synthesis page on import/load sample data
 * - Provides theme context to component tree for dark/light mode
 * @dependencies
 * - React (useState, useCallback)
 * - @/components/assessment/IdentityFoundationsAssessment
 * - @/components/insights/IdentityInsightsAI
 * - @/components/shared/Header
 * - @/types/assessment.types
 * - @/utils/fileUtils
 * - @/data/sampleResponses
 * - @/components/providers/ThemeProvider (ThemeProvider)
 */

import { useState, useCallback } from 'react';
import IdentityFoundationsAssessment from '@/components/assessment/IdentityFoundationsAssessment';
import IdentityInsightsAI from '@/components/insights/IdentityInsightsAI';
import Header from '@/components/shared/Header';
import type { AssessmentResponses, AppView } from '@/types/assessment.types';
import { exportToJson } from '@/utils/fileUtils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('assessment');
  const [responses, setResponses] = useState<Partial<AssessmentResponses>>({});
  const [assessmentKey, setAssessmentKey] = useState(0);
  const [startAtSynthesis, setStartAtSynthesis] = useState(false);
  const [analysisExportFn, setAnalysisExportFn] = useState<(() => void) | null>(null);

  const handleAssessmentComplete = useCallback((completedResponses: AssessmentResponses) => {
    setResponses(completedResponses);
    setCurrentView('insights');
  }, []);

  const handleImportResponses = useCallback((imported: AssessmentResponses) => {
    setResponses(imported);
    setStartAtSynthesis(true);
    setAssessmentKey((prev) => prev + 1); // Force remount with new initial state
  }, []);

  const handleExportResponses = useCallback(() => {
    if (Object.keys(responses).length > 0) {
      exportToJson(responses as AssessmentResponses);
    }
  }, [responses]);

  const handleBackToAssessment = useCallback(() => {
    setCurrentView('assessment');
    setAnalysisExportFn(null);
  }, []);

  const hasResponses = Object.keys(responses).length > 0;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header
          currentView={currentView}
          hasResponses={hasResponses}
          onImport={handleImportResponses}
          onExport={handleExportResponses}
          onExportAnalysis={analysisExportFn ?? undefined}
          hasAnalysis={!!analysisExportFn}
        />

        {currentView === 'assessment' ? (
          <IdentityFoundationsAssessment key={assessmentKey} initialResponses={responses} onComplete={handleAssessmentComplete} startAtSynthesis={startAtSynthesis} />
        ) : (
          <IdentityInsightsAI responses={responses as AssessmentResponses} onBack={handleBackToAssessment} onExport={handleExportResponses} onAnalysisReady={setAnalysisExportFn} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
