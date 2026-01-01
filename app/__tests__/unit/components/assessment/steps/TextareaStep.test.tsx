/**
 * @file app/__tests__/unit/components/assessment/steps/TextareaStep.test.tsx
 * @purpose Unit tests for TextareaStep component
 * @functionality
 * - Tests rendering question, context, and placeholder
 * - Tests text input handling
 * - Tests read-only mode
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - TextareaStep under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextareaStep } from '@/components/assessment/steps/TextareaStep';
import type { TextareaStep as TextareaStepType } from '@/components/assessment/types';

describe('TextareaStep', () => {
  const mockStep: TextareaStepType = {
    type: 'textarea',
    id: 'test-textarea',
    question: 'Describe your goals',
    context: 'Be as detailed as possible',
    placeholder: 'Enter your response...',
    rows: 6,
  };

  it('should render the question', () => {
    render(<TextareaStep step={mockStep} value="" onChange={() => {}} />);
    expect(screen.getByText('Describe your goals')).toBeInTheDocument();
  });

  it('should render the context when provided', () => {
    render(<TextareaStep step={mockStep} value="" onChange={() => {}} />);
    expect(screen.getByText('Be as detailed as possible')).toBeInTheDocument();
  });

  it('should not render context when not provided', () => {
    const stepWithoutContext = { ...mockStep, context: undefined };
    render(<TextareaStep step={stepWithoutContext} value="" onChange={() => {}} />);
    expect(screen.queryByText('Be as detailed as possible')).not.toBeInTheDocument();
  });

  it('should render textarea with placeholder', () => {
    render(<TextareaStep step={mockStep} value="" onChange={() => {}} />);
    const textarea = screen.getByPlaceholderText('Enter your response...');
    expect(textarea).toBeInTheDocument();
  });

  it('should render textarea with specified rows', () => {
    render(<TextareaStep step={mockStep} value="" onChange={() => {}} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '6');
  });

  it('should use default rows when not specified', () => {
    const stepWithoutRows = { ...mockStep, rows: undefined };
    render(<TextareaStep step={stepWithoutRows} value="" onChange={() => {}} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should display the current value', () => {
    render(<TextareaStep step={mockStep} value="My current response" onChange={() => {}} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('My current response');
  });

  it('should call onChange when text is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TextareaStep step={mockStep} value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'New text');

    // userEvent.type triggers onChange for each character
    expect(onChange).toHaveBeenCalledTimes(8); // 'New text' = 8 chars
  });

  it('should not allow input in read-only mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TextareaStep step={mockStep} value="Existing text" onChange={onChange} isReadOnly />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'More text');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should have readOnly attribute in read-only mode', () => {
    render(<TextareaStep step={mockStep} value="" onChange={() => {}} isReadOnly />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readOnly');
  });

  it('should apply read-only styling', () => {
    render(<TextareaStep step={mockStep} value="" onChange={() => {}} isReadOnly />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('cursor-not-allowed');
    expect(textarea).toHaveClass('opacity-75');
  });
});
