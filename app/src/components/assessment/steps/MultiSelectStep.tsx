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
 * - @/components/shared/icons (CheckIcon)
 */

import { CheckIcon } from '@/components/shared/icons';
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
        <h3 className="font-serif text-xl font-medium text-[var(--text-primary)] mb-2">
          {step.question}
        </h3>
        {step.context && (
          <p className="text-[var(--text-secondary)] text-sm">{step.context}</p>
        )}
      </div>
      <div className="grid gap-2">
        {step.options.map((option: SelectOption) => (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`text-left p-4 border-2 transition-all ${
              selected.includes(option.id)
                ? 'border-[var(--color-electric)] bg-[var(--color-electric)]/10'
                : 'border-[var(--border-subtle)] hover:border-[var(--color-electric)]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 flex items-center justify-center transition-all ${
                  selected.includes(option.id)
                    ? 'tech-gradient'
                    : 'border-2 border-[var(--border-subtle)]'
                }`}
              >
                {selected.includes(option.id) && (
                  <CheckIcon size="sm" className="!w-3 !h-3 text-white" />
                )}
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-sm text-[var(--text-muted)]">
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
