/**
 * @file app/__tests__/unit/components/assessment/AssessmentHeader.test.tsx
 * @purpose Unit tests for AssessmentHeader component
 * @functionality
 * - Tests button rendering in readonly vs edit mode
 * - Tests Skip to Last button disabled states
 * - Tests button click handlers
 * - Tests View Only badge display
 * - Tests DateBadge rendering
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - AssessmentHeader under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssessmentHeader from '@/components/assessment/AssessmentHeader';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'assessment:navigation.skipToLast': 'Skip to Last',
        'assessment:navigation.retakeAssessment': 'Retake',
        'assessment:navigation.import': 'Import',
        'header:viewOnly.badge': 'VIEW ONLY',
        'header:viewOnly.savedAssessment': 'Saved Assessment',
        'header:buttons.exportAssessment': 'Export Assessment',
        'header:buttons.export': 'Export',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock DateBadge component
vi.mock('@/components', () => ({
  DateBadge: ({ date }: { date: string }) => (
    <span data-testid="date-badge">{date}</span>
  ),
  DownloadIcon: () => <span data-testid="download-icon">↓</span>,
  UploadIcon: () => <span data-testid="upload-icon">↑</span>,
}));

describe('AssessmentHeader', () => {
  const defaultProps = {
    isReadOnly: false,
    currentPhase: 0,
    currentStep: 0,
    lastReachedPhase: 0,
    lastReachedStep: 0,
    onSkipToLast: vi.fn(),
    onRetake: vi.fn(),
    onImport: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('in-progress mode (not readonly)', () => {
    it('should render Skip to Last and Import buttons', () => {
      render(<AssessmentHeader {...defaultProps} />);

      expect(screen.getByTestId('assessment-btn-skip-to-last')).toBeInTheDocument();
      expect(screen.getByTestId('import-btn-assessment')).toBeInTheDocument();
    });

    it('should NOT render Export and Retake buttons', () => {
      render(<AssessmentHeader {...defaultProps} />);

      expect(screen.queryByTestId('export-btn-assessment')).not.toBeInTheDocument();
      expect(screen.queryByTestId('assessment-btn-retake')).not.toBeInTheDocument();
    });

    it('should NOT render View Only badge', () => {
      render(<AssessmentHeader {...defaultProps} />);

      expect(screen.queryByTestId('view-only-badge')).not.toBeInTheDocument();
    });

    it('should call onImport when Import button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssessmentHeader {...defaultProps} />);

      await user.click(screen.getByTestId('import-btn-assessment'));

      expect(defaultProps.onImport).toHaveBeenCalledTimes(1);
    });

    it('should call onSkipToLast when Skip to Last button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AssessmentHeader
          {...defaultProps}
          lastReachedPhase={2}
          lastReachedStep={3}
        />
      );

      await user.click(screen.getByTestId('assessment-btn-skip-to-last'));

      expect(defaultProps.onSkipToLast).toHaveBeenCalledTimes(1);
    });
  });

  describe('Skip to Last button disabled state', () => {
    it('should be disabled when at last reached position', () => {
      render(
        <AssessmentHeader
          {...defaultProps}
          currentPhase={2}
          currentStep={3}
          lastReachedPhase={2}
          lastReachedStep={3}
        />
      );

      expect(screen.getByTestId('assessment-btn-skip-to-last')).toBeDisabled();
    });

    it('should be enabled when not at last reached position', () => {
      render(
        <AssessmentHeader
          {...defaultProps}
          currentPhase={0}
          currentStep={0}
          lastReachedPhase={2}
          lastReachedStep={3}
        />
      );

      expect(screen.getByTestId('assessment-btn-skip-to-last')).not.toBeDisabled();
    });

    it('should be disabled in readonly mode', () => {
      render(
        <AssessmentHeader
          {...defaultProps}
          isReadOnly={true}
          createdAt="2024-01-15T10:30:00.000Z"
        />
      );

      expect(screen.getByTestId('assessment-btn-skip-to-last')).toBeDisabled();
    });
  });

  describe('readonly mode', () => {
    const readOnlyProps = {
      ...defaultProps,
      isReadOnly: true,
      createdAt: '2024-01-15T10:30:00.000Z',
    };

    it('should render View Only badge', () => {
      render(<AssessmentHeader {...readOnlyProps} />);

      expect(screen.getByTestId('view-only-badge')).toBeInTheDocument();
      expect(screen.getByText('VIEW ONLY')).toBeInTheDocument();
    });

    it('should render DateBadge with createdAt', () => {
      render(<AssessmentHeader {...readOnlyProps} />);

      expect(screen.getByTestId('date-badge')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15T10:30:00.000Z')).toBeInTheDocument();
    });

    it('should render Export and Retake buttons', () => {
      render(<AssessmentHeader {...readOnlyProps} />);

      expect(screen.getByTestId('export-btn-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('assessment-btn-retake')).toBeInTheDocument();
    });

    it('should NOT render Import button', () => {
      render(<AssessmentHeader {...readOnlyProps} />);

      expect(screen.queryByTestId('import-btn-assessment')).not.toBeInTheDocument();
    });

    it('should call onExport when Export button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssessmentHeader {...readOnlyProps} />);

      await user.click(screen.getByTestId('export-btn-assessment'));

      expect(defaultProps.onExport).toHaveBeenCalledTimes(1);
    });

    it('should call onRetake when Retake button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssessmentHeader {...readOnlyProps} />);

      await user.click(screen.getByTestId('assessment-btn-retake'));

      expect(defaultProps.onRetake).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have correct data-testid on header container', () => {
      render(<AssessmentHeader {...defaultProps} />);

      expect(screen.getByTestId('assessment-header')).toBeInTheDocument();
    });
  });
});
