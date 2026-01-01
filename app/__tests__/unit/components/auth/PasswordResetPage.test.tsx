/**
 * @file app/__tests__/unit/components/auth/PasswordResetPage.test.tsx
 * @purpose Unit tests for PasswordResetPage component
 * @functionality
 * - Tests rendering form when token is present
 * - Tests showing error state when no token
 * - Tests navigation to login and landing pages
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - PasswordResetPage under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetPage from '@/components/auth/PasswordResetPage';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useRouting
const mockNavigate = vi.fn();
vi.mock('@/hooks', () => ({
  useRouting: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock AuthLayout
vi.mock('@/components/auth/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

// Mock PasswordResetConfirmForm
vi.mock('@/components/auth/forms', () => ({
  PasswordResetConfirmForm: ({ token, onNavigateToLogin }: { token: string; onNavigateToLogin: () => void }) => (
    <div data-testid="password-reset-form">
      <span data-testid="token-value">{token}</span>
      <button onClick={onNavigateToLogin} data-testid="to-login">To Login</button>
    </div>
  ),
}));

// Mock icons
vi.mock('@/components', () => ({
  ErrorCircleIcon: () => <span data-testid="error-icon" />,
}));

describe('PasswordResetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with token', () => {
    it('should render password reset form when token is provided', () => {
      render(<PasswordResetPage token="valid-token" />);

      expect(screen.getByTestId('password-reset-form')).toBeInTheDocument();
      expect(screen.getByTestId('token-value')).toHaveTextContent('valid-token');
    });

    it('should pass onNavigateToLogin callback to form', async () => {
      const user = userEvent.setup();
      render(<PasswordResetPage token="valid-token" />);

      await user.click(screen.getByTestId('to-login'));

      expect(mockNavigate).toHaveBeenCalledWith('auth', { authMode: 'login' });
    });
  });

  describe('without token', () => {
    it('should show error state when no token is provided', () => {
      render(<PasswordResetPage />);

      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
      expect(screen.getByText('resetPassword.invalidLink.title')).toBeInTheDocument();
      expect(screen.getByText('resetPassword.invalidLink.description')).toBeInTheDocument();
    });

    it('should navigate to login when sign in button is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordResetPage />);

      await user.click(screen.getByText('resetPassword.invalidLink.goToSignIn'));

      expect(mockNavigate).toHaveBeenCalledWith('auth', { authMode: 'login' });
    });

    it('should navigate to landing when back to home is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordResetPage />);

      await user.click(screen.getByText('resetPassword.invalidLink.backToHome'));

      expect(mockNavigate).toHaveBeenCalledWith('landing');
    });
  });
});
