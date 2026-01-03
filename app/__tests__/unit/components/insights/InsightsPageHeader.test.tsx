/**
 * @file app/__tests__/unit/components/insights/InsightsPageHeader.test.tsx
 * @purpose Unit tests for InsightsPageHeader component
 * @functionality
 * - Tests rendering with and without export callbacks
 * - Tests both export buttons (analysis and assessment)
 * - Tests click handlers for export buttons
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - InsightsPageHeader under test
 */

import { render, screen, fireEvent } from '@testing-library/react';
import InsightsPageHeader from '@/components/insights/InsightsPageHeader';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'viewOnly.badge': 'View Only',
        'viewOnly.savedAnalysis': 'Saved Analysis',
        'buttons.exportInsights': 'Export Insights',
        'buttons.export': 'Export',
        'buttons.exportAssessment': 'Export Assessment',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock components
vi.mock('@/components', () => ({
  DateBadge: ({ date }: { date: string }) => (
    <span data-testid="date-badge">{date}</span>
  ),
  DownloadIcon: ({ size }: { size: string }) => (
    <span data-testid={`download-icon-${size}`}>↓</span>
  ),
  ExportDropdown: ({ onExportAssessment, onExportAnalysis }: {
    onExportAssessment?: () => void;
    onExportAnalysis?: () => void;
  }) => (
    <div data-testid="export-dropdown">
      {onExportAnalysis && (
        <button data-testid="export-analysis-btn" onClick={onExportAnalysis}>
          Export Insights
        </button>
      )}
      {onExportAssessment && (
        <button data-testid="export-assessment-btn" onClick={onExportAssessment}>
          Export Assessment
        </button>
      )}
    </div>
  ),
}));

describe('InsightsPageHeader', () => {
  const mockExportAnalysis = vi.fn();
  const mockExportAssessment = vi.fn();

  beforeEach(() => {
    mockExportAnalysis.mockClear();
    mockExportAssessment.mockClear();
  });

  describe('rendering', () => {
    it('should render view only badge when isReadOnly', () => {
      render(<InsightsPageHeader isReadOnly createdAt="2024-01-15T10:30:00Z" />);

      expect(screen.getByText('View Only')).toBeInTheDocument();
    });

    it('should render saved analysis title when isReadOnly', () => {
      render(<InsightsPageHeader isReadOnly createdAt="2024-01-15T10:30:00Z" />);

      expect(screen.getByText('Saved Analysis')).toBeInTheDocument();
    });

    it('should render date badge with createdAt when isReadOnly', () => {
      render(<InsightsPageHeader isReadOnly createdAt="2024-01-15T10:30:00Z" />);

      expect(screen.getByTestId('date-badge')).toHaveTextContent('2024-01-15T10:30:00Z');
    });

    it('should not render badges when not in readonly mode', () => {
      render(<InsightsPageHeader createdAt="2024-01-15T10:30:00Z" />);

      expect(screen.queryByText('View Only')).not.toBeInTheDocument();
      expect(screen.queryByTestId('date-badge')).not.toBeInTheDocument();
    });
  });

  describe('export buttons', () => {
    it('should not render export buttons when no callbacks provided', () => {
      render(<InsightsPageHeader createdAt="2024-01-15T10:30:00Z" />);

      expect(screen.queryByText('Export Insights')).not.toBeInTheDocument();
      expect(screen.queryByText('Export Assessment')).not.toBeInTheDocument();
    });

    it('should render export analysis button when callback provided', () => {
      render(
        <InsightsPageHeader
          createdAt="2024-01-15T10:30:00Z"
          onExportAnalysis={mockExportAnalysis}
        />
      );

      expect(screen.getByText('Export Insights')).toBeInTheDocument();
    });

    it('should render export assessment button when callback provided', () => {
      render(
        <InsightsPageHeader
          createdAt="2024-01-15T10:30:00Z"
          onExportAssessment={mockExportAssessment}
        />
      );

      expect(screen.getByText('Export Assessment')).toBeInTheDocument();
    });

    it('should render both export buttons when both callbacks provided', () => {
      render(
        <InsightsPageHeader
          createdAt="2024-01-15T10:30:00Z"
          onExportAnalysis={mockExportAnalysis}
          onExportAssessment={mockExportAssessment}
        />
      );

      expect(screen.getByText('Export Insights')).toBeInTheDocument();
      expect(screen.getByText('Export Assessment')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onExportAnalysis when analysis export button clicked', () => {
      render(
        <InsightsPageHeader
          createdAt="2024-01-15T10:30:00Z"
          onExportAnalysis={mockExportAnalysis}
        />
      );

      fireEvent.click(screen.getByTestId('export-analysis-btn'));

      expect(mockExportAnalysis).toHaveBeenCalledTimes(1);
    });

    it('should call onExportAssessment when assessment export button clicked', () => {
      render(
        <InsightsPageHeader
          createdAt="2024-01-15T10:30:00Z"
          onExportAssessment={mockExportAssessment}
        />
      );

      fireEvent.click(screen.getByTestId('export-assessment-btn'));

      expect(mockExportAssessment).toHaveBeenCalledTimes(1);
    });
  });
});
