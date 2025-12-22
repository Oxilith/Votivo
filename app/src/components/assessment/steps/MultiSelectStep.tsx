/**
 * @file components/assessment/steps/MultiSelectStep.tsx
 * @purpose Renders multi-select checkbox question step
 * @functionality
 * - Displays question with optional context
 * - Renders selectable option cards with checkboxes
 * - Manages multi-selection state
 * - Supports option descriptions
 * @dependencies
 * - React
 * - @/components/assessment/types (MultiSelectStep, SelectOption)
 */

import type { MultiSelectStep as MultiSelectStepType, SelectOption } from '../types';

interface MultiSelectStepProps {
  step: MultiSelectStepType;
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultiSelectStep: React.FC<MultiSelectStepProps> = ({ step, value, onChange }) => {
  const selected = value ?? [];

  const toggleOption = (optionId: string) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

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
            onClick={() => toggleOption(option.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selected.includes(option.id)
                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selected.includes(option.id)
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {selected.includes(option.id) && (
                  <svg
                    className="w-3 h-3 text-white dark:text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
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
