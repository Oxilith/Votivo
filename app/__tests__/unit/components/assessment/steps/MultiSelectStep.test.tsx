/**
 * @file app/__tests__/unit/components/assessment/steps/MultiSelectStep.test.tsx
 * @purpose Unit tests for MultiSelectStep component
 * @functionality
 * - Tests rendering options with labels
 * - Tests option selection/deselection
 * - Tests read-only mode
 * - Tests context display
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - MultiSelectStep under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectStep } from '@/components/assessment/steps/MultiSelectStep';
import type { MultiSelectStep as MultiSelectStepType } from '@/components/assessment/types';

// Mock CheckIcon
vi.mock('@/components', () => ({
  CheckIcon: () => <span data-testid="check-icon" />,
}));

describe('MultiSelectStep', () => {
  const mockStep: MultiSelectStepType = {
    type: 'multiSelect',
    id: 'test-question',
    question: 'Select your options',
    context: 'Choose all that apply',
    options: [
      { id: 'opt1', label: 'Option 1', description: 'First option' },
      { id: 'opt2', label: 'Option 2' },
      { id: 'opt3', label: 'Option 3', description: 'Third option' },
    ],
  };

  it('should render the question', () => {
    render(<MultiSelectStep step={mockStep} value={[]} onChange={() => {}} />);
    expect(screen.getByText('Select your options')).toBeInTheDocument();
  });

  it('should render the context when provided', () => {
    render(<MultiSelectStep step={mockStep} value={[]} onChange={() => {}} />);
    expect(screen.getByText('Choose all that apply')).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<MultiSelectStep step={mockStep} value={[]} onChange={() => {}} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render option descriptions when provided', () => {
    render(<MultiSelectStep step={mockStep} value={[]} onChange={() => {}} />);
    expect(screen.getByText('First option')).toBeInTheDocument();
    expect(screen.getByText('Third option')).toBeInTheDocument();
  });

  it('should show check icon for selected options', () => {
    render(<MultiSelectStep step={mockStep} value={['opt1', 'opt3']} onChange={() => {}} />);
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons).toHaveLength(2);
  });

  it('should select an option when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelectStep step={mockStep} value={[]} onChange={onChange} />);
    await user.click(screen.getByText('Option 1'));

    expect(onChange).toHaveBeenCalledWith(['opt1']);
  });

  it('should deselect an option when clicked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelectStep step={mockStep} value={['opt1']} onChange={onChange} />);
    await user.click(screen.getByText('Option 1'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should allow multiple selections', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelectStep step={mockStep} value={['opt1']} onChange={onChange} />);
    await user.click(screen.getByText('Option 2'));

    expect(onChange).toHaveBeenCalledWith(['opt1', 'opt2']);
  });

  it('should not allow selection in read-only mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelectStep step={mockStep} value={[]} onChange={onChange} isReadOnly />);
    await user.click(screen.getByText('Option 1'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
