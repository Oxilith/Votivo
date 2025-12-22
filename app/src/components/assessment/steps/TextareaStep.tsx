/**
 * @file components/assessment/steps/TextareaStep.tsx
 * @purpose Renders free-text input question step
 * @functionality
 * - Displays question with optional context
 * - Provides resizable textarea input
 * - Supports placeholder text and custom row count
 * @dependencies
 * - React
 * - @/components/assessment/types (TextareaStep)
 */

import type { TextareaStep as TextareaStepType } from '../types';

interface TextareaStepProps {
  step: TextareaStepType;
  value: string;
  onChange: (value: string) => void;
}

export const TextareaStep: React.FC<TextareaStepProps> = ({ step, value, onChange }) => {
  const currentValue = value ?? '';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          {step.question}
        </h3>
        {step.context && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{step.context}</p>
        )}
      </div>
      <textarea
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        rows={step.rows ?? 5}
        className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-gray-900 dark:focus:border-white focus:outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800"
      />
    </div>
  );
};
