/**
 * @file components/assessment/steps/SingleSelectStep.tsx
 * @purpose Renders single-select radio button question step
 * @functionality
 * - Displays question with optional context
 * - Renders selectable option cards with radio buttons
 * - Manages single selection state
 * - Supports option descriptions
 * @dependencies
 * - React
 * - @/components/assessment/types (SingleSelectStep, SelectOption)
 */

import type { SingleSelectStep as SingleSelectStepType, SelectOption } from '../types';

interface SingleSelectStepProps {
  step: SingleSelectStepType;
  value: string | undefined;
  onChange: (value: string) => void;
}

export const SingleSelectStep: React.FC<SingleSelectStepProps> = ({ step, value, onChange }) => {
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
      <div className="grid gap-2">
        {step.options.map((option: SelectOption) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              value === option.id
                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  value === option.id
                    ? 'border-gray-900 dark:border-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {value === option.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-white" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
