/**
 * @file app/__tests__/unit/components/assessment/steps/ScaleStep.test.tsx
 * @purpose Unit tests for ScaleStep component
 * @functionality
 * - Tests rendering question, context, and labels
 * - Tests scale button selection
 * - Tests read-only mode
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - ScaleStep under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScaleStep } from '@/components/assessment/steps/ScaleStep';
import type { ScaleStep as ScaleStepType } from '@/components/assessment/types';

describe('ScaleStep', () => {
  const mockStep: ScaleStepType = {
    type: 'scale',
    id: 'test-scale',
    question: 'Rate your energy level',
    context: 'On a scale of 1-5',
    lowLabel: 'Very low',
    highLabel: 'Very high',
    min: 1,
    max: 5,
  };

  it('should render the question', () => {
    render(<ScaleStep step={mockStep} value={0} onChange={() => {}} />);
    expect(screen.getByText('Rate your energy level')).toBeInTheDocument();
  });

  it('should render the context when provided', () => {
    render(<ScaleStep step={mockStep} value={0} onChange={() => {}} />);
    expect(screen.getByText('On a scale of 1-5')).toBeInTheDocument();
  });

  it('should not render context when not provided', () => {
    const stepWithoutContext = { ...mockStep, context: undefined };
    render(<ScaleStep step={stepWithoutContext} value={0} onChange={() => {}} />);
    expect(screen.queryByText('On a scale of 1-5')).not.toBeInTheDocument();
  });

  it('should render low and high labels', () => {
    render(<ScaleStep step={mockStep} value={0} onChange={() => {}} />);
    expect(screen.getByText('Very low')).toBeInTheDocument();
    expect(screen.getByText('Very high')).toBeInTheDocument();
  });

  it('should render all 5 scale options', () => {
    render(<ScaleStep step={mockStep} value={0} onChange={() => {}} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('radio', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('should call onChange when a scale option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ScaleStep step={mockStep} value={0} onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: '3' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('should highlight the selected value', () => {
    render(<ScaleStep step={mockStep} value={4} onChange={() => {}} />);
    const option4 = screen.getByRole('radio', { name: '4' });
    expect(option4).toHaveClass('bg-[var(--accent)]');
  });

  it('should not highlight unselected values', () => {
    render(<ScaleStep step={mockStep} value={4} onChange={() => {}} />);
    const option3 = screen.getByRole('radio', { name: '3' });
    expect(option3).not.toHaveClass('bg-[var(--accent)]');
  });

  it('should not allow selection in read-only mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ScaleStep step={mockStep} value={2} onChange={onChange} isReadOnly />);
    await user.click(screen.getByRole('radio', { name: '4' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should disable options in read-only mode', () => {
    render(<ScaleStep step={mockStep} value={2} onChange={() => {}} isReadOnly />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('radio', { name: String(i) })).toBeDisabled();
    }
  });

  it('should apply read-only styling', () => {
    render(<ScaleStep step={mockStep} value={2} onChange={() => {}} isReadOnly />);
    const option = screen.getByRole('radio', { name: '1' });
    expect(option).toHaveClass('cursor-not-allowed');
    expect(option).toHaveClass('opacity-75');
  });
});
