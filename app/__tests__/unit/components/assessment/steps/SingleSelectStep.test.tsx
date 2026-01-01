/**
 * @file app/__tests__/unit/components/assessment/steps/SingleSelectStep.test.tsx
 * @purpose Unit tests for SingleSelectStep component
 * @functionality
 * - Tests rendering question, context, and options
 * - Tests option selection
 * - Tests read-only mode
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - SingleSelectStep under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleSelectStep } from '@/components/assessment/steps/SingleSelectStep';
import type { SingleSelectStep as SingleSelectStepType } from '@/components/assessment/types';

describe('SingleSelectStep', () => {
  const mockStep: SingleSelectStepType = {
    type: 'singleSelect',
    id: 'test-single',
    question: 'Choose your preference',
    context: 'Select one option',
    options: [
      { id: 'opt1', label: 'Option 1', description: 'First choice' },
      { id: 'opt2', label: 'Option 2' },
      { id: 'opt3', label: 'Option 3', description: 'Third choice' },
    ],
  };

  it('should render the question', () => {
    render(<SingleSelectStep step={mockStep} value={undefined} onChange={() => {}} />);
    expect(screen.getByText('Choose your preference')).toBeInTheDocument();
  });

  it('should render the context when provided', () => {
    render(<SingleSelectStep step={mockStep} value={undefined} onChange={() => {}} />);
    expect(screen.getByText('Select one option')).toBeInTheDocument();
  });

  it('should not render context when not provided', () => {
    const stepWithoutContext = { ...mockStep, context: undefined };
    render(<SingleSelectStep step={stepWithoutContext} value={undefined} onChange={() => {}} />);
    expect(screen.queryByText('Select one option')).not.toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<SingleSelectStep step={mockStep} value={undefined} onChange={() => {}} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render option descriptions when provided', () => {
    render(<SingleSelectStep step={mockStep} value={undefined} onChange={() => {}} />);
    expect(screen.getByText('First choice')).toBeInTheDocument();
    expect(screen.getByText('Third choice')).toBeInTheDocument();
  });

  it('should call onChange when an option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SingleSelectStep step={mockStep} value={undefined} onChange={onChange} />);
    await user.click(screen.getByText('Option 2'));

    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('should highlight the selected option', () => {
    render(<SingleSelectStep step={mockStep} value="opt1" onChange={() => {}} />);
    const button = screen.getByText('Option 1').closest('button');
    expect(button).toHaveClass('border-[var(--accent)]');
  });

  it('should show radio indicator for selected option', () => {
    const { container } = render(
      <SingleSelectStep step={mockStep} value="opt1" onChange={() => {}} />
    );
    // The selected option has a filled radio (white dot inside vermilion circle)
    const radioFill = container.querySelector('.bg-white.rounded-full');
    expect(radioFill).toBeInTheDocument();
  });

  it('should allow changing selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SingleSelectStep step={mockStep} value="opt1" onChange={onChange} />);
    await user.click(screen.getByText('Option 3'));

    expect(onChange).toHaveBeenCalledWith('opt3');
  });

  it('should not allow selection in read-only mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SingleSelectStep step={mockStep} value="opt1" onChange={onChange} isReadOnly />);
    await user.click(screen.getByText('Option 2'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should disable buttons in read-only mode', () => {
    render(<SingleSelectStep step={mockStep} value="opt1" onChange={() => {}} isReadOnly />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should apply read-only styling', () => {
    render(<SingleSelectStep step={mockStep} value="opt1" onChange={() => {}} isReadOnly />);
    const button = screen.getByText('Option 1').closest('button');
    expect(button).toHaveClass('cursor-not-allowed');
    expect(button).toHaveClass('opacity-75');
  });
});
