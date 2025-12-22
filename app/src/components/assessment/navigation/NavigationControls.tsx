/**
 * @file components/assessment/navigation/NavigationControls.tsx
 * @purpose Back and Continue navigation buttons for assessment
 * @functionality
 * - Renders back button (disabled on first step)
 * - Renders continue button for progression
 * - Sticky positioning at bottom of viewport
 * - Supports dark mode styling
 * @dependencies
 * - React
 * - react-i18next (useTranslation)
 */

import { useTranslation } from 'react-i18next';

interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  showNavigation: boolean;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  onNext,
  isFirstStep,
  showNavigation,
}) => {
  const { t } = useTranslation();

  if (!showNavigation) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
        <button
          onClick={onBack}
          disabled={isFirstStep}
          className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
            isFirstStep
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {t('assessment.navigation.back')}
        </button>
        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          {t('assessment.navigation.continue')}
        </button>
      </div>
    </div>
  );
};
