/**
 * @file app/__tests__/unit/components/assessment/navigation/NavigationControls.test.tsx
 * @purpose Unit tests for NavigationControls component
 * @functionality
 * - Tests back button rendering and state
 * - Tests continue button rendering
 * - Tests complete button for synthesis step
 * - Tests saving state
 * - Tests navigation not shown when showNavigation is false
 * - Tests validation error display and accessibility
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - NavigationControls under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationControls } from '@/components/assessment/navigation/NavigationControls';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'navigation.back': 'Back',
        'navigation.continue': 'Continue',
        'navigation.complete': 'Complete',
        'navigation.saving': 'Saving...',
      };
      return translations[key] ?? fallback ?? key;
    },
  }),
}));

describe('NavigationControls', () => {
  const defaultProps = {
    onBack: vi.fn(),
    onNext: vi.fn(),
    isFirstStep: false,
    showNavigation: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when showNavigation is true', () => {
      render(<NavigationControls {...defaultProps} />);

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should not render when showNavigation is false', () => {
      render(<NavigationControls {...defaultProps} showNavigation={false} />);

      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    });
  });

  describe('back button', () => {
    it('should render back button', () => {
      render(<NavigationControls {...defaultProps} />);

      expect(screen.getByTestId('assessment-back-button')).toBeInTheDocument();
    });

    it('should be disabled on first step', () => {
      render(<NavigationControls {...defaultProps} isFirstStep />);

      const backButton = screen.getByTestId('assessment-back-button');
      expect(backButton).toBeDisabled();
    });

    it('should be enabled when not first step', () => {
      render(<NavigationControls {...defaultProps} isFirstStep={false} />);

      const backButton = screen.getByTestId('assessment-back-button');
      expect(backButton).not.toBeDisabled();
    });

    it('should call onBack when clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(<NavigationControls {...defaultProps} onBack={onBack} />);
      await user.click(screen.getByTestId('assessment-back-button'));

      expect(onBack).toHaveBeenCalled();
    });

    it('should be disabled when saving', () => {
      render(<NavigationControls {...defaultProps} isSaving />);

      const backButton = screen.getByTestId('assessment-back-button');
      expect(backButton).toBeDisabled();
    });
  });

  describe('continue button', () => {
    it('should render continue button', () => {
      render(<NavigationControls {...defaultProps} />);

      expect(screen.getByTestId('assessment-continue-button')).toBeInTheDocument();
    });

    it('should call onNext when clicked', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      render(<NavigationControls {...defaultProps} onNext={onNext} />);
      await user.click(screen.getByTestId('assessment-continue-button'));

      expect(onNext).toHaveBeenCalled();
    });
  });

  describe('synthesis step', () => {
    it('should show Complete button on synthesis step', () => {
      const onComplete = vi.fn();

      render(
        <NavigationControls
          {...defaultProps}
          isSynthesis
          onComplete={onComplete}
        />
      );

      expect(screen.getByTestId('assessment-complete-button')).toBeInTheDocument();
      expect(screen.queryByTestId('assessment-continue-button')).not.toBeInTheDocument();
    });

    it('should call onComplete when complete button is clicked', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(
        <NavigationControls
          {...defaultProps}
          isSynthesis
          onComplete={onComplete}
        />
      );

      await user.click(screen.getByTestId('assessment-complete-button'));

      expect(onComplete).toHaveBeenCalled();
    });

    it('should fall back to onNext if onComplete not provided', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      render(
        <NavigationControls
          {...defaultProps}
          onNext={onNext}
          isSynthesis
        />
      );

      // Without onComplete, it uses onNext but still shows Complete text
      await user.click(screen.getByTestId('assessment-complete-button'));

      expect(onNext).toHaveBeenCalled();
    });
  });

  describe('saving state', () => {
    it('should show saving text when isSaving is true', () => {
      render(
        <NavigationControls
          {...defaultProps}
          isSynthesis
          onComplete={vi.fn()}
          isSaving
        />
      );

      expect(screen.getByTestId('assessment-complete-button')).toHaveTextContent('Saving...');
    });

    it('should disable primary button when saving', () => {
      render(
        <NavigationControls
          {...defaultProps}
          isSynthesis
          onComplete={vi.fn()}
          isSaving
        />
      );

      const saveButton = screen.getByTestId('assessment-complete-button');
      expect(saveButton).toBeDisabled();
    });

    it('should apply opacity style when saving', () => {
      render(
        <NavigationControls
          {...defaultProps}
          isSaving
        />
      );

      const continueButton = screen.getByTestId('assessment-continue-button');
      expect(continueButton).toHaveClass('opacity-70');
    });
  });

  describe('styling', () => {
    it('should render with sticky positioning', () => {
      const { container } = render(<NavigationControls {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('sticky', 'bottom-0');
    });

    it('should render continue button with accent background', () => {
      render(<NavigationControls {...defaultProps} />);

      const continueButton = screen.getByTestId('assessment-continue-button');
      expect(continueButton).toHaveClass('bg-[var(--accent)]');
    });
  });

  describe('validation error', () => {
    it('should display error message when validationError is provided', () => {
      render(
        <NavigationControls
          {...defaultProps}
          validationError="Please complete this step"
        />
      );

      expect(screen.getByText('Please complete this step')).toBeInTheDocument();
    });

    it('should not display error message when validationError is null', () => {
      render(
        <NavigationControls
          {...defaultProps}
          validationError={null}
        />
      );

      expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
    });

    it('should not display error message when validationError is undefined', () => {
      render(<NavigationControls {...defaultProps} />);

      expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
    });

    it('should have role="alert" for accessibility', () => {
      render(
        <NavigationControls
          {...defaultProps}
          validationError="Please complete this step"
        />
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    it('should have data-testid for E2E testing', () => {
      render(
        <NavigationControls
          {...defaultProps}
          validationError="Please complete this step"
        />
      );

      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
    });

    it('should render error with proper styling', () => {
      render(
        <NavigationControls
          {...defaultProps}
          validationError="Please complete this step"
        />
      );

      const errorText = screen.getByText('Please complete this step');
      expect(errorText).toHaveClass('text-[var(--error)]');
    });
  });
});
