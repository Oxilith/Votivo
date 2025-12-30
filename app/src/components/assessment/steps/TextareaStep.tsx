/**
 * @file components/assessment/steps/TextareaStep.tsx
 * @purpose Renders free-text input question with Ink & Stone styling
 * @functionality
 * - Displays question with optional context
 * - Provides resizable textarea input with vermilion focus ring
 * - Supports placeholder text and custom row count
 * @dependencies
 * - React
 * - @/components (TextareaStep)
 */

import type { TextareaStep as TextareaStepType } from '@/components';
import React from "react";

interface TextareaStepProps {
  step: TextareaStepType;
  value: string;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
}

export const TextareaStep: React.FC<TextareaStepProps> = ({ step, value, onChange, isReadOnly = false }) => {
  const currentValue = value ?? '';

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
      <textarea
        value={currentValue}
        onChange={(e) => !isReadOnly && onChange(e.target.value)}
        placeholder={step.placeholder}
        rows={step.rows ?? 5}
        readOnly={isReadOnly}
        className={`w-full p-4 border-2 border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 resize-none font-body text-[var(--text-primary)] placeholder-[var(--text-muted)] bg-[var(--bg-primary)] transition-colors ${isReadOnly ? 'cursor-not-allowed opacity-75 bg-[var(--bg-secondary)]' : ''}`}
      />
    </div>
  );
};
