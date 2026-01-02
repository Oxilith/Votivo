/**
 * @file app/__tests__/unit/components/shared/PendingChangesAlert.test.tsx
 * @purpose Unit tests for PendingChangesAlert component
 * @functionality
 * - Tests default message and button text from translations
 * - Tests custom message and button text overrides
 * - Tests click handler callback
 * - Tests data-testid attributes
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - PendingChangesAlert under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import PendingChangesAlert from '@/components/shared/PendingChangesAlert';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

describe('PendingChangesAlert', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('rendering', () => {
    it('should render with default message from translation', () => {
      render(<PendingChangesAlert onNavigateToAssessment={mockNavigate} />);

      expect(
        screen.getByText(
          'You have pending changes in your assessment. Complete the assessment to save and enable new analysis.'
        )
      ).toBeInTheDocument();
    });

    it('should render with default button text from translation', () => {
      render(<PendingChangesAlert onNavigateToAssessment={mockNavigate} />);

      expect(screen.getByRole('button', { name: 'Complete Assessment' })).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(
        <PendingChangesAlert
          onNavigateToAssessment={mockNavigate}
          message="Custom warning message"
        />
      );

      expect(screen.getByText('Custom warning message')).toBeInTheDocument();
    });

    it('should render with custom button text', () => {
      render(
        <PendingChangesAlert
          onNavigateToAssessment={mockNavigate}
          buttonText="Go to Assessment"
        />
      );

      expect(screen.getByRole('button', { name: 'Go to Assessment' })).toBeInTheDocument();
    });

    it('should render alert role for accessibility', () => {
      render(<PendingChangesAlert onNavigateToAssessment={mockNavigate} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onNavigateToAssessment when button is clicked', () => {
      render(<PendingChangesAlert onNavigateToAssessment={mockNavigate} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('data-testid', () => {
    it('should use default data-testid', () => {
      render(<PendingChangesAlert onNavigateToAssessment={mockNavigate} />);

      expect(screen.getByTestId('pending-changes-alert')).toBeInTheDocument();
      expect(screen.getByTestId('pending-changes-alert-message')).toBeInTheDocument();
      expect(screen.getByTestId('pending-changes-alert-action')).toBeInTheDocument();
    });

    it('should use custom data-testid', () => {
      render(
        <PendingChangesAlert
          onNavigateToAssessment={mockNavigate}
          data-testid="custom-alert"
        />
      );

      expect(screen.getByTestId('custom-alert')).toBeInTheDocument();
      expect(screen.getByTestId('custom-alert-message')).toBeInTheDocument();
      expect(screen.getByTestId('custom-alert-action')).toBeInTheDocument();
    });
  });
});
