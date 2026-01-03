/**
 * @file app/__tests__/unit/components/assessment/steps/IntroStep.test.tsx
 * @purpose Unit tests for IntroStep component
 * @functionality
 * - Tests rendering of heading, subheading, description
 * - Tests continue button functionality
 * - Tests back button visibility
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - IntroStep under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntroStep } from '@/components/assessment/steps/IntroStep';
import type { IntroContent } from '@/components/assessment/types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('IntroStep', () => {
  const mockContent: IntroContent = {
    heading: 'Welcome to the Assessment',
    subheading: 'Start your journey',
    description: 'This is the first paragraph.\n\nThis is the second paragraph.',
    buttonText: 'Continue',
  };

  const defaultProps = {
    content: mockContent,
    onNext: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render heading', () => {
    render(<IntroStep {...defaultProps} />);
    expect(screen.getByText('Welcome to the Assessment')).toBeInTheDocument();
  });

  it('should render subheading', () => {
    render(<IntroStep {...defaultProps} />);
    expect(screen.getByText('Start your journey')).toBeInTheDocument();
  });

  it('should render description paragraphs', () => {
    render(<IntroStep {...defaultProps} />);
    expect(screen.getByText('This is the first paragraph.')).toBeInTheDocument();
    expect(screen.getByText('This is the second paragraph.')).toBeInTheDocument();
  });

  it('should render continue button with custom text', () => {
    render(<IntroStep {...defaultProps} />);
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('should call onNext when continue is clicked', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(<IntroStep {...defaultProps} onNext={onNext} />);
    await user.click(screen.getByTestId('assessment-continue-button'));

    expect(onNext).toHaveBeenCalled();
  });

  it('should not show back button on first step', () => {
    render(<IntroStep {...defaultProps} isFirstStep />);
    expect(screen.queryByText('navigation.back')).not.toBeInTheDocument();
  });

  it('should show back button when not first step and onBack provided', () => {
    const onBack = vi.fn();
    render(<IntroStep {...defaultProps} isFirstStep={false} onBack={onBack} />);
    expect(screen.getByText('navigation.back')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<IntroStep {...defaultProps} isFirstStep={false} onBack={onBack} />);
    await user.click(screen.getByTestId('assessment-back-button'));

    expect(onBack).toHaveBeenCalled();
  });

  it('should not show back button when onBack is not provided', () => {
    render(<IntroStep {...defaultProps} isFirstStep={false} />);
    expect(screen.queryByText('navigation.back')).not.toBeInTheDocument();
  });
});
