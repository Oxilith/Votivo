/**
 * @file src/App.tsx
 * @purpose Root application component with Zustand state management
 * @functionality
 * - Uses Zustand stores for state management
 * - Coordinates view transitions between assessment and insights
 * - Provides persistent header with navigation and data management
 * - Provides theme context to component tree for dark/light mode
 * @dependencies
 * - React (useCallback)
 * - @/stores (useAssessmentStore, useUIStore, useAnalysisStore)
 * - @/components/assessment/IdentityFoundationsAssessment
 * - @/components/insights/IdentityInsightsAI
 * - @/components/shared/Header
 * - @/types/assessment.types
 * - @/utils/fileUtils
 * - @/components/providers/ThemeProvider
 */

import { useCallback } from 'react';
import IdentityFoundationsAssessment from '@/components/assessment/IdentityFoundationsAssessment';
import IdentityInsightsAI from '@/components/insights/IdentityInsightsAI';
import Header from '@/components/shared/Header';
import type { AssessmentResponses } from '@/types/assessment.types';
import { exportToJson } from '@/utils/fileUtils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useAssessmentStore, useUIStore, useAnalysisStore } from '@/stores';

function App() {
  // Zustand stores
  const { responses, setResponses } = useAssessmentStore();
  const { currentView, setView, assessmentKey, incrementAssessmentKey, startAtSynthesis, setStartAtSynthesis } = useUIStore();
  const { analysis, exportAnalysisToJson } = useAnalysisStore();

  const handleAssessmentComplete = useCallback(
    (completedResponses: AssessmentResponses) => {
      setResponses(completedResponses);
      setView('insights');
    },
    [setResponses, setView]
  );

  const handleImportResponses = useCallback(
    (imported: AssessmentResponses) => {
      setResponses(imported);
      setStartAtSynthesis(true);
      incrementAssessmentKey();
    },
    [setResponses, setStartAtSynthesis, incrementAssessmentKey]
  );

  const handleExportResponses = useCallback(() => {
    if (Object.keys(responses).length > 0) {
      exportToJson(responses as AssessmentResponses);
    }
  }, [responses]);

  const handleBackToAssessment = useCallback(() => {
    setView('assessment');
  }, [setView]);

  const hasResponses = Object.keys(responses).length > 0;
  const hasAnalysis = !!analysis;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header
          currentView={currentView}
          hasResponses={hasResponses}
          onImport={handleImportResponses}
          onExport={handleExportResponses}
          onExportAnalysis={hasAnalysis ? exportAnalysisToJson : undefined}
          hasAnalysis={hasAnalysis}
        />

        {currentView === 'assessment' ? (
          <IdentityFoundationsAssessment
            key={assessmentKey}
            initialResponses={responses}
            onComplete={handleAssessmentComplete}
            startAtSynthesis={startAtSynthesis}
          />
        ) : (
          <IdentityInsightsAI
            responses={responses as AssessmentResponses}
            onBack={handleBackToAssessment}
            onExport={handleExportResponses}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
