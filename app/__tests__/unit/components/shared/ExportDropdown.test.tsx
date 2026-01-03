/**
 * @file app/__tests__/unit/components/shared/ExportDropdown.test.tsx
 * @purpose Unit tests for ExportDropdown component
 * @functionality
 * - Tests dropdown visibility based on export options
 * - Tests toggle and close behavior
 * - Tests export callback invocations
 * - Tests outside click to close
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - ExportDropdown under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportDropdown from '@/components/shared/ExportDropdown';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'buttons.export': 'Export',
        'buttons.exportAssessment': 'Export Assessment',
        'buttons.exportInsights': 'Export Insights',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock icons
vi.mock('@/components/shared/icons', () => ({
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <span data-testid="chevron-icon" className={className}>▼</span>
  ),
  DownloadIcon: () => <span data-testid="download-icon">↓</span>,
}));

describe('ExportDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when no export options provided', () => {
      const { container } = render(<ExportDropdown />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when onExportAssessment is provided', () => {
      render(<ExportDropdown onExportAssessment={vi.fn()} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render when onExportAnalysis is provided', () => {
      render(<ExportDropdown onExportAnalysis={vi.fn()} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render download icon', () => {
      render(<ExportDropdown onExportAssessment={vi.fn()} />);
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('should render chevron icon', () => {
      render(<ExportDropdown onExportAssessment={vi.fn()} />);
      expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportDropdown onExportAssessment={vi.fn()} />);

      await user.click(screen.getByTestId('export-dropdown-trigger'));

      expect(screen.getByTestId('export-btn-assessment')).toBeInTheDocument();
    });

    it('should close dropdown when button is clicked again', async () => {
      const user = userEvent.setup();
      render(<ExportDropdown onExportAssessment={vi.fn()} />);

      await user.click(screen.getByTestId('export-dropdown-trigger'));
      expect(screen.getByTestId('export-btn-assessment')).toBeInTheDocument();

      await user.click(screen.getByTestId('export-dropdown-trigger'));
      expect(screen.queryByTestId('export-btn-assessment')).not.toBeInTheDocument();
    });

    it('should set aria-expanded to true when open', async () => {
      const user = userEvent.setup();
      render(<ExportDropdown onExportAssessment={vi.fn()} />);

      const button = screen.getByRole('button', { name: /export/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should rotate chevron when dropdown is open', async () => {
      const user = userEvent.setup();
      render(<ExportDropdown onExportAssessment={vi.fn()} />);

      const chevron = screen.getByTestId('chevron-icon');
      expect(chevron).not.toHaveClass('rotate-180');

      await user.click(screen.getByTestId('export-dropdown-trigger'));
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('export options', () => {
    it('should show only assessment option when only onExportAssessment provided', async () => {
      const user = userEvent.setup();
      render(<ExportDropdown onExportAssessment={vi.fn()} />);

      await user.click(screen.getByTestId('export-dropdown-trigger'));

      expect(screen.getByTestId('export-btn-assessment')).toBeInTheDocument();
      expect(screen.queryByTestId('export-btn-analysis')).not.toBeInTheDocument();
    });

    it('should show only analysis option when only onExportAnalysis provided', async () => {
      const user = userEvent.setup();
      render(<ExportDropdown onExportAnalysis={vi.fn()} />);

      await user.click(screen.getByTestId('export-dropdown-trigger'));

      expect(screen.queryByTestId('export-btn-assessment')).not.toBeInTheDocument();
      expect(screen.getByTestId('export-btn-analysis')).toBeInTheDocument();
    });

    it('should show both options when both callbacks provided', async () => {
      const user = userEvent.setup();
      render(
        <ExportDropdown
          onExportAssessment={vi.fn()}
          onExportAnalysis={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('export-dropdown-trigger'));

      expect(screen.getByTestId('export-btn-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('export-btn-analysis')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('should call onExportAssessment and close when assessment option clicked', async () => {
      const user = userEvent.setup();
      const onExportAssessment = vi.fn();
      render(<ExportDropdown onExportAssessment={onExportAssessment} />);

      await user.click(screen.getByTestId('export-dropdown-trigger'));
      await user.click(screen.getByTestId('export-btn-assessment'));

      expect(onExportAssessment).toHaveBeenCalled();
      expect(screen.queryByTestId('export-btn-assessment')).not.toBeInTheDocument();
    });

    it('should call onExportAnalysis and close when analysis option clicked', async () => {
      const user = userEvent.setup();
      const onExportAnalysis = vi.fn();
      render(<ExportDropdown onExportAnalysis={onExportAnalysis} />);

      await user.click(screen.getByTestId('export-dropdown-trigger'));
      await user.click(screen.getByTestId('export-btn-analysis'));

      expect(onExportAnalysis).toHaveBeenCalled();
      expect(screen.queryByTestId('export-btn-analysis')).not.toBeInTheDocument();
    });
  });

  describe('outside click', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ExportDropdown onExportAssessment={vi.fn()} />
          <div data-testid="outside">Outside content</div>
        </div>
      );

      await user.click(screen.getByTestId('export-dropdown-trigger'));
      expect(screen.getByTestId('export-btn-assessment')).toBeInTheDocument();

      // Click outside the dropdown
      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(screen.queryByTestId('export-btn-assessment')).not.toBeInTheDocument();
    });
  });
});
