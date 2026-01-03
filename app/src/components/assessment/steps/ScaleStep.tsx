/**
 * @file app/src/components/assessment/steps/ScaleStep.tsx
 * @purpose Renders 1-5 scale rating question with Ink & Stone styling
 * @functionality
 * - Displays question with optional context
 * - Shows low and high labels for scale ends
 * - Renders clickable vermilion scale buttons (1-5)
 * - Highlights selected value with vermilion background
 * @dependencies
 * - React
 * - @/components types (ScaleStep - type definition)
 */

import type { ScaleStep as ScaleStepType } from '@/components';
import React from "react";

interface ScaleStepProps {
  step: ScaleStepType;
  value: number;
  onChange: (value: number) => void;
  isReadOnly?: boolean;
}

export const ScaleStep: React.FC<ScaleStepProps> = ({ step, value, onChange, isReadOnly = false }) => {
  const currentValue = value;

  const handleClick = (num: number) => {
    if (isReadOnly) return;
    onChange(num);
  };

  return (
    <div className="space-y-6" data-testid="scale-step">
      <div>
        <h3
          id={`question-${step.id}`}
          className="font-display text-xl font-medium text-[var(--text-primary)] mb-2"
        >
          {step.question}
        </h3>
        {step.context && (
          <p className="font-body text-[var(--text-secondary)] text-sm">{step.context}</p>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex justify-between font-body text-sm text-[var(--text-muted)]">
          <span className="max-w-32">{step.lowLabel}</span>
          <span className="max-w-32 text-right">{step.highLabel}</span>
        </div>
        <div
          className="flex gap-2 justify-center"
          role="radiogroup"
          aria-labelledby={`question-${step.id}`}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              role="radio"
              aria-checked={currentValue === num}
              onClick={() => { handleClick(num); }}
              disabled={isReadOnly}
              data-testid="scale-option"
              className={`w-14 h-14 border-2 rounded-sm text-lg font-display font-medium transition-all ${
                currentValue === num
                  ? 'bg-[var(--accent)] text-white border-transparent'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50 text-[var(--text-secondary)]'
              } ${isReadOnly ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
