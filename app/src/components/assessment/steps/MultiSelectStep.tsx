/**
 * @file app/src/components/assessment/steps/MultiSelectStep.tsx
 * @purpose Renders multi-select checkbox question with Ink & Stone styling
 * @functionality
 * - Displays question with optional context
 * - Renders selectable option cards with vermilion checkboxes
 * - Manages multi-selection state
 * - Supports option descriptions
 * @dependencies
 * - React
 * - @/components (CheckIcon - icon component)
 * - @/components types (MultiSelectStep, SelectOption)
 */

import { CheckIcon } from '@/components';
import type { MultiSelectStep as MultiSelectStepType, SelectOption } from '@/components';
import React from "react";

interface MultiSelectStepProps {
  step: MultiSelectStepType;
  value: string[];
  onChange: (value: string[]) => void;
  isReadOnly?: boolean;
}

export const MultiSelectStep: React.FC<MultiSelectStepProps> = ({ step, value, onChange, isReadOnly = false }) => {
  const selected = value;

  const toggleOption = (optionId: string) => {
    if (isReadOnly) return;
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  return (
    <div className="space-y-4" data-testid="multi-select-step">
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
      <div
        className="grid gap-2"
        role="group"
        aria-labelledby={`question-${step.id}`}
      >
        {step.options.map((option: SelectOption) => (
          <button
            key={option.id}
            role="checkbox"
            aria-checked={selected.includes(option.id)}
            onClick={() => { toggleOption(option.id); }}
            disabled={isReadOnly}
            data-testid={`multi-select-option-${option.id}`}
            className={`text-left p-4 border-2 rounded-sm transition-all ${
              selected.includes(option.id)
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50'
            } ${isReadOnly ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-sm flex items-center justify-center transition-all ${
                  selected.includes(option.id)
                    ? 'bg-[var(--accent)]'
                    : 'border-2 border-[var(--border)]'
                }`}
              >
                {selected.includes(option.id) && (
                  <CheckIcon size="xs" className="text-white" />
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
