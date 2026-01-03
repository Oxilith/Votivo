/**
 * @file app/__tests__/unit/components/assessment/SavePromptModal.test.tsx
 * @purpose Unit tests for SavePromptModal component
 * @functionality
 * - Tests modal visibility (open/closed states)
 * - Tests sign in button action
 * - Tests create account button action
 * - Tests dismiss button action
 * - Tests backdrop click dismissal
 * - Tests benefits list rendering
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - SavePromptModal under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import SavePromptModal from '@/components/assessment/SavePromptModal';

// Mock the CheckIcon component
vi.mock('@/components', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <span data-testid="check-icon" className={className}>✓</span>
  ),
}));

describe('SavePromptModal', () => {
  const mockOnSignIn = vi.fn();
  const mockOnCreateAccount = vi.fn();
  const mockOnDismiss = vi.fn();

  const defaultProps = {
    isOpen: true,
    onSignIn: mockOnSignIn,
    onCreateAccount: mockOnCreateAccount,
    onDismiss: mockOnDismiss,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render modal when isOpen is true', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByTestId('save-prompt-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<SavePromptModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('save-prompt-modal')).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('should display modal title', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByText('Ready to Unlock Your Insights?')).toBeInTheDocument();
    });

    it('should display description', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(
        screen.getByText(/Sign in to save your assessment and get AI-powered analysis/)
      ).toBeInTheDocument();
    });

    it('should display all benefits', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByText('Unlock AI-powered behavioral analysis')).toBeInTheDocument();
      expect(screen.getByText('Discover your hidden patterns and blind spots')).toBeInTheDocument();
      expect(screen.getByText('Save your assessment permanently')).toBeInTheDocument();
      expect(screen.getByText('Track your progress over time')).toBeInTheDocument();
    });

    it('should render check icons for each benefit', () => {
      render(<SavePromptModal {...defaultProps} />);

      const checkIcons = screen.getAllByTestId('check-icon');
      expect(checkIcons).toHaveLength(4);
    });
  });

  describe('actions', () => {
    it('should display create account button', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByTestId('save-prompt-create-account')).toBeInTheDocument();
      expect(screen.getByText('Create Free Account')).toBeInTheDocument();
    });

    it('should display sign in button', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByTestId('save-prompt-sign-in')).toBeInTheDocument();
      expect(screen.getByText('Sign In to Existing Account')).toBeInTheDocument();
    });

    it('should display dismiss button', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByTestId('save-prompt-dismiss')).toBeInTheDocument();
      expect(screen.getByText('View synthesis without saving')).toBeInTheDocument();
    });

    it('should call onCreateAccount when create account button is clicked', () => {
      render(<SavePromptModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('save-prompt-create-account'));

      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
    });

    it('should call onSignIn when sign in button is clicked', () => {
      render(<SavePromptModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('save-prompt-sign-in'));

      expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      render(<SavePromptModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('save-prompt-dismiss'));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('backdrop', () => {
    it('should render backdrop', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByTestId('save-prompt-backdrop')).toBeInTheDocument();
    });

    it('should call onDismiss when backdrop is clicked', () => {
      render(<SavePromptModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('save-prompt-backdrop'));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have aria-hidden on backdrop', () => {
      render(<SavePromptModal {...defaultProps} />);

      expect(screen.getByTestId('save-prompt-backdrop')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('styling', () => {
    it('should have fixed positioning for modal overlay', () => {
      render(<SavePromptModal {...defaultProps} />);

      const modal = screen.getByTestId('save-prompt-modal');
      expect(modal).toHaveClass('fixed', 'inset-0');
    });

    it('should have backdrop blur on backdrop', () => {
      render(<SavePromptModal {...defaultProps} />);

      const backdrop = screen.getByTestId('save-prompt-backdrop');
      expect(backdrop).toHaveClass('backdrop-blur-sm');
    });
  });
});
