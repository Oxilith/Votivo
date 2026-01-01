/**
 * @file app/__tests__/unit/components/auth/PasswordResetConfirmForm.test.tsx
 * @purpose Unit tests for PasswordResetConfirmForm component
 * @functionality
 * - Tests form rendering
 * - Tests password validation
 * - Tests form submission
 * - Tests success state
 * - Tests error handling
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - PasswordResetConfirmForm under test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetConfirmForm from '@/components/auth/forms/PasswordResetConfirmForm';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock authService
const mockConfirmPasswordReset = vi.fn();
vi.mock('@/services/api/AuthService', () => ({
  authService: {
    confirmPasswordReset: (token: string, password: string) => mockConfirmPasswordReset(token, password),
  },
}));

// Mock CheckIcon
vi.mock('@/components', () => ({
  CheckIcon: () => <span data-testid="check-icon" />,
}));

// Mock form components
vi.mock('@/components/auth/forms/FormInput', () => ({
  default: ({ label, error, ...props }: { label: string; error?: string; type?: string; value: string; onChange: (e: { target: { value: string } }) => void }) => {
    // Create a simple ID from the label
    const id = label.replace(/\./g, '-');
    return (
      <div>
        <label>{label}</label>
        <input data-testid={`input-${id}`} {...props} aria-invalid={!!error} />
        {error && <span role="alert" data-testid={`error-${id}`}>{error}</span>}
      </div>
    );
  },
}));

vi.mock('@/components/auth/forms/FormButton', () => ({
  default: ({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) => (
    <button type="submit" disabled={isLoading} data-testid="submit-btn">
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}));

describe('PasswordResetConfirmForm', () => {
  const defaultProps = {
    token: 'valid-reset-token',
    onNavigateToLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render form title', () => {
      render(<PasswordResetConfirmForm {...defaultProps} />);
      expect(screen.getByText('resetPassword.title')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<PasswordResetConfirmForm {...defaultProps} />);
      expect(screen.getByText('resetPassword.subtitle')).toBeInTheDocument();
    });

    it('should render password field', () => {
      render(<PasswordResetConfirmForm {...defaultProps} />);
      expect(screen.getByText('resetPassword.password')).toBeInTheDocument();
    });

    it('should render confirm password field', () => {
      render(<PasswordResetConfirmForm {...defaultProps} />);
      expect(screen.getByText('resetPassword.confirmPassword')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<PasswordResetConfirmForm {...defaultProps} />);
      expect(screen.getByText('resetPassword.submit')).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<PasswordResetConfirmForm {...defaultProps} />);
      expect(screen.getByText('resetPassword.signIn')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should not call API when password is empty', async () => {
      const user = userEvent.setup();
      render(<PasswordResetConfirmForm {...defaultProps} />);

      await user.click(screen.getByTestId('submit-btn'));

      expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    });

    it('should not call API when password is too short', async () => {
      const user = userEvent.setup();
      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      await user.type(passwordInput, 'Short1');
      await user.click(screen.getByTestId('submit-btn'));

      expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    });

    it('should not call API when password does not meet complexity requirements', async () => {
      const user = userEvent.setup();
      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      await user.type(passwordInput, 'alllowercase1');
      await user.click(screen.getByTestId('submit-btn'));

      expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    });

    it('should not call API when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      const confirmInput = screen.getByTestId('input-resetPassword-confirmPassword');

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'DifferentPass123');
      await user.click(screen.getByTestId('submit-btn'));

      expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('should call confirmPasswordReset on valid submission', async () => {
      const user = userEvent.setup();
      mockConfirmPasswordReset.mockResolvedValue({});

      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      const confirmInput = screen.getByTestId('input-resetPassword-confirmPassword');

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'ValidPass123');
      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockConfirmPasswordReset).toHaveBeenCalledWith('valid-reset-token', 'ValidPass123');
      });
    });

    it('should show success state after successful reset', async () => {
      const user = userEvent.setup();
      mockConfirmPasswordReset.mockResolvedValue({});

      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      const confirmInput = screen.getByTestId('input-resetPassword-confirmPassword');

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'ValidPass123');
      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        expect(screen.getByText('resetPassword.success')).toBeInTheDocument();
        expect(screen.getByText('resetPassword.successMessage')).toBeInTheDocument();
      });
    });

    it('should call onNavigateToLogin from success state', async () => {
      const user = userEvent.setup();
      const onNavigateToLogin = vi.fn();
      mockConfirmPasswordReset.mockResolvedValue({});

      render(<PasswordResetConfirmForm {...defaultProps} onNavigateToLogin={onNavigateToLogin} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      const confirmInput = screen.getByTestId('input-resetPassword-confirmPassword');

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'ValidPass123');
      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByText('resetPassword.goToLogin')).toBeInTheDocument();
      });

      await user.click(screen.getByText('resetPassword.goToLogin'));

      expect(onNavigateToLogin).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should display API error message', async () => {
      const user = userEvent.setup();
      mockConfirmPasswordReset.mockRejectedValue(new Error('Token expired'));

      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      const confirmInput = screen.getByTestId('input-resetPassword-confirmPassword');

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'ValidPass123');
      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Token expired');
      });
    });

    it('should display generic error for non-Error exceptions', async () => {
      const user = userEvent.setup();
      mockConfirmPasswordReset.mockRejectedValue('Unknown error');

      render(<PasswordResetConfirmForm {...defaultProps} />);

      const passwordInput = screen.getByTestId('input-resetPassword-password');
      const confirmInput = screen.getByTestId('input-resetPassword-confirmPassword');

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'ValidPass123');
      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getAllByRole('alert')[0]).toHaveTextContent('errors.generic');
      });
    });
  });

  describe('navigation', () => {
    it('should call onNavigateToLogin when clicking sign in link', async () => {
      const user = userEvent.setup();
      const onNavigateToLogin = vi.fn();

      render(<PasswordResetConfirmForm {...defaultProps} onNavigateToLogin={onNavigateToLogin} />);

      await user.click(screen.getByText('resetPassword.signIn'));

      expect(onNavigateToLogin).toHaveBeenCalled();
    });
  });
});
