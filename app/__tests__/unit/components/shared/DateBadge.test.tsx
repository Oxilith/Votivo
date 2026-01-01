/**
 * @file app/__tests__/unit/components/shared/DateBadge.test.tsx
 * @purpose Unit tests for DateBadge component
 * @functionality
 * - Tests date formatting for English locale
 * - Tests date formatting for Polish locale
 * - Tests custom label key
 * - Tests custom className
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - DateBadge under test
 */

import { render, screen } from '@testing-library/react';
import DateBadge from '@/components/shared/DateBadge';

// Mock i18next
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() {
        return mockLanguage;
      },
    },
  }),
}));

describe('DateBadge', () => {
  beforeEach(() => {
    mockLanguage = 'en';
  });

  describe('rendering', () => {
    it('should render the label', () => {
      render(<DateBadge date="2024-01-15T10:30:00Z" />);

      expect(screen.getByText('createdAt')).toBeInTheDocument();
    });

    it('should render the formatted date', () => {
      render(<DateBadge date="2024-01-15T10:30:00Z" />);

      // Date should be formatted according to locale
      const dateElement = screen.getByText(/2024/);
      expect(dateElement).toBeInTheDocument();
    });

    it('should use custom label key', () => {
      render(<DateBadge date="2024-01-15T10:30:00Z" labelKey="updatedAt" />);

      expect(screen.getByText('updatedAt')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DateBadge date="2024-01-15T10:30:00Z" className="custom-class" />
      );

      const badge = container.firstChild;
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('date formatting', () => {
    it('should format date in English locale', () => {
      mockLanguage = 'en';
      render(<DateBadge date="2024-01-15T10:30:00Z" />);

      // Should use en-GB format (day month year)
      const dateElement = screen.getByText(/15.*Jan.*2024/i);
      expect(dateElement).toBeInTheDocument();
    });

    it('should format date in Polish locale', () => {
      mockLanguage = 'pl';
      render(<DateBadge date="2024-01-15T10:30:00Z" />);

      // Should use pl-PL format (15 sty 2024 or similar)
      const dateElement = screen.getByText(/15.*2024/i);
      expect(dateElement).toBeInTheDocument();
    });

    it('should include time in formatted date', () => {
      render(<DateBadge date="2024-01-15T10:30:00Z" />);

      // Time component should be present
      const container = screen.getByText('createdAt').parentElement;
      expect(container?.textContent).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('styling', () => {
    it('should render with expected structure', () => {
      const { container } = render(<DateBadge date="2024-01-15T10:30:00Z" />);

      const badge = container.firstChild;
      expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-2');
    });

    it('should render label with monospace font', () => {
      render(<DateBadge date="2024-01-15T10:30:00Z" />);

      const label = screen.getByText('createdAt');
      expect(label).toHaveClass('font-mono');
    });
  });
});
