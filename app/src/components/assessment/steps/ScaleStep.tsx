/**
 * @file components/assessment/steps/ScaleStep.tsx
 * @purpose Renders 1-5 scale rating question step
 * @functionality
 * - Displays question with optional context
 * - Shows low and high labels for scale ends
 * - Renders clickable scale buttons (1-5)
 * - Highlights selected value
 * @dependencies
 * - React
 * - @/components/assessment/types (ScaleStep)
 */

import type { ScaleStep as ScaleStepType } from '../types';

interface ScaleStepProps {
  step: ScaleStepType;
  value: number;
  onChange: (value: number) => void;
}

export const ScaleStep: React.FC<ScaleStepProps> = ({ step, value, onChange }) => {
  const currentValue = value ?? 3;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          {step.question}
        </h3>
        {step.context && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{step.context}</p>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="max-w-32">{step.lowLabel}</span>
          <span className="max-w-32 text-right">{step.highLabel}</span>
        </div>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`w-14 h-14 rounded-lg border-2 text-lg font-medium transition-all ${
                currentValue === num
                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
