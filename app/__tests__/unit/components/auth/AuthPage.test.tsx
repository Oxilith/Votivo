/**
 * @file app/__tests__/unit/components/auth/AuthPage.test.tsx
 * @purpose Unit tests for AuthPage component
 * @functionality
 * - Tests mode switching between login, register, forgot-password
 * - Tests password reset request form submission
 * - Tests auth success callback handling
 * - Tests default navigation on success when no callback provided
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - AuthPage under test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '@/components/auth/AuthPage';

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

// Mock authService
const mockRequestPasswordReset = vi.fn();
vi.mock('@/services/api/AuthService', () => ({
  authService: {
    requestPasswordReset: (email: string) => mockRequestPasswordReset(email),
  },
}));

// Mock AuthLayout to simplify testing
vi.mock('@/components/auth/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

// Mock form components
vi.mock('@/components/auth/forms', () => ({
  LoginForm: ({
    onSwitchToRegister,
    onForgotPassword,
    onSuccess,
  }: {
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
    onSuccess: () => void;
  }) => (
    <div data-testid="login-form">
      <button onClick={onSwitchToRegister} data-testid="switch-to-register">
        Register
      </button>
      <button onClick={onForgotPassword} data-testid="forgot-password">
        Forgot Password
      </button>
      <button onClick={onSuccess} data-testid="login-success">
        Login Success
      </button>
    </div>
  ),
  RegisterForm: ({
    onSwitchToLogin,
    onSuccess,
  }: {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
  }) => (
    <div data-testid="register-form">
      <button onClick={onSwitchToLogin} data-testid="switch-to-login">
        Login
      </button>
      <button onClick={onSuccess} data-testid="register-success">
        Register Success
      </button>
    </div>
  ),
  FormInput: ({
    label,
    value,
    onChange,
    type,
  }: {
    label: string;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    type: string;
  }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${type}`}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  ),
  FormButton: ({
    children,
    isLoading,
  }: {
    children: React.ReactNode;
    isLoading?: boolean;
  }) => (
    <button type="submit" disabled={isLoading} data-testid="form-button">
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}));

// Mock MailIcon
vi.mock('@/components', () => ({
  MailIcon: () => <span data-testid="mail-icon" />,
}));

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mode switching', () => {
    it('should show login form by default', () => {
      render(<AuthPage />);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should show login form when initialMode is login', () => {
      render(<AuthPage initialMode="login" />);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should show register form when initialMode is register', () => {
      render(<AuthPage initialMode="register" />);
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should switch from login to register', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      await user.click(screen.getByTestId('switch-to-register'));

      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });

    it('should switch from register to login', async () => {
      const user = userEvent.setup();
      render(<AuthPage initialMode="register" />);

      await user.click(screen.getByTestId('switch-to-login'));

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
    });

    it('should switch to forgot password from login', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      await user.click(screen.getByTestId('forgot-password'));

      expect(screen.getByText('forgotPassword.title')).toBeInTheDocument();
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });
  });

  describe('auth success handling', () => {
    it('should call onAuthSuccess when login succeeds', async () => {
      const user = userEvent.setup();
      const onAuthSuccess = vi.fn();

      render(<AuthPage onAuthSuccess={onAuthSuccess} />);
      await user.click(screen.getByTestId('login-success'));

      expect(onAuthSuccess).toHaveBeenCalled();
    });

    it('should call onAuthSuccess when register succeeds', async () => {
      const user = userEvent.setup();
      const onAuthSuccess = vi.fn();

      render(<AuthPage initialMode="register" onAuthSuccess={onAuthSuccess} />);
      await user.click(screen.getByTestId('register-success'));

      expect(onAuthSuccess).toHaveBeenCalled();
    });

    it('should navigate to landing when no onAuthSuccess provided', async () => {
      const user = userEvent.setup();

      render(<AuthPage />);
      await user.click(screen.getByTestId('login-success'));

      expect(mockNavigate).toHaveBeenCalledWith('landing');
    });
  });

  describe('password reset form', () => {
    it('should render password reset form when mode is forgot-password', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      await user.click(screen.getByTestId('forgot-password'));

      expect(screen.getByText('forgotPassword.title')).toBeInTheDocument();
      expect(screen.getByText('forgotPassword.subtitle')).toBeInTheDocument();
    });

    it('should submit password reset request', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockResolvedValue({});

      render(<AuthPage initialMode="forgot-password" />);

      const emailInput = screen.getByTestId('input-email');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show success message after password reset request', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockResolvedValue({});

      render(<AuthPage initialMode="forgot-password" />);

      const emailInput = screen.getByTestId('input-email');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(screen.getByText('forgotPassword.success')).toBeInTheDocument();
        expect(screen.getByText('forgotPassword.successMessage')).toBeInTheDocument();
      });
    });

    it('should show success message even on request failure (prevent email enumeration)', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockRejectedValue(new Error('Failed'));

      render(<AuthPage initialMode="forgot-password" />);

      const emailInput = screen.getByTestId('input-email');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(screen.getByText('forgotPassword.success')).toBeInTheDocument();
      });
    });

    it('should go back to login from password reset success', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockResolvedValue({});

      render(<AuthPage initialMode="forgot-password" />);

      const emailInput = screen.getByTestId('input-email');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-btn-back')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('forgot-password-btn-back'));

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should go back to login from password reset form', async () => {
      const user = userEvent.setup();
      render(<AuthPage initialMode="forgot-password" />);

      await user.click(screen.getByTestId('forgot-password-btn-login'));

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });
});
