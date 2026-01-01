/**
 * @file app/__tests__/unit/components/auth/EmailVerificationPage.test.tsx
 * @purpose Unit tests for EmailVerificationPage component
 * @functionality
 * - Tests loading state when token is present
 * - Tests success state after verification
 * - Tests error state on verification failure
 * - Tests no-token state
 * - Tests resend verification functionality
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - EmailVerificationPage under test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailVerificationPage from '@/components/auth/EmailVerificationPage';

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

// Mock stores
const mockSetUser = vi.fn();
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    setUser: mockSetUser,
  }),
}));

// Mock authService
const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();
vi.mock('@/services/api/AuthService', () => ({
  authService: {
    verifyEmail: (token: string) => mockVerifyEmail(token),
    resendVerification: () => mockResendVerification(),
  },
}));

// Mock AuthLayout
vi.mock('@/components/auth/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

// Mock icons
vi.mock('@/components', () => ({
  CheckIcon: () => <span data-testid="check-icon" />,
  LoadingSpinnerIcon: () => <span data-testid="loading-spinner" />,
  ErrorCircleIcon: () => <span data-testid="error-icon" />,
}));

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('no token state', () => {
    it('should show no-token state when no token is provided', () => {
      render(<EmailVerificationPage />);

      expect(screen.getByText('verifyEmail.noToken.title')).toBeInTheDocument();
      expect(screen.getByText('verifyEmail.noToken.description')).toBeInTheDocument();
    });

    it('should allow resending verification from no-token state', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({});

      render(<EmailVerificationPage />);
      await user.click(screen.getByText('verifyEmail.resend'));

      await waitFor(() => {
        expect(mockResendVerification).toHaveBeenCalled();
        expect(screen.getByText('verifyEmail.resent')).toBeInTheDocument();
      });
    });

    it('should navigate to landing from no-token state', async () => {
      const user = userEvent.setup();
      render(<EmailVerificationPage />);

      await user.click(screen.getByText('verifyEmail.backToHome'));

      expect(mockNavigate).toHaveBeenCalledWith('landing');
    });
  });

  describe('loading state', () => {
    it('should show loading state when token is provided', () => {
      mockVerifyEmail.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<EmailVerificationPage token="test-token" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('verifyEmail.loading.title')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('should show success state after verification', async () => {
      mockVerifyEmail.mockResolvedValue({ user: { id: 'user-1', emailVerified: true } });

      render(<EmailVerificationPage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        expect(screen.getByText('verifyEmail.success.title')).toBeInTheDocument();
      });
    });

    it('should update user in store on success', async () => {
      const mockUser = { id: 'user-1', emailVerified: true };
      mockVerifyEmail.mockResolvedValue({ user: mockUser });

      render(<EmailVerificationPage token="valid-token" />);

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should navigate to profile on success button click', async () => {
      const user = userEvent.setup();
      mockVerifyEmail.mockResolvedValue({ user: { id: 'user-1' } });

      render(<EmailVerificationPage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.success.goToProfile')).toBeInTheDocument();
      });

      await user.click(screen.getByText('verifyEmail.success.goToProfile'));

      expect(mockNavigate).toHaveBeenCalledWith('profile');
    });
  });

  describe('error state', () => {
    it('should show error state on verification failure', async () => {
      mockVerifyEmail.mockRejectedValue(new Error('Invalid token'));

      render(<EmailVerificationPage token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        expect(screen.getByText('verifyEmail.error.title')).toBeInTheDocument();
      });
    });

    it('should display error message from exception', async () => {
      mockVerifyEmail.mockRejectedValue(new Error('Token expired'));

      render(<EmailVerificationPage token="expired-token" />);

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument();
      });
    });

    it('should display default message for non-Error exceptions', async () => {
      mockVerifyEmail.mockRejectedValue('Something went wrong');

      render(<EmailVerificationPage token="bad-token" />);

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.error.defaultMessage')).toBeInTheDocument();
      });
    });

    it('should allow resending verification from error state', async () => {
      const user = userEvent.setup();
      mockVerifyEmail.mockRejectedValue(new Error('Invalid token'));
      mockResendVerification.mockResolvedValue({});

      render(<EmailVerificationPage token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.resend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('verifyEmail.resend'));

      await waitFor(() => {
        expect(mockResendVerification).toHaveBeenCalled();
        expect(screen.getByText('verifyEmail.resent')).toBeInTheDocument();
      });
    });

    it('should show resend error on failure', async () => {
      const user = userEvent.setup();
      mockVerifyEmail.mockRejectedValue(new Error('Invalid token'));
      mockResendVerification.mockRejectedValue(new Error('Rate limited'));

      render(<EmailVerificationPage token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.resend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('verifyEmail.resend'));

      await waitFor(() => {
        expect(screen.getByText('Rate limited')).toBeInTheDocument();
      });
    });

    it('should show default resend error for non-Error exceptions', async () => {
      const user = userEvent.setup();
      mockVerifyEmail.mockRejectedValue(new Error('Invalid token'));
      mockResendVerification.mockRejectedValue('Unknown error');

      render(<EmailVerificationPage token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.resend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('verifyEmail.resend'));

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.resendError')).toBeInTheDocument();
      });
    });

    it('should navigate to landing from error state', async () => {
      const user = userEvent.setup();
      mockVerifyEmail.mockRejectedValue(new Error('Invalid token'));

      render(<EmailVerificationPage token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.backToHome')).toBeInTheDocument();
      });

      await user.click(screen.getByText('verifyEmail.backToHome'));

      expect(mockNavigate).toHaveBeenCalledWith('landing');
    });
  });
});
