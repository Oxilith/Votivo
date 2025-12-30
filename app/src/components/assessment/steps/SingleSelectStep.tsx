/**
 * @file components/assessment/steps/SingleSelectStep.tsx
 * @purpose Renders single-select radio button question with Ink & Stone styling
 * @functionality
 * - Displays question with optional context
 * - Renders selectable option cards with vermilion radio buttons
 * - Manages single selection state
 * - Supports option descriptions
 * @dependencies
 * - React
 * - @/components (SingleSelectStep, SelectOption)
 */

import type { SingleSelectStep as SingleSelectStepType, SelectOption } from '@/components';
import React from "react";

interface SingleSelectStepProps {
  step: SingleSelectStepType;
  value: string | undefined;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
}

export const SingleSelectStep: React.FC<SingleSelectStepProps> = ({ step, value, onChange, isReadOnly = false }) => {
  const handleClick = (optionId: string) => {
    if (isReadOnly) return;
    onChange(optionId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-medium text-[var(--text-primary)] mb-2">
          {step.question}
        </h3>
        {step.context && (
          <p className="font-body text-[var(--text-secondary)] text-sm">{step.context}</p>
        )}
      </div>
      <div className="grid gap-2">
        {step.options.map((option: SelectOption) => (
          <button
            key={option.id}
            onClick={() => handleClick(option.id)}
            disabled={isReadOnly}
            className={`text-left p-4 border-2 rounded-sm transition-all ${
              value === option.id
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50'
            } ${isReadOnly ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  value === option.id
                    ? 'bg-[var(--accent)]'
                    : 'border-2 border-[var(--border)]'
                }`}
              >
                {value === option.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div>
                <div className="font-body font-medium text-[var(--text-primary)]">
                  {option.label}
                </div>
                {option.description && (
                  <div className="font-body text-sm text-[var(--text-muted)]">
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
