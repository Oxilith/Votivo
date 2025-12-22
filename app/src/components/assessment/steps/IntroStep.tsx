/**
 * @file components/assessment/steps/IntroStep.tsx
 * @purpose Renders introduction/welcome step content
 * @functionality
 * - Displays heading, subheading, and description
 * - Provides continue button to proceed to next step
 * - Supports multi-paragraph descriptions
 * @dependencies
 * - React
 * - @/components/assessment/types (IntroContent)
 */

import type { IntroContent } from '../types';

interface IntroStepProps {
  content: IntroContent;
  onNext: () => void;
}

export const IntroStep: React.FC<IntroStepProps> = ({ content, onNext }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {content.heading}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {content.subheading}
        </p>
      </div>
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {content.description.split('\n\n').map((para, i) => (
          <p key={i} className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>
      <button
        onClick={onNext}
        className="mt-4 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
      >
        {content.buttonText}
      </button>
    </div>
  );
};
