/**
 * @file app/__tests__/unit/components/shared/LanguageToggle.test.tsx
 * @purpose Unit tests for LanguageToggle component
 * @functionality
 * - Tests rendering of EN/PL buttons
 * - Tests language change on click
 * - Tests active language styling
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - LanguageToggle under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from '@/components/shared/LanguageToggle';

// Mock i18next
const mockChangeLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      get language() {
        return mockLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLanguage = 'en';
  });

  describe('rendering', () => {
    it('should render EN button', () => {
      render(<LanguageToggle />);

      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('should render PL button', () => {
      render(<LanguageToggle />);

      expect(screen.getByText('PL')).toBeInTheDocument();
    });

    it('should render divider between buttons', () => {
      render(<LanguageToggle />);

      expect(screen.getByText('|')).toBeInTheDocument();
    });
  });

  describe('language change', () => {
    it('should change language to English when EN is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageToggle />);

      await user.click(screen.getByText('EN'));

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should change language to Polish when PL is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageToggle />);

      await user.click(screen.getByText('PL'));

      expect(mockChangeLanguage).toHaveBeenCalledWith('pl');
    });
  });

  describe('active state styling', () => {
    it('should highlight EN when English is active', () => {
      mockLanguage = 'en';
      render(<LanguageToggle />);

      const enButton = screen.getByText('EN');
      expect(enButton).toHaveClass('text-[var(--text-primary)]');
    });

    it('should highlight PL when Polish is active', () => {
      mockLanguage = 'pl';
      render(<LanguageToggle />);

      const plButton = screen.getByText('PL');
      expect(plButton).toHaveClass('text-[var(--text-primary)]');
    });

    it('should dim inactive language button', () => {
      mockLanguage = 'en';
      render(<LanguageToggle />);

      const plButton = screen.getByText('PL');
      expect(plButton).toHaveClass('text-[var(--text-faint)]');
    });
  });
});
