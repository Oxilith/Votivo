/**
 * @file app/__tests__/unit/components/assessment/navigation/AssessmentProgress.test.tsx
 * @purpose Unit tests for AssessmentProgress component
 * @functionality
 * - Tests phase title and subtitle display
 * - Tests step progress display
 * - Tests progress bar width calculation
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - AssessmentProgress under test
 */

import { render, screen } from '@testing-library/react';
import { AssessmentProgress } from '@/components/assessment/navigation/AssessmentProgress';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { current: number; total: number }) => {
      if (key === 'progress.stepOf' && params) {
        return `Step ${String(params.current)} of ${String(params.total)}`;
      }
      return key;
    },
  }),
}));

describe('AssessmentProgress', () => {
  const defaultProps = {
    phaseTitle: 'Phase 1',
    phaseSubtitle: 'State Awareness',
    currentStep: 5,
    totalSteps: 20,
  };

  describe('phase information', () => {
    it('should display phase title', () => {
      render(<AssessmentProgress {...defaultProps} />);

      expect(screen.getByText('Phase 1')).toBeInTheDocument();
    });

    it('should display phase subtitle', () => {
      render(<AssessmentProgress {...defaultProps} />);

      expect(screen.getByText('State Awareness')).toBeInTheDocument();
    });
  });

  describe('step progress', () => {
    it('should display current step of total', () => {
      render(<AssessmentProgress {...defaultProps} />);

      expect(screen.getByText('Step 5 of 20')).toBeInTheDocument();
    });

    it('should update step display when props change', () => {
      const { rerender } = render(<AssessmentProgress {...defaultProps} />);

      expect(screen.getByText('Step 5 of 20')).toBeInTheDocument();

      rerender(<AssessmentProgress {...defaultProps} currentStep={10} />);

      expect(screen.getByText('Step 10 of 20')).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('should render progress bar with correct width percentage', () => {
      const { container } = render(<AssessmentProgress {...defaultProps} />);

      // 5/20 = 25%
      const progressBar = container.querySelector('.bg-\\[var\\(--accent\\)\\].transition-all');
      expect(progressBar?.getAttribute('style')).toContain('width: 25%');
    });

    it('should calculate 0% for first step', () => {
      const { container } = render(
        <AssessmentProgress {...defaultProps} currentStep={0} />
      );

      const progressBar = container.querySelector('.bg-\\[var\\(--accent\\)\\].transition-all');
      expect(progressBar?.getAttribute('style')).toContain('width: 0%');
    });

    it('should calculate 100% for last step', () => {
      const { container } = render(
        <AssessmentProgress {...defaultProps} currentStep={20} totalSteps={20} />
      );

      const progressBar = container.querySelector('.bg-\\[var\\(--accent\\)\\].transition-all');
      expect(progressBar?.getAttribute('style')).toContain('width: 100%');
    });

    it('should calculate 50% for midpoint', () => {
      const { container } = render(
        <AssessmentProgress {...defaultProps} currentStep={10} totalSteps={20} />
      );

      const progressBar = container.querySelector('.bg-\\[var\\(--accent\\)\\].transition-all');
      expect(progressBar?.getAttribute('style')).toContain('width: 50%');
    });
  });

  describe('styling', () => {
    it('should have sticky positioning', () => {
      const { container } = render(<AssessmentProgress {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('sticky');
    });

    it('should have backdrop blur for visual hierarchy', () => {
      const { container } = render(<AssessmentProgress {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('backdrop-blur-sm');
    });

    it('should render accent bar before phase title', () => {
      const { container } = render(<AssessmentProgress {...defaultProps} />);

      const accentBar = container.querySelector('.bg-\\[var\\(--accent\\)\\]');
      expect(accentBar).toBeInTheDocument();
    });
  });
});
