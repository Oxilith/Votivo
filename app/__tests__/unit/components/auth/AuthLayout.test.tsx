/**
 * @file app/__tests__/unit/components/auth/AuthLayout.test.tsx
 * @purpose Unit tests for AuthLayout component
 * @functionality
 * - Tests rendering of children content
 * - Tests header with logo and brand
 * - Tests language toggle functionality
 * - Tests theme toggle functionality
 * - Tests navigation to landing
 * - Tests max width variants
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - AuthLayout under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthLayout from '@/components/auth/AuthLayout';

// Mock i18next
const mockChangeLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() {
        return mockLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

// Mock hooks
const mockNavigate = vi.fn();
const mockToggleTheme = vi.fn();
let mockIsDark = false;

vi.mock('@/hooks', () => ({
  useThemeContext: () => ({
    isDark: mockIsDark,
    toggleTheme: mockToggleTheme,
  }),
  useRouting: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock components
vi.mock('@/components', () => ({
  VotiveLogo: () => <div data-testid="votive-logo" />,
  InkBrushDecoration: () => <div data-testid="ink-brush" />,
  SunIcon: () => <span data-testid="sun-icon" />,
  MoonIcon: () => <span data-testid="moon-icon" />,
}));

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLanguage = 'en';
    mockIsDark = false;
  });

  describe('rendering', () => {
    it('should render children content', () => {
      render(
        <AuthLayout>
          <div data-testid="child-content">Test Content</div>
        </AuthLayout>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render logo', () => {
      render(<AuthLayout><div>Content</div></AuthLayout>);

      expect(screen.getByTestId('votive-logo')).toBeInTheDocument();
    });

    it('should render brand name', () => {
      render(<AuthLayout><div>Content</div></AuthLayout>);

      expect(screen.getByText('Votive')).toBeInTheDocument();
    });

    it('should render ink brush decoration', () => {
      render(<AuthLayout><div>Content</div></AuthLayout>);

      expect(screen.getByTestId('ink-brush')).toBeInTheDocument();
    });
  });

  describe('language toggle', () => {
    it('should render language toggle buttons', () => {
      render(<AuthLayout><div>Content</div></AuthLayout>);

      expect(screen.getByText('EN')).toBeInTheDocument();
      expect(screen.getByText('PL')).toBeInTheDocument();
    });

    it('should change language to English when EN is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthLayout><div>Content</div></AuthLayout>);

      await user.click(screen.getByText('EN'));

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should change language to Polish when PL is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthLayout><div>Content</div></AuthLayout>);

      await user.click(screen.getByText('PL'));

      expect(mockChangeLanguage).toHaveBeenCalledWith('pl');
    });
  });

  describe('theme toggle', () => {
    it('should render theme toggle button', () => {
      render(<AuthLayout><div>Content</div></AuthLayout>);

      const themeButton = screen.getByLabelText('Switch to dark mode');
      expect(themeButton).toBeInTheDocument();
    });

    it('should show moon icon in light mode', () => {
      mockIsDark = false;
      render(<AuthLayout><div>Content</div></AuthLayout>);

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('should show sun icon in dark mode', () => {
      mockIsDark = true;
      render(<AuthLayout><div>Content</div></AuthLayout>);

      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });

    it('should toggle theme when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthLayout><div>Content</div></AuthLayout>);

      await user.click(screen.getByLabelText('Switch to dark mode'));

      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('should navigate to landing when logo is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthLayout><div>Content</div></AuthLayout>);

      // Click the button containing the logo and brand
      const logoButton = screen.getByRole('button', { name: /votive/i });
      await user.click(logoButton);

      expect(mockNavigate).toHaveBeenCalledWith('landing');
    });
  });

  describe('max width variants', () => {
    it('should apply sm max width class', () => {
      const { container } = render(
        <AuthLayout maxWidth="sm"><div>Content</div></AuthLayout>
      );

      expect(container.querySelector('.max-w-sm')).toBeInTheDocument();
    });

    it('should apply md max width class by default', () => {
      const { container } = render(
        <AuthLayout><div>Content</div></AuthLayout>
      );

      expect(container.querySelector('.max-w-md')).toBeInTheDocument();
    });

    it('should apply lg max width class', () => {
      const { container } = render(
        <AuthLayout maxWidth="lg"><div>Content</div></AuthLayout>
      );

      expect(container.querySelector('.max-w-lg')).toBeInTheDocument();
    });
  });
});
